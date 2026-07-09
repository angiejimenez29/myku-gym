import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewSessionForm } from '@/features/instructor/components/NewSessionForm'

export const dynamic = 'force-dynamic'

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch session details
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('instructor_id', user.id)
    .single()

  if (error || !session || session.status === 'cancelled') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Top Gradient Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 pt-8 pb-16 px-5 rounded-b-[40px] text-white relative">
        <Link href={`/panel/clase/${session.id}`} className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-6 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver a Detalles
        </Link>
        
        <h1 className="text-2xl font-bold tracking-wide">Editar Clase</h1>
      </div>

      <main className="max-w-md mx-auto">
        <NewSessionForm initialData={session} sessionId={session.id} />
      </main>
    </div>
  )
}
