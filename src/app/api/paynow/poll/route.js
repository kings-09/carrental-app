import { createClient } from '@/lib/supabase-server'
import { sendEmail, paymentReceivedEmail } from '@/lib/email'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pollUrl, invoiceId } = await request.json()
    if (!pollUrl || !invoiceId) {
      return NextResponse.json({ error: 'Poll URL and Invoice ID required' }, { status: 400 })
    }

    // Manually poll Paynow — fetch the poll URL directly
    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const text = await pollResponse.text()

    // Parse the response — Paynow returns key=value pairs
    const params = new URLSearchParams(text)
    const status = params.get('status')?.toLowerCase()
    const reference = params.get('reference')

    console.log('Paynow poll status:', status, 'reference:', reference)

    if (status === 'paid') {
      // Fetch current invoice
      const { data: invoice } = await supabaseAdmin
        .from('invoices')
        .select('amount_paid, total_amount, balance_due')
        .eq('id', invoiceId)
        .single()

      if (invoice) {
        const amountPaid = invoice.balance_due
        const newAmountPaid = (invoice.amount_paid ?? 0) + amountPaid
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
          .eq('id', invoiceId)

        await supabaseAdmin
          .from('payments')
          .insert({
            invoice_id: invoiceId,
            customer_id: user.id,
            amount: amountPaid,
            method: 'mobile_money',
            reference: reference ?? pollUrl,
            notes: 'EcoCash / Paynow payment',
            recorded_by: user.id,
          })

        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: user.id,
            title: 'Payment Successful',
            message: `Your payment of $${amountPaid.toFixed(2)} has been received. Thank you!`,
            type: 'success',
          })

        await supabaseAdmin
          .from('audit_logs')
          .insert({
            actor_id: user.id,
            action: 'payment.paynow.completed',
            table_name: 'invoices',
            record_id: invoiceId,
            new_data: { amount: amountPaid, status: newStatus, reference },
          })
      }

      const { data: invoiceData } = await supabaseAdmin
        .from('invoices')
        .select(`
          invoice_number, balance_due,
          profiles!invoices_customer_id_fkey(full_name)
        `)
        .eq('id', invoiceId)
        .single()

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
      const customerEmail = authUser?.user?.email

      if (customerEmail && invoiceData) {
        await sendEmail({
          to: customerEmail,
          subject: `Payment Received — ${invoiceData.invoice_number}`,
          html: paymentReceivedEmail({
            customerName: invoiceData.profiles?.full_name ?? 'Customer',
            invoiceNumber: invoiceData.invoice_number,
            amount: amountPaid.toFixed(2),
            method: 'EcoCash / Mobile Money',
            balance: Math.max(0, invoiceData.balance_due - amountPaid).toFixed(2),
          }),
        })
      }

      return NextResponse.json({ paid: true })
    }

    // awaiting — customer hasn't approved yet
    if (status === 'awaiting delivery' || status === 'sent') {
      return NextResponse.json({ paid: false, status: 'awaiting' })
    }

    // cancelled or failed
    if (status === 'cancelled' || status === 'failed') {
      return NextResponse.json({ paid: false, status: 'cancelled' })
    }

    return NextResponse.json({ paid: false, status: status ?? 'unknown' })

  } catch (error) {
    console.error('Poll error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}