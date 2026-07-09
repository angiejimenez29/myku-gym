'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  AlertCircle,
  Search,
  X,
  Users,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Reservation {
  id: string
  date: string
  time: string
  theme: string
  spots: string[]
}

import { getReservationsForCheckin, markAttendanceForReservation } from './actions'


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
    0%, 100% { box-shadow: 0 0 40px #D6007A70, 0 0 80px #9B00E830; }
    50%       { box-shadow: 0 0 70px #D6007AB0, 0 0 140px #9B00E860; }
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
              <stop offset="0%" stopColor="#D6007A" />
              <stop offset="100%" stopColor="#9B00E8" />
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
        style={{ background: 'linear-gradient(135deg, #D6007A, #9B00E8)' }}
      >
        <span className="text-white font-extrabold text-sm">M</span>
      </div>
      <span className="text-white font-semibold tracking-wide text-sm">Meikyo Gym</span>
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
          background: 'linear-gradient(135deg, #D6007A22, #9B00E822)',
          border: '1px solid #9B00E850',
        }}
      >
        <Phone size={28} style={{ color: '#D6007A' }} />
      </div>

      <h1 className="text-[26px] font-extrabold text-white leading-tight mb-3">
        ¡Hola! Registra<br />tu llegada
      </h1>
      <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Ingresa el número de celular con el que reservaste tus sitios.
      </p>

      {/* Input */}
      <label htmlFor="phone-input" className="sr-only">
        Número de celular
      </label>
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Phone size={15} style={{ color: '#9B00E8' }} />
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
          className="w-full pl-10 pr-4 py-4 rounded-2xl text-white font-medium text-base outline-none transition-shadow"
          style={{
            background: '#1a1530',
            border: '1px solid #9B00E840',
            caretColor: '#D6007A',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #9B00E8'
            e.currentTarget.style.boxShadow = '0 0 0 3px #9B00E820'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #9B00E840'
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
          background: 'linear-gradient(135deg, #D6007A, #9B00E8)',
          boxShadow:
            phone.trim().length >= 7 ? '0 4px 24px #D6007A55' : 'none',
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
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(21,18,38,0.9)',
        border: '1px solid #9B00E845',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Date & time row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} style={{ color: '#9B00E8' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {r.date}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} style={{ color: '#C084FC' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {r.time}
          </span>
        </div>
      </div>

      {/* Theme badge */}
      <div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block"
          style={{
            background: '#9B00E818',
            color: '#C084FC',
            border: '1px solid #9B00E850',
          }}
        >
          Temática: {r.theme}
        </span>
      </div>

      {/* Spots */}
      <div className="flex items-center gap-1.5">
        <Users size={12} style={{ color: '#D6007A' }} className="shrink-0" />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Lugares:{' '}
          {r.spots.map((s, i) => (
            <span key={s}>
              <span style={{ color: '#D6007A' }} className="font-bold">
                {s}
              </span>
              {i < r.spots.length - 1 && ', '}
            </span>
          ))}
        </span>
      </div>

      {/* CTA */}
      <button
        id={`btn-mark-attendance-${r.id}`}
        onClick={() => onMark(r)}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 mt-1"
        style={{
          background: 'transparent',
          border: '1.5px solid #9B00E8',
          color: '#D6007A',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#9B00E815'
          e.currentTarget.style.boxShadow = '0 0 14px #9B00E835'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        Marcar Asistencia
      </button>
    </div>
  )
}

function ScreenReservations({
  reservations,
  onMark,
}: {
  reservations: Reservation[]
  onMark: (r: Reservation) => void
}) {
  return (
    <div className="flex flex-col flex-1">
      <LogoBadge />

      <h1 className="text-[26px] font-extrabold text-white leading-tight mb-1">
        Tus próximas<br />reservas
      </h1>
      <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.38)' }}>
        Selecciona la clase a la que vas a asistir hoy.
      </p>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto pb-2">
        {reservations.map((r) => (
          <ReservationCard key={r.id} reservation={r} onMark={onMark} />
        ))}
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
        className="w-full rounded-3xl p-6 flex flex-col gap-4 relative"
        style={{
          background: '#16112A',
          border: '1px solid #9B00E865',
          boxShadow: '0 8px 48px #9B00E845',
        }}
      >
        {/* Dismiss X */}
        <button
          id="btn-modal-close"
          onClick={onCancel}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')
          }
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #D6007A1A, #9B00E81A)',
            border: '1px solid #9B00E855',
          }}
        >
          <AlertCircle size={28} style={{ color: '#C084FC' }} />
        </div>

        <h2
          id="modal-title"
          className="text-lg font-extrabold text-white text-center"
        >
          Confirmar Asistencia
        </h2>

        {/* Mini summary card */}
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(11,9,20,0.55)', border: '1px solid #9B00E830' }}
        >
          <p className="font-semibold text-sm" style={{ color: '#D6007A' }}>
            {reservation.date} · {reservation.time}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Lugares: {reservation.spots.join(', ')}
          </p>
        </div>

        <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Estás a punto de registrar tu ingreso y el de tus acompañantes para esta
          clase.{' '}
          <span style={{ color: 'rgba(255,255,255,0.82)' }}>¿Deseas continuar?</span>
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 mt-1">
          <button
            id="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Cancelar
          </button>
          <button
            id="btn-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D6007A, #9B00E8)',
              boxShadow: '0 4px 20px #D6007A50',
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
          background: 'linear-gradient(135deg, #D6007A, #9B00E8)',
          animation: 'circle-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both, glow-ring 2s ease-in-out 1s infinite',
        }}
      >
        {/* Blurred outer ring */}
        <div
          className="absolute -inset-3 rounded-full opacity-25 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #D6007A, #9B00E8)',
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
        className="text-[32px] font-extrabold text-white leading-tight mb-3 z-10"
        style={{ animation: 'fade-up 0.45s ease 0.85s both' }}
      >
        ¡Asistencia<br />Confirmada!
      </h1>

      <p
        className="text-sm leading-relaxed max-w-[260px] z-10"
        style={{
          color: 'rgba(255,255,255,0.5)',
          animation: 'fade-up 0.45s ease 1.05s both',
        }}
      >
        Tus sitios ya están registrados.{' '}
        <span style={{ color: '#D6007A' }} className="font-semibold">
          ¡A darlo todo en la rutina full fuego!
        </span>
      </p>

      <button
        id="btn-success-restart"
        onClick={onRestart}
        className="mt-10 px-8 py-4 rounded-full font-bold text-white text-base transition-all active:scale-95 z-10"
        style={{
          background: 'linear-gradient(135deg, #D6007A, #9B00E8)',
          boxShadow: '0 4px 28px #D6007A60',
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

export default function CheckinPage() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null)
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const data = await getReservationsForCheckin(phone)
      setReservations(data)
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
        style={{ background: '#0B0914' }}
      >
        {/* Mobile-width container */}
        <div
          className="relative w-full max-w-sm min-h-screen flex flex-col"
          style={{
            background: 'linear-gradient(165deg, #100d20 0%, #0B0914 100%)',
          }}
        >
          {/* Ambient radial gradient top */}
          <div
            className="absolute top-0 left-0 right-0 h-56 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 80% 55% at 50% 0%, #9B00E81C 0%, transparent 100%)',
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
              onCancel={() => setStep('reservations')}
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
