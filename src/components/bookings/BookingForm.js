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
import { Loader2, Car, User, CalendarCheck } from 'lucide-react'

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function BookingForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    customer_id: '',
    vehicle_id: '',
    pickup_date: '',
    return_date: '',
    pickup_location: '',
    dropoff_location: '',
    discount_amount: '0',
    tax_rate: '0',
    notes: '',
  })
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [summary, setSummary] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [{ data: c }, { data: v }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, phone').eq('role', 'customer').eq('status', 'active'),
        supabase.from('vehicles').select('id, make, model, year, plate_number, daily_rate').eq('status', 'available').eq('is_deleted', false),
      ])
      setCustomers(c ?? [])
      setVehicles(v ?? [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (form.pickup_date && form.return_date && form.vehicle_id) {
      const pickup = new Date(form.pickup_date)
      const returnD = new Date(form.return_date)
      const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24))
      const vehicle = vehicles.find((v) => v.id === form.vehicle_id)
      if (days > 0 && vehicle) {
        const subtotal = days * vehicle.daily_rate
        const tax = subtotal * ((parseFloat(form.tax_rate) || 0) / 100)
        const discount = parseFloat(form.discount_amount) || 0
        setSummary({
          days,
          dailyRate: vehicle.daily_rate,
          subtotal,
          tax,
          discount,
          total: subtotal + tax - discount,
        })
      } else {
        setSummary(null)
      }
    }
  }, [form.pickup_date, form.return_date, form.vehicle_id, form.tax_rate, form.discount_amount])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const handleChange = (e) => set(e.target.name, e.target.value)
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form) }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Customer & Vehicle */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <User size={12} /> Customer & Vehicle
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Customer *</Label>
            <Select value={form.customer_id} onValueChange={(v) => set('customer_id', v)} required>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                {customers.length === 0 && (
                  <SelectItem value="none" disabled className="text-slate-400">
                    No active customers found
                  </SelectItem>
                )}
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-white">
                    {c.full_name} {c.phone ? `— ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Vehicle *</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => set('vehicle_id', v)} required>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                {vehicles.length === 0 && (
                  <SelectItem value="none" disabled className="text-slate-400">
                    No available vehicles
                  </SelectItem>
                )}
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-white">
                    {v.year} {v.make} {v.model} — {v.plate_number} (${v.daily_rate}/day)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarCheck size={12} /> Rental Dates
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Pickup Date *</Label>
            <Input name="pickup_date" type="datetime-local" value={form.pickup_date}
              onChange={handleChange} min={today} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Return Date *</Label>
            <Input name="return_date" type="datetime-local" value={form.return_date}
              onChange={handleChange} min={form.pickup_date || today} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Pickup Location</Label>
            <Input name="pickup_location" value={form.pickup_location}
              onChange={handleChange} placeholder="e.g. Main Office" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Drop-off Location</Label>
            <Input name="dropoff_location" value={form.dropoff_location}
              onChange={handleChange} placeholder="e.g. Airport" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Pricing adjustments */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Pricing Adjustments
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Tax Rate (%)</Label>
            <Input name="tax_rate" type="number" value={form.tax_rate}
              onChange={handleChange} placeholder="0" min="0" max="100"
              step="0.1" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Discount ($)</Label>
            <Input name="discount_amount" type="number" value={form.discount_amount}
              onChange={handleChange} placeholder="0.00" min="0"
              step="0.01" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Booking summary */}
      {summary && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Booking Summary
          </p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>{summary.days} day{summary.days > 1 ? 's' : ''} × ${summary.dailyRate}/day</span>
              <span>${summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({form.tax_rate}%)</span>
                <span>+${summary.tax.toFixed(2)}</span>
              </div>
            )}
            {summary.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-${summary.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-700 text-base">
              <span>Total</span>
              <span>${summary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className={labelClass}>Notes</Label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Any additional notes..."
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <Button type="submit" disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 px-8">
        {loading
          ? <><Loader2 size={15} className="animate-spin mr-2" />Creating Booking...</>
          : 'Create Booking'
        }
      </Button>
    </form>
  )
}