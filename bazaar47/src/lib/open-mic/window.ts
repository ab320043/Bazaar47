// lib/open-mic/window.ts

/**
 * Open Mic submission window:
 * - Opens: Thursday 12:00 AM (local)
 * - Closes: Tuesday 11:59 PM (local)
 * - Closed entirely on Wednesday (session day)
 *
 * In other words: open Thu 00:00 → Tue 23:59, inclusive. Closed Wed.
 *
 * "Tuesday 11:59 PM" is inclusive: a submission at 23:59:59 local on
 * Tuesday is accepted. The window flips closed at 00:00:00 Wednesday.
 */
export function isSubmissionWindowOpen(now: Date = new Date()): boolean {
  const day = now.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  // Closed all day Wednesday (session day).
  if (day === 3) return false

  // Open every other day, all day. Monday and Tuesday are open until
  // midnight at the end of Tuesday — no early cutoff.
  return true
}