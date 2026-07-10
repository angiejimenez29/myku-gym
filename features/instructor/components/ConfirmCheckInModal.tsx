'use client'

import { useTransition } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { toggleAttendance } from '../actions/toggleAttendance'

interface ConfirmCheckInModalProps {
  sessionId: string
  spotNumber: number
  clientName: string
  estadoPago: string
  status: 'reserved' | 'present'
  isOpen: boolean
  onClose: () => void
}

export function ConfirmCheckInModal({ sessionId, spotNumber, clientName, estadoPago, status, isOpen, onClose }: ConfirmCheckInModalProps) {
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const isPresent = status === 'present'

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await toggleAttendance(sessionId, spotNumber)
        onClose()
      } catch {
        alert('Ocurrió un error al actualizar la asistencia')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-xl font-bold">Espacio #{spotNumber} - {clientName || 'Cliente'}</h2>
        </div>

        <div className="p-6 space-y-6 flex flex-col items-center">
          <div className="text-center space-y-2 w-full">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${estadoPago === 'aprobado' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-orange-500/10 text-orange-500'}`}>
              {estadoPago === 'aprobado' ? (
                <>Pago verificado <Check className="w-4 h-4" /></>
              ) : (
                `Pago ${estadoPago}`
              )}
            </div>
            
            <p className="text-foreground/70 font-medium pt-2">
              {isPresent ? 'Asistencia Confirmada' : 'Alumno aún no ha llegado'}
            </p>
          </div>

          <div className="w-full space-y-3">
            <button 
              onClick={handleConfirm}
              disabled={isPending}
              className={`w-full font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none ${isPresent ? 'bg-foreground/10 text-foreground hover:bg-foreground/20' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110'}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                isPresent ? 'Deshacer Check-in' : 'Confirmar Check-in Manual'
              )}
            </button>
            <button 
              onClick={onClose}
              disabled={isPending}
              className="w-full bg-transparent text-foreground/70 font-semibold rounded-xl py-3.5 hover:bg-foreground/5 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
