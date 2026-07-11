"use client"

import { useState, useTransition } from 'react'
import { CheckCircle2, Phone, Calendar, User as UserIcon } from 'lucide-react'
import { completeRefundAdmin } from '../actions/completeRefundAdmin'
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

export function AdminRefundItem({ refund, hideSessionInfo = false }: { refund: RefundWithDetails, hideSessionInfo?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const reservation = refund.reservations
  const clientName = reservation?.client_name || 'Usuario desconocido'
  const clientPhone = reservation?.client_phone || 'Sin número'

  const handleCopy = () => {
    if (!reservation?.client_phone) return
    navigator.clipboard.writeText(reservation.client_phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleComplete = () => {
    setShowConfirmModal(false)
    startTransition(async () => {
      try {
        await completeRefundAdmin(refund.id)
        setIsSuccess(true)
      } catch {
        alert('Error al procesar la devolución.')
      }
    })
  }

  const isCompleted = refund.status === 'completed' || isSuccess
  const session = reservation?.sessions
  const dateStr = session ? new Date(`${session.session_date}T${session.start_time}`).toLocaleString('es-PE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  }) : 'Fecha desconocida'

  return (
    <>
      <div className={`p-4 rounded-2xl border ${isCompleted ? 'border-status-success/30 bg-status-success/5' : 'border-status-warning/30 bg-status-warning/5'} transition-colors relative`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-foreground capitalize flex items-center gap-2 font-heading">
              <UserIcon className="w-4 h-4 text-foreground/50" />
              {clientName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-foreground/70 flex items-center gap-1">
                <Phone className="w-3 h-3 text-foreground/50" />
                {clientPhone}
              </p>
              {reservation?.client_phone && (
                <button 
                  onClick={handleCopy}
                  className="text-xs bg-foreground/5 hover:bg-foreground/10 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors text-foreground/80"
                >
                  {copied ? <span className="text-status-success">Copiado ✓</span> : <span>Copiar</span>}
                </button>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg text-foreground">S/ {Number(refund.amount).toFixed(2)}</span>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isCompleted ? 'text-status-success' : 'text-status-warning'}`}>
              {isCompleted ? 'Completada' : 'Pendiente'}
            </p>
          </div>
        </div>

        {!hideSessionInfo && (
          <div className="flex items-center gap-2 text-xs text-foreground/80 mb-4 bg-foreground/5 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-cta" />
            <span>Clase: <strong className="font-medium">{session?.theme || 'Myku'}</strong> - {dateStr}</span>
          </div>
        )}

        {!isCompleted && (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isPending}
            className={`w-full bg-brand text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-brand/90 hover:scale-[1.01] transition-transform disabled:opacity-50 cursor-pointer ${hideSessionInfo ? 'mt-4' : ''}`}
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

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-container rounded-3xl p-6 w-full max-w-sm border border-foreground/10 shadow-2xl text-foreground">
            <h3 className="text-lg font-bold mb-3 font-heading">Confirmar Devolución</h3>
            <p className="text-foreground/80 text-sm mb-6">
              ¿Confirmas que ya realizaste el pago de <strong className="text-foreground">S/{Number(refund.amount).toFixed(2)}</strong> a <strong className="text-foreground">{clientName}</strong> ({clientPhone})?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-foreground/5 text-foreground/80 hover:bg-foreground/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleComplete}
                className="flex-1 py-3 rounded-xl font-bold bg-brand text-white hover:bg-brand/90 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
