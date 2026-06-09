'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [form, setForm] = useState({ password: '', confirm: '' })
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: form.password,
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password updated! Redirecting...' })
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-0">
        <CardTitle className="text-white text-xl sm:text-2xl">
          Set new password
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs sm:text-sm">
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs sm:text-sm">
              New Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 sm:h-11 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs sm:text-sm">
              Confirm Password
            </Label>
            <Input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat new password"
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 sm:h-11 text-sm"
            />
          </div>

          {message.text && (
            <div className={`text-xs sm:text-sm px-3 py-2 rounded-md ${
              message.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin mr-2" />Updating...</>
              : 'Update Password'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}