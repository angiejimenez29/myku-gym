'use server'
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createReservation(formData: FormData) {
  const supabase = await createClient()

  const sessionId = formData.get('sessionId') as string
  const spotsRaw = formData.get('spots') as string
  const clientName = formData.get('clientName') as string
  const clientPhone = formData.get('clientPhone') as string
  // Retrieve total amount from form data if needed for confirmation, or compute it. Wait, totalAmount is not in form data anymore.
  // Wait, I removed totalAmount from the hidden input!
  const totalAmountStr = formData.get('totalAmount') as string
  const totalAmount = totalAmountStr ? parseFloat(totalAmountStr) : 0;

  if (!sessionId || !spotsRaw || !clientName || !clientPhone) {
    throw new Error('Missing required fields')
  }

  const spotNumbers = spotsRaw.split(',').map(s => parseInt(s.trim(), 10)).filter(s => !isNaN(s))

  if (spotNumbers.length === 0) {
    throw new Error('No valid spots provided')
  }

  // 1. Get the session spot IDs for the given session and spot numbers
  const { data: spotsData, error: spotsError } = await supabase
    .from('session_spots')
    .select('id, status, spot_number')
    .eq('session_id', sessionId)
    .in('spot_number', spotNumbers)

  if (spotsError || !spotsData || spotsData.length !== spotNumbers.length) {
    throw new Error('Spots not found')
  }

  const spots = spotsData as any[]

  const unavailableSpots = spots.filter(s => s.status !== 'available')
  if (unavailableSpots.length > 0) {
    // Check if this exact user just booked it (handles double-clicks or page reloads)
    const { data } = await supabase
      .from('reservations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('client_name', clientName)
      .eq('client_phone', clientPhone)
      .order('reserved_at', { ascending: false })
      .limit(1)

    const existingReservations = data as any[]

    if (existingReservations && existingReservations.length > 0) {
      // Just redirect them to their confirmation page
      const url = `/reserva/${sessionId}/confirmacion?reservaId=${existingReservations[0].id}&name=${encodeURIComponent(clientName)}&phone=${encodeURIComponent(clientPhone)}&spots=${spotsRaw}`
      redirect(url)
    } else {
      throw new Error('Lo sentimos, uno o más espacios acaban de ser reservados por otra persona.')
    }
  }

  const spotIds = spots.map(s => s.id)

  // 2. Call the RPC to create the reservation atomically
  const { data: reservationId, error: rpcError } = await (supabase.rpc as any)('create_reservation', {
      p_session_id: sessionId,
      p_client_name: clientName,
      p_client_phone: clientPhone,
      p_spot_ids: spotIds
    })

  if (rpcError || !reservationId) {
    console.error('RPC Error:', rpcError)
    throw new Error('Failed to create reservation')
  }

  // Revalidate pages
  revalidatePath(`/clases`)
  revalidatePath(`/reserva/${sessionId}`)
  revalidatePath(`/reserva/${sessionId}/espacio`)
  
  const successUrl = `/reserva/${sessionId}/confirmacion?reservaId=${reservationId}&name=${encodeURIComponent(clientName)}&phone=${encodeURIComponent(clientPhone)}&spots=${spotsRaw}`
  redirect(successUrl)
}
