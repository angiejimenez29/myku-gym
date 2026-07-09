import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookingStepper } from '@/features/booking/components/BookingStepper'
import { LocationMap } from '@/features/booking/components/LocationMap'
import { TopBar } from '@/features/shared/components/TopBar'
import { Calendar, Clock, MapPin, User as UserIcon, Dumbbell } from 'lucide-react'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ClassDetailsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>
  searchParams: SearchParams
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const fromPath = resolvedSearchParams.from === 'landing' ? '/' : '/clases'
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      instructor:instructors (
        full_name,
        profile_image_url,
        years_experience
      ),
      session_spots ( status )
    `)
    .eq('id', resolvedParams.id)
    .single()

  const session = data as any

  if (error || !session) {
    notFound()
  }

  const dateStr = formatSessionDate(`${session.session_date}T${session.start_time}`)
  const timeStr = formatSessionTime(`${session.session_date}T${session.start_time}`)

  const instructorName = session.instructor 
    ? (Array.isArray(session.instructor) ? session.instructor[0]?.full_name : session.instructor.full_name)
    : 'Instructor'
  
  const instructorExp = session.instructor
    ? (Array.isArray(session.instructor) ? session.instructor[0]?.years_experience : session.instructor.years_experience)
    : 5

  const availableSpots = session.session_spots
    ? session.session_spots.filter((s: any) => s.status === 'available').length
    : session.capacity

  const progressPercentage = ((session.capacity - availableSpots) / session.capacity) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-12">
      <TopBar title="Detalles de la Clase" backHref={fromPath} />

      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 mt-6 space-y-6">
        <BookingStepper currentStep={1} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Columna Izquierda: Información de la sesión y ubicación */}
          <div className="md:col-span-7 space-y-6">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl p-4 border border-foreground/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <span className="text-foreground text-sm font-medium capitalize">{dateStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span className="text-foreground text-sm font-medium">{timeStr}</span>
                </div>
              </div>

              <details className="mt-3 group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between text-xs font-semibold text-foreground/80 cursor-pointer pt-3 border-t border-foreground/10">
                  Ver detalles de la clase
                  <span className="transition-transform group-open:rotate-180">
                    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="pt-3 grid grid-cols-2 gap-3">
                  {session.class_type && (
                    <div>
                      <p className="text-[10px] text-foreground/70 uppercase tracking-wider flex items-center gap-1 mb-0.5"><Dumbbell className="w-3 h-3"/> Tipo</p>
                      <p className="text-foreground text-sm font-medium">{session.class_type}</p>
                    </div>
                  )}
                  {session.theme && (
                    <div>
                      <p className="text-[10px] text-foreground/70 uppercase tracking-wider mb-0.5">Temática</p>
                      <p className="text-state-yellow text-sm font-medium">{session.theme}</p>
                    </div>
                  )}
                  {session.special_guest && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-foreground/70 uppercase tracking-wider mb-0.5">Invitado Especial</p>
                      <p className="text-foreground text-sm font-medium">{session.special_guest}</p>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* Ubicación */}
            <div>
              <details className="group bg-container rounded-2xl border border-foreground/5 [&_summary::-webkit-details-marker]:hidden overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-foreground">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-pink-500 shrink-0" />
                    <div>
                      <p className="text-foreground/80 text-xs font-normal">Ubicación</p>
                      <p className="text-foreground text-sm font-medium">Super Exlocal</p>
                    </div>
                  </div>
                  <span className="transition-transform group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-4 pt-0 space-y-4">
                  <p className="text-foreground/80 text-xs">Av. Principal 123, San Isidro, Lima</p>
                  <LocationMap />
                </div>
              </details>
            </div>
          </div>

          {/* Columna Derecha: Instructor y Resumen de Reserva (sticky) */}
          <div className="md:col-span-5 space-y-6 md:sticky md:top-40">
            {/* Instructor */}
            <div className="space-y-3">
              <div className="bg-container p-3 rounded-2xl flex items-center gap-3 border border-foreground/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{instructorName.substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{instructorName}</p>
                  <p className="text-foreground/70 text-[11px]">{instructorExp}+ años exp.</p>
                </div>
              </div>
            </div>

            {/* Resumen de Reserva (Desktop only) */}
            <div className="hidden md:block bg-container p-6 rounded-2xl border border-foreground/5 space-y-5 shadow-lg">
              <h3 className="text-foreground font-semibold text-lg">Resumen de Reserva</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Cupos disponibles</span>
                <span className="text-state-yellow font-bold">{availableSpots} de {session.capacity}</span>
              </div>
              <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-state-yellow rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="border-t border-foreground/10 pt-4 flex items-center justify-between">
                <span className="text-foreground/80 text-sm">Precio total</span>
                <span className="text-foreground font-bold text-lg">S/. {session.price.toFixed(2)}</span>
              </div>
              
              <Link href={`/reserva/${resolvedParams.id}/espacio`} className="block w-full">
                <button 
                  disabled={availableSpots === 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {availableSpots > 0 ? 'Continuar a la Reserva' : 'Clase Llena'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-background/95 border-t border-foreground/10 p-4 px-5 pb-6 z-50">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-foreground/70 text-xs">Precio total</span>
              <span className="text-foreground font-bold text-lg">S/. {session.price.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-foreground/70 text-xs">Cupos</span>
              <span className="text-state-yellow font-bold text-sm">{availableSpots} de {session.capacity} libres</span>
            </div>
          </div>
          
          <Link href={`/reserva/${resolvedParams.id}/espacio`} className="block w-full">
            <button 
              disabled={availableSpots === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {availableSpots > 0 ? 'Continuar a la Reserva' : 'Clase Llena'}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
