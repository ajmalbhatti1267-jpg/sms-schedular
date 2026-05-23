import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processJobs } from '@/lib/process-jobs'

export const runtime = 'nodejs'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const result = await processJobs()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Trigger error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
