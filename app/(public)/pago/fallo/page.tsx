import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default async function PagoFalloPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams
  const reservaId = resolvedParams.external_reference || resolvedParams.reservaId

  if (!reservaId) {
    redirect('/')
  }

  const supabase = createAdminClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('estado_pago, session_id')
    .eq('id', reservaId)
    .single()

  if (!reservation) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 text-center">
      <div className="bg-container p-8 rounded-3xl border border-foreground/10 shadow-2xl max-w-md w-full space-y-6">
        <div className="w-20 h-20 bg-status-danger/10 rounded-full flex items-center justify-center mx-auto text-status-danger mb-2">
          <XCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">Pago Fallido</h1>
        <p className="text-foreground/80 text-sm">
          No pudimos procesar tu pago y la reserva no ha sido confirmada. Tus cupos han sido liberados.
        </p>
        
        <div className="space-y-3">
          <a 
            href={`/reserva/${reservation.session_id}/espacio`}
            className="inline-block w-full bg-foreground text-background font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95"
          >
            Intentar nuevamente
          </a>
          <a 
            href={`/clases`}
            className="inline-block w-full bg-foreground/5 text-foreground font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95"
          >
            Volver a Clases
          </a>
        </div>
      </div>
    </div>
  )
}
