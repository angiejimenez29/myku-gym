"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleAttendance(sessionId: string, spotNumber: number) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get current spot status
  const { data: spot, error: spotError } = await supabase
    .from('session_spots')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('spot_number', spotNumber)
    .single()

  if (spotError && spotError.code !== 'PGRST116') {
    throw new Error('Error al obtener el espacio')
  }

  // If spot doesn't exist, it's 'available' implicitly (we could create it as present, but let's assume they only mark reserved spots)
  // Actually, sometimes an instructor might give a walk-in spot. Let's allow creating it if it doesn't exist.
  const newStatus = spot?.status === 'present' ? 'reserved' : 'present'

  if (spot) {
    await supabase
      .from('session_spots')
      .update({ status: newStatus })
      .eq('id', spot.id)
  } else {
    await supabase
      .from('session_spots')
      .insert({
        session_id: sessionId,
        spot_number: spotNumber,
        status: newStatus
      })
  }

  revalidatePath(`/panel/asistencia/${sessionId}`)
}
