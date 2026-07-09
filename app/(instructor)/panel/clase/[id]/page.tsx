import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, Tag, Music, User as UserIcon, Coins, Users } from 'lucide-react'
import { CancelSessionButton } from '@/features/instructor/components/CancelSessionButton'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
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

  const reservedSpots = session.session_spots ? session.session_spots.filter(s => s.status !== 'available').length : 0
  const capacity = session.capacity

  const isCancelled = session.status === 'cancelled'

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-6 pb-12 px-5 rounded-b-3xl text-white relative">
        <div className="max-w-md mx-auto">
          <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-4 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
          
          <div className="flex justify-between items-end mb-4">
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

      <main className="max-w-md mx-auto px-5 -mt-6 space-y-6">
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
      </main>
    </div>
  )
}
