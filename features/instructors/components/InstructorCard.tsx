/* eslint-disable @typescript-eslint/no-unused-vars */
import { User, Award, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface InstructorCardProps {
  name: string
  experienceYears: number
  bio: string
  whatsapp: string
}

export function InstructorCard({ name, experienceYears, bio, whatsapp }: InstructorCardProps) {
  // Generamos un fallback avatar si no hay imagen
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="bg-container/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between border border-foreground/10 shadow-xl shadow-black/10 dark:shadow-black/20 hover:border-brand/50 transition-colors group h-full">
      <div className="flex flex-col items-center text-center gap-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand to-brand-secondary p-1 shadow-lg group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-background rounded-full flex items-center justify-center border-2 border-background">
            <span className="text-2xl font-bold text-foreground tracking-widest">{initials}</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
          <div className="flex items-center justify-center gap-1.5 text-state-green text-xs font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>{experienceYears} años exp.</span>
          </div>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed mt-2">
          {bio || "Instructor profesional certificado y apasionado por ayudarte a alcanzar tu mejor versión."}
        </p>
      </div>

      <a 
        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full bg-whatsapp/10 text-whatsapp font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-whatsapp hover:text-white transition-colors"
      >
        <MessageCircle className="w-4 h-4" /> Escribir
      </a>
    </div>
  )
}
