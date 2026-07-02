import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: instructor } = await supabase
    .from('instructors')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!instructor) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar user={user} />
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
    </div>
  )
}
