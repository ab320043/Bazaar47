// app/components/email/winter-market-confirmation.tsx
import * as React from 'react'

interface WinterMarketConfirmationProps {
  fullName: string
  preferredName?: string
  businessName: string
  selectedDates: string[]
  totalPaid: number
  venueName: string
  venueAddress: string
}

export function WinterMarketConfirmation({
  fullName,
  preferredName,
  businessName,
  selectedDates,
  totalPaid,
  venueName,
  venueAddress,
}: WinterMarketConfirmationProps) {
  const greetingName = preferredName || fullName.split(' ')[0]

  return (
    <div style={{ fontFamily: 'host-grotesk, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#EFEADE' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#202912', padding: '30px', textAlign: 'center', borderRadius: '12px 12px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '200px', height: '200px', background: 'rgba(204, 209, 69, 0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <h1 style={{ color: '#EFEADE', fontSize: '28px', fontWeight: 'bold', margin: '0', fontFamily: 'serif', position: 'relative', zIndex: 1 }}>
          Bazaar47
        </h1>
        <p style={{ color: '#CCD145', fontSize: '13px', margin: '6px 0 0', letterSpacing: '2px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
          Downtown Winter Market
        </p>
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '0 0 12px 12px', border: '1px solid #D5C9B1' }}>
        <h2 style={{ color: '#341B1C', fontSize: '22px', margin: '0 0 5px' }}>
          You&apos;re officially booked, {greetingName}! ❄️
        </h2>
        <p style={{ color: '#6A2630', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.5' }}>
          We received your payment for <strong>{businessName}</strong> and your spots for the Downtown Winter Market are locked in. We can&apos;t wait to see your booth under the lights.
        </p>

        {/* Booking Details */}
        <div style={{ backgroundColor: '#F5F0E8', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #CCD145' }}>
          <h3 style={{ color: '#341B1C', fontSize: '16px', margin: '0 0 15px', fontWeight: 'bold' }}>
            Your Booked Dates ({selectedDates.length} Total)
          </h3>
          <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#6A2630', fontSize: '14px', lineHeight: '1.8' }}>
            {selectedDates.map((date) => (
              <li key={date}><strong>{date}</strong></li>
            ))}
          </ul>
        </div>

        {/* Event Details */}
        <div style={{ backgroundColor: '#F5F0E8', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#341B1C', fontSize: '16px', margin: '0 0 10px', fontWeight: 'bold' }}>
            Event Details
          </h3>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0', verticalAlign: 'top' }}>Where</td>
                <td style={{ color: '#341B1C', textAlign: 'right', fontWeight: 'bold' }}>
                  {venueName}<br />
                  <span style={{ fontWeight: 'normal', fontSize: '12px' }}>{venueAddress}</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Time</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>4:00 PM – 10:00 PM</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0', borderTop: '1px solid #D5C9B1', paddingTop: '10px' }}>Amount Paid</td>
                <td style={{ color: '#341B1C', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #D5C9B1', paddingTop: '10px' }}>
                  ${totalPaid.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* What to Expect Note */}
        <div style={{ backgroundColor: '#FFDBE1', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ color: '#6A2630', fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
            <strong>What to bring:</strong> We will provide your 8x8 booth, sunsail, gridwall, and a 6-foot foldable table with a black cloth. Extra lighting is highly suggested—the brighter your booth, the more foot traffic!
          </p>
        </div>

        <p style={{ color: '#6A2630', fontSize: '12px', textAlign: 'center', margin: '20px 0 0' }}>
          ✦ Bazaar47 · A space for culture, community, and connection. ✦
        </p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#D5C9B1' }}>
        <p style={{ margin: '0' }}>Questions? Contact us at info@bazaar47.com</p>
      </div>
    </div>
  )
}