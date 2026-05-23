'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/send',
    label: 'New Campaign',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0d0b1e] flex flex-col py-6 fixed h-full">
        {/* Logo */}
        <div className="px-5 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lumio-400 to-indigo-500 flex items-center justify-center shadow-lumio flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight tracking-tight">Lumio</p>
              <p className="text-slate-600 text-[10px] leading-tight uppercase tracking-widest">Scheduler</p>
            </div>
          </Link>
        </div>

        {/* Nav label */}
        <div className="px-5 mb-2">
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">Menu</p>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map((item, i) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in-left ${
                  active
                    ? 'bg-lumio-600/15 text-lumio-300 border border-lumio-600/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={active ? 'text-lumio-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lumio-400 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-auto px-3 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
