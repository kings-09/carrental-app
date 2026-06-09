import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'
import { format } from 'date-fns'

const statusConfig = {
  pending:   { label: 'Pending',   class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  active:    { label: 'Active',    class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  completed: { label: 'Completed', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  overdue:   { label: 'Overdue',   class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, status, pickup_date, return_date,
      total_days, total_amount, daily_rate, pickup_location,
      dropoff_location, notes, created_at,
      vehicles!bookings_vehicle_id_fkey(
        make, model, year, plate_number,
        transmission, fuel_type, seating_capacity
      )
    `)
    .eq('customer_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">My Bookings</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {bookings?.length ?? 0} total bookings
        </p>
      </div>

      {!bookings?.length ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
          <CalendarCheck size={40} className="text-slate-600" />
          <p className="text-slate-400 font-medium">No bookings yet</p>
          <p className="text-slate-500 text-sm">Your rental history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = statusConfig[b.status] ?? statusConfig.pending
            const v = b.vehicles
            return (
              <div key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold">
                        {v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500">{b.booking_number}</p>
                  </div>
                  <p className="text-xl font-bold text-white shrink-0">
                    ${b.total_amount?.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500">Pickup</p>
                    <p className="text-sm text-white mt-0.5">
                      {format(new Date(b.pickup_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Return</p>
                    <p className="text-sm text-white mt-0.5">
                      {format(new Date(b.return_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm text-white mt-0.5">
                      {b.total_days} day{b.total_days > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Daily Rate</p>
                    <p className="text-sm text-white mt-0.5">${b.daily_rate}/day</p>
                  </div>
                  {b.pickup_location && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Pickup Location</p>
                      <p className="text-sm text-white mt-0.5">{b.pickup_location}</p>
                    </div>
                  )}
                  {v && (
                    <div className="col-span-2 sm:col-span-4">
                      <p className="text-xs text-slate-500 mb-1.5">Vehicle Details</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          v.plate_number,
                          v.transmission,
                          v.fuel_type,
                          v.seating_capacity ? `${v.seating_capacity} seats` : null,
                        ].filter(Boolean).map((detail) => (
                          <span key={detail}
                            className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 capitalize">
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {b.notes && (
                    <div className="col-span-2 sm:col-span-4">
                      <p className="text-xs text-slate-500">Notes</p>
                      <p className="text-sm text-slate-400 mt-0.5">{b.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}