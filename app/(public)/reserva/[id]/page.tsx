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

export default async function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
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
      <TopBar title="Detalles de la Clase" backHref="/clases" />

      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 mt-6 space-y-6">
        <BookingStepper currentStep={1} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Columna Izquierda: Información de la sesión y ubicación */}
          <div className="md:col-span-7 space-y-6">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl p-5 border border-foreground/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/20 p-2 rounded-xl">
                  <Calendar className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium capitalize">{dateStr}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/20 p-2 rounded-xl">
                  <Clock className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{timeStr}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-foreground/10 space-y-3">
                {session.special_guest && (
                  <div>
                    <p className="text-xs text-foreground/70 uppercase tracking-wider mb-1">Invitado Especial</p>
                    <p className="text-foreground text-sm font-medium">{session.special_guest}</p>
                  </div>
                )}
                {session.class_type && (
                  <div>
                    <p className="text-xs text-foreground/70 uppercase tracking-wider mb-1 flex items-center gap-1"><Dumbbell className="w-3 h-3"/> Tipo de Clase</p>
                    <p className="text-foreground text-sm font-medium">{session.class_type}</p>
                  </div>
                )}
                {session.theme && (
                  <div>
                    <p className="text-xs text-foreground/70 uppercase tracking-wider mb-1">Temática del Día</p>
                    <p className="text-state-yellow text-sm font-medium">{session.theme}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ubicación y Precio */}
            <div className="space-y-3">
              <h2 className="text-foreground font-semibold">Ubicación y Precio</h2>
              <div className="bg-container p-4 rounded-2xl border border-foreground/5 space-y-4">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-pink-500 shrink-0" />
                  <div>
                    <p className="text-foreground/80 text-xs">Ubicación</p>
                    <p className="text-foreground text-sm font-medium">Super Exlocal</p>
                    <p className="text-foreground/80 text-xs">Av. Principal 123, San Isidro, Lima</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-state-yellow/20 flex items-center justify-center shrink-0">
                    <span className="text-state-yellow text-xs font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-foreground/80 text-xs">Precio por persona</p>
                    <p className="text-foreground font-bold">S/. {session.price.toFixed(2)}</p>
                  </div>
                </div>

                <LocationMap />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Instructor y Resumen de Reserva (sticky) */}
          <div className="md:col-span-5 space-y-6 md:sticky md:top-40">
            {/* Instructor */}
            <div className="space-y-3">
              <h2 className="text-foreground font-semibold">Instructor</h2>
              <div className="bg-container p-4 rounded-2xl flex items-center gap-4 border border-foreground/5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-lg">{instructorName.substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-foreground font-medium">{instructorName}</p>
                  <p className="text-state-yellow text-xs mt-1">Entrenador Certificado</p>
                  <p className="text-foreground/70 text-xs mt-1">{instructorExp}+ años de experiencia en fitness</p>
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
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-background/95 border-t border-foreground/10 p-5 px-6 pb-8 z-50">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-sm">Cupos disponibles</span>
            <span className="text-state-yellow font-bold">{availableSpots} de {session.capacity}</span>
          </div>
          <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-state-yellow rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
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
