import { createClient } from '@/lib/supabase/server'

type SessionSpot = {
  id: string
  spot_number: number
  status: 'available' | 'reserved' | 'present'
  reservation_spots: {
    reservation_id: string
    reservations: {
      estado_pago: string
      expira_en: string | null
    } | null
  }[] | {
    reservation_id: string
    reservations: {
      estado_pago: string
      expira_en: string | null
    } | null
  } | null
}

type SessionData = {
  id: string
  session_date: string
  start_time: string
  capacity: number
  session_spots: SessionSpot[] | null
}

import { notFound } from 'next/navigation'
import { BookingStepper } from '@/features/booking/components/BookingStepper'
import { TopBar } from '@/features/shared/components/TopBar'
import { SpaceSelectionFlow } from '@/features/booking/components/SpaceSelectionFlow'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    timeZone: 'America/Lima'
  }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/Lima'
  }).format(date)
}

export default async function SpaceSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      start_time,
      capacity,
      capacity,
      session_spots ( id, spot_number, status, reservation_spots( reservation_id, reservations( estado_pago, expira_en ) ) )
    `)
    .eq('id', resolvedParams.id)
    .single()

  const session = data as unknown as SessionData

  if (error || !session) {
    notFound()
  }

  const dateStr = formatSessionDate(`${session.session_date}T${session.start_time}`)
  const timeStr = formatSessionTime(`${session.session_date}T${session.start_time}`)
  
  let spots = session.session_spots || []
  
  // Passive release of expired spots
  spots = spots.map((spot) => {
    if (spot.status !== 'available') {
      const resSpots = spot.reservation_spots;
      const resSpotsArray = Array.isArray(resSpots) ? resSpots : (resSpots ? [resSpots] : []);
      const hasExpired = resSpotsArray.some((rs) => {
        const res = rs.reservations;
        return res && res.estado_pago === 'pendiente' && res.expira_en && new Date(res.expira_en) < new Date();
      });
      if (hasExpired) {
        return { ...spot, status: 'available' };
      }
    }
    return spot;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <TopBar title="Selecciona tu Espacio" backHref={`/reserva/${resolvedParams.id}`} />

      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-5 mt-6 space-y-6">
        <BookingStepper currentStep={2} />

        <div className="text-center">
           <p className="text-foreground/80 text-sm font-medium capitalize mb-1">{dateStr} - {timeStr}</p>
           <p className="text-foreground/70 text-xs">Toca el número del espacio en el mapa para reservarlo.</p>
        </div>

        <SpaceSelectionFlow 
          sessionId={session.id} 
          capacity={session.capacity} 
          spots={spots} 
        />
      </main>
    </div>
  )
}
