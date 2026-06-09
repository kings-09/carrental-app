import { createClient } from '@/lib/supabase-server'
import VehicleListings from '@/components/vehicles/VehicleListings'
import Link from 'next/link'

export default async function VehiclesPage() {
  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, vehicle_images(url, is_primary)')
    .eq('status', 'available')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const categories = [...new Set(vehicles?.map((v) => v.category).filter(Boolean))]

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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login"
              className="px-3 sm:px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Find Your Perfect Rental
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Browse our fleet of well-maintained vehicles. Filter by category,
            price, and availability to find the right car for your trip.
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <VehicleListings vehicles={vehicles ?? []} categories={categories} />
      </div>
    </div>
  )
}