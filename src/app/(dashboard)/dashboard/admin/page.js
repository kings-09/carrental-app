import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import {
  Car, Users, CalendarCheck, Receipt,
  TrendingUp, TrendingDown, Clock, AlertCircle,
} from 'lucide-react'

// Auto-check for overdue bookings on dashboard load
fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/check-overdue`)
  .catch(() => {}) 
  
async function getStats(supabase) {
  const [vehicles, customers, bookings, invoices] = await Promise.all([
    supabase.from('vehicles').select('id, status', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
    supabase.from('bookings').select('id, status', { count: 'exact' }),
    supabase.from('invoices').select('id, status, total_amount, balance_due', { count: 'exact' }),
  ])

  const activeBookings = bookings.data?.filter((b) => b.status === 'active').length ?? 0
  const pendingBookings = bookings.data?.filter((b) => b.status === 'pending').length ?? 0
  const availableVehicles = vehicles.data?.filter((v) => v.status === 'available').length ?? 0
  const totalRevenue = invoices.data?.reduce((sum, i) => sum + (i.total_amount ?? 0), 0) ?? 0
  const outstanding = invoices.data?.reduce((sum, i) => sum + (i.balance_due ?? 0), 0) ?? 0

  return {
    totalVehicles: vehicles.count ?? 0,
    availableVehicles,
    totalCustomers: customers.count ?? 0,
    totalBookings: bookings.count ?? 0,
    activeBookings,
    pendingBookings,
    totalRevenue,
    outstanding,
  }
}

function KPICard({ title, value, sub, icon: Icon, color, trend }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs sm:text-sm font-medium">{title}</p>
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <p className={`text-xs font-medium ${trend.up ? 'text-green-400' : 'text-slate-500'}`}>
          {trend.label}
        </p>
      )}
    </div>
  )
}

function RecentBookingsTable({ bookings }) {
  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  if (!bookings?.length) {
    return (
      <div className="text-center py-10 text-slate-500 text-sm">
        No bookings yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Booking #</th>
            <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Customer</th>
            <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Vehicle</th>
            <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
            <th className="text-right py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="py-3 px-2 text-white font-mono text-xs">{b.booking_number}</td>
              <td className="py-3 px-2 text-slate-300 hidden sm:table-cell">
                {b.profiles?.full_name ?? '—'}
              </td>
              <td className="py-3 px-2 text-slate-300 hidden md:table-cell">
                {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '—'}
              </td>
              <td className="py-3 px-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[b.status]}`}>
                  {b.status}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-white font-medium hidden sm:table-cell">
                ${b.total_amount?.toFixed(2) ?? '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getStats(supabase)

  const { data: recentBookings } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, status, total_amount,
      profiles!bookings_customer_id_fkey(full_name),
      vehicles!bookings_vehicle_id_fkey(make, model)
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, balance_due, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's what's happening today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total Vehicles"
          value={stats.totalVehicles}
          sub={`${stats.availableVehicles} available`}
          icon={Car}
          color="blue"
        />
        <KPICard
          title="Customers"
          value={stats.totalCustomers}
          sub="registered accounts"
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Active Rentals"
          value={stats.activeBookings}
          sub={`${stats.pendingBookings} pending approval`}
          icon={CalendarCheck}
          color="green"
        />
        <KPICard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`$${stats.outstanding.toFixed(2)} outstanding`}
          icon={Receipt}
          color="amber"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Available</p>
            <p className="text-lg font-bold text-white">{stats.availableVehicles}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <CalendarCheck size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Bookings</p>
            <p className="text-lg font-bold text-white">{stats.totalBookings}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Clock size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-lg font-bold text-white">{stats.pendingBookings}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="text-lg font-bold text-white">
              ${stats.outstanding.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Bookings</h2>
            <a href="/dashboard/bookings" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </a>
          </div>
          <div className="px-2 sm:px-3 py-2">
            <RecentBookingsTable bookings={recentBookings} />
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Invoices</h2>
            <a href="/dashboard/invoices" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </a>
          </div>
          <div className="px-2 sm:px-3 py-2">
            {!recentInvoices?.length ? (
              <p className="text-center py-10 text-slate-500 text-sm">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Invoice #</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-2 text-white font-mono text-xs">{inv.invoice_number}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                            inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            inv.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            inv.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-white font-medium">
                          ${inv.total_amount?.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-400 hidden sm:table-cell">
                          ${inv.balance_due?.toFixed(2) ?? '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}