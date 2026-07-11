"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Mail, Phone, Award, User, X, Loader2 } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  // Form states (mocked)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [experience, setExperience] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function fetchInstructors() {
      try {
        const { data, error } = await supabase
          .from('instructors')
          .select('*')
          .order('full_name', { ascending: true })

        if (error) throw error
        setInstructors(data || [])
      } catch (err) {
        console.error('Error fetching instructors:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInstructors()
  }, [supabase])

  const handleAddMockInstructor = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Funcionalidad de maqueta: En una versión real, esto guardaría el perfil del instructor en Supabase Auth y la tabla instructors.')
    setIsModalOpen(false)
    // Clear form
    setFullName('')
    setEmail('')
    setWhatsapp('')
    setExperience('')
    setBio('')
  }

  return (
    <div className="min-h-screen bg-background py-8 px-5 md:px-10 text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-heading">Gestión de Instructores</h1>
            <p className="text-foreground/70 text-sm mt-1">Administra el personal del gimnasio</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Agregar Instructor
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : instructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((inst) => (
              <div 
                key={inst.id} 
                className="bg-container border border-foreground/5 rounded-3xl p-6 flex flex-col justify-between hover:border-brand/20 transition-all duration-300 relative overflow-hidden group shadow-md"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                      {inst.profile_image_url ? (
                        <img 
                          src={inst.profile_image_url} 
                          alt={inst.full_name || 'Instructor'} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      ) : (
                        inst.full_name?.charAt(0).toUpperCase() || <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-cta transition-colors font-heading">{inst.full_name || 'Sin nombre'}</h3>
                      <p className="text-foreground/50 text-xs flex items-center gap-1 mt-0.5">
                        <Award className="w-3.5 h-3.5 text-cta" /> {inst.years_experience || 0} años de experiencia
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6 pt-4 border-t border-foreground/5 text-sm text-foreground/70">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-foreground/50" />
                      <span className="truncate">{inst.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-foreground/50" />
                      <span>{inst.whatsapp_phone || 'No registrado'}</span>
                    </div>
                  </div>

                  {inst.bio && (
                    <p className="text-xs text-foreground/50 mt-4 line-clamp-3 leading-relaxed">
                      {inst.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-container border border-foreground/5 rounded-3xl p-12 text-center shadow-md">
            <User className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground font-heading">No hay instructores registrados</h3>
            <p className="text-foreground/70 text-sm mt-1">Registra un nuevo instructor para comenzar a programar clases.</p>
          </div>
        )}

        {/* Mock Add Instructor Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-foreground">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-2 font-heading">Agregar Nuevo Instructor</h2>
              <p className="text-foreground/70 text-xs mb-6">
                Completa los datos del perfil para el nuevo miembro del equipo.
              </p>

              <form onSubmit={handleAddMockInstructor} className="space-y-4">
                <div>
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María Gómez"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="maria@mykugym.com"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">WhatsApp</label>
                    <input 
                      type="tel" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+51 987 654 321"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Años de Experiencia</label>
                  <input 
                    type="number" 
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Ej. 4"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Biografía</label>
                  <textarea 
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Breve descripción del instructor..."
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl font-bold bg-brand text-white hover:bg-brand/90 hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
