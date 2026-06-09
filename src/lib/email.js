import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'CarRental <noreply@carrental.com>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Email error:', error)
      return { error }
    }
    return { data }
  } catch (err) {
    console.error('Email send error:', err)
    return { error: err.message }
  }
}

export function bookingConfirmedEmail({ customerName, bookingNumber, vehicleName, pickupDate, returnDate, totalDays, totalAmount, invoiceNumber }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #2563eb; width: 48px; height: 48px; border-radius: 10px; line-height: 48px; text-align: center; font-size: 24px; font-weight: bold; color: white; margin-bottom: 12px;">C</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CarRental</h1>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <h2 style="color: #4ade80; margin: 0 0 8px 0; font-size: 20px;">✓ Booking Confirmed!</h2>
        <p style="color: #94a3b8; margin: 0;">Hi ${customerName}, your booking has been confirmed.</p>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Booking Number</td><td style="color: #ffffff; font-family: monospace; text-align: right; font-size: 14px;">${bookingNumber}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Vehicle</td><td style="color: #ffffff; text-align: right; font-size: 14px;">${vehicleName}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Pickup Date</td><td style="color: #ffffff; text-align: right; font-size: 14px;">${pickupDate}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Return Date</td><td style="color: #ffffff; text-align: right; font-size: 14px;">${returnDate}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Duration</td><td style="color: #ffffff; text-align: right; font-size: 14px;">${totalDays} day${totalDays > 1 ? 's' : ''}</td></tr>
          <tr style="border-top: 1px solid #334155;"><td style="color: #ffffff; padding: 12px 0 0 0; font-size: 16px; font-weight: bold;">Total Amount</td><td style="color: #4ade80; text-align: right; font-size: 16px; font-weight: bold; padding-top: 12px;">$${totalAmount}</td></tr>
        </table>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px;">Invoice Generated</h3>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">Invoice <strong style="color: #60a5fa; font-family: monospace;">${invoiceNumber}</strong> has been generated for this booking. You can view and pay it from your dashboard.</p>
      </div>

      <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} CarRental — Fleet & Accounts Management
      </p>
    </div>
  `
}

export function paymentReceivedEmail({ customerName, invoiceNumber, amount, method, balance }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #2563eb; width: 48px; height: 48px; border-radius: 10px; line-height: 48px; text-align: center; font-size: 24px; font-weight: bold; color: white; margin-bottom: 12px;">C</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CarRental</h1>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <h2 style="color: #4ade80; margin: 0 0 8px 0; font-size: 20px;">💳 Payment Received</h2>
        <p style="color: #94a3b8; margin: 0;">Hi ${customerName}, we've received your payment.</p>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Invoice</td><td style="color: #60a5fa; font-family: monospace; text-align: right; font-size: 14px;">${invoiceNumber}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Amount Paid</td><td style="color: #4ade80; text-align: right; font-size: 14px; font-weight: bold;">$${amount}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Payment Method</td><td style="color: #ffffff; text-align: right; font-size: 14px; text-transform: capitalize;">${method}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Remaining Balance</td><td style="color: ${balance > 0 ? '#fbbf24' : '#4ade80'}; text-align: right; font-size: 14px;">$${balance}</td></tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} CarRental — Fleet & Accounts Management
      </p>
    </div>
  `
}

export function invoiceGeneratedEmail({ customerName, invoiceNumber, totalAmount, dueDate, bookingNumber }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #2563eb; width: 48px; height: 48px; border-radius: 10px; line-height: 48px; text-align: center; font-size: 24px; font-weight: bold; color: white; margin-bottom: 12px;">C</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CarRental</h1>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <h2 style="color: #60a5fa; margin: 0 0 8px 0; font-size: 20px;">🧾 Invoice Generated</h2>
        <p style="color: #94a3b8; margin: 0;">Hi ${customerName}, an invoice has been created for your rental.</p>
      </div>

      <div style="background: #1e293b; border-radius: 10px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Invoice Number</td><td style="color: #60a5fa; font-family: monospace; text-align: right;">${invoiceNumber}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Booking</td><td style="color: #ffffff; font-family: monospace; text-align: right;">${bookingNumber}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Amount Due</td><td style="color: #f87171; font-weight: bold; text-align: right;">$${totalAmount}</td></tr>
          <tr><td style="color: #64748b; padding: 6px 0; font-size: 14px;">Due Date</td><td style="color: #ffffff; text-align: right;">${dueDate}</td></tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
        Log in to your dashboard to view and pay this invoice.
      </p>
    </div>
  `
}