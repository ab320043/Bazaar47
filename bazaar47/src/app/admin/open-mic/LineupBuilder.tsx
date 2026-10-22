// app/admin/open-mic/LineupBuilder.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { addMinutes } from 'date-fns'
import {
  GripVertical,
  Trash2,
  Clock,
  Printer,
  ChevronLeft,
  Lock,
  Calendar as CalendarIcon,
} from 'lucide-react'
import type {
  OpenMicSubmission,
  OpenMicSession,
  LineupSlot,
} from '@/types/open-mic'
import { formatSessionLong, parseIsoLocal } from '@/lib/open-mic/dates'
import type { SessionState } from '@/lib/open-mic/sessions-state'

// ============================================
// HELPERS
// ============================================

/**
 * `sessionDate` is 'YYYY-MM-DD'. Turn it into a local-midnight Date
 * exactly once, then everything downstream is safe.
 */
function sessionStartDate(sessionDate: string): Date {
  const d = parseIsoLocal(sessionDate)
  if (!d) return new Date()
  d.setHours(20, 0, 0, 0) // 8:00 PM local
  return d
}

/**
 * Generate ISO start times for the lineup, walking in array order.
 * Start of show is 8:00 PM local; intermission is 3 minutes.
 *
 * (Batch D will extend this to respect a per-slot manual override.
 * For now it's the exact same behavior the file had before, just
 * rebuilt on local-midnight parsing so it can't drift a day.)
 */
function generateLineupTimes(
  sessionDate: string,
  lineup: LineupSlot[]
): LineupSlot[] {
  let cursor = sessionStartDate(sessionDate)

  return lineup.map((slot) => {
    const startTime = cursor.toISOString()
    cursor = addMinutes(cursor, slot.durationMinutes + 3)

    return {
      ...slot,
      startTime,
    }
  })
}

/**
 * Safe local-time formatter. `startTime` is a full ISO timestamp
 * (has time), so `new Date(iso)` is fine here — the day-behind bug
 * was only ever on date-only strings.
 */
function formatTimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LineupBuilder({
  sessionDate,
  initialSession,
  pool,
  sessionState,
  onBack,
  onDeleteSession,
}: {
  sessionDate: string
  initialSession: OpenMicSession | null
  pool: OpenMicSubmission[]
  sessionState: SessionState
  onBack: () => void
  onDeleteSession: () => void
}) {
  const [lineup, setLineup] = useState<LineupSlot[]>(
    initialSession?.lineup || []
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isLocked = sessionState === 'past'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const timedLineup = useMemo(
    () => generateLineupTimes(sessionDate, lineup),
    [sessionDate, lineup]
  )

  // ---- Save ----

  const saveLineup = async (newLineup: LineupSlot[]) => {
    if (isLocked) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/open-mic/sessions/${sessionDate}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineup: newLineup }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Save failed:', body.error || res.status)
      }
    } catch (err) {
      console.error('Failed to save lineup', err)
    } finally {
      setSaving(false)
    }
  }

  // ---- Drag handlers ----

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (isLocked) return
    if (!over) return

    // Dropping into the lineup from the pool
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
      void saveLineup(newLineup)
      return
    }

    // Reordering within the lineup
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

  // ---- Slot mutation ----

  const removeSlot = (slotId: string) => {
    if (isLocked) return
    const newLineup = lineup.filter((s) => s.id !== slotId)
    setLineup(newLineup)
    void saveLineup(newLineup)
  }

  const updateDuration = (slotId: string, mins: number) => {
    if (isLocked) return
    const newLineup = lineup.map((s) =>
      s.id === slotId ? { ...s, durationMinutes: mins } : s
    )
    setLineup(newLineup)
    void saveLineup(newLineup)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-rosewood/5 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-plaster rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-rosewood" />
          </button>
          <div>
            <h2 className="font-host-grotesk font-bold text-xl text-rosewood">
              {formatSessionLong(sessionDate)}
            </h2>
            <p className="text-xs text-rosewood/50">
              {isLocked
                ? 'Archived session — read-only.'
                : 'Drag artists from the pool to build the run of show.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && !isLocked && (
            <span className="text-xs text-chartreuse font-semibold animate-pulse">
              Saving...
            </span>
          )}
          <a
            href={`/admin/open-mic/print/${sessionDate}`}
            target="_blank"
            className="bg-plaster text-rosewood px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-sand-dune transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Schedule
          </a>
          <button
            onClick={onDeleteSession}
            className="bg-poppy/10 hover:bg-poppy/20 text-poppy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Session
          </button>
        </div>
      </div>

      {/* Archived banner */}
      {isLocked && (
        <div className="bg-rosewood/5 border border-rosewood/15 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Lock className="w-5 h-5 text-rosewood/50 shrink-0 mt-0.5" />
          <div>
            <p className="font-host-grotesk font-semibold text-rosewood text-sm">
              This session is archived
            </p>
            <p className="font-host-grotesk text-rosewood/60 text-xs mt-0.5">
              The lineup is preserved as a historical record and cannot be
              edited. To make changes to a past night, you would need to
              delete this session (removing the record) and create a new one.
            </p>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Pool (or archived notice) */}
          <div className="lg:col-span-1">
            {isLocked ? (
              <div className="bg-white rounded-2xl border border-rosewood/10 shadow-sm overflow-hidden sticky top-6">
                <div className="p-4 border-b border-rosewood/10 bg-plaster/30">
                  <h3 className="font-host-grotesk font-bold text-rosewood flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rosewood/40" />
                    Artist Pool
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <Lock className="w-10 h-10 text-rosewood/20 mx-auto mb-3" />
                  <p className="text-sm text-rosewood/50">
                    Session archived — no new artists can be added.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm overflow-hidden sticky top-6">
                <div className="p-4 border-b border-rosewood/10 bg-plaster/30">
                  <h3 className="font-host-grotesk font-bold text-rosewood">
                    Artist Pool
                  </h3>
                  <p className="text-xs text-rosewood/50">
                    {pool.length} unassigned
                  </p>
                </div>
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                  {pool.map((submission) => (
                    <PoolItem
                      key={submission.id}
                      submission={submission}
                    />
                  ))}
                  {pool.length === 0 && (
                    <p className="text-center text-sm text-rosewood/40 py-8">
                      No artists in the pool.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: The Lineup */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-rosewood/5 shadow-sm min-h-[500px] flex flex-col">
              <div
                className={`p-4 border-b border-rosewood/10 flex justify-between items-center ${
                  isLocked ? 'bg-rosewood/5' : 'bg-chartreuse/10'
                }`}
              >
                <h3
                  className={`font-host-grotesk font-bold flex items-center gap-2 ${
                    isLocked ? 'text-rosewood/60' : 'text-cypress'
                  }`}
                >
                  {isLocked && <Lock className="w-4 h-4" />}
                  Run of Show
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isLocked
                      ? 'bg-rosewood/10 text-rosewood/60'
                      : 'bg-chartreuse/20 text-cypress'
                  }`}
                >
                  {lineup.length} artist
                  {lineup.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-4 flex-1">
                {timedLineup.length === 0 ? (
                  <div className="text-center py-20 text-rosewood/30 border-2 border-dashed border-rosewood/10 rounded-xl">
                    {isLocked
                      ? 'No artists were scheduled for this session.'
                      : 'Drag artists here to start the schedule.'}
                  </div>
                ) : isLocked ? (
                  // Read-only rendering — no drag, no inputs, no remove
                  <div className="space-y-2">
                    {timedLineup.map((slot) => (
                      <ReadOnlyLineupRow key={slot.id} slot={slot} />
                    ))}
                  </div>
                ) : (
                  <SortableContext
                    items={timedLineup.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {timedLineup.map((slot) => (
                        <LineupRow
                          key={slot.id}
                          slot={slot}
                          onRemove={() => removeSlot(slot.id)}
                          onDurationChange={(mins) =>
                            updateDuration(slot.id, mins)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && !isLocked ? (
            <div className="bg-white p-3 rounded-xl shadow-xl border-2 border-chartreuse opacity-90">
              Dragging...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// ============================================
// POOL ITEM
// ============================================

function PoolItem({ submission }: { submission: OpenMicSubmission }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: submission.id,
    data: { type: 'pool-item', submission },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-plaster/30 border border-rosewood/10 rounded-xl hover:border-chartreuse cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-host-grotesk font-bold text-sm text-rosewood">
            {submission.artistName}
          </p>
          <p className="text-xs text-rosewood/60">{submission.fullName}</p>
          <p className="text-xs font-semibold text-rosewood/50 mt-1">
            {submission.genre}
          </p>
        </div>
        <GripVertical className="w-4 h-4 text-rosewood/30" />
      </div>
    </div>
  )
}

// ============================================
// READ-ONLY LINEUP ROW (archived sessions)
// ============================================

function ReadOnlyLineupRow({ slot }: { slot: LineupSlot }) {
  const startTime = new Date(slot.startTime)
  const endTime = addMinutes(startTime, slot.durationMinutes)

  return (
    <div className="flex items-stretch gap-2">
      {/* Time column */}
      <div className="w-32 shrink-0 flex flex-col justify-center text-right pr-4 border-r border-rosewood/10">
        <span className="font-host-grotesk font-bold text-sm text-rosewood">
          {formatTimeLocal(slot.startTime)}
        </span>
        <span className="text-xs text-rosewood/50">
          to {formatTimeLocal(endTime.toISOString())}
        </span>
      </div>

      {/* Artist info */}
      <div className="flex-1 bg-plaster/20 border border-rosewood/10 p-3 rounded-xl flex items-center justify-between">
        <div>
          <p className="font-host-grotesk font-bold text-rosewood">
            {slot.artistName}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-rosewood/50 bg-plaster/60 px-2 py-1 rounded-lg">
          <Clock className="w-3 h-3" />
          {slot.durationMinutes} mins
        </div>
      </div>
    </div>
  )
}

// ============================================
// EDITABLE LINEUP ROW
// ============================================

function LineupRow({
  slot,
  onRemove,
  onDurationChange,
}: {
  slot: LineupSlot
  onRemove: () => void
  onDurationChange: (mins: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slot.id,
    data: { type: 'lineup-item' },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const startTime = new Date(slot.startTime)
  const endTime = addMinutes(startTime, slot.durationMinutes)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-2 group"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-1 cursor-grab opacity-30 hover:opacity-100"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Time Column */}
      <div className="w-32 shrink-0 flex flex-col justify-center text-right pr-4 border-r border-rosewood/10">
        <span className="font-host-grotesk font-bold text-sm text-rosewood">
          {formatTimeLocal(slot.startTime)}
        </span>
        <span className="text-xs text-rosewood/50">
          to {formatTimeLocal(endTime.toISOString())}
        </span>
      </div>

      {/* Artist Info */}
      <div className="flex-1 bg-white border border-rosewood/10 p-3 rounded-xl flex items-center justify-between shadow-sm group-hover:border-chartreuse/40 transition-colors">
        <div>
          <p className="font-host-grotesk font-bold text-rosewood">
            {slot.artistName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-rosewood/50 bg-plaster/50 px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3" />
            <input
              type="number"
              min={1}
              max={30}
              value={slot.durationMinutes}
              onChange={(e) =>
                onDurationChange(parseInt(e.target.value) || 1)
              }
              className="w-8 bg-transparent text-center font-bold focus:outline-none"
            />
            mins
          </div>
          <button
            onClick={onRemove}
            className="text-rosewood/20 hover:text-poppy transition-colors p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}