import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'
import { sendEmail } from '@/lib/email'

export async function processJobs() {
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
    return { processed: 0, totalSent: 0, totalFailed: 0 }
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

      if (job.channel === 'EMAIL') {
        if (!log.email) {
          await prisma.messageLog.update({
            where: { id: log.id },
            data: { status: 'FAILED', errorMsg: 'No email address for contact' },
          })
          totalFailed++
          continue
        }
        const result = await sendEmail(log.email, job.subject!, personalised)
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

  return { processed: dueJobs.length, totalSent, totalFailed }
}
