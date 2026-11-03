// lib/email/notify.ts
//
// Central notification dispatcher. Every notification is fire-and-forget:
// the caller doesn't await it, and errors are logged but swallowed.
// Emails are a convenience layer, never load-bearing.

import { Resend } from 'resend'
import { Redis } from '@upstash/redis'
import type { ShiftOffer } from '@/types/shift-offer'
import type { ShiftClaim } from '@/types/staff-claim'
import type { StaffMember } from '@/types/staff'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)
const redis = Redis.fromEnv()

const FROM = 'Bazaar47 <info@bazaar47.com>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || ''
const NOTIFIED_KEY = 'staff_notifications_sent'
const NOTIFIED_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

// ============================================
// HELPERS
// ============================================

function isConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_RESEND_API_KEY
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatWindow(startIso: string, endIso: string): string {
  return `${formatDate(startIso)}, ${formatTime(startIso)} – ${formatTime(endIso)}`
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Idempotency check: has this notification already been sent?
 * Key format: "<type>:<entityId>" — e.g. "reminder24:claim-uuid".
 */
async function alreadySent(key: string): Promise<boolean> {
  try {
    const exists = await redis.get(`${NOTIFIED_KEY}:${key}`)
    return exists !== null
  } catch {
    return false // assume not sent on error
  }
}

async function markSent(key: string): Promise<void> {
  try {
    await redis.set(`${NOTIFIED_KEY}:${key}`, '1', { ex: NOTIFIED_TTL_SECONDS })
  } catch {
    // best effort
  }
}

function wrapHtml(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #EFEADE; padding: 20px;">
      <div style="background: #202912; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #EFEADE; margin: 0; font-size: 24px;">Bazaar47</h1>
      </div>
      <div style="background: #fff; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #D5C9B1;">
        ${body}
      </div>
      <p style="text-align: center; font-size: 11px; color: #D5C9B1; margin-top: 20px;">
        © 2026 Bazaar47 · 60 SW 2nd Street, Gainesville, FL
      </p>
    </div>
  `
}

async function send(to: string | string[], subject: string, body: string): Promise<void> {
  if (!isConfigured() || !to || (Array.isArray(to) && to.length === 0)) return
  try {
    await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: wrapHtml(body),
    })
  } catch (err) {
    console.error('[notify] email send failed:', { subject, err })
  }
}

function adminRecipient(): string[] {
  return ADMIN_EMAIL ? [ADMIN_EMAIL] : []
}

// ============================================
// STAFF-TARGETED NOTIFICATIONS
// ============================================

/**
 * Fired when admin confirms a pending claim. Tells the staff member
 * their shift is locked in, with time, location, and pay.
 */
export function notifyClaimConfirmed(
  claim: ShiftClaim,
  offer: ShiftOffer,
  staffEmail: string
): void {
  void send(
    staffEmail,
    `✅ Shift confirmed — ${offer.eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">You're on, ${claim.staffName.split(' ')[0]}!</h2>
      <p style="color: #6A2630;">Your shift has been confirmed by the Bazaar47 team.</p>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Event:</strong> ${offer.eventName}</p>
        <p style="margin: 4px 0;"><strong>When:</strong> ${formatWindow(offer.shiftStart, offer.shiftEnd)}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${claim.lockedRole}</p>
        <p style="margin: 4px 0;"><strong>Rate:</strong> ${formatCurrency(claim.lockedRate)}/hr</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        On shift day, log in to <a href="https://bazaar47.com/staff/shifts" style="color: #295211;">My Shifts</a>
        and clock in when you arrive. You'll get reminders 24h and 2h before.
      </p>
    `
  )
}

/**
 * Fired when admin rejects a pending claim. Tells the staff member
 * their claim wasn't selected. Soft tone — they can claim again
 * if the offer is still open.
 */
export function notifyClaimRejected(
  claim: ShiftClaim,
  offer: ShiftOffer,
  staffEmail: string
): void {
  void send(
    staffEmail,
    `Shift claim update — ${offer.eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">Hey ${claim.staffName.split(' ')[0]},</h2>
      <p style="color: #6A2630;">
        Your claim for the <strong>${claim.lockedRole}</strong> shift on
        ${formatDate(offer.shiftStart)} wasn't selected this time.
      </p>
      <p style="color: #6A2630;">
        This usually means the slot was already filled or the team needed a specific fit.
        If the shift is still open, you're welcome to claim again.
      </p>
      <p style="color: #6A2630; font-size: 13px;">
        <a href="https://bazaar47.com/staff/events" style="color: #295211;">Browse open shifts →</a>
      </p>
    `
  )
}

/**
 * Fired by cron 24h before a confirmed shift. Reminds the staff member.
 */
export async function notifyReminder24h(
  claim: ShiftClaim,
  offer: ShiftOffer,
  staffEmail: string
): Promise<void> {
  const key = `reminder24:${claim.id}`
  if (await alreadySent(key)) return
  await markSent(key)

  void send(
    staffEmail,
    `📅 Tomorrow — ${offer.eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">Your shift is tomorrow</h2>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Event:</strong> ${offer.eventName}</p>
        <p style="margin: 4px 0;"><strong>When:</strong> ${formatWindow(offer.shiftStart, offer.shiftEnd)}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${claim.lockedRole}</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        Save the date. If something changed, let admin know as soon as possible.
      </p>
    `
  )
}

/**
 * Fired by cron 2h before a confirmed shift. Final nudge.
 */
export async function notifyReminder2h(
  claim: ShiftClaim,
  offer: ShiftOffer,
  staffEmail: string
): Promise<void> {
  const key = `reminder2:${claim.id}`
  if (await alreadySent(key)) return
  await markSent(key)

  void send(
    staffEmail,
    `⏰ Shift in 2 hours — ${offer.eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">Shift starts in 2 hours</h2>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>When:</strong> ${formatTime(offer.shiftStart)} – ${formatTime(offer.shiftEnd)}</p>
        <p style="margin: 4px 0;"><strong>Location:</strong> Bazaar47 · 60 SW 2nd Street</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${claim.lockedRole}</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        Log in to <a href="https://bazaar47.com/staff/shifts" style="color: #295211;">My Shifts</a>
        and clock in when you arrive.
      </p>
    `
  )
}

/**
 * Fired when cron auto-closes a shift because the staff member forgot
 * to clock out. Warns them so they can flag the error if it's wrong.
 */
export function notifyAutoClosed(
  staffName: string,
  staffEmail: string,
  eventName: string,
  hoursWorked: number,
  scheduledEndIso: string
): void {
  void send(
    staffEmail,
    `Shift auto-closed — ${eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">Hey ${staffName.split(' ')[0]},</h2>
      <p style="color: #6A2630;">
        Your shift on <strong>${eventName}</strong> was auto-closed at the
        scheduled end time because we didn't see a check-out.
      </p>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Scheduled end:</strong> ${formatTime(scheduledEndIso)}</p>
        <p style="margin: 4px 0;"><strong>Hours logged:</strong> ${hoursWorked.toFixed(2)}h</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        If you actually worked a different end time, message admin and they'll fix it.
        Otherwise you're all set — thanks for the shift.
      </p>
    `
  )
}

// ============================================
// ADMIN-TARGETED NOTIFICATIONS
// ============================================

/**
 * Fired when a staff member submits a pending claim. Admin needs to
 * confirm or reject it.
 */
export function notifyAdminNewClaim(
  claim: ShiftClaim,
  offer: ShiftOffer
): void {
  const admin = adminRecipient()
  if (admin.length === 0) return

  void send(
    admin,
    `New shift claim — ${claim.staffName} for ${offer.eventName}`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">New claim to review</h2>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Staff:</strong> ${claim.staffName}</p>
        <p style="margin: 4px 0;"><strong>Event:</strong> ${offer.eventName}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${offer.role}</p>
        <p style="margin: 4px 0;"><strong>When:</strong> ${formatWindow(offer.shiftStart, offer.shiftEnd)}</p>
        <p style="margin: 4px 0;"><strong>Rate:</strong> ${formatCurrency(claim.lockedRate)}/hr</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        <a href="https://bazaar47.com/admin/events/${offer.eventId}/staff" style="color: #295211;">
          Review on the coverage board →
        </a>
      </p>
    `
  )
}

/**
 * Fired by cron when a staff member never checked in within the no-show
 * tolerance. Admin should reassign or mark cancelled.
 */
export function notifyAdminNoShow(
  staffName: string,
  eventName: string,
  role: string,
  shiftStartIso: string
): void {
  const admin = adminRecipient()
  if (admin.length === 0) return

  void send(
    admin,
    `⚠️ No-show — ${staffName} for ${eventName}`,
    `
      <h2 style="color: #A62630; margin-top: 0;">No-show detected</h2>
      <p style="color: #6A2630;">
        <strong>${staffName}</strong> never checked in for their shift.
      </p>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Event:</strong> ${eventName}</p>
        <p style="margin: 4px 0;"><strong>Role:</strong> ${role}</p>
        <p style="margin: 4px 0;"><strong>Shift start:</strong> ${formatDate(shiftStartIso)}, ${formatTime(shiftStartIso)}</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        <a href="https://bazaar47.com/admin/staff-dashboard" style="color: #295211;">
          Review on Activity dashboard →
        </a>
      </p>
    `
  )
}

/**
 * Fired by cron when an auto-close happened. Batches by staff into a
 * single digest email so admin isn't spammed.
 */
export function notifyAdminAutoClosedDigest(
  entries: Array<{
    staffName: string
    eventName: string
    hoursWorked: number
    scheduledEndIso: string
  }>
): void {
  if (entries.length === 0) return
  const admin = adminRecipient()
  if (admin.length === 0) return

  const rows = entries
    .map(
      (e) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #E5DCC8;">${e.staffName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #E5DCC8;">${e.eventName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #E5DCC8;">${formatDate(e.scheduledEndIso)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #E5DCC8; text-align: right;">${e.hoursWorked.toFixed(2)}h</td>
      </tr>
    `
    )
    .join('')

  void send(
    admin,
    `⚠️ ${entries.length} shift${entries.length === 1 ? '' : 's'} auto-closed — needs review`,
    `
      <h2 style="color: #341B1C; margin-top: 0;">Auto-close summary</h2>
      <p style="color: #6A2630;">
        ${entries.length} shift${entries.length === 1 ? ' was' : 's were'} auto-closed because
        no check-out was recorded. Review and adjust if needed.
      </p>

      <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
        <thead>
          <tr style="background: #F5F0E8;">
            <th style="padding: 8px; text-align: left;">Staff</th>
            <th style="padding: 8px; text-align: left;">Event</th>
            <th style="padding: 8px; text-align: left;">Date</th>
            <th style="padding: 8px; text-align: right;">Hours</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="color: #6A2630; font-size: 13px;">
        <a href="https://bazaar47.com/admin/staff-dashboard" style="color: #295211;">
          Open the review queue →
        </a>
      </p>
    `
  )
}

/**
 * Fired by cron when an event is coming up and the coverage board is
 * not fully staffed. Nudges admin to publish more offers.
 */
export function notifyAdminUnderstaffed(
  eventId: string,
  eventName: string,
  eventDateIso: string,
  slotsNeeded: number,
  slotsFilled: number
): void {
  const admin = adminRecipient()
  if (admin.length === 0) return

  const missing = slotsNeeded - slotsFilled

  void send(
    admin,
    `🚨 ${eventName} is understaffed — ${missing} slot${missing === 1 ? '' : 's'} open`,
    `
      <h2 style="color: #A62630; margin-top: 0;">Understaffed event coming up</h2>
      <p style="color: #6A2630;">
        <strong>${eventName}</strong> is coming up and still needs staff.
      </p>

      <div style="background: #F5F0E8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(eventDateIso)}</p>
        <p style="margin: 4px 0;"><strong>Slots filled:</strong> ${slotsFilled} of ${slotsNeeded}</p>
        <p style="margin: 4px 0; color: #A62630;"><strong>Missing:</strong> ${missing} slot${missing === 1 ? '' : 's'}</p>
      </div>

      <p style="color: #6A2630; font-size: 13px;">
        <a href="https://bazaar47.com/admin/events/${eventId}/staff" style="color: #295211;">
          Open coverage board →
        </a>
      </p>
    `
  )
}