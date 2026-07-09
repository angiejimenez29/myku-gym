import Link from 'next/link'
import { Calendar, Clock, User, Sparkles, Users, ChevronRight, Dumbbell } from 'lucide-react'

interface ClassCardProps {
  id: string
  date: string
  time: string
  instructorName: string
  theme?: string | null
  classType?: string | null
  totalSpots: number
  availableSpots: number
  price: number
  referrer?: 'landing' | 'clases'
}

export function ClassCard({ id, date, time, instructorName, theme, classType, totalSpots, availableSpots, price, referrer }: ClassCardProps) {
  const isSoldOut = availableSpots <= 0
  const occupancyPercentage = Math.round(((totalSpots - availableSpots) / totalSpots) * 100)
  
  // Choose colors based on availability
  const statusColorClass = isSoldOut ? 'text-red-500' : (availableSpots <= 5 ? 'text-orange-400' : 'text-state-green')
  const barColorClass = isSoldOut ? 'bg-red-500' : (availableSpots <= 5 ? 'bg-orange-400' : 'bg-state-green')

  const referrerQuery = referrer ? `?from=${referrer}` : ''
  const href = `/reserva/${id}${referrerQuery}`

  const cardContent = (
    <div className={`rounded-[24px] overflow-hidden flex flex-col border border-foreground/10 bg-container shadow-xl shadow-black/10 dark:shadow-black/40 transition-transform ${isSoldOut ? 'opacity-80' : 'hover:scale-[1.02]'} group`}>
      
      {/* Header Gradient */}
      <div className="bg-gradient-to-r from-[#D6007A] to-[#9B00E8] p-4 text-white relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Calendar className="w-4 h-4 opacity-80" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Clock className="w-4 h-4 opacity-80" />
              <span>{time}</span>
            </div>
          </div>
          {/* Display Price prominently */}
          <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center justify-center">
            <span className="font-bold text-[15px]">S/ {price.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Body (Simplified spacing) */}
      <div className="p-4 flex flex-col gap-4">
        
        <div className="flex flex-col gap-3 bg-foreground/5 rounded-2xl p-3 border border-foreground/5">
          <div className="flex items-center gap-3">
            <div className="bg-[#D6007A]/20 p-2 rounded-full text-[#D6007A] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold">Instructor</span>
              <span className="text-[13px] text-foreground font-semibold truncate">{instructorName}</span>
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-foreground/10"></div>
          
          {classType && (
            <>
              <div className="flex items-center gap-3">
                <div className="bg-[#9B00E8]/20 p-2 rounded-full text-[#9B00E8] shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold">Tipo de Clase</span>
                  <span className="text-[13px] text-foreground font-semibold truncate">{classType}</span>
                </div>
              </div>
              
              <div className="w-full h-[1px] bg-foreground/10"></div>
            </>
          )}
          
          <div className="flex items-center gap-3">
            <div className="bg-state-cyan/20 p-2 rounded-full text-state-cyan shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-foreground/70 font-bold">Temática</span>
              <span className="text-[13px] text-foreground font-semibold truncate">{theme || 'Regular'}</span>
            </div>
          </div>
        </div>

        {/* Ocupabilidad */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5 text-[11px] text-foreground/80 font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Ocupabilidad</span>
            </div>
            
            {/* Inline Urgency Badge */}
            {availableSpots > 0 && availableSpots <= 5 ? (
              <div className="bg-gradient-to-r from-[#F9A826] to-[#FF5E00] text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-md border border-white/20">
                ¡Últimos {availableSpots} cupos!
              </div>
            ) : (
              <div className={`text-xs font-bold ${statusColorClass}`}>
                {isSoldOut ? 'Agotado' : `${availableSpots} libres`}
              </div>
            )}
          </div>
          
          <div className="w-full bg-foreground/10 rounded-full h-1.5 mb-1 overflow-hidden">
            <div 
              className={`${barColorClass} h-full rounded-full transition-all duration-500`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>

          {isSoldOut ? (
            <button 
              disabled 
              className="w-full mt-2 bg-foreground/5 border border-foreground/10 text-foreground/45 font-semibold py-3 rounded-xl flex justify-center items-center gap-2 text-sm cursor-not-allowed"
            >
              ¡Cupos llenos!
            </button>
          ) : (
            <button className="w-full mt-2 bg-foreground/5 border border-foreground/10 text-foreground font-bold py-3 rounded-xl flex justify-center items-center gap-2 text-sm group-hover:bg-[#D6007A] group-hover:border-[#D6007A] group-hover:text-white transition-colors">
              Reservar Espacio <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (isSoldOut) {
    return <div className="block w-full">{cardContent}</div>
  }

  return (
    <Link href={href} className="block w-full">
      {cardContent}
    </Link>
  )
}
