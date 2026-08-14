// app/components/email/ticket-confirmation.tsx
import * as React from 'react'

interface TicketConfirmationProps {
  name: string
  email: string
  ticketCount: number
  totalPrice: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  orderNumber: string
  paymentMethod: string
}

export function TicketConfirmation({
  name,
  email,
  ticketCount,
  totalPrice,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  orderNumber,
  paymentMethod,
}: TicketConfirmationProps) {
  const isFree = totalPrice === '$0 (Free RSVP)'
  
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
      }}>
        <h1 style={{
          color: '#EFEADE',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0',
          fontFamily: 'serif',
        }}>
          Bazaar47
        </h1>
        <p style={{
          color: '#CCD145',
          fontSize: '14px',
          margin: '5px 0 0',
          letterSpacing: '2px',
        }}>
          {isFree ? 'RSVP Confirmation' : 'Ticket Confirmation'}
        </p>
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
          fontSize: '20px',
          margin: '0 0 5px',
        }}>
          Thank you, {name}!
        </h2>
        <p style={{
          color: '#6A2630',
          fontSize: '14px',
          margin: '0 0 20px',
        }}>
          {isFree 
            ? `Your RSVP for ${eventName} has been confirmed.`
            : `Your tickets for ${eventName} have been confirmed.`
          }
        </p>

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
          }}>
            {isFree ? 'RSVP Summary' : 'Order Summary'}
          </h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Event</td>
                <td style={{ color: '#341B1C', fontWeight: 'bold', textAlign: 'right' }}>{eventName}</td>
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
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Guests</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{ticketCount}</td>
              </tr>
              <tr>
                <td style={{ color: '#6A2630', padding: '4px 0' }}>Payment Method</td>
                <td style={{ color: '#341B1C', textAlign: 'right' }}>{paymentMethod}</td>
              </tr>
              <tr>
                <td style={{ 
                  color: '#6A2630', 
                  padding: '4px 0', 
                  borderTop: '2px solid #D5C9B1', 
                  paddingTop: '10px' 
                }}>
                  Total
                </td>
                <td style={{ 
                  color: isFree ? '#6A2630' : '#A62630',
                  fontWeight: 'bold', 
                  textAlign: 'right', 
                  borderTop: '2px solid #D5C9B1', 
                  paddingTop: '10px' 
                }}>
                  {isFree ? '🎉 FREE RSVP' : totalPrice}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{
          backgroundColor: isFree ? '#CCD145' : '#CCD145',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <p style={{
            color: '#202912',
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0',
          }}>
            {isFree ? `RSVP #${orderNumber}` : `Order #${orderNumber}`}
          </p>
          <p style={{
            color: '#202912',
            fontSize: '12px',
            margin: '5px 0 0',
          }}>
            {isFree 
              ? 'See you at the event!'
              : 'Please present this email at the door'
            }
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