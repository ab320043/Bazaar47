'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, addMinutes } from 'date-fns'
import type { OpenMicSession, OpenMicSubmission } from '@/types/open-mic'

export default function PrintSchedulePage() {
  const params = useParams()
  const date = params.date as string
  const [session, setSession] = useState<OpenMicSession | null>(null)
  const [pool, setPool] = useState<OpenMicSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch the session and the pool (to get instagram/genre data)
    fetch('/api/admin/open-mic')
      .then(res => res.json())
      .then(data => {
        setPool(data.pool || [])
        setSession((data.sessions || []).find((s: OpenMicSession) => s.date === date) || null)
        setLoading(false)
      })
  }, [date])

  useEffect(() => {
    if (!loading && session) {
      // Auto-trigger print dialog after render
      setTimeout(() => window.print(), 500)
    }
  }, [loading, session])

  if (loading) return <div className="p-8">Loading...</div>
  if (!session) return <div className="p-8">Session not found.</div>

  // Combine lineup with pool data
  const fullLineup = session.lineup.map(slot => {
    const submission = pool.find(p => p.id === slot.submissionId)
    return {
      ...slot,
      fullName: submission?.fullName || 'Unknown',
      genre: submission?.genre || 'Unknown',
      instagram: submission?.instagram || '',
    }
  })

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-4xl mx-auto">
        <style jsx global>{`
          @media print {
            @page { margin: 1cm; }
            body { background: white; }
            .no-print { display: none; }
          }
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #FFB0BC; font-weight: bold; text-align: center; }
          .intermission { background-color: #FFB0BC; text-align: center; font-weight: bold; font-style: italic; }
        `}</style>
        
        <div className="mb-6 flex justify-between items-center no-print">
          <h1 className="text-xl font-bold">Run of Show Preview</h1>
          <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 rounded">Print</button>
        </div>

        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold uppercase">Bazaar47 Open Mic</h2>
          <p className="text-lg">{format(new Date(date), 'EEEE, MMMM do, yyyy')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Time</th>
              <th style={{ width: '25%' }}>Artist</th>
              <th style={{ width: '25%' }}>Instagram</th>
              <th style={{ width: '30%' }}>Genre / Notes</th>
            </tr>
          </thead>
          <tbody>
            {fullLineup.map((slot, index) => {
              const start = new Date(slot.startTime)
              const end = addMinutes(start, slot.durationMinutes)
              const nextStart = addMinutes(end, 3) // 3 min break

              return (
                <>
                  <tr key={slot.id}>
                    <td>{format(start, 'h:mma')} - {format(end, 'h:mma')}</td>
                    <td className="font-bold">{slot.artistName}</td>
                    <td>{slot.instagram || '-'}</td>
                    <td>Music: {slot.genre}</td>
                  </tr>
                  {/* Add Intermission Row (except after the last artist) */}
                  {index < fullLineup.length - 1 && (
                    <tr key={`int-${slot.id}`} className="intermission">
                      <td colSpan={4}>
                        {format(end, 'h:mma')} - {format(nextStart, 'h:mma')} (3 minute intermission)
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}