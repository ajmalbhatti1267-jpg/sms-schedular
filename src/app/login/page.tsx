'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[44%] bg-[#0d0b1e] flex-col justify-between p-12 relative overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-lumio-700/25 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-700/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-800/10 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lumio-400 to-indigo-500 flex items-center justify-center shadow-lumio flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Lumio</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-5">
          <h2 className="text-white text-[2.6rem] font-bold leading-tight tracking-tight">
            Reach everyone,<br />
            <span className="bg-gradient-to-r from-lumio-300 to-indigo-300 bg-clip-text text-transparent">
              effortlessly.
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Schedule bulk messages to thousands of contacts with just a few clicks.
          </p>

          <div className="pt-2 space-y-3">
            {[
              'Upload contacts via Excel in seconds',
              'Personalise each message with {name}',
              'Schedule campaigns for any future time',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-lumio-600/30 border border-lumio-500/30 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" className="w-3 h-3">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <span className="text-slate-300 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Lumio. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lumio-500 to-indigo-500 flex items-center justify-center shadow-lumio">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900">Lumio</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1.5 text-sm">Sign in to your Lumio account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
