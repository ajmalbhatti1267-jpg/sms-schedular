'use client'
// src/app/dashboard/send/page.tsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Contact {
  name?: string
  phone: string
  email?: string
}

type Step = 'upload' | 'compose' | 'review'

export default function SendPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // STEP 1: File upload
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
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
               'application/vnd.ms-excel': ['.xls'] },
    multiple: false,
  })

  // STEP 3: Submit
  const handleSchedule = async () => {
    if (!message.trim()) return toast.error('Please write a message')
    if (!scheduledAt) return toast.error('Please select a schedule time')
    if (contacts.length === 0) return toast.error('No contacts loaded')

    const scheduled = new Date(scheduledAt)
    if (scheduled <= new Date()) return toast.error('Schedule time must be in the future')

    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, message, scheduledAt: scheduled.toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to schedule')

      toast.success(`Campaign scheduled for ${contacts.length} contacts!`)
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewMessage = (contact: Contact) =>
    message.replace(/{name}/gi, contact.name || 'Customer')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload contacts, compose your message, and schedule delivery.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'compose', 'review'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              step === s ? 'bg-brand-600 text-white' :
              (i < ['upload','compose','review'].indexOf(step)) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < ['upload','compose','review'].indexOf(step) ? '✓' : i + 1}
            </div>
            <span className={`text-sm capitalize ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Upload Client Excel File</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your file should have columns for: <strong>Phone</strong> (required), Name, Email.
          </p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-4xl mb-3">📂</div>
            {uploading ? (
              <p className="text-gray-500">Parsing your file...</p>
            ) : isDragActive ? (
              <p className="text-brand-600 font-medium">Drop it here!</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">Drag & drop your Excel file here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse — .xlsx, .xls supported</p>
              </>
            )}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <strong>Expected columns:</strong> Name, Phone / Mobile / Number, Email (header names auto-detected)
          </div>
        </div>
      )}

      {/* STEP 2: Compose */}
      {step === 'compose' && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Contacts Loaded</h2>
              <span className="badge bg-green-50 text-green-700">{contacts.length} contacts</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {contacts.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">{i+1}</span>
                  <span className="font-medium">{c.name || '—'}</span>
                  <span className="text-gray-400">{c.phone}</span>
                </div>
              ))}
              {contacts.length > 5 && (
                <p className="text-xs text-gray-400 pl-8">+{contacts.length - 5} more contacts</p>
              )}
            </div>
            <button onClick={() => setStep('upload')} className="text-xs text-brand-600 hover:underline mt-2 block">
              ← Re-upload file
            </button>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Compose Message</h2>
            <textarea
              className="input resize-none h-28"
              placeholder="Hello {name}, this is a reminder from our team..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={160}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise</p>
              <p className={`text-xs ${message.length > 140 ? 'text-amber-600' : 'text-gray-400'}`}>
                {message.length}/160
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Schedule Date & Time</h2>
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
              if (!scheduledAt) return toast.error('Please select a schedule time')
              setStep('review')
            }}
            className="btn-primary w-full"
          >
            Review Campaign →
          </button>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Review Before Sending</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total recipients</span>
                <span className="font-medium">{contacts.length} contacts</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Scheduled at</span>
                <span className="font-medium">{scheduledAt ? new Date(scheduledAt).toLocaleString() : '—'}</span>
              </div>
              <div className="py-2 border-b border-gray-100">
                <p className="text-gray-500 mb-1">Message preview</p>
                <p className="bg-gray-50 rounded p-3 text-gray-800">
                  {contacts[0] ? previewMessage(contacts[0]) : message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('compose')} className="btn-secondary flex-1">
              ← Edit
            </button>
            <button onClick={handleSchedule} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Scheduling...' : '✓ Confirm & Schedule'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
