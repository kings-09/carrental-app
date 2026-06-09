import { createPaynow } from '@/lib/paynow'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invoiceId, phone, method } = await request.json()

    if (!invoiceId) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

    // Fetch invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, balance_due, status,
        bookings!invoices_booking_id_fkey(
          booking_number,
          vehicles!bookings_vehicle_id_fkey(make, model, year)
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (invoice.balance_due <= 0) return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })

    const vehicle = invoice.bookings?.vehicles
    const description = vehicle
      ? `Car Rental - ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : `Car Rental - Invoice ${invoice.invoice_number}`

    const paynow = createPaynow()

    // Set return URL with invoice id
    paynow.returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?invoice_id=${invoiceId}`

    // Create payment
    const payment = paynow.createPayment(
      `Invoice_${invoice.invoice_number}`,
      process.env.PAYNOW_MERCHANT_EMAIL
    )
    payment.add(description, invoice.balance_due)

    let response

    // Mobile money payment (EcoCash or OneMoney)
    if (method === 'ecocash' || method === 'onemoney') {
      response = await paynow.sendMobile(payment, phone, method)
    } else {
      // Web-based payment
      response = await paynow.send(payment)
    }

    if (!response.success) {
      return NextResponse.json(
        { error: response.error ?? 'Payment initiation failed' },
        { status: 400 }
      )
    }

    // Store the poll URL so we can check status later
    await supabase
      .from('invoices')
      .update({
        notes: `Paynow poll: ${response.pollUrl ?? ''}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    // For mobile money — no redirect needed, customer gets prompt on phone
    if (method === 'ecocash' || method === 'onemoney') {
      return NextResponse.json({
        success: true,
        mobile: true,
        pollUrl: response.pollUrl,
        message: `Payment request sent to ${phone}. Please check your phone and enter your PIN to complete payment.`,
      })
    }

    // For web payment — redirect to Paynow
    return NextResponse.json({
      success: true,
      mobile: false,
      redirectUrl: response.redirectUrl,
    })
  } catch (error) {
    console.error('Paynow error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}