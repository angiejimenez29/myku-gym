'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkReservationStatus } from '../actions/checkReservationStatus'

export function PaymentStatusPoller({ reservaId }: { reservaId: string }) {
  const router = useRouter()

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const status = await checkReservationStatus(reservaId)
        if (status === 'aprobado') {
          router.push(`/pago/exito?reservaId=${reservaId}`)
        } else if (status === 'rechazado' || status === 'cancelado') {
          router.push(`/pago/fallo?reservaId=${reservaId}`)
        }
      } catch (e) {
        // ignore errors
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [reservaId, router])

  return null
}
