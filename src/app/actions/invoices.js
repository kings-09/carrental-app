'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

function generateInvoiceNumber() {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV${y}${m}${rand}`
}

export async function createInvoice(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const subtotal = parseFloat(formData.subtotal) || 0
  const taxRate = parseFloat(formData.tax_rate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = parseFloat(formData.discount_amount) || 0
  const lateFee = parseFloat(formData.late_fee) || 0
  const damageFee = parseFloat(formData.damage_fee) || 0
  const fuelCharge = parseFloat(formData.fuel_charge) || 0
  const driverCharge = parseFloat(formData.driver_charge) || 0
  const totalAmount = subtotal + taxAmount - discountAmount + lateFee + damageFee + fuelCharge + driverCharge
  const balanceDue = totalAmount - (parseFloat(formData.amount_paid) || 0)

  const invoice = {
    invoice_number: generateInvoiceNumber(),
    booking_id: formData.booking_id || null,
    customer_id: formData.customer_id,
    status: balanceDue <= 0 ? 'paid' : formData.amount_paid > 0 ? 'partial' : 'pending',
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    late_fee: lateFee,
    damage_fee: damageFee,
    fuel_charge: fuelCharge,
    driver_charge: driverCharge,
    total_amount: totalAmount,
    amount_paid: parseFloat(formData.amount_paid) || 0,
    balance_due: balanceDue,
    due_date: formData.due_date || null,
    notes: formData.notes || null,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  return { success: true, data }
}

export async function updateInvoiceStatus(id, status) {
  const supabase = await createClient()
  const updates = { status, updated_at: new Date().toISOString() }
  if (status === 'paid') updates.paid_at = new Date().toISOString()

  const { error } = await supabase
    .from('invoices').update(updates).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function deleteInvoice(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices').update({ is_deleted: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/invoices')
  return { success: true }
}