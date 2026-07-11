"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Calendar, Users, Home, LayoutDashboard, LogOut, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AdminNavbar({ user }: { user?: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const adminNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/instructores', label: 'Instructores', icon: Users },
    { href: '/admin/clases', label: 'Clases Globales', icon: Calendar },
    { href: '/admin/devoluciones', label: 'Gestión de Devoluciones', icon: Receipt },
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="w-full bg-[#0E0E12] border-b border-white/5 py-4 px-5 md:px-10 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#D6007A] to-[#9B00E8] flex items-center justify-center shadow-[0_0_15px_rgba(214,0,122,0.3)]">
             <span className="text-white font-bold text-xs md:text-sm">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-xl font-bold text-white tracking-wide leading-none">Myku</span>
            <span className="text-[9px] font-semibold text-[#D6007A] tracking-wider uppercase mt-0.5">Admin Portal</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          {adminNavLinks.map((link) => (
            <Link 
              key={link.href + link.label} 
              href={link.href} 
              className={`text-sm font-semibold transition-colors py-1 ${
                isActive(link.href) ? 'text-white border-b-2 border-[#D6007A]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-sm font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 border border-white/5"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D6007A] to-[#9B00E8] text-white flex items-center justify-center text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              Administrador
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#16161D] border border-white/10 rounded-xl shadow-xl py-2 flex flex-col z-50">
                <button 
                  onClick={async () => {
                    setIsDropdownOpen(false)
                    await supabase.auth.signOut()
                    router.push('/')
                    router.refresh()
                  }} 
                  className="px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button 
            className="text-white hover:text-white/80 p-1 bg-white/5 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#0E0E12] border-l border-white/10 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <span className="text-lg font-bold text-white">Menú Admin</span>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-zinc-400 hover:text-white bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-2 flex-1">
          {adminNavLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors ${
                  isActive(link.href) 
                    ? 'bg-[#D6007A]/15 text-[#D6007A]' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-5 border-t border-white/10">
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                setIsSidebarOpen(false)
                await supabase.auth.signOut()
                router.push('/')
                router.refresh()
              }}
              className="w-full bg-red-500/10 text-red-400 font-bold py-4 rounded-2xl flex justify-center items-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
