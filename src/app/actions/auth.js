'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function signUp(formData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'customer',
      },
    },
  })

  if (error) return { error: error.message }

  if (data?.user) {
    await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)
  }

  return { success: 'Account created! You can now log in.' }
}

export async function signIn(formData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role
  const staffRoles = ['super_admin', 'accountant', 'fleet_manager', 'customer_support']

  // If there's a redirect URL, use it
  if (formData.redirectTo) {
    redirect(formData.redirectTo)
  }

  if (staffRoles.includes(role)) redirect('/dashboard/admin')
  redirect('/dashboard/customer')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}