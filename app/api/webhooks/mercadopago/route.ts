import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();

    if (status === 'approved') {
      // 1. Update reservation status
      await supabase
        .from('reservations')
        .update({
          estado_pago: 'aprobado',
          status: 'confirmed',
          mp_payment_id: paymentId.toString()
        })
        .eq('id', reservationId);

      // 2. We should update the payment table too if it exists, 
      // but let's stick to the new strategy where reservations tracks everything.

      // 3. Mark spots as permanently reserved if not already done by triggers
      // (The trigger mark_spot_reserved runs on insert to reservation_spots, so they are already 'reserved')

      // 4. Fire WhatsApp Confirmation logic (stub)
      console.log(`WhatsApp confirmation sent for reservation ${reservationId}`);

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

  } catch (error: any) {
    console.error('MercadoPago Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
