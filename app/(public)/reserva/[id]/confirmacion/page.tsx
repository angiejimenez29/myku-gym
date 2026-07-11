import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookingStepper } from '@/features/booking/components/BookingStepper'
import { Check, Dumbbell } from 'lucide-react'


function formatSessionDateTimeStr(isoDate: string, isoTime: string) {
  const date = new Date(`${isoDate}T${isoTime}`)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ reservaId?: string, name?: string, phone?: string, spots?: string }> }) {

  const resolvedSearchParams = await searchParams
  
  if (!resolvedSearchParams.reservaId) {
    notFound()
  }

  const supabase = createAdminClient()

  // Fetch Reservation using admin client to get all details securely
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(`
      id, client_name, client_phone, total_amount, estado_pago,
      session_id,
      sessions (
        session_date, start_time, theme, price, class_type,
        instructor:instructors (full_name)
      ),
      reservation_spots (
        session_spots ( spot_number )
      )
    `)
    .eq('id', resolvedSearchParams.reservaId)
    .single()

  if (error || !reservation) {
    // Return a fallback UI instead of 404 just in case
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Reserva Confirmada</h1>
        <p className="text-foreground/70">Tu reserva se guardó, pero hubo un problema al cargar los detalles de la reserva.</p>
        <Link href="/">
          <button className="px-6 py-3 bg-brand text-white rounded-xl font-bold">Volver al Inicio</button>
        </Link>
      </div>
    )
  }

  const clientName = reservation.client_name || 'Cliente'
  const clientPhone = reservation.client_phone || '--'
  
  const rs = Array.isArray(reservation.reservation_spots) ? reservation.reservation_spots : (reservation.reservation_spots ? [reservation.reservation_spots] : [])
  const spotNumbersArray = (rs as unknown as { session_spots: { spot_number: number } | null }[]).map((r) => r.session_spots?.spot_number).filter((s): s is number => typeof s === 'number').sort((a, b) => a - b)
  
  const spotsString = spotNumbersArray.length > 0 ? spotNumbersArray.map((s: number) => `#${s}`).join(', ') : '--'


  const session = reservation.sessions as unknown as { session_date: string, start_time: string, theme: string | null, price: number, class_type: string, instructor: { full_name: string | null } | { full_name: string | null }[] | null }

  const instructorName = session?.instructor 
    ? (Array.isArray(session.instructor) ? session.instructor[0]?.full_name : session.instructor.full_name)
    : 'Instructor'

  const dateTimeStr = session ? formatSessionDateTimeStr(session.session_date, session.start_time) : ''

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-12">
      {/* Hero Banner with gradient */}
      <div className="w-full bg-brand py-10 px-6 text-center relative overflow-hidden mb-6">
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        <div className="w-16 h-16 bg-black/20 rounded-full mx-auto flex items-center justify-center mb-4 relative z-10">
          <Check className="w-8 h-8 text-white stroke-[3]" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3 relative z-10 text-white">¡Reserva Confirmada!</h1>
        <p className="text-sm font-medium text-white/90 leading-relaxed max-w-sm mx-auto relative z-10">
          Tu pago fue procesado exitosamente, se enviarán los detalles al número de WhatsApp vinculado.
        </p>
      </div>

      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 space-y-6">
        <BookingStepper currentStep={4} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Columna Izquierda: Mensajes, Próximos pasos y Botón de Inicio */}
          <div className="md:col-span-7 space-y-6 order-2 md:order-1">
            {/* Importante Notice */}
            <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl p-6 flex gap-4 text-sm text-foreground/80 leading-relaxed shadow-inner">
              <div className="text-2xl mt-0.5">ℹ️</div>
              <div>
                <h4 className="text-brand-text font-bold text-base mb-1">Información Importante</h4>
                <p>
                  Llega 10 minutos antes de la clase para prepararte. Escanea el código QR que encontrarás en la entrada del gimnasio para realizar un check-in automático de tu espacio.
                </p>
              </div>
            </div>

            {/* Next Steps / Welcome Card */}
            <div className="bg-container border border-foreground/5 rounded-2xl p-6 space-y-4 shadow-lg">
              <h4 className="text-foreground font-semibold text-lg border-b border-foreground/5 pb-2">¿Qué sigue ahora?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-xl border border-foreground/5 space-y-2">
                  <span className="text-brand font-bold text-sm">1. WhatsApp</span>
                  <p className="text-foreground/75 text-xs">Recibirás un mensaje de confirmación con el ticket digital de tu reserva.</p>
                </div>
                <div className="bg-background p-4 rounded-xl border border-foreground/5 space-y-2">
                  <span className="text-brand-text font-bold text-sm">2. Check-in</span>
                  <p className="text-foreground/75 text-xs">Al llegar al gimnasio, muestra tu código en recepción o escanéalo para registrar tu asistencia.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Resumen Card */}
          <div className="md:col-span-5 order-1 md:order-2">
            <div className="bg-container border border-foreground/5 rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-foreground font-semibold text-lg border-b border-foreground/10 pb-3">Detalle de tu Reserva</h3>
              
              <div className="flex flex-col items-center justify-center p-6 bg-foreground/5 rounded-2xl border border-foreground/10 space-y-2">
                <span className="text-xs text-foreground/80 uppercase tracking-widest font-semibold">Espacios Reservados</span>
                <span className="text-brand-text font-bold text-2xl">{spotsString}</span>
              </div>
              
              <div className="space-y-3 pt-2">
                <details className="group [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between text-xs font-semibold text-foreground/80 cursor-pointer py-2 border-b border-foreground/10">
                    Ver detalles de tu reserva
                    <span className="transition-transform group-open:rotate-180">
                      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <div className="pt-3 pb-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/70">Nombre</span>
                      <span className="text-foreground font-medium">{clientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/70">Celular</span>
                      <span className="text-foreground font-medium">{clientPhone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/70">Instructor</span>
                      <span className="text-foreground font-medium">{instructorName}</span>
                    </div>
                    {session.class_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/70 flex items-center gap-1"><Dumbbell className="w-3 h-3"/> Tipo de Clase</span>
                        <span className="text-foreground font-medium">{session.class_type}</span>
                      </div>
                    )}
                    {session.theme && (
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/70">Temática del Día</span>
                        <span className="text-brand-text font-medium">{session.theme}</span>
                      </div>
                    )}
                  </div>
                </details>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Día y hora</span>
                  <span className="text-foreground font-medium capitalize">{dateTimeStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Inicio Centrado */}
        <div className="flex justify-center pt-8">
          <Link href="/" className="w-full max-w-xs md:max-w-md">
            <button className="w-full bg-cta text-white font-bold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-cta/20 text-lg">
              Volver al Inicio
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
