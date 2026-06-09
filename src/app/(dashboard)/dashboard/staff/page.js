'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem,SelectTrigger, SelectValue, } from '@/components/ui/select'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { Users, Plus, MoreVertical, Shield, CheckCircle, XCircle, Loader2, Trash2, } from 'lucide-react'
import { toast } from 'sonner'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'customer_support', label: 'Customer Support' },
]

const roleColors = {
  super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  accountant: 'bg-green-500/10 text-green-400 border-green-500/20',
  fleet_manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  customer_support: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'fleet_manager',
  })
  const supabase = createClient()

  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, status, created_at')
      .in('role', ['super_admin', 'accountant', 'fleet_manager', 'customer_support'])
      .order('created_at', { ascending: false })
    setStaff(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        setSubmitting(false)
        return
      }

      toast.success(`${form.fullName} added as ${form.role.replace('_', ' ')}`)
      setShowForm(false)
      setForm({ fullName: '', email: '', password: '', role: 'fleet_manager' })
      fetchStaff()
    } catch (err) {
      toast.error('Failed to create staff member')
    }
    setSubmitting(false)
  }

  const updateRole = async (id, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Role updated')
    fetchStaff()
  }

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Status updated')
    fetchStaff()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{staff.length} staff members</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus size={16} className="mr-2" /> Add Staff Member
        </Button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <div key={r.value} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-slate-500">{r.label}</p>
            <p className="text-xl font-bold text-white mt-1">
              {staff.filter((s) => s.role === r.value).length}
            </p>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No staff members yet</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
              <Plus size={15} className="mr-2" /> Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Staff Member', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center shrink-0">
                          <span className="text-purple-400 text-xs font-semibold">
                            {s.full_name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{s.full_name ?? 'No name'}</p>
                          {s.phone && <p className="text-slate-500 text-xs">{s.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${roleColors[s.role] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {s.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        s.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <MoreVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-48">
                          {ROLES.map((r) => (
                            <DropdownMenuItem
                              key={r.value}
                              onClick={() => updateRole(s.id, r.value)}
                              className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer"
                            >
                              <Shield size={13} /> Set as {r.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => updateStatus(s.id, s.status === 'active' ? 'suspended' : 'active')}
                            className={`text-sm gap-2 cursor-pointer ${s.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                          >
                            {s.status === 'active'
                              ? <><XCircle size={13} /> Suspend</>
                              : <><CheckCircle size={13} /> Activate</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              if (!confirm(`Delete ${s.full_name}'s account permanently?`)) return
                              try {
                                const res = await fetch('/api/account/delete', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ targetUserId: s.id }),
                                })
                                const data = await res.json()
                                if (data.error) { toast.error(data.error); return }
                                toast.success('Staff account deleted')
                                fetchStaff()
                              } catch {
                                toast.error('Failed to delete account')
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer border-t border-slate-700 mt-1 pt-1"
                          >
                            <Trash2 size={13} /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Add Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Staff member name"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="staff@example.com"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Temporary Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-white">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin mr-2" />Creating...</>
                : 'Create Staff Account'
              }
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}