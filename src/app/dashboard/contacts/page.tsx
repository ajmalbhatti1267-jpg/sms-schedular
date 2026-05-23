'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Contact {
  id: string
  name?: string
  phone: string
  email?: string
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(data => { setContacts(data.contacts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c =>
    c.phone.includes(search) ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading...' : `${contacts.length} total contacts`}
          </p>
        </div>
        <div className="relative">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            className="input w-60 pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden animate-slide-up">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-14 bg-slate-100 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">All Contacts</h2>
              {search && (
                <span className="text-xs text-slate-400">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">
                  {search ? `No contacts matching "${search}"` : 'No contacts yet'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-xs text-lumio-600 hover:text-lumio-700 mt-2 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50">
                    {['Name', 'Phone', 'Email', 'Added'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-medium text-slate-400 text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-lumio-50 flex items-center justify-center text-xs font-bold text-lumio-600 flex-shrink-0 uppercase">
                            {c.name ? c.name[0] : '#'}
                          </div>
                          <span className="font-medium text-slate-800">{c.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.phone}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{c.email || '—'}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
