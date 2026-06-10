'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CameraCapture from '@/components/profile/CameraCapture'
import { CheckCircle, Clock, AlertCircle, Loader2, User, Camera, FileText, } from 'lucide-react'
import { toast } from 'sonner'

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    national_id: '',
    date_of_birth: '',
  })

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
          national_id: data.national_id ?? '',
          date_of_birth: data.date_of_birth ?? '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated!')
    setProfile((p) => ({ ...p, ...form }))
  }

  const handleCameraCapture = async (dataUrl) => {
    setUploading(true)
    setShowCamera(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Convert dataUrl to blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const path = `licences/${user.id}/kyc-photo.jpg`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          licence_url: publicUrl,
          licence_verified: false,
          status: 'pending_kyc',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        toast.error(updateError.message)
        setUploading(false)
        return
      }

      toast.success('Photo submitted! Awaiting admin verification.')
      setProfile((p) => ({
        ...p,
        licence_url: publicUrl,
        licence_verified: false,
        status: 'pending_kyc',
      }))
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    }

    setUploading(false)
  }

  const checklist = [
    { label: 'Full name & phone filled in', done: !!(profile?.full_name && profile?.phone) },
    { label: 'KYC photo taken', done: !!profile?.licence_url },
    { label: 'Photo verified by admin', done: !!profile?.licence_verified },
    { label: 'Account activated', done: profile?.status === 'active' },
  ]
  const completedSteps = checklist.filter((c) => c.done).length

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
        <h1 className="text-xl sm:text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Complete your profile to start renting vehicles
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Profile Completion
          </p>
          <p className="text-xs text-slate-400">
            {completedSteps}/{checklist.length} steps
          </p>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
          />
        </div>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.done ? (
                <CheckCircle size={15} className="text-green-400 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0 flex items-center justify-center">
                  <span className="text-slate-500 text-xs">{i + 1}</span>
                </div>
              )}
              <span className={`text-sm ${item.done ? 'text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KYC Camera section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Camera size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">
            KYC Verification Photo
          </h2>
        </div>

        {!showCamera ? (
          <div className="space-y-4">
            {/* Current status */}
            {profile?.licence_url ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  profile.licence_verified
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  {profile.licence_verified ? (
                    <>
                      <CheckCircle size={18} className="text-green-400 shrink-0" />
                      <div>
                        <p className="text-green-400 text-sm font-medium">
                          Verified ✓
                        </p>
                        <p className="text-slate-400 text-xs">
                          Your identity has been confirmed. You can now book vehicles.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock size={18} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-amber-400 text-sm font-medium">
                          Under Review
                        </p>
                        <p className="text-slate-400 text-xs">
                          Our team is reviewing your photo. Usually within 24 hours.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Photo preview */}
                <div className="relative rounded-xl overflow-hidden border border-slate-700"
                  style={{ aspectRatio: '16/9' }}>
                  <img
                    src={profile.licence_url}
                    alt="KYC photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                    <p className="text-white text-xs flex items-center gap-1">
                      <FileText size={11} /> KYC Photo
                    </p>
                  </div>
                </div>

                {/* Retake option */}
                {!profile.licence_verified && (
                  <Button
                    onClick={() => setShowCamera(true)}
                    disabled={uploading}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm h-9 border border-slate-600 w-full sm:w-auto"
                  >
                    <Camera size={13} className="mr-2" />
                    Retake Photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={28} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Take your KYC verification photo
                    </p>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                      You'll need to take a photo of yourself holding
                      your driving licence clearly visible
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCamera(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
                  >
                    <Camera size={15} className="mr-2" />
                    Open Camera
                  </Button>
                </div>

                <div className="flex items-start gap-2 bg-slate-800/50 rounded-xl p-3">
                  <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hold your driving licence next to your face so both are
                    clearly visible. Your photo will be reviewed by our team
                    before your account is fully activated.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <CameraCapture
              autoStart
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-2">
                <Loader2 size={15} className="animate-spin" />
                Uploading your photo...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personal details form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Personal Details</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Full Name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>National ID / Passport</Label>
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
                placeholder="Your full address"
                className={inputClass}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin mr-2" />Saving...</>
              : 'Save Profile'
            }
          </Button>
        </form>
      </div>
    </div>
  )
}