'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { createBooking, updateBookingStatus, deleteBooking } from '@/app/actions/bookings'
import BookingForm from '@/components/bookings/BookingForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, CalendarCheck, MoreVertical,
  CheckCircle, XCircle, PlayCircle, Flag, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusConfig = {
  pending:   { label: 'Pending',   class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  active:    { label: 'Active',    class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  completed: { label: 'Completed', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  overdue:   { label: 'Overdue',   class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select(`
        id, booking_number, status, pickup_date, return_date,
        total_days, total_amount, created_at,
        profiles!bookings_customer_id_fkey(full_name, phone),
        vehicles!bookings_vehicle_id_fkey(make, model, plate_number)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search) {
      query = query.or(`booking_number.ilike.%${search}%`)
    }

    const { data } = await query
    setBookings(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleCreate = async (formData) => {
    setSubmitting(true)
    const result = await createBooking(formData)
    setSubmitting(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Booking created successfully!')
    setShowForm(false)
    fetchBookings()
  }

  const handleStatus = async (id, status) => {
    const result = await updateBookingStatus(id, status)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Booking marked as ${status}`)
    fetchBookings()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this booking?')) return
    const result = await deleteBooking(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Booking deleted.')
    fetchBookings()
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 text-sm mt-0.5">{stats.total} total bookings</p>
        </div>
        <Button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Completed', value: stats.completed, color: 'text-slate-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by booking number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CalendarCheck size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No bookings found</p>
            <Button onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
              <Plus size={15} className="mr-2" /> Create First Booking
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Booking #', 'Customer', 'Vehicle', 'Dates', 'Days', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 sm:px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {bookings.map((b) => {
                  const status = statusConfig[b.status] ?? statusConfig.pending
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-mono text-xs text-white whitespace-nowrap">
                        {b.booking_number}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                        <p className="text-sm">{b.profiles?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{b.profiles?.phone ?? ''}</p>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                        <p className="text-sm">{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : '—'}</p>
                        <p className="text-xs font-mono text-slate-500">{b.vehicles?.plate_number ?? ''}</p>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap text-xs">
                        <p>{format(new Date(b.pickup_date), 'dd MMM yy')}</p>
                        <p className="text-slate-500">→ {format(new Date(b.return_date), 'dd MMM yy')}</p>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 text-center">
                        {b.total_days}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-white font-semibold whitespace-nowrap">
                        ${b.total_amount?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
                            <DropdownMenuItem onClick={() => handleStatus(b.id, 'confirmed')}
                              className="text-blue-400 hover:text-blue-300 text-sm gap-2 cursor-pointer">
                              <CheckCircle size={13} /> Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatus(b.id, 'active')}
                              className="text-green-400 hover:text-green-300 text-sm gap-2 cursor-pointer">
                              <PlayCircle size={13} /> Mark Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatus(b.id, 'completed')}
                              className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer">
                              <Flag size={13} /> Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatus(b.id, 'cancelled')}
                              className="text-amber-400 hover:text-amber-300 text-sm gap-2 cursor-pointer">
                              <XCircle size={13} /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(b.id)}
                              className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer">
                              <Trash2 size={13} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Booking Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Create New Booking</DialogTitle>
          </DialogHeader>
          <BookingForm onSubmit={handleCreate} loading={submitting} />
        </DialogContent>
      </Dialog>
    </div>
  )
}