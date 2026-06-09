import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CalendarCheck, Receipt, CreditCard, Clock, Car, ArrowRight, } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

const statusConfig = {
  pending:   { label: 'Pending',   class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  active:    { label: 'Active',    class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  completed: { label: 'Completed', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  overdue:   { label: 'Overdue',   class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const invoiceStatusConfig = {
  pending:  { label: 'Pending',  class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  partial:  { label: 'Partial',  class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid:     { label: 'Paid',     class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  overdue:  { label: 'Overdue',  class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [{ data: bookings }, { data: invoices }, { data: featuredVehicles }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, booking_number, status, pickup_date,
        return_date, total_days, total_amount,
        vehicles!bookings_vehicle_id_fkey(make, model, plate_number)
      `)
      .eq('customer_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount, balance_due, due_date')
      .eq('customer_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('vehicles')
      .select('id, make, model, year, daily_rate, category, transmission, fuel_type, seating_capacity, vehicle_images(url, is_primary)')
      .eq('status', 'available')
      .eq('is_deleted', false)
      .limit(4),
  ])

  const stats = {
    totalBookings: bookings?.length ?? 0,
    activeBooking: bookings?.find((b) => b.status === 'active'),
    totalSpent: invoices?.reduce((s, i) => s + (i.total_amount ?? 0), 0) ?? 0,
    outstanding: invoices?.reduce((s, i) => s + (i.balance_due ?? 0), 0) ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/10 border border-blue-600/20 rounded-xl p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {stats.activeBooking
            ? `You have an active rental — ${stats.activeBooking.vehicles?.make} ${stats.activeBooking.vehicles?.model} until ${format(new Date(stats.activeBooking.return_date), 'dd MMM yyyy')}`
            : 'You have no active rentals. Browse our fleet below to get started.'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: bookings?.length ?? 0, icon: CalendarCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Active Rental', value: stats.activeBooking ? '1 Active' : 'None', icon: Clock, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Balance Due', value: `$${stats.outstanding.toFixed(2)}`, icon: Receipt, color: stats.outstanding > 0 ? 'text-red-400' : 'text-green-400', bg: stats.outstanding > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20' },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{card.label}</p>
              <div className={`p-1.5 rounded-lg border ${card.bg}`}>
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Account status alert */}
      {profile?.status !== 'active' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium text-sm">Account not fully activated</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Your account status is <span className="capitalize font-medium text-amber-300">{profile?.status}</span>.
              Complete your profile and take your KYC photo to get activated.
            </p>
            <Link href="/dashboard/profile"
              className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
              Complete your profile →
            </Link>
          </div>
        </div>
      )}

      {/* Browse available cars */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Available Vehicles</h2>
          </div>
          <Link href="/dashboard/browse"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-4">
          {!featuredVehicles?.length ? (
            <p className="text-slate-400 text-sm text-center py-6">
              No vehicles available right now. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredVehicles.map((v) => {
                const image = v.vehicle_images?.find((i) => i.is_primary)?.url
                  ?? v.vehicle_images?.[0]?.url
                return (
                  <Link key={v.id} href={`/dashboard/browse/${v.id}`}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                    <div className="h-28 bg-slate-700 flex items-center justify-center overflow-hidden">
                      {image ? (
                        <img src={image} alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Car size={32} className="text-slate-500" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-xs font-semibold group-hover:text-blue-400 transition-colors">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-slate-400 text-xs capitalize mt-0.5">
                        {v.transmission} · {v.seating_capacity} seats
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white font-bold text-sm">${v.daily_rate}</span>
                        <span className="text-xs text-slate-400">/day</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings & invoices */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">My Bookings</h2>
            <Link href="/dashboard/my-bookings"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2 sm:p-3">
            {!bookings?.length ? (
              <div className="text-center py-8">
                <CalendarCheck size={28} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No bookings yet</p>
                <Link href="/dashboard/browse"
                  className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                  Browse vehicles to get started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => {
                  const status = statusConfig[b.status] ?? statusConfig.pending
                  return (
                    <div key={b.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-medium">
                            {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '—'}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{b.booking_number}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(b.pickup_date), 'dd MMM')} → {format(new Date(b.return_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <p className="text-white font-semibold text-sm shrink-0">
                        ${b.total_amount?.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">My Invoices</h2>
            <Link href="/dashboard/my-invoices"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="p-2 sm:p-3">
            {!invoices?.length ? (
              <div className="text-center py-8">
                <Receipt size={28} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => {
                  const status = invoiceStatusConfig[inv.status] ?? invoiceStatusConfig.pending
                  return (
                    <div key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-mono">{inv.invoice_number}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                            {status.label}
                          </span>
                        </div>
                        {inv.due_date && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Due: {format(new Date(inv.due_date), 'dd MMM yyyy')}
                          </p>
                        )}
                        {inv.balance_due > 0 && (
                          <p className="text-xs text-red-400 mt-0.5">
                            Balance: ${inv.balance_due?.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm shrink-0">
                        ${inv.total_amount?.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loyalty points */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Loyalty Points</p>
          <p className="text-3xl font-bold text-white mt-1">{profile?.loyalty_points ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Points earned from completed rentals</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Equivalent value</p>
          <p className="text-xl font-bold text-purple-400 mt-0.5">
            ${((profile?.loyalty_points ?? 0) * 0.01).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}