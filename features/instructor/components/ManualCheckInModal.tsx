'use client'

import { useState, useTransition } from 'react'
import { User, CheckCircle2, X, Loader2 } from 'lucide-react'
import { manualCheckIn } from '../actions/manualCheckIn'
import { Input } from '@/features/shared/components/Input'

interface ManualCheckInModalProps {
  sessionId: string
  spotNumber: number
  isOpen: boolean
  onClose: () => void
}

export function ManualCheckInModal({ sessionId, spotNumber, isOpen, onClose }: ManualCheckInModalProps) {
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await manualCheckIn(sessionId, spotNumber, formData)
        onClose()
      } catch (e) {
        alert('Ocurrió un error al registrar el check-in manual.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-5 text-white pr-12">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Check-in Manual
          </h2>
          <p className="text-white/80 text-sm mt-1">Espacio #{spotNumber} - Pago Presencial</p>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground/80">Nombre Completo</label>
            <Input 
              name="client_name" 
              placeholder="Ej. Juan Pérez" 
              required 
              autoFocus
              className="bg-background border-foreground/10"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground/80">Celular</label>
            <Input 
              name="client_phone" 
              placeholder="Ej. 999888777" 
              required 
              type="tel"
              className="bg-background border-foreground/10"
            />
          </div>

          <div className="bg-foreground/5 border border-state-yellow/30 p-3 rounded-xl text-xs text-foreground/80 leading-relaxed mt-2">
            <strong className="text-state-yellow">Nota:</strong> Esto creará la reserva automáticamente con pago en efectivo y registrará la asistencia del alumno en este espacio.
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl py-3.5 mt-4 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              'Confirmar Check-in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
