import { NextRequest, NextResponse } from 'next/server'
import { processJobs } from '@/lib/process-jobs'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ||
                 req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const result = await processJobs()
    if (result.processed === 0) {
      return NextResponse.json({ message: 'No jobs due', processed: 0 })
    }
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
