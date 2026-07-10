import { ClassCard } from '@/features/classes/components/ClassCard'

import { createClient } from '@/lib/supabase/server'
import { ClassFilters } from '@/features/classes/components/ClassFilters'
import { getCurrentLimaTime, getLimaYesterdayDateString } from '@/lib/utils'

type SessionData = {
  id: string
  session_date: string
  start_time: string
  theme: string | null
  class_type: string
  capacity: number
  price: number
  instructor_id: string
  session_spots: { id: string, status: string }[] | null
  instructor: { full_name: string | null, whatsapp_phone: string | null } | { full_name: string | null, whatsapp_phone: string | null }[] | null
}

function formatSessionDate(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short',
    timeZone: 'America/Lima'
  }).format(date)
}

function formatSessionTime(isoString: string) {
  const hasTimezone = isoString.includes('Z') || /[-+]\d{2}:?\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : `${isoString}-05:00`)
  return new Intl.DateTimeFormat('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/Lima'
  }).format(date)
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ClassesPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // Fetch instructors for filter
  const { data: instructorsData } = await supabase.from('instructors').select('id, full_name')
  const instructorsList = ((instructorsData as {id: string, full_name: string | null}[]) || []).map((i) => ({ id: i.id, name: i.full_name || 'Instructor' }))

  // Calculate local date of yesterday to make sure we don't miss late sessions crossing midnight or timezone offsets
  const yesterdayString = getLimaYesterdayDateString()

  // Base query for sessions
  let query = supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      start_time,
      theme,
      class_type,
      capacity,
      price,
      instructor_id,
      session_spots ( id, status ),
      instructor:instructors (
        full_name,
        whatsapp_phone
      )
    `)
    .gte('session_date', yesterdayString)

  if (searchParams?.instructor && typeof searchParams.instructor === 'string') {
    query = query.eq('instructor_id', searchParams.instructor)
  }

  if (searchParams?.date && typeof searchParams.date === 'string') {
    query = query.eq('session_date', searchParams.date)
  }

  const { data: sessionsData } = await query.order('session_date', { ascending: true }).order('start_time', { ascending: true })

  const limaNow = getCurrentLimaTime()
  const mappedSessions = ((sessionsData as unknown as SessionData[]) || [])
    .filter((session) => {
      // Parse local class date and start time manually to ensure it uses the local timezone (local server timezone representation)
      const [year, month, day] = session.session_date.split('-').map(Number)
      const [hour, minute] = session.start_time.split(':').map(Number)
      const sessionDateTime = new Date(year, month - 1, day, hour, minute)
      
      // A class expires exactly 1 hour after its start time
      const expirationTime = sessionDateTime.getTime() + 1 * 60 * 60 * 1000
      return limaNow.getTime() <= expirationTime
    })
    .map((session) => {
      const instructorName = (session.instructor
        ? (Array.isArray(session.instructor) ? session.instructor[0]?.full_name : session.instructor.full_name)
        : 'Instructor') || 'Instructor'

      const availableSpots = session.session_spots
        ? session.session_spots.filter((s) => s.status === 'available').length
        : session.capacity

      return {
        id: session.id,
        date: formatSessionDate(`${session.session_date}T${session.start_time}`),
        time: formatSessionTime(`${session.session_date}T${session.start_time}`),
        instructorName,
        theme: session.theme,
        classType: session.class_type,
        totalSpots: session.capacity,
        availableSpots,
        price: session.price || 25
      }
    })


  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16 space-y-16">
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground">Próximas Clases</h1>
        <p className="text-[15px] md:text-lg text-foreground/80">Encuentra tu horario ideal y asegura tu lugar en nuestras sesiones guiadas.</p>
      </div>

      <ClassFilters instructors={instructorsList} />

      {mappedSessions.length === 0 ? (
        <div className="text-center py-16 md:py-20 px-6 bg-foreground/5 rounded-3xl border border-foreground/10">
          <p className="text-[15px] md:text-lg text-foreground/80 font-medium leading-relaxed">No hay clases programadas por el momento. ¡Vuelve pronto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {mappedSessions.map(session => (
            <ClassCard key={session.id} {...session} referrer="clases" />
          ))}
        </div>
      )}
    </div>
  )
}
