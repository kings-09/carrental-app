'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function addVehicle(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const vehicle = {
    make: formData.make,
    model: formData.model,
    year: parseInt(formData.year),
    plate_number: formData.plate_number.toUpperCase(),
    vin: formData.vin || null,
    color: formData.color || null,
    transmission: formData.transmission,
    fuel_type: formData.fuel_type,
    seating_capacity: parseInt(formData.seating_capacity),
    daily_rate: parseFloat(formData.daily_rate),
    weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
    monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
    mileage: parseInt(formData.mileage) || 0,
    category: formData.category || null,
    description: formData.description || null,
    insurance_expiry: formData.insurance_expiry || null,
    insurance_provider: formData.insurance_provider || null,
    status: 'available',
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet')
  return { success: true, data }
}

export async function uploadVehicleImage(vehicleId, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('image')
  if (!file) return { error: 'No file provided' }

  // Validate size
  if (file.size > 5 * 1024 * 1024) return { error: `${file.name} exceeds 5MB limit` }

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return { error: `${file.name} is not a valid image type` }

  const ext = file.name.split('.').pop()
  const path = `vehicles/${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('vehicle-images')
    .upload(path, file, { upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(path)

  // Check if this is the first image — make it primary
  const { data: existing } = await supabase
    .from('vehicle_images')
    .select('id')
    .eq('vehicle_id', vehicleId)

  const isPrimary = !existing || existing.length === 0

  const { error: dbError } = await supabase
    .from('vehicle_images')
    .insert({ vehicle_id: vehicleId, url: publicUrl, is_primary: isPrimary })

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/fleet')
  return { success: true, url: publicUrl }
}

export async function editVehicle(id, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const vehicle = {
    make: formData.make,
    model: formData.model,
    year: parseInt(formData.year),
    plate_number: formData.plate_number.toUpperCase(),
    vin: formData.vin || null,
    color: formData.color || null,
    transmission: formData.transmission,
    fuel_type: formData.fuel_type,
    seating_capacity: parseInt(formData.seating_capacity),
    daily_rate: parseFloat(formData.daily_rate),
    weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
    monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
    mileage: parseInt(formData.mileage) || 0,
    category: formData.category || null,
    description: formData.description || null,
    insurance_expiry: formData.insurance_expiry || null,
    insurance_provider: formData.insurance_provider || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('vehicles')
    .update(vehicle)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet')
  return { success: true }
}

export async function removeVehicle(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicles')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet')
  return { success: true }
}

export async function changeVehicleStatus(id, status) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet')
  return { success: true }
}