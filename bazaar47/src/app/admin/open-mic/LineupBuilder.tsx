// app/admin/open-mic/LineupBuilder.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragStartEvent, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { addMinutes } from 'date-fns'
import {
  GripVertical, Trash2, Clock, Printer, ChevronLeft, Plus, Loader2, User
} from 'lucide-react'
import type { OpenMicSubmission, OpenMicSession, LineupSlot } from '@/types/open-mic'
import { formatSessionLong, parseIsoLocal } from '@/lib/open-mic/dates'

// ============================================
// HELPERS
// ============================================

function sessionStartDate(sessionDate: string): Date {
  const d = parseIsoLocal(sessionDate)
  if (!d) return new Date()
  d.setHours(20, 0, 0, 0)
  return d
}

function generateLineupTimes(sessionDate: string, lineup: LineupSlot[]): LineupSlot[] {
  let cursor = sessionStartDate(sessionDate)
  return lineup.map((slot) => {
    const startTime = cursor.toISOString()
    cursor = addMinutes(cursor, slot.durationMinutes + 3)
    return { ...slot, startTime }
  })
}

function formatTimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// ============================================
// COMPONENTS
// ============================================

export function LineupBuilder({
  sessionDate, initialSession, pool, onBack,
}: {
  sessionDate: string
  initialSession: OpenMicSession | null
  pool: OpenMicSubmission[]
  onBack: () => void
}) {
  const [lineup, setLineup] = useState<LineupSlot[]>(initialSession?.lineup || [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const timedLineup = useMemo(() => generateLineupTimes(sessionDate, lineup), [sessionDate, lineup])

  const saveLineup = async (newLineup: LineupSlot[], triggerEmailForSlotId?: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/open-mic/sessions/${sessionDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineup: newLineup }),
      })
      if (!res.ok) throw new Error('Failed to save')

      if (triggerEmailForSlotId) {
        const timed = generateLineupTimes(sessionDate, newLineup)
        const slot = timed.find((s) => s.id === triggerEmailForSlotId)
        const submission = pool.find((p) => p.id === slot?.submissionId)
        
        if (slot && submission) {
          await fetch('/api/send-open-mic-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: submission.email,
              artistName: submission.artistName,
              sessionDate,
              startTime: slot.startTime,
            })
          })
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    if (active.data.current?.type === 'pool-item') {
      const submission = active.data.current.submission as OpenMicSubmission
      if (lineup.some((s) => s.submissionId === submission.id)) return

      const newSlot: LineupSlot = {
        id: crypto.randomUUID(),
        submissionId: submission.id,
        artistName: submission.artistName,
        startTime: new Date().toISOString(),
        durationMinutes: 7,
      }

      const newLineup = [...lineup, newSlot]
      setLineup(newLineup)
      void saveLineup(newLineup, newSlot.id)
      return
    }

    if (active.id !== over.id) {
      const oldIndex = lineup.findIndex((s) => s.id === active.id)
      const newIndex = lineup.findIndex((s) => s.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newLineup = arrayMove(lineup, oldIndex, newIndex)
        setLineup(newLineup)
        void saveLineup(newLineup)
      }
    }
  }

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName || !customEmail) return
    setSaving(true)
    
    try {
      const poolRes = await fetch('/api/admin/open-mic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_to_pool',
          fullName: customName,
          artistName: customName,
          email: customEmail,
          genre: 'Walk-on',
          submittedAt: new Date().toISOString(),
          addedByAdmin: true,
        }),
      })
      
      const poolData = await poolRes.json()
      if (!poolRes.ok) throw new Error(poolData.error)
      
      const newSub = poolData.submission as OpenMicSubmission
      
      const newSlot: LineupSlot = {
        id: crypto.randomUUID(),
        submissionId: newSub.id,
        artistName: newSub.artistName,
        startTime: new Date().toISOString(),
        durationMinutes: 7,
      }
      
      const newLineup = [...lineup, newSlot]
      setLineup(newLineup)
      await saveLineup(newLineup, newSlot.id)
      
      setCustomName('')
      setCustomEmail('')
      setShowAddCustom(false)
      
    } catch (err) {
      alert('Failed to add custom artist')
    } finally {
      setSaving(false)
    }
  }

  const removeSlot = (slotId: string) => {
    const newLineup = lineup.filter((s) => s.id !== slotId)
    setLineup(newLineup)
    void saveLineup(newLineup)
  }

  const updateDuration = (slotId: string, mins: number) => {
    const newLineup = lineup.map((s) => s.id === slotId ? { ...s, durationMinutes: mins } : s)
    setLineup(newLineup)
    void saveLineup(newLineup)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-rosewood/5 shadow-sm gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-plaster rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-rosewood" />
          </button>
          <div>
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
              {formatSessionLong(sessionDate)}
            </h2>
            <p className="text-xs text-rosewood/50">Drag artists to build the run of show.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {saving && (
            <span className="text-xs text-chartreuse font-semibold animate-pulse mr-2">
              Saving...
            </span>
          )}
          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="flex-1 sm:flex-none bg-plaster text-rosewood px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-sand-dune transition-colors"
          >
            <User className="w-4 h-4" /> Add Walk-on
          </button>
          <a
            href={`/admin/open-mic/print/${sessionDate}`}
            target="_blank"
            className="flex-1 sm:flex-none bg-rosewood text-plaster px-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-rosewood/80 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </a>
        </div>
      </div>

      {showAddCustom && (
        <form onSubmit={handleAddCustom} className="bg-white p-4 rounded-2xl border-2 border-chartreuse shadow-sm flex flex-col sm:flex-row items-end gap-3">
           <div className="flex-1 w-full">
             <label className="text-xs font-bold text-rosewood/60 mb-1 block">Name</label>
             <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} required placeholder="Artist Name" className="w-full px-3 py-2 border border-rosewood/20 rounded-lg text-sm" />
           </div>
           <div className="flex-1 w-full">
             <label className="text-xs font-bold text-rosewood/60 mb-1 block">Email</label>
             <input type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)} required placeholder="email@example.com" className="w-full px-3 py-2 border border-rosewood/20 rounded-lg text-sm" />
           </div>
           <button type="submit" disabled={saving} className="w-full sm:w-auto bg-chartreuse text-grove font-bold px-4 py-2 rounded-lg text-sm h-[38px] flex items-center justify-center">
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add & Schedule'}
           </button>
        </form>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden sticky top-6">
              <div className="p-4 border-b border-rosewood/10 bg-plaster/30">
                <h3 className="font-host-grotesk font-bold text-rosewood">Artist Pool</h3>
                <p className="text-xs text-rosewood/50">{pool.length} unassigned</p>
              </div>
              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {pool.map((submission) => (
                  <PoolItem key={submission.id} submission={submission} />
                ))}
                {pool.length === 0 && (
                  <p className="text-center text-sm text-rosewood/40 py-8">No artists in the pool.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm min-h-[500px] flex flex-col">
              <div className="p-4 border-b border-rosewood/10 bg-chartreuse/10 flex justify-between items-center">
                <h3 className="font-host-grotesk font-bold text-cypress">Run of Show</h3>
                <span className="text-xs font-semibold text-cypress bg-chartreuse/20 px-2 py-0.5 rounded-full">
                  {lineup.length} artists
                </span>
              </div>
              
              <div className="p-4 flex-1">
                <SortableContext items={timedLineup.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {timedLineup.map((slot) => (
                      <LineupRow 
                        key={slot.id} 
                        slot={slot} 
                        onRemove={() => removeSlot(slot.id)}
                        onDurationChange={(mins) => updateDuration(slot.id, mins)}
                      />
                    ))}
                    {lineup.length === 0 && (
                      <div className="text-center py-20 text-rosewood/30 border-2 border-dashed border-rosewood/10 rounded-xl">
                        Drag artists here to start the schedule.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-3 rounded-xl shadow-xl border-2 border-chartreuse opacity-90">Dragging...</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function PoolItem({ submission }: { submission: OpenMicSubmission }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: submission.id, data: { type: 'pool-item', submission },
  })
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 bg-plaster/30 border border-rosewood/10 rounded-xl hover:border-chartreuse cursor-grab active:cursor-grabbing transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-host-grotesk font-bold text-sm text-rosewood">{submission.artistName}</p>
          <p className="text-xs text-rosewood/60">{submission.fullName}</p>
          <p className="text-xs font-semibold text-rosewood/50 mt-1">{submission.genre}</p>
        </div>
        <GripVertical className="w-4 h-4 text-rosewood/30" />
      </div>
    </div>
  )
}

function LineupRow({ slot, onRemove, onDurationChange }: { slot: LineupSlot, onRemove: () => void, onDurationChange: (mins: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id, data: { type: 'lineup-item' },
  })
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const startTime = new Date(slot.startTime)
  const endTime = addMinutes(startTime, slot.durationMinutes)

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-2 group">
      <div {...attributes} {...listeners} className="flex items-center px-1 cursor-grab opacity-30 hover:opacity-100">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-32 shrink-0 flex flex-col justify-center text-right pr-4 border-r border-rosewood/10">
        <span className="font-host-grotesk font-bold text-sm text-rosewood">{formatTimeLocal(slot.startTime)}</span>
        <span className="text-xs text-rosewood/50">to {formatTimeLocal(endTime.toISOString())}</span>
      </div>
      <div className="flex-1 bg-white border border-rosewood/10 p-3 rounded-xl flex items-center justify-between shadow-sm group-hover:border-chartreuse/40 transition-colors">
        <div>
          <p className="font-host-grotesk font-bold text-rosewood">{slot.artistName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-rosewood/50 bg-plaster/50 px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3" />
            <input type="number" min={1} max={30} value={slot.durationMinutes} onChange={(e) => onDurationChange(parseInt(e.target.value) || 1)} className="w-8 bg-transparent text-center font-bold focus:outline-none" />
            mins
          </div>
          <button onClick={onRemove} className="text-rosewood/20 hover:text-poppy transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}