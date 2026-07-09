'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─── Inline streak upsert (mirror of the webhook helper, server-action context) ─
/**
 * Returns the ISO Monday of the week containing `dateStr` (YYYY-MM-DD).
 */
function getWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function createPendingReservation(formData: FormData) {
  const supabase = createAdminClient()

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

          if (res && res.estado_pago === 'pendiente' && res.expira_en && new Date(res.expira_en) < new Date()) {
            await supabase.from('reservations').delete().eq('id', rs.reservation_id);
            await supabase.from('session_spots').update({ status: 'available' }).eq('id', spot.id);
            spot.status = 'available';
          }
        }
      }
    }
  }

  const unavailableSpots = spotsData.filter((s: any) => s.status !== 'available');
  if (unavailableSpots.length > 0) {
    throw new Error('Lo sentimos, uno o más espacios ya fueron reservados.');
  }

  // 3. Check if this client has a free class available
  const { data: streakRow } = await supabase
    .from('streaks')
    .select('free_class_available')
    .eq('client_phone', clientPhone)
    .maybeSingle()

  const hasFreeClass = streakRow?.free_class_available === true

  // 4. Get session price and calculate total
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('price, session_date')
    .eq('id', sessionId)
    .single()

  const basePrice = sessionData?.price ?? 0
  // Apply free-class benefit: price = 0 for all spots in this booking
  const totalAmount = hasFreeClass ? 0 : basePrice * spotNumbers.length

  // 5. Insert pending reservation
  const expiraEn = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes from now

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      session_id: sessionId,
      client_name: clientName,
      client_phone: clientPhone,
      total_amount: totalAmount,
      status: 'pending',
      estado_pago: hasFreeClass ? 'aprobado' : 'pendiente',
      expira_en: expiraEn
    })
    .select('id')
    .single()

  if (resError || !reservation) {
    console.error('Error creating reservation:', resError)
    throw new Error('Failed to create reservation')
  }

  // 6. Insert reservation spots
  const reservationSpotsToInsert = spotsData.map((s: any) => ({
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

  // 7. If free class: confirm spots immediately, consume the benefit, and update streak
  if (hasFreeClass && sessionData?.session_date) {
    // Mark spots as reserved (bypass payment flow)
    for (const spot of spotsData) {
      await supabase
        .from('session_spots')
        .update({ status: 'reserved' })
        .eq('id', spot.id)
    }

    // Confirm the reservation
    await supabase
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', reservation.id)

    // Consume the free-class flag
    await supabase
      .from('streaks')
      .update({ free_class_available: false, updated_at: new Date().toISOString() })
      .eq('client_phone', clientPhone)

    // Update streak count for this free-class booking
    const { data: currentStreak } = await supabase
      .from('streaks')
      .select('classes_count, current_week_streak, longest_week_streak, last_reservation_week, free_classes_earned')
      .eq('client_phone', clientPhone)
      .maybeSingle()

    if (currentStreak && sessionData.session_date) {
      const weekStart = getWeekStart(sessionData.session_date)
      const newCount = currentStreak.classes_count + 1
      let newStreak = 1

      if (currentStreak.last_reservation_week) {
        if (currentStreak.last_reservation_week === weekStart) {
          newStreak = currentStreak.current_week_streak
        } else {
          const lastDate = new Date(`${currentStreak.last_reservation_week}T12:00:00Z`)
          const currDate = new Date(`${weekStart}T12:00:00Z`)
          const weeksDiff = Math.round(
            (currDate.getTime() - lastDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
          newStreak = weeksDiff === 1 ? currentStreak.current_week_streak + 1 : 1
        }
      }

      const newLongest = Math.max(currentStreak.longest_week_streak, newStreak)

      await supabase.from('streaks').update({
        classes_count: newCount,
        current_week_streak: newStreak,
        longest_week_streak: newLongest,
        last_reservation_week: weekStart,
        updated_at: new Date().toISOString(),
      }).eq('client_phone', clientPhone)
    }

    revalidatePath(`/reserva/${sessionId}`)
    // Redirect directly to confirmation (no payment needed)
    redirect(`/reserva/${sessionId}/confirmacion?reservaId=${reservation.id}&name=${encodeURIComponent(clientName)}&phone=${encodeURIComponent(clientPhone)}&spots=${spotsRaw}&freeClass=true`)
  }

  // Normal flow → redirect to payment page
  redirect(`/reserva/${sessionId}/pago?reservaId=${reservation.id}`)
}
