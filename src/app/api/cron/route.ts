import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ||
                 req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
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
      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: { status: 'RUNNING' },
      })

      for (const log of job.messageLogs) {
        const personalised = job.message.replace(/{name}/gi, log.contact.name || 'Customer')
        let result: { success: boolean; sid?: string; messageId?: string; error?: string }

        if (job.channel === 'EMAIL') {
          if (!log.email) {
            await prisma.messageLog.update({
              where: { id: log.id },
              data: { status: 'FAILED', errorMsg: 'No email address for contact' },
            })
            totalFailed++
            continue
          }
          result = await sendEmail(log.email, job.subject!, personalised)
          if (result.success) {
            await prisma.messageLog.update({
              where: { id: log.id },
              data: { status: 'SENT', emailMsgId: result.messageId, sentAt: new Date() },
            })
            totalSent++
          } else {
            await prisma.messageLog.update({
              where: { id: log.id },
              data: { status: 'FAILED', errorMsg: result.error },
            })
            totalFailed++
          }
        } else {
          result = await sendSMS(log.phone, personalised)
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
      }

      const allLogs = await prisma.messageLog.findMany({ where: { jobId: job.id } })
      const allDone = allLogs.every(l => l.status !== 'PENDING')
      const hasAnySuccess = allLogs.some(l => l.status === 'SENT' || l.status === 'DELIVERED')

      await prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          status:      allDone ? (hasAnySuccess ? 'COMPLETED' : 'FAILED') : 'RUNNING',
          sentCount:   allLogs.filter(l => l.status === 'SENT' || l.status === 'DELIVERED').length,
          failedCount: allLogs.filter(l => l.status === 'FAILED').length,
        },
      })
    }

    return NextResponse.json({ processed: dueJobs.length, totalSent, totalFailed })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
