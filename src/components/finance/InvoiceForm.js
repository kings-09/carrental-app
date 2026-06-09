'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
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

export default function InvoiceForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    customer_id: '',
    booking_id: '',
    subtotal: '',
    tax_rate: '0',
    discount_amount: '0',
    late_fee: '0',
    damage_fee: '0',
    fuel_charge: '0',
    driver_charge: '0',
    amount_paid: '0',
    due_date: '',
    notes: '',
  })
  const [customers, setCustomers] = useState([])
  const [bookings, setBookings] = useState([])
  const [summary, setSummary] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [{ data: c }, { data: b }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'customer'),
        supabase.from('bookings').select('id, booking_number, total_amount, customer_id').in('status', ['confirmed', 'active', 'completed']),
      ])
      setCustomers(c ?? [])
      setBookings(b ?? [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    const subtotal = parseFloat(form.subtotal) || 0
    const tax = subtotal * ((parseFloat(form.tax_rate) || 0) / 100)
    const discount = parseFloat(form.discount_amount) || 0
    const lateFee = parseFloat(form.late_fee) || 0
    const damageFee = parseFloat(form.damage_fee) || 0
    const fuelCharge = parseFloat(form.fuel_charge) || 0
    const driverCharge = parseFloat(form.driver_charge) || 0
    const total = subtotal + tax - discount + lateFee + damageFee + fuelCharge + driverCharge
    const paid = parseFloat(form.amount_paid) || 0
    setSummary({ subtotal, tax, discount, lateFee, damageFee, fuelCharge, driverCharge, total, paid, balance: total - paid })
  }, [form])

  // Auto-fill subtotal when booking selected
  const handleBookingSelect = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId)
    if (booking) {
      setForm((f) => ({
        ...f,
        booking_id: bookingId,
        customer_id: booking.customer_id,
        subtotal: booking.total_amount?.toString() ?? '',
      }))
    }
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const handleChange = (e) => set(e.target.name, e.target.value)
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form) }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Booking & Customer */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Link to Booking / Customer
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={labelClass}>Booking (optional)</Label>
            <Select value={form.booking_id} onValueChange={handleBookingSelect}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select booking" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                <SelectItem value="none" className="text-slate-400">No booking</SelectItem>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-white">
                    {b.booking_number} — ${b.total_amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Customer *</Label>
            <Select value={form.customer_id} onValueChange={(v) => set('customer_id', v)} required>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-white">
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Base charges */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Charges
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={labelClass}>Subtotal ($) *</Label>
            <Input name="subtotal" type="number" value={form.subtotal}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Tax Rate (%)</Label>
            <Input name="tax_rate" type="number" value={form.tax_rate}
              onChange={handleChange} placeholder="0" step="0.1" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Discount ($)</Label>
            <Input name="discount_amount" type="number" value={form.discount_amount}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Late Fee ($)</Label>
            <Input name="late_fee" type="number" value={form.late_fee}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Damage Fee ($)</Label>
            <Input name="damage_fee" type="number" value={form.damage_fee}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Fuel Charge ($)</Label>
            <Input name="fuel_charge" type="number" value={form.fuel_charge}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Driver Charge ($)</Label>
            <Input name="driver_charge" type="number" value={form.driver_charge}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Amount Paid ($)</Label>
            <Input name="amount_paid" type="number" value={form.amount_paid}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Due Date</Label>
            <Input name="due_date" type="date" value={form.due_date}
              onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Live summary */}
      {summary && summary.total > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Invoice Summary
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span><span>${summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({form.tax_rate}%)</span><span>+${summary.tax.toFixed(2)}</span>
              </div>
            )}
            {summary.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span><span>-${summary.discount.toFixed(2)}</span>
              </div>
            )}
            {summary.lateFee > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Late Fee</span><span>+${summary.lateFee.toFixed(2)}</span>
              </div>
            )}
            {summary.damageFee > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Damage Fee</span><span>+${summary.damageFee.toFixed(2)}</span>
              </div>
            )}
            {summary.fuelCharge > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Fuel Charge</span><span>+${summary.fuelCharge.toFixed(2)}</span>
              </div>
            )}
            {summary.driverCharge > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Driver Charge</span><span>+${summary.driverCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-700 text-base">
              <span>Total</span><span>${summary.total.toFixed(2)}</span>
            </div>
            {summary.paid > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Paid</span><span>-${summary.paid.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between font-bold text-base ${summary.balance <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <span>Balance Due</span>
              <span>${Math.max(0, summary.balance).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className={labelClass}>Notes</Label>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          rows={2} placeholder="Any additional notes..."
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <Button type="submit" disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 px-8">
        {loading
          ? <><Loader2 size={15} className="animate-spin mr-2" />Creating Invoice...</>
          : 'Create Invoice'
        }
      </Button>
    </form>
  )
}