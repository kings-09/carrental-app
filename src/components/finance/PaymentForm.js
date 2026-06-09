'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function PaymentForm({ invoice, onSubmit, loading }) {
  const [form, setForm] = useState({
    amount: invoice?.balance_due?.toString() ?? '',
    method: 'cash',
    reference: '',
    notes: '',
  })

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Invoice summary */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>Invoice</span>
          <span className="font-mono">{invoice?.invoice_number}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Total Amount</span>
          <span className="font-semibold text-white">${invoice?.total_amount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Already Paid</span>
          <span className="text-green-400">${invoice?.amount_paid?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-slate-700 pt-2 text-red-400">
          <span>Balance Due</span>
          <span>${invoice?.balance_due?.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className={labelClass}>Amount ($) *</Label>
          <Input name="amount" type="number" value={form.amount}
            onChange={handleChange} placeholder="0.00" step="0.01"
            min="0" max={invoice?.balance_due} required className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Payment Method *</Label>
          <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="cash" className="text-white">Cash</SelectItem>
              <SelectItem value="card" className="text-white">Card</SelectItem>
              <SelectItem value="bank_transfer" className="text-white">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money" className="text-white">Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className={labelClass}>Reference / Receipt No.</Label>
          <Input name="reference" value={form.reference}
            onChange={handleChange} placeholder="e.g. TXN123456" className={inputClass} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className={labelClass}>Notes</Label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            rows={2} placeholder="Any notes about this payment..."
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white h-10">
        {loading
          ? <><Loader2 size={15} className="animate-spin mr-2" />Recording...</>
          : 'Record Payment'
        }
      </Button>
    </form>
  )
}