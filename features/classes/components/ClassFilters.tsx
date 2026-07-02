'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Calendar as CalendarIcon, ChevronDown, User } from 'lucide-react'

export function ClassFilters({ instructors }: { instructors: { id: string, name: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [instructorId, setInstructorId] = useState(searchParams.get('instructor') || '')
  
  // Date picker usa el objeto Date nativo.
  // parsear la fecha "YYYY-MM-DD" si existe en la URL cuidando el timezone.
  const queryDate = searchParams.get('date')
  const [date, setDate] = useState<Date | null>(queryDate ? new Date(queryDate + 'T00:00:00') : null)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleApply = () => {
    let params = new URLSearchParams(searchParams.toString())
    if (instructorId) params.set('instructor', instructorId)
    else params.delete('instructor')
    
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      params.set('date', `${year}-${month}-${day}`)
    } else {
      params.delete('date')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setInstructorId('')
    setDate(null)
    router.push(pathname)
  }

  const selectedInstructorName = instructors.find(i => i.id === instructorId)?.name || 'Todos los instructores'

  return (
    <div className="bg-container border border-foreground/10 rounded-[20px] p-5 flex flex-col md:flex-row gap-4 mb-8 shadow-lg">
      
      {/* Dropdown de Instructores Personalizado */}
      <div className="flex-1" ref={dropdownRef}>
        <label className="text-[11px] text-foreground/70 uppercase tracking-wider font-bold mb-2 block ml-1">Filtrar por Instructor</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-background border border-foreground/10 hover:border-[#D6007A]/50 rounded-xl p-3.5 text-[13px] text-foreground flex items-center justify-between transition-colors shadow-inner"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#D6007A]" />
              <span className="font-medium truncate">{selectedInstructorName}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-foreground/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-background border border-foreground/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors hover:bg-foreground/5 ${instructorId === '' ? 'text-[#D6007A] bg-[#D6007A]/10' : 'text-foreground'}`}
                onClick={() => {
                  setInstructorId('')
                  setIsDropdownOpen(false)
                }}
              >
                Todos los instructores
              </button>
              {instructors.map(inst => (
                <button
                  key={inst.id}
                  type="button"
                  className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors hover:bg-foreground/5 ${instructorId === inst.id ? 'text-[#D6007A] bg-[#D6007A]/10' : 'text-foreground'}`}
                  onClick={() => {
                    setInstructorId(inst.id)
                    setIsDropdownOpen(false)
                  }}
                >
                  {inst.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selector de Fecha (react-datepicker) */}
      <div className="flex-1">
        <label className="text-[11px] text-foreground/70 uppercase tracking-wider font-bold mb-2 block ml-1">Filtrar por Fecha</label>
        <div className="relative flex items-center">
          <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <CalendarIcon className="w-4 h-4 text-[#D6007A]" />
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .custom-datepicker .react-datepicker__input-container input {
              width: 100%;
              background-color: rgba(214, 0, 122, 0.05);
              border: 1px solid rgba(214, 0, 122, 0.2);
              border-radius: 0.75rem;
              padding: 0.875rem 1rem 0.875rem 2.5rem;
              font-size: 13px;
              color: var(--foreground);
              font-weight: 500;
              transition: all 0.2s;
              box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
            }
            .custom-datepicker .react-datepicker__input-container input:hover {
              border-color: rgba(214, 0, 122, 0.5);
              background-color: rgba(214, 0, 122, 0.08);
            }
            .custom-datepicker .react-datepicker__input-container input:focus {
              outline: none;
              border-color: rgba(214, 0, 122, 0.8);
              box-shadow: 0 0 0 3px rgba(214, 0, 122, 0.15);
            }
            
            /* DatePicker Popup Theme Overrides */
            .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle::before,
            .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle::after,
            .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle::before,
            .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle::after {
              border-bottom-color: var(--background) !important;
              border-top-color: var(--background) !important;
            }
            
            .react-datepicker {
              background-color: var(--background) !important;
              border: 1px solid rgba(var(--foreground-rgb), 0.1) !important;
              border-radius: 1rem !important;
              font-family: inherit !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
            }
            .react-datepicker__header {
              background-color: var(--container) !important;
              border-bottom: 1px solid rgba(var(--foreground-rgb), 0.05) !important;
              border-top-left-radius: 1rem !important;
              border-top-right-radius: 1rem !important;
            }
            .react-datepicker__current-month, 
            .react-datepicker-time__header, 
            .react-datepicker-year-header {
              color: var(--foreground) !important;
            }
            .react-datepicker__day-name, 
            .react-datepicker__day, 
            .react-datepicker__time-name {
              color: rgba(var(--foreground-rgb), 0.8) !important;
            }
            .react-datepicker__day:hover,
            .react-datepicker__month-text:hover,
            .react-datepicker__quarter-text:hover,
            .react-datepicker__year-text:hover {
              background-color: rgba(214, 0, 122, 0.3) !important;
              border-radius: 0.5rem !important;
              color: var(--foreground) !important;
            }
            .react-datepicker__day--selected, 
            .react-datepicker__day--keyboard-selected {
              background-color: #D6007A !important;
              color: white !important;
              border-radius: 0.5rem !important;
            }
            .react-datepicker__day--outside-month {
              color: rgba(var(--foreground-rgb), 0.3) !important;
            }
          `}} />
          <DatePicker
            selected={date}
            onChange={(d: Date | null) => setDate(d)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona una fecha"
            className="w-full"
            wrapperClassName="w-full custom-datepicker"
            isClearable
          />
        </div>
      </div>

      <div className="flex gap-3 items-end md:w-auto w-full pt-2 md:pt-0">
        <button 
          onClick={handleClear}
          className="flex-1 md:flex-none h-[46px] flex items-center justify-center px-4 text-[13px] font-semibold text-foreground/80 bg-foreground/5 rounded-xl hover:bg-foreground/10 transition-colors whitespace-nowrap"
        >
          Limpiar
        </button>
        <button 
          onClick={handleApply}
          className="flex-1 md:flex-none h-[46px] flex items-center justify-center px-4 bg-gradient-to-r from-[#D6007A] to-[#9B00E8] rounded-xl text-[13px] font-bold text-white shadow-lg hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  )
}
