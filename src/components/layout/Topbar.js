'use client'

import { useState } from 'react'
import { signOut } from '@/app/actions/auth'
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import ThemeToggle from '@/components/layout/ThemeToggle'

export default function Topbar({ onMenuClick, user, profile }) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const roleLabel = {
    super_admin: 'Super Admin',
    accountant: 'Accountant',
    fleet_manager: 'Fleet Manager',
    customer_support: 'Support',
    customer: 'Customer',
  }

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left — hamburger + page context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right — theme + notifications + user menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Link
                href="/dashboard/notifications"
                className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer text-sm"
              >
            <Bell size={18} />
          </Link>
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-800 transition-colors">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white leading-tight truncate max-w-28">
                  {profile?.full_name ?? user?.email}
                </p>
                <p className="text-xs text-slate-400 leading-tight">
                  {roleLabel[profile?.role] ?? 'User'}
                </p>
              </div>
              <ChevronDown size={14} className="hidden sm:block text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 bg-slate-900 border-slate-700"
          >
            <DropdownMenuLabel className="text-slate-300 text-xs">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer text-sm"
              >
                <User size={14} /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer text-sm"
              >
                <Settings size={14} /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={signOut}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer text-sm"
            >
              <LogOut size={14} /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}