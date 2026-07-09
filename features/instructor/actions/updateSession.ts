'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateSession(sessionId: string, formData: FormData) {
  const supabase = await createClient()

  // Verify the user is the instructor of this session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No estás autenticado')
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('instructor_id, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || session?.instructor_id !== user.id) {
    throw new Error('No tienes permiso para editar esta clase')
  }

  if (session.status === 'cancelled') {
    throw new Error('No puedes editar una clase cancelada')
  }

  const session_date = formData.get('session_date') as string
  const start_time = formData.get('start_time') as string
  const special_guest = formData.get('special_guest') as string | null
  const theme = formData.get('theme') as string | null
  const class_type = formData.get('class_type') as string
  const price = parseFloat(formData.get('price') as string)
  const whatsapp_contact = formData.get('whatsapp_contact') as string
  const capacity = parseInt(formData.get('capacity') as string)

  if (!session_date || !start_time || !class_type || isNaN(price) || !whatsapp_contact || isNaN(capacity)) {
    throw new Error('Faltan campos obligatorios')
  }

  // Ensure capacity isn't less than reserved spots
  const { data: spots, error: spotsError } = await supabase
    .from('session_spots')
    .select('status')
    .eq('session_id', sessionId)
    .neq('status', 'available')

  if (!spotsError && spots) {
    const reservedCount = spots.length
    if (capacity < reservedCount) {
      throw new Error(`No puedes reducir los cupos por debajo de las ${reservedCount} reservas existentes`)
    }
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      session_date,
      start_time,
      special_guest: special_guest || null,
      theme: theme || null,
      class_type,
      price,
      whatsapp_contact,
      capacity
    })
    .eq('id', sessionId)

  if (updateError) {
    throw new Error('Error al actualizar la sesión')
  }

  // Ensure new spots are created or extra spots are deleted if capacity changed
  // The trigger `manage_session_spots` handles insert, but let's see if it handles update correctly.
  // In the original migration, the trigger only fires on INSERT.
  // I need to add spots manually or adjust them if the capacity is greater.
  // Let's get current spots
  const { data: currentSpots } = await supabase
    .from('session_spots')
    .select('id')
    .eq('session_id', sessionId)

  const currentCapacity = currentSpots ? currentSpots.length : 0

  if (capacity > currentCapacity) {
    const spotsToAdd = []
    for (let i = currentCapacity + 1; i <= capacity; i++) {
      spotsToAdd.push({
        session_id: sessionId,
        spot_number: i,
        status: 'available' as const
      })
    }
    await supabase.from('session_spots').insert(spotsToAdd)
  } else if (capacity < currentCapacity) {
    // Delete spots from the end that are available
    // First, find all available spots to delete with spot_number > capacity
    await supabase
      .from('session_spots')
      .delete()
      .eq('session_id', sessionId)
      .gt('spot_number', capacity)
      .eq('status', 'available')
  }

  revalidatePath('/panel')
  revalidatePath(`/panel/clase/${sessionId}`)
  redirect(`/panel/clase/${sessionId}`)
}
