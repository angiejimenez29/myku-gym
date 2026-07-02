'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SpaceGrid, Spot } from './SpaceGrid'
import { Input } from '@/features/shared/components/Input'
import { createPendingReservation } from '@/features/booking/actions/createPendingReservation'
import { Loader2, X } from 'lucide-react'

interface SpaceSelectionFlowProps {
  sessionId: string
  spots: Spot[]
  capacity: number
}

export function SpaceSelectionFlow({ sessionId, spots, capacity }: SpaceSelectionFlowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedSpots, setSelectedSpots] = useState<number[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    try {
      const savedName = localStorage.getItem('meykogym_client_name')
      const savedPhone = localStorage.getItem('meykogym_client_phone')
      if (savedName) setName(savedName)
      if (savedPhone) setPhone(savedPhone)
    } catch (e) {
      // ignore localStorage errors (e.g., in incognito mode)
    }
  }, [])

  const handleToggleSpot = (spot: number) => {
    setSelectedSpots(prev => {
      if (prev.includes(spot)) {
        return prev.filter(s => s !== spot)
      } else {
        return [...prev, spot].sort((a, b) => a - b)
      }
    })
  }

  const isNameFormatValid = name === '' || /^[A-Za-zÀ-ÿ\s]+$/.test(name)
  const isNameComplete = name.trim().split(' ').filter(Boolean).length >= 2
  const isNameValid = name.length > 0 && isNameFormatValid && isNameComplete

  const isPhoneFormatValid = phone === '' || /^9\d{8}$/.test(phone)
  const isPhoneValid = phone.length === 9 && isPhoneFormatValid

  const handleContinue = () => {
    if (selectedSpots.length === 0 || !isNameValid || !isPhoneValid) return

    startTransition(async () => {
      try {
        localStorage.setItem('meykogym_client_name', name.trim())
        localStorage.setItem('meykogym_client_phone', phone)
      } catch (e) {
        // ignore
      }

      const formData = new FormData()
      formData.set('sessionId', sessionId)
      formData.set('spots', selectedSpots.join(','))
      formData.set('clientName', name.trim())
      formData.set('clientPhone', phone)

      try {
        await createPendingReservation(formData)
      } catch (error: any) {
        alert(error.message || 'Ocurrió un error al reservar.')
      }
    })
  }

  return (
    <div className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left column: Grid */}
        <div className="md:col-span-7">
          <SpaceGrid 
            spots={spots} 
            capacity={capacity} 
            selectedSpots={selectedSpots} 
            onToggleSpot={handleToggleSpot} 
          />
        </div>

        {/* Right column: Form Card (Desktop only) */}
        <div className="hidden md:block md:col-span-5">
          <div 
            className={`bg-container p-6 rounded-2xl border border-foreground/5 shadow-lg transition-all duration-300 ${
              selectedSpots.length > 0 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-40 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            {selectedSpots.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-foreground font-semibold text-lg">Resumen de Selección</h3>
                
                <div className="bg-background border border-state-yellow/30 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-foreground/80 text-xs">
                    {selectedSpots.length === 1 ? 'Espacio seleccionado' : 'Espacios seleccionados'}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {selectedSpots.map(s => (
                       <button 
                         key={s} 
                         onClick={() => handleToggleSpot(s)} 
                         title="Deseleccionar espacio"
                         className="flex items-center gap-1 bg-state-yellow/10 border border-state-yellow/50 text-state-yellow text-xl font-bold px-3 py-1 rounded-lg hover:bg-state-yellow hover:text-black transition-colors"
                       >
                         #{s} <X className="w-4 h-4 ml-1 opacity-70" />
                       </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="client-name-desktop" className="text-foreground/80 text-xs ml-1 mb-1 block">Nombre Completo</label>
                    <Input 
                      id="client-name-desktop"
                      value={name}
                      autoComplete="name"
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej. Luz Maria Begonias"
                      className={`bg-background text-foreground transition-colors ${name.length > 0 && !isNameValid ? 'border-red-400/50 focus:border-red-400' : 'border-foreground/10'}`}
                    />
                    {name.length > 0 && !isNameFormatValid && (
                       <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El nombre solo debe contener letras y espacios.</span>
                    )}
                    {name.length > 0 && isNameFormatValid && !isNameComplete && (
                       <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">Ingresa tu nombre y apellido.</span>
                    )}
                  </div>
                  <div>
                    <label htmlFor="client-phone-desktop" className="text-foreground/80 text-xs ml-1 mb-1 block">Número de Celular</label>
                    <Input 
                      id="client-phone-desktop"
                      value={phone}
                      autoComplete="tel"
                      inputMode="tel"
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ej. 956632585"
                      maxLength={9}
                      type="tel"
                      className={`bg-background text-foreground transition-colors ${phone.length > 0 && !isPhoneValid ? 'border-red-400/50 focus:border-red-400' : 'border-foreground/10'}`}
                    />
                    {phone.length > 0 && !isPhoneFormatValid && (
                       <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El número debe empezar con 9 y tener 9 dígitos numéricos.</span>
                    )}
                    {phone.length > 0 && isPhoneFormatValid && phone.length < 9 && (
                       <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El número debe tener 9 dígitos.</span>
                    )}
                  </div>
                </div>

                <button 
                  disabled={!isNameValid || !isPhoneValid || selectedSpots.length === 0 || isPending}
                  onClick={handleContinue}
                  className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Continuar al Pago
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-foreground/50 space-y-2">
                <p className="font-medium text-sm">¿Dónde deseas entrenar?</p>
                <p className="text-xs text-foreground/70">Selecciona uno o más espacios en el mapa para completar tu reserva.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Form (Mobile only) */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 w-full bg-container/95 backdrop-blur-xl border-t border-foreground/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 px-6 pb-8 z-50 transition-transform duration-300 ${selectedSpots.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-background border border-state-yellow/30 rounded-xl p-3 flex flex-col items-center justify-center mb-4">
             <span className="text-foreground/80 text-xs">
                {selectedSpots.length === 1 ? 'Espacio seleccionado' : 'Espacios seleccionados'}
             </span>
             <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {selectedSpots.map(s => (
                   <button 
                     key={s} 
                     onClick={() => handleToggleSpot(s)} 
                     title="Deseleccionar espacio"
                     className="flex items-center gap-1 bg-state-yellow/10 border border-state-yellow/50 text-state-yellow text-xl font-bold px-3 py-1 rounded-lg hover:bg-state-yellow hover:text-black transition-colors"
                   >
                     #{s} <X className="w-4 h-4 ml-1 opacity-70" />
                   </button>
                ))}
             </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="client-name" className="text-foreground/80 text-xs ml-1 mb-1 block">Nombre Completo</label>
              <Input 
                id="client-name"
                value={name}
                autoComplete="name"
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Luz Maria Begonias"
                className={`bg-background text-foreground transition-colors ${name.length > 0 && !isNameValid ? 'border-red-400/50 focus:border-red-400' : 'border-foreground/10'}`}
              />
              {name.length > 0 && !isNameFormatValid && (
                 <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El nombre solo debe contener letras y espacios.</span>
              )}
              {name.length > 0 && isNameFormatValid && !isNameComplete && (
                 <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">Ingresa tu nombre y apellido.</span>
              )}
            </div>
            <div>
              <label htmlFor="client-phone" className="text-foreground/80 text-xs ml-1 mb-1 block">Número de Celular</label>
              <Input 
                id="client-phone"
                value={phone}
                autoComplete="tel"
                inputMode="tel"
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej. 956632585"
                maxLength={9}
                type="tel"
                className={`bg-background text-foreground transition-colors ${phone.length > 0 && !isPhoneValid ? 'border-red-400/50 focus:border-red-400' : 'border-foreground/10'}`}
              />
              {phone.length > 0 && !isPhoneFormatValid && (
                 <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El número debe empezar con 9 y tener 9 dígitos numéricos.</span>
              )}
              {phone.length > 0 && isPhoneFormatValid && phone.length < 9 && (
                 <span className="text-red-400 text-xs font-medium ml-1 mt-1 block">El número debe tener 9 dígitos.</span>
              )}
            </div>
          </div>

          <button 
            disabled={!isNameValid || !isPhoneValid || selectedSpots.length === 0 || isPending}
            onClick={handleContinue}
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Continuar al Pago
          </button>
        </div>
      </div>
    </div>
  )
}
