import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import VehicleBookingPanel from '@/components/vehicles/VehicleBookingPanel'
import Link from 'next/link'
import { Car, Fuel, Settings2, Users, Calendar, Shield, ArrowLeft, CheckCircle, } from 'lucide-react'
import ImageGallery from '@/components/vehicles/ImageGallery'

export default async function VehicleDetailPage({ params }) {
  const {id} = await params
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*, vehicle_images(url, is_primary)')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (!vehicle) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, status, licence_verified, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const primaryImage = vehicle.vehicle_images?.find((i) => i.is_primary)?.url
    ?? vehicle.vehicle_images?.[0]?.url
  const allImages = vehicle.vehicle_images ?? []

  const specs = [
    { icon: Settings2, label: 'Transmission', value: vehicle.transmission },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuel_type },
    { icon: Users, label: 'Seating', value: `${vehicle.seating_capacity} seats` },
    { icon: Car, label: 'Category', value: vehicle.category },
    { icon: Calendar, label: 'Year', value: vehicle.year },
    { icon: Shield, label: 'Insurance', value: vehicle.insurance_provider ?? 'Covered' },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-lg text-white">CarRental</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href={profile?.role === 'customer' ? '/dashboard/customer' : '/dashboard/admin'}
                className="px-3 sm:px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login"
                  className="px-3 sm:px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register"
                  className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back */}
        <Link href="/dashboard/browse"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-6">
          <ArrowLeft size={15} /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left — vehicle info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary image */}
            <ImageGallery
              images={allImages}
              vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            />

            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1 font-mono">{vehicle.plate_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">${vehicle.daily_rate}</p>
                  <p className="text-slate-400 text-sm">per day</p>
                </div>
              </div>
              {vehicle.description && (
                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  {vehicle.description}
                </p>
              )}
            </div>

            {/* Specs grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Vehicle Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {specs.filter((s) => s.value).map((spec) => (
                  <div key={spec.label} className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-800 rounded-lg">
                      <spec.icon size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{spec.label}</p>
                      <p className="text-sm text-white capitalize">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing tiers */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Pricing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Daily Rate', value: vehicle.daily_rate, unit: '/day' },
                  { label: 'Weekly Rate', value: vehicle.weekly_rate, unit: '/week' },
                  { label: 'Monthly Rate', value: vehicle.monthly_rate, unit: '/month' },
                ].filter((p) => p.value).map((price) => (
                  <div key={price.label}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">{price.label}</p>
                    <p className="text-xl font-bold text-white">${price.value}</p>
                    <p className="text-xs text-slate-400">{price.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What's included */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-white mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Third-party insurance coverage',
                  '24/7 roadside assistance',
                  'Unlimited mileage (local)',
                  'Clean & sanitized vehicle',
                  'Full tank on pickup',
                  'GPS navigation available',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-green-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — booking panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <VehicleBookingPanel
                vehicle={vehicle}
                user={user}
                profile={profile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}