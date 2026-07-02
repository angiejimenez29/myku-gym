'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createPendingReservation(formData: FormData) {
  const supabase = await createClient()

  const sessionId = formData.get('sessionId') as string
  const spotsRaw = formData.get('spots') as string
  const clientName = formData.get('clientName') as string
  const clientPhone = formData.get('clientPhone') as string

  if (!sessionId || !spotsRaw || !clientName || !clientPhone) {
    throw new Error('Missing required fields')
  }

  const spotNumbers = spotsRaw.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s))

  if (spotNumbers.length === 0) {
    throw new Error('No valid spots provided')
  }

  // 1. Get the session spot IDs
  const { data: spotsData, error: spotsError } = await supabase
    .from('session_spots')
    .select('id, status, spot_number')
    .eq('session_id', sessionId)
    .in('spot_number', spotNumbers)

  if (spotsError || !spotsData || spotsData.length !== spotNumbers.length) {
    throw new Error('Spots not found')
  }

  // 2. Cleanup expired reservations for these spots passively
  for (const spot of spotsData) {
    if (spot.status !== 'available') {
      const { data: resSpots } = await supabase
        .from('reservation_spots')
        .select('reservation_id')
        .eq('spot_id', spot.id);
        
      if (resSpots && resSpots.length > 0) {
        for (const rs of resSpots) {
          const { data: res } = await supabase
            .from('reservations')
            .select('estado_pago, expira_en')
            .eq('id', rs.reservation_id)
            .single();
            
          if (res && res.estado_pago === 'pendiente' && new Date(res.expira_en) < new Date()) {
            // Delete the expired reservation, which cascades to reservation_spots
            // and we need to free the spot manually because refund_reservation does it, but we can just delete it
            await supabase.from('reservations').delete().eq('id', rs.reservation_id);
            await supabase.from('session_spots').update({ status: 'available' }).eq('id', spot.id);
            spot.status = 'available'; // update local reference
          }
        }
      }
    }
  }

  const unavailableSpots = spotsData.filter(s => s.status !== 'available');
  if (unavailableSpots.length > 0) {
     throw new Error('Lo sentimos, uno o más espacios ya fueron reservados.');
  }

  // 3. Get price and total
  const { data: sessionData } = await supabase.from('sessions').select('price').eq('id', sessionId).single();
  const price = sessionData?.price || 0;
  const totalAmount = price * spotNumbers.length;

  // 4. Insert pending reservation
  const expiraEn = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes from now

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      session_id: sessionId,
      client_name: clientName,
      client_phone: clientPhone,
      total_amount: totalAmount,
      status: 'pending',
      estado_pago: 'pendiente',
      expira_en: expiraEn
    })
    .select('id')
    .single()

  if (resError || !reservation) {
    console.error('Error creating reservation:', resError)
    throw new Error('Failed to create reservation')
  }

  // 5. Insert reservation spots
  const reservationSpotsToInsert = spotsData.map(s => ({
    reservation_id: reservation.id,
    spot_id: s.id
  }));

  const { error: spotsInsertError } = await supabase
    .from('reservation_spots')
    .insert(reservationSpotsToInsert);

  if (spotsInsertError) {
    await supabase.from('reservations').delete().eq('id', reservation.id);
    throw new Error('Lo sentimos, hubo un problema al reservar los espacios.');
  }

  // Redirect to payment page
  redirect(`/reserva/${sessionId}/pago?reservaId=${reservation.id}`);
}
