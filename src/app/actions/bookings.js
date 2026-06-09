'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

function generateBookingNumber() {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `BK${y}${m}${rand}`
}

export async function createBooking(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const pickup = new Date(formData.pickup_date)
  const returnD = new Date(formData.return_date)
  const totalDays = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24))
  if (totalDays <= 0) return { error: 'Return date must be after pickup date' }

  // Check vehicle availability
  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', formData.vehicle_id)
    .in('status', ['confirmed', 'active'])
    .lt('pickup_date', formData.return_date)
    .gt('return_date', formData.pickup_date)

  if (conflict?.length > 0) return { error: 'Vehicle is not available for selected dates' }

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('daily_rate, weekly_rate, monthly_rate')
    .eq('id', formData.vehicle_id)
    .single()

  const dailyRate = vehicle?.daily_rate ?? 0
  const subtotal = dailyRate * totalDays
  const taxAmount = subtotal * ((parseFloat(formData.tax_rate) || 0) / 100)
  const discountAmount = parseFloat(formData.discount_amount) || 0
  const totalAmount = subtotal + taxAmount - discountAmount

  const booking = {
    booking_number: generateBookingNumber(),
    customer_id: formData.customer_id,
    vehicle_id: formData.vehicle_id,
    assigned_by: user.id,
    status: 'pending',
    pickup_date: formData.pickup_date,
    return_date: formData.return_date,
    pickup_location: formData.pickup_location || null,
    dropoff_location: formData.dropoff_location || null,
    total_days: totalDays,
    daily_rate: dailyRate,
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    notes: formData.notes || null,
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  return { success: true, data }
}

export async function updateBookingStatus(id, status) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  }

  // When marking active — set vehicle to rented
  if (status === 'active') {
    const { data: booking } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .eq('id', id)
      .single()
    if (booking?.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', booking.vehicle_id)
    }
  }

  // When completed or cancelled — free up vehicle
  if (status === 'completed' || status === 'cancelled') {
    const { data: booking } = await supabase
      .from('bookings')
      .select('vehicle_id, customer_id, booking_number')
      .eq('id', id)
      .single()
    if (booking?.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', booking.vehicle_id)
    }
    if (status === 'completed') {
      updates.actual_return_date = new Date().toISOString()
    }
    // Notify customer of cancellation
    if (status === 'cancelled' && booking?.customer_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.customer_id,
          title: 'Booking Cancelled',
          message: `Your booking ${booking.booking_number} has been cancelled.`,
          type: 'warning',
        })
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }

  // Auto-generate invoice when booking is confirmed
  if (status === 'confirmed') {
    const { autoGenerateInvoice } = await import('./autoInvoice')
    await autoGenerateInvoice(id)
  }

  // Audit log
  await supabase
    .from('audit_logs')
    .insert({
      actor_id: user.id,
      action: `booking.status.${status}`,
      table_name: 'bookings',
      record_id: id,
      new_data: { status },
    })

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function deleteBooking(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/bookings')
  return { success: true }
}