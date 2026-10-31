# Reconciliation Cron — Reference

## What it does

Every 15 minutes, `/api/cron/reconcile-shifts` runs three sweeps against
`staff_assignments`:

### Step 1 — No-show sweep
**Matches:** `status === 'checked-in' && !checkInTime && now > shiftStart + 30min`
**Action:** sets `assignment.noShow = true`.
**Effect:** no work log created. Slot appears as a no-show in the admin UI. No pay.

### Step 2 — Auto-close sweep
**Matches:** `status === 'checked-in' && checkInTime && !checkOutTime && now > shiftEnd + 1h`
**Action:** creates/updates a work log with `checkOutTime = shiftEnd`.
**Effect:** shift is auto-closed at the scheduled end time. `needsReview = true`.
The admin review queue surfaces it. Pay is calculated from `checkInTime` to `shiftEnd`,
minus any logged break.

### Step 3 — Backfill sweep
**Matches:** `status === 'completed' && checkOutTime && !existingWorkLog`
**Action:** creates a work log with `resolution: 'manual'`.
**Effect:** any completed assignment that was created before Phase 0 gets a
work log entry. New completed assignments continue to be handled by the
auto-close or check-out flow directly.

## Ordering

Steps MUST run in this order: 1 → 2 → 3.
If a person confirmed, never checked in, and their shift is 5 hours old,
step 1 marks them as a no-show. Step 2 filters on `checkInTime` being
present, so it can't accidentally auto-close them.

## Idempotency

Every sweep queries for records that match the condition, then mutates
them. Re-running the cron after a Vercel hiccup finds nothing new.
Safe to run manually at any time.

## Defaults (Phase 0)

- Grace period: **1 hour** after `shiftEnd`
- No-show tolerance: **30 minutes** after `shiftStart`

Both are hardcoded in `src/lib/staff/reconcile.ts` for Phase 0.
Phase 2 will make them per-offer.

## Run history

The last 500 runs are stored in Redis under `staff_reconcile_runs`.
Each record contains `ranAt`, counts, and any errors. The admin UI
(`/admin/staff-dashboard` → "Needs review" → "Cron" panel) shows the
last 5.

## Manual trigger (development / debugging)

```bash
# Dry run — logs what would happen, writes nothing
curl -H "Authorization: Bearer $CRON_SECRET" \
  'http://localhost:3000/api/cron/reconcile-shifts?dryRun=true'

# Real run
curl -H "Authorization: Bearer $CRON_SECRET" \
  'http://localhost:3000/api/cron/reconcile-shifts'