import { createClient } from '@/lib/supabase'

export async function getAllVehicles(filters = {}) {
  const supabase = createClient()
  let query = supabase
    .from('vehicles')
    .select(`*, vehicle_images(url, is_primary)`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.search) {
    query = query.or(
      `make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,plate_number.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  return { data, error }
}

export async function getVehicleById(id) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select(`*, vehicle_images(id, url, is_primary)`)
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createVehicle(vehicleData, userId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...vehicleData, created_by: userId })
    .select()
    .single()
  return { data, error }
}

export async function updateVehicle(id, vehicleData) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...vehicleData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteVehicle(id) {
  const supabase = createClient()
  const { error } = await supabase
    .from('vehicles')
    .update({ is_deleted: true })
    .eq('id', id)
  return { error }
}