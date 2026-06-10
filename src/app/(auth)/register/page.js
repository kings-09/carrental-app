'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Car } from 'lucide-react'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword)
      return setMessage({ type: 'error', text: 'Passwords do not match.' })
    if (form.password.length < 6)
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
    if (!form.phone)
      return setMessage({ type: 'error', text: 'Phone number is required.' })

    setLoading(true)
    const result = await signUp(form)
    setLoading(false)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({
        type: 'success',
        text: 'Account created! Redirecting to sign in...',
      })
      setTimeout(() => {
        router.push(redirectTo ? `/login?redirect=${redirectTo}` : '/login')
      }, 1500)
    }
  }

  const inputClass =
    'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 sm:h-11 text-sm'

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-0">
        <CardTitle className="text-white text-xl sm:text-2xl">
          Create an account
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs sm:text-sm">
          Enter your details to get started
        </CardDescription>
        {redirectTo?.startsWith('/vehicles/') && (
          <div className="flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            <Car size={14} className="text-blue-400 shrink-0" />
            <p className="text-blue-300 text-xs">
              Create an account to book your selected vehicle
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

          {/* Full Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-slate-300 text-xs sm:text-sm">
                Full Name *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-300 text-xs sm:text-sm">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+263 77 XXX XXXX"
                value={form.phone}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-xs sm:text-sm">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-xs sm:text-sm">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-slate-300 text-xs sm:text-sm">
                Confirm Password *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Terms note */}
          <p className="text-xs text-slate-500">
            By creating an account you agree to our terms of service. Your
            account will require KYC verification before you can make bookings.
          </p>

          {/* Message */}
          {message.text && (
            <div className={`text-xs sm:text-sm px-3 py-2 rounded-md ${
              message.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-sm mt-1"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin mr-2" />Creating account...</>
            ) : (
              'Create Account'
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-slate-400 pt-1">
            Already have an account?{' '}
            <Link
              href={redirectTo ? `/login?redirect=${redirectTo}` : '/login'}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}