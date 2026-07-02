import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default async function PagoExitoPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams
  const reservaId = resolvedParams.external_reference || resolvedParams.reservaId

  if (!reservaId) {
    redirect('/')
  }

  const supabase = await createClient()

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
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">¡Pago Exitoso!</h1>
        <p className="text-foreground/80 text-sm">
          Tu reserva ha sido confirmada y procesada correctamente.
          En breve recibirás un mensaje de WhatsApp con los detalles.
        </p>
        
        <a 
          href={`/reserva/${reservation.session_id}/confirmacion?reservaId=${reservaId}`}
          className="inline-block w-full bg-foreground text-background font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95"
        >
          Ver resumen de reserva
        </a>
      </div>
    </div>
  )
}
