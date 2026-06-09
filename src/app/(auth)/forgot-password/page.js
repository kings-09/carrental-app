'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardContent className="px-4 sm:px-6 py-8 sm:py-10 text-center space-y-4">
          <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Mail size={24} className="text-green-400" />
          </div>
          <h2 className="text-white font-bold text-xl">Check your email</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a password reset link to{' '}
            <span className="text-white font-medium">{email}</span>.
            Check your inbox and click the link to reset your password.
          </p>
          <p className="text-slate-500 text-xs">
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSent(false)}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              try again
            </button>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors pt-2"
          >
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-0">
        <CardTitle className="text-white text-xl sm:text-2xl">
          Reset your password
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs sm:text-sm">
          Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs sm:text-sm">
              Email Address
            </Label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="john@example.com"
                required
                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 sm:h-11 text-sm"
              />
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-11"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin mr-2" />Sending...</>
              : 'Send Reset Link'
            }
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors pt-1"
          >
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}