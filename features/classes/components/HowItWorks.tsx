'use client'

import { useEffect, useRef, useState } from 'react'

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const steps = [
    { title: 'Elige tu clase', description: 'Selecciona el horario y la temática que más te guste del catálogo.' },
    { title: 'Selecciona tu espacio', description: 'Escoge tu lugar exacto en el salón interactivo. Sin necesidad de crear cuenta.' },
    { title: 'Paga fácil y seguro', description: 'Confirma tu reserva al instante. Recibirás la confirmación de tu clase por WhatsApp.' },
  ]

  return (
    <section ref={sectionRef} className="py-12">
      <div className="text-center mb-10 flex flex-col items-center">
        <h2 className="text-[22px] md:text-4xl font-bold text-foreground mb-1 md:mb-3">¿Cómo reservo?</h2>
        <p className="text-sm md:text-lg text-foreground font-bold">Elige, paga y entrena.</p>
        <p className="text-xs md:text-base text-foreground/70 font-medium mt-1">Así de fácil y sin crear cuenta.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`flex flex-col items-center text-center p-8 rounded-3xl bg-foreground/5 border border-foreground/10 transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <div 
              className={`w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-6 font-bold text-2xl transition-all duration-500 ease-out transform ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ transitionDelay: `${(index * 150) + 300}ms` }}
            >
              {index + 1}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
