'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, MapPin, Music, Clock, Star } from 'lucide-react'
import { tourEvents } from './calendar-data'
import type { TourEvent } from '@/app/components/calendar-events/types'

export function CalendarSection() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getEventsForDate = (date: number): TourEvent[] =>
    tourEvents.filter(
      (event) =>
        event.date === date &&
        event.month === currentMonth + 1 &&
        event.year === currentYear
    )

  const today = new Date()

  return (
    <section
      id="calendar"
      className="relative w-full overflow-hidden bg-poppy py-20 md:py-28 lg:py-32"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-henna/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-plaster/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-px bg-plaster/30" />
            <Calendar className="w-6 h-6 text-plaster/70" />
            <div className="w-16 h-px bg-plaster/30" />
          </div>
          <h2 className="font-host-grotesk font-black text-6xl md:text-8xl lg:text-9xl text-plaster leading-[0.95] tracking-normal">
            Calendar
          </h2>
          <p className="font-host-grotesk text-plaster/70 text-base md:text-lg mt-4">
            Bazaar A La Carte Tour Dates
          </p>
        </motion.div>

        {/* Calendar Grid — Big Blocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="bg-henna/20 backdrop-blur-sm rounded-3xl p-5 md:p-8 lg:p-10 border border-plaster/10 shadow-2xl"
        >
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={prevMonth}
              className="p-3 rounded-full bg-plaster/10 hover:bg-plaster/20 transition-colors text-plaster"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h3 className="font-host-grotesk font-bold text-3xl md:text-5xl text-plaster tracking-tight">
              {months[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-3 rounded-full bg-plaster/10 hover:bg-plaster/20 transition-colors text-plaster"
              aria-label="Next month"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-host-grotesk font-semibold text-plaster/60 text-xs md:text-sm uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Big blocks grid */}
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[70px] sm:min-h-[100px] md:min-h-[130px] lg:min-h-[150px] bg-plaster/5 rounded-xl" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = index + 1
              const dayEvents = getEventsForDate(date)
              const isToday =
                date === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear()
              const hasEvents = dayEvents.length > 0
              const isFeatured = dayEvents.some((e) => e.isFeatured)
              const isSelected = selectedDate === date

              return (
                <motion.div
                  key={date}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={`
                    relative min-h-[70px] sm:min-h-[100px] md:min-h-[130px] lg:min-h-[150px]
                    rounded-xl p-2 md:p-3 cursor-pointer transition-all duration-300 flex flex-col
                    ${isFeatured
                      ? 'bg-plaster text-poppy'
                      : hasEvents
                        ? 'bg-plaster/25 hover:bg-plaster/35'
                        : 'bg-plaster/5 hover:bg-plaster/15'}
                    ${isToday ? 'ring-2 ring-plaster' : ''}
                    ${isSelected ? 'ring-2 ring-plaster scale-[1.02]' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-host-grotesk font-bold text-lg md:text-2xl lg:text-3xl ${
                        isFeatured ? 'text-poppy' : hasEvents ? 'text-plaster' : 'text-plaster/40'
                      }`}
                    >
                      {date}
                    </span>
                    {isFeatured && <Star className="w-4 h-4 md:w-5 md:h-5 text-poppy fill-poppy" />}
                  </div>

                  {hasEvents && (
                    <div className="mt-auto">
                      <div className={`w-full h-1 rounded-full mb-1 ${isFeatured ? 'bg-poppy/40' : 'bg-plaster/40'}`} />
                      <p
                        className={`font-host-grotesk text-[10px] md:text-xs leading-tight line-clamp-2 ${
                          isFeatured ? 'text-poppy/80 font-semibold' : 'text-plaster/70'
                        }`}
                      >
                        {dayEvents[0].title}
                      </p>
                    </div>
                  )}

                  {hasEvents && dayEvents.length > 1 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {dayEvents.map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isFeatured ? 'bg-poppy/60' : 'bg-plaster/50'}`} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 md:p-6 bg-plaster/10 rounded-xl border border-plaster/10"
            >
              <h4 className="font-host-grotesk font-bold text-plaster text-lg mb-3">
                Events for {months[currentMonth]} {selectedDate}
              </h4>
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-plaster/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Music className="w-4 h-4 text-plaster/70" />
                        <span className="font-host-grotesk font-medium text-plaster">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-plaster/70 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                        <span className="text-plaster/50 text-xs">{event.tour}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-host-grotesk text-plaster/50">No events on this date</p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mt-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-plaster" />
            <span className="font-host-grotesk text-plaster/60 text-sm">Run of Show</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-plaster/25" />
            <span className="font-host-grotesk text-plaster/60 text-sm">Tour Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-plaster/5 ring-2 ring-plaster" />
            <span className="font-host-grotesk text-plaster/60 text-sm">Today</span>
          </div>
        </motion.div>

        {/* Footer */}
        {/* <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center font-host-grotesk text-plaster/40 text-xs mt-8 tracking-wider"
        >
          ✦ BAZAAR 47 A LA CARTE TOUR ✦
        </motion.p> */}
      </div>
    </section>
  )
}
