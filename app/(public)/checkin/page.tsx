'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  AlertCircle,
  Search,
  X,
  Users,
  Flame,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Reservation {
  id: string
  date: string
  time: string
  theme: string
  spots: string[]
  isCheckedIn?: boolean
}

import { getReservationsForCheckin, markAttendanceForReservation, getStreakForCheckin, getReservationForCheckin } from './actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ─── Inline keyframes injected once ─────────────────────────────────────────
const KEYFRAMES = `
  @keyframes sparkle-pulse {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.4; }
    50%       { transform: scale(1.5) rotate(20deg); opacity: 1; }
  }
  @keyframes check-draw {
    0%   { stroke-dashoffset: 60; opacity: 0; }
    40%  { opacity: 1; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes circle-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    60%  { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glow-ring {
    0%, 100% { box-shadow: 0 0 40px rgba(19, 122, 127, 0.7), 0 0 80px rgba(134, 206, 203, 0.3); }
    50%       { box-shadow: 0 0 70px #137A7FB0, 0 0 140px #86CECB60; }
  }
`

// ─── Sparkle particles (success screen decoration) ───────────────────────────
const PARTICLES = [
  { top: '7%',  left: '8%',  size: 11, delay: '0s',   opacity: 0.7 },
  { top: '12%', left: '82%', size: 14, delay: '0.4s', opacity: 0.55 },
  { top: '28%', left: '4%',  size: 8,  delay: '0.8s', opacity: 0.6 },
  { top: '22%', left: '90%', size: 10, delay: '0.2s', opacity: 0.8 },
  { top: '52%', left: '2%',  size: 12, delay: '1s',   opacity: 0.45 },
  { top: '58%', left: '93%', size: 8,  delay: '0.6s', opacity: 0.7 },
  { top: '74%', left: '14%', size: 10, delay: '0.3s', opacity: 0.5 },
  { top: '79%', left: '77%', size: 14, delay: '0.9s', opacity: 0.6 },
  { top: '89%', left: '44%', size: 8,  delay: '0.15s',opacity: 0.5 },
  { top: '44%', left: '49%', size: 6,  delay: '1.2s', opacity: 0.35 },
]

function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <svg
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `sparkle-pulse 2.6s ease-in-out ${p.delay} infinite`,
          }}
          viewBox="0 0 20 20"
          fill="none"
        >
          <defs>
            <linearGradient id={`sg${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#137A7F" />
              <stop offset="100%" stopColor="#86CECB" />
            </linearGradient>
          </defs>
          <path
            d="M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4 Z"
            fill={`url(#sg${i})`}
          />
        </svg>
      ))}
    </div>
  )
}

// ─── Gym logo badge ───────────────────────────────────────────────────────────
function LogoBadge() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(135deg, #137A7F, #86CECB)' }}
      >
        <span className="text-white font-extrabold text-sm">M</span>
      </div>
      <span className="text-foreground font-semibold tracking-wide text-sm">Myku Gym</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Phone input
// ═══════════════════════════════════════════════════════════════════════════════
function ScreenPhone({
  phone,
  onChange,
  onSearch,
  isLoading,
}: {
  phone: string
  onChange: (v: string) => void
  onSearch: () => void
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col flex-1">
      <LogoBadge />

      {/* Hero icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #137A7F22, #86CECB22)',
          border: '1px solid #86CECB50',
        }}
      >
        <Phone size={28} className="text-brand" />
      </div>

      <h1 className="text-[26px] font-extrabold text-foreground leading-tight mb-3">
        ¡Hola! Registra<br />tu llegada
      </h1>
      <p className="text-sm leading-relaxed mb-8 text-foreground/60">
        Ingresa el número de celular con el que reservaste tus sitios.
      </p>

      {/* Input */}
      <label htmlFor="phone-input" className="sr-only">
        Número de celular
      </label>
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Phone size={15} className="text-brand-secondary" />
        </span>
        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, '').slice(0, 12))
          }
          placeholder="Ej. 930154128"
          className="w-full pl-10 pr-4 py-4 rounded-2xl text-foreground font-medium text-base outline-none transition-shadow"
          style={{
            background: 'var(--background)',
            border: '1px solid #86CECB40',
            caretColor: 'var(--brand)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #86CECB'
            e.currentTarget.style.boxShadow = '0 0 0 3px #86CECB20'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #86CECB40'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      <button
        id="btn-search-reservations"
        onClick={onSearch}
        disabled={phone.trim().length < 7 || isLoading}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #137A7F, #86CECB)',
          boxShadow:
            phone.trim().length >= 7 ? '0 4px 24px #137A7F55' : 'none',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            'Buscando...'
          ) : (
            <>
              <Search size={17} />
              Buscar mis reservas
            </>
          )}
        </span>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Reservations list
// ═══════════════════════════════════════════════════════════════════════════════
function ReservationCard({
  reservation: r,
  onMark,
}: {
  reservation: Reservation
  onMark: (r: Reservation) => void
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 bg-container border border-foreground/10 shadow-sm"
    >
      {/* Date & time row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-brand" />
          <span className="text-sm font-semibold text-foreground">
            {r.date}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-brand" />
          <span className="text-sm font-semibold text-foreground">
            {r.time}
          </span>
        </div>
      </div>

      {/* Theme badge */}
      <div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block bg-brand/10 text-brand border border-brand/20"
        >
          Temática: {r.theme}
        </span>
      </div>

      {/* Spots */}
      <div className="flex items-center gap-1.5">
        <Users size={12} className="text-brand shrink-0" />
        <span className="text-xs text-foreground/60">
          Lugares:{' '}
          {r.spots.map((s, i) => (
            <span key={s}>
              <span className="text-brand font-bold">
                {s}
              </span>
              {i < r.spots.length - 1 && ', '}
            </span>
          ))}
        </span>
      </div>

      {/* CTA or Status */}
      {!r.isCheckedIn ? (
        <button
          id={`btn-mark-attendance-${r.id}`}
          onClick={() => onMark(r)}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-1 border border-brand text-brand bg-transparent hover:bg-brand/5 hover:shadow-lg hover:shadow-brand/5 cursor-pointer"
        >
          Marcar Asistencia
        </button>
      ) : (
        <div 
          className="w-full py-2.5 rounded-xl text-xs font-bold mt-1 flex items-center justify-center gap-1.5 bg-brand/10 border border-brand/20 text-brand"
        >
          <span>Asistencia registrada</span>
        </div>
      )}
    </div>
  )
}

function ScreenReservations({
  reservations,
  streak,
  onMark,
}: {
  reservations: Reservation[]
  streak: any
  onMark: (r: Reservation) => void
}) {
  const pending = reservations.filter(r => !r.isCheckedIn)
  const checkedIn = reservations.filter(r => r.isCheckedIn)

  // Calculate urgency
  let isUrgent = false
  if (streak?.last_reservation_week) {
    const lastWeekDate = new Date(`${streak.last_reservation_week}T12:00:00Z`)
    const weekAfterLast = new Date(lastWeekDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const todayDay = today.getDay()
    
    const diff = todayDay === 0 ? -6 : 1 - todayDay
    const thisMonday = new Date(today)
    thisMonday.setDate(today.getDate() + diff)
    
    if (thisMonday.toISOString().slice(0, 10) === weekAfterLast.toISOString().slice(0, 10)) {
      if (todayDay === 5 || todayDay === 6 || todayDay === 0) {
        isUrgent = true
      }
    }
  }

  const spotsToFreeClass = streak ? (6 - (streak.classes_count % 6)) : 6

  return (
    <div className="flex flex-col flex-1">
      <LogoBadge />

      <h1 className="text-[26px] font-extrabold text-foreground leading-tight mb-1">
        Tus próximas<br />reservas
      </h1>
      <p className="text-xs mb-6 text-foreground/60">
        {pending.length > 0 
          ? "Selecciona la clase a la que vas a asistir hoy."
          : checkedIn.length > 0
            ? "No tienes clases programadas por ahora. Aquí está tu historial reciente."
            : "Explora nuestras sesiones y asegura tu lugar."}
      </p>

      {/* STREAK UI */}
      {streak && streak.current_week_streak > 0 && (
        <div 
          className="mb-8 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden border"
          style={{ 
            background: isUrgent ? 'rgba(245, 158, 11, 0.05)' : 'rgba(19, 122, 127, 0.05)',
            borderColor: isUrgent ? 'rgba(245, 158, 11, 0.3)' : 'rgba(19, 122, 127, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-status-warning/20 text-status-warning' : 'bg-brand/20 text-brand'}`}>
              <Flame size={24} className={isUrgent ? 'opacity-50' : 'animate-[sparkle-pulse_2s_ease-in-out_infinite]'} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-0.5">{streak.current_week_streak} semanas seguidas</p>
              {isUrgent ? (
                <p className="text-xs text-status-warning font-semibold max-w-[200px] leading-tight">
                  🔥 ¡No dejes que tu racha se enfríe! Reserva antes de que termine la semana.
                </p>
              ) : (
                <p className="text-xs font-medium text-foreground/60">
                  {streak.free_class_available ? (
                    <span className="text-cta">🎉 ¡Tienes una clase gratis disponible!</span>
                  ) : (
                    <span>{streak.classes_count % 6} de 6 clases — faltan {spotsToFreeClass} para tu clase gratis</span>
                  )}
                </p>
              )}
            </div>
          </div>
          
          {isUrgent && (
            <Link 
              href="/clases"
              className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all active:scale-95 text-white"
              style={{ background: 'var(--status-warning)' }}
            >
              Reservar ahora
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto pb-2">
        {/* PENDING SECTION */}
        {pending.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground/90">Pendientes</h2>
            {pending.map((r) => (
              <ReservationCard key={r.id} reservation={r} onMark={onMark} />
            ))}
          </div>
        )}

        {/* SEPARATOR */}
        {pending.length > 0 && checkedIn.length > 0 && (
          <div className="w-full h-px bg-foreground/10" />
        )}

        {/* CHECKED IN SECTION */}
        {checkedIn.length > 0 && (
          <div className="flex flex-col gap-4 opacity-75">
            <h2 className="text-sm font-semibold text-foreground/70">Asistencia Registrada</h2>
            {checkedIn.map((r) => (
              <ReservationCard key={r.id} reservation={r} onMark={onMark} />
            ))}
          </div>
        )}
        
        {reservations.length === 0 && (
          <div className="text-center mt-6 flex flex-col items-center p-6 rounded-2xl border border-foreground/10 bg-foreground/5">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-brand">
              <Calendar size={28} />
            </div>
            <p className="text-sm text-foreground font-semibold mb-2">Aún no tienes clases reservadas.</p>
            <p className="text-xs text-foreground/50 mb-6 leading-relaxed">
              ¡Elige tu próxima sesión y sigue moviéndote! Tenemos nuevas rutinas esperándote.
            </p>
            <Link 
              href="/clases"
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #137A7F, #86CECB)',
              }}
            >
              Ver clases disponibles
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Confirmation modal overlay
// ═══════════════════════════════════════════════════════════════════════════════
function ConfirmModal({
  reservation,
  onCancel,
  onConfirm,
  isLoading,
}: {
  reservation: Reservation
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(11,9,20,0.85)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full rounded-3xl p-6 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200"
        style={{
          background: 'var(--background)',
          border: '1px solid #86CECB65',
          boxShadow: '0 8px 48px #86CECB45',
        }}
      >
        {/* Dismiss X */}
        <button
          id="btn-modal-close"
          onClick={onCancel}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 text-foreground/40 hover:text-foreground/80 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #137A7F1A, #86CECB1A)',
            border: '1px solid rgba(134, 206, 203, 0.55)',
          }}
        >
          <AlertCircle size={28} className="text-brand-secondary" />
        </div>

        <h2
          id="modal-title"
          className="text-lg font-extrabold text-foreground text-center"
        >
          Confirmar Asistencia
        </h2>

        {/* Mini summary card */}
        <div
          className="rounded-xl p-3 text-center bg-foreground/5 border border-foreground/10"
        >
          <p className="font-semibold text-sm text-brand">
            {reservation.date} · {reservation.time}
          </p>
          <p className="text-xs mt-0.5 text-foreground/60">
            Lugares: {reservation.spots.join(', ')}
          </p>
        </div>

        <p className="text-sm text-center leading-relaxed text-foreground/70">
          Estás a punto de registrar tu ingreso y el de tus acompañantes para esta
          clase.{' '}
          <span className="text-foreground/90 font-medium">¿Deseas continuar?</span>
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 mt-1">
          <button
            id="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 bg-foreground/5 border border-foreground/10 text-foreground/80 hover:bg-foreground/10"
          >
            Cancelar
          </button>
          <button
            id="btn-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #137A7F, #86CECB)',
              boxShadow: '0 4px 20px rgba(19, 122, 127, 0.5)',
            }}
          >
            {isLoading ? 'Guardando...' : (
              <>Sí, marcar<br />asistencia</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Success
// ═══════════════════════════════════════════════════════════════════════════════
function ScreenSuccess({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center text-center overflow-hidden px-2">
      <Sparkles />

      {/* Animated check circle */}
      <div
        className="relative w-32 h-32 rounded-full flex items-center justify-center mb-8 z-10"
        style={{
          background: 'linear-gradient(135deg, #137A7F, #86CECB)',
          animation: 'circle-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both, glow-ring 2s ease-in-out 1s infinite',
        }}
      >
        {/* Blurred outer ring */}
        <div
          className="absolute -inset-3 rounded-full opacity-25 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #137A7F, #86CECB)',
            filter: 'blur(14px)',
          }}
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 52 52"
          width="58"
          height="58"
          aria-hidden="true"
          className="relative z-10"
        >
          <polyline
            points="14,27 22,36 38,18"
            fill="none"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            style={{ animation: 'check-draw 0.55s ease 0.45s both' }}
          />
        </svg>
      </div>

      <h1
        className="text-[32px] font-extrabold text-foreground leading-tight mb-3 z-10"
        style={{ animation: 'fade-up 0.45s ease 0.85s both' }}
      >
        ¡Asistencia<br />Confirmada!
      </h1>

      <p
        className="text-sm leading-relaxed max-w-[260px] z-10 text-foreground/60"
        style={{
          animation: 'fade-up 0.45s ease 1.05s both',
        }}
      >
        Tus sitios ya están registrados.{' '}
        <span className="text-brand font-semibold">
          ¡A darlo todo en la rutina full fuego!
        </span>
      </p>

      <button
        id="btn-success-restart"
        onClick={onRestart}
        className="mt-10 px-8 py-4 rounded-full font-bold text-white text-base transition-all active:scale-95 z-10"
        style={{
          background: 'linear-gradient(135deg, #137A7F, #86CECB)',
          boxShadow: '0 4px 28px rgba(19, 122, 127, 0.6)',
          animation: 'fade-up 0.45s ease 1.25s both',
        }}
      >
        Volver al inicio
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type Step = 'phone' | 'reservations' | 'confirm' | 'success'

function CheckinContent() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null)
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const reservaIdParam = searchParams.get('reservaId')

  useEffect(() => {
    if (reservaIdParam) {
      setIsLoading(true)
      getReservationForCheckin(reservaIdParam)
        .then((res) => {
          if (res) {
            setSelectedReservation(res)
            setStep('confirm')
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [reservaIdParam])

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const [data, streakData] = await Promise.all([
        getReservationsForCheckin(phone),
        getStreakForCheckin(phone)
      ])
      setReservations(data)
      setStreak(streakData)
      setStep('reservations')
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedReservation) return
    setIsLoading(true)
    try {
      await markAttendanceForReservation(selectedReservation.id)
      setStep('success')
    } catch (error) {
      console.error(error)
      alert('Error al registrar la asistencia. Inténtalo nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Inject global keyframes once */}
      <style>{KEYFRAMES}</style>

      {/* Full-screen dark wrapper */}
      <div
        className="min-h-screen flex items-start justify-center"
        style={{ background: 'var(--background)' }}
      >
        {/* Mobile-width container */}
        <div
          className="relative w-full max-w-sm min-h-screen flex flex-col"
          style={{
            background: 'var(--background)',
          }}
        >
          {/* Ambient radial gradient top */}
          <div
            className="absolute top-0 left-0 right-0 h-56 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(134, 206, 203, 0.11) 0%, transparent 100%)',
            }}
          />

          {/* Content area */}
          <div
            className="relative flex flex-col flex-1 px-6 pt-12 pb-8"
            style={{ zIndex: 1 }}
          >
            {step === 'phone' && (
              <ScreenPhone
                phone={phone}
                onChange={setPhone}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            )}

            {(step === 'reservations' || step === 'confirm') && (
              <ScreenReservations
                reservations={reservations}
                streak={streak}
                onMark={(r) => {
                  setSelectedReservation(r)
                  setStep('confirm')
                }}
              />
            )}

            {step === 'success' && (
              <ScreenSuccess
                onRestart={() => {
                  setPhone('')
                  setSelectedReservation(null)
                  setStep('phone')
                }}
              />
            )}
          </div>

          {/* Confirmation modal (overlay) */}
          {step === 'confirm' && selectedReservation && (
            <ConfirmModal
              reservation={selectedReservation}
              onCancel={() => {
                if (reservaIdParam) {
                  setStep('phone')
                } else {
                  setStep('reservations')
                }
              }}
              onConfirm={handleConfirm}
              isLoading={isLoading}
            />
          )}

          {/* Bottom safe-area spacer */}
          <div className="h-6" />
        </div>
      </div>
    </>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold">Cargando...</p>
        </div>
      </div>
    }>
      <CheckinContent />
    </Suspense>
  )
}
