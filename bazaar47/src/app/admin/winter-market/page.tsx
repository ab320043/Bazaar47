// app/admin/winter-market/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Undo2,
  Users,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import type { WinterMarketApplication } from '@/types/winter-market'

interface Availability {
  date: string
  spotsTaken: number
  spotsTotal: number
  spotsRemaining: number
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminWinterMarketPage() {
  const [applications, setApplications] = useState<WinterMarketApplication[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Action states
  const [refunding, setRefunding] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<WinterMarketApplication | null>(null)

  const fetchAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null)
    try {
      const res = await fetch('/api/admin/winter-market')
      if (!res.ok) {
        if (!opts?.silent) setError('Failed to load data')
        return
      }
      const data = await res.json()
      setApplications(data.applications || [])
      setAvailability(data.availability || [])
    } catch (err) {
      console.error('Admin winter market fetch error:', err)
      if (!opts?.silent) setError('Network error')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => void fetchAll(), 0)
    return () => window.clearTimeout(t)
  }, [fetchAll])

  const handleRefund = async (app: WinterMarketApplication) => {
    if (!confirm(`Refund $${app.totalPaid} to ${app.fullName}? The spot will be freed up.`)) return
    setRefunding(app.id)
    try {
      const res = await fetch('/api/admin/winter-market/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      })
      const body = await res.json()
      if (!res.ok) {
        alert(body.error || 'Refund failed')
        return
      }
      await fetchAll({ silent: true })
    } catch {
      alert('Network error')
    } finally {
      setRefunding(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/winter-market/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Failed to delete application')
        return
      }
      setDeleteConfirmApp(null)
      await fetchAll({ silent: true })
    } catch {
      alert('Network error while deleting')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    const paid = applications.filter((a) => a.paymentStatus === 'paid')
    const headers = [
      'Name',
      'Business',
      'Email',
      'Phone',
      'Instagram',
      'Products',
      'Dates',
      'Needs',
      'Amount Paid',
    ]
    const rows = paid.map((a) => [
      a.fullName,
      a.businessName,
      a.email,
      a.phone,
      a.instagram || '',
      a.products.replace(/\n/g, ' '),
      a.selectedDates.join('; '),
      [
        a.needsTable && 'Table',
        a.needsTent && 'Tent',
        a.needsElectricity && 'Electricity',
        a.needsExtensionCord && 'Cord',
      ].filter(Boolean).join('; '),
      a.totalPaid?.toFixed(2) || '0.00',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `winter-market-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <AlertCircle className="w-12 h-12 text-poppy/40 mb-3" />
        <div className="text-rosewood/60 font-host-grotesk">{error}</div>
        <button
          onClick={() => fetchAll()}
          className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold"
        >
          Retry
        </button>
      </div>
    )
  }

  const paid = applications.filter((a) => a.paymentStatus === 'paid')
  const totalRevenue = paid.reduce((s, a) => s + (a.totalPaid || 0), 0)

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood flex items-center gap-2">
              <Calendar className="w-8 h-8 text-rosewood/60" />
              Downtown Winter Market
            </h1>
            <p className="font-host-grotesk text-rosewood/50 text-sm mt-1">
              {applications.length} applications · {paid.length} paid · ${totalRevenue.toFixed(2)} revenue
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAll()}
              className="bg-white text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-white/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={paid.length === 0}
              className="bg-chartreuse text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 shadow-sm disabled:opacity-40 hover:bg-chartreuse/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Availability grid */}
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-5 mb-6">
          <h2 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Spots Remaining
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {availability.map((a) => {
              const pct = a.spotsTaken / a.spotsTotal
              return (
                <div
                  key={a.date}
                  className={`p-3 rounded-xl border-2 ${
                    a.spotsRemaining === 0
                      ? 'border-poppy/40 bg-poppy/5'
                      : 'border-rosewood/10 bg-plaster/30'
                  }`}
                >
                  <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">
                    {formatDate(a.date)}
                  </p>
                  <p className="font-host-grotesk font-bold text-rosewood text-lg">
                    {a.spotsRemaining}
                    <span className="text-xs text-rosewood/40"> / {a.spotsTotal}</span>
                  </p>
                  <div className="h-1 bg-rosewood/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        a.spotsRemaining === 0 ? 'bg-poppy' : 'bg-chartreuse'
                      }`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Applications table */}
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-plaster/40">
                <tr>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Vendor
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Dates
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Needs
                  </th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Paid
                  </th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-t border-rosewood/5 hover:bg-plaster/20">
                    <td className="px-4 py-3 align-top">
                      <p className="font-host-grotesk font-semibold text-rosewood text-sm">
                        {a.fullName}
                      </p>
                      <p className="font-host-grotesk text-xs text-rosewood/60">
                        {a.businessName}
                      </p>
                      <p className="font-host-grotesk text-xs text-rosewood/40">
                        {a.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {a.selectedDates.map((d) => (
                          <span
                            key={d}
                            className="text-[10px] font-semibold bg-chartreuse/15 text-cypress px-1.5 py-0.5 rounded-full"
                          >
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-host-grotesk text-xs text-rosewood/60">
                      {[
                        a.needsTable && 'Table',
                        a.needsTent && 'Tent',
                        a.needsElectricity && 'Elec',
                        a.needsExtensionCord && 'Cord',
                      ].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-right font-host-grotesk text-sm font-semibold text-rosewood">
                      {a.totalPaid ? `$${a.totalPaid.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          a.paymentStatus === 'paid'
                            ? 'bg-chartreuse/20 text-cypress'
                            : a.paymentStatus === 'refunded'
                            ? 'bg-poppy/10 text-poppy'
                            : a.paymentStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rosewood/10 text-rosewood/50'
                        }`}
                      >
                        {a.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-3">
                        {a.paymentStatus === 'paid' && (
                          <button
                            onClick={() => handleRefund(a)}
                            disabled={refunding === a.id}
                            className="text-xs font-host-grotesk text-rosewood/50 hover:text-poppy transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Refund payment"
                          >
                            {refunding === a.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Undo2 className="w-3 h-3" />
                            )}
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmApp(a)}
                          className="text-xs font-host-grotesk text-rosewood/50 hover:text-poppy transition-colors flex items-center gap-1"
                          title="Delete application"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 font-host-grotesk text-rosewood/40">
                      No applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmApp && (
        <div className="fixed inset-0 z-50 bg-rosewood/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-poppy/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-poppy" />
                </div>
                <div>
                  <h3 className="font-host-grotesk font-bold text-xl text-rosewood">
                    Delete Application?
                  </h3>
                  <p className="font-host-grotesk text-sm text-rosewood/60 mt-2">
                    Are you sure you want to remove <strong>{deleteConfirmApp.fullName}</strong>?
                  </p>
                  <p className="font-host-grotesk text-sm text-rosewood/60 mt-2">
                    This will immediately free up their spots on the calendar. <strong>This action cannot be undone.</strong>
                  </p>
                  {deleteConfirmApp.paymentStatus === 'paid' && (
                    <div className="bg-poppy/5 border border-poppy/20 rounded-xl p-3 mt-4">
                      <p className="text-poppy text-xs font-host-grotesk font-semibold">
                        ⚠️ This vendor has paid. If you delete them, their spot is freed but you will need to manually issue a refund through the Stripe Dashboard.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-plaster/30 p-4 border-t border-rosewood/5 flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmApp.id)}
                disabled={deletingId === deleteConfirmApp.id}
                className="flex-1 bg-poppy hover:bg-poppy/90 text-plaster font-host-grotesk font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === deleteConfirmApp.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmApp(null)}
                disabled={deletingId === deleteConfirmApp.id}
                className="flex-1 bg-white hover:bg-plaster/50 text-rosewood border border-rosewood/10 font-host-grotesk font-bold py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}