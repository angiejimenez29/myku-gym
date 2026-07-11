"use client"

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from '@/features/auth/actions/login'
import Link from 'next/link'
import { Loader2, AlertCircle, Mail, Lock } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-brand text-white font-medium py-3.5 px-4 rounded-xl shadow-[0_4px_25px_rgba(19,122,127,0.3)] hover:shadow-[0_0_30px_rgba(19,122,127,0.6)] hover:scale-[1.02] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
    >
      {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    
    if (val.length === 0) {
      setEmailError(null)
    } else if (!val.includes('@')) {
      setEmailError("El correo debe llevar un '@'")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Formato de correo inválido (ej. usuario@dominio.com)")
    } else {
      setEmailError(null)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    
    if (val.length === 0) {
      setPasswordError(null)
    } else if (val.length < 5) {
      setPasswordError("La contraseña debe tener al menos 5 caracteres")
    } else {
      setPasswordError(null)
    }
  }

  const isFormInvalid = !!emailError || !!passwordError || !email || !password

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-10 text-center w-full flex flex-col items-center">
        {/* Logo recreado del screenshot */}
        <div className="w-20 h-20 mx-auto rounded-full bg-brand flex items-center justify-center shadow-[0_0_40px_rgba(19,122,127,0.3)] mb-6 overflow-hidden relative">
           <div className="flex gap-1 transform rotate-12 relative z-10">
              <div className="w-2.5 h-7 bg-white rounded-full transform -skew-x-[20deg] opacity-90"></div>
              <div className="w-2.5 h-10 bg-white rounded-full transform -skew-x-[20deg] -translate-y-1.5 opacity-90"></div>
              <div className="w-2.5 h-7 bg-white rounded-full transform -skew-x-[20deg] translate-y-1 opacity-90"></div>
           </div>
        </div>
        <h1 className="text-2xl font-medium text-brand mb-2 tracking-wide">Myku</h1>
        <p className="text-foreground/70 text-[13px] font-medium tracking-wide">Portal de Instructor/Instructora</p>
      </div>

      <form action={formAction} className="space-y-4 w-full">
        {/* Email Field */}
        <div className="space-y-1">
          <div className="relative">
            <label htmlFor="login-email" className="sr-only">Correo Electrónico</label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/50">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              name="email"
              required
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              className={`w-full bg-container border rounded-2xl pl-12 pr-4 py-3.5 text-[13px] text-foreground placeholder-foreground/50 focus:outline-none focus:bg-background transition-colors ${
                emailError 
                  ? 'border-status-danger focus:border-status-danger' 
                  : 'border-foreground/5 focus:border-brand/50'
              }`}
              placeholder="cesar.reyes@gmail.com"
            />
          </div>
          {emailError && (
            <p className="text-[11px] text-status-danger font-medium pl-2 animate-in fade-in slide-in-from-top-1">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="relative">
            <label htmlFor="login-password" className="sr-only">Contraseña</label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type="password"
              name="password"
              required
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              className={`w-full bg-container border rounded-2xl pl-12 pr-4 py-3.5 text-[13px] text-foreground placeholder-foreground/50 focus:outline-none focus:bg-background transition-colors ${
                passwordError 
                  ? 'border-status-danger focus:border-status-danger' 
                  : 'border-foreground/5 focus:border-brand/50'
              }`}
              placeholder="••••••••"
            />
          </div>
          {passwordError && (
            <p className="text-[11px] text-status-danger font-medium pl-2 animate-in fade-in slide-in-from-top-1">
              {passwordError}
            </p>
          )}
        </div>

        {/* Server error */}
        {state?.error && (
          <div className="bg-status-danger/10 border border-status-danger/30 rounded-2xl p-3 flex items-center justify-center gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-status-danger shrink-0" />
            <p className="text-[12px] text-status-danger font-semibold">{state.error}</p>
          </div>
        )}

        <div className="pt-2">
          <SubmitButton disabled={isFormInvalid} />
        </div>
      </form>

      <div className="mt-8 text-center">
        <Link href="#" className="text-[12px] text-foreground/80 hover:text-foreground transition-colors font-medium hover:underline focus-visible:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </div>
  )
}
