import { AdminNavbar } from '@/components/AdminNavbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: admin } = await supabase
    .from('admins' as any)
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0C] text-[#F4F4F5] font-sans">
      <AdminNavbar user={user} />
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
    </div>
  )
}
