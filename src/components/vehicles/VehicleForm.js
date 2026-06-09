'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const inputClass =
  'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function VehicleForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    make: initial.make ?? '',
    model: initial.model ?? '',
    year: initial.year ?? new Date().getFullYear(),
    plate_number: initial.plate_number ?? '',
    vin: initial.vin ?? '',
    color: initial.color ?? '',
    transmission: initial.transmission ?? 'automatic',
    fuel_type: initial.fuel_type ?? 'petrol',
    seating_capacity: initial.seating_capacity ?? 5,
    daily_rate: initial.daily_rate ?? '',
    weekly_rate: initial.weekly_rate ?? '',
    monthly_rate: initial.monthly_rate ?? '',
    mileage: initial.mileage ?? 0,
    category: initial.category ?? '',
    description: initial.description ?? '',
    insurance_provider: initial.insurance_provider ?? '',
    insurance_expiry: initial.insurance_expiry ?? '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const handleChange = (e) => set(e.target.name, e.target.value)
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form) }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Basic Info */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Basic Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Make *</Label>
            <Input name="make" value={form.make} onChange={handleChange}
              placeholder="Toyota" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Model *</Label>
            <Input name="model" value={form.model} onChange={handleChange}
              placeholder="Camry" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Year *</Label>
            <Input name="year" type="number" value={form.year} onChange={handleChange}
              min="1990" max="2030" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Plate Number *</Label>
            <Input name="plate_number" value={form.plate_number} onChange={handleChange}
              placeholder="ABC 1234" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>VIN</Label>
            <Input name="vin" value={form.vin} onChange={handleChange}
              placeholder="Vehicle ID Number" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Color</Label>
            <Input name="color" value={form.color} onChange={handleChange}
              placeholder="White" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Specs */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Specifications
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Transmission *</Label>
            <Select value={form.transmission} onValueChange={(v) => set('transmission', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="automatic" className="text-white">Automatic</SelectItem>
                <SelectItem value="manual" className="text-white">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Fuel Type *</Label>
            <Select value={form.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="petrol" className="text-white">Petrol</SelectItem>
                <SelectItem value="diesel" className="text-white">Diesel</SelectItem>
                <SelectItem value="electric" className="text-white">Electric</SelectItem>
                <SelectItem value="hybrid" className="text-white">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Seats *</Label>
            <Input name="seating_capacity" type="number" value={form.seating_capacity}
              onChange={handleChange} min="1" max="50" required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Mileage (km)</Label>
            <Input name="mileage" type="number" value={form.mileage}
              onChange={handleChange} min="0" className={inputClass} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={labelClass}>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {['Economy','Compact','Sedan','SUV','Luxury','Van','Truck','Convertible'].map((c) => (
                  <SelectItem key={c} value={c.toLowerCase()} className="text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Pricing
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Daily Rate ($) *</Label>
            <Input name="daily_rate" type="number" value={form.daily_rate}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Weekly Rate ($)</Label>
            <Input name="weekly_rate" type="number" value={form.weekly_rate}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Monthly Rate ($)</Label>
            <Input name="monthly_rate" type="number" value={form.monthly_rate}
              onChange={handleChange} placeholder="0.00" step="0.01" min="0"
              className={inputClass} />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Insurance
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Insurance Provider</Label>
            <Input name="insurance_provider" value={form.insurance_provider}
              onChange={handleChange} placeholder="Provider name" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Insurance Expiry</Label>
            <Input name="insurance_expiry" type="date" value={form.insurance_expiry}
              onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className={labelClass}>Description / Notes</Label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about this vehicle..."
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 px-8"
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin mr-2" /> Saving...</>
        ) : (
          'Save Vehicle'
        )}
      </Button>
    </form>
  )
}