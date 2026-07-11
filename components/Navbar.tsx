"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogIn, Calendar, Users, Home, LayoutDashboard, LogOut, PlusCircle, Activity, Undo2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { EditProfileModal } from '@/features/instructor/components/EditProfileModal'

export function Navbar({ user }: { user?: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const pathname = usePathname()

  const router = useRouter()
  const supabase = createClient()

  const publicNavLinks = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/clases', label: 'Clases', icon: Calendar },
    { href: '/instructores', label: 'Nuestro Equipo', icon: Users },
  ]

  const instructorNavLinks = [
    { href: '/panel', label: 'Panel de Control', icon: LayoutDashboard },
    { href: '/panel/nueva-sesion', label: 'Crear Clase', icon: PlusCircle },
    { href: '/panel/asistencia', label: 'Monitoreo en Vivo', icon: Activity },
  ]

  const desktopNavLinks = user ? instructorNavLinks : publicNavLinks

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    if (path === '/panel') return pathname === '/panel'
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="w-full bg-background py-4 px-5 md:px-10 flex items-center justify-between sticky top-0 z-50 border-b border-foreground/5 shadow-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand to-brand-secondary flex items-center justify-center shadow-md">
             <span className="text-white font-bold text-xs md:text-sm">M</span>
          </div>
          <span className="text-base md:text-xl font-bold text-foreground tracking-wide">Myku</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {desktopNavLinks.map((link) => (
            <Link 
              key={link.href + link.label} 
              href={link.href} 
              className={`text-sm font-semibold transition-colors ${
                isActive(link.href) ? 'text-foreground border-b-2 border-brand pb-1' : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-sm font-bold bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-full transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-brand-secondary text-white flex items-center justify-center text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'I'}
                </div>
                Mi Portal
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-container border border-foreground/10 rounded-xl shadow-xl py-2 flex flex-col z-50 text-foreground">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false)
                      setIsEditProfileOpen(true)
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2 w-full text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-foreground/50" />
                    Editar perfil
                  </button>
                  
                  <button 
                    onClick={async () => {
                      setIsDropdownOpen(false)
                      await supabase.auth.signOut()
                      router.push('/')
                      router.refresh()
                    }} 
                    className="px-4 py-2.5 text-sm font-medium text-status-danger hover:bg-foreground/5 transition-colors flex items-center gap-2 w-full text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="text-sm font-bold bg-brand hover:bg-brand/80 text-white px-5 py-2 rounded-full transition-colors shadow-lg flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Iniciar Sesión
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button 
            className="text-foreground hover:text-foreground/80 p-1"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-container border-l border-foreground/10 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-foreground/10">
          <span className="text-lg font-bold text-foreground">Menú</span>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-foreground/70 hover:text-foreground bg-foreground/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-2 flex-1">
          {publicNavLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors ${
                  isActive(link.href) 
                    ? 'bg-brand/10 text-brand' 
                    : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-5 border-t border-foreground/10">
          {user ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/panel"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full bg-brand text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg hover:bg-brand/80 transition-colors animate-transform"
              >
                <LayoutDashboard className="w-5 h-5" /> Panel de Instructor
              </Link>
              <button
                onClick={() => {
                  setIsSidebarOpen(false)
                  setIsEditProfileOpen(true)
                }}
                className="w-full bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-colors border border-foreground/10 cursor-pointer"
              >
                <User className="w-5 h-5 text-foreground/50" /> Editar Perfil
              </button>
              <button
                onClick={async () => {
                  setIsSidebarOpen(false)
                  await supabase.auth.signOut()
                  router.push('/')
                  router.refresh()
                }}
                className="w-full bg-status-danger/10 text-status-danger font-bold py-4 rounded-2xl flex justify-center items-center gap-2 hover:bg-status-danger hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsSidebarOpen(false)}
              className="w-full bg-brand text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg hover:bg-brand/80 transition-colors"
            >
              <LogIn className="w-5 h-5" /> Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
        user={user} 
      />
    </>
  )
}
