// app/big-caf-meetings-calendar/page.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  Clock,
} from 'lucide-react'
import overlay from '@/assets/newAssets/overlay.png'
import {
  PAGE_INTRO,
  PAGE_TIME_HINT,
  MEETING_TIME_WINDOW_START,
  MEETING_TIME_WINDOW_END,
} from '@/data/big-caf-meetings'
import {
  buildMonthGrid,
  getNavigableMonths,
  getMonthName,
  getWindowRangeIso,
  formatDayLong,
  formatDayShort,
  WEEKDAY_HEADERS,
  type MonthGridCell,
} from '@/lib/big-caf-meetings/dates'

// ============================================
// TYPES
// ============================================

interface FormState {
  fullName: string
  email: string
  phone: string
}

interface AvailabilityDraft {
  date: string
  timeWindow: string
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | {
      kind: 'success'
      submittedName: string
      submittedAvailability: AvailabilityDraft[]
    }
  | { kind: 'error'; message: string }

// ============================================
// HELPERS
// ============================================

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BigCafMeetingsCalendarPage() {
  const navigableMonths = useMemo(() => getNavigableMonths(), [])
  const [monthIndex, setMonthIndex] = useState(0)
  const activeMonth = navigableMonths[monthIndex]
  const windowRange = useMemo(() => getWindowRangeIso(), [])

  // Selected days, in the order they were picked. Each entry owns its
  // own timeWindow draft. We sort on submit, not on toggle, so the list
  // doesn't jump around while the user is typing.
  const [selected, setSelected] = useState<AvailabilityDraft[]>([])
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })
  const [direction, setDirection] = useState<1 | -1>(1)

  const grid = useMemo(
    () => buildMonthGrid(activeMonth.year, activeMonth.month),
    [activeMonth]
  )

  const selectedDates = useMemo(
    () => new Set(selected.map((s) => s.date)),
    [selected]
  )

  // ---------- Navigation ----------

  const canGoPrev = monthIndex > 0
  const canGoNext = monthIndex < navigableMonths.length - 1

  const goPrev = useCallback(() => {
    if (!canGoPrev) return
    setDirection(-1)
    setMonthIndex((i) => i - 1)
  }, [canGoPrev])

  const goNext = useCallback(() => {
    if (!canGoNext) return
    setDirection(1)
    setMonthIndex((i) => i + 1)
  }, [canGoNext])

  // ---------- Day selection ----------

  const toggleDay = useCallback((iso: string, cell: MonthGridCell) => {
    if (!cell.isMeetingDay) return
    setSelected((prev) => {
      const exists = prev.some((s) => s.date === iso)
      if (exists) return prev.filter((s) => s.date !== iso)
      return [...prev, { date: iso, timeWindow: '' }]
    })
  }, [])

  const removeDay = useCallback((iso: string) => {
    setSelected((prev) => prev.filter((s) => s.date !== iso))
  }, [])

  const updateTime = useCallback((iso: string, timeWindow: string) => {
    setSelected((prev) =>
      prev.map((s) => (s.date === iso ? { ...s, timeWindow } : s))
    )
  }, [])

  // ---------- Form ----------

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.fullName.trim()) {
      setSubmitState({ kind: 'error', message: 'Please enter your full name' })
      return
    }
    if (!isValidEmail(form.email)) {
      setSubmitState({ kind: 'error', message: 'Please enter a valid email' })
      return
    }
    if (!form.phone.trim()) {
      setSubmitState({ kind: 'error', message: 'Please enter your phone number' })
      return
    }
    if (selected.length === 0) {
      setSubmitState({
        kind: 'error',
        message: 'Please select at least one day',
      })
      return
    }

    // Sort by date, trim time windows before sending.
    const availability = [...selected]
      .map((s) => ({
        date: s.date,
        timeWindow: s.timeWindow.trim(),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setSubmitState({ kind: 'submitting' })

    try {
      const res = await fetch('/api/big-caf-meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          availability,
        }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSubmitState({
          kind: 'error',
          message: body.error || 'Something went wrong. Please try again.',
        })
        return
      }

      setSubmitState({
        kind: 'success',
        submittedName: form.fullName.trim(),
        submittedAvailability: availability,
      })
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitState({
        kind: 'error',
        message: 'Network error — please try again.',
      })
    }
  }

  const handleReset = () => {
    setSelected([])
    setForm({ fullName: '', email: '', phone: '' })
    setSubmitState({ kind: 'idle' })
    setMonthIndex(0)
    setDirection(1)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="relative min-h-screen bg-plaster">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <Image src={overlay} alt="" fill className="object-cover" priority />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 max-w-3xl">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-px bg-rosewood/30" />
            <span className="font-host-grotesk text-[10px] sm:text-xs text-rosewood/50 uppercase tracking-[0.3em] font-bold">
              The Big Caf Festival
            </span>
            <span className="w-8 h-px bg-rosewood/30" />
          </div>
          <h1 className="font-host-grotesk font-bold text-3xl sm:text-4xl md:text-5xl text-rosewood leading-tight">
            Meeting Availability
          </h1>
          <p className="font-host-grotesk text-sm sm:text-base text-rosewood/60 mt-3 max-w-xl mx-auto">
            {PAGE_INTRO}
          </p>
        </motion.header>

        <AnimatePresence mode="wait">
          {submitState.kind === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-rosewood/5 shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-chartreuse/20 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-cypress" />
                </motion.div>
                <h2 className="font-host-grotesk font-bold text-2xl text-rosewood">
                  Thanks, {submitState.submittedName.split(' ')[0] || 'friend'}!
                </h2>
                <p className="font-host-grotesk text-rosewood/60 mt-2 max-w-md">
                  We got your availability. We&apos;ll reach out to schedule.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-rosewood/10">
                <p className="font-host-grotesk font-semibold text-sm text-rosewood/70 mb-3">
                  Your selected days ({submitState.submittedAvailability.length})
                </p>
                <div className="space-y-2">
                  {submitState.submittedAvailability.map((entry) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between gap-3 bg-chartreuse/10 rounded-xl px-3 py-2"
                    >
                      <span className="font-host-grotesk text-sm font-semibold text-cypress">
                        {formatDayLong(entry.date)}
                      </span>
                      <span className="font-host-grotesk text-sm text-cypress/80 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {entry.timeWindow.trim() === ''
                          ? `anytime (${MEETING_TIME_WINDOW_START}–${MEETING_TIME_WINDOW_END})`
                          : entry.timeWindow}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleReset}
                  className="bg-rosewood hover:bg-rosewood/90 text-plaster font-host-grotesk font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                >
                  Submit another response
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-and-calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Window info banner */}
              <div className="bg-olive/15 border border-olive/40 rounded-2xl px-4 py-3 text-center">
                <p className="font-host-grotesk text-xs sm:text-sm text-grove">
                  Meetings run <span className="font-semibold">Wednesdays, Thursdays, and Fridays</span>,
                  {' '}
                  <span className="font-semibold">{MEETING_TIME_WINDOW_START} – {MEETING_TIME_WINDOW_END}</span>,
                  through <span className="font-semibold">Friday, March 26, 2027</span>.
                </p>
              </div>

              {/* Calendar card */}
              <div className="bg-white rounded-3xl border border-rosewood/5 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-rosewood/10">
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    aria-label="Previous month"
                    className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h2
                      key={`${activeMonth.year}-${activeMonth.month}`}
                      initial={{ opacity: 0, x: direction * 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -20 }}
                      transition={{ duration: 0.25 }}
                      className="font-host-grotesk font-bold text-lg sm:text-xl text-rosewood"
                    >
                      {getMonthName(activeMonth.month)} {activeMonth.year}
                    </motion.h2>
                  </AnimatePresence>

                  <button
                    onClick={goNext}
                    disabled={!canGoNext}
                    aria-label="Next month"
                    className="p-2 rounded-full bg-plaster hover:bg-sand-dune/60 text-rosewood transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 px-2 sm:px-4 pt-3">
                  {WEEKDAY_HEADERS.map((day) => (
                    <div
                      key={day}
                      className="text-center font-host-grotesk font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-rosewood/40 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="px-2 sm:px-4 pb-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${activeMonth.year}-${activeMonth.month}`}
                      initial={{ opacity: 0, x: direction * 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -30 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="grid grid-cols-7 gap-1 sm:gap-1.5"
                    >
                      {grid.map((cell, i) => (
                        <DayCell
                          key={cell.iso ?? `pad-${i}`}
                          cell={cell}
                          selected={cell.iso ? selectedDates.has(cell.iso) : false}
                          onToggle={toggleDay}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Selected days with per-day time input */}
              {selected.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-rosewood/5 shadow-sm p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-host-grotesk font-semibold text-sm text-rosewood">
                      Your selected days ({selected.length})
                    </p>
                    <button
                      onClick={() => setSelected([])}
                      className="font-host-grotesk text-xs text-rosewood/40 hover:text-poppy transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <p className="font-host-grotesk text-xs text-rosewood/50 mb-3">
                    {PAGE_TIME_HINT}
                  </p>

                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {selected.map((entry) => (
                        <motion.div
                          key={entry.date}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-plaster/40 rounded-xl p-2.5 sm:pr-3"
                        >
                          <div className="flex items-center justify-between sm:justify-start gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-host-grotesk text-sm font-semibold text-rosewood truncate">
                                {formatDayShort(entry.date)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeDay(entry.date)}
                                className="text-rosewood/30 hover:text-poppy transition-colors shrink-0"
                                aria-label={`Remove ${formatDayLong(entry.date)}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="relative sm:w-64 shrink-0">
                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rosewood/30 pointer-events-none" />
                            <input
                              type="text"
                              value={entry.timeWindow}
                              onChange={(e) => updateTime(entry.date, e.target.value)}
                              placeholder={`Any time (${MEETING_TIME_WINDOW_START}–${MEETING_TIME_WINDOW_END})`}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-rosewood/15 rounded-lg font-host-grotesk text-sm text-rosewood placeholder:text-rosewood/30 focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 transition-all"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl border border-rosewood/5 shadow-sm p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-rosewood/60" />
                  <h3 className="font-host-grotesk font-bold text-lg text-rosewood">
                    Your details
                  </h3>
                </div>

                <div>
                  <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                    Full name <span className="text-poppy">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleFieldChange}
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                    Email <span className="text-poppy">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="font-host-grotesk font-semibold text-sm text-rosewood/80 block mb-1.5">
                    Phone <span className="text-poppy">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFieldChange}
                    required
                    autoComplete="tel"
                    className="w-full px-4 py-3 bg-plaster/50 border border-rosewood/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-chartreuse/40 focus:border-chartreuse/60 font-host-grotesk text-rosewood transition-all"
                    placeholder="(352) 123-4567"
                  />
                </div>

                {submitState.kind === 'error' && (
                  <div className="bg-poppy/10 border border-poppy/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-poppy shrink-0 mt-0.5" />
                    <p className="text-poppy text-sm font-host-grotesk">
                      {submitState.message}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitState.kind === 'submitting' || selected.length === 0
                  }
                  className="w-full bg-rosewood hover:bg-poppy text-plaster font-host-grotesk font-bold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitState.kind === 'submitting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit availability
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {selected.length === 0 && (
                  <p className="text-center font-host-grotesk text-xs text-rosewood/40">
                    Select at least one day above to submit.
                  </p>
                )}
              </form>

              <p className="text-center font-host-grotesk text-xs text-rosewood/30">
                Hosted by Bazaar47 · The Big Caf Festival · April 2027
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================
// DAY CELL
// ============================================

interface DayCellProps {
  cell: MonthGridCell
  selected: boolean
  onToggle: (iso: string, cell: MonthGridCell) => void
}

function DayCell({ cell, selected, onToggle }: DayCellProps) {
  if (cell.iso === null || cell.dayOfMonth === null) {
    return <div className="aspect-square" aria-hidden="true" />
  }

  const { iso, dayOfMonth, isMeetingDay, isToday } = cell

  if (!isMeetingDay) {
    return (
      <div
        className={`aspect-square flex items-center justify-center rounded-xl text-sm sm:text-base font-host-grotesk ${
          isToday
            ? 'text-rosewood/60 font-bold ring-1 ring-rosewood/20'
            : 'text-rosewood/25'
        }`}
      >
        {dayOfMonth}
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(iso, cell)}
      whileTap={{ scale: 0.92 }}
      aria-pressed={selected}
      aria-label={`Toggle ${formatDayLong(iso)}`}
      className={`relative aspect-square flex items-center justify-center rounded-xl text-sm sm:text-base font-host-grotesk font-semibold transition-colors ${
        selected
          ? 'bg-chartreuse text-grove shadow-sm'
          : 'bg-grove/5 hover:bg-grove/10 text-grove'
      } ${isToday ? 'ring-2 ring-poppy/60' : ''}`}
    >
      {dayOfMonth}
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="absolute top-1 right-1"
        >
          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-grove" />
        </motion.span>
      )}
      {isToday && !selected && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-poppy" />
      )}
    </motion.button>
  )
}