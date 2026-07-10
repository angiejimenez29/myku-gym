import { createClient } from '@/lib/supabase/server'
import { InstructorCard } from '@/features/instructors/components/InstructorCard'

export default async function InstructorsPage() {
  const supabase = await createClient()

  const { data: instructorsData } = await supabase
    .from('instructors')
    .select('id, full_name, years_experience, bio, whatsapp_phone')
    .order('created_at', { ascending: true })

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16 space-y-16">
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground">Nuestros Instructores</h1>
        <p className="text-[15px] md:text-lg text-foreground/80">Conoce al equipo de profesionales que te guiará en cada paso de tu transformación.</p>
      </div>

      {!instructorsData || instructorsData.length === 0 ? (
        <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10">
          <p className="text-lg text-foreground/80 font-medium">Aún no hay instructores registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {instructorsData.map((instructor) => (
            <InstructorCard 
              key={instructor.id}
              name={instructor.full_name || 'Instructor'}
              experienceYears={instructor.years_experience || 0}
              bio={instructor.bio || ''}
              whatsapp={instructor.whatsapp_phone || ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}
