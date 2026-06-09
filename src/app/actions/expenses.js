'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createExpense(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      vehicle_id: formData.vehicle_id || null,
      vendor: formData.vendor || null,
      expense_date: formData.expense_date,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/expenses')
  return { success: true, data }
}

export async function deleteExpense(id) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/expenses')
  return { success: true }
}