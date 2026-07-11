'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import twilio from 'twilio'

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
    .select('instructor_id, class_type, theme, session_date, start_time')
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
          client_name,
          client_phone,
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
  // 3. Send WhatsApp Notifications
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  
  if (accountSid && authToken && fromNumber) {
    const twilioClient = twilio(accountSid, authToken);
    // Use a Set to avoid sending duplicate messages if they booked multiple spots
    const notifiedPhones = new Set<string>();

    for (const spot of spots || []) {
      const res = spot.reservation_spots?.reservations;
      if (res && res.client_phone && !notifiedPhones.has(res.client_phone)) {
        notifiedPhones.add(res.client_phone);
        
        let phone = res.client_phone.replace(/\D/g, '');
        if (phone.startsWith('51')) {
          phone = phone.substring(2);
        }

        const className = `${session.class_type}${session.theme ? ` - ${session.theme}` : ''}`;
        let messageBody = `¡Hola ${res.client_name}!\n\nLamentamos informarte que la clase de *${className}* del ${session.session_date} a las ${session.start_time.substring(0,5)} ha sido cancelada por el instructor.`;
        
        if (res.estado_pago === 'aprobado') {
          messageBody += `\n\nEl instructor se pondrá en contacto contigo pronto para coordinar la devolución completa de tu pago.`;
        }

        try {
          await twilioClient.messages.create({
            body: messageBody,
            from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
            to: `whatsapp:+51${phone}`
          });
        } catch (error) {
          console.error(`Failed to send cancellation WA to ${phone}:`, error);
        }
      }
    }
  }

  // 4. Update session status to 'cancelled'
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
