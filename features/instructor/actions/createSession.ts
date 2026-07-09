'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No autorizado')
  }

  const session_date = formData.get('session_date') as string
  const start_time = formData.get('start_time') as string
  const special_guest = formData.get('special_guest') as string
  const theme = formData.get('theme') as string
  const class_type = formData.get('class_type') as string
  const price = parseFloat(formData.get('price') as string)
  const whatsapp_contact = formData.get('whatsapp_contact') as string
  const capacity = parseInt(formData.get('capacity') as string)

  if (!session_date || !start_time || !class_type || isNaN(price) || !whatsapp_contact || isNaN(capacity)) {
    throw new Error('Campos obligatorios faltantes')
  }

  const { data: newSession, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      instructor_id: user.id,
      session_date,
      start_time,
      special_guest: special_guest || null,
      theme: theme || null,
      class_type,
      price,
      whatsapp_contact,
      capacity,
      status: 'published'
    })
    .select('id')
    .single()

  if (sessionError) {
    console.error('Error creating session:', sessionError)
    throw new Error('Error al crear la sesión en la base de datos')
  }

  // Create session spots
  const spots = Array.from({ length: capacity }, (_, i) => ({
    session_id: newSession.id,
    spot_number: i + 1,
    status: 'available'
  }))

  const { error: spotsError } = await supabase
    .from('session_spots')
    .insert(spots as any) // cast to any to avoid ts errors

  if (spotsError) {
    console.error('Error creating spots:', spotsError)
    throw new Error('Error al generar los espacios de la sesión')
  }

  revalidatePath('/panel')
  revalidatePath('/clases')
  redirect('/panel')
}
