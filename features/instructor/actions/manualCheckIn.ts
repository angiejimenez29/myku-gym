'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function manualCheckIn(sessionId: string, spotNumber: number, formData: FormData) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const clientName = formData.get('client_name') as string
  const clientPhone = formData.get('client_phone') as string

  if (!clientName || !clientPhone) {
    throw new Error('Faltan datos del cliente')
  }

  // 1. Ensure the spot exists
  let { data: spot, error: spotError } = await supabase
    .from('session_spots')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('spot_number', spotNumber)
    .single()

  if (spotError && spotError.code !== 'PGRST116') {
    throw new Error('Error al obtener el espacio')
  }

  if (spot && spot.status !== 'available') {
    throw new Error('El espacio ya no está disponible')
  }

  let spotId = spot?.id

  if (!spot) {
    const { data: newSpot, error: insertError } = await supabase
      .from('session_spots')
      .insert({
        session_id: sessionId,
        spot_number: spotNumber,
        status: 'available'
      })
      .select('id')
      .single()

    if (insertError || !newSpot) {
      throw new Error('Error al crear el espacio')
    }
    spotId = newSpot.id
  }

  // 2. Call create_reservation RPC
  const { data: reservationId, error: reserveError } = await supabase.rpc('create_reservation', {
    p_session_id: sessionId,
    p_client_name: clientName,
    p_client_phone: clientPhone,
    p_spot_ids: [spotId as string]
  })

  if (reserveError || !reservationId) {
    throw new Error('Error al crear la reserva: ' + reserveError?.message)
  }

  // 3. Update reservation status to 'confirmed' and estado_pago to 'aprobado'
  const { error: updateError } = await supabase
    .from('reservations')
    .update({ 
      status: 'confirmed',
      estado_pago: 'aprobado'
    })
    .eq('id', reservationId)

  if (updateError) {
    throw new Error('Error al confirmar la reserva')
  }

  // 4. Update the spot status to 'present'
  const { error: finalSpotError } = await supabase
    .from('session_spots')
    .update({ status: 'present' })
    .eq('id', spotId as string)

  if (finalSpotError) {
    throw new Error('Error al registrar la asistencia')
  }

  revalidatePath(`/panel/asistencia/${sessionId}`)
}
