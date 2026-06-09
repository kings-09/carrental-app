'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { createBooking } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Calendar, AlertCircle, CheckCircle,
  Loader2, Lock, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function VehicleBookingPanel({ vehicle, user, profile }) {
  const router = useRouter()
  const [form, setForm] = useState({
    pickup_date: '',
    return_date: '',
    pickup_location: '',
    dropoff_location: '',
    notes: '',
  })
  const [summary, setSummary] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    if (form.pickup_date && form.return_date) {
      const pickup = new Date(form.pickup_date)
      const returnD = new Date(form.return_date)
      const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24))
      if (days > 0) {
        const subtotal = days * vehicle.daily_rate
        setSummary({ days, subtotal, total: subtotal })
        checkAvailability()
      } else {
        setSummary(null)
        setAvailable(null)
      }
    }
  }, [form.pickup_date, form.return_date])

  const checkAvailability = async () => {
    if (!form.pickup_date || !form.return_date) return
    setChecking(true)
    const { data } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicle.id)
      .in('status', ['confirmed', 'active'])
      .lt('pickup_date', form.return_date)
      .gt('return_date', form.pickup_date)

    setAvailable(data?.length === 0)
    setChecking(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please sign in to make a booking')
      router.push('/login')
      return
    }

    if (profile?.status !== 'active') {
      toast.error('Your account must be activated before booking')
      return
    }

    if (!profile?.licence_verified) {
      toast.error('Please upload and get your driving licence verified first')
      router.push('/dashboard/settings')
      return
    }

    if (!available) {
      toast.error('Vehicle is not available for selected dates')
      return
    }

    setSubmitting(true)
    const result = await createBooking({
      ...form,
      vehicle_id: vehicle.id,
      customer_id: profile.id,
      tax_rate: '0',
      discount_amount: '0',
    })
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Booking created successfully!')
    router.push(`/dashboard/customer`)
  }

  const today = new Date().toISOString().slice(0, 16)
  const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
  const labelClass = 'text-slate-300 text-xs sm:text-sm'

  // Not logged in
  if (!user) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-lg">Book This Vehicle</h2>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center space-y-3">
          <Lock size={24} className="text-blue-400 mx-auto" />
          <p className="text-slate-300 text-sm">Sign in to book this vehicle</p>
          <div className="flex flex-col gap-2">
            <Link href="/login"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors text-center">
              Sign In to Book
            </Link>
            <Link href="/register"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 text-center">
              Create Account
            </Link>
          </div>
        </div>
        {/* Show price preview */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Daily rate</span>
            <span className="text-white font-semibold">${vehicle.daily_rate}/day</span>
          </div>
        </div>
      </div>
    )
  }

  // Logged in but not active
  if (profile?.status !== 'active') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-lg">Book This Vehicle</h2>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <AlertCircle size={20} className="text-amber-400" />
          <p className="text-amber-300 text-sm font-medium">Account not activated</p>
          <p className="text-slate-400 text-xs">
            Your account needs to be activated by an admin before you can make bookings.
            Complete your profile to speed up the process.
          </p>
          <Link href="/dashboard/settings"
            className="inline-block mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors">
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  // Active but licence not verified
  if (!profile?.licence_verified) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-lg">Book This Vehicle</h2>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <Upload size={20} className="text-amber-400" />
          <p className="text-amber-300 text-sm font-medium">Licence verification required</p>
          <p className="text-slate-400 text-xs">
            You need to upload your driving licence and have it verified before
            you can make a booking.
          </p>
          <Link href="/dashboard/profile"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
            Upload Licence
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Book This Vehicle</h2>
        <div className="text-right">
          <p className="text-white font-bold text-xl">${vehicle.daily_rate}</p>
          <p className="text-slate-400 text-xs">per day</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <Label className={labelClass}>Pickup Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.pickup_date}
              onChange={(e) => setForm((f) => ({ ...f, pickup_date: e.target.value }))}
              min={today}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Return Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.return_date}
              onChange={(e) => setForm((f) => ({ ...f, return_date: e.target.value }))}
              min={form.pickup_date || today}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Availability indicator */}
        {checking && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" /> Checking availability...
          </div>
        )}
        {!checking && available === true && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <CheckCircle size={13} /> Vehicle is available for these dates
          </div>
        )}
        {!checking && available === false && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} /> Vehicle is not available for these dates
          </div>
        )}

        {/* Locations */}
        <div className="space-y-1.5">
          <Label className={labelClass}>Pickup Location</Label>
          <Input
            value={form.pickup_location}
            onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))}
            placeholder="e.g. Main Office, Airport"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass}>Drop-off Location</Label>
          <Input
            value={form.dropoff_location}
            onChange={(e) => setForm((f) => ({ ...f, dropoff_location: e.target.value }))}
            placeholder="e.g. Same as pickup"
            className={inputClass}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className={labelClass}>Special Requests</Label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any special requirements..."
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Booking summary */}
        {summary && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Summary
            </p>
            <div className="flex justify-between text-slate-300">
              <span>${vehicle.daily_rate} × {summary.days} day{summary.days > 1 ? 's' : ''}</span>
              <span>${summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-2 text-base">
              <span>Total</span>
              <span>${summary.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || available === false || !summary}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white h-11 font-medium"
        >
          {submitting
            ? <><Loader2 size={15} className="animate-spin mr-2" />Creating Booking...</>
            : <><Calendar size={15} className="mr-2" />Confirm Booking</>
          }
        </Button>

        <p className="text-xs text-slate-500 text-center">
          No payment required now. You'll be invoiced after confirmation.
        </p>
      </form>
    </div>
  )
}