import { createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BookingStepper } from '@/features/booking/components/BookingStepper'
import { TopBar } from '@/features/shared/components/TopBar'
import { ShieldCheck } from 'lucide-react'
import { MercadoPagoButton } from '@/features/booking/components/MercadoPagoButton'
import { CountdownTimer } from '@/features/booking/components/CountdownTimer'

function formatSessionDateTimeStr(isoDate: string, isoTime: string) {
  const date = new Date(`${isoDate}T${isoTime}`)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: SearchParams }) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const reservaId = resolvedSearchParams.reservaId as string

  if (!reservaId) {
    redirect(`/reserva/${resolvedParams.id}/espacio`)
  }

  const supabase = createAdminClient()

  // Fetch Reservation
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select(`
      id, client_name, client_phone, total_amount, estado_pago, expira_en,
      session_id,
      sessions (
        session_date, start_time, theme, price,
        instructor:instructors (full_name)
      ),
      reservation_spots (
        session_spots ( spot_number )
      )
    `)
    .eq('id', reservaId)
    .single()

  if (resError || !reservation) {
    notFound()
  }

  // Handle statuses
  if (reservation.estado_pago === 'aprobado') {
    redirect(`/pago/exito?reservaId=${reservaId}`)
  }

  if (reservation.expira_en && new Date(reservation.expira_en) < new Date()) {
    redirect(`/reserva/${resolvedParams.id}/espacio`)
  }

  const session = reservation.sessions as any
  const dateTimeStr = formatSessionDateTimeStr(session.session_date, session.start_time)
  const instructorName = session.instructor 
    ? (Array.isArray(session.instructor) ? session.instructor[0]?.full_name : session.instructor.full_name)
    : 'Instructor'

  const spotsArray = (reservation.reservation_spots as any[]).map(rs => rs.session_spots?.spot_number).sort((a,b)=>a-b)
  const totalAmount = Number(reservation.total_amount)

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <TopBar title="Pago de Reserva" backHref={`/reserva/${resolvedParams.id}/espacio`} />

      <div className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 py-6 space-y-6">
        <BookingStepper currentStep={3} />

        {reservation.expira_en && <CountdownTimer expiresAt={reservation.expira_en} fallbackUrl={`/reserva/${resolvedParams.id}/espacio`} />}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Columna Izquierda: Detalles de Pago */}
          <div className="md:col-span-7 space-y-6 order-2 md:order-1">
            <div className="hidden md:flex items-center justify-between border-b border-foreground/5 pb-4">
              <div className="space-y-1">
                <p className="text-foreground/80 text-xs uppercase tracking-widest font-medium">Checkout Seguro</p>
                <p className="text-foreground font-bold text-3xl">S/. {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-container p-6 md:p-8 rounded-2xl border border-foreground/5 text-center space-y-6 shadow-lg">
              <div className="w-16 h-16 bg-[#009EE3] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#009EE3]/30">
                 <span className="text-white font-bold italic text-sm text-center leading-tight">Mercado<br/>Pago</span>
              </div>
              <div>
                <p className="text-foreground font-medium text-lg">Pago con Mercado Pago</p>
                <p className="text-foreground/70 text-sm px-6 mt-1">Serás redirigido de forma segura para completar tu pago con Yape, Tarjeta o PagoEfectivo.</p>
              </div>
              
              <MercadoPagoButton reservationId={reservaId} amount={totalAmount} />

              <div className="pt-6 border-t border-foreground/5 flex items-center justify-center gap-6 text-foreground/80 text-xs">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>SSL Encriptado</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pagos Seguros</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Resumen */}
          <div className="md:col-span-5 order-1 md:order-2">
            <div className="bg-container border border-foreground/10 shadow-xl shadow-black/10 dark:shadow-black/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-foreground font-semibold text-lg border-b border-foreground/10 pb-3">Resumen de Reserva</h3>
              
              <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                <span className="text-foreground/80 text-sm">
                  {spotsArray.length === 1 ? 'Espacio seleccionado' : 'Espacios seleccionados'}
                </span>
                <span className="text-state-yellow font-bold text-2xl">
                  {spotsArray.map(s => `#${s}`).join(', ')}
                </span>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Nombre</span>
                  <span className="text-foreground font-medium">{reservation.client_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Celular</span>
                  <span className="text-foreground font-medium">{reservation.client_phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Instructor</span>
                  <span className="text-foreground font-medium">{instructorName}</span>
                </div>
                {session.theme && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Temática</span>
                    <span className="text-foreground font-medium">{session.theme}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Día y hora</span>
                  <span className="text-foreground font-medium capitalize">{dateTimeStr}</span>
                </div>
                <div className="border-t border-foreground/10 pt-4 flex justify-between items-center text-sm">
                  <span className="text-foreground/70 font-semibold">Resumen Total</span>
                  <span className="text-state-yellow font-bold text-2xl">
                    S/. {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
