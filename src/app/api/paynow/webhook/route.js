import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const status = formData.get('status')
    const reference = formData.get('reference')
    const amount = parseFloat(formData.get('amount') ?? 0)
    const pollUrl = formData.get('pollurl')

    // Only process paid transactions
    if (status?.toLowerCase() !== 'paid') {
      return NextResponse.json({ received: true })
    }

    // Find invoice by poll URL stored in notes
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, amount_paid, total_amount, balance_due, customer_id')
      .ilike('notes', `%${pollUrl}%`)
      .limit(1)

    const invoice = invoices?.[0]
    if (!invoice) return NextResponse.json({ received: true })

    const newAmountPaid = (invoice.amount_paid ?? 0) + amount
    const newBalance = Math.max(0, invoice.total_amount - newAmountPaid)
    const newStatus = newBalance <= 0 ? 'paid' : 'partial'

    await supabaseAdmin
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalance,
        status: newStatus,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount,
        method: 'mobile_money',
        reference,
        notes: 'Paynow webhook payment',
        recorded_by: invoice.customer_id,
      })

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: invoice.customer_id,
        title: 'Payment Confirmed',
        message: `Your payment of $${amount.toFixed(2)} has been confirmed.`,
        type: 'success',
      })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}