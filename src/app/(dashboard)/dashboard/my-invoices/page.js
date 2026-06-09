'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Receipt, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import PaynowModal from '@/components/finance/PaynowModal'
import { format } from 'date-fns'
import { toast } from 'sonner'

const statusConfig = {
  pending:  { label: 'Pending',  class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  partial:  { label: 'Partial',  class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid:     { label: 'Paid',     class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  overdue:  { label: 'Overdue',  class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  refunded: { label: 'Refunded', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPaynow, setShowPaynow] = useState(false)
  const supabase = createClient()

  const fetchInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, status, subtotal, total_amount,
        amount_paid, balance_due, due_date, created_at,
        tax_amount, discount_amount, late_fee, damage_fee,
        fuel_charge, driver_charge, notes,
        bookings!invoices_booking_id_fkey(booking_number)
      `)
      .eq('customer_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchInvoices() }, [])

  const openPaynow = (invoice) => {
    setSelectedInvoice(invoice)
    setShowPaynow(true)
  }

  const handlePaymentSuccess = () => {
    toast.success('Payment confirmed! Your invoice has been updated.')
    setShowPaynow(false)
    setSelectedInvoice(null)
    fetchInvoices()
  }

  const totals = {
    total: invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0),
    paid: invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0),
    outstanding: invoices.reduce((s, i) => s + (i.balance_due ?? 0), 0),
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">My Invoices</h1>
        <p className="text-slate-400 text-sm mt-0.5">{invoices.length} total invoices</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Billed</p>
          <p className="text-2xl font-bold text-white">${totals.total.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-400">${totals.paid.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${totals.outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
            ${totals.outstanding.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
          <Receipt size={40} className="text-slate-600" />
          <p className="text-slate-400 font-medium">No invoices yet</p>
          <p className="text-slate-500 text-sm">Your invoices will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const status = statusConfig[inv.status] ?? statusConfig.pending
            return (
              <div key={inv.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-mono font-semibold">
                        {inv.invoice_number}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    {inv.bookings?.booking_number && (
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        Booking: {inv.bookings.booking_number}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued: {format(new Date(inv.created_at), 'dd MMM yyyy')}
                      {inv.due_date && ` · Due: ${format(new Date(inv.due_date), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right space-y-1">
                    <p className="text-xl font-bold text-white">
                      ${inv.total_amount?.toFixed(2)}
                    </p>
                    {inv.balance_due > 0 && (
                      <p className="text-xs text-red-400">
                        Balance: ${inv.balance_due?.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Charge breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
                  {[
                    { label: 'Subtotal', value: inv.subtotal },
                    { label: 'Tax', value: inv.tax_amount },
                    { label: 'Discount', value: inv.discount_amount, negative: true },
                    { label: 'Late Fee', value: inv.late_fee },
                    { label: 'Damage Fee', value: inv.damage_fee },
                    { label: 'Fuel Charge', value: inv.fuel_charge },
                    { label: 'Driver Charge', value: inv.driver_charge },
                    { label: 'Amount Paid', value: inv.amount_paid, positive: true },
                  ].filter((r) => r.value && r.value > 0).map((row) => (
                    <div key={row.label}>
                      <p className="text-xs text-slate-500">{row.label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${
                        row.positive ? 'text-green-400' :
                        row.negative ? 'text-green-400' : 'text-white'
                      }`}>
                        {row.negative || row.positive ? '-' : ''}${row.value?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pay button */}
                {inv.balance_due > 0 && inv.status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <Button
                      onClick={() => openPaynow(inv)}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-medium"
                    >
                      <Receipt size={14} className="mr-2" />
                      Pay ${inv.balance_due?.toFixed(2)} via EcoCash / Paynow
                    </Button>
                    <Button
                      onClick={() => window.open(`/api/invoice/${inv.id}/pdf`, '_blank')}
                      className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white h-10 text-sm font-medium border border-slate-600"
                    >
                      <Download size={14} className="mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}

                {inv.notes && !inv.notes.startsWith('Paynow poll:') && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
                    Note: {inv.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paynow Modal */}
      {selectedInvoice && (
        <PaynowModal
          invoice={selectedInvoice}
          open={showPaynow}
          onClose={() => { setShowPaynow(false); setSelectedInvoice(null) }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}