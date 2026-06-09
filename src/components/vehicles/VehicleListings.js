'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Car, Search, SlidersHorizontal, Users, Fuel, Settings2 } from 'lucide-react'
import Link from 'next/link'

export default function VehicleListings({ vehicles, categories }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [transmission, setTransmission] = useState('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [user, setUser] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const filtered = useMemo(() => {
    let list = [...vehicles]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((v) =>
        `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(q)
      )
    }
    if (category !== 'all') list = list.filter((v) => v.category === category)
    if (transmission !== 'all') list = list.filter((v) => v.transmission === transmission)
    if (maxPrice) list = list.filter((v) => v.daily_rate <= parseFloat(maxPrice))
    if (sortBy === 'price_asc') list.sort((a, b) => a.daily_rate - b.daily_rate)
    else if (sortBy === 'price_desc') list.sort((a, b) => b.daily_rate - a.daily_rate)
    else if (sortBy === 'newest') list.sort((a, b) => b.year - a.year)
    return list
  }, [vehicles, search, category, transmission, maxPrice, sortBy])

  // If not logged in, go to login with redirect back to vehicle page
  const getVehicleLink = (vehicleId) => {
    if (user) return `/vehicles/${vehicleId}`
    return `/login?redirect=/vehicles/${vehicleId}`
  }

  const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'

  return (
    <div className="space-y-6">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-9 ${inputClass}`}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors sm:hidden ${
            showFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
        <div className={`flex-col sm:flex-row gap-3 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={`${inputClass} w-full sm:w-40`}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={transmission} onValueChange={setTransmission}>
            <SelectTrigger className={`${inputClass} w-full sm:w-36`}>
              <SelectValue placeholder="Transmission" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">Any Transmission</SelectItem>
              <SelectItem value="automatic" className="text-white">Automatic</SelectItem>
              <SelectItem value="manual" className="text-white">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Max $/day"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={`${inputClass} w-full sm:w-32`}
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={`${inputClass} w-full sm:w-36`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="newest" className="text-white">Newest First</SelectItem>
              <SelectItem value="price_asc" className="text-white">Price: Low–High</SelectItem>
              <SelectItem value="price_desc" className="text-white">Price: High–Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} available
        </p>
        {(search || category !== 'all' || transmission !== 'all' || maxPrice) && (
          <button
            onClick={() => { setSearch(''); setCategory('all'); setTransmission('all'); setMaxPrice('') }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Car size={48} className="text-slate-600" />
          <p className="text-slate-400 font-medium">No vehicles found</p>
          <p className="text-slate-500 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((v) => {
            const image = v.vehicle_images?.find((i) => i.is_primary)?.url
              ?? v.vehicle_images?.[0]?.url

            return (
              <Link key={v.id} href={getVehicleLink(v.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                <div className="h-40 bg-slate-800 flex items-center justify-center overflow-hidden relative">
                  {image ? (
                    <img
                      src={image}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Car size={48} className="text-slate-600" />
                  )}
                  {v.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-xs rounded-full capitalize border border-slate-700">
                      {v.category}
                    </span>
                  )}
                  {/* Login prompt badge for guests */}
                  {!user && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-xs rounded-full">
                      Sign in to book
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{v.plate_number}</p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span className="flex items-center gap-1 capitalize">
                      <Settings2 size={11} /> {v.transmission}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Fuel size={11} /> {v.fuel_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {v.seating_capacity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-white font-bold text-lg">${v.daily_rate}</span>
                      <span className="text-slate-400 text-xs">/day</span>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
                      {user ? 'Book Now' : 'Sign In to Book'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}