// app/components/email/winter-market-confirmation.tsx
import * as React from 'react'
import type { WinterMarketApplication } from '@/types/winter-market'

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export function WinterMarketConfirmation({ application }: { application: WinterMarketApplication }) {
  return (
    <div style={{ fontFamily: 'Host Grotesk, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#EFEADE' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#6A2630', padding: '30px', textAlign: 'center', borderRadius: '12px 12px 0 0' }}>
        <h1 style={{ color: '#EFEADE', fontSize: '28px', fontWeight: 'bold', margin: '0' }}>Bazaar47</h1>
        <p style={{ color: '#FFDBE1', fontSize: '13px', margin: '6px 0 0', letterSpacing: '2px', textTransform: 'uppercase' }}>Downtown Winter Market</p>
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '0 0 12px 12px', border: '1px solid #D5C9B1' }}>
        <h2 style={{ color: '#341B1C', fontSize: '22px', margin: '0 0 5px' }}>You&apos;re confirmed, {application.businessName}!</h2>
        <p style={{ color: '#6A2630', fontSize: '14px', margin: '0 0 20px' }}>
          Thank you for applying to the Downtown Winter Market. Your payment has been received and your spot(s) are officially locked in.
        </p>

        {/* Dates */}
        <div style={{ backgroundColor: '#F5F0E8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#341B1C', fontSize: '16px', margin: '0 0 10px', fontWeight: 'bold' }}>Your Confirmed Dates</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#341B1C' }}>
            {application.selectedDates.map(date => (
              <li key={date} style={{ padding: '4px 0' }}>{formatDate(date)} (4 PM – 10 PM)</li>
            ))}
          </ul>
        </div>

        {/* Details */}
        <div style={{ backgroundColor: '#F5F0E8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#341B1C', fontSize: '16px', margin: '0 0 10px', fontWeight: 'bold' }}>Event Details</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Location</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>The Streatery (106 SW 1st Ave)</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Setup Time</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>3:00 PM</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Market Hours</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>4:00 PM – 10:00 PM</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ color: '#6A2630', fontSize: '12px', textAlign: 'center', margin: '20px 0 0' }}>
          If you have any questions or need to change your dates, please contact us at info@bazaar47.com.
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#D5C9B1' }}>
        <p style={{ margin: '0' }}>© 2026 Bazaar47 · 60 SW 2nd Street, Gainesville, FL</p>
      </div>
    </div>
  )
}