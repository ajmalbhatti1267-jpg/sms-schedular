'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Job {
  id: string
  message: string
  scheduledAt: string
  status: string
  totalContacts: number
  sentCount: number
  failedCount: number
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700',
  RUNNING:   'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  FAILED:    'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-50 text-gray-600',
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">All scheduled campaigns</p>
        </div>
        <Link href="/dashboard/send" className="btn-primary text-sm">
          + New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">No campaigns yet.</p>
          <Link href="/dashboard/send" className="btn-primary text-sm inline-block mt-4">
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Message', 'Scheduled At', 'Status', 'Contacts', 'Sent', 'Failed', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-gray-900">{job.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(job.createdAt), 'MMM d, h:mm a')}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {format(new Date(job.scheduledAt), 'MMM d yyyy, h:mm a')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[job.status] || 'bg-gray-50 text-gray-600'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{job.totalContacts}</td>
                  <td className="px-4 py-3 text-green-600 text-center">{job.sentCount}</td>
                  <td className="px-4 py-3 text-red-500 text-center">{job.failedCount}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/jobs/${job.id}`}
                      className="text-xs text-brand-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
