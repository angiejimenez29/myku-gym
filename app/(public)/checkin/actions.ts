'use server'

import { createAdminClient } from '@/lib/supabase/server'

export interface CheckinReservation {
  id: string
  date: string
  time: string
  theme: string
  spots: string[]
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
        class_type
      ),
      spots:reservation_spots (
        spot:session_spots (
          spot_number
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
  return (reservations || []).map((res: any) => {
    const session = res.session
    const spotList = res.spots?.map((s: any) => `#${s.spot?.spot_number}`).filter(Boolean) || []
    
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
    }
  })
}
