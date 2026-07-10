import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, Tag, Music, User as UserIcon, Coins, Users } from 'lucide-react'
import { CancelSessionButton } from '@/features/instructor/components/CancelSessionButton'
import { SessionOptionsMenu } from '@/features/instructor/components/SessionOptionsMenu'
import { getLimaDateString } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type SessionWithSpots = Database['public']['Tables']['sessions']['Row'] & {
  session_spots: { status: string }[] | null;
}

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

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch session details
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_spots ( status )
    `)
    .eq('id', resolvedParams.id)
    .eq('instructor_id', user.id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Fetch all upcoming sessions for this instructor (displayed on desktop column)
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      *,
      session_spots ( status )
    `)
    .eq('instructor_id', user.id)
    .in('status', ['published', 'draft'])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .gte('session_date', getLimaDateString())

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError)
  }

  const upcomingSessions = (sessions || []) as SessionWithSpots[]

  const getOccupation = (sessionItem: SessionWithSpots) => {
    const reservedSpots = sessionItem.session_spots
      ? sessionItem.session_spots.filter((s) => s.status !== 'available').length
      : 0
    return {
      reserved: reservedSpots,
      capacity: sessionItem.capacity,
      percentage: (reservedSpots / sessionItem.capacity) * 100
    }
  }

  const reservedSpots = session.session_spots ? session.session_spots.filter(s => s.status !== 'available').length : 0
  const capacity = session.capacity

  const isCancelled = session.status === 'cancelled'

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-6 pb-6 px-5 text-white relative">
        <div className="max-w-md md:max-w-6xl mx-auto">
          <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-4 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">Detalles de la Clase</h1>
              <p className="text-white/80 text-sm mt-1">Revisa y administra tu sesión</p>
            </div>
            {isCancelled && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Cancelada</span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-md md:max-w-6xl mx-auto px-5 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Detalles de la Clase */}
          <div className="md:col-span-7">
            <div className="bg-container border border-foreground/5 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-5 space-y-5">
                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-foreground/50 text-xs uppercase font-semibold">
                      <Calendar className="w-4 h-4" /> Fecha
                    </div>
                    <p className="font-medium text-foreground capitalize text-sm">
                      {formatSessionDate(`${session.session_date}T${session.start_time}`)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-foreground/50 text-xs uppercase font-semibold">
                      <Clock className="w-4 h-4" /> Hora
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {formatSessionTime(`${session.session_date}T${session.start_time}`)}
                    </p>
                  </div>
                </div>

                <hr className="border-foreground/5" />

                {/* Detalles de clase */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50 font-semibold uppercase">Tipo de Clase</p>
                      <p className="text-sm font-medium text-foreground">{session.class_type || 'General'}</p>
                    </div>
                  </div>

                  {session.theme && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 font-semibold uppercase">Temática</p>
                        <p className="text-sm font-medium text-foreground">{session.theme}</p>
                      </div>
                    </div>
                  )}

                  {session.special_guest && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/50 font-semibold uppercase">Invitada Especial</p>
                        <p className="text-sm font-medium text-foreground">{session.special_guest}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#00E676]/10 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5 text-[#00E676]" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50 font-semibold uppercase">Costo</p>
                      <p className="text-sm font-medium text-foreground">S/ {session.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-foreground/5" />

                {/* Ocupacion */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-foreground/40" />
                    <span className="text-sm font-medium text-foreground">Ocupación</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {reservedSpots} / {capacity}
                    </span>
                    <span className="text-xs text-foreground/50 ml-1">ocupados</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="bg-foreground/5 p-5 space-y-3">
                {!isCancelled && (
                  <Link href={`/panel/clase/${session.id}/editar`} className="block w-full">
                    <button className="w-full bg-container border border-foreground/10 text-foreground font-semibold rounded-xl py-3.5 transition-colors hover:bg-foreground/5">
                      Editar Clase
                    </button>
                  </Link>
                )}
                
                {!isCancelled && (
                  <Link href={`/panel/asistencia/${session.id}`} className="block w-full">
                    <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-3.5 transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-500/25">
                      Ver Asistencia en Vivo
                    </button>
                  </Link>
                )}

                {!isCancelled && (
                  <div className="pt-2">
                    <CancelSessionButton sessionId={session.id} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Próximas Sesiones */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-foreground font-semibold text-lg px-1">Próximas Sesiones</h3>
            
            <div className="space-y-3">
              {upcomingSessions.map(sessionItem => {
                const isActive = sessionItem.id === resolvedParams.id
                return (
                  <Link key={sessionItem.id} href={`/panel/clase/${sessionItem.id}`} className="block">
                    <div className={`bg-container border rounded-2xl p-4 flex items-center justify-between transition-colors cursor-pointer ${
                      isActive 
                        ? 'border-pink-500 bg-pink-500/5' 
                        : 'border-foreground/5 hover:border-pink-500/30'
                    }`}>
                      <div>
                        <div className="flex items-center">
                          <p className="font-semibold text-foreground capitalize text-sm">
                            {formatSessionDate(`${sessionItem.session_date}T${sessionItem.start_time}`)}
                          </p>
                          {isActive && (
                            <span className="text-[10px] bg-pink-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
                              Actual
                            </span>
                          )}
                        </div>
                        <p className="text-foreground/60 text-xs mt-1">
                          {formatSessionTime(`${sessionItem.session_date}T${sessionItem.start_time}`)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-foreground/60 text-xs">Reservados</p>
                          <p className={`font-bold text-sm ${getOccupationTextColor(getOccupation(sessionItem).percentage)}`}>
                            {getOccupation(sessionItem).reserved}/{getOccupation(sessionItem).capacity}
                          </p>
                        </div>
                        <SessionOptionsMenu sessionId={sessionItem.id} />
                      </div>
                    </div>
                  </Link>
                )
              })}
              
              {upcomingSessions.length === 0 && (
                <p className="text-foreground/50 text-sm text-center py-4">No hay más sesiones programadas.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
