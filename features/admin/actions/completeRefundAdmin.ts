"use server"

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeRefundAdmin(refundId: string) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // Verify admin status
  const { data: admin, error: adminError } = await supabase
    .from('admins' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (adminError || !admin) {
    throw new Error('No autorizado: Se requiere rol de administrador')
  }

  // Update refund status using admin client to bypass RLS (needed for the trigger to write to reservations and session_spots)
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('refunds')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', refundId)

  if (error) {
    console.error("Complete admin refund error:", error)
    throw new Error('Error al actualizar la devolución')
  }

  revalidatePath('/admin/devoluciones')
}
