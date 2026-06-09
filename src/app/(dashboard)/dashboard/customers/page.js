'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { Users, Search, MoreVertical, CheckCircle, XCircle, ShieldAlert, Eye, Phone, Mail, Trash2, } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusConfig = {
  unverified:  { label: 'Unverified',  class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  pending_kyc: { label: 'Pending KYC', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  active:      { label: 'Active',      class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  suspended:   { label: 'Suspended',   class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select(`
        id, full_name, phone, address, status, role,
        national_id, licence_url, licence_verified,
        is_blacklisted, created_at, loyalty_points,
        date_of_birth, notes
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,national_id.ilike.%${search}%`
      )
    }

    const { data } = await query
    setCustomers(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleVerifyLicence = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        licence_verified: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) { toast.error(error.message); return }

    toast.success('Licence verified and account activated!')

    // Update selected state
    setSelected((prev) => ({
      ...prev,
      licence_verified: true,
      status: 'active',
    }))

    // Refresh the customers list
    await fetchCustomers()
  }

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Customer status updated to ${status}`)
    fetchCustomers()
    if (selected?.id === id) setSelected((p) => ({ ...p, status }))
  }

  const toggleBlacklist = async (id, current) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blacklisted: !current })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(current ? 'Customer removed from blacklist' : 'Customer blacklisted')
    fetchCustomers()
    if (selected?.id === id) setSelected((p) => ({ ...p, is_blacklisted: !current }))
  }

  const openDetail = (customer) => {
    setSelected(customer)
    setShowDetail(true)
  }

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === 'active').length,
    pending: customers.filter((c) => c.status === 'pending_kyc').length,
    blacklisted: customers.filter((c) => c.is_blacklisted).length,
  }

  const handleDeleteCustomer = async (id) => {
    if (!confirm('Permanently delete this customer account? This cannot be undone.')) return
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success('Customer account deleted')
      setShowDetail(false)
      fetchCustomers()
    } catch {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Customers</h1>
        <p className="text-slate-400 text-sm mt-0.5">{stats.total} registered customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Pending KYC', value: stats.pending, color: 'text-amber-400' },
          { label: 'Blacklisted', value: stats.blacklisted, color: 'text-red-400' },
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
          <Input
            placeholder="Search by name, phone or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'unverified', 'pending_kyc', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No customers found</p>
            <p className="text-slate-500 text-sm">Customers appear here once they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Customer', 'Contact', 'Status', 'Licence', 'Points', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 sm:px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {customers.map((c) => {
                  const status = statusConfig[c.status] ?? statusConfig.unverified
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                            <span className="text-blue-400 text-xs font-semibold">
                              {c.full_name?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium whitespace-nowrap">
                              {c.full_name ?? 'No name'}
                            </p>
                            {c.is_blacklisted && (
                              <span className="text-xs text-red-400">⚠ Blacklisted</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {c.phone && (
                            <span className="flex items-center gap-1 text-xs">
                              <Phone size={11} className="text-slate-500" /> {c.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        {c.licence_url ? (
                          <span className={`text-xs font-medium ${c.licence_verified ? 'text-green-400' : 'text-amber-400'}`}>
                            {c.licence_verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Not uploaded</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 text-center">
                        {c.loyalty_points ?? 0}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                        {c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-48">
                            <DropdownMenuItem
                              onClick={() => openDetail(c)}
                              className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer"
                            >
                              <Eye size={13} /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(c.id, 'active')}
                              className="text-green-400 hover:text-green-300 text-sm gap-2 cursor-pointer"
                            >
                              <CheckCircle size={13} /> Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(c.id, 'suspended')}
                              className="text-amber-400 hover:text-amber-300 text-sm gap-2 cursor-pointer"
                            >
                              <XCircle size={13} /> Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleBlacklist(c.id, c.is_blacklisted)}
                              className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer"
                            >
                              <ShieldAlert size={13} />
                              {c.is_blacklisted ? 'Remove Blacklist' : 'Blacklist'}
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

      {/* Customer Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Customer Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 text-xl font-bold">
                    {selected.full_name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{selected.full_name ?? 'No name'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selected.status]?.class ?? ''}`}>
                    {statusConfig[selected.status]?.label ?? selected.status}
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Phone', value: selected.phone },
                  { label: 'National ID', value: selected.national_id },
                  { label: 'Date of Birth', value: selected.date_of_birth ? format(new Date(selected.date_of_birth), 'dd MMM yyyy') : null },
                  { label: 'Loyalty Points', value: selected.loyalty_points ?? 0 },
                  { label: 'Licence', value: selected.licence_url ? (selected.licence_verified ? '✓ Verified' : '⏳ Pending verification') : 'Not uploaded' },
                  { label: 'Blacklisted', value: selected.is_blacklisted ? '⚠ Yes' : 'No' },
                  { label: 'Joined', value: selected.created_at ? format(new Date(selected.created_at), 'dd MMM yyyy') : '—' },
                  { label: 'Address', value: selected.address },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-sm text-white">{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-300">{selected.notes}</p>
                </div>
              )}

              {/* KYC Photo Review */}
              {selected.licence_url && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    KYC Photo
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-slate-700"
                    style={{ aspectRatio: '16/9' }}>
                    <img
                      src={selected.licence_url}
                      alt="KYC verification photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!selected.licence_verified && (
                    <Button
                      onClick={() => handleVerifyLicence(selected.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
                    >
                      <CheckCircle size={14} className="mr-2" />
                      Verify & Activate Account
                    </Button>
                  )}
                  {selected.licence_verified && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <CheckCircle size={13} /> Photo verified — account is active
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                <Button
                  onClick={() => updateStatus(selected.id, 'active')}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 text-xs h-8"
                >
                  <CheckCircle size={13} className="mr-1" /> Activate
                </Button>
                <Button
                  onClick={() => updateStatus(selected.id, 'suspended')}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 text-xs h-8"
                >
                  <XCircle size={13} className="mr-1" /> Suspend
                </Button>
                <Button
                  onClick={() => toggleBlacklist(selected.id, selected.is_blacklisted)}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-xs h-8"
                >
                  <ShieldAlert size={13} className="mr-1" />
                  {selected.is_blacklisted ? 'Remove Blacklist' : 'Blacklist'}
                </Button>
                <Button
                  onClick={() => handleDeleteCustomer(selected.id)}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-xs h-8"
                >
                  <Trash2 size={13} className="mr-1" /> Delete Account
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}