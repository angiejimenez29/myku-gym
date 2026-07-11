"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, User, Dumbbell, Plus, X, Loader2, AlertTriangle } from 'lucide-react'
import type { Database } from '@/types/database.types'

import { createSessionAdmin } from '@/features/admin/actions/createSessionAdmin'
import { updateSessionAdmin } from '@/features/admin/actions/updateSessionAdmin'
import { cancelSessionAdmin } from '@/features/admin/actions/cancelSessionAdmin'
import { getCancelImpact } from '@/features/instructor/actions/cancelSession'

type SessionWithSpotsAndInstructor = Database['public']['Tables']['sessions']['Row'] & {
  instructors: { full_name: string | null } | null;
  session_spots: { status: string }[] | null;
}

type Instructor = Database['public']['Tables']['instructors']['Row']

function formatSessionDate(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    timeZone: 'America/Lima'
  }).format(date)
}

function formatSessionTime(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/Lima'
  }).format(date)
}

export default function AdminClasesPage() {
  const [sessions, setSessions] = useState<SessionWithSpotsAndInstructor[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionWithSpotsAndInstructor | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  // Custom modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelImpact, setCancelImpact] = useState<{ impactedReservations: number, totalRefundAmount: number } | null>(null)
  const [loadingCancelImpact, setLoadingCancelImpact] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Form states
  const [instructorId, setInstructorId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [specialGuest, setSpecialGuest] = useState('')
  const [theme, setTheme] = useState('')
  const [classType, setClassType] = useState('')
  const [price, setPrice] = useState('7.00')
  const [whatsappContact, setWhatsappContact] = useState('')
  const [capacity, setCapacity] = useState('30')
  const [status, setStatus] = useState<'draft' | 'published'>('published')

  const supabase = createClient()

  const fetchSessionsAndInstructors = async () => {
    try {
      const { data: sessData, error: sessErr } = await supabase
        .from('sessions')
        .select(`
          *,
          instructors (
            full_name
          ),
          session_spots (
            status
          )
        `)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (sessErr) throw sessErr

      const now = new Date()

      // Filter out published sessions that are in the past
      const activeSessions = (sessData || []).filter(session => {
        if (session.status === 'published') {
          const sessionDateTime = new Date(`${session.session_date}T${session.start_time}-05:00`)
          return sessionDateTime.getTime() >= now.getTime()
        }
        return true
      })

      // Sort sessions: published first, draft second, cancelled last
      const statusOrder = {
        published: 1,
        draft: 2,
        cancelled: 3
      }
      
      const sorted = activeSessions.sort((a, b) => {
        const orderA = statusOrder[a.status as keyof typeof statusOrder] || 99
        const orderB = statusOrder[b.status as keyof typeof statusOrder] || 99
        if (orderA !== orderB) {
          return orderA - orderB
        }
        // Within same status, sort chronologically
        const dateA = new Date(`${a.session_date}T${a.start_time}`).getTime()
        const dateB = new Date(`${b.session_date}T${b.start_time}`).getTime()
        return dateA - dateB
      })

      setSessions(sorted as any)

      const { data: instData, error: instErr } = await supabase
        .from('instructors')
        .select('*')
        .order('full_name', { ascending: true })

      if (instErr) throw instErr
      setInstructors(instData || [])
    } catch (err) {
      console.error('Error fetching global sessions/instructors:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionsAndInstructors()
  }, [])

  const handleOpenCreate = () => {
    setEditingSession(null)
    setInstructorId('')
    setSessionDate('')
    setStartTime('')
    setSpecialGuest('')
    setTheme('')
    setClassType('')
    setPrice('7.00')
    setWhatsappContact('')
    setCapacity('30')
    setStatus('published')
    setIsDropdownOpen(false)
    setIsStatusDropdownOpen(false)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (session: SessionWithSpotsAndInstructor) => {
    setEditingSession(session)
    setInstructorId(session.instructor_id || '')
    setSessionDate(session.session_date || '')
    setStartTime(session.start_time ? session.start_time.substring(0, 5) : '')
    setSpecialGuest(session.special_guest || '')
    setTheme(session.theme || '')
    setClassType(session.class_type || '')
    setPrice(session.price ? Number(session.price).toFixed(2) : '7.00')
    setWhatsappContact(session.whatsapp_contact || '')
    setCapacity(session.capacity ? session.capacity.toString() : '30')
    setStatus((session.status as 'draft' | 'published') || 'published')
    setIsDropdownOpen(false)
    setIsStatusDropdownOpen(false)
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsDropdownOpen(false)
    setIsStatusDropdownOpen(false)
    setEditingSession(null)
    setInstructorId('')
    setSessionDate('')
    setStartTime('')
    setSpecialGuest('')
    setTheme('')
    setClassType('')
    setPrice('7.00')
    setWhatsappContact('')
    setCapacity('30')
    setStatus('published')
    setModalError(null)
  }

  const handleOpenCancelConfirm = async () => {
    if (!editingSession) return
    setModalError(null)
    setCancelImpact(null)
    setLoadingCancelImpact(true)
    setIsCancelModalOpen(true)
    try {
      const impact = await getCancelImpact(editingSession.id)
      setCancelImpact(impact)
    } catch (err: any) {
      console.error(err)
      setModalError(err.message || 'Error al obtener el impacto de cancelación.')
    } finally {
      setLoadingCancelImpact(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setModalError(null)
    try {
      const payload = {
        instructorId,
        sessionDate,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        specialGuest,
        theme,
        classType,
        price: parseFloat(price) || 0,
        whatsappContact,
        capacity: parseInt(capacity) || 30,
        status
      }

      if (editingSession) {
        const res = await updateSessionAdmin(editingSession.id, payload)
        if (res.success) {
          handleCloseModal()
          fetchSessionsAndInstructors()
        }
      } else {
        const res = await createSessionAdmin(payload)
        if (res.success) {
          handleCloseModal()
          fetchSessionsAndInstructors()
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar la clase')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelSession = async () => {
    if (!editingSession) return
    setIsSubmitting(true)
    setModalError(null)
    try {
      const res = await cancelSessionAdmin(editingSession.id)
      if (res.success) {
        setIsCancelModalOpen(false)
        handleCloseModal()
        fetchSessionsAndInstructors()
      }
    } catch (err: any) {
      setModalError(err.message || 'Error al cancelar la clase')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getOccupation = (session: SessionWithSpotsAndInstructor) => {
    const reservedSpots = session.session_spots
      ? session.session_spots.filter((s) => s.status !== 'available').length
      : 0
    return {
      reserved: reservedSpots,
      capacity: session.capacity,
      percentage: session.capacity > 0 ? (reservedSpots / session.capacity) * 100 : 0
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-5 md:px-10 text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-heading">Clases Globales</h1>
            <p className="text-foreground/70 text-sm mt-1">Agenda general de todos los entrenadores</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-brand text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Programar Clase
          </button>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => {
              const { reserved, capacity, percentage } = getOccupation(session)
              const dateTimeStr = `${session.session_date}T${session.start_time}`
              const isCancelled = session.status === 'cancelled'

              return (
                <div 
                  key={session.id}
                  onClick={() => !isCancelled && handleOpenEdit(session)}
                  className={`bg-container border border-foreground/5 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-md ${
                    !isCancelled 
                      ? 'hover:border-brand/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99]' 
                      : 'opacity-60 select-none'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        session.status === 'published' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : isCancelled
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-foreground/10 text-foreground/70'
                      }`}>
                        {session.status === 'published' ? 'Publicada' : isCancelled ? 'Cancelada' : 'Borrador'}
                      </span>
                      <span className="text-sm font-bold text-cta">
                        S/ {Number(session.price).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold capitalize line-clamp-1 font-heading">{session.theme || 'Clase Myku'}</h3>
                      <p className="text-xs text-foreground/70 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-foreground/50" />
                        Instructor: <span className="text-foreground font-medium">{session.instructors?.full_name || 'Sin asignar'}</span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 text-sm text-foreground/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-foreground/50" />
                        <span className="capitalize">{formatSessionDate(dateTimeStr)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-foreground/50" />
                        <span>{formatSessionTime(dateTimeStr)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-foreground/5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-foreground/70">
                      <span>Cupos reservados</span>
                      <span className="font-bold text-foreground">{reserved} / {capacity}</span>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percentage < 50 ? 'bg-emerald-500' : percentage < 90 ? 'bg-status-warning' : 'bg-cta'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-container border border-foreground/5 rounded-3xl p-12 text-center shadow-md">
            <Dumbbell className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground font-heading">No hay clases programadas</h3>
            <p className="text-foreground/70 text-sm mt-1">Crea una nueva clase desde el botón superior.</p>
          </div>
        )}

        {/* Create/Edit Class Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl text-foreground max-h-[90vh] overflow-y-auto">
              <button 
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="absolute top-4 right-4 text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-2 font-heading">
                {editingSession ? 'Editar Clase Global' : 'Programar Nueva Clase'}
              </h2>
              <p className="text-foreground/70 text-xs mb-6">
                {editingSession 
                  ? 'Modifica las propiedades de la sesión. Los cambios serán inmediatos para los alumnos.' 
                  : 'Registra una nueva sesión en la agenda general del gimnasio.'}
              </p>

              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-medium mb-4 animate-fade-in">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Instructor select dropdown (Custom) */}
                <div className="relative">
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">
                    Instructor / Entrenador *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground text-left focus:outline-none focus:border-brand/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {instructorId 
                        ? (instructors.find(i => i.id === instructorId)?.full_name || 'Instructor seleccionado') 
                        : 'Selecciona un instructor...'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close the dropdown when clicking outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-1.5 bg-container border border-foreground/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-md">
                        <div className="max-h-48 overflow-y-auto p-1.5">
                          {instructors.length > 0 ? (
                            instructors.map((inst) => (
                              <button
                                key={inst.id}
                                type="button"
                                onClick={() => {
                                  setInstructorId(inst.id)
                                  setWhatsappContact(inst.whatsapp_phone || '')
                                  setIsDropdownOpen(false)
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center ${
                                  instructorId === inst.id
                                    ? 'bg-brand text-white'
                                    : 'text-foreground/80 hover:bg-foreground/5'
                                }`}
                              >
                                {inst.full_name || inst.email}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-xs text-foreground/40">
                              No hay instructores disponibles
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Fecha *</label>
                    <input 
                      type="date" 
                      required 
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Hora de Inicio *</label>
                    <input 
                      type="time" 
                      required 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Tipo de Clase *</label>
                    <input 
                      type="text" 
                      required 
                      value={classType}
                      onChange={(e) => setClassType(e.target.value)}
                      placeholder="Ej. Bachata, Salsa, Fit"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Costo (S/.) *</label>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="7.00"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">WhatsApp Contacto *</label>
                    <input 
                      type="tel" 
                      required 
                      value={whatsappContact}
                      onChange={(e) => setWhatsappContact(e.target.value)}
                      placeholder="Ej. 987654321"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Cupos / Capacidad *</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="30"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Invitado Especial</label>
                    <input 
                      type="text" 
                      value={specialGuest}
                      onChange={(e) => setSpecialGuest(e.target.value)}
                      placeholder="Ej. Ashly G."
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Temática del Día</label>
                    <input 
                      type="text" 
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="Ej. Turquesa y Negro"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/35 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Status select dropdown (Custom) */}
                <div className="relative">
                  <label className="block text-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">
                    Estado *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground text-left focus:outline-none focus:border-brand/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {status === 'published' ? 'Publicada' : 'Borrador'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isStatusDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close the dropdown when clicking outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsStatusDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 mt-1.5 bg-container border border-foreground/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-md">
                        <div className="p-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStatus('published')
                              setIsStatusDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center ${
                              status === 'published'
                                ? 'bg-brand text-white'
                                : 'text-foreground/80 hover:bg-foreground/5'
                            }`}
                          >
                            Publicada
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatus('draft')
                              setIsStatusDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center mt-1 ${
                              status === 'draft'
                                ? 'bg-brand text-white'
                                : 'text-foreground/80 hover:bg-foreground/5'
                            }`}
                          >
                            Borrador
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between">
                  {editingSession && (
                    <button 
                      type="button"
                      onClick={handleOpenCancelConfirm}
                      disabled={isSubmitting}
                      className="py-3.5 px-4 rounded-xl font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer text-sm shrink-0"
                    >
                      Cancelar Clase
                    </button>
                  )}
                  <div className="flex gap-3 flex-1">
                    <button 
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors disabled:opacity-50 text-sm"
                    >
                      Cerrar
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
                        editingSession ? 'Guardar Cambios' : 'Crear Clase'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Session Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-foreground">
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h2 className="text-xl font-bold font-heading">
                  ¿Cancelar Clase?
                </h2>
              </div>
              <p className="text-foreground/70 text-sm mb-4">
                Esta acción cancelará la clase y deberás gestionar el reembolso de los alumnos afectados. ¿Deseas continuar?
              </p>

              {loadingCancelImpact ? (
                <div className="flex items-center gap-2 text-xs text-foreground/50 mb-4 bg-foreground/5 p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  Calculando impacto de la cancelación...
                </div>
              ) : cancelImpact ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-xs font-semibold mb-4 space-y-2">
                  <p className="font-bold flex items-center gap-1">
                    Resumen de afectación:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-500/10">
                    <div>
                      <span className="text-foreground/60 block">Reservas afectadas</span>
                      <strong className="text-sm text-rose-500">{cancelImpact.impactedReservations} alumnos</strong>
                    </div>
                    <div>
                      <span className="text-foreground/60 block">Monto a reembolsar</span>
                      <strong className="text-sm text-rose-500">S/ {Number(cancelImpact.totalRefundAmount).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-sm font-medium mb-4">
                  {modalError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors disabled:opacity-50 text-sm cursor-pointer text-foreground/80 font-medium"
                >
                  Mantener clase
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Sí, cancelar clase'
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
