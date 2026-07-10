import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import twilio from 'twilio';

// ─── Streak helper ─────────────────────────────────────────────────────────────
/**
 * Returns the ISO Monday of the week that contains `dateStr` (YYYY-MM-DD).
 * We compute it in JS to avoid depending on Postgres date_trunc from the client.
 */
function getWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`) // noon UTC avoids DST edge cases
  const day = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day    // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)       // YYYY-MM-DD
}

/**
 * Upserts the streak row for `clientPhone` based on the session's `sessionDate`.
 * Returns the updated streak so we can include it in the WhatsApp message.
 */
async function upsertStreak(
  supabase: SupabaseClient<Database>,
  clientPhone: string,
  sessionDate: string   // YYYY-MM-DD
) {
  const currentWeekStart = getWeekStart(sessionDate)

  // Fetch existing row (or null if new client)
  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('client_phone', clientPhone)
    .maybeSingle()

  // ── Streak calculation ──────────────────────────────────────────────────────
  let newWeekStreak = 1
  const newClassesCount = (existing?.classes_count ?? 0) + 1

  if (existing?.last_reservation_week) {
    const lastWeek = existing.last_reservation_week // YYYY-MM-DD

    if (lastWeek === currentWeekStart) {
      // Same week → deduplicate: streak stays, but we still increment classes_count
      // (one class per payment is one class counted)
      newWeekStreak = existing.current_week_streak
    } else {
      const lastDate = new Date(`${lastWeek}T12:00:00Z`)
      const currDate = new Date(`${currentWeekStart}T12:00:00Z`)
      const weeksDiff = Math.round(
        (currDate.getTime() - lastDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      if (weeksDiff === 1) {
        // Consecutive week → extend streak
        newWeekStreak = existing.current_week_streak + 1
      } else {
        // Gap of 2+ weeks → reset
        newWeekStreak = 1
      }
    }
  }

  const newLongest = Math.max(
    existing?.longest_week_streak ?? 0,
    newWeekStreak
  )

  // Every 6 confirmed classes → unlock a free class
  const prevCount = existing?.classes_count ?? 0
  const milestoneReached =
    Math.floor(newClassesCount / 6) > Math.floor(prevCount / 6)
  const newFreeEarned = (existing?.free_classes_earned ?? 0) + (milestoneReached ? 1 : 0)
  const newFreeAvailable = milestoneReached
    ? true
    : (existing?.free_class_available ?? false)

  const upsertPayload = {
    client_phone: clientPhone,
    current_week_streak: newWeekStreak,
    longest_week_streak: newLongest,
    last_reservation_week: currentWeekStart,
    classes_count: newClassesCount,
    free_classes_earned: newFreeEarned,
    free_class_available: newFreeAvailable,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('streaks')
    .upsert(upsertPayload, { onConflict: 'client_phone' })

  if (error) {
    console.error('upsertStreak error:', error)
  }

  return { ...upsertPayload, milestoneReached }
}

// ─── WhatsApp message builder ──────────────────────────────────────────────────
function buildWhatsAppMessage(
  clientName: string,
  clientPhone: string,
  streak: Awaited<ReturnType<typeof upsertStreak>>,
  session: { class_type: string; theme: string | null; session_date: string; start_time: string },
  spotNumbers: string
): string {
  const classesUntilFree = 6 - (streak.classes_count % 6)
  const streakEmoji = streak.current_week_streak >= 4 ? '🔥🔥' : '🔥'

  let message = `¡Hola ${clientName}!\n\nTu reserva está confirmada ✅\n\n`
  message += `Clase: ${session.class_type}${session.theme ? ` - ${session.theme}` : ''}\n`
  message += `Fecha: ${session.session_date}\n`
  message += `Hora: ${session.start_time.substring(0,5)}\n`
  message += `Espacio(s): ${spotNumbers}\n\n`
  
  message += `${streakEmoji} Llevas *${streak.current_week_streak}* semana(s) seguida(s). Ya vas por tu clase *${streak.classes_count}* de 6`

  if (streak.milestoneReached) {
    message += `. 🎉 *¡Felicidades! Ganaste una clase GRATIS.* Se aplicará automáticamente en tu próxima reserva.`
  } else {
    message += ` — solo *${classesUntilFree}* más y la siguiente va gratis. ¡A darlo todo! 💪`
  }

  return message
}

// ─── Webhook handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);

    // MP sends the payment ID in `data.id` for webhook type 'payment'
    // Alternatively, it could be sent in URL search params `id` & `topic=payment`
    const paymentId = body?.data?.id || url.searchParams.get('id');
    const type = body?.type || url.searchParams.get('topic');

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ message: 'Ignored' }, { status: 200 });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    const payment = new Payment(client);

    // Always query the API to get the real payment status
    const paymentInfo = await payment.get({ id: paymentId });

    if (!paymentInfo || !paymentInfo.external_reference) {
      return NextResponse.json({ error: 'Invalid payment info' }, { status: 400 });
    }

    const reservationId = paymentInfo.external_reference;
    const status = paymentInfo.status; // 'approved', 'rejected', 'pending', etc.

    const supabase = createAdminClient();

    if (status === 'approved') {
      // 0. Check idempotency: If already confirmed, ignore to prevent duplicate WhatsApps
      const { data: currentRes } = await supabase
        .from('reservations')
        .select('estado_pago')
        .eq('id', reservationId)
        .single();

      if (currentRes?.estado_pago === 'aprobado') {
        console.log(`Payment for reservation ${reservationId} already processed. Ignored.`);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      // 1. Update reservation status
      await supabase
        .from('reservations')
        .update({
          estado_pago: 'aprobado',
          status: 'confirmed',
          mp_payment_id: paymentId.toString()
        })
        .eq('id', reservationId);

      // 4. Fire WhatsApp Confirmation & Streak logic
      try {
        const { data: resData } = await supabase
          .from('reservations')
          .select(`
            client_name,
            client_phone,
            session:sessions (
              class_type,
              theme,
              session_date,
              start_time
            ),
            spots:reservation_spots (
              spot:session_spots (
                spot_number
              )
            )
          `)
          .eq('id', reservationId)
          .single();

        if (resData && resData.session) {
          const session = resData.session as { class_type: string; theme: string | null; session_date: string; start_time: string };
          
          // Upsert streak
          const streak = await upsertStreak(
            supabase,
            resData.client_phone,
            session.session_date
          );

          const spotNumbers = (resData.spots as { spot: { spot_number: number } | null }[])?.map(s => s.spot?.spot_number).filter(Boolean).join(', ');
          
          // Build message
          const messageBody = buildWhatsAppMessage(
            resData.client_name,
            resData.client_phone,
            streak,
            session,
            spotNumbers
          );

          // Twilio send
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
          
          if (accountSid && authToken && fromNumber) {
            const twilioClient = twilio(accountSid, authToken);

            let phone = resData.client_phone.replace(/\D/g, '');
            if (phone.startsWith('51')) {
              phone = phone.substring(2);
            }

            await twilioClient.messages.create({
              body: messageBody,
              from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
              to: `whatsapp:+51${phone}`
            });
            console.log(`WhatsApp confirmation sent for reservation ${reservationId} to ${phone}`);
          }
        } else {
          console.log(`WhatsApp confirmation skipped for ${reservationId} (missing session or resData)`)
        }
      } catch (waError) {
        console.error('Error sending WhatsApp confirmation:', waError);
      }

    } else if (status === 'rejected' || status === 'cancelled') {
      // 1. Update reservation status
      await supabase
        .from('reservations')
        .update({
          estado_pago: 'rechazado',
          status: 'refunded', // reusing refunded/failed concept
          mp_payment_id: paymentId.toString()
        })
        .eq('id', reservationId);

      // 2. Release spots
      const { data: resSpots } = await supabase
        .from('reservation_spots')
        .select('spot_id')
        .eq('reservation_id', reservationId);

      if (resSpots) {
        for (const rs of resSpots) {
          await supabase.from('session_spots').update({ status: 'available' }).eq('id', rs.spot_id);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('MercadoPago Webhook Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
