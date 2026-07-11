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
      <div className="bg-brand pt-8 pb-8 px-5 text-white relative">
        <div className="max-w-3xl mx-auto w-full">
          <Link href={`/panel/clase/${session.id}`} className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Volver a Detalles
          </Link>
          
          <h1 className="text-2xl font-bold tracking-wide">Editar Clase</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <NewSessionForm initialData={session} sessionId={session.id} />
      </main>
    </div>
  )
}
