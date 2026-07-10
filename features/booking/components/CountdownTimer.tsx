'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

export function CountdownTimer({ expiresAt, fallbackUrl }: { expiresAt: string, fallbackUrl: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const target = new Date(expiresAt).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = Math.max(0, target - now)
      setTimeLeft(diff)
      
      if (diff === 0) {
        clearInterval(interval)
        alert('El tiempo para pagar tu reserva ha expirado.')
        router.push(fallbackUrl)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [expiresAt, fallbackUrl, router])

  if (timeLeft === null) return null

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="flex items-center justify-center gap-2 bg-status-danger/10 text-status-danger border border-status-danger rounded-xl py-3 px-4 mx-auto w-fit mb-6">
      <Clock className="w-5 h-5" />
      <span className="font-semibold text-sm">
        Reserva temporal: paga en <span className="text-lg tabular-nums">{formattedTime}</span> para asegurar tus cupos
      </span>
    </div>
  )
}
