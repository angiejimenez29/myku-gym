"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteInstructor(instructorId: string) {
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

  // 3. Initialize Admin Client to delete the authentication user
  // This will cascade delete the instructor from public.instructors due to the foreign key cascade rule.
  const supabaseAdmin = createAdminClient()

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(instructorId)

  if (deleteError) {
    console.error("Error deleting auth user for instructor:", deleteError)
    throw new Error(deleteError.message || 'Error al eliminar el instructor de Supabase Auth')
  }

  revalidatePath('/admin/instructores')
  
  return { success: true }
}
