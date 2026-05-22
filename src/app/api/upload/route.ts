// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseExcelFile } from '@/lib/excel-parser'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contacts = await parseExcelFile(buffer)

    return NextResponse.json({ contacts, total: contacts.length })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 400 })
  }
}
