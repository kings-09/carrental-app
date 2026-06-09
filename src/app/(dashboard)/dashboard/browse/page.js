import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BrowseVehicles from '@/components/vehicles/BrowseVehicles'

export default async function BrowsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, vehicle_images(url, is_primary)')
    .eq('status', 'available')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const categories = [...new Set(vehicles?.map((v) => v.category).filter(Boolean))]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Browse Vehicles</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {vehicles?.length ?? 0} vehicles available for rental
        </p>
      </div>
      <BrowseVehicles vehicles={vehicles ?? []} categories={categories} />
    </div>
  )
}