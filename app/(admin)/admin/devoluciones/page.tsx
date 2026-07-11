import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { AdminRefundItem } from '@/features/admin/components/AdminRefundItem'
import type { Database } from '@/types/database.types'

type RefundWithDetails = Database['public']['Tables']['refunds']['Row'] & {
  reservations: {
    client_name: string;
    client_phone: string;
    sessions: {
      session_date: string;
      start_time: string;
      theme: string | null;
    } | null;
  } | null;
}

export const dynamic = 'force-dynamic'

export default async function AdminDevolucionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all refunds across all sessions (since we are admin)
  const { data: refunds, error } = await supabase
    .from('refunds')
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching refunds:', error)
  }

  const refundsData = (refunds as unknown as RefundWithDetails[]) || []
  const pendingRefunds = refundsData.filter(r => r.status === 'pending')
  const completedRefunds = refundsData.filter(r => r.status === 'completed')

  const groupedPendingRefunds = pendingRefunds.reduce((acc, refund) => {
    const session = refund.reservations?.sessions
    const key = session ? `${session.session_date}_${session.start_time}_${session.theme || 'Myku'}` : 'unknown'
    if (!acc[key]) {
      acc[key] = {
        session,
        refunds: []
      }
    }
    acc[key].refunds.push(refund)
    return acc
  }, {} as Record<string, { session: any, refunds: RefundWithDetails[] }>)

  const pendingGroups = Object.values(groupedPendingRefunds).sort((a, b) => {
    if (!a.session) return 1
    if (!b.session) return -1
    return new Date(`${a.session.session_date}T${a.session.start_time}`).getTime() - new Date(`${b.session.session_date}T${b.session.start_time}`).getTime()
  })

  return (
    <div className="min-h-screen bg-[#0A0A0C] py-8 px-5 md:px-10 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D6007A]/10 border border-[#D6007A]/20 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-[#D6007A]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Devoluciones</h1>
            <p className="text-zinc-400 text-sm mt-1">Revisa y procesa reembolsos de reservas canceladas</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#121218] rounded-3xl p-6 border border-white/5 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              Pendientes
              {pendingRefunds.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {pendingRefunds.length}
                </span>
              )}
            </h2>
            
            <div className="space-y-6">
              {pendingGroups.length > 0 ? (
                pendingGroups.map((group, idx) => {
                  const session = group.session
                  const dateStr = session ? new Date(`${session.session_date}T${session.start_time}`).toLocaleString('es-PE', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                  }) : 'Fecha desconocida'
                  
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span>Clase: <strong className="font-bold text-white">{session?.theme || 'Myku'}</strong> - {dateStr}</span>
                      </div>
                      <div className="space-y-3 pl-2 border-l-2 border-white/10 ml-2">
                        {group.refunds.map(refund => (
                          <AdminRefundItem key={refund.id} refund={refund} hideSessionInfo={true} />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  No hay devoluciones pendientes.
                </div>
              )}
            </div>
          </div>

          {completedRefunds.length > 0 && (
            <div className="pt-8 border-t border-white/5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                Completadas
                <span className="bg-[#00E676]/10 text-[#00E676] text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {completedRefunds.length}
                </span>
              </h2>
              <div className="space-y-3 opacity-80">
                {completedRefunds.map(refund => (
                  <AdminRefundItem key={refund.id} refund={refund} />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
