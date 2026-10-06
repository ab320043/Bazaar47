// app/admin/payroll/print/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getPeriodForDate,
  type PayrollPeriod,
} from '@/lib/staff/payroll-period'
import type {
  StaffPayrollRow,
  EventPayrollRow,
  PayrollTotals,
} from '@/lib/staff/payroll'
import { STAFF_ROLES } from '@/data/staff-roles'

// ============================================
// TYPES
// ============================================

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

// ============================================
// MAIN
// ============================================

export default function PayrollPrintPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<PayrollApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayroll = useCallback(async () => {
    setError(null)
    try {
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')

      const params = new URLSearchParams({ view: 'both' })
      if (periodStart) params.set('periodStart', periodStart)
      if (periodEnd) params.set('periodEnd', periodEnd)

      const res = await fetch(`/api/admin/payroll?${params.toString()}`)
      if (!res.ok) {
        setError('Failed to load payroll')
        return
      }
      const body = (await res.json()) as PayrollApiResponse
      setData(body)
    } catch (err) {
      console.error('Print payroll error:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayroll()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchPayroll])

  // Auto-print once data has rendered
  useEffect(() => {
    if (!loading && data) {
      const t = window.setTimeout(() => {
        window.print()
      }, 300) // let paint settle
      return () => window.clearTimeout(t)
    }
  }, [loading, data])

  if (loading) {
    return (
      <div className="p-8 text-center font-host-grotesk text-rosewood/60">
        Loading payroll...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center font-host-grotesk text-poppy">
        {error || 'No data'}
      </div>
    )
  }

  const { period, totals, byStaff = [], byEvent = [] } = data

  return (
    <>
      {/* Print-specific styles — hide nav, tighten spacing, black on white */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-white text-rosewood p-6 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 pb-4 border-b-2 border-rosewood/20">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">
                Bazaar47 Payroll
              </h1>
              <p className="font-host-grotesk text-rosewood/60 mt-1">
                {period.label}
              </p>
            </div>
            <div className="text-right">
              <p className="font-host-grotesk text-xs text-rosewood/40 uppercase tracking-wider">
                Period
              </p>
              <p className="font-host-grotesk text-sm text-rosewood">
                {period.startIso} → {period.endIso}
              </p>
              <p className="font-host-grotesk text-xs text-rosewood/40 mt-2">
                Printed {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-rosewood/20 rounded-lg p-3">
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">
              Total Hours
            </p>
            <p className="font-host-grotesk font-bold text-lg text-rosewood">
              {totals.totalHours}h
            </p>
          </div>
          <div className="border border-rosewood/20 rounded-lg p-3">
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">
              Total Cost
            </p>
            <p className="font-host-grotesk font-bold text-lg text-rosewood">
              {formatCurrency(totals.totalEarned)}
            </p>
          </div>
          <div className="border border-rosewood/20 rounded-lg p-3">
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">
              Staff Paid
            </p>
            <p className="font-host-grotesk font-bold text-lg text-rosewood">
              {totals.staffCount}
            </p>
          </div>
          <div className="border border-rosewood/20 rounded-lg p-3">
            <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">
              Events
            </p>
            <p className="font-host-grotesk font-bold text-lg text-rosewood">
              {totals.eventCount}
            </p>
          </div>
        </div>

        {/* By Staff table */}
        <section className="mb-10">
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-3">
            By Staff
          </h2>
          {byStaff.length === 0 ? (
            <p className="font-host-grotesk text-sm text-rosewood/50 italic">
              No completed shifts in this period.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-rosewood/30">
                  <th className="text-left py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Staff Name
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Shifts
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Hours
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Avg Rate
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {byStaff.map((row) => (
                  <tr key={row.staffId} className="border-b border-rosewood/10">
                    <td className="py-2 px-2 font-host-grotesk">
                      {row.staffName}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right">
                      {row.shiftCount}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right">
                      {row.totalHours.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right">
                      ${row.averageRate.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right font-semibold">
                      {formatCurrency(row.totalEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-rosewood/30">
                  <td className="py-2 px-2 font-host-grotesk font-bold text-sm">
                    TOTAL
                  </td>
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {byStaff.reduce((s, r) => s + r.shiftCount, 0)}
                  </td>
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {totals.totalHours.toFixed(2)}
                  </td>
                  <td />
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {formatCurrency(totals.totalEarned)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* By Event table — page break in print */}
        <section className="page-break">
          <h2 className="font-host-grotesk font-bold text-xl text-rosewood mb-3">
            By Event
          </h2>
          {byEvent.length === 0 ? (
            <p className="font-host-grotesk text-sm text-rosewood/50 italic">
              No completed shifts in this period.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-rosewood/30">
                  <th className="text-left py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Event
                  </th>
                  <th className="text-left py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Date
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Staff
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Hours
                  </th>
                  <th className="text-right py-2 px-2 font-host-grotesk font-bold text-xs uppercase tracking-wider text-rosewood/70">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {byEvent.map((row) => (
                  <tr key={row.eventId} className="border-b border-rosewood/10">
                    <td className="py-2 px-2 font-host-grotesk">
                      {row.eventName}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk">
                      {formatDate(row.eventDate)}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right">
                      {row.staffCount}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right">
                      {row.totalHours.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 font-host-grotesk text-right font-semibold">
                      {formatCurrency(row.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-rosewood/30">
                  <td className="py-2 px-2 font-host-grotesk font-bold text-sm">
                    TOTAL
                  </td>
                  <td />
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {byEvent.reduce((s, r) => s + r.staffCount, 0)}
                  </td>
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {totals.totalHours.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 font-host-grotesk text-right font-bold">
                    {formatCurrency(totals.totalEarned)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Manual print button — hidden in print, shown on screen for convenience */}
        <div className="no-print mt-8 pt-6 border-t border-rosewood/10 flex justify-center">
          <button
            onClick={() => window.print()}
            className="bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold hover:bg-rosewood/80 transition-colors"
          >
            Print again
          </button>
        </div>
      </div>
    </>
  )
}