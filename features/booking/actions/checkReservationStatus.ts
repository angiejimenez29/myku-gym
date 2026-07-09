'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function checkReservationStatus(reservaId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reservations')
    .select('estado_pago')
    .eq('id', reservaId)
    .single()
    
  if (error || !data) return null
  return data.estado_pago
}
