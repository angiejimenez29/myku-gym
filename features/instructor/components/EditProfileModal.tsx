'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Loader2, Camera, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateInstructorProfile } from '../actions/updateInstructorProfile'
import { useRouter } from 'next/navigation'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [experience, setExperience] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && user?.id) {
      setIsLoading(true)
      setError(null)
      setAvatarFile(null)
      setAvatarPreview(null)

      supabase
        .from('instructors')
        .select('full_name, bio, whatsapp_phone, years_experience, profile_image_url')
        .eq('id', user.id)
        .single()
        .then(({ data, error: fetchErr }) => {
          if (fetchErr) {
            console.error('Error fetching profile:', fetchErr)
            setError('No se pudo cargar la información del perfil.')
          } else if (data) {
            setFullName(data.full_name || '')
            setWhatsapp(data.whatsapp_phone || '')
            setExperience(data.years_experience !== null ? String(data.years_experience) : '')
            setBio(data.bio || '')
            setAvatarUrl(data.profile_image_url || null)
          }
          setIsLoading(false)
        })
    }
  }, [isOpen, user?.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Clientside validations
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    if (!fullName.trim() || !nameRegex.test(fullName)) {
      setError('El nombre solo debe contener letras y espacios.')
      return
    }

    const whatsappRegex = /^9\d{8}$/
    if (!whatsapp.trim() || !whatsappRegex.test(whatsapp)) {
      setError('El número de WhatsApp debe tener exactamente 9 dígitos y comenzar con 9.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('fullName', fullName)
        formData.append('bio', bio)
        formData.append('whatsapp', whatsapp)
        formData.append('experience', experience)
        if (avatarFile) {
          formData.append('avatar', avatarFile)
        }

        await updateInstructorProfile(formData)

        // Show Toast
        setShowSuccessToast(true)
        setTimeout(() => {
          setShowSuccessToast(false)
          onClose()
          router.refresh()
        }, 2000)
      } catch (err: any) {
        setError(err.message || 'Error al guardar los cambios de perfil.')
      }
    })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-foreground max-h-[90vh] overflow-y-auto">
          {/* Close X */}
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="absolute top-4 right-4 text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold mb-1 font-heading">Editar Perfil</h2>
          <p className="text-foreground/70 text-xs mb-6">Actualiza tu información personal y foto de presentación.</p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-medium mb-4 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-foreground/50">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold">Cargando datos...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar upload */}
              <div className="flex flex-col items-center justify-center gap-3 pb-3 border-b border-foreground/5">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand/20 shadow-md relative bg-foreground/5">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30 font-bold text-3xl">
                        {fullName?.charAt(0).toUpperCase() || 'I'}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                  Foto de Perfil
                </span>
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                    setFullName(val)
                  }}
                  placeholder="Ej. María Gómez"
                  className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">WhatsApp / Teléfono *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={9}
                    value={whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setWhatsapp(val)
                    }}
                    placeholder="Ej. 987654321"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Años de Experiencia</label>
                  <input 
                    type="number" 
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Ej. 5"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Biografía</label>
                <textarea 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escribe algo sobre ti..."
                  className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-foreground/5">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl font-bold bg-foreground/5 text-foreground/80 hover:bg-foreground/10 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl font-bold bg-cta text-white hover:bg-cta/90 hover:scale-[1.01] transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-emerald-500 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-300">
          <span>✓ Perfil actualizado correctamente</span>
        </div>
      )}
    </>
  )
}
