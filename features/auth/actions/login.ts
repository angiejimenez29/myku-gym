"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Correo o contraseña incorrectos' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Error al iniciar sesión' }
  }

  // Verificar si es instructor
  const { data: instructor } = await supabase
    .from('instructors')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (instructor) {
    redirect('/panel')
  }

  // Verificar si es admin
  const { data: admin } = await supabase
    .from('admins' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (admin) {
    redirect('/admin/dashboard')
  }

  return { error: 'Este usuario no tiene un rol válido asignado' }
}
