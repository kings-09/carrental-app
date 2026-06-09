'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Car, CalendarCheck, Shield, Users,
  Receipt, CreditCard, TrendingDown, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, X,
} from 'lucide-react'

const allNavItems = [
  {
    label: 'Overview',
    roles: ['super_admin', 'accountant', 'fleet_manager', 'customer_support', 'customer'],
    items: [
      { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'accountant', 'fleet_manager', 'customer_support'] },
      { href: '/dashboard/customer', icon: LayoutDashboard, label: 'Dashboard', roles: ['customer'] },
    ],
  },
  {
    label: 'Operations',
    roles: ['super_admin', 'fleet_manager', 'customer_support'],
    items: [
      { href: '/dashboard/fleet', icon: Car, label: 'Fleet', roles: ['super_admin', 'fleet_manager'] },
      { href: '/dashboard/bookings', icon: CalendarCheck, label: 'Bookings', roles: ['super_admin', 'fleet_manager', 'customer_support'] },
      { href: '/dashboard/customers', icon: Users, label: 'Customers', roles: ['super_admin', 'customer_support'] },
    ],
  },
  {
    label: 'My Account',
    roles: ['customer'],
    items: [
      { href: '/dashboard/browse', icon: Car, label: 'Browse Cars', roles: ['customer'] },
      { href: '/dashboard/profile', icon: Users, label: 'My Profile', roles: ['customer'] },
      { href: '/dashboard/my-bookings', icon: CalendarCheck, label: 'My Bookings', roles: ['customer'] },
      { href: '/dashboard/my-invoices', icon: Receipt, label: 'My Invoices', roles: ['customer'] },
    ],
  },
  {
    label: 'Accounts',
    roles: ['super_admin', 'accountant'],
    items: [
      { href: '/dashboard/invoices', icon: Receipt, label: 'Invoices', roles: ['super_admin', 'accountant'] },
      { href: '/dashboard/payments', icon: CreditCard, label: 'Payments', roles: ['super_admin', 'accountant'] },
      { href: '/dashboard/expenses', icon: TrendingDown, label: 'Expenses', roles: ['super_admin', 'accountant'] },
      { href: '/dashboard/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'accountant'] },
    ],
  },
  {
    label: 'Admin',
    roles: ['super_admin'],
    items: [
      { href: '/dashboard/staff', icon: Users, label: 'Staff', roles: ['super_admin'] },
      { href: '/dashboard/audit', icon: Shield, label: 'Audit Log', roles: ['super_admin', 'accountant'] },
    ],
  },
  {
    label: 'System',
    roles: ['super_admin', 'accountant', 'fleet_manager', 'customer_support', 'customer'],
    items: [
      { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', roles: ['super_admin', 'accountant', 'fleet_manager', 'customer_support', 'customer'] },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'accountant', 'fleet_manager', 'customer_support', 'customer'] },
    ],
  },
]

export default function Sidebar({ open, onClose, role = 'customer' }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filteredNav = allNavItems
    .filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-30 flex flex-col transition-all duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-60',
          'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
          {collapsed ? (
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">C</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-white font-semibold text-sm">CarRental</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 ml-auto"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {filteredNav.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard/admin' &&
                      item.href !== '/dashboard/customer' &&
                      pathname.startsWith(item.href))
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors',
                          active
                            ? 'bg-blue-600/20 text-blue-400 font-medium'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        )}
                      >
                        <item.icon size={18} className={cn('shrink-0', active ? 'text-blue-400' : '')} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle desktop */}
        <div className="hidden lg:flex border-t border-slate-800 p-2 justify-end">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className={cn(
        'hidden lg:block shrink-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )} />
    </>
  )
}