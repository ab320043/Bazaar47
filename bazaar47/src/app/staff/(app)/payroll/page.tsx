// app/staff/(app)/payroll/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { StaffRole } from '@/types/staff'
import { STAFF_ROLES } from '@/data/staff-roles'
import {
  getPeriodForDate,
  shiftPeriod,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'
import { downloadCsv } from '@/lib/staff/csv'

// ============================================
// TYPES
// ============================================

interface PayrollLedgerEntry {
  assignmentId: string
  eventId: string
  eventName: string
  roles: StaffRole[]
  position: string
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  hourlyRate: number
  amount: number
}

interface PayrollResponse {
  period: PayrollPeriod
  entries: PayrollLedgerEntry[]
  totals: { hours: number; earned: number }
  lifetime: { hours: number; earned: number }
}

// ============================================
// HELPERS
// ============================================

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getRoleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function escapeCsvCell(value: string | number): string {
  const str = String(value)
  if (str === '') return ''
  const needsQuotes =
    str.includes(',') || str.includes('"') || str.includes('\n')
  if (!needsQuotes) return str
  return `"${str.replace(/"/g, '""')}"`
}

function buildLedgerCsv(entries: PayrollLedgerEntry[], period: PayrollPeriod): string {
  const headers = [
    'Date',
    'Event',
    'Roles',
    'Shift Start',
    'Shift End',
    'Hours',
    'Rate',
    'Amount',
  ]
  const rows = entries.map((e) => [
    formatDate(e.shiftStart),
    e.eventName,
    e.roles.map(getRoleLabel).join(', '),
    new Date(e.shiftStart).toLocaleString(),
    new Date(e.shiftEnd).toLocaleString(),
    e.hoursWorked.toFixed(2),
    e.hourlyRate.toFixed(2),
    e.amount.toFixed(2),
  ])
  const totalHours = entries.reduce((s, e) => s + e.hoursWorked, 0)
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)
  const totals = ['TOTAL', '', '', '', '', totalHours.toFixed(2), '', totalAmount.toFixed(2)]

  return [
    `# Payroll — ${period.label}`,
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    totals.map(escapeCsvCell).join(','),
  ].join('\n')
}

// ============================================
// MAIN
// ============================================

export default function StaffPayrollPage() {
  const [data, setData] = useState<PayrollResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Current period is tracked in state so prev/next can navigate.
  const [period, setPeriod] = useState<PayrollPeriod>(() => getPeriodForDate())

  const fetchPayroll = useCallback(
    async (targetPeriod: PayrollPeriod, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setError(null)
      try {
        const params = new URLSearchParams({
          periodStart: targetPeriod.startIso,
          periodEnd: targetPeriod.endIso,
        })
        const res = await fetch(`/api/staff/payroll?${params.toString()}`)
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/staff/login'
            return
          }
          if (!opts?.silent) setError('Failed to load payroll')
          return
        }
        const body = (await res.json()) as PayrollResponse
        setData(body)
      } catch (err) {
        console.error('Payroll fetch error:', err)
        if (!opts?.silent) setError('Network error — please try again')
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayroll(period)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [period, fetchPayroll])

  const handlePrev = () => setPeriod((p) => shiftPeriod(p, -1))
  const handleNext = () => setPeriod((p) => shiftPeriod(p, 1))
  const handleCurrent = () => setPeriod(getPeriodForDate())

  const isCurrentPeriod = useMemo(() => {
    const current = getPeriodForDate()
    return current.startIso === period.startIso
  }, [period])

  const handleExport = () => {
    if (!data || data.entries.length === 0) return
    const csv = buildLedgerCsv(data.entries, data.period)
    downloadCsv(
      `payroll-${data.period.startIso}_to_${data.period.endIso}.csv`,
      csv
    )
  }

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-rosewood/60 font-host-grotesk">Loading payroll...</div>
      </div>
    )
  }

  // ---- ERROR ----

  if (error || !data) {
    return (
      <div className="p-6 lg:p-10">
        <div className="text-poppy text-xl font-host-grotesk font-bold mb-2">
          ⚠️ Error
        </div>
        <div className="text-rosewood/60 font-host-grotesk">
          {error || 'No data available'}
        </div>
        <button
          onClick={() => fetchPayroll(period)}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Title + export */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
            Payroll
          </h1>
          <p className="font-host-grotesk text-rosewood/50 text-sm mt-0.5">
            Your shift ledger and earnings
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={data.entries.length === 0}
          title={data.entries.length === 0 ? 'No shifts in this period' : 'Export CSV'}
          className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handlePrev}
            aria-label="Previous period"
            className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
              {isCurrentPeriod ? 'Current Period' : 'Pay Period'}
            </p>
            <p className="font-host-grotesk font-bold text-base md:text-lg text-rosewood truncate">
              {data.period.label}
            </p>
          </div>

          <button
            onClick={handleNext}
            aria-label="Next period"
            className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {!isCurrentPeriod && (
          <div className="mt-3 text-center">
            <button
              onClick={handleCurrent}
              className="font-host-grotesk text-xs text-chartreuse hover:text-chartreuse/80 transition-colors"
            >
              ← Jump to current period
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Hours (period)
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {data.totals.hours}h
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Earned (period)
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {formatCurrency(data.totals.earned)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Lifetime Hours
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {data.lifetime.hours}h
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-rosewood/5 shadow-sm">
          <p className="font-host-grotesk text-[10px] text-rosewood/40 uppercase tracking-wider">
            Lifetime Earned
          </p>
          <p className="font-host-grotesk text-xl font-bold text-rosewood mt-1">
            {formatCurrency(data.lifetime.earned)}
          </p>
        </div>
      </div>

      {/* Ledger */}
      {data.entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
          <p className="font-host-grotesk text-rosewood/50">
            No completed shifts in this period
          </p>
          <p className="font-host-grotesk text-sm text-rosewood/30 mt-1">
            Try navigating to a different pay period above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-plaster/40">
                <tr>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Roles
                  </th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Hours
                  </th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Rate
                  </th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr
                    key={e.assignmentId}
                    className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood whitespace-nowrap">
                      {formatDate(e.shiftStart)}
                    </td>
                    <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/80">
                      {e.eventName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.roles.map((roleId) => (
                          <span
                            key={roleId}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rosewood/8 text-rosewood/60"
                          >
                            {getRoleLabel(roleId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right whitespace-nowrap">
                      {e.hoursWorked.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right whitespace-nowrap">
                      ${e.hourlyRate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-host-grotesk text-sm font-semibold text-rosewood text-right whitespace-nowrap">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-plaster/30 border-t-2 border-rosewood/10">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 font-host-grotesk font-bold text-sm text-rosewood uppercase"
                  >
                    Totals
                  </td>
                  <td className="px-4 py-3 font-host-grotesk font-bold text-sm text-rosewood text-right">
                    {data.totals.hours.toFixed(2)}
                  </td>
                  <td />
                  <td className="px-4 py-3 font-host-grotesk font-bold text-sm text-rosewood text-right">
                    {formatCurrency(data.totals.earned)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-rosewood/5">
            {data.entries.map((e) => (
              <div key={e.assignmentId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-host-grotesk font-semibold text-rosewood truncate">
                      {e.eventName}
                    </p>
                    <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
                      {formatDate(e.shiftStart)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {e.roles.map((roleId) => (
                        <span
                          key={roleId}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rosewood/8 text-rosewood/60"
                        >
                          {getRoleLabel(roleId)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-host-grotesk font-bold text-rosewood">
                      {formatCurrency(e.amount)}
                    </p>
                    <p className="font-host-grotesk text-xs text-rosewood/50 mt-0.5">
                      {e.hoursWorked.toFixed(2)}h × ${e.hourlyRate.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 bg-plaster/30">
              <div className="flex items-center justify-between">
                <p className="font-host-grotesk font-bold text-sm text-rosewood uppercase">
                  Period Total
                </p>
                <div className="text-right">
                  <p className="font-host-grotesk font-bold text-rosewood">
                    {formatCurrency(data.totals.earned)}
                  </p>
                  <p className="font-host-grotesk text-xs text-rosewood/50">
                    {data.totals.hours.toFixed(2)}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}