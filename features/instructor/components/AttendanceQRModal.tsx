'use client'

import { useState } from 'react'
import { QrCode, X, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export function AttendanceQRModal({ sessionId }: { sessionId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // The global check-in URL for the gym
  // We use window.location.origin to get the current domain
  const checkInUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/checkin${sessionId ? `?sessionId=${sessionId}` : ''}` 
    : 'https://meykogym.com/checkin'

  const handleDownload = () => {
    const svg = document.getElementById('attendance-qr')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = 'myku-qr.png'
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-medium rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
      >
        <QrCode className="w-5 h-5" />
        Visualizar QR de las clases
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-container border border-foreground/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-brand p-5 text-white pr-12">
              <h2 className="text-xl font-bold">QR de Asistencia</h2>
              <p className="text-white/80 text-sm">Clase de Myku</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* QR Content */}
            <div className="p-8 flex flex-col items-center bg-white">
              <div className="bg-white p-2 rounded-xl">
                <QRCodeSVG 
                  id="attendance-qr"
                  value={checkInUrl} 
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="bg-brand-secondary/20 text-brand font-bold text-sm px-4 py-1.5 rounded-full mt-4 tracking-widest">
                MYKU-CHECKIN
              </div>
            </div>

            {/* Footer Instructions */}
            <div className="p-5 bg-container space-y-4">
              <div className="bg-foreground/5 border border-brand-secondary/30 p-4 rounded-xl text-sm text-foreground/80 leading-relaxed">
                <strong className="text-brand-secondary">Instrucciones:</strong> Los alumnos deben escanear este código QR al llegar al gimnasio para registrar su asistencia automáticamente.
              </div>
              
              <button 
                onClick={handleDownload}
                className="w-full bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
