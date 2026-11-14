// app/components/email/winter-market-confirmation.tsx
import * as React from 'react'
import type { WinterMarketApplication } from '@/types/winter-market'

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
}

export function WinterMarketConfirmation({ application }: { application: WinterMarketApplication }) {
  // Create a Google Calendar link for their first date
  const firstDate = application.selectedDates[0]
  const dateObj = new Date(`${firstDate}T16:00:00`) // 4 PM
  const endObj = new Date(`${firstDate}T22:00:00`) // 10 PM
  
  const formatGCal = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "")
  const gcalDates = `${formatGCal(dateObj)}/${formatGCal(endObj)}`
  
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Downtown+Winter+Market+-+${encodeURIComponent(application.businessName)}&dates=${gcalDates}&details=Setup+starts+at+3:00+PM.+Market+is+open+4:00+PM+-+10:00+PM.&location=The+Streatery,+106+SW+1st+Ave,+Gainesville,+FL+32601`

  return (
    <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#EFEADE', padding: '40px 20px', margin: '0', width: '100%' }}>
      <table width="100%" border={0} cellSpacing={0} cellPadding={0} style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(52, 27, 28, 0.08)' }}>
        
        {/* HEADER */}
        <tr>
          <td style={{ backgroundColor: '#6A2630', padding: '40px 30px', textAlign: 'center' }}>
            <h1 style={{ color: '#EFEADE', fontSize: '32px', fontWeight: 'bold', margin: '0', letterSpacing: '-0.5px' }}>
              Bazaar47
            </h1>
            <p style={{ color: '#FFDBE1', fontSize: '13px', margin: '8px 0 0', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Downtown Winter Market
            </p>
          </td>
        </tr>

        {/* BODY */}
        <tr>
          <td style={{ padding: '40px 30px' }}>
            <h2 style={{ color: '#341B1C', fontSize: '24px', margin: '0 0 10px', fontWeight: 'bold' }}>
              You&apos;re confirmed! 🎉
            </h2>
            <p style={{ color: '#6A2630', fontSize: '16px', margin: '0 0 30px', lineHeight: '1.5' }}>
              Hi {application.preferredName || application.fullName},<br/><br/>
              Thank you for applying to the Downtown Winter Market Series! Your payment has been successfully processed, and your spot(s) for <strong>{application.businessName}</strong> are officially locked in.
            </p>

            {/* DATES BOX */}
            <div style={{ backgroundColor: '#FFFCF8', border: '2px solid #CCD145', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
              <h3 style={{ color: '#295211', fontSize: '16px', margin: '0 0 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Your Confirmed Dates
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16px', color: '#341B1C', lineHeight: '1.8' }}>
                {application.selectedDates.map(date => (
                  <li key={date} style={{ padding: '4px 0' }}>
                    <strong>{formatDate(date)}</strong>
                  </li>
                ))}
              </ul>
            </div>

            {/* EVENT DETAILS TABLE */}
            <h3 style={{ color: '#341B1C', fontSize: '18px', margin: '0 0 16px', fontWeight: 'bold' }}>
              Event Details
            </h3>
            <table width="100%" border={0} cellSpacing={0} cellPadding={0} style={{ fontSize: '15px', color: '#341B1C', marginBottom: '30px' }}>
              <tr>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', color: '#6A2630', width: '40%' }}>Location</td>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', textAlign: 'right', fontWeight: 'bold' }}>
                  The Streatery<br/>
                  <span style={{ fontWeight: 'normal', fontSize: '13px', color: '#6A2630' }}>106 SW 1st Ave, Gainesville</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', color: '#6A2630' }}>Setup Time</td>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', textAlign: 'right', fontWeight: 'bold' }}>3:00 PM</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', color: '#6A2630' }}>Market Hours</td>
                <td style={{ padding: '12px 0', borderBottom: '1px solid #EFEADE', textAlign: 'right', fontWeight: 'bold' }}>4:00 PM – 10:00 PM</td>
              </tr>
            </table>

            {/* CALENDAR CTA */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: '#341B1C', color: '#EFEADE', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px' }}>
                + Add to Google Calendar
              </a>
            </div>

            <p style={{ color: '#6A2630', fontSize: '14px', textAlign: 'center', margin: '40px 0 0', lineHeight: '1.5' }}>
              Need to make a change or have questions?<br/>
              Reply to this email or contact us at <a href="mailto:info@bazaar47.com" style={{ color: '#295211', fontWeight: 'bold' }}>info@bazaar47.com</a>.
            </p>
          </td>
        </tr>

        {/* FOOTER */}
        <tr>
          <td style={{ backgroundColor: '#FFFCF8', padding: '20px', textAlign: 'center', borderTop: '1px solid #EFEADE' }}>
            <p style={{ color: '#D5C9B1', fontSize: '12px', margin: '0', lineHeight: '1.5' }}>
              © 2026 Bazaar47 · 60 SW 2nd Street, Gainesville, FL<br/>
              <a href="https://www.bazaar47.com" style={{ color: '#D5C9B1', textDecoration: 'underline' }}>www.bazaar47.com</a>
            </p>
          </td>
        </tr>

      </table>
    </div>
  )
}