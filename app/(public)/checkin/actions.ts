'use server'

import { createAdminClient } from '@/lib/supabase/server'

export interface CheckinReservation {
  id: string
  date: string
  time: string
  theme: string
  spots: string[]
  isCheckedIn: boolean
}

export async function getReservationsForCheckin(phone: string): Promise<CheckinReservation[]> {
  const supabase = createAdminClient()
  
  // Clean phone number (remove non-digits)
  const cleanPhone = phone.replace(/\D/g, '')

  // 1. Fetch from reservations WHERE client_phone = [phone] AND estado_pago = 'aprobado'
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id,
      session:sessions (
        session_date,
        start_time,
        theme,
        class_type,
        status
      ),
      spots:reservation_spots (
        spot:session_spots (
          spot_number,
          status
        )
      )
    `)
    .eq('client_phone', cleanPhone)
    .eq('estado_pago', 'aprobado')

  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }

  // 2. Map and format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (reservations || [])
    .filter((res: any) => res.session?.status !== 'cancelled')
    .map((res: any) => {
    const session = res.session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spotList = (res.spots as any[])?.map((s) => `#${s.spot?.spot_number}`).filter(Boolean) || []
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isCheckedIn = (res.spots as any[])?.some((s) => s.spot?.status === 'present') || false
    
    // Format date: YYYY-MM-DD -> DD/MM/YYYY
    let formattedDate = session?.session_date || ''
    if (formattedDate) {
      const [y, m, d] = formattedDate.split('-')
      formattedDate = `${d}/${m}/${y}`
    }
    
    // Format time: HH:MM:SS -> H:MM AM/PM
    let formattedTime = session?.start_time || ''
    if (formattedTime) {
      const [h, min] = formattedTime.split(':')
      const hour = parseInt(h, 10)
      const suffix = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour % 12 || 12
      formattedTime = `${h12}:${min} ${suffix}`
    }
    
    const theme = session?.theme 
      ? `${session.class_type} / ${session.theme}` 
      : session?.class_type || 'Sin temática'

    return {
      id: res.id,
      date: formattedDate,
      time: formattedTime,
      theme,
      spots: spotList,
      isCheckedIn,
    }
  })
}

export async function markAttendanceForReservation(reservationId: string) {
  const supabase = createAdminClient()

  // 1. Get spot IDs for this reservation
  const { data: spots, error: fetchError } = await supabase
    .from('reservation_spots')
    .select('spot_id')
    .eq('reservation_id', reservationId)

  if (fetchError || !spots) {
    console.error('Error fetching reservation spots:', fetchError)
    throw new Error('No se pudo encontrar los espacios de la reserva')
  }

  const spotIds = spots.map(s => s.spot_id)

  if (spotIds.length === 0) {
    return true // Nothing to update
  }

  // 2. Update session_spots status to 'present'
  const { error: updateError } = await supabase
    .from('session_spots')
    .update({ status: 'present' })
    .in('id', spotIds)

  if (updateError) {
    console.error('Error marking attendance:', updateError)
    throw new Error('No se pudo registrar la asistencia')
  }

  return true
}
