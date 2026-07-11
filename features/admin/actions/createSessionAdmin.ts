"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateSessionAdminData {
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

export async function createSessionAdmin(data: CreateSessionAdminData) {
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

  // 3. Validate input values
  if (!data.instructorId || !data.sessionDate || !data.startTime || !data.classType || isNaN(data.price) || !data.whatsappContact || isNaN(data.capacity)) {
    throw new Error('Campos obligatorios faltantes')
  }

  // 4. Insert session using admin client to bypass RLS
  const supabaseAdmin = createAdminClient()
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({
      instructor_id: data.instructorId,
      session_date: data.sessionDate,
      start_time: data.startTime,
      special_guest: data.specialGuest || null,
      theme: data.theme || null,
      class_type: data.classType,
      price: data.price,
      whatsapp_contact: data.whatsappContact,
      capacity: data.capacity,
      status: data.status || 'published'
    })
    .select('id')
    .single()

  if (sessionError) {
    console.error('Error creating session as admin:', sessionError)
    throw new Error('Error al crear la clase en la base de datos')
  }

  revalidatePath('/admin/clases')
  revalidatePath('/clases')
  
  return { success: true, sessionId: session.id }
}
