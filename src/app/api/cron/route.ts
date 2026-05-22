// src/app/api/cron/route.ts
// This route is called by Vercel Cron or QStash every minute.
// It finds all PENDING jobs due to fire and sends SMS via Twilio.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel max for hobby plan

export async function GET(req: NextRequest) {
  // Validate cron secret to prevent unauthorised calls
  const secret = req.headers.get('x-cron-secret') ||
                 req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    // Find all PENDING jobs scheduled for now or earlier
    const dueJobs = await prisma.scheduledJob.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      include: {
        messageLogs: {
          where: { status: 'PENDING' },
          include: { contact: true },
        },
      },
    })

    if (dueJobs.length === 0) {
      return NextResponse.json({ message: 'No jobs due', processed: 0 })
    }

    let totalSent = 0
    let totalFailed = 0

    for (const job of dueJobs) {
      // Mark job as RUNNING
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: 'RUNNING' },
      })

      // Send SMS to each contact
      for (const log of job.messageLogs) {
        const personalised = job.message.replace(
          /{name}/gi,
          log.contact.name || 'Customer'
        )

        const result = await sendSMS(log.phone, personalised)

        if (result.success) {
          await prisma.messageLog.update({
            where: { id: log.id },
            data: { status: 'SENT', twilioSid: result.sid, sentAt: new Date() },
          })
          totalSent++
        } else {
          await prisma.messageLog.update({
            where: { id: log.id },
            data: { status: 'FAILED', errorMsg: result.error },
          })
          totalFailed++
        }
      }

      // Determine final job status
      const allLogs = await prisma.messageLog.findMany({ where: { jobId: job.id } })
      const allDone = allLogs.every(l => l.status !== 'PENDING')
      const hasAnySuccess = allLogs.some(l => l.status === 'SENT' || l.status === 'DELIVERED')

      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status: allDone ? (hasAnySuccess ? 'COMPLETED' : 'FAILED') : 'RUNNING',
          sentCount: allLogs.filter(l => l.status === 'SENT' || l.status === 'DELIVERED').length,
          failedCount: allLogs.filter(l => l.status === 'FAILED').length,
        },
      })
    }

    return NextResponse.json({
      processed: dueJobs.length,
      totalSent,
      totalFailed,
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
