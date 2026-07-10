import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar user={user} />
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      
      <footer className="py-12 flex flex-col items-center gap-4 mt-12 bg-background border-t border-foreground/5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-secondary flex items-center justify-center shadow-lg">
           <span className="text-white font-bold text-lg">M</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Myku</h2>
        <p className="text-xs text-foreground/80 uppercase tracking-widest mt-1 font-medium">ENTRENA A OTRO NIVEL</p>
        <div className="w-full h-[1px] bg-foreground/10 my-4 max-w-[200px] md:max-w-md"></div>
        <p className="text-[10px] md:text-xs text-foreground/80">© {new Date().getFullYear()} Myku. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
