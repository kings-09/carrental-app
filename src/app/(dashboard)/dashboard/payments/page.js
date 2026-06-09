'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, CreditCard, Banknote, Smartphone, Building } from 'lucide-react'
import { format } from 'date-fns'

const methodConfig = {
  cash:          { label: 'Cash',          icon: Banknote,    class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  card:          { label: 'Card',          icon: CreditCard,  class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  bank_transfer: { label: 'Bank Transfer', icon: Building,    class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  mobile_money:  { label: 'Mobile Money',  icon: Smartphone,  class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const supabase = createClient()

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('payments')
      .select(`
        id, amount, method, reference, notes, created_at,
        invoices!payments_invoice_id_fkey(invoice_number, total_amount),
        profiles!payments_customer_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (methodFilter !== 'all') query = query.eq('method', methodFilter)
    if (search) query = query.ilike('reference', `%${search}%`)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await query
    setPayments(data ?? [])
    setLoading(false)
  }, [search, methodFilter, dateFrom, dateTo])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const totals = {
    total: payments.reduce((s, p) => s + (p.amount ?? 0), 0),
    cash: payments.filter((p) => p.method === 'cash').reduce((s, p) => s + (p.amount ?? 0), 0),
    card: payments.filter((p) => p.method === 'card').reduce((s, p) => s + (p.amount ?? 0), 0),
    bank_transfer: payments.filter((p) => p.method === 'bank_transfer').reduce((s, p) => s + (p.amount ?? 0), 0),
    mobile_money: payments.filter((p) => p.method === 'mobile_money').reduce((s, p) => s + (p.amount ?? 0), 0),
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {payments.length} payment records
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-slate-500 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-400">
            ${totals.total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">{payments.length} transactions</p>
        </div>
        {[
          { label: 'Cash', key: 'cash', icon: Banknote, color: 'text-green-400' },
          { label: 'Card', key: 'card', icon: CreditCard, color: 'text-blue-400' },
          { label: 'Mobile Money', key: 'mobile_money', icon: Smartphone, color: 'text-amber-400' },
        ].map((m) => (
          <div key={m.key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1">
              <m.icon size={14} className={m.color} />
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
            <p className={`text-xl font-bold ${m.color}`}>
              ${totals[m.key].toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Method breakdown bar */}
      {totals.total > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Payment Method Breakdown
          </p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {Object.entries({
              cash: totals.cash,
              card: totals.card,
              bank_transfer: totals.bank_transfer,
              mobile_money: totals.mobile_money,
            }).map(([key, val]) => {
              const pct = totals.total > 0 ? (val / totals.total) * 100 : 0
              if (pct === 0) return null
              const colors = {
                cash: 'bg-green-500',
                card: 'bg-blue-500',
                bank_transfer: 'bg-purple-500',
                mobile_money: 'bg-amber-500',
              }
              return (
                <div
                  key={key}
                  className={`${colors[key]} h-full rounded-sm transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${methodConfig[key].label}: $${val.toFixed(2)}`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {Object.entries(methodConfig).map(([key, cfg]) => {
              const val = totals[key] ?? 0
              if (val === 0) return null
              const pct = totals.total > 0 ? ((val / totals.total) * 100).toFixed(1) : '0'
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cfg.class}`}>
                    {cfg.label}
                  </span>
                  <span className="text-white font-medium">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10 w-full sm:w-44">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Methods</SelectItem>
            <SelectItem value="cash" className="text-white">Cash</SelectItem>
            <SelectItem value="card" className="text-white">Card</SelectItem>
            <SelectItem value="bank_transfer" className="text-white">Bank Transfer</SelectItem>
            <SelectItem value="mobile_money" className="text-white">Mobile Money</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-10 w-full sm:w-40"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-10 w-full sm:w-40"
          placeholder="To"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No payments found</p>
            <p className="text-slate-500 text-sm">
              Payments appear here when recorded against invoices
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Date', 'Customer', 'Invoice', 'Method', 'Reference', 'Amount', 'Notes'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 sm:px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payments.map((p) => {
                  const method = methodConfig[p.method] ?? methodConfig.cash
                  const MethodIcon = method.icon
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                        {format(new Date(p.created_at), 'dd MMM yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                        <p className="text-sm">{p.profiles?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{p.profiles?.phone ?? ''}</p>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono text-xs text-blue-400 whitespace-nowrap">
                        {p.invoices?.invoice_number ?? '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${method.class}`}>
                          <MethodIcon size={11} />
                          {method.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-400 font-mono text-xs">
                        {p.reference ?? '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-green-400 font-bold whitespace-nowrap">
                        +${p.amount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs max-w-xs truncate">
                        {p.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t border-slate-700 bg-slate-800/60">
                  <td colSpan={5} className="py-3 px-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Total ({payments.length} payments)
                  </td>
                  <td className="py-3 px-4 text-green-400 font-bold text-sm whitespace-nowrap">
                    +${totals.total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}