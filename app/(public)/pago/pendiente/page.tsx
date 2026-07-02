import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'

export default async function PagoPendientePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
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

  // If webhook already processed it as approved, redirect to success
  if (reservation.estado_pago === 'aprobado') {
    redirect(`/pago/exito?reservaId=${reservaId}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 text-center">
      <div className="bg-container p-8 rounded-3xl border border-foreground/10 shadow-2xl max-w-md w-full space-y-6">
        <div className="w-20 h-20 bg-state-yellow/10 rounded-full flex items-center justify-center mx-auto text-state-yellow mb-2">
          <Clock className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">Pago Pendiente</h1>
        <p className="text-foreground/80 text-sm">
          Estamos procesando tu pago. Esto puede tardar unos minutos. Te notificaremos por WhatsApp en cuanto sea aprobado.
        </p>
        
        <a 
          href={`/clases`}
          className="inline-block w-full bg-foreground/10 text-foreground font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 mt-4"
        >
          Volver a Clases
        </a>
      </div>
    </div>
  )
}
