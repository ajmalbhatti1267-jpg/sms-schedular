'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Contact {
  name?: string
  phone: string
  email?: string
}

type Channel = 'SMS' | 'EMAIL'
type Step = 'upload' | 'compose' | 'review'
const STEPS: Step[] = ['upload', 'compose', 'review']
const STEP_LABELS: Record<Step, string> = { upload: 'Upload', compose: 'Compose', review: 'Review' }

export default function SendPage() {
  const router = useRouter()
  const [channel, setChannel] = useState<Channel>('SMS')
  const [step, setStep] = useState<Step>('upload')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setContacts(data.contacts)
      toast.success(`${data.contacts.length} contacts loaded!`)
      setStep('compose')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  })

  const handleSchedule = async () => {
    if (!message.trim()) return toast.error('Please write a message')
    if (channel === 'EMAIL' && !subject.trim()) return toast.error('Please enter a subject line')
    if (!scheduledAt) return toast.error('Please select a schedule time')
    if (contacts.length === 0) return toast.error('No contacts loaded')
    const scheduled = new Date(scheduledAt)
    if (scheduled <= new Date()) return toast.error('Schedule time must be in the future')

    if (channel === 'EMAIL') {
      const withEmail = contacts.filter(c => c.email)
      if (withEmail.length === 0) return toast.error('No contacts have an email address')
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          message,
          scheduledAt: scheduled.toISOString(),
          channel,
          subject: channel === 'EMAIL' ? subject : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to schedule')
      toast.success('Campaign scheduled successfully!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewMessage = (c: Contact) => message.replace(/{name}/gi, c.name || 'Customer')
  const currentIdx = STEPS.indexOf(step)

  const emailCount = contacts.filter(c => c.email).length

  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        <p className="text-sm text-slate-400 mt-0.5">Upload contacts, compose your message, and schedule delivery.</p>
      </div>

      {/* Channel selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {(['SMS', 'EMAIL'] as Channel[]).map(ch => (
          <button
            key={ch}
            onClick={() => { setChannel(ch); setStep('upload'); setContacts([]) }}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
              channel === ch
                ? 'border-lumio-500 bg-lumio-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              channel === ch ? 'bg-lumio-600' : 'bg-slate-100'
            }`}>
              {ch === 'SMS' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke={channel === ch ? 'white' : '#94a3b8'} strokeWidth="1.8" className="w-5 h-5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke={channel === ch ? 'white' : '#94a3b8'} strokeWidth="1.8" className="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-semibold text-sm ${channel === ch ? 'text-lumio-700' : 'text-slate-700'}`}>
                {ch === 'SMS' ? 'SMS Campaign' : 'Email Campaign'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {ch === 'SMS' ? 'Send via Twilio to phone numbers' : 'Send via Gmail to email addresses'}
              </p>
            </div>
            {channel === ch && (
              <div className="ml-auto w-5 h-5 rounded-full bg-lumio-600 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                i < currentIdx
                  ? 'bg-lumio-600 text-white'
                  : i === currentIdx
                  ? 'bg-lumio-600 text-white ring-4 ring-lumio-100'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {i < currentIdx ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-sm font-medium transition-colors duration-200 ${i <= currentIdx ? 'text-slate-800' : 'text-slate-400'}`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-14 mx-4 transition-all duration-500 ${i < currentIdx ? 'bg-lumio-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="card p-8 animate-slide-up">
          <h2 className="font-semibold text-slate-900 mb-1">Upload Contact File</h2>
          <p className="text-sm text-slate-500 mb-6">
            {channel === 'SMS'
              ? 'Your Excel file needs a Phone column (required), Name and Email optional.'
              : 'Your Excel file needs an Email column (required), Name and Phone optional.'}
          </p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-lumio-400 bg-lumio-50' : 'border-slate-200 hover:border-lumio-300 hover:bg-slate-50/80'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200 ${
              isDragActive ? 'bg-lumio-100' : 'bg-slate-100'
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke={isDragActive ? '#7c3aed' : '#94a3b8'} strokeWidth="1.5" className="w-7 h-7">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-lumio-600 font-medium">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Parsing your file...
              </div>
            ) : isDragActive ? (
              <p className="text-lumio-600 font-semibold">Drop it here!</p>
            ) : (
              <>
                <p className="text-slate-700 font-semibold">Drop your Excel file here</p>
                <p className="text-sm text-slate-400 mt-1.5">or click to browse — .xlsx, .xls supported</p>
              </>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span><strong>Expected columns:</strong> Name, Phone / Mobile / Number, Email — header names are auto-detected</span>
          </div>
        </div>
      )}

      {/* STEP 2: Compose */}
      {step === 'compose' && (
        <div className="space-y-4 animate-slide-up">
          {/* Contacts summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" className="w-3.5 h-3.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h2 className="font-semibold text-slate-900 text-sm">Contacts Loaded</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {contacts.length} total
                </span>
                {channel === 'EMAIL' && (
                  <span className="badge bg-blue-50 text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {emailCount} with email
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {contacts.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-lumio-50 flex items-center justify-center text-xs font-semibold text-lumio-600 flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="font-medium text-slate-700">{c.name || '—'}</span>
                  <span className="text-slate-400 text-xs font-mono">
                    {channel === 'EMAIL' ? (c.email || <span className="text-red-400">no email</span>) : c.phone}
                  </span>
                </div>
              ))}
              {contacts.length > 4 && (
                <p className="text-xs text-slate-400 pl-9">+{contacts.length - 4} more contacts</p>
              )}
            </div>
            <button onClick={() => setStep('upload')} className="mt-3 text-xs text-lumio-600 hover:text-lumio-700 font-medium flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Re-upload file
            </button>
          </div>

          {/* Subject (email only) */}
          {channel === 'EMAIL' && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Email Subject</h2>
              <input
                type="text"
                className="input"
                placeholder="e.g. Reminder from our team"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>
          )}

          {/* Message */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">
              {channel === 'EMAIL' ? 'Email Body' : 'Message'}
            </h2>
            <textarea
              className="input resize-none h-28 font-mono text-sm"
              placeholder={channel === 'EMAIL'
                ? 'Hello {name}, we wanted to reach out...'
                : 'Hello {name}, this is a reminder from our team...'}
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={channel === 'SMS' ? 160 : 2000}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">
                Use{' '}
                <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{'{name}'}</code>
                {' '}to personalise each message
              </p>
              {channel === 'SMS' && (
                <p className={`text-xs font-medium transition-colors ${message.length > 140 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {message.length}/160
                </p>
              )}
            </div>
          </div>

          {/* Schedule time */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Schedule Date & Time</h2>
            <input
              type="datetime-local"
              className="input"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <button
            onClick={() => {
              if (!message.trim()) return toast.error('Please write a message')
              if (channel === 'EMAIL' && !subject.trim()) return toast.error('Please enter a subject line')
              if (!scheduledAt) return toast.error('Please select a schedule time')
              setStep('review')
            }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Review Campaign
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 'review' && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">Review Campaign</h2>
              <span className={`badge ${channel === 'SMS' ? 'bg-lumio-50 text-lumio-700' : 'bg-blue-50 text-blue-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${channel === 'SMS' ? 'bg-lumio-500' : 'bg-blue-500'}`} />
                {channel} Campaign
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-semibold">Recipients</p>
                <p className="text-3xl font-bold text-slate-900">
                  {channel === 'EMAIL' ? emailCount : contacts.length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {channel === 'EMAIL' ? 'contacts with email' : 'contacts'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-semibold">Scheduled At</p>
                {scheduledAt ? (
                  <>
                    <p className="text-base font-bold text-slate-900">{format(new Date(scheduledAt), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{format(new Date(scheduledAt), 'h:mm a')}</p>
                  </>
                ) : <p className="text-slate-400">—</p>}
              </div>
            </div>

            {channel === 'EMAIL' && subject && (
              <div className="mb-4">
                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-semibold">Subject</p>
                <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-xl px-4 py-3">{subject}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] text-slate-400 mb-2.5 uppercase tracking-widest font-semibold">Message Preview</p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-lumio-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {channel === 'SMS' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    )}
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {contacts[0] ? previewMessage(contacts[0]) : message}
                  </p>
                </div>
                {contacts[0]?.name && (
                  <p className="text-xs text-slate-400 mt-2 pl-11">Previewing for: {contacts[0].name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('compose')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Edit
            </button>
            <button onClick={handleSchedule} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scheduling...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Confirm & Schedule
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
