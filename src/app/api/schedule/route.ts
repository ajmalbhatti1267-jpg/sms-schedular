// src/app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface ScheduleBody {
  contacts: { name?: string; phone: string; email?: string }[]
  message: string
  scheduledAt: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ScheduleBody = await req.json()
    const { contacts, message, scheduledAt } = body

    if (!contacts?.length) return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    if (!message?.trim())  return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    if (!scheduledAt)      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 })

    const scheduledDate = new Date(scheduledAt)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt date' }, { status: 400 })
    }

    // Upsert contacts (avoid duplicates by phone number)
    const savedContacts = await Promise.all(
      contacts.map(c =>
        prisma.contact.upsert({
          where: { phone: c.phone },
          update: { name: c.name, email: c.email },
          create: { phone: c.phone, name: c.name, email: c.email },
        })
      )
    )

    const contactIds = savedContacts.map(c => c.id)

    // Create the scheduled job
    const job = await prisma.scheduledJob.create({
      data: {
        message: message.trim(),
        scheduledAt: scheduledDate,
        totalContacts: contactIds.length,
        contactIds,
        status: 'PENDING',
      },
    })

    // Pre-create message log entries
    await prisma.messageLog.createMany({
      data: savedContacts.map(contact => ({
        jobId: job.id,
        contactId: contact.id,
        phone: contact.phone,
        status: 'PENDING',
      })),
    })

    return NextResponse.json({ success: true, jobId: job.id })
  } catch (error: any) {
    console.error('Schedule error:', error)
    return NextResponse.json({ error: error.message || 'Failed to schedule' }, { status: 500 })
  }
}
