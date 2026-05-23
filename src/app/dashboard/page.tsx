'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Job {
  id: string
  channel: 'SMS' | 'EMAIL'
  subject?: string
  message: string
  scheduledAt: string
  status: string
  totalContacts: number
  sentCount: number
  failedCount: number
  createdAt: string
}

const channelConfig: Record<string, { bg: string; text: string; dot: string }> = {
  SMS:   { bg: 'bg-lumio-50', text: 'text-lumio-700',  dot: 'bg-lumio-500' },
  EMAIL: { bg: 'bg-blue-50',  text: 'text-blue-700',   dot: 'bg-blue-500'  },
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:   { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending' },
  RUNNING:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Running' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  FAILED:    { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Failed' },
  CANCELLED: { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Cancelled' },
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const loadJobs = () => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadJobs() }, [])

  const triggerCron = async () => {
    setRunning(true)
    try {
      const res  = await fetch('/api/trigger', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.processed === 0) {
        toast('No pending campaigns due right now', { icon: 'ℹ️' })
      } else {
        toast.success(`Processed ${data.processed} campaign(s) — ${data.totalSent} sent, ${data.totalFailed} failed`)
      }
      loadJobs()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRunning(false)
    }
  }

  const totalSent   = jobs.reduce((s, j) => s + j.sentCount, 0)
  const totalFailed = jobs.reduce((s, j) => s + j.failedCount, 0)
  const successRate = totalSent + totalFailed > 0
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
    : 0

  const stats = [
    {
      label: 'Total Campaigns',
      value: jobs.length,
      iconColor: 'text-lumio-600 bg-lumio-50',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      label: 'Messages Sent',
      value: totalSent,
      iconColor: 'text-emerald-600 bg-emerald-50',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      ),
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      iconColor: 'text-blue-600 bg-blue-50',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      ),
    },
    {
      label: 'Failed',
      value: totalFailed,
      iconColor: 'text-red-500 bg-red-50',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerCron}
            disabled={running}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {running ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
            {running ? 'Sending...' : 'Run Now'}
          </button>
          <Link href="/dashboard/send" className="btn-primary text-sm flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="card p-5 hover:-translate-y-0.5 transition-transform duration-200 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl ${s.iconColor} flex items-center justify-center mb-4`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? <span className="inline-block w-12 h-7 bg-slate-100 rounded-lg animate-pulse" /> : s.value}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Recent Campaigns</h2>
          <span className="text-xs text-slate-400">{jobs.length} total</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="w-7 h-7">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold">No campaigns yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first campaign to get started</p>
            <Link href="/dashboard/send" className="btn-primary text-sm inline-flex items-center gap-2 mt-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Campaign
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                {['Channel', 'Message', 'Scheduled', 'Status', 'Recipients', 'Sent', 'Failed', ''].map(h => (
                  <th key={h} className="text-left px-6 py-3 font-medium text-slate-400 text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobs.map((job, i) => {
                const sc = statusConfig[job.status] ?? statusConfig.CANCELLED
                return (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50/80 transition-colors animate-fade-in"
                    style={{ animationDelay: `${(i + 4) * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      {(() => { const cc = channelConfig[job.channel] ?? channelConfig.SMS; return (
                        <span className={`badge ${cc.bg} ${cc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cc.dot}`} />
                          {job.channel}
                        </span>
                      )})()}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="truncate text-slate-800 font-medium">
                        {job.channel === 'EMAIL' && job.subject ? job.subject : job.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{format(new Date(job.createdAt), 'MMM d, h:mm a')}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {format(new Date(job.scheduledAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-center">{job.totalContacts}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold text-center">{job.sentCount}</td>
                    <td className="px-6 py-4 text-red-500 font-semibold text-center">{job.failedCount}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-lumio-600 hover:text-lumio-700 transition-colors"
                      >
                        Details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
