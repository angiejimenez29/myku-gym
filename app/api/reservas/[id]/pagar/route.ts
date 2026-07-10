/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservation ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch reservation details
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        id, 
        total_amount, 
        estado_pago,
        session_id,
        sessions (
          theme
        )
      `)
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.estado_pago === 'aprobado') {
      return NextResponse.json({ error: 'Reservation already paid' }, { status: 400 });
    }

    // 2. Initialize Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN || '', 
      options: { timeout: 5000 } 
    });
    
    const preference = new Preference(client);

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
      
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`;

    const theme = (reservation.sessions as any)?.theme || 'Clase de Entrenamiento';

    // 3. Create Preference
    const response = await preference.create({
      body: {
        items: [
          {
            id: reservation.id,
            title: `Reserva - ${theme}`,
            quantity: 1,
            unit_price: Number(reservation.total_amount),
            currency_id: 'PEN'
          }
        ],
        external_reference: reservation.id,
        back_urls: {
          success: `${baseUrl}/pago/exito`,
          pending: `${baseUrl}/pago/pendiente`,
          failure: `${baseUrl}/pago/fallo`
        },
        auto_return: 'approved',
        notification_url: notificationUrl
      }
    });

    if (!response.init_point) {
      throw new Error('No init_point received from Mercado Pago');
    }

    // 4. Update reservation with preference ID
    await supabase
      .from('reservations')
      .update({ mp_preference_id: response.id })
      .eq('id', reservation.id);

    return NextResponse.json({ init_point: response.init_point });

  } catch (error: any) {
    console.error('Mercado Pago Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
