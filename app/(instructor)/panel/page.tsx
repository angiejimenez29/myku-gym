import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, User as UserIcon, Plus } from 'lucide-react'
import { CancelSessionButton } from '@/features/instructor/components/CancelSessionButton'
import { SessionOptionsMenu } from '@/features/instructor/components/SessionOptionsMenu'
import { getLimaDateString } from '@/lib/utils'

function formatSessionDate(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    timeZone: 'America/Lima'
  }).format(date)
}

function formatSessionTime(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/Lima'
  }).format(date)
}

function getOccupationTextColor(percentage: number) {
  if (percentage < 50) return 'text-[#00E676]'
  if (percentage < 90) return 'text-orange-500'
  return 'text-pink-500'
}

function getOccupationBgColor(percentage: number) {
  if (percentage < 50) return 'bg-[#00E676]'
  if (percentage < 90) return 'bg-orange-500'
  return 'bg-pink-500'
}

export default async function InstructorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all upcoming sessions for this instructor
  // We include session_spots to calculate occupation
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_spots ( status )
    `)
    .eq('instructor_id', user.id)
    .in('status', ['published', 'draft'])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    // Only get future sessions or today's sessions
    .gte('session_date', getLimaDateString())

  if (error) {
    console.error('Error fetching sessions:', error)
  }

  const upcomingSessions = (sessions || []) as any[]
  
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null
  const futureSessions = upcomingSessions.slice(1)

  const getOccupation = (session: any) => {
    const reservedSpots = session.session_spots
      ? session.session_spots.filter((s: any) => s.status !== 'available').length
      : 0
    return {
      reserved: reservedSpots,
      capacity: session.capacity,
      percentage: (reservedSpots / session.capacity) * 100
    }
  }

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-8 pb-8 px-5 text-white">
        <div className="max-w-md md:max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <p className="text-white/80 text-sm mt-1">Myku</p>
        </div>
      </div>

      <main className="max-w-md md:max-w-6xl mx-auto px-5 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Próxima Clase */}
          <div className="md:col-span-7 space-y-6">
            {nextSession ? (
              <div className="bg-container rounded-3xl p-5 border border-foreground/5 shadow-xl space-y-5">
                <div className="flex items-center gap-2 text-pink-500 text-sm font-semibold uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Próxima Clase
                </div>
                
                <h2 className="text-2xl font-bold text-foreground capitalize">
                  {formatSessionDate(`${nextSession.session_date}T${nextSession.start_time}`)}
                </h2>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70">Hora</p>
                      <p className="text-sm font-medium text-foreground">{formatSessionTime(`${nextSession.session_date}T${nextSession.start_time}`)}</p>
                    </div>
                  </div>

                  {nextSession.special_guest && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/70">Invitada Especial</p>
                        <p className="text-sm font-medium text-foreground">{nextSession.special_guest}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/70">Ocupación</span>
                    <span className={`text-sm font-bold ${getOccupationTextColor(getOccupation(nextSession).percentage)}`}>
                      {getOccupation(nextSession).reserved}/{getOccupation(nextSession).capacity} Cupos
                    </span>
                  </div>
                  <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getOccupationBgColor(getOccupation(nextSession).percentage)}`}
                      style={{ width: `${getOccupation(nextSession).percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Link href={`/panel/clase/${nextSession.id}`} className="block w-full">
                    <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3.5 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-500/25">
                      Ver Detalles
                    </button>
                  </Link>
                  <CancelSessionButton sessionId={nextSession.id} />
                </div>
              </div>
            ) : (
              <div className="bg-container rounded-3xl p-8 border border-foreground/5 shadow-xl text-center space-y-4">
                <h2 className="text-xl font-bold text-foreground">No tienes clases próximas</h2>
                <p className="text-foreground/70 text-sm">Programa una nueva sesión para empezar a recibir reservas.</p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Próximas Sesiones */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-foreground font-semibold text-lg px-1">Próximas Sesiones</h3>
            
            <div className="space-y-3">
              {futureSessions.map(session => (
                <Link key={session.id} href={`/panel/clase/${session.id}`} className="block">
                  <div className="bg-container border border-foreground/5 rounded-2xl p-4 flex items-center justify-between hover:border-pink-500/30 transition-colors cursor-pointer">
                    <div>
                      <p className="font-semibold text-foreground capitalize text-sm">
                        {formatSessionDate(`${session.session_date}T${session.start_time}`)}
                      </p>
                      <p className="text-foreground/60 text-xs mt-1">
                        {formatSessionTime(`${session.session_date}T${session.start_time}`)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-foreground/60 text-xs">Reservados</p>
                        <p className={`font-bold text-sm ${getOccupationTextColor(getOccupation(session).percentage)}`}>
                          {getOccupation(session).reserved}/{getOccupation(session).capacity}
                        </p>
                      </div>
                      <SessionOptionsMenu sessionId={session.id} />
                    </div>
                  </div>
                </Link>
              ))}
              
              {futureSessions.length === 0 && nextSession && (
                <p className="text-foreground/50 text-sm text-center py-4">No hay más sesiones programadas.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FAB (Floating Action Button) */}
      <Link href="/panel/nueva-sesion">
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all z-50">
          <Plus className="w-6 h-6" />
        </button>
      </Link>
    </div>
  )
}
