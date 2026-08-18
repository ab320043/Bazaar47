// app/components/email/dance-confirmation.tsx
import * as React from 'react'

interface DanceSignupConfirmationProps {
  firstName: string
  lastName: string
  dancerName: string
  email: string
  instagram?: string
  city: string
  eventDate: string
  eventTime: string
  eventLocation: string
  signupNumber: string
}

export function DanceSignupConfirmation({
  firstName,
  lastName,
  dancerName,
  email,
  instagram,
  city,
  eventDate,
  eventTime,
  eventLocation,
  signupNumber,
}: DanceSignupConfirmationProps) {
  return (
    <div style={{
      fontFamily: 'host-grotesk, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#EFEADE',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#341B1C',
        padding: '30px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          background: 'rgba(204, 209, 69, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50%',
          left: '-20%',
          width: '200px',
          height: '200px',
          background: 'rgba(204, 209, 69, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }} />
        
        <h1 style={{
          color: '#EFEADE',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0',
          fontFamily: 'serif',
          position: 'relative',
          zIndex: 1,
        }}>
          Bazaar47
        </h1>
      </div>

      {/* Body */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '30px',
        borderRadius: '0 0 12px 12px',
        border: '1px solid #D5C9B1',
      }}>
        <h2 style={{
          color: '#341B1C',
          fontSize: '22px',
          margin: '0 0 5px',
        }}>
          You are In the Dance Battle, {dancerName || `${firstName} ${lastName}`}! 🎤
        </h2>
        <p style={{
          color: '#6A2630',
          fontSize: '14px',
          margin: '0 0 20px',
        }}>
          Your spot in the Red Bull Dance Your Style Showcase has been confirmed.
        </p>

        {/* Sign-up Details */}
        <div style={{
          backgroundColor: '#F5F0E8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #CCD145',
        }}>
          <h3 style={{
            color: '#341B1C',
            fontSize: '16px',
            margin: '0 0 10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Battle Sign-Up Details
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Dancer Name</td>
                <td style={{ color: '#341B1C', fontWeight: 'bold', textAlign: 'right' }}>
                  {dancerName}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Full Name</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{`${firstName} ${lastName}`}</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>City</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{city || 'TBA'}</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Sign-Up #</td>
                <td style={{ color: '#341B1C', textAlign: 'right', fontFamily: 'monospace' }}>
                  {signupNumber}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Event Details */}
        <div style={{
          backgroundColor: '#F5F0E8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h3 style={{
            color: '#341B1C',
            fontSize: '16px',
            margin: '0 0 10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Event Details
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Event</td>
                <td style={{ color: '#341B1C', fontWeight: 'bold', textAlign: 'right' }}>
                  The Big Bazaar Block Party
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Date</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{eventDate}</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Time</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{eventTime}</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Location</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{eventLocation}</td>
              </tr>
            </tbody>
          </table>
        </div>
       
        <div style={{
          backgroundColor: '#341B1C',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <p style={{
            color: '#CCD145',
            fontSize: '12px',
            fontWeight: 'bold',
            margin: '0',
            letterSpacing: '1px',
          }}>
            Artist Pass
          </p>
          <p style={{
            color: '#EFEADE',
            fontSize: '11px',
            margin: '4px 0 0',
            opacity: 0.6,
          }}>
            {signupNumber} · GNV · 2026
          </p>
        </div>

        <p style={{
          color: '#6A2630',
          fontSize: '12px',
          textAlign: 'center',
          margin: '20px 0 0',
        }}>
          ✦ Bazaar47 • A space for culture, community, and connection. ✦
        </p>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        fontSize: '12px',
        color: '#D5C9B1',
      }}>
        <p style={{ margin: '0' }}>
          Questions? Contact us at info@bazaar47.com
        </p>
        <p style={{ margin: '5px 0 0' }}>
          © 2026 Bazaar47 • 60 SW 2nd Street, Gainesville, FL
        </p>
      </div>
    </div>
  )
}