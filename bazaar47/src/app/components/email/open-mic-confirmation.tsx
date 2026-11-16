// components/email/open-mic-confirmation.tsx

interface OpenMicConfirmationProps {
  fullName: string
  artistName: string
  genre: string
  musicLink?: string
  instagram?: string
  email: string
  sessionDate: string
  /**
   * Human-readable label for the Wednesday this submission targets,
   * e.g. "Wednesday, November 18, 2026".
   */
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
}: OpenMicConfirmationProps) {
  const reachOutVia = instagram ? 'Instagram DM' : 'email'

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
            margin: '0 0 10px',
          }}
        >
          Thanks for signing up, {artistName}.
        </h2>
        <p
          style={{
            color: '#6A2630',
            fontSize: '14px',
            margin: '0 0 20px',
            lineHeight: '1.6',
          }}
        >
          We&apos;ve received your submission for Open Mic at Bazaar47.
          This confirms your entry, not a scheduled performance slot.
        </p>

        {/* Signed-up-for date — the ONLY scheduling detail */}
        <div
          style={{
            backgroundColor: '#CCD145',
            padding: '18px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#202912',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            You signed up for
          </p>
          <p
            style={{
              color: '#202912',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0',
            }}
          >
            {sessionLabel}
          </p>
        </div>

        {/* What happens next */}
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
              fontSize: '15px',
              margin: '0 0 10px',
              fontWeight: 'bold',
            }}
          >
            What happens next
          </h3>
          <p
            style={{
              color: '#6A2630',
              fontSize: '13px',
              margin: '0 0 10px',
              lineHeight: '1.6',
            }}
          >
            Our team reviews every signup and puts together the run of
            show. You&apos;ll hear from us via <strong>{reachOutVia}</strong>
            {' '}with the details — your set time, order, and anything else
            you need to know for the night.
          </p>
          <p
            style={{
              color: '#6A2630',
              fontSize: '13px',
              margin: '0',
              lineHeight: '1.6',
            }}
          >
            Getting this email doesn&apos;t guarantee a slot — the lineup
            is set after we&apos;ve reviewed all submissions for the week.
            If you&apos;re selected, we&apos;ll reach out directly.
          </p>
        </div>

        {/* Submission summary (no scheduling info) */}
        <div
          style={{
            backgroundColor: '#F5F0E8',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: '#341B1C',
              fontSize: '13px',
              margin: '0 0 10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Your submission
          </h3>
          <table style={{ width: '100%', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '3px 0' }}>Name</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {fullName}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '3px 0' }}>Artist</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {artistName}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '3px 0' }}>Genre</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {genre}
                </td>
              </tr>
              {musicLink && (
                <tr>
                  <td style={{ color: '#6A2630', padding: '3px 0' }}>
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
                  <td style={{ color: '#6A2630', padding: '3px 0' }}>
                    Instagram
                  </td>
                  <td style={{ color: '#341B1C', textAlign: 'right' }}>
                    {instagram}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ color: '#6A2630', padding: '3px 0' }}>Email</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>
                  {email}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DM heads-up */}
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
              lineHeight: '1.6',
            }}
          >
            <strong>Heads up:</strong> keep an eye on your{' '}
            {instagram ? 'Instagram inbox' : 'email inbox'}. That&apos;s
            where the run-of-show details will land if you&apos;re in the
            lineup.
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