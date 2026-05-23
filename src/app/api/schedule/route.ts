import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface ScheduleBody {
  contacts: { name?: string; phone: string; email?: string }[]
  message:     string
  scheduledAt: string
  channel:     'SMS' | 'EMAIL'
  subject?:    string
}

export async function POST(req: NextRequest) {
  try {
    const body: ScheduleBody = await req.json()
    const { contacts, message, scheduledAt, channel = 'SMS', subject } = body

    if (!contacts?.length) return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    if (!message?.trim())  return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    if (!scheduledAt)      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 })
    if (channel === 'EMAIL' && !subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required for email campaigns' }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 })
    }

    const savedContacts = await Promise.all(
      contacts.map(c =>
        prisma.contact.upsert({
          where:  { phone: c.phone },
          update: { name: c.name, email: c.email },
          create: { phone: c.phone, name: c.name, email: c.email },
        })
      )
    )

    const contactIds = savedContacts.map(c => c.id)

    const job = await prisma.scheduledJob.create({
      data: {
        channel,
        subject:       subject?.trim() || null,
        message:       message.trim(),
        scheduledAt:   scheduledDate,
        totalContacts: contactIds.length,
        contactIds,
        status: 'PENDING',
      },
    })

    await prisma.messageLog.createMany({
      data: savedContacts.map(contact => ({
        jobId:     job.id,
        contactId: contact.id,
        phone:     contact.phone,
        email:     contact.email ?? null,
        status:    'PENDING',
      })),
    })

    return NextResponse.json({ success: true, jobId: job.id })
  } catch (error: any) {
    console.error('Schedule error:', error)
    return NextResponse.json({ error: error.message || 'Failed to schedule' }, { status: 500 })
  }
}
