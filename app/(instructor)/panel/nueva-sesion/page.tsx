import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewSessionForm } from '@/features/instructor/components/NewSessionForm'

export const dynamic = 'force-dynamic'

export default async function NuevaSesionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the logged-in instructor's phone number
  const { data: instructor } = await supabase
    .from('instructors')
    .select('whatsapp_phone')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-brand pt-8 pb-8 px-5 text-white relative">
        <div className="max-w-3xl mx-auto w-full">
          <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          
          <h1 className="text-2xl font-bold tracking-wide">Programar Nueva Sesión</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <NewSessionForm defaultWhatsappContact={instructor?.whatsapp_phone || ''} />
      </main>
    </div>
  )
}
