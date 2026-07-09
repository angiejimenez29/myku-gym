import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, User as UserIcon } from 'lucide-react'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
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

export default async function AsistenciaIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all upcoming sessions for this instructor
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
    .gte('session_date', new Date().toISOString().split('T')[0])

  if (error) {
    console.error('Error fetching sessions:', error)
  }

  const upcomingSessions = (sessions || []) as any[]

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
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-8 pb-16 px-5 rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Monitoreo en Vivo</h1>
        <p className="text-white/80 text-sm mt-1">Selecciona una clase para visualizar</p>
      </div>

      <main className="max-w-md mx-auto px-5 -mt-10 space-y-6">
        {upcomingSessions.length > 0 ? (
          upcomingSessions.map((session, index) => {
            const isNext = index === 0
            return (
              <div key={session.id} className="bg-container rounded-3xl p-5 border border-foreground/5 shadow-xl space-y-5 mb-6">
                <div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-2 ${isNext ? 'text-pink-500' : 'text-foreground/60'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {isNext ? 'Próxima Clase' : 'Clase Programada'}
                </div>
                
                <h2 className="text-2xl font-bold text-foreground capitalize">
                  {formatSessionDate(`${session.session_date}T${session.start_time}`)}
                </h2>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70">Hora</p>
                      <p className="text-sm font-medium text-foreground">{formatSessionTime(`${session.session_date}T${session.start_time}`)}</p>
                    </div>
                  </div>

                  {session.special_guest && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/70">Invitada Especial</p>
                        <p className="text-sm font-medium text-foreground">{session.special_guest}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/70">Ocupación</span>
                    <span className={`text-sm font-bold ${getOccupationTextColor(getOccupation(session).percentage)}`}>
                      {getOccupation(session).reserved}/{getOccupation(session).capacity} Cupos
                    </span>
                  </div>
                  <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getOccupationBgColor(getOccupation(session).percentage)}`}
                      style={{ width: `${getOccupation(session).percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Link href={`/panel/asistencia/${session.id}`} className="block w-full">
                    <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3.5 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-500/25">
                      Ver Asistencia en Vivo
                    </button>
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-container rounded-3xl p-8 border border-foreground/5 shadow-xl text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">No hay clases activas</h2>
            <p className="text-foreground/70 text-sm">Actualmente no tienes clases programadas para monitorear.</p>
          </div>
        )}
      </main>
    </div>
  )
}
