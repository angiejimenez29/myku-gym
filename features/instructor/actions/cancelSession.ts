'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getCancelImpact(sessionId: string) {
  const supabase = await createClient()

  const { data: spots, error: spotsError } = await supabase
    .from('session_spots')
    .select(`
      reservation_spots (
        reservations (
          estado_pago,
          total_amount
        )
      )
    `)
    .eq('session_id', sessionId)

  if (spotsError) {
    throw new Error('Error al calcular el impacto de la cancelación')
  }

  let impactedReservations = 0
  let totalRefundAmount = 0

  for (const spot of spots) {
    const resData = spot.reservation_spots?.reservations
    if (resData && resData.estado_pago === 'aprobado') {
      impactedReservations++
      totalRefundAmount += Number(resData.total_amount) || 0
    }
  }

  return { impactedReservations, totalRefundAmount }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()

  // Verify the user is the instructor of this session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No estás autenticado')
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('instructor_id')
    .eq('id', sessionId)
    .single()

  if (sessionError || session?.instructor_id !== user.id) {
    throw new Error('No tienes permiso para cancelar esta clase')
  }

  // 1. Find all paid reservations that need refunds
  const { data: spots, error: spotsError } = await supabase
    .from('session_spots')
    .select(`
      reservation_spots (
        reservation_id,
        reservations (
          estado_pago,
          total_amount
        )
      )
    `)
    .eq('session_id', sessionId)

  if (spotsError) {
    throw new Error('Error al consultar las reservas de la clase')
  }

  // Filter out the valid reservations that need refund
  const refundsToCreate = []
  for (const spot of spots) {
    const resSpot = spot.reservation_spots
    if (resSpot && resSpot.reservations) {
      if (resSpot.reservations.estado_pago === 'aprobado') {
        refundsToCreate.push({
          reservation_id: resSpot.reservation_id,
          amount: resSpot.reservations.total_amount,
          status: 'pending'
        })
      }
    }
  }

  // 2. Insert refunds using admin client to bypass RLS since instructors don't have insert permissions on refunds
  if (refundsToCreate.length > 0) {
    const supabaseAdmin = createAdminClient()
    const { error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert(refundsToCreate)
    
    if (refundError) {
      console.error('Supabase refundError:', refundError)
      throw new Error(`Error al registrar devoluciones: ${refundError.message || JSON.stringify(refundError)}`)
    }
  }

  // 3. Update session status to 'cancelled'
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (updateError) {
    throw new Error('Error al cancelar la sesión')
  }

  revalidatePath('/panel')
  redirect('/panel')
}
