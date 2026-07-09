import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentLimaTime(): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })
  const parts = formatter.formatToParts(now)
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return new Date(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(partMap.hour),
    Number(partMap.minute),
    Number(partMap.second)
  )
}

export function getLimaDateString(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(now)
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `${partMap.year}-${partMap.month}-${partMap.day}`
}

export function getLimaYesterdayDateString(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
  const parts = formatter.formatToParts(now)
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
  
  const limaToday = new Date(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day)
  )
  const limaYesterday = new Date(limaToday.getTime() - 24 * 60 * 60 * 1000)
  
  const yYear = limaYesterday.getFullYear()
  const yMonth = String(limaYesterday.getMonth() + 1).padStart(2, '0')
  const yDay = String(limaYesterday.getDate()).padStart(2, '0')
  
  return `${yYear}-${yMonth}-${yDay}`
}
