"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import twilio from 'twilio'

export async function cancelSessionAdmin(sessionId: string) {
  const supabase = await createClient()

  // 1. Verify authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // 2. Verify admin status
  const { data: admin, error: adminError } = await supabase
    .from('admins' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (adminError || !admin) {
    throw new Error('No autorizado: Se requiere rol de administrador')
  }

  // 3. Fetch session details
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('instructor_id, class_type, theme, session_date, start_time')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Clase no encontrada')
  }

  // 4. Find all paid reservations that need refunds
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

  const refundsToCreate = []
  for (const spot of spots || []) {
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

  // 5. Insert refunds using admin client to bypass RLS
  if (refundsToCreate.length > 0) {
    const supabaseAdmin = createAdminClient()
    const { error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert(refundsToCreate)
    
    if (refundError) {
      console.error('Supabase refundError:', refundError)
      throw new Error(`Error al registrar devoluciones: ${refundError.message}`)
    }
  }

  // 6. Send WhatsApp Notifications (Twilio)
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER
  
  if (accountSid && authToken && fromNumber) {
    const twilioClient = twilio(accountSid, authToken)
    const notifiedPhones = new Set<string>()

    for (const spot of spots || []) {
      const res = spot.reservation_spots?.reservations
      if (res && res.client_phone && !notifiedPhones.has(res.client_phone)) {
        notifiedPhones.add(res.client_phone)
        
        let phone = res.client_phone.replace(/\D/g, '')
        if (phone.startsWith('51')) {
          phone = phone.substring(2)
        }

        const className = `${session.class_type}${session.theme ? ` - ${session.theme}` : ''}`
        let messageBody = `¡Hola ${res.client_name}!\n\nLamentamos informarte que la clase de *${className}* del ${session.session_date} a las ${session.start_time.substring(0,5)} ha sido cancelada por el administrador.`
        
        if (res.estado_pago === 'aprobado') {
          messageBody += `\n\nNos pondremos en contacto contigo pronto para coordinar la devolución completa de tu pago.`
        }

        try {
          await twilioClient.messages.create({
            body: messageBody,
            from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
            to: `whatsapp:+51${phone}`
          })
        } catch (error) {
          console.error(`Failed to send cancellation WA to ${phone}:`, error)
        }
      }
    }
  }

  // 7. Update session status to 'cancelled' using admin client to bypass RLS
  const supabaseAdmin = createAdminClient()
  const { error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (updateError) {
    console.error('Error updating session status to cancelled:', updateError)
    throw new Error('Error al cancelar la sesión')
  }

  revalidatePath('/admin/clases')
  revalidatePath('/clases')

  return { success: true }
}
