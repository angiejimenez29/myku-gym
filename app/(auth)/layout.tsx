import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background relative overflow-hidden">
      {/* Back to landing button at the top left */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          href="/"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors border border-transparent hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground text-foreground/80 hover:text-foreground"
          aria-label="Volver al inicio"
          title="Volver al inicio"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Theme Toggle at the top right */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Soft center glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      {/* Contenedor central ajustado al ancho de los inputs en el diseño */}
      <div className="z-10 w-full max-w-[340px] px-2 relative -mt-10">
        {children}
      </div>
    </div>
  )
}
