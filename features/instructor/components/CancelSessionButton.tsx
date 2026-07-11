'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { cancelSession, getCancelImpact } from '../actions/cancelSession'

interface CancelSessionButtonProps {
  sessionId: string
  variant?: 'full' | 'menu-item'
}

export function CancelSessionButton({ sessionId, variant = 'full' }: CancelSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)
  const [impact, setImpact] = useState<{ impactedReservations: number, totalRefundAmount: number } | null>(null)

  const handleOpenClick = async () => {
    setIsFetching(true)
    try {
      const data = await getCancelImpact(sessionId)
      setImpact(data)
      setIsOpen(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al calcular impacto')
    } finally {
      setIsFetching(false)
    }
  }

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await cancelSession(sessionId)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Ocurrió un error al cancelar la clase')
      }
    })
  }

  return (
    <>
      {variant === 'full' ? (
        <button 
          onClick={handleOpenClick}
          disabled={isFetching}
          className="w-full bg-container text-status-danger font-semibold rounded-xl py-3.5 border border-status-danger/20 transition-colors hover:bg-status-danger/10 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
          Cancelar Clase
        </button>
      ) : (
        <button 
          onClick={handleOpenClick}
          disabled={isFetching}
          className="w-full text-left px-4 py-3 text-status-danger hover:bg-status-danger/10 transition-colors text-sm font-medium flex items-center justify-between"
        >
          Cancelar Clase
          {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
        </button>
      )}

      {isOpen && impact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in zoom-in duration-200">
          <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-status-danger/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-status-danger" />
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-foreground/50 hover:text-foreground transition-colors"
                disabled={isPending}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">¿Cancelar Clase?</h3>
                <p className="text-foreground/70 text-sm">
                  Esta acción cancelará la clase y deberás gestionar el reembolso de los alumnos afectados. ¿Deseas continuar?
                </p>
              </div>

              <div className="bg-status-danger/5 border border-status-danger/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/70">Reservas afectadas:</span>
                  <span className="font-bold text-foreground">{impact.impactedReservations}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/70">Monto a reembolsar:</span>
                  <span className="font-bold text-status-danger">S/ {impact.totalRefundAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button 
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="w-full bg-status-danger hover:bg-status-danger text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Sí, cancelar clase'
                  )}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="w-full bg-transparent text-foreground/70 font-semibold rounded-xl py-3.5 hover:bg-foreground/5 transition-colors"
                >
                  Mantener clase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
