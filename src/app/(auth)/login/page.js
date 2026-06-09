'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Car } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await signIn({ ...form, redirectTo })
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  const inputClass =
    'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 sm:h-11 text-sm sm:text-base'

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-0">
        <CardTitle className="text-white text-xl sm:text-2xl">
          Welcome back
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs sm:text-sm">
          Sign in to your account to continue
        </CardDescription>
        {/* Show context if redirected from vehicle page */}
        {redirectTo?.startsWith('/vehicles/') && (
          <div className="flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            <Car size={14} className="text-blue-400 shrink-0" />
            <p className="text-blue-300 text-xs">
              Sign in to book your selected vehicle
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-xs sm:text-sm">
              Email Address
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-300 text-xs sm:text-sm">
                Password
              </Label>
              <Link href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs sm:text-sm px-3 py-2 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11 text-sm sm:text-base mt-1"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin mr-2" />Signing in...</>
            ) : (
              'Sign In'
            )}
          </Button>

          <p className="text-center text-xs sm:text-sm text-slate-400 pt-1">
            Don&apos;t have an account?{' '}
            <Link
              href={redirectTo ? `/register?redirect=${redirectTo}` : '/register'}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}