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

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-8 pb-16 px-5 rounded-b-[40px] text-white relative">
        <Link href="/panel" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-6 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Link>
        
        <h1 className="text-2xl font-bold tracking-wide">Programar Nueva Sesión</h1>
      </div>

      <main className="max-w-md mx-auto">
        <NewSessionForm />
      </main>
    </div>
  )
}
