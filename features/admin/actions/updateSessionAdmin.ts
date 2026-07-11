"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateSessionAdminData {
  instructorId: string
  sessionDate: string
  startTime: string
  specialGuest?: string
  theme?: string
  classType: string
  price: number
  whatsappContact: string
  capacity: number
  status: 'draft' | 'published'
}

export async function updateSessionAdmin(sessionId: string, data: UpdateSessionAdminData) {
  const supabase = await createClient()

  // 1. Verify authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // 2. Verify admin status
  const { data: admin, error: adminError } = await supabase
    .from('admins' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (adminError || !admin) {
    throw new Error('No autorizado: Se requiere rol de administrador')
  }

  // 3. Fetch current session status
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Clase no encontrada')
  }

  if (session.status === 'cancelled') {
    throw new Error('No puedes editar una clase cancelada')
  }

  // 4. Validate input values
  if (!data.instructorId || !data.sessionDate || !data.startTime || !data.classType || isNaN(data.price) || !data.whatsappContact || isNaN(data.capacity)) {
    throw new Error('Campos obligatorios faltantes')
  }

  // 5. Ensure capacity isn't less than reserved spots
  const { data: spots, error: spotsError } = await supabase
    .from('session_spots')
    .select('status')
    .eq('session_id', sessionId)
    .neq('status', 'available')

  if (!spotsError && spots) {
    const reservedCount = spots.length
    if (data.capacity < reservedCount) {
      throw new Error(`No puedes reducir los cupos por debajo de las ${reservedCount} reservas existentes`)
    }
  }

  // 6. Initialize Admin Client to bypass RLS for updates
  const supabaseAdmin = createAdminClient()

  const { error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({
      instructor_id: data.instructorId,
      session_date: data.sessionDate,
      start_time: data.startTime,
      special_guest: data.specialGuest || null,
      theme: data.theme || null,
      class_type: data.classType,
      price: data.price,
      whatsapp_contact: data.whatsappContact,
      capacity: data.capacity,
      status: data.status
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('Error updating session as admin:', updateError)
    throw new Error('Error al actualizar la clase en la base de datos')
  }

  // 7. Re-calculate and adjust session spots using admin client
  const { data: currentSpots } = await supabaseAdmin
    .from('session_spots')
    .select('id')
    .eq('session_id', sessionId)

  const currentCapacity = currentSpots ? currentSpots.length : 0

  if (data.capacity > currentCapacity) {
    const spotsToAdd = []
    for (let i = currentCapacity + 1; i <= data.capacity; i++) {
      spotsToAdd.push({
        session_id: sessionId,
        spot_number: i,
        status: 'available' as const
      })
    }
    await supabaseAdmin.from('session_spots').insert(spotsToAdd)
  } else if (data.capacity < currentCapacity) {
    await supabaseAdmin
      .from('session_spots')
      .delete()
      .eq('session_id', sessionId)
      .gt('spot_number', data.capacity)
      .eq('status', 'available')
  }

  revalidatePath('/admin/clases')
  revalidatePath('/clases')
  revalidatePath(`/panel/clase/${sessionId}`)

  return { success: true }
}
