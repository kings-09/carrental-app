'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, User, Lock, Shield, Trash2, AlertTriangle } from 'lucide-react'

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function SettingsPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    national_id: '',
  })
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: '',
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          date_of_birth: data.date_of_birth ?? '',
          national_id: data.national_id ?? '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated successfully!')
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    setSavingPassword(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated successfully!')
    setPasswords({ new: '', confirm: '' })
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (err) {
      toast.error('Failed to delete account')
      setDeleting(false)
    }
  }

  const roleLabels = {
    super_admin: 'Super Admin',
    accountant: 'Accountant',
    fleet_manager: 'Fleet Manager',
    customer_support: 'Customer Support',
    customer: 'Customer',
  }

  const staffRoles = ['accountant', 'fleet_manager', 'customer_support']
  const canDeleteSelf = profile?.role === 'customer' || profile?.role === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Account Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Role', value: roleLabels[profile?.role] ?? profile?.role },
            { label: 'Account Status', value: profile?.status ?? '—' },
            { label: 'Loyalty Points', value: profile?.loyalty_points ?? 0 },
            { label: 'Licence Verified', value: profile?.licence_verified ? '✓ Yes' : '✗ No' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm text-white capitalize mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Profile Details</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+263 77 XXX XXXX"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>National ID</Label>
              <Input
                value={form.national_id}
                onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
                placeholder="ID number"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={labelClass}>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Your address"
                className={inputClass}
              />
            </div>
          </div>
          <Button type="submit" disabled={savingProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
            {savingProfile
              ? <><Loader2 size={14} className="animate-spin mr-2" />Saving...</>
              : 'Save Profile'
            }
          </Button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={labelClass}>New Password</Label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className={labelClass}>Confirm New Password</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
                className={inputClass}
              />
            </div>
          </div>
          <Button type="submit" disabled={savingPassword}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6">
            {savingPassword
              ? <><Loader2 size={14} className="animate-spin mr-2" />Updating...</>
              : 'Update Password'
            }
          </Button>
        </form>
      </div>

      {/* Delete account — only for customers and super_admin */}
      {canDeleteSelf && (
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 size={16} className="text-red-400" />
            <h2 className="text-sm font-semibold text-white">Delete Account</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            {profile?.role === 'customer'
              ? 'Permanently delete your account and all associated data. This action cannot be undone.'
              : 'As Super Admin, you can delete your account. Make sure another Super Admin exists before proceeding.'
            }
          </p>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 h-10 px-6"
          >
            <Trash2 size={14} className="mr-2" />
            Delete My Account
          </Button>
        </div>
      )}

      {/* Staff cannot delete — show info */}
      {staffRoles.includes(profile?.role) && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Account deletion restricted</p>
            <p className="text-slate-400 text-xs mt-1">
              Staff accounts cannot be self-deleted. Contact your Super Admin to remove your account from the system.
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Trash2 size={18} className="text-red-400" />
              Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
              <p className="text-red-400 font-medium text-sm flex items-center gap-2">
                <AlertTriangle size={15} /> This action is permanent
              </p>
              <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
                <li>Your account will be permanently deleted</li>
                <li>All your personal data will be removed</li>
                <li>Your booking history will be anonymized</li>
                <li>This cannot be undone</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE here"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 h-10 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirm('')
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white h-10"
              >
                {deleting
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Deleting...</>
                  : <><Trash2 size={14} className="mr-2" />Delete Account</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}