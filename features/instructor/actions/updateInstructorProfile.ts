'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateInstructorProfile(formData: FormData) {
  const supabase = await createClient()

  // 1. Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No autorizado')
  }

  const fullName = formData.get('fullName') as string
  const bio = formData.get('bio') as string
  const whatsapp = formData.get('whatsapp') as string
  const experience = parseInt(formData.get('experience') as string)
  const avatarFile = formData.get('avatar') as File | null

  // 2. Validate data format
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  if (!fullName || !nameRegex.test(fullName)) {
    throw new Error('El nombre solo debe contener letras y espacios.')
  }

  const whatsappRegex = /^9\d{8}$/
  if (!whatsapp || !whatsappRegex.test(whatsapp)) {
    throw new Error('El número de WhatsApp debe tener exactamente 9 dígitos y comenzar con 9.')
  }

  let profileImageUrl: string | null = null

  // 3. Handle avatar upload to Supabase Storage
  if (avatarFile && avatarFile.size > 0) {
    const fileExtension = avatarFile.name.split('.').pop() || 'png'
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`

    try {
      const arrayBuffer = await avatarFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const supabaseAdmin = createAdminClient()
      
      // Upload to standard avatars bucket
      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: avatarFile.type,
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        throw new Error('Error al guardar la foto de perfil en el almacenamiento.')
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(fileName)

      profileImageUrl = urlData.publicUrl
    } catch (uploadFail) {
      console.error('Avatar upload process failed:', uploadFail)
      throw new Error('No se pudo subir la foto de perfil. Inténtalo nuevamente.')
    }
  }

  // 4. Update Database
  const supabaseAdmin = createAdminClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    full_name: fullName,
    bio: bio || null,
    whatsapp_phone: whatsapp,
    years_experience: isNaN(experience) ? null : experience,
    updated_at: new Date().toISOString()
  }

  if (profileImageUrl) {
    updatePayload.profile_image_url = profileImageUrl
  }

  const { error: updateError } = await supabaseAdmin
    .from('instructors')
    .update(updatePayload)
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating database instructor record:', updateError)
    throw new Error('Error al actualizar la base de datos de instructores.')
  }

  // 5. Revalidate Paths
  revalidatePath('/panel')
  revalidatePath('/instructores')
  revalidatePath('/')

  return { success: true }
}
