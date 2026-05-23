import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res  = await fetch(`${base}/api/cron`, {
    headers: { 'x-cron-secret': process.env.CRON_SECRET! },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
