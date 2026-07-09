"use client"

import { useState, useTransition } from 'react'
import { CheckCircle2, Phone, Calendar, User as UserIcon } from 'lucide-react'
import { completeRefund } from '../actions/completeRefund'

export function RefundItem({ refund }: { refund: any }) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeRefund(refund.id)
        setIsSuccess(true)
      } catch (e) {
        alert('Error al procesar la devolución.')
      }
    })
  }

  const isCompleted = refund.status === 'completed' || isSuccess
  const reservation = refund.reservations
  const session = reservation?.sessions
  const dateStr = session ? new Date(`${session.session_date}T${session.start_time}`).toLocaleString('es-PE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  }) : 'Fecha desconocida'

  return (
    <div className={`p-4 rounded-2xl border ${isCompleted ? 'border-[#00E676]/30 bg-[#00E676]/5' : 'border-orange-500/30 bg-orange-500/5'} transition-colors`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-foreground capitalize flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-foreground/50" />
            {reservation?.client_name || 'Usuario desconocido'}
          </h3>
          <p className="text-xs text-foreground/60 flex items-center gap-2 mt-1">
            <Phone className="w-3 h-3" />
            {reservation?.client_phone || 'Sin número'}
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg text-foreground">S/ {Number(refund.amount).toFixed(2)}</span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isCompleted ? 'text-[#00E676]' : 'text-orange-500'}`}>
            {isCompleted ? 'Completada' : 'Pendiente'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-foreground/70 mb-4 bg-background/50 p-2 rounded-lg">
        <Calendar className="w-4 h-4 text-[#D6007A]" />
        <span>Clase: <strong className="font-medium">{session?.theme || 'Meikyo'}</strong> - {dateStr}</span>
      </div>

      {!isCompleted && (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="w-full bg-[#D6007A] text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-[#D6007A]/80 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Procesando...' : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Marcar como devuelto
            </>
          )}
        </button>
      )}
    </div>
  )
}
