import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoicePDF from '@/components/finance/InvoicePDF'
import { NextResponse } from 'next/server'
import { createElement } from 'react'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        bookings!invoices_booking_id_fkey(
          booking_number, pickup_date, return_date, total_days,
          vehicles!bookings_vehicle_id_fkey(make, model, year)
        ),
        profiles!invoices_customer_id_fkey(full_name, phone, address)
      `)
      .eq('id', id)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const buffer = await renderToBuffer(
      createElement(InvoicePDF, {
        invoice,
        booking: invoice.bookings,
        customer: invoice.profiles,
      })
    )

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}