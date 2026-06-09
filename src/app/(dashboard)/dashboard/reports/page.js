'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie,
  Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign,
  Car, CalendarCheck, Receipt,
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function KPICard({ title, value, sub, icon: Icon, color }) {
  const colors = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: ${Number(p.value).toFixed(2)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [data, setData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalBookings: 0,
    activeVehicles: 0,
    outstanding: 0,
    totalVehicles: 0,
    monthlyRevenue: [],
    expenseByCategory: [],
    bookingsByStatus: [],
    recentTransactions: [],
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6')

  const supabase = createClient()

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const months = parseInt(period)
      const startDate = startOfMonth(subMonths(new Date(), months - 1))

      const [
        { data: invoices },
        { data: expenses },
        { data: bookings },
        { data: vehicles },
        { data: payments },
      ] = await Promise.all([
        supabase.from('invoices').select('total_amount, amount_paid, balance_due, status, created_at').eq('is_deleted', false),
        supabase.from('expenses').select('amount, category, expense_date').eq('is_deleted', false),
        supabase.from('bookings').select('id, status, total_amount, created_at').eq('is_deleted', false),
        supabase.from('vehicles').select('id, status').eq('is_deleted', false),
        supabase.from('payments').select('amount, method, created_at').gte('created_at', startDate.toISOString()),
      ])

      const totalRevenue = (invoices ?? []).reduce((s, i) => s + (i.total_amount ?? 0), 0)
      const totalExpenses = (expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
      const outstanding = (invoices ?? []).reduce((s, i) => s + (i.balance_due ?? 0), 0)
      const activeVehicles = (vehicles ?? []).filter((v) => v.status === 'rented').length
      const totalVehicles = (vehicles ?? []).length

      // Monthly revenue — last N months
      const monthlyRevenue = Array.from({ length: months }, (_, i) => {
        const date = subMonths(new Date(), months - 1 - i)
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)
        const revenue = (invoices ?? [])
          .filter((inv) => {
            const d = new Date(inv.created_at)
            return d >= monthStart && d <= monthEnd
          })
          .reduce((s, inv) => s + (inv.total_amount ?? 0), 0)
        const expense = (expenses ?? [])
          .filter((exp) => {
            const d = new Date(exp.expense_date)
            return d >= monthStart && d <= monthEnd
          })
          .reduce((s, exp) => s + (exp.amount ?? 0), 0)
        return {
          month: format(date, 'MMM yy'),
          Revenue: parseFloat(revenue.toFixed(2)),
          Expenses: parseFloat(expense.toFixed(2)),
          Profit: parseFloat((revenue - expense).toFixed(2)),
        }
      })

      // Expenses by category
      const catMap = {}
      ;(expenses ?? []).forEach((e) => {
        catMap[e.category] = (catMap[e.category] ?? 0) + (e.amount ?? 0)
      })
      const expenseByCategory = Object.entries(catMap).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))

      // Bookings by status
      const statusMap = {}
      ;(bookings ?? []).forEach((b) => {
        statusMap[b.status] = (statusMap[b.status] ?? 0) + 1
      })
      const bookingsByStatus = Object.entries(statusMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))

      setData({
        totalRevenue,
        totalExpenses,
        totalBookings: (bookings ?? []).length,
        activeVehicles,
        outstanding,
        totalVehicles,
        monthlyRevenue,
        expenseByCategory,
        bookingsByStatus,
      })
      setLoading(false)
    }
    fetchAll()
  }, [period])

  const profit = data.totalRevenue - data.totalExpenses
  const profitMargin = data.totalRevenue > 0
    ? ((profit / data.totalRevenue) * 100).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Reports & Analytics</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Financial overview and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: '3M', value: '3' },
            { label: '6M', value: '6' },
            { label: '12M', value: '12' },
          ].map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                period === p.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="All invoiced amounts"
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Total Expenses"
          value={`$${data.totalExpenses.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="All recorded expenses"
          icon={TrendingDown}
          color="red"
        />
        <KPICard
          title="Net Profit"
          value={`$${profit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${profitMargin}% margin`}
          icon={TrendingUp}
          color={profit >= 0 ? 'blue' : 'red'}
        />
        <KPICard
          title="Outstanding"
          value={`$${data.outstanding.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Unpaid balances"
          icon={Receipt}
          color="amber"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings', value: data.totalBookings, color: 'text-white', icon: CalendarCheck },
          { label: 'Active Rentals', value: data.activeVehicles, color: 'text-green-400', icon: Car },
          { label: 'Fleet Size', value: data.totalVehicles, color: 'text-blue-400', icon: Car },
          { label: 'Profit Margin', value: `${profitMargin}%`, color: profit >= 0 ? 'text-green-400' : 'text-red-400', icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Revenue vs Expenses — Last {period} Months
        </h2>
        {data.monthlyRevenue.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyRevenue} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Profit trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Profit Trend
        </h2>
        {data.monthlyRevenue.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Profit" stroke="#10b981"
                strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Expense breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Expenses by Category</h2>
          {data.expenseByCategory.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No expense data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.expenseByCategory} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {data.expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bookings by status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Bookings by Status</h2>
          {data.bookingsByStatus.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.bookingsByStatus} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {data.bookingsByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Profit/Loss Summary table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Monthly Profit / Loss Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['Month', 'Revenue', 'Expenses', 'Net Profit', 'Margin'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.monthlyRevenue.map((row) => {
                const margin = row.Revenue > 0
                  ? ((row.Profit / row.Revenue) * 100).toFixed(1)
                  : '0.0'
                return (
                  <tr key={row.month} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{row.month}</td>
                    <td className="py-3 px-4 text-green-400">${row.Revenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-red-400">${row.Expenses.toFixed(2)}</td>
                    <td className={`py-3 px-4 font-semibold ${row.Profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      ${row.Profit.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 ${parseFloat(margin) >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                      {margin}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}