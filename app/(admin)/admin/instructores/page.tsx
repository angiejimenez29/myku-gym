"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Mail, Phone, Award, User, X, Loader2, AlertTriangle } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

import { createInstructor } from '@/features/admin/actions/createInstructor'
import { updateInstructor } from '@/features/admin/actions/updateInstructor'
import { deleteInstructor } from '@/features/admin/actions/deleteInstructor'

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Custom modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [assignedClassesCount, setAssignedClassesCount] = useState<number | null>(null)
  const [loadingClassesCheck, setLoadingClassesCheck] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const supabase = createClient()

  // Form states
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

  const handleOpenCreate = () => {
    setEditingInstructor(null)
    setTempPassword(null)
    setFullName('')
    setEmail('')
    setWhatsapp('')
    setExperience('')
    setBio('')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (inst: Instructor) => {
    setEditingInstructor(inst)
    setTempPassword(null)
    setFullName(inst.full_name || '')
    setEmail(inst.email || '')
    setWhatsapp(inst.whatsapp_phone || '')
    setExperience(inst.years_experience?.toString() || '0')
    setBio(inst.bio || '')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingInstructor(null)
    setTempPassword(null)
    setFullName('')
    setEmail('')
    setWhatsapp('')
    setExperience('')
    setBio('')
    setModalError(null)
  }

  const handleOpenDeleteConfirm = async () => {
    if (!editingInstructor) return
    setModalError(null)
    setAssignedClassesCount(null)
    setLoadingClassesCheck(true)
    setIsDeleteModalOpen(true)
    try {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', editingInstructor.id)
        .neq('status', 'cancelled')
      
      if (!error) {
        setAssignedClassesCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingClassesCheck(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setModalError(null)
    try {
      if (editingInstructor) {
        // Edit mode
        const res = await updateInstructor(editingInstructor.id, {
          fullName,
          whatsapp,
          experience: Number(experience) || 0,
          bio
        })
        if (res.success) {
          handleCloseModal()
          // Refresh list
          const { data } = await supabase
            .from('instructors')
            .select('*')
            .order('full_name', { ascending: true })
          if (data) setInstructors(data)
        }
      } else {
        // Create mode
        const res = await createInstructor({
          fullName,
          email,
          whatsapp,
          experience: Number(experience) || 0,
          bio
        })
        
        if (res.success) {
          setTempPassword(res.tempPassword || '')
          // Refresh the list
          const { data } = await supabase
            .from('instructors')
            .select('*')
            .order('full_name', { ascending: true })
          if (data) setInstructors(data)
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar los datos del instructor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingInstructor) return
    setIsSubmitting(true)
    setModalError(null)
    try {
      const res = await deleteInstructor(editingInstructor.id)
      if (res.success) {
        setIsDeleteModalOpen(false)
        handleCloseModal()
        // Refresh list
        const { data } = await supabase
          .from('instructors')
          .select('*')
          .order('full_name', { ascending: true })
        if (data) setInstructors(data)
      }
    } catch (err: any) {
      setModalError(err.message || 'Error al eliminar el instructor.')
    } finally {
      setIsSubmitting(false)
    }
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
            onClick={handleOpenCreate}
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
                onClick={() => handleOpenEdit(inst)}
                className="bg-container border border-foreground/5 rounded-3xl p-6 flex flex-col justify-between hover:border-brand/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 relative overflow-hidden group shadow-md cursor-pointer"
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

        {/* Add Instructor Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-foreground">
              <button 
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="absolute top-4 right-4 text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              {tempPassword !== null ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold font-heading">¡Instructor Creado!</h3>
                  <p className="text-sm text-foreground/70">
                    Se ha registrado el perfil de <strong className="text-foreground">{fullName}</strong>.
                  </p>
                  
                  <div className="bg-background border border-foreground/10 rounded-2xl p-4 text-left space-y-2 mt-4">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider font-bold">Credenciales de Acceso</p>
                    <p className="text-sm">
                      <span className="font-medium text-foreground/60">Usuario/Email:</span> {email}
                    </p>
                    <div className="flex justify-between items-center bg-container border border-foreground/5 p-2.5 rounded-xl mt-1">
                      <code className="text-sm font-mono font-bold text-brand">{tempPassword}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${tempPassword}`)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="text-xs bg-brand/10 hover:bg-brand/20 text-brand font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {copied ? 'Copiado ✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-3.5 mt-6 rounded-xl font-bold bg-brand text-white hover:bg-brand/90 hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2 font-heading">
                    {editingInstructor ? 'Editar Perfil de Instructor' : 'Agregar Nuevo Instructor'}
                  </h2>
                  <p className="text-foreground/70 text-xs mb-6">
                    {editingInstructor 
                      ? 'Modifica los detalles del perfil del instructor seleccionado.' 
                      : 'Completa los datos del perfil para el nuevo miembro del equipo.'}
                  </p>

                  {modalError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-medium mb-4">
                      {modalError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Nombre Completo *</label>
                      <input 
                        type="text" 
                        required 
                        pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
                        title="Solo se permiten letras y espacios"
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
                        <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">
                          Correo Electrónico * {editingInstructor && '(No modificable)'}
                        </label>
                        <input 
                          type="email" 
                          required 
                          disabled={!!editingInstructor}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="maria@mykugym.com"
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors disabled:opacity-50 disabled:bg-foreground/5"
                        />
                      </div>
                      <div>
                        <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">WhatsApp *</label>
                        <input 
                          type="tel" 
                          required
                          maxLength={9}
                          pattern="9\d{8}"
                          title="Debe empezar con 9 y tener exactamente 9 dígitos"
                          value={whatsapp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            setWhatsapp(val)
                          }}
                          placeholder="Ej. 987654321"
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

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between">
                      {editingInstructor && (
                        <button 
                          type="button"
                          onClick={handleOpenDeleteConfirm}
                          disabled={isSubmitting}
                          className="py-3.5 px-4 rounded-xl font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer text-sm shrink-0"
                        >
                          Eliminar Instructor
                        </button>
                      )}
                      <div className="flex gap-3 flex-1">
                        <button 
                          type="button"
                          onClick={handleCloseModal}
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors disabled:opacity-50 text-sm"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 rounded-xl font-bold bg-brand text-white hover:bg-brand/90 hover:scale-[1.01] transition-transform cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            editingInstructor ? 'Guardar Cambios' : 'Guardar'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-foreground">
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h2 className="text-xl font-bold font-heading">
                  ¿Eliminar Instructor?
                </h2>
              </div>
              <p className="text-foreground/70 text-sm mb-4">
                Esta acción eliminará permanentemente al instructor <strong>{fullName}</strong> del sistema y no se puede deshacer. Se borrará su usuario de acceso de forma definitiva.
              </p>

              {loadingClassesCheck ? (
                <div className="flex items-center gap-2 text-xs text-foreground/50 mb-4 bg-foreground/5 p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  Verificando clases asignadas...
                </div>
              ) : assignedClassesCount !== null && assignedClassesCount > 0 ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs font-semibold mb-4 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    ⚠️ ADVERTENCIA:
                  </p>
                  <p>
                    Este instructor tiene <strong>{assignedClassesCount}</strong> clase(s) programada(s) activa(s). Al eliminarlo, deberás reasignar o cancelar estas clases para no interrumpir el servicio.
                  </p>
                </div>
              ) : null}

              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-medium mb-4">
                  {modalError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors disabled:opacity-50 text-sm cursor-pointer text-foreground/80"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Sí, eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
