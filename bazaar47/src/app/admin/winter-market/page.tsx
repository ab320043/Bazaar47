// app/admin/winter-market/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import {
  Calendar, Loader2, AlertCircle, RefreshCw, Download,
  Undo2, Users, Trash2, X, AlertTriangle, ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import type { WinterMarketApplication } from '@/types/winter-market'
import { WINTER_MARKET_DATES } from '@/data/winter-market'

interface Availability {
  date: string
  spotsTaken: number
  spotsTotal: number
  spotsRemaining: number
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function AdminWinterMarketPage() {
  const [applications, setApplications] = useState<WinterMarketApplication[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  
  // Action states
  const [refunding, setRefunding] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<WinterMarketApplication | null>(null)

  // Filter & Expand States
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      })
      const body = await res.json()
      if (!res.ok) return alert(body.error || 'Refund failed')
      await fetchAll({ silent: true })
    } catch { alert('Network error') } finally { setRefunding(null) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/winter-market/${id}`, { method: 'DELETE' })
      if (!res.ok) return alert('Failed to delete application')
      setDeleteConfirmApp(null)
      await fetchAll({ silent: true })
    } catch { alert('Network error while deleting') } finally { setDeletingId(null) }
  }


   // Add this function under handleManualApprove
  const handleSyncStripe = async () => {
    if (!confirm('This will fetch recent successful payments from Stripe and mark them as PAID. Proceed?')) return
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/winter-market/sync', { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || 'Sync failed')
        return
      }
      
      alert(data.message)
      await fetchAll({ silent: true })
    } catch {
      alert('Network error during sync')
    } finally {
      setSyncing(false)
    }
  }

  // Filter logic
  const filteredApplications = useMemo(() => {
    if (dateFilter === 'all') return applications
    return applications.filter(a => a.selectedDates.includes(dateFilter))
  }, [applications, dateFilter])

  // CSV Export Logic (handles multi-date cleanly)
  const handleExport = () => {
    const paid = filteredApplications.filter((a) => a.paymentStatus === 'paid')
    
    const headers = [
      'Name', 'Preferred Name', 'Pronouns', 'Business Name',
      'Email', 'Phone', 'Instagram', 'City', 'Products', 'Price Points',
      'Portfolio Link', 'Sound Sensitivity', 'Accessibility Needs', 
      'Consent Highlight', 'Consent Media', 'Dates', 'Amount Paid'
    ]
    
    const rows = paid.map((a) => [
      a.fullName,
      a.preferredName || '',
      a.pronouns || '',
      a.businessName,
      a.email,
      a.phone,
      a.instagram,
      a.city,
      a.products.replace(/\n/g, ' '),
      a.pricePoints,
      a.portfolioLink,
      a.soundSensitivity,
      a.accessibilityNeeds?.replace(/\n/g, ' ') || '',
      a.consentHighlight,
      a.consentMedia,
      a.selectedDates.map(d => formatDate(d)).join(', '), // Comma separated for Excel
      a.totalPaid?.toFixed(2) || '0.00',
    ])
    
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
      
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `winter-market-export-${dateFilter === 'all' ? 'all-dates' : dateFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-plaster"><Loader2 className="w-8 h-8 animate-spin text-rosewood/40" /></div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-plaster p-4">
        <AlertCircle className="w-12 h-12 text-poppy/40 mb-3" />
        <div className="text-rosewood/60 font-host-grotesk">{error}</div>
        <button onClick={() => fetchAll()} className="mt-6 bg-rosewood text-plaster px-6 py-2 rounded-xl font-host-grotesk font-semibold">Retry</button>
      </div>
    )
  }

  const paid = filteredApplications.filter((a) => a.paymentStatus === 'paid')
  const totalRevenue = paid.reduce((s, a) => s + (a.totalPaid || 0), 0)

  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood flex items-center gap-2">
              <Calendar className="w-8 h-8 text-rosewood/60" />
              Downtown Winter Market
            </h1>
            <p className="font-host-grotesk text-rosewood/50 text-sm mt-1">
              {filteredApplications.length} filtered · {paid.length} paid · ${totalRevenue.toFixed(2)} revenue
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* Date Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rosewood/40" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-rosewood/10 rounded-xl font-host-grotesk text-sm text-rosewood focus:outline-none focus:ring-2 focus:ring-chartreuse/40 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">All Dates</option>
                {WINTER_MARKET_DATES.map(d => (
                  <option key={d} value={d}>{formatDate(d)}</option>
                ))}
              </select>
            </div>

            <button onClick={() => fetchAll()} className="bg-white text-rosewood/60 px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-white/80 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleExport} className="bg-chartreuse text-grove px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 shadow-sm disabled:opacity-40 hover:bg-chartreuse/90 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
             <button 
              onClick={handleSyncStripe} 
              disabled={syncing} 
              className="bg-rosewood text-plaster px-4 py-2 rounded-xl font-host-grotesk font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-rosewood/90 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} 
              Sync Stripe
            </button>
          </div>
        </div>

        {/* Availability grid */}
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-5 mb-6">
          <h2 className="font-host-grotesk font-bold text-lg text-rosewood mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" /> Spots Remaining
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {availability.map((a) => {
              const pct = a.spotsTaken / a.spotsTotal
              return (
                <div key={a.date} className={`p-3 rounded-xl border-2 ${a.spotsRemaining === 0 ? 'border-poppy/40 bg-poppy/5' : 'border-rosewood/10 bg-plaster/30'}`}>
                  <p className="font-host-grotesk text-[10px] uppercase tracking-wider text-rosewood/50">{formatDate(a.date)}</p>
                  <p className="font-host-grotesk font-bold text-rosewood text-lg">
                    {a.spotsRemaining} <span className="text-xs text-rosewood/40"> / {a.spotsTotal}</span>
                  </p>
                  <div className="h-1 bg-rosewood/10 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${a.spotsRemaining === 0 ? 'bg-poppy' : 'bg-chartreuse'}`} style={{ width: `${pct * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-plaster/40">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Vendor</th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Dates</th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Paid</th>
                  <th className="text-left px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Status</th>
                  <th className="text-right px-4 py-3 font-host-grotesk font-semibold text-xs uppercase text-rosewood/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((a) => {
                  const isExpanded = expandedId === a.id
                  return (
                    <Fragment key={a.id}>
                      {/* Main Row */}
                      <tr 
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className={`border-t border-rosewood/5 hover:bg-plaster/20 cursor-pointer transition-colors ${isExpanded ? 'bg-plaster/10' : ''}`}
                      >
                        <td className="px-4 py-3 text-center text-rosewood/40">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-host-grotesk font-semibold text-rosewood text-sm">{a.fullName}</p>
                          <p className="font-host-grotesk text-xs text-rosewood/60">{a.businessName}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {a.selectedDates.map((d) => (
                              <span key={d} className="text-[10px] font-semibold bg-chartreuse/15 text-cypress px-1.5 py-0.5 rounded-full">{formatDate(d)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-right font-host-grotesk text-sm font-semibold text-rosewood">
                          {a.totalPaid ? `$${a.totalPaid.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${a.paymentStatus === 'paid' ? 'bg-chartreuse/20 text-cypress' : a.paymentStatus === 'refunded' ? 'bg-poppy/10 text-poppy' : a.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rosewood/10 text-rosewood/50'}`}>
                            {a.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                            {a.paymentStatus === 'paid' && (
                              <button onClick={() => handleRefund(a)} disabled={refunding === a.id} className="text-xs font-host-grotesk text-rosewood/50 hover:text-poppy transition-colors flex items-center gap-1 disabled:opacity-50">
                                {refunding === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />} Refund
                              </button>
                            )}
                            <button onClick={() => setDeleteConfirmApp(a)} className="text-xs font-host-grotesk text-rosewood/50 hover:text-poppy transition-colors flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-plaster/20 border-b border-rosewood/5">
                          <td colSpan={6} className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              <div>
                                <h4 className="font-host-grotesk font-bold text-sm text-rosewood mb-3 uppercase tracking-wider">Contact Info</h4>
                                <div className="space-y-2 text-sm font-host-grotesk text-rosewood/80">
                                  <p><strong>Preferred Name:</strong> {a.preferredName || '—'}</p>
                                  <p><strong>Pronouns:</strong> {a.pronouns || '—'}</p>
                                  <p><strong>Email:</strong> <a href={`mailto:${a.email}`} className="text-cypress hover:underline">{a.email}</a></p>
                                  <p><strong>Phone:</strong> {a.phone}</p>
                                  <p><strong>Instagram:</strong> {a.instagram}</p>
                                  <p><strong>City:</strong> {a.city}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-host-grotesk font-bold text-sm text-rosewood mb-3 uppercase tracking-wider">Booth Details</h4>
                                <div className="space-y-2 text-sm font-host-grotesk text-rosewood/80">
                                  <p><strong>Products:</strong> {a.products}</p>
                                  <p><strong>Price Points:</strong> {a.pricePoints}</p>
                                  <p><strong>Portfolio:</strong> <a href={a.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-cypress hover:underline">View Link</a></p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-host-grotesk font-bold text-sm text-rosewood mb-3 uppercase tracking-wider">Preferences & Needs</h4>
                                <div className="space-y-2 text-sm font-host-grotesk text-rosewood/80">
                                  <p><strong>Sound Sensitive:</strong> {a.soundSensitivity}</p>
                                  <p><strong>Accessibility Needs:</strong> {a.accessibilityNeeds || 'None'}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-host-grotesk font-bold text-sm text-rosewood mb-3 uppercase tracking-wider">Consents</h4>
                                <div className="space-y-2 text-sm font-host-grotesk text-rosewood/80">
                                  <p><strong>Social Highlight:</strong> {a.consentHighlight}</p>
                                  <p><strong>Media Capture:</strong> {a.consentMedia}</p>
                                  <p><strong>Liability Agreed:</strong> {a.liabilityAgreement ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 font-host-grotesk text-rosewood/40">
                      No applications found for this filter.
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
                  <h3 className="font-host-grotesk font-bold text-xl text-rosewood">Delete Application?</h3>
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
              <button onClick={() => handleDelete(deleteConfirmApp.id)} disabled={deletingId === deleteConfirmApp.id} className="flex-1 bg-poppy hover:bg-poppy/90 text-plaster font-host-grotesk font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deletingId === deleteConfirmApp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
              </button>
              <button onClick={() => setDeleteConfirmApp(null)} disabled={deletingId === deleteConfirmApp.id} className="flex-1 bg-white hover:bg-plaster/50 text-rosewood border border-rosewood/10 font-host-grotesk font-bold py-2.5 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}