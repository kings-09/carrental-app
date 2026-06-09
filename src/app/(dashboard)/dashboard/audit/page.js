import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Shield } from 'lucide-react'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'accountant'].includes(profile?.role)) {
    redirect('/dashboard/admin')
  }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      id, action, table_name, record_id,
      old_data, new_data, created_at,
      profiles!audit_logs_actor_id_fkey(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const actionColors = {
    'booking.status.confirmed': 'text-blue-400',
    'booking.status.active': 'text-green-400',
    'booking.status.completed': 'text-slate-400',
    'booking.status.cancelled': 'text-red-400',
    'invoice.auto_generated': 'text-purple-400',
    'payment.paynow.completed': 'text-green-400',
    'payment.stripe.completed': 'text-green-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-blue-400" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {logs?.length ?? 0} recent actions recorded
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {!logs?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Shield size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No audit logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Timestamp', 'Actor', 'Action', 'Table', 'Record ID'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-white text-xs font-medium">
                        {log.profiles?.full_name ?? 'System'}
                      </p>
                      <p className="text-slate-500 text-xs capitalize">
                        {log.profiles?.role?.replace('_', ' ') ?? ''}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono font-medium ${actionColors[log.action] ?? 'text-slate-300'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {log.table_name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs max-w-xs truncate">
                      {log.record_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}