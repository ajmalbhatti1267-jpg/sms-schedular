import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.scheduledJob.findUnique({
      where: { id: params.id },
      include: {
        messageLogs: {
          include: { contact: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    return NextResponse.json({ job })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
