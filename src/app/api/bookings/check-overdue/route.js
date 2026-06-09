import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const now = new Date().toISOString()

    // Find active bookings past their return date
    const { data: overdueBookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_number, customer_id, return_date,
        vehicles!bookings_vehicle_id_fkey(make, model),
        profiles!bookings_customer_id_fkey(full_name)
      `)
      .eq('status', 'active')
      .lt('return_date', now)
      .eq('is_deleted', false)

    if (!overdueBookings?.length) {
      return NextResponse.json({ updated: 0 })
    }

    let updated = 0

    for (const booking of overdueBookings) {
      // Mark as overdue
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      // Notify customer
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: booking.customer_id,
          title: 'Rental Overdue',
          message: `Your rental of ${booking.vehicles?.make} ${booking.vehicles?.model} (Booking: ${booking.booking_number}) is overdue. Please return the vehicle immediately.`,
          type: 'error',
        })

      // Audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_id: booking.customer_id,
          action: 'booking.status.overdue',
          table_name: 'bookings',
          record_id: booking.id,
          new_data: {
            booking_number: booking.booking_number,
            return_date: booking.return_date,
            auto_flagged: true,
          },
        })

      updated++
    }

    return NextResponse.json({ updated, bookings: overdueBookings.map((b) => b.booking_number) })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}