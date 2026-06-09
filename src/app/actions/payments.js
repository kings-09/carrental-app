'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function recordPayment(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const amount = parseFloat(formData.amount)
  if (!amount || amount <= 0) return { error: 'Invalid payment amount' }

  // Insert payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: formData.invoice_id,
      customer_id: formData.customer_id,
      amount,
      method: formData.method,
      reference: formData.reference || null,
      notes: formData.notes || null,
      recorded_by: user.id,
    })

  if (paymentError) return { error: paymentError.message }

  // Update invoice amount_paid and balance_due
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount, amount_paid')
    .eq('id', formData.invoice_id)
    .single()

  if (invoice) {
    const newAmountPaid = (invoice.amount_paid ?? 0) + amount
    const newBalance = invoice.total_amount - newAmountPaid
    const newStatus = newBalance <= 0 ? 'paid' : 'partial'

    await supabase.from('invoices').update({
      amount_paid: newAmountPaid,
      balance_due: Math.max(0, newBalance),
      status: newStatus,
      paid_at: newBalance <= 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', formData.invoice_id)
  }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/invoices')
  return { success: true }
}