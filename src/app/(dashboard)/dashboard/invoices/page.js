'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { createInvoice, updateInvoiceStatus, deleteInvoice } from '@/app/actions/invoices'
import { recordPayment } from '@/app/actions/payments'
import InvoiceForm from '@/components/finance/InvoiceForm'
import PaymentForm from '@/components/finance/PaymentForm'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Receipt, MoreVertical,
  CreditCard, CheckCircle, Trash2, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusConfig = {
  pending:  { label: 'Pending',  class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  partial:  { label: 'Partial',  class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid:     { label: 'Paid',     class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  overdue:  { label: 'Overdue',  class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  refunded: { label: 'Refunded', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('invoices')
      .select(`
        id, invoice_number, status, subtotal, total_amount,
        amount_paid, balance_due, due_date, created_at, notes,
        tax_rate, tax_amount, discount_amount, late_fee,
        damage_fee, fuel_charge, driver_charge,
        profiles!invoices_customer_id_fkey(full_name, phone),
        bookings!invoices_booking_id_fkey(booking_number),
        customer_id
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search) query = query.ilike('invoice_number', `%${search}%`)

    const { data } = await query
    setInvoices(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleCreate = async (formData) => {
    setSubmitting(true)
    const result = await createInvoice(formData)
    setSubmitting(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Invoice created!')
    setShowForm(false)
    fetchInvoices()
  }

  const handlePayment = async (formData) => {
    setSubmitting(true)
    const result = await recordPayment(formData)
    setSubmitting(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Payment recorded!')
    setShowPayment(false)
    setSelected(null)
    fetchInvoices()
  }

  const handleMarkPaid = async (id) => {
    const result = await updateInvoiceStatus(id, 'paid')
    if (result.error) { toast.error(result.error); return }
    toast.success('Invoice marked as paid')
    fetchInvoices()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    const result = await deleteInvoice(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Invoice deleted')
    fetchInvoices()
  }

  const openPayment = (invoice) => { setSelected(invoice); setShowPayment(true) }
  const openDetail = (invoice) => { setSelected(invoice); setShowDetail(true) }

  const totals = {
    total: invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0),
    paid: invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0),
    outstanding: invoices.reduce((s, i) => s + (i.balance_due ?? 0), 0),
    count: invoices.length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400 text-sm mt-0.5">{totals.count} total invoices</p>
        </div>
        <Button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> New Invoice
        </Button>
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-white">${totals.total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-400">${totals.paid.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-400">${totals.outstanding.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by invoice number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'partial', 'paid', 'overdue'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Receipt size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No invoices found</p>
            <Button onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
              <Plus size={15} className="mr-2" /> Create First Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Invoice #', 'Customer', 'Booking', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 sm:px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map((inv) => {
                  const status = statusConfig[inv.status] ?? statusConfig.pending
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-mono text-xs text-white whitespace-nowrap">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                        {inv.profiles?.full_name ?? '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {inv.bookings?.booking_number ?? '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-white font-semibold whitespace-nowrap">
                        ${inv.total_amount?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-green-400 whitespace-nowrap">
                        ${inv.amount_paid?.toFixed(2)}
                      </td>
                      <td className={`py-3 px-3 sm:px-4 font-semibold whitespace-nowrap ${inv.balance_due > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ${inv.balance_due?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                        {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
                            <DropdownMenuItem onClick={() => openDetail(inv)}
                              className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer">
                              <Eye size={13} /> View Details
                            </DropdownMenuItem>
                            {inv.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => openPayment(inv)}
                                className="text-green-400 hover:text-green-300 text-sm gap-2 cursor-pointer">
                                <CreditCard size={13} /> Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleMarkPaid(inv.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm gap-2 cursor-pointer">
                              <CheckCircle size={13} /> Mark Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(inv.id)}
                              className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer">
                              <Trash2 size={13} /> Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/api/invoice/${inv.id}/pdf`, '_blank')}
                              className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer"
                            >
                              <Download size={13} /> Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Create New Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm onSubmit={handleCreate} loading={submitting} />
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Record Payment</DialogTitle>
          </DialogHeader>
          {selected && <PaymentForm invoice={selected} onSubmit={handlePayment} loading={submitting} />}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Invoice Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-mono text-blue-400 font-semibold">{selected.invoice_number}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selected.status]?.class}`}>
                  {statusConfig[selected.status]?.label}
                </span>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Customer', selected.profiles?.full_name],
                  ['Booking', selected.bookings?.booking_number],
                  ['Subtotal', `$${selected.subtotal?.toFixed(2)}`],
                  ['Tax', `$${selected.tax_amount?.toFixed(2)}`],
                  ['Discount', `$${selected.discount_amount?.toFixed(2)}`],
                  ['Late Fee', `$${selected.late_fee?.toFixed(2)}`],
                  ['Damage Fee', `$${selected.damage_fee?.toFixed(2)}`],
                  ['Fuel Charge', `$${selected.fuel_charge?.toFixed(2)}`],
                  ['Driver Charge', `$${selected.driver_charge?.toFixed(2)}`],
                  ['Due Date', selected.due_date ? format(new Date(selected.due_date), 'dd MMM yyyy') : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-slate-300">
                    <span className="text-slate-500">{label}</span>
                    <span>{value ?? '—'}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-2 text-base">
                  <span>Total</span><span>${selected.total_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Paid</span><span>${selected.amount_paid?.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold text-base ${selected.balance_due > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  <span>Balance Due</span><span>${selected.balance_due?.toFixed(2)}</span>
                </div>
              </div>
              {selected.notes && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-300">{selected.notes}</p>
                </div>
              )}
              {selected.status !== 'paid' && (
                <Button onClick={() => { setShowDetail(false); openPayment(selected) }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CreditCard size={15} className="mr-2" /> Record Payment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}