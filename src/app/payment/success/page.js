'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { CheckCircle, Receipt, ArrowRight, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('invoice_id')
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!invoiceId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('invoices')
      .select('invoice_number, total_amount, amount_paid, balance_due, status')
      .eq('id', invoiceId)
      .single()
      .then(({ data }) => { setInvoice(data); setLoading(false) })
  }, [invoiceId])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payment Successful!</h1>
          <p className="text-slate-400 text-sm">
            Your payment has been processed. Thank you for using CarRental.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : invoice ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-blue-400" />
              <p className="text-sm font-semibold text-white">Payment Receipt</p>
            </div>
            {[
              { label: 'Invoice', value: invoice.invoice_number },
              { label: 'Amount Paid', value: `$${invoice.amount_paid?.toFixed(2)}` },
              { label: 'Balance Due', value: `$${invoice.balance_due?.toFixed(2)}` },
              { label: 'Status', value: invoice.status },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className={`font-medium capitalize ${
                  label === 'Status' && value === 'paid' ? 'text-green-400' :
                  label === 'Balance Due' && invoice.balance_due > 0 ? 'text-amber-400' :
                  'text-white'
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/my-invoices"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm">
            View My Invoices <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/customer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}