import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { TicketConfirmation } from '@/app/components/email/ticket-confirmation'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Received email request body:', body)
    
    const { 
      name, 
      email, 
      ticketCount, 
      totalPrice, 
      eventName, 
      eventDate, 
      eventTime, 
      eventLocation, 
      orderNumber, 
      paymentMethod 
    } = body

    if (!email) {
      console.error('❌ No email provided')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('❌ NEXT_PUBLIC_RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    console.log('📧 Attempting to send email:')
    console.log('  - From: Bazaar47 <info@bazaar47.com>')
    console.log('  - To:', email)
    console.log('  - Subject: 🎫 Your Tickets for', eventName)
    console.log('  - Order:', orderNumber)

    const { data, error } = await resend.emails.send({
      from: 'Bazaar47 <info@bazaar47.com>',
      to: [email],
      subject: `🎫 Your Tickets for ${eventName} - Bazaar47`,
      react: TicketConfirmation({
        name: name || 'Guest',
        email: email,
        ticketCount: ticketCount || 1,
        totalPrice: totalPrice || '$0.00',
        eventName: eventName || 'Bazaar47 Event',
        eventDate: eventDate || 'TBA',
        eventTime: eventTime || 'TBA',
        eventLocation: eventLocation || 'TBA',
        orderNumber: orderNumber || 'N/A',
        paymentMethod: paymentMethod || 'Credit Card',
      }),
      text: `Thank you ${name}! Your tickets for ${eventName} have been confirmed.\n\nOrder #${orderNumber}\nTickets: ${ticketCount}\nTotal: ${totalPrice}\n\nDate: ${eventDate} at ${eventTime}\nLocation: ${eventLocation}\n\nPlease present this email at the door for entry.\n\n✦ Bazaar47 • 60 SW 2nd Street, Gainesville, FL`,
      // 🔥 FIX: Clean up tags to only use ASCII letters, numbers, underscores, or dashes
      tags: [
        { 
          name: 'category', 
          value: 'ticket-confirmation'  // Changed from 'ticket_confirmation' (underscores are fine, but dashes are safer)
        },
        { 
          name: 'event-type', 
          value: 'bazaar-event'  // Simple ASCII value
        },
      ],
    })

    if (error) {
      console.error('❌ Resend API Error:', {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
      })
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: error.message,
          statusCode: error.statusCode 
        },
        { status: error.statusCode || 500 }
      )
    }

    console.log('✅ Email sent successfully!')
    console.log('  - ID:', data?.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Confirmation email sent',
      emailId: data?.id 
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    )
  }
}