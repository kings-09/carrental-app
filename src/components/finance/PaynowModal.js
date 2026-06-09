'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Smartphone, CreditCard, Loader2, CheckCircle,
  AlertCircle, RefreshCw, Clock,
} from 'lucide-react'
import { toast } from 'sonner'

const METHODS = [
  {
    id: 'ecocash',
    label: 'EcoCash',
    icon: Smartphone,
    color: 'border-green-500/40 bg-green-500/10 text-green-400',
    activeColor: 'border-green-500 bg-green-500/20',
    desc: 'Pay via EcoCash mobile money',
    prefix: '07',
  },
  {
    id: 'onemoney',
    label: 'OneMoney',
    icon: Smartphone,
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    activeColor: 'border-blue-500 bg-blue-500/20',
    desc: 'Pay via NetOne OneMoney',
    prefix: '071',
  },
  {
    id: 'web',
    label: 'Card / Other',
    icon: CreditCard,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    activeColor: 'border-purple-500 bg-purple-500/20',
    desc: 'Pay via Paynow web gateway',
    prefix: null,
  },
]

export default function PaynowModal({ invoice, open, onClose, onSuccess }) {
  const [method, setMethod] = useState('ecocash')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('form') // form | polling | success | error
  const [pollUrl, setPollUrl] = useState(null)
  const [pollCount, setPollCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef(null)

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const startPolling = (url, invoiceId) => {
    let count = 0
    const maxPolls = 24

    pollRef.current = setInterval(async () => {
        count++
        setPollCount(count)

        try {
        const res = await fetch('/api/paynow/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pollUrl: url, invoiceId }),
        })

        if (!res.ok) {
            console.error('Poll request failed:', res.status)
            return
        }

        const data = await res.json()

        if (data.paid) {
            clearInterval(pollRef.current)
            setPhase('success')
            onSuccess?.()
            return
        }

        if (data.status === 'cancelled') {
            clearInterval(pollRef.current)
            setPhase('error')
            setErrorMsg('Payment was cancelled. Please try again.')
            return
        }

        if (count >= maxPolls) {
            clearInterval(pollRef.current)
            setPhase('error')
            setErrorMsg(
            'Payment timed out. If you completed the payment, it will be confirmed shortly via the webhook.'
            )
        }
        } catch (err) {
        console.error('Poll error:', err)
        }
    }, 5000)
    }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const selectedMethod = METHODS.find((m) => m.id === method)
    if (selectedMethod?.prefix && !phone) {
      toast.error('Please enter your phone number')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/paynow/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          phone: phone || null,
          method,
        }),
      })
      const data = await res.json()

      if (data.error) {
        setErrorMsg(data.error)
        setLoading(false)
        return
      }

      if (data.mobile) {
        // EcoCash / OneMoney — start polling
        setPollUrl(data.pollUrl)
        setPhase('polling')
        startPolling(data.pollUrl, invoice.id)
      } else {
        // Web payment — redirect
        window.location.href = data.redirectUrl
      }
    } catch (err) {
      setErrorMsg('Failed to initiate payment. Please try again.')
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setPhase('form')
    setPhone('')
    setErrorMsg('')
    setPollCount(0)
    setPollUrl(null)
    onClose()
  }

  const selectedMethod = METHODS.find((m) => m.id === method)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <Smartphone size={18} className="text-green-400" />
            Pay with Paynow
          </DialogTitle>
        </DialogHeader>

        {/* Invoice summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Invoice</span>
            <span className="font-mono">{invoice?.invoice_number}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-slate-700 pt-2">
            <span className="text-white">Amount Due</span>
            <span className="text-green-400">${invoice?.balance_due?.toFixed(2)}</span>
          </div>
        </div>

        {/* Form phase */}
        {phase === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Method selection */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs sm:text-sm">
                Payment Method
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMethod(m.id); setPhone('') }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      method === m.id
                        ? m.activeColor + ' border-2'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      method === m.id ? m.color : 'bg-slate-700 text-slate-400'
                    }`}>
                      <m.icon size={16} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{m.label}</p>
                      <p className="text-slate-400 text-xs">{m.desc}</p>
                    </div>
                    {method === m.id && (
                      <CheckCircle size={16} className="text-green-400 ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone number for mobile */}
            {(method === 'ecocash' || method === 'onemoney') && (
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs sm:text-sm">
                  {method === 'ecocash' ? 'EcoCash' : 'OneMoney'} Number *
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={method === 'ecocash' ? '077XXXXXXX' : '071XXXXXXX'}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 h-10 text-sm"
                />
                <p className="text-xs text-slate-500">
                  Enter the number registered to your{' '}
                  {method === 'ecocash' ? 'EcoCash' : 'OneMoney'} wallet
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 font-medium"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin mr-2" />Processing...</>
                : <>
                    <Smartphone size={15} className="mr-2" />
                    Pay ${invoice?.balance_due?.toFixed(2)} via {selectedMethod?.label}
                  </>
              }
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Secured by Paynow Zimbabwe · Your payment is encrypted
            </p>
          </form>
        )}

        {/* Polling phase */}
        {phase === 'polling' && (
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/20 rounded-full flex items-center justify-center">
                  <Smartphone size={28} className="text-green-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700">
                  <Clock size={12} className="text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">
                  Waiting for payment...
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  A payment prompt has been sent to
                </p>
                <p className="text-green-400 font-mono font-semibold text-lg">
                  {phone}
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Complete payment on your phone
              </p>
              {[
                'Check your phone for the payment prompt',
                'Open your EcoCash / OneMoney app',
                'Enter your PIN to approve the payment',
                'Wait for confirmation here',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs text-slate-400">{i + 1}</span>
                  </div>
                  <span className="text-slate-300">{step}</span>
                </div>
              ))}
            </div>

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw size={12} className="animate-spin" />
              Checking payment status... ({pollCount * 5}s)
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{errorMsg}</p>
              </div>
            )}

            <Button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white h-9 text-sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Success phase */}
        {phase === 'success' && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-xl">Payment Successful!</p>
              <p className="text-slate-400 text-sm mt-1">
                Your payment of ${invoice?.balance_due?.toFixed(2)} has been received.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
            >
              Done
            </Button>
          </div>
        )}

        {/* Error phase */}
        {phase === 'error' && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center">
                <Clock size={32} className="text-amber-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Payment Pending</p>
              <p className="text-slate-400 text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPhase('form')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-10 text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}