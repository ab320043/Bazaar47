// app/components/email/open-mic-confirmation.tsx
import * as React from 'react'

interface OpenMicConfirmationProps {
  fullName: string
  artistName: string
  genre: string
  musicLink?: string
  instagram?: string
  email: string
  sessionDate: string
  sessionLabel: string
  confirmationNumber: string
}

export function OpenMicConfirmation({
  fullName,
  artistName,
  genre,
  musicLink,
  instagram,
  email,
  sessionLabel,
  confirmationNumber,
}: OpenMicConfirmationProps) {
  return (
    <div
      style={{
        fontFamily: 'host-grotesk, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#EFEADE',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#202912',
          padding: '30px',
          textAlign: 'center',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'rgba(204, 209, 69, 0.15)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
        <h1
          style={{
            color: '#EFEADE',
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0',
            fontFamily: 'serif',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Bazaar47
        </h1>
        <p
          style={{
            color: '#CCD145',
            fontSize: '13px',
            margin: '6px 0 0',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Open Mic
        </p>
      </div>

      {/* Body */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '30px',
          borderRadius: '0 0 12px 12px',
          border: '1px solid #D5C9B1',
        }}
      >
        <h2
          style={{
            color: '#341B1C',
            fontSize: '22px',
            margin: '0 0 5px',
          }}
        >
          You&apos;re on, {artistName}!
        </h2>
        <p
          style={{
            color: '#6A2630',
            fontSize: '14px',
            margin: '0 0 20px',
          }}
        >
          Thanks for signing up for Open Mic at Bazaar47. We&apos;ll see you there.
        </p>

        {/* Session Details */}
        <div
          style={{
            backgroundColor: '#F5F0E8',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: '#341B1C',
              fontSize: '16px',
              margin: '0 0 10px',
              fontWeight: 'bold',
            }}
          >
            Session Details
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>When</td>
                <td
                  style={{
                    color: '#341B1C',
                    fontWeight: 'bold',
                    textAlign: 'right',
                  }}
                >
                  {sessionLabel}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Where</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  Bazaar47 · 60 SW 2nd Street
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>
                  Artist
                </td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {artistName}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Genre</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {genre}
                </td>
              </tr>
              {musicLink && (
                <tr>
                  <td style={{ color: '#6A2630', padding: '4px 0' }}>
                    Your music
                  </td>
                  <td style={{ color: '#341B1C', textAlign: 'right' }}>
                    <a
                      href={musicLink}
                      style={{
                        color: '#295211',
                        textDecoration: 'underline',
                      }}
                    >
                      Link
                    </a>
                  </td>
                </tr>
              )}
              {instagram && (
                <tr>
                  <td style={{ color: '#6A2630', padding: '4px 0' }}>
                    Instagram
                  </td>
                  <td style={{ color: '#341B1C', textAlign: 'right' }}>
                    {instagram}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Confirmation Number */}
        <div
          style={{
            backgroundColor: '#CCD145',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              color: '#202912',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0',
            }}
          >
            Confirmation #{confirmationNumber}
          </p>
          <p style={{ color: '#202912', fontSize: '12px', margin: '5px 0 0' }}>
            Save this for check-in
          </p>
        </div>

        {/* Check-in note */}
        <div
          style={{
            backgroundColor: '#FFDBE1',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              color: '#6A2630',
              fontSize: '13px',
              margin: '0',
              lineHeight: '1.5',
            }}
          >
            <strong>Check-in at 7:30 PM.</strong> Bring whatever you need
            for your set — cables, instruments, backing tracks. The
            stage is yours.
          </p>
        </div>

        <p
          style={{
            color: '#6A2630',
            fontSize: '12px',
            textAlign: 'center',
            margin: '20px 0 0',
          }}
        >
          ✦ Bazaar47 · A space for culture, community, and connection. ✦
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          fontSize: '12px',
          color: '#D5C9B1',
        }}
      >
        <p style={{ margin: '0' }}>
          Questions? Contact us at info@bazaar47.com
        </p>
        <p style={{ margin: '5px 0 0' }}>
          © 2026 Bazaar47 · 60 SW 2nd Street, Gainesville, FL
        </p>
      </div>
    </div>
  )
}