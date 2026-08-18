
import * as React from 'react'

interface DanceSignupConfirmationProps {
  firstName: string
  lastName: string
  dancerName: string
  instagram: string
  city: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  signupNumber: string
}

export function DanceSignupConfirmation({
  firstName,
  lastName,
  dancerName,
  instagram,
  city,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  signupNumber,
}: DanceSignupConfirmationProps) {
  const displayName = dancerName || firstName

  return (
    <Html>
      <Head />
      <Preview>You&apos;re confirmed for the Bazaar47 Dance Battle 🔥</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header band */}
          <Section style={styles.headerBand}>
            <Text style={styles.headerEyebrow}>BLOCK PARTY EXCLUSIVE</Text>
            <Heading style={styles.headerTitle}>Dance Battle</Heading>
          </Section>

          {/* Body */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>You&apos;re in, {displayName}! 🔥</Text>
            <Text style={styles.paragraph}>
              Your spot in the {eventName} is locked in. Keep an eye on your
              inbox — battle order goes out closer to the date.
            </Text>

            <Hr style={styles.hr} />

            {/* Pass details */}
            <Section style={styles.passCard}>
              <Text style={styles.passLabel}>DANCE BATTLE PASS</Text>
              <Text style={styles.passSerial}>{signupNumber}</Text>

              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.detailLabelOnDark}>Dancer</Text>
                  <Text style={styles.detailValueOnDark}>{displayName}</Text>
                </Column>
                <Column>
                  <Text style={styles.detailLabelOnDark}>Name on file</Text>
                  <Text style={styles.detailValueOnDark}>
                    {firstName} {lastName}
                  </Text>
                </Column>
              </Row>

              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.detailLabelOnDark}>From</Text>
                  <Text style={styles.detailValueOnDark}>{city}</Text>
                </Column>
                <Column>
                  <Text style={styles.detailLabelOnDark}>Instagram</Text>
                  <Text style={styles.detailValueOnDark}>{instagram || '—'}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={styles.hr} />

            {/* Event info */}
            <Section>
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{eventDate}</Text>
                </Column>
                <Column>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{eventTime}</Text>
                </Column>
              </Row>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{eventLocation}</Text>
            </Section>

            <Text style={styles.footerNote}>
              ✦ Free to enter · Open sign-up ✦
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Bazaar47 · 60 SW 2nd Street, Gainesville, FL
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DanceSignupConfirmation

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: colors.sandDune,
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    margin: 0,
    padding: '32px 0',
  },
  container: {
    backgroundColor: colors.plaster,
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '480px',
    margin: '0 auto',
  },
  headerBand: {
    backgroundColor: colors.henna,
    padding: '32px 32px 28px',
    textAlign: 'center' as const,
  },
  headerEyebrow: {
    color: colors.plaster,
    opacity: 0.7,
    fontSize: '11px',
    letterSpacing: '3px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  headerTitle: {
    color: colors.plaster,
    fontSize: '34px',
    fontWeight: 800,
    margin: 0,
    lineHeight: 1,
  },
  content: {
    padding: '32px',
  },
  greeting: {
    color: colors.henna,
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  paragraph: {
    color: '#3A2A22',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 16px',
  },
  hr: {
    borderColor: 'rgba(91,42,31,0.12)',
    margin: '20px 0',
  },
  passCard: {
    backgroundColor: colors.henna,
    borderRadius: '12px',
    padding: '20px',
  },
  passLabel: {
    color: colors.plaster,
    opacity: 0.5,
    fontSize: '10px',
    letterSpacing: '3px',
    fontWeight: 800,
    margin: '0 0 2px',
  },
  passSerial: {
    color: colors.chartreuse,
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1px',
    margin: '0 0 16px',
  },
  detailRow: {
    marginBottom: '12px',
  },
  detailLabel: {
    color: colors.henna,
    opacity: 0.5,
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 2px',
  },
  detailValue: {
    color: colors.henna,
    fontSize: '14px',
    fontWeight: 700,
    margin: 0,
  },
  detailLabelOnDark: {
    color: colors.plaster,
    opacity: 0.5,
    fontSize: '10px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 2px',
  },
  detailValueOnDark: {
    color: colors.plaster,
    fontSize: '14px',
    fontWeight: 700,
    margin: 0,
  },
  footerNote: {
    textAlign: 'center' as const,
    color: '#3A2A22',
    opacity: 0.4,
    fontSize: '11px',
    marginTop: '24px',
  },
  footer: {
    backgroundColor: colors.sandDune,
    padding: '16px 32px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: colors.henna,
    opacity: 0.6,
    fontSize: '11px',
    margin: 0,
  },
}