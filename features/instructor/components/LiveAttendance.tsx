"use client"

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { User, CheckCircle2, Users, MinusCircle } from 'lucide-react'
import { ManualCheckInModal } from './ManualCheckInModal'
import { ConfirmCheckInModal } from './ConfirmCheckInModal'

function getOccupationTextColor(percentage: number) {
  if (percentage < 50) return 'text-status-success'
  if (percentage < 90) return 'text-status-warning'
  return 'text-status-danger'
}

function getOccupationBgColor(percentage: number) {
  if (percentage < 50) return 'bg-status-success/20'
  if (percentage < 90) return 'bg-status-warning/20'
  return 'bg-status-danger/20'
}

export interface SpotData {
  spot_number: number
  status: 'available' | 'reserved' | 'present'
  reservation_spots?: {
    reservations?: {
      client_name: string
      estado_pago: string | null
      total_amount?: number
    }
  } | null
}

interface LiveAttendanceProps {
  sessionId: string
  capacity: number
  spots: SpotData[]
}

export function LiveAttendance({ sessionId, capacity, spots }: LiveAttendanceProps) {
  const [isPending] = useTransition()
  const [selectedFreeSpot, setSelectedFreeSpot] = useState<number | null>(null)
  const [selectedReservedSpot, setSelectedReservedSpot] = useState<number | null>(null)

  const allSpots = Array.from({ length: capacity }, (_, i) => {
    const spotNumber = i + 1
    const dbSpot = spots.find(s => s.spot_number === spotNumber)
    return {
      spot_number: spotNumber,
      status: dbSpot ? dbSpot.status : 'available',
      reservation_spots: dbSpot?.reservation_spots
    }
  })

  const countPresent = allSpots.filter(s => s.status === 'present').length
  const countReserved = allSpots.filter(s => s.status === 'reserved').length
  const countAvailable = allSpots.filter(s => s.status === 'available').length

  const totalOccupied = countPresent + countReserved
  const occupationPercentage = capacity > 0 ? (totalOccupied / capacity) * 100 : 0
  const occupationTextColor = getOccupationTextColor(occupationPercentage)
  const occupationBgColor = getOccupationBgColor(occupationPercentage)

  const handleSpotClick = (spotNumber: number, status: string) => {
    if (status === 'available') {
      setSelectedFreeSpot(spotNumber)
    } else {
      setSelectedReservedSpot(spotNumber)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-container border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-status-success" />
          </div>
          <span className="text-xl font-bold text-foreground">{countPresent}</span>
          <span className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Presentes</span>
        </div>
        
        <div className="bg-container border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
          <div className={`w-10 h-10 rounded-full ${occupationBgColor} flex items-center justify-center`}>
            <Users className={`w-5 h-5 ${occupationTextColor}`} />
          </div>
          <span className={`text-xl font-bold ${occupationTextColor}`}>{totalOccupied}/{capacity}</span>
          <span className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Reservados</span>
        </div>

        <div className="bg-container border border-foreground/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
            <MinusCircle className="w-5 h-5 text-foreground/50" />
          </div>
          <span className="text-xl font-bold text-foreground">{countAvailable}</span>
          <span className="text-[10px] text-foreground/70 uppercase tracking-wider font-semibold">Libres</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-container border border-foreground/5 rounded-3xl p-5 shadow-lg relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 rounded-3xl z-10 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-[280px] bg-brand rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg">
            <User className="w-5 h-5 text-white" />
            <span className="text-white font-semibold tracking-wide text-sm">INSTRUCTOR / ESPEJO</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-[280px] mx-auto mb-8">
          {allSpots.map(spot => {
            const isAvailable = spot.status === 'available'
            const isReserved = spot.status === 'reserved'
            const isPresent = spot.status === 'present'

            return (
              <button
                key={spot.spot_number}
                onClick={() => handleSpotClick(spot.spot_number, spot.status)}
                className={cn(
                  'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm',
                  isAvailable && 'bg-status-success/10 border border-status-success/30 text-status-success hover:bg-status-success/20',
                  isReserved && 'bg-status-warning text-white hover:brightness-110',
                  isPresent && 'bg-status-success text-black hover:brightness-110'
                )}
              >
                {spot.spot_number}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 max-w-[280px] mx-auto text-xs font-medium text-foreground/70">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-status-success/10 border border-status-success/30"></div>
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-status-warning"></div>
            <span>Reservado (pago verificado)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-status-success flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-black" />
            </div>
            <span>Presente (check-in confirmado)</span>
          </div>
        </div>
      </div>

      <ManualCheckInModal 
        sessionId={sessionId}
        spotNumber={selectedFreeSpot || 0}
        isOpen={selectedFreeSpot !== null}
        onClose={() => setSelectedFreeSpot(null)}
      />

      {selectedReservedSpot !== null && (() => {
        const spotInfo = allSpots.find(s => s.spot_number === selectedReservedSpot)
        const resData = spotInfo?.reservation_spots?.reservations
        const clientName = resData?.client_name || 'Cliente'
        const estadoPago = resData?.estado_pago || 'pendiente'
        
        return (
          <ConfirmCheckInModal
            sessionId={sessionId}
            spotNumber={selectedReservedSpot}
            clientName={clientName}
            estadoPago={estadoPago}
            status={spotInfo?.status as 'reserved' | 'present'}
            isOpen={true}
            onClose={() => setSelectedReservedSpot(null)}
          />
        )
      })()}
    </div>
  )
}
