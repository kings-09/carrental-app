'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { toast } from 'sonner'

const typeConfig = {
  info:    { icon: Info,          class: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
  success: { icon: CheckCircle,   class: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  warning: { icon: AlertTriangle, class: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  error:   { icon: XCircle,       class: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setNotifications(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast.success('All notifications marked as read')
  }

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notification deleted')
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 w-full sm:w-auto">
            <CheckCheck size={15} className="mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No notifications yet</p>
            <p className="text-slate-500 text-sm">
              You'll see booking, payment and system alerts here
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const type = typeConfig[n.type] ?? typeConfig.info
            const TypeIcon = type.icon
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  n.is_read
                    ? 'bg-slate-900 border-slate-800 opacity-60'
                    : `bg-slate-900 border-slate-700 hover:border-slate-600 ${type.bg}`
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${n.is_read ? 'bg-slate-800' : type.bg}`}>
                  <TypeIcon size={16} className={n.is_read ? 'text-slate-500' : type.class} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {format(new Date(n.created_at), 'dd MMM yyyy · HH:mm')}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}