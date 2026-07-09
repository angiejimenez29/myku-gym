"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeRefund(refundId: string) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // We have RLS policies on refunds ensuring instructor can only update their own refunds
  const { error } = await supabase
    .from('refunds' as any)
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', refundId)

  if (error) {
    console.error("Complete refund error:", error)
    throw new Error('Error al actualizar la devolución')
  }

  revalidatePath('/panel/devoluciones')
}
