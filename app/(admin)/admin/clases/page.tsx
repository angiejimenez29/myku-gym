import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, User, Dumbbell } from 'lucide-react'
import type { Database } from '@/types/database.types'

type SessionWithSpotsAndInstructor = Database['public']['Tables']['sessions']['Row'] & {
  instructors: { full_name: string | null } | null;
  session_spots: { status: string }[] | null;
}

export const dynamic = 'force-dynamic'

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

export default async function AdminClasesPage() {
  const supabase = await createClient()

  // Fetch all sessions with their instructor and spot counts
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      instructors (
        full_name
      ),
      session_spots (
        status
      )
    `)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching global sessions:', error)
  }

  const allSessions = (sessions || []) as SessionWithSpotsAndInstructor[]

  const getOccupation = (session: SessionWithSpotsAndInstructor) => {
    const reservedSpots = session.session_spots
      ? session.session_spots.filter((s) => s.status !== 'available').length
      : 0
    return {
      reserved: reservedSpots,
      capacity: session.capacity,
      percentage: (reservedSpots / session.capacity) * 100
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-5 md:px-10 text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading">Clases Globales</h1>
          <p className="text-foreground/70 text-sm mt-1">Agenda general de todos los entrenadores</p>
        </div>

        {/* Sessions list */}
        {allSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allSessions.map((session) => {
              const { reserved, capacity, percentage } = getOccupation(session)
              const dateTimeStr = `${session.session_date}T${session.start_time}`

              return (
                <div 
                  key={session.id}
                  className="bg-container border border-foreground/5 rounded-3xl p-6 hover:border-brand/20 transition-all duration-300 flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        session.status === 'published' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-foreground/10 text-foreground/70'
                      }`}>
                        {session.status === 'published' ? 'Publicada' : 'Borrador'}
                      </span>
                      <span className="text-sm font-bold text-cta">
                        S/ {Number(session.price).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold capitalize line-clamp-1 font-heading">{session.theme || 'Clase Myku'}</h3>
                      <p className="text-xs text-foreground/70 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-foreground/50" />
                        Instructor: <span className="text-foreground font-medium">{session.instructors?.full_name || 'Sin asignar'}</span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 text-sm text-foreground/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-foreground/50" />
                        <span className="capitalize">{formatSessionDate(dateTimeStr)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-foreground/50" />
                        <span>{formatSessionTime(dateTimeStr)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-foreground/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-foreground/70">
                      <span>Cupos reservados</span>
                      <span className="font-bold text-foreground">{reserved} / {capacity}</span>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percentage < 50 ? 'bg-emerald-500' : percentage < 90 ? 'bg-status-warning' : 'bg-cta'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-container border border-foreground/5 rounded-3xl p-12 text-center shadow-md">
            <Dumbbell className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground font-heading">No hay clases programadas</h3>
            <p className="text-foreground/70 text-sm mt-1">Cuando los instructores programen clases, aparecerán aquí.</p>
          </div>
        )}

      </div>
    </div>
  )
}
