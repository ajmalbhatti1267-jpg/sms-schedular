// src/app/api/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const [totalContacts, totalJobs, pendingJobs, sentToday] = await Promise.all([
      prisma.contact.count(),
      prisma.scheduledJob.count(),
      prisma.scheduledJob.count({ where: { status: 'PENDING' } }),
      prisma.messageLog.count({
        where: {
          status: { in: ['SENT', 'DELIVERED'] },
          sentAt: { gte: startOfDay(new Date()) },
        },
      }),
    ])

    return NextResponse.json({ totalContacts, totalJobs, pendingJobs, sentToday })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
