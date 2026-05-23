'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface MessageLog {
  id: string
  phone: string
  email?: string
  status: string
  twilioSid?: string
  emailMsgId?: string
  errorMsg?: string
  sentAt?: string
  contact: { name?: string }
}

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
  messageLogs: MessageLog[]
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:   { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending' },
  RUNNING:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Running' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  FAILED:    { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Failed' },
  CANCELLED: { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Cancelled' },
  SENT:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Sent' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Delivered' },
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.json())
      .then(data => { setJob(data.job); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="animate-fade-in max-w-4xl">
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse mb-8" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">Campaign not found</p>
        <Link href="/dashboard" className="text-lumio-600 text-sm mt-2 inline-block">← Back to dashboard</Link>
      </div>
    )
  }

  const sc = statusConfig[job.status] ?? statusConfig.CANCELLED
  const successRate = job.sentCount + job.failedCount > 0
    ? Math.round((job.sentCount / (job.sentCount + job.failedCount)) * 100)
    : 0

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {job.channel === 'EMAIL' && job.subject ? job.subject : 'Campaign Details'}
            </h1>
            <span className={`badge ${job.channel === 'SMS' ? 'bg-lumio-50 text-lumio-700' : 'bg-blue-50 text-blue-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${job.channel === 'SMS' ? 'bg-lumio-500' : 'bg-blue-500'}`} />
              {job.channel}
            </span>
          </div>
          <p className="text-sm text-slate-400">Created {format(new Date(job.createdAt), 'MMM d, yyyy · h:mm a')}</p>
        </div>
        <span className={`badge ${sc.bg} ${sc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Recipients', value: job.totalContacts, color: 'text-slate-900' },
          { label: 'Sent',             value: job.sentCount,     color: 'text-emerald-600' },
          { label: 'Failed',           value: job.failedCount,   color: 'text-red-500' },
          { label: 'Success Rate',     value: `${successRate}%`, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={s.label} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Campaign info */}
      <div className="card p-6 mb-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h2 className="font-semibold text-slate-900 mb-4 text-sm">Campaign Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            <span className="text-slate-400 w-32 flex-shrink-0">Scheduled At</span>
            <span className="text-slate-800 font-medium">
              {format(new Date(job.scheduledAt), 'MMMM d, yyyy · h:mm a')}
            </span>
          </div>
          {job.channel === 'EMAIL' && job.subject && (
            <div className="flex gap-4">
              <span className="text-slate-400 w-32 flex-shrink-0">Subject</span>
              <span className="text-slate-800 font-medium">{job.subject}</span>
            </div>
          )}
          <div className="flex gap-4">
            <span className="text-slate-400 w-32 flex-shrink-0">Message</span>
            <span className="text-slate-800 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed flex-1">
              {job.message}
            </span>
          </div>
        </div>
      </div>

      {/* Message logs table */}
      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Delivery Log</h2>
          <span className="text-xs text-slate-400">{job.messageLogs.length} recipients</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              {['Recipient', job.channel === 'EMAIL' ? 'Email' : 'Phone', 'Status', 'Sent At', 'ID'].map(h => (
                <th key={h} className="text-left px-6 py-3 font-medium text-slate-400 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {job.messageLogs.map((log, i) => {
              const ls = statusConfig[log.status] ?? statusConfig.PENDING
              return (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/80 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lumio-50 flex items-center justify-center text-xs font-bold text-lumio-600 flex-shrink-0 uppercase">
                        {log.contact.name ? log.contact.name[0] : '#'}
                      </div>
                      <span className="font-medium text-slate-800">{log.contact.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {job.channel === 'EMAIL' ? (log.email || '—') : log.phone}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${ls.bg} ${ls.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ls.dot}`} />
                      {ls.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {log.sentAt ? format(new Date(log.sentAt), 'MMM d, h:mm a') : '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-[140px] truncate">
                    {(job.channel === 'EMAIL' ? log.emailMsgId : log.twilioSid) || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {job.messageLogs.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No logs yet</div>
        )}
      </div>
    </div>
  )
}
