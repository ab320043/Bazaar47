'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign, Clock, Users, Calendar,
  ChevronLeft, ChevronRight, RefreshCw, Download,
  Printer, ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react'
import {
  getPeriodForDate,
  shiftPeriod,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'
import type {
  StaffPayrollRow,
  EventPayrollRow,
  PayrollTotals,
} from '@/lib/staff/payroll'
import { STAFF_ROLES } from '@/data/staff-roles'
import { downloadCsv } from '@/lib/staff/csv'

// ============================================
// TYPES
// ============================================

type Tab = 'staff' | 'event'

interface PayrollApiResponse {
  period: PayrollPeriod
  totals: PayrollTotals
  byStaff?: StaffPayrollRow[]
  byEvent?: EventPayrollRow[]
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRoleLabel(roleId: string): string {
  const role = STAFF_ROLES.find((r) => r.id === roleId)
  return role?.label || roleId
}

function escapeCsvCell(value: string | number): string {
  const str = String(value)
  if (str === '') return ''
  const needsQuotes =
    str.includes(',') || str.includes('"') || str.includes('\n')
  if (!needsQuotes) return str
  return `"${str.replace(/"/g, '""')}"`
}

function buildStaffCsv(
  rows: StaffPayrollRow[],
  period: PayrollPeriod
): string {
  const headers = [
    'Staff Name',
    'Shifts',
    'Hours',
    'Average Rate',
    'Total Earned',
  ]
  const lines = rows.map((r) =>
    [
      r.staffName,
      r.shiftCount,
      r.totalHours.toFixed(2),
      r.averageRate.toFixed(2),
      r.totalEarned.toFixed(2),
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  const totalHours = rows.reduce((s, r) => s + r.totalHours, 0)
  const totalEarned = rows.reduce((s, r) => s + r.totalEarned, 0)
  const totals = [
    'TOTAL',
    rows.reduce((s, r) => s + r.shiftCount, 0),
    totalHours.toFixed(2),
    '',
    totalEarned.toFixed(2),
  ]
    .map(escapeCsvCell)
    .join(',')

  return [
    `# Payroll — By Staff — ${period.label}`,
    headers.map(escapeCsvCell).join(','),
    ...lines,
    totals,
  ].join('\n')
}

function buildEventCsv(
  rows: EventPayrollRow[],
  period: PayrollPeriod
): string {
  const headers = [
    'Event Name',
    'Date',
    'Staff Count',
    'Hours',
    'Total Cost',
  ]
  const lines = rows.map((r) =>
    [
      r.eventName,
      formatDate(r.eventDate),
      r.staffCount,
      r.totalHours.toFixed(2),
      r.totalCost.toFixed(2),
    ]
      .map(escapeCsvCell)
      .join(',')
  )

  const totalHours = rows.reduce((s, r) => s + r.totalHours, 0)
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0)
  const totals = [
    'TOTAL',
    '',
    rows.reduce((s, r) => s + r.staffCount, 0),
    totalHours.toFixed(2),
    totalCost.toFixed(2),
  ]
    .map(escapeCsvCell)
    .join(',')

  return [
    `# Payroll — By Event — ${period.label}`,
    headers.map(escapeCsvCell).join(','),
    ...lines,
    totals,
  ].join('\n')
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPayrollPage() {
  const [data, setData] = useState<PayrollApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('staff')
  const [period, setPeriod] = useState<PayrollPeriod>(() => getPeriodForDate())
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null)

  const fetchPayroll = useCallback(
    async (targetPeriod: PayrollPeriod, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setError(null)
      try {
        const params = new URLSearchParams({
          periodStart: targetPeriod.startIso,
          periodEnd: targetPeriod.endIso,
          view: 'both',
        })
        const res = await fetch(`/api/admin/payroll?${params.toString()}`)
        if (!res.ok) {
          if (!opts?.silent) setError('Failed to load payroll')
          return
        }
        const body = (await res.json()) as PayrollApiResponse
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
    if (!data) return
    if (tab === 'staff' && data.byStaff) {
      const csv = buildStaffCsv(data.byStaff, data.period)
      downloadCsv(
        `payroll-by-staff-${data.period.startIso}_to_${data.period.endIso}.csv`,
        csv
      )
    } else if (tab === 'event' && data.byEvent) {
      const csv = buildEventCsv(data.byEvent, data.period)
      downloadCsv(
        `payroll-by-event-${data.period.startIso}_to_${data.period.endIso}.csv`,
        csv
      )
    }
  }

  const handlePrint = () => {
    const params = new URLSearchParams({
      periodStart: period.startIso,
      periodEnd: period.endIso,
      view: 'both',
    })
    window.open(
      `/admin/payroll/print?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const canExport =
    (tab === 'staff' && (data?.byStaff?.length ?? 0) > 0) ||
    (tab === 'event' && (data?.byEvent?.length ?? 0) > 0)

  // ---- LOADING ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <div className="text-rosewood/60 font-host-grotesk">Loading payroll...</div>
      </div>
    )
  }

  // ---- ERROR ----

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
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

  const { totals, byStaff = [], byEvent = [] } = data

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl md:text-4xl text-rosewood flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-rosewood/60" />
              Payroll
            </h1>
            <p className="font-host-grotesk text-rosewood/50 mt-1">
              Bi-weekly pay periods • {totals.staffCount} staff · {totals.eventCount} events
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPayroll(period)}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-white/80 text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExport}
              disabled={!canExport}
              title={canExport ? 'Export CSV' : 'Nothing to export'}
              className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
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
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
              Total Hours
            </p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood mt-1">
              {totals.totalHours}h
            </p>
            <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
              in this period
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
              Total Cost
            </p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood mt-1">
              {formatCurrency(totals.totalEarned)}
            </p>
            <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
              in this period
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
              Staff Paid
            </p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood mt-1">
              {totals.staffCount}
            </p>
            <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
              with completed shifts
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-rosewood/5 shadow-sm">
            <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
              Events Staffed
            </p>
            <p className="font-host-grotesk text-2xl font-bold text-rosewood mt-1">
              {totals.eventCount}
            </p>
            <p className="font-host-grotesk text-xs text-rosewood/40 mt-0.5">
              in this period
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-rosewood/10 mb-6">
          <button
            onClick={() => {
              setTab('staff')
              setExpandedStaffId(null)
            }}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all flex items-center gap-1.5 ${
              tab === 'staff'
                ? 'text-rosewood border-b-2 border-rosewood'
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <Users className="w-4 h-4" />
            By Staff ({byStaff.length})
          </button>
          <button
            onClick={() => {
              setTab('event')
              setExpandedStaffId(null)
            }}
            className={`px-4 py-2 font-host-grotesk font-semibold text-sm transition-all flex items-center gap-1.5 ${
              tab === 'event'
                ? 'text-rosewood border-b-2 border-rosewood'
                : 'text-rosewood/40 hover:text-rosewood/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            By Event ({byEvent.length})
          </button>
        </div>

        {/* Tab content */}
        {tab === 'staff' && (
          <>
            {byStaff.length === 0 ? (
              <EmptyState label="staff member" />
            ) : (
              <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-plaster/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50 w-10"></th>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Staff Name
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Shifts
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Hours
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Avg Rate
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Total Earned
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byStaff.map((row) => {
                        const isExpanded = expandedStaffId === row.staffId
                        return (
                          <>
                            <tr
                              key={row.staffId}
                              onClick={() =>
                                setExpandedStaffId(
                                  isExpanded ? null : row.staffId
                                )
                              }
                              className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3 text-rosewood/40">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </td>
                              <td className="px-4 py-3 font-host-grotesk font-semibold text-rosewood">
                                {row.staffName}
                              </td>
                              <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right">
                                {row.shiftCount}
                              </td>
                              <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right">
                                {row.totalHours.toFixed(2)}h
                              </td>
                              <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right">
                                ${row.averageRate.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 font-host-grotesk font-semibold text-rosewood text-right">
                                {formatCurrency(row.totalEarned)}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${row.staffId}-expand`}>
                                <td colSpan={6} className="bg-plaster/20 border-t border-rosewood/5 p-4">
                                  <div className="space-y-2">
                                    {row.shifts.map((shift) => (
                                      <div
                                        key={shift.assignmentId}
                                        className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-3 border border-rosewood/5"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="font-host-grotesk font-semibold text-sm text-rosewood truncate">
                                            {shift.eventName}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {shift.roles.map((role) => (
                                              <span
                                                key={role}
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rosewood/8 text-rosewood/60"
                                              >
                                                {getRoleLabel(role)}
                                              </span>
                                            ))}
                                            <span className="font-host-grotesk text-xs text-rosewood/40">
                                              {formatDate(shift.shiftStart)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="font-host-grotesk text-xs text-rosewood/50">
                                            {shift.hoursWorked.toFixed(2)}h × ${shift.hourlyRate.toFixed(2)}
                                          </p>
                                          <p className="font-host-grotesk font-semibold text-sm text-rosewood">
                                            {formatCurrency(shift.amount)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-plaster/40 border-t-2 border-rosewood/10">
                      <tr>
                        <td />
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood uppercase text-sm">
                          Totals
                        </td>
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {byStaff.reduce((s, r) => s + r.shiftCount, 0)}
                        </td>
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {totals.totalHours.toFixed(2)}h
                        </td>
                        <td />
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {formatCurrency(totals.totalEarned)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'event' && (
          <>
            {byEvent.length === 0 ? (
              <EmptyState label="event" />
            ) : (
              <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-plaster/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Event
                        </th>
                        <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Date
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Staff
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Hours
                        </th>
                        <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byEvent.map((row) => (
                        <tr
                          key={row.eventId}
                          className="border-t border-rosewood/5 hover:bg-plaster/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/events/${row.eventId}/staff`}
                              className="font-host-grotesk font-semibold text-rosewood hover:text-chartreuse transition-colors"
                            >
                              {row.eventName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 whitespace-nowrap">
                            {formatDate(row.eventDate)}
                          </td>
                          <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right">
                            {row.staffCount}
                          </td>
                          <td className="px-4 py-3 font-host-grotesk text-sm text-rosewood/60 text-right">
                            {row.totalHours.toFixed(2)}h
                          </td>
                          <td className="px-4 py-3 font-host-grotesk font-semibold text-rosewood text-right">
                            {formatCurrency(row.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-plaster/40 border-t-2 border-rosewood/10">
                      <tr>
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood uppercase text-sm">
                          Totals
                        </td>
                        <td />
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {byEvent.reduce((s, r) => s + r.staffCount, 0)}
                        </td>
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {totals.totalHours.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 font-host-grotesk font-bold text-rosewood text-right text-sm">
                          {formatCurrency(totals.totalEarned)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 border border-rosewood/5 shadow-sm text-center">
      <AlertCircle className="w-12 h-12 text-rosewood/20 mx-auto mb-3" />
      <p className="font-host-grotesk text-rosewood/50">
        No completed shifts for any {label} in this period
      </p>
      <p className="font-host-grotesk text-sm text-rosewood/30 mt-1">
        Try navigating to a different pay period above.
      </p>
    </div>
  )
}