import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetUserId } = await request.json()

    // Fetch the requesting user's role
    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const role = requestingProfile?.role

    // Determine who is being deleted
    const deletingSelf = !targetUserId || targetUserId === user.id
    const deleteId = deletingSelf ? user.id : targetUserId

    // Permission checks
    if (!deletingSelf && role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can delete other accounts' },
        { status: 403 }
      )
    }

    // Staff roles cannot delete their own accounts
    const staffRoles = ['accountant', 'fleet_manager', 'customer_support']
    if (deletingSelf && staffRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Staff accounts cannot be self-deleted. Contact Super Admin.' },
        { status: 403 }
      )
    }

    // Fetch target profile for audit
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', deleteId)
      .single()

    // Super admin cannot delete another super admin
    if (
      !deletingSelf &&
      targetProfile?.role === 'super_admin' &&
      role === 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'Super Admin accounts cannot be deleted.' },
        { status: 403 }
      )
    }

    // Audit log before deletion
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: deletingSelf ? 'account.self_deleted' : 'account.deleted_by_admin',
        table_name: 'profiles',
        record_id: deleteId,
        old_data: {
          full_name: targetProfile?.full_name,
          role: targetProfile?.role,
          deleted_by: requestingProfile?.full_name,
        },
      })

    // Delete the auth user — this cascades to profiles via FK
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(deleteId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}