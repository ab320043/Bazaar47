// lib/open-mic/window.ts

/**
 * Open Mic submission window:
 * - Opens: Thursday 12:00 AM
 * - Closes: Tuesday 11:00 AM
 * - Closed entirely on Wednesday.
 */
export function isSubmissionWindowOpen(now: Date = new Date()): boolean {
  const day = now.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  
  // Closed all day Wednesday
  if (day === 3) return false

  // Tuesday cutoff at 11:00 AM
  if (day === 2) {
    const hours = now.getHours()
    if (hours >= 11) return false
  }

  return true
}