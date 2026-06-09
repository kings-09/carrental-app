import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import {
  Car, Shield, BarChart3, Receipt, Users,
  CheckCircle, ArrowRight, Star, Zap, Globe,
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'customer') redirect('/dashboard/customer')
    redirect('/dashboard/admin')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-lg">CarRental</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login"
              className="px-3 sm:px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Get Started
            </Link>
            <Link href="/vehicles"
              className="px-3 sm:px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors hidden sm:block">
              Browse Cars
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-xs font-medium mb-6">
          <Zap size={12} /> Professional Fleet & Accounts Management
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Manage Your Car Rental
          <span className="block text-blue-500 mt-1">Business Smarter</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          A complete platform for car rental businesses. Handle bookings,
          invoicing, payments, fleet management, and financial reporting —
          all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm sm:text-base">
            Start for Free <ArrowRight size={16} />
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700 text-sm sm:text-base">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto mt-12 pt-12 border-t border-slate-800">
          {[
            { value: '100%', label: 'Responsive' },
            { value: 'Real-time', label: 'Data Updates' },
            { value: 'Secure', label: 'RLS Protected' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Everything you need to run your business
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Built for car rental businesses of all sizes. From single-location
            operators to multi-fleet enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: Receipt,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              title: 'Invoicing & Payments',
              desc: 'Auto-generate invoices, track payments, manage partial payments, and handle multiple payment methods including mobile money.',
            },
            {
              icon: Car,
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
              title: 'Fleet Management',
              desc: 'Track every vehicle in your fleet. Monitor availability, mileage, maintenance schedules, and insurance expiry dates.',
            },
            {
              icon: BarChart3,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              title: 'Financial Reports',
              desc: 'Real-time profit & loss reports, revenue trends, expense breakdowns, and monthly summaries with interactive charts.',
            },
            {
              icon: Users,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
              title: 'Customer Management',
              desc: 'Manage customer profiles, KYC verification, driving licences, rental history, and loyalty points all in one place.',
            },
            {
              icon: Shield,
              color: 'text-red-400',
              bg: 'bg-red-500/10 border-red-500/20',
              title: 'Role-Based Access',
              desc: 'Granular permissions for Super Admin, Accountant, Fleet Manager, Customer Support, and Customer roles.',
            },
            {
              icon: Globe,
              color: 'text-teal-400',
              bg: 'bg-teal-500/10 border-teal-500/20',
              title: 'Fully Responsive',
              desc: 'Works perfectly on desktop, tablet, and mobile. Manage your business from anywhere, on any device.',
            },
          ].map((feature) => (
            <div key={feature.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 hover:border-slate-700 transition-colors">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${feature.bg}`}>
                <feature.icon size={20} className={feature.color} />
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Accounts section highlight */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-br from-blue-600/10 via-slate-900 to-purple-600/10 border border-slate-800 rounded-2xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-xs font-medium mb-4">
                <Receipt size={12} /> Accounts Module
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Enterprise-level accounting built in
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Track every dollar coming in and going out. Our accounts module
                gives you complete financial visibility with real-time reports,
                automated invoice generation, and a full audit trail.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Auto-generated invoice numbers',
                  'Partial payment tracking',
                  'Late fees & damage charges',
                  'Profit & loss reports',
                  'Expense categorization',
                  'Outstanding balance alerts',
                  'Payment method breakdown',
                  'Full audit logging',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle size={15} className="text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini dashboard preview */}
            <div className="space-y-3">
              {[
                { label: 'Total Revenue', value: '$24,850.00', color: 'text-green-400', pct: '78%' },
                { label: 'Total Expenses', value: '$8,320.00', color: 'text-red-400', pct: '35%' },
                { label: 'Net Profit', value: '$16,530.00', color: 'text-blue-400', pct: '67%' },
                { label: 'Outstanding', value: '$3,200.00', color: 'text-amber-400', pct: '20%' },
              ].map((stat) => (
                <div key={stat.label}
                  className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className="flex-1 max-w-24">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stat.color === 'text-green-400' ? 'bg-green-500' :
                          stat.color === 'text-red-400' ? 'bg-red-500' :
                          stat.color === 'text-blue-400' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: stat.pct }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 w-8 text-right">{stat.pct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Built for every team member
          </h2>
          <p className="text-slate-400 text-sm">
            Different roles, different access. Everyone sees exactly what they need.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { role: 'Super Admin', desc: 'Full system access', color: 'border-blue-500/30 bg-blue-500/5' },
            { role: 'Accountant', desc: 'Finance & reports', color: 'border-green-500/30 bg-green-500/5' },
            { role: 'Fleet Manager', desc: 'Vehicles & bookings', color: 'border-purple-500/30 bg-purple-500/5' },
            { role: 'Customer Support', desc: 'Customer management', color: 'border-amber-500/30 bg-amber-500/5' },
            { role: 'Customer', desc: 'Self-service portal', color: 'border-teal-500/30 bg-teal-500/5' },
          ].map((r) => (
            <div key={r.role}
              className={`border rounded-xl p-4 text-center ${r.color}`}>
              <p className="text-white font-semibold text-sm">{r.role}</p>
              <p className="text-slate-400 text-xs mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-blue-600 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to manage your fleet?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Join car rental businesses already using CarRental to
            streamline their operations and grow their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-medium transition-colors text-sm sm:text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="text-slate-400 text-sm">CarRental</span>
          </div>
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} CarRental. Fleet & Accounts Management Platform.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}