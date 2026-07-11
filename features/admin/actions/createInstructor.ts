"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateInstructorData {
  fullName: string
  email: string
  whatsapp: string
  experience: number
  bio: string
}

export async function createInstructor(data: CreateInstructorData) {
  // 0. Validate input data format
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  if (!nameRegex.test(data.fullName)) {
    throw new Error('El nombre solo debe contener letras y espacios.')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    throw new Error('El correo electrónico no es válido.')
  }

  const whatsappRegex = /^9\d{8}$/
  if (!data.whatsapp || !whatsappRegex.test(data.whatsapp)) {
    throw new Error('El número de WhatsApp debe tener exactamente 9 dígitos y comenzar con 9.')
  }

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

  // 3. Initialize Admin Client to bypass RLS and create authentication user
  const supabaseAdmin = createAdminClient()

  // Generate a standard temporary password for the instructor
  const tempPassword = 'MykuTemp' + Math.random().toString(36).substring(2, 8) + '!'

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName
    }
  })

  if (authError) {
    console.error("Error creating auth user for instructor:", authError)
    throw new Error(authError.message || 'Error al crear el usuario en Supabase Auth')
  }

  if (!authUser.user) {
    throw new Error('No se pudo obtener el usuario creado')
  }

  // 4. Update the profile details in the public.instructors table
  // The insert is done automatically by the public.handle_new_user trigger, 
  // so we just update the rest of the fields.
  const { error: updateError } = await supabaseAdmin
    .from('instructors')
    .update({
      full_name: data.fullName,
      whatsapp_phone: data.whatsapp || null,
      years_experience: Number(data.experience) || 0,
      bio: data.bio || null
    })
    .eq('id', authUser.user.id)

  if (updateError) {
    console.error("Error updating instructor profile:", updateError)
    // Attempt to clean up the auth user to maintain integrity
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    throw new Error('Error al guardar los detalles del instructor en la base de datos')
  }

  revalidatePath('/admin/instructores')
  
  return { 
    success: true, 
    tempPassword 
  }
}
