'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, User as UserIcon, Palette, DollarSign, Phone, Users, Loader2, Dumbbell, AlertCircle, X } from 'lucide-react'
import { unstable_rethrow } from 'next/navigation'
import { createSession } from '@/features/instructor/actions/createSession'
import { updateSession } from '@/features/instructor/actions/updateSession'
import { Input } from '@/features/shared/components/Input'
import type { Database } from '@/types/database.types'

interface NewSessionFormProps {
  initialData?: Database['public']['Tables']['sessions']['Row']
  sessionId?: string
}

export function NewSessionForm({ initialData, sessionId }: NewSessionFormProps = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    if (sessionId && initialData) {
      let hasChanged = false
      const initStartTime = initialData.start_time?.substring(0, 5)

      const dDate = formData.get('session_date') !== initialData.session_date
      const dTime = formData.get('start_time') !== initStartTime
      const dGuest = String(formData.get('special_guest') || '').trim() !== String(initialData.special_guest || '').trim()
      const dTheme = String(formData.get('theme') || '').trim() !== String(initialData.theme || '').trim()
      const dClass = String(formData.get('class_type') || '').trim() !== String(initialData.class_type || '').trim()
      const dPrice = Number(formData.get('price')) !== Number(initialData.price)
      const dContact = String(formData.get('whatsapp_contact') || '').trim() !== String(initialData.whatsapp_contact || '').trim()
      const dCapacity = Number(formData.get('capacity')) !== Number(initialData.capacity)

      if (dDate || dTime || dGuest || dTheme || dClass || dPrice || dContact || dCapacity) {
        hasChanged = true
        console.log('Cambios detectados:', { dDate, dTime, dGuest, dTheme, dClass, dPrice, dContact, dCapacity })
      }

      if (!hasChanged) {
        router.push(`/panel/clase/${sessionId}`)
        return
      }

      setPendingFormData(formData)
      setIsConfirmModalOpen(true)
    } else {
      executeAction(formData)
    }
  }

  const executeAction = (formData: FormData) => {
    startTransition(async () => {
      try {
        if (sessionId) {
          await updateSession(sessionId, formData)
          setIsConfirmModalOpen(false)
        } else {
          await createSession(formData)
        }
      } catch (err: unknown) {
        unstable_rethrow(err)
        setError(err instanceof Error ? err.message : (sessionId ? 'Error al actualizar la clase' : 'Error al crear la clase'))
        setIsConfirmModalOpen(false)
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-container rounded-3xl p-6 border border-foreground/5 shadow-xl mt-6 relative z-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-pink-500" /> Fecha <span className="text-red-500">*</span>
            </label>
            <Input 
              type="date" 
              name="session_date" 
              defaultValue={initialData?.session_date}
              required 
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-pink-500" /> Hora <span className="text-red-500">*</span>
            </label>
            <Input 
              type="time" 
              name="start_time" 
              defaultValue={initialData?.start_time}
              required 
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <UserIcon className="w-4 h-4 text-pink-500" /> Invitado Especial <span className="text-foreground/40 text-xs font-normal">(Opcional)</span>
            </label>
            <Input 
              type="text" 
              name="special_guest" 
              defaultValue={initialData?.special_guest || ''}
              placeholder="Ej. Ashly Gutierrez"
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-pink-500" /> Temática del Día <span className="text-foreground/40 text-xs font-normal">(Opcional)</span>
            </label>
            <Input 
              type="text" 
              name="theme" 
              defaultValue={initialData?.theme || ''}
              placeholder="Ej. Turquesa y Negro"
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-pink-500" /> Tipo de Clase <span className="text-red-500">*</span>
            </label>
            <Input 
              type="text" 
              name="class_type" 
              defaultValue={initialData?.class_type || ''}
              required
              placeholder="Ej. Bachata, Salsa, Fit"
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-pink-500" /> Costo (S/.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-medium">S/.</span>
              <Input 
                type="number" 
                name="price" 
                defaultValue={initialData?.price}
                step="0.01" 
                min="0"
                required 
                placeholder="7.00"
                className="bg-background border-foreground/10 h-12 rounded-xl pl-10 pr-4 w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-pink-500" /> Número Vinculado <span className="text-red-500">*</span>
            </label>
            <Input 
              type="tel" 
              name="whatsapp_contact" 
              defaultValue={initialData?.whatsapp_contact || ''}
              required 
              placeholder="+51 930 154 128"
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-foreground/80 text-sm font-medium flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-pink-500" /> Cupos Disponibles <span className="text-red-500">*</span>
            </label>
            <Input 
              type="number" 
              name="capacity" 
              defaultValue={initialData?.capacity}
              min="1"
              required 
              placeholder="30"
              className="bg-background border-foreground/10 h-12 rounded-xl px-4 w-full"
            />
          </div>

          <div className="md:col-span-2 pt-4 space-y-3">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-[#D6007A] text-white font-bold h-14 rounded-xl flex justify-center items-center gap-2 hover:bg-[#D6007A]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#D6007A]/20"
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {sessionId ? 'Guardando...' : 'Publicando...'}</>
              ) : (sessionId ? 'Guardar Cambios' : 'Publicar Clase')}
            </button>
            
            <Link href={sessionId ? `/panel/clase/${sessionId}` : '/panel'}>
              <button 
                type="button" 
                className="w-full bg-white border border-foreground/10 text-black font-bold h-14 rounded-xl flex justify-center items-center hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-6">
          Los campos marcados con <span className="text-red-500">*</span> son obligatorios
        </p>
      </form>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in zoom-in duration-200">
          <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-foreground/50 hover:text-foreground transition-colors"
                disabled={isPending}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">¿Guardar cambios?</h3>
                <p className="text-foreground/70 text-sm">
                  Estás a punto de modificar la información de esta clase. Los alumnos verán estos cambios inmediatamente. ¿Deseas continuar?
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button 
                  onClick={() => pendingFormData && executeAction(pendingFormData)}
                  disabled={isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                  ) : (
                    'Sí, modificar clase'
                  )}
                </button>
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isPending}
                  className="w-full bg-transparent text-foreground/70 font-semibold rounded-xl py-3.5 hover:bg-foreground/5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
