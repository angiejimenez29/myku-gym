'use client'

import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

export interface Spot {
  id?: string
  spot_number: number
  status: 'available' | 'reserved' | 'present'
}

interface SpaceGridProps {
  spots: Spot[]
  capacity: number
  selectedSpots: number[]
  onToggleSpot: (spotNumber: number) => void
}

export function SpaceGrid({ spots, capacity, selectedSpots, onToggleSpot }: SpaceGridProps) {
  // Generate all grid spots based on capacity
  const allSpots = Array.from({ length: capacity }, (_, i) => {
    const spotNumber = i + 1
    const dbSpot = spots.find(s => s.spot_number === spotNumber)
    return {
      spot_number: spotNumber,
      status: dbSpot ? dbSpot.status : 'available'
    }
  })

  return (
    <div className="w-full flex flex-col items-center">
      {/* Instructor / Mirror Area */}
      <div className="w-full max-w-[320px] bg-brand rounded-xl py-3 px-4 flex items-center justify-center gap-2 mb-8 shadow-lg shadow-brand/20">
        <User className="w-5 h-5 text-white" />
        <span className="text-white font-medium tracking-wide">INSTRUCTOR / ESPEJO</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-3 max-w-[320px] mx-auto mb-8">
        {allSpots.map(spot => {
          const isSelected = selectedSpots.includes(spot.spot_number)
          const isAvailable = spot.status === 'available'

          return (
            <button
              key={spot.spot_number}
              disabled={!isAvailable}
              onClick={() => isAvailable && onToggleSpot(spot.spot_number)}
              className={cn(
                'w-12 h-12 rounded-lg flex flex-row items-center justify-center gap-1 font-bold transition-all border cursor-pointer',
                !isAvailable && 'bg-foreground/5 text-foreground/30 cursor-not-allowed border-foreground/10',
                isAvailable && !isSelected && 'bg-teal-50/50 text-brand-text border-teal-300 hover:bg-teal-100/70 hover:border-teal-400 dark:bg-transparent dark:text-emerald-400 dark:border-emerald-500 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-600',
                isSelected && 'bg-cta text-white ring-2 ring-cta scale-105 border-transparent shadow-lg shadow-cta/20'
              )}
            >
              <User className={cn("w-3.5 h-3.5", isSelected ? 'text-white' : (isAvailable ? 'text-brand-text dark:text-emerald-400' : 'text-foreground/30'))} />
              <span className="text-[11px] leading-none">{spot.spot_number}</span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 w-full max-w-[320px] text-sm text-foreground/70">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-teal-50/50 border border-teal-300 dark:bg-transparent dark:border-emerald-500"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-cta shadow-sm shadow-cta/20"></div>
          <span>Tu selección</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-foreground/5 border border-foreground/10 flex items-center justify-center">
            <User className="w-3 h-3 text-foreground/30" />
          </div>
          <span>Ocupado</span>
        </div>
      </div>
    </div>
  )
}
