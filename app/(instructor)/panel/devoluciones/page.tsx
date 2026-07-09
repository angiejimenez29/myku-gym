import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Receipt } from 'lucide-react'
import { RefundItem } from '@/features/instructor/components/RefundItem'

export const dynamic = 'force-dynamic'

export default async function DevolucionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch refunds
  const { data: refunds, error } = await supabase
    .from('refunds' as any)
    .select(`
      id,
      amount,
      status,
      created_at,
      completed_at,
      reservations (
        client_name,
        client_phone,
        sessions (
          session_date,
          start_time,
          theme
        )
      )
    `)
    // Because RLS policy automatically filters by the instructor's sessions,
    // we don't strictly need .eq('instructor_id', ...) but we rely on RLS.
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching refunds:', error)
  }

  const refundsData = (refunds as any[]) || []
  const pendingRefunds = refundsData.filter(r => r.status === 'pending')
  const completedRefunds = refundsData.filter(r => r.status === 'completed')

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-6 pb-6 px-5 text-white relative">
        <div className="max-w-3xl mx-auto w-full">
          <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-4 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
          
          <div className="flex items-end gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Devoluciones</h1>
              <p className="text-white/80 text-sm mt-1">Gestión de reembolsos</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <div className="bg-container rounded-3xl p-5 border border-foreground/5 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
              Pendientes
              {pendingRefunds.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">{pendingRefunds.length}</span>
              )}
            </h2>
            <div className="space-y-3">
              {pendingRefunds.length > 0 ? (
                pendingRefunds.map(refund => (
                  <RefundItem key={refund.id} refund={refund} />
                ))
              ) : (
                <div className="text-center py-6 text-foreground/50 text-sm">
                  No hay devoluciones pendientes.
                </div>
              )}
            </div>
          </div>

          {completedRefunds.length > 0 && (
            <div className="pt-6 border-t border-foreground/10">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                Completadas
                <span className="bg-[#00E676]/20 text-[#00E676] text-xs px-2 py-1 rounded-full">{completedRefunds.length}</span>
              </h2>
              <div className="space-y-3 opacity-75">
                {completedRefunds.map(refund => (
                  <RefundItem key={refund.id} refund={refund} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
