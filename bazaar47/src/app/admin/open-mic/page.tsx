'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, Calendar, Users, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import type { OpenMicSubmission, OpenMicSession } from '@/types/open-mic'
import { LineupBuilder } from './LineupBuilder'

export default function AdminOpenMicPage() {
  const [pool, setPool] = useState<OpenMicSubmission[]>([])
  const [sessions, setSessions] = useState<OpenMicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSessionDate, setActiveSessionDate] = useState<string | null>(null)
  
  // For creating a new session
  const [isCreating, setIsCreating] = useState(false)
  const [newDate, setNewDate] = useState('')

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/open-mic')
      const data = await res.json()
      setPool(data.pool || [])
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load open mic data', err)
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Defer the fetch to avoid synchronous setState in effect
    const timeoutId = window.setTimeout(() => {
      void fetchData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [fetchData])

  const handleCreateSession = () => {
    if (!newDate) return
    setActiveSessionDate(newDate)
    setIsCreating(false)
    setNewDate('')
  }

  // If a session is active, show the drag and drop builder
  if (activeSessionDate) {
    const session = sessions.find(s => s.date === activeSessionDate) || null
    
    // Filter out artists already in this session's lineup from the pool
    const availablePool = pool.filter(p => 
      !session?.lineup.some(l => l.submissionId === p.id)
    )

    return (
      <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <LineupBuilder
            sessionDate={activeSessionDate}
            initialSession={session}
            pool={availablePool}
            onBack={() => {
              setActiveSessionDate(null)
              void fetchData() // Refresh to get the saved lineup
            }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-plaster">
        <Loader2 className="w-8 h-8 animate-spin text-rosewood/40" />
      </div>
    )
  }

  // Otherwise, show the list of sessions and the pool
  return (
    <div className="min-h-screen bg-plaster p-4 md:p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-host-grotesk font-bold text-3xl text-rosewood">Open Mic</h1>
            <p className="text-rosewood/50 text-sm mt-1">Manage artist submissions and build lineups.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="bg-chartreuse hover:bg-chartreuse/90 text-grove px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Session
          </button>
        </div>

        {isCreating && (
          <div className="bg-white p-4 rounded-xl flex flex-wrap items-center gap-4 border border-chartreuse shadow-sm">
            <input 
              type="date" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)} 
              className="border border-rosewood/20 p-2 rounded-lg font-host-grotesk" 
            />
            <button 
              onClick={handleCreateSession} 
              className="bg-grove hover:bg-grove/90 text-plaster px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Start Builder
            </button>
            <button 
              onClick={() => setIsCreating(false)} 
              className="text-rosewood/50 hover:text-rosewood transition-colors px-2"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="space-y-3">
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood">Scheduled Sessions</h2>
            {sessions.map(s => (
              <button 
                key={s.date} 
                onClick={() => setActiveSessionDate(s.date)} 
                className="w-full bg-white p-4 rounded-xl border border-rosewood/5 flex items-center justify-between hover:border-chartreuse text-left shadow-sm group transition-all"
              >
                <div>
                  <p className="font-bold text-rosewood">{format(new Date(s.date), 'EEEE, MMMM do, yyyy')}</p>
                  <p className="text-sm text-rosewood/50">{s.lineup.length} artists scheduled</p>
                </div>
                <ChevronRight className="w-5 h-5 text-rosewood/30 group-hover:text-chartreuse transition-colors" />
              </button>
            ))}
            {sessions.length === 0 && <p className="text-sm text-rosewood/40 bg-white p-6 rounded-xl border border-rosewood/5 text-center">No sessions created yet.</p>}
          </div>

          {/* Raw Pool */}
          <div className="space-y-3">
             <h2 className="font-host-grotesk font-bold text-xl text-rosewood">Artist Pool</h2>
             <div className="bg-white rounded-xl border border-rosewood/5 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
               <div className="bg-plaster/30 p-3 text-sm text-rosewood/60 font-semibold border-b border-rosewood/5 flex justify-between">
                 <span>Unassigned Submissions</span>
                 <span className="bg-rosewood/10 text-rosewood/60 px-2 py-0.5 rounded-full text-xs">{pool.length}</span>
               </div>
               <div className="overflow-y-auto p-4 space-y-2">
                 {pool.map(sub => (
                   <div key={sub.id} className="p-3 bg-plaster/20 rounded-lg border border-rosewood/5">
                     <p className="font-bold text-rosewood text-sm">{sub.artistName}</p>
                     <p className="text-xs text-rosewood/60">{sub.genre} · {sub.email}</p>
                     {sub.instagram && <p className="text-xs text-rosewood/40 mt-0.5">{sub.instagram}</p>}
                   </div>
                 ))}
                 {pool.length === 0 && (
                   <p className="text-center text-sm text-rosewood/40 py-8">The pool is empty.</p>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}