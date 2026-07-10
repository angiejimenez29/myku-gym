'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function MercadoPagoButton({ reservationId, amount }: { reservationId: string, amount: number }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservas/${reservationId}/pagar`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || 'Error al iniciar pago')
      }
    } catch (err: any) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-[#009EE3] text-white font-semibold rounded-xl py-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#009EE3]/20"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Redirigiendo a Mercado Pago...
        </>
      ) : (
        `Pagar con Mercado Pago S/. ${amount.toFixed(2)}`
      )}
    </button>
  )
}
