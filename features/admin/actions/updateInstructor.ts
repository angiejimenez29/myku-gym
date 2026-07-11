"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateInstructorData {
  fullName: string
  whatsapp: string
  experience: number
  bio: string
}

export async function updateInstructor(instructorId: string, data: UpdateInstructorData) {
  // 0. Validate input data format
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  if (!nameRegex.test(data.fullName)) {
    throw new Error('El nombre solo debe contener letras y espacios.')
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

  // 3. Initialize Admin Client to update details
  const supabaseAdmin = createAdminClient()

  const { error: updateError } = await supabaseAdmin
    .from('instructors')
    .update({
      full_name: data.fullName,
      whatsapp_phone: data.whatsapp || null,
      years_experience: Number(data.experience) || 0,
      bio: data.bio || null
    })
    .eq('id', instructorId)

  if (updateError) {
    console.error("Error updating instructor profile:", updateError)
    throw new Error('Error al actualizar los detalles del instructor en la base de datos')
  }

  revalidatePath('/admin/instructores')
  
  return { success: true }
}
