import Link from 'next/link'
import { ClassCard } from '@/features/classes/components/ClassCard'
import { InstructorProfile } from '@/features/classes/components/InstructorProfile'
import { HowItWorks } from '@/features/classes/components/HowItWorks'
import { MapPin, Phone, Mail, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InstructorCard } from '@/features/instructors/components/InstructorCard'
import MapWrapper from '@/components/MapWrapper'

function formatSessionDate(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'short' }).format(date)
}

function formatSessionTime(isoString: string) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
}

export default async function LandingPage() {
  const supabase = await createClient()

  // Fetch nearest upcoming sessions, ordering by closest start time first
  const { data: sessionsData, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      start_time,
      theme,
      class_type,
      capacity,
      price,
      created_at,
      session_spots ( id, status ),
      instructor:instructors (
        full_name,
        whatsapp_phone
      )
    `)
    .gte('session_date', new Date().toISOString().split('T')[0])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(15)

  if (error) console.error("Error fetching sessions:", error)

  const { data: topInstructorsData } = await supabase
    .from('instructors')
    .select('id, full_name, years_experience, bio, whatsapp_phone')
    .order('created_at', { ascending: true })
    .limit(4)

  const nowStr = new Date().toISOString()
  const processedSessions = ((sessionsData as any[]) || [])
    .filter((session: any) => {
      const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`)
      return sessionDateTime.toISOString() > nowStr
    })
    .map((session: any) => {
      const instructorName = session.instructor
        ? (Array.isArray(session.instructor) ? session.instructor[0]?.full_name : session.instructor.full_name)
        : 'Instructor'

      const availableSpots = session.session_spots
        ? session.session_spots.filter((s: any) => s.status === 'available').length
        : session.capacity

      return {
        id: session.id,
        date: formatSessionDate(`${session.session_date}T${session.start_time}`),
        time: formatSessionTime(`${session.session_date}T${session.start_time}`),
        sessionDate: session.session_date,
        startTime: session.start_time,
        createdAt: session.created_at,
        instructorName,
        theme: session.theme,
        classType: session.class_type,
        totalSpots: session.capacity,
        availableSpots,
        price: session.price || 25
      }
    })

  processedSessions.sort((a, b) => {
    if (a.sessionDate !== b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate)
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
    if (a.availableSpots !== b.availableSpots) return a.availableSpots - b.availableSpots
    return a.createdAt.localeCompare(b.createdAt)
  })

  const mappedSessions = processedSessions.slice(0, 3)

  // Destacar al instructor de la clase más próxima
  let featuredInstructor = null
  if (sessionsData && sessionsData.length > 0) {
    const firstSession = (sessionsData as any[])[0]
    const instructorObj = firstSession.instructor
      ? (Array.isArray(firstSession.instructor) ? firstSession.instructor[0] : firstSession.instructor)
      : null

    if (instructorObj && instructorObj.full_name) {
      const mockYears = (instructorObj.full_name.length % 5) + 5 || 5
      featuredInstructor = {
        name: instructorObj.full_name,
        phone: instructorObj.whatsapp_phone || '51999999999',
        experienceYears: mockYears,
        bio: `¡Hola! Soy ${instructorObj.full_name}, un apasionado del fitness con un enfoque en entrenamiento funcional y rutinas de alta intensidad. Mi objetivo es ayudarte a superar tus límites físicos y mentales. Con ${mockYears} años de experiencia, te garantizo que cada clase será un nuevo desafío para alcanzar tu mejor versión.`,
      }
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section Container (Full width on mobile, max-w on desktop) */}
      <div className="w-full md:max-w-7xl md:mx-auto md:px-8 md:mt-8">
        <section className="bg-gradient-to-b md:bg-gradient-to-r from-[#D6007A] via-[#9B00E8] to-[#F9A826] rounded-b-[40px] md:rounded-[40px] pt-10 pb-16 px-6 md:px-16 text-center md:text-left relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">

          {/* Content */}
          <div className="md:w-1/2 flex flex-col items-center md:items-start z-10">
            {/* Placeholder Logo for Mobile (Hidden on Desktop) */}
            <div className="md:hidden w-24 h-24 rounded-full bg-container flex items-center justify-center mb-6 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D6007A] to-transparent opacity-20"></div>
              <div className="flex gap-1.5 transform rotate-12 relative z-10">
                <div className="w-2.5 h-8 bg-[#D6007A] rounded-full transform -skew-x-[20deg]"></div>
                <div className="w-2.5 h-10 bg-[#D6007A] rounded-full transform -skew-x-[20deg] -translate-y-1"></div>
                <div className="w-2.5 h-8 bg-[#D6007A] rounded-full transform -skew-x-[20deg]"></div>
              </div>
            </div>

            <h1 className="text-[28px] md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-6 leading-tight">
              Bienvenido a<br />Meikyo Gym
            </h1>
            <p className="text-white/90 text-[13px] md:text-lg font-medium mb-8 max-w-md">
              Transforma tu cuerpo, eleva tu mente. Entrena con los mejores profesionales en un ambiente exclusivo.
            </p>

            <Link href="/clases" className="hidden md:inline-flex bg-white text-[#9B00E8] font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform shadow-lg">
              Ver Clases Disponibles
            </Link>
          </div>

          {/* Desktop Graphic / Logo */}
          <div className="hidden md:flex w-1/2 justify-end z-10">
            <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-container/80 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(214,0,122,0.5)] overflow-hidden relative border border-foreground/20">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D6007A] to-[#F9A826] opacity-30"></div>
              <div className="flex gap-4 transform rotate-12 relative z-10">
                <div className="w-6 h-24 bg-gradient-to-b from-[#D6007A] to-[#F9A826] rounded-full transform -skew-x-[20deg]"></div>
                <div className="w-6 h-32 bg-gradient-to-b from-[#D6007A] to-[#F9A826] rounded-full transform -skew-x-[20deg] -translate-y-4"></div>
                <div className="w-6 h-24 bg-gradient-to-b from-[#D6007A] to-[#F9A826] rounded-full transform -skew-x-[20deg]"></div>
              </div>
            </div>
          </div>

          {/* Pagination Dots (Mobile Only) */}
          <div className="md:hidden flex justify-center gap-2 mt-2 w-full">
            <div className="w-6 h-1.5 bg-white/40 rounded-full"></div>
            <div className="w-2 h-1.5 bg-[#F9A826] rounded-full"></div>
            <div className="w-6 h-1.5 bg-white/40 rounded-full"></div>
          </div>
        </section>
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-16 space-y-16 md:space-y-24">

        {/* How It Works (Restored) */}
        <HowItWorks />

        {/* Clases Disponibles */}
        <section className="space-y-6 md:space-y-10">
          <div className="mb-8 md:text-center flex flex-col items-center">
            <h2 className="text-[22px] md:text-4xl font-bold text-foreground mb-1 md:mb-3">Clases Disponibles</h2>
            <p className="text-xs md:text-base text-foreground/70 font-medium">Reserva tu espacio en nuestras sesiones exclusivas y más próximas.</p>
          </div>

          {mappedSessions.length === 0 ? (
            <div className="text-center py-12 bg-foreground/5 rounded-3xl border border-foreground/10">
              <p className="text-foreground/80">No hay clases programadas por el momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {mappedSessions.map(session => (
                <ClassCard key={session.id} {...session} />
              ))}
            </div>
          )}

          {mappedSessions.length > 0 && (
            <div className="flex justify-center mt-8">
              <Link href="/clases" className="bg-container border border-foreground/10 text-foreground font-bold py-3 px-8 rounded-full hover:bg-foreground/5 hover:border-foreground/30 transition-colors shadow-lg flex items-center gap-2">
                Ver todas las clases <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Nuestros Instructores */}
        <section className="space-y-6 md:space-y-10 pb-4">
          <div className="text-center">
            <h2 className="text-[22px] md:text-4xl font-bold text-foreground mb-1 md:mb-3">Nuestro Equipo</h2>
            <p className="text-xs md:text-base text-foreground/70 font-medium">Entrena con los profesionales más experimentados y dedicados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {((topInstructorsData as any[]) || []).map((instructor: any) => (
              <InstructorCard
                key={instructor.id}
                name={instructor.full_name}
                experienceYears={instructor.years_experience}
                bio={instructor.bio}
                whatsapp={instructor.whatsapp_phone}
              />
            ))}
          </div>

          <div className="flex justify-center mt-8">
              <Link href="/instructores" className="bg-container border border-foreground/10 text-foreground font-bold py-3 px-8 rounded-full hover:bg-foreground/5 hover:border-foreground/30 transition-colors shadow-lg flex items-center gap-2">
              Ver a todos los instructores <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Ubicación */}
        <section className="space-y-6 md:space-y-10 pb-4">
          <div className="text-center">
            <h2 className="text-[22px] md:text-4xl font-bold text-foreground mb-1 md:mb-3">Ubicación</h2>
            <p className="text-xs md:text-base text-foreground/70 font-medium">Encuentra nuestro centro de entrenamiento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 bg-container/50 p-6 md:p-10 rounded-[40px] border border-foreground/5">
            <div className="bg-container rounded-3xl p-6 md:p-8 flex flex-col justify-center gap-6 shadow-lg border border-foreground/5">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="bg-[#D6007A]/10 p-3 md:p-4 rounded-full text-[#D6007A] mt-1 shadow-inner">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <div className="text-sm md:text-lg text-foreground font-bold mb-1">Dirección</div>
                  <div className="text-[13px] md:text-base text-foreground/80">Av Tupac Amaru km 13.5</div>
                  <div className="text-[13px] md:text-base text-foreground/80">Prdo Depósito Año Nuevo, Comas</div>
                </div>
              </div>

              <a href="tel:+51999999999" className="flex items-start gap-4 md:gap-6 group hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded-xl p-1 -m-1">
                <div className="bg-[#D6007A]/10 p-3 md:p-4 rounded-full text-[#D6007A] mt-1 shadow-inner group-hover:bg-[#D6007A]/20 transition-colors">
                  <Phone className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-lg text-foreground font-bold mb-1">Teléfono</div>
                  <div className="text-[13px] md:text-base text-[#D6007A] font-medium truncate">+51 999 999 999</div>
                </div>
              </a>

              <a href="mailto:info@meikyogym.com" className="flex items-start gap-4 md:gap-6 group hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground rounded-xl p-1 -m-1">
                <div className="bg-[#D6007A]/10 p-3 md:p-4 rounded-full text-[#D6007A] mt-1 shadow-inner group-hover:bg-[#D6007A]/20 transition-colors">
                  <Mail className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-lg text-foreground font-bold mb-1">Email</div>
                  <div className="text-[13px] md:text-base text-[#D6007A] font-medium truncate">info@meikyogym.com</div>
                </div>
              </a>
            </div>

            {/* Interactive Map */}
            <div className="w-full h-64 md:h-auto min-h-[300px] bg-container rounded-3xl border border-foreground/5 shadow-lg relative overflow-hidden">
              <MapWrapper />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
