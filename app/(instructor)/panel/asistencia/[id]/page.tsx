import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, QrCode } from 'lucide-react'
import { LiveAttendance, SpotData } from '@/features/instructor/components/LiveAttendance'
import { AttendanceQRModal } from '@/features/instructor/components/AttendanceQRModal'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch session and spots
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_spots ( 
        spot_number, 
        status,
        reservation_spots (
          reservations (
            client_name,
            estado_pago,
            total_amount
          )
        )
      )
    `)
    .eq('id', resolvedParams.id)
    .eq('instructor_id', user.id)
    .single()

  if (error || !session) {
    notFound()
  }

  const spots = (session.session_spots || []) as SpotData[]
  const countPresent = spots.filter(s => s.status === 'present').length

  const dateStr = formatSessionDate(`${session.session_date}T${session.start_time}`)
  const timeStr = formatSessionTime(`${session.session_date}T${session.start_time}`)

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-6 pb-6 px-5 text-white relative">
        <div className="max-w-3xl mx-auto w-full">
          <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-4 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">Asistencia en Vivo</h1>
              <p className="text-white/80 text-sm mt-1 capitalize">{dateStr} - {timeStr}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{countPresent}</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Presentes</span>
            </div>
          </div>

          <AttendanceQRModal />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <LiveAttendance 
          sessionId={session.id}
          capacity={session.capacity}
          spots={spots}
        />
      </main>
    </div>
  )
}
