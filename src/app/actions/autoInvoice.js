'use server'
import { sendEmail, bookingConfirmedEmail, invoiceGeneratedEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function generateInvoiceNumber() {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV${y}${m}${rand}`
}

export async function autoGenerateInvoice(bookingId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch booking with all details
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, booking_number, customer_id, total_amount,
      subtotal, discount_amount, tax_amount, total_days,
      daily_rate, pickup_date, return_date,
      profiles!bookings_customer_id_fkey(full_name, phone),
      vehicles!bookings_vehicle_id_fkey(make, model, year)
    `)
    .eq('id', bookingId)
    .single()

  if (!booking) return { error: 'Booking not found' }

  // Check if invoice already exists for this booking
  const { data: existing } = await supabaseAdmin
    .from('invoices')
    .select('id')
    .eq('booking_id', bookingId)
    .single()

  if (existing) return { success: true, invoiceId: existing.id, alreadyExists: true }

  // Set due date 7 days from now
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  const totalAmount = booking.total_amount ?? 0
  const taxAmount = booking.tax_amount ?? 0
  const discountAmount = booking.discount_amount ?? 0
  const subtotal = booking.subtotal ?? totalAmount

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      invoice_number: generateInvoiceNumber(),
      booking_id: bookingId,
      customer_id: booking.customer_id,
      status: 'pending',
      subtotal,
      tax_rate: 0,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      late_fee: 0,
      damage_fee: 0,
      fuel_charge: 0,
      driver_charge: 0,
      total_amount: totalAmount,
      amount_paid: 0,
      balance_due: totalAmount,
      due_date: dueDate.toISOString().split('T')[0],
      notes: `Auto-generated for booking ${booking.booking_number}`,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Create notification for customer
  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: booking.customer_id,
      title: 'Booking Confirmed',
      message: `Your booking ${booking.booking_number} has been confirmed. Invoice ${invoice.invoice_number} has been generated for $${totalAmount.toFixed(2)}.`,
      type: 'success',
    })

  // Audit log
  await supabaseAdmin
    .from('audit_logs')
    .insert({
      actor_id: user.id,
      action: 'invoice.auto_generated',
      table_name: 'invoices',
      record_id: invoice.id,
      new_data: {
        invoice_number: invoice.invoice_number,
        booking_id: bookingId,
        total_amount: totalAmount,
      },
    })

    // Fetch customer email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(booking.customer_id)
    const customerEmail = authUser?.user?.email

    if (customerEmail) {
    const vehicle = booking.vehicles
    const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'

    await sendEmail({
        to: customerEmail,
        subject: `Booking Confirmed — ${booking.booking_number}`,
        html: bookingConfirmedEmail({
        customerName: booking.profiles?.full_name ?? 'Customer',
        bookingNumber: booking.booking_number,
        vehicleName,
        pickupDate: new Date(booking.pickup_date).toLocaleDateString('en-US', { dateStyle: 'medium' }),
        returnDate: new Date(booking.return_date).toLocaleDateString('en-US', { dateStyle: 'medium' }),
        totalDays: booking.total_days,
        totalAmount: totalAmount.toFixed(2),
        invoiceNumber: invoice.invoice_number,
        }),
    })
    }

    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/invoices')

    return { success: true, invoiceId: invoice.id, invoice }
}