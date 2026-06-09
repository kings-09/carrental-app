import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only super_admin can create staff
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can create staff' }, { status: 403 })
    }

    const { fullName, email, password, role } = await request.json()

    // Create auth user
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Update profile role and status
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', newUser.user.id)

    // Audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'staff.created',
        table_name: 'profiles',
        record_id: newUser.user.id,
        new_data: { email, role, full_name: fullName },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}