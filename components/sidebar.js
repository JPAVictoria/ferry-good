'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Ship, History, Users, LogOut, Anchor } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-800',
  REGISTER: 'bg-blue-100 text-blue-800',
  CLIENT: 'bg-green-100 text-green-800',
}

export default function Sidebar({ user }) {
  const pathname = usePathname()
  const role = user?.role

  const navItems = [
    {
      href: '/schedules',
      label: 'Schedules',
      icon: Ship,
      roles: ['ADMIN', 'REGISTER', 'CLIENT'],
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
      roles: ['ADMIN', 'REGISTER'],
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
      roles: ['ADMIN'],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="bg-teal-500 rounded-lg p-2">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg leading-tight block">Ferry Good</span>
          <span className="text-xs text-slate-400">Scheduling System</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-slate-700" />

      {/* User section */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-teal-700 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', ROLE_COLORS[role])}>
            {role}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
