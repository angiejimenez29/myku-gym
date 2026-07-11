"use client"
/* eslint-disable @next/next/no-img-element */
import { Award, Users, Star } from 'lucide-react'

interface InstructorProfileProps {
  name: string
  bio?: string | null
  experienceYears?: number | null
  whatsapp?: string
}

export function InstructorProfile({ name, bio, experienceYears, whatsapp }: InstructorProfileProps) {
  return (
    <div className="bg-transparent">
       <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
         {/* Glow behind image */}
         <div className="relative mb-4 md:mb-0 flex-shrink-0">
            <div className="absolute inset-0 bg-brand rounded-full blur-xl opacity-40 md:opacity-60"></div>
            <img 
               src="/placeholder-instructor.jpg" 
               alt={name} 
               onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/250/151226/FFFFFF/?text=CR' }} 
               className="w-28 h-28 md:w-48 md:h-48 rounded-full border-2 md:border-4 border-foreground/20 relative z-10 object-cover bg-container" 
            />
         </div>
         
         <div className="flex flex-col items-center md:items-start w-full">
           <h3 className="text-xl md:text-3xl font-bold text-foreground">{name}</h3>
           <div className="text-state-green text-xs md:text-sm font-semibold tracking-wider uppercase mt-2 mb-4 md:mb-6">
             Entrenador Certificado
           </div>
           
           <p className="text-sm md:text-base text-foreground/80 leading-relaxed text-center md:text-left mb-8 md:max-w-2xl">
             {bio}
           </p>
           
           <div className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-sm md:max-w-none mb-8 md:mb-10">
              <div className="flex flex-col items-center md:items-start gap-2">
                 <div className="bg-brand/10 p-3 md:p-4 rounded-full text-brand">
                   <Award className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                  <div className="flex flex-col items-center md:items-start mt-1">
                   <div className="text-lg md:text-2xl font-bold text-foreground">{experienceYears}+</div>
                   <div className="text-[10px] md:text-xs uppercase text-foreground/80 tracking-wider">Años</div>
                 </div>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                 <div className="bg-state-cyan/10 p-3 md:p-4 rounded-full text-state-cyan">
                   <Users className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                  <div className="flex flex-col items-center md:items-start mt-1">
                   <div className="text-lg md:text-2xl font-bold text-foreground">500+</div>
                   <div className="text-[10px] md:text-xs uppercase text-foreground/80 tracking-wider">Alumnos</div>
                 </div>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                 <div className="bg-brand/10 p-3 md:p-4 rounded-full text-brand">
                   <Star className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                  <div className="flex flex-col items-center md:items-start mt-1">
                   <div className="text-lg md:text-2xl font-bold text-foreground">1000+</div>
                   <div className="text-[10px] md:text-xs uppercase text-foreground/80 tracking-wider">Clases</div>
                 </div>
              </div>
           </div>
           
           <button 
             onClick={() => window.open(`https://wa.me/${whatsapp}`, '_blank')}
             className="bg-state-green text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity w-full md:w-auto shadow-lg justify-center md:hover:scale-105 md:transition-transform"
           >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
           </button>
           
           <p className="text-[10px] md:text-xs text-foreground/80 mt-4 md:mt-3">Al contactar, aceptas los términos de servicio.</p>
         </div>
       </div>
    </div>
  )
}
