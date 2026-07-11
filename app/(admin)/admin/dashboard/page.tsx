import { createClient } from '@/lib/supabase/server'
import { getLimaDateString, getCurrentLimaTime } from '@/lib/utils'
import { DollarSign, Users, TrendingUp, ArrowUpRight, Dumbbell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Fetch Total Active Classes (Published & Upcoming or Today)
  const todayStr = getLimaDateString()
  const { count: activeClassesCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('session_date', todayStr)

  // 2. Fetch Students enrolled today (confirmed reservations for today's sessions, not refunded)
  const { data: todayReservations } = await supabase
    .from('reservations')
    .select(`
      id,
      sessions!inner (
        session_date
      )
    `)
    .eq('status', 'confirmed')
    .is('refunded_at', null)
    .eq('sessions.session_date', todayStr)

  const enrolledTodayCount = todayReservations?.length || 0

  // 3. Fetch monthly revenue (confirmed reservations created this month, not refunded)
  const nowLima = getCurrentLimaTime()
  const year = nowLima.getFullYear()
  const month = String(nowLima.getMonth() + 1).padStart(2, '0')
  const startOfMonthStr = `${year}-${month}-01T00:00:00-05:00`

  const { data: monthlyReservations } = await supabase
    .from('reservations')
    .select('total_amount')
    .eq('status', 'confirmed')
    .is('refunded_at', null)
    .gte('reserved_at', startOfMonthStr)

  const monthlyRevenue = monthlyReservations
    ? monthlyReservations.reduce((acc, r) => acc + Number(r.total_amount), 0)
    : 0

  // Display the actual database values directly
  const displayRevenue = monthlyRevenue
  const displayClasses = activeClassesCount ?? 0
  const displayEnrolled = enrolledTodayCount

  return (
    <div className="min-h-screen bg-background py-8 px-5 md:px-10 text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-heading">Dashboard General</h1>
            <p className="text-foreground/70 text-sm mt-1">Monitoreo en tiempo real de Myku Gym</p>
          </div>
          <div className="bg-container border border-foreground/5 rounded-2xl px-4 py-2 flex items-center gap-2 self-start md:self-auto shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-foreground/80">Sistema Activo</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Ingresos */}
          <div className="bg-container border border-foreground/5 rounded-3xl p-6 relative overflow-hidden group hover:border-cta/30 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cta/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-cta/10 flex items-center justify-center border border-cta/20">
                <DollarSign className="w-6 h-6 text-cta" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.5%
              </span>
            </div>
            <div className="mt-5">
              <p className="text-foreground/70 text-xs font-bold uppercase tracking-wider">Ingresos del Mes</p>
              <h3 className="text-3xl font-black mt-1">S/ {displayRevenue.toFixed(2)}</h3>
              <p className="text-[11px] text-foreground/50 mt-2">Basado en reservas aprobadas este mes</p>
            </div>
          </div>

          {/* Card 2: Clases Activas */}
          <div className="bg-container border border-foreground/5 rounded-3xl p-6 relative overflow-hidden group hover:border-brand/30 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20">
                <Dumbbell className="w-6 h-6 text-brand" />
              </div>
              <span className="text-[11px] font-bold text-foreground/80 bg-foreground/5 px-2.5 py-1 rounded-full">
                Programadas
              </span>
            </div>
            <div className="mt-5">
              <p className="text-foreground/70 text-xs font-bold uppercase tracking-wider">Clases Activas</p>
              <h3 className="text-3xl font-black mt-1">{displayClasses} Clases</h3>
              <p className="text-[11px] text-foreground/50 mt-2">Clases publicadas vigentes en agenda</p>
            </div>
          </div>

          {/* Card 3: Alumnos Inscritos */}
          <div className="bg-container border border-foreground/5 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-secondary/30 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-secondary/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/15 flex items-center justify-center border border-brand-secondary/20">
                <Users className="w-6 h-6 text-brand-secondary" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Hoy
              </span>
            </div>
            <div className="mt-5">
              <p className="text-foreground/70 text-xs font-bold uppercase tracking-wider">Alumnos de Hoy</p>
              <h3 className="text-3xl font-black mt-1">{displayEnrolled} Inscritos</h3>
              <p className="text-[11px] text-foreground/50 mt-2">Reservas activas registradas para el día de hoy</p>
            </div>
          </div>
        </div>

        {/* Analytics Insights */}
        <div className="bg-container border border-foreground/5 rounded-3xl p-6 shadow-md">
          <h3 className="text-lg font-bold mb-2 font-heading">Resumen Operativo</h3>
          <p className="text-foreground/70 text-sm leading-relaxed">
            Bienvenido al panel del administrador de Myku Gym. Desde aquí puedes supervisar las finanzas generales, monitorear la agenda completa de clases globales dictadas por los instructores, gestionar los registros de personal e instructores, y resolver de manera directa los reembolsos solicitados por cancelaciones de sesiones.
          </p>
        </div>

      </div>
    </div>
  )
}
