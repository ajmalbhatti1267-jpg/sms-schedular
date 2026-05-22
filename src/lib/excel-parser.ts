// src/lib/excel-parser.ts
import ExcelJS from 'exceljs'

export interface ParsedContact {
  name?: string
  phone: string
  email?: string
}

export async function parseExcelFile(buffer: Buffer): Promise<ParsedContact[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('No worksheet found in the Excel file.')

  const contacts: ParsedContact[] = []

  // Read header row to detect column positions
  const headerRow = worksheet.getRow(1)
  const headers: Record<string, number> = {}

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value ?? '').toLowerCase().trim()
    if (val.includes('name'))  headers.name  = colNumber
    if (val.includes('phone') || val.includes('mobile') || val.includes('number')) headers.phone = colNumber
    if (val.includes('email')) headers.email = colNumber
  })

  // If no phone header found, assume first column with numbers is phone
  if (!headers.phone) {
    // Try to detect by scanning first data row
    const dataRow = worksheet.getRow(2)
    dataRow.eachCell((cell, colNumber) => {
      const val = String(cell.value ?? '').replace(/\s/g, '')
      if (!headers.phone && /^\+?\d{7,15}$/.test(val)) {
        headers.phone = colNumber
      }
    })
  }

  if (!headers.phone) {
    throw new Error(
      'Could not detect phone number column. Make sure your Excel has a column with header "Phone", "Mobile", or "Number".'
    )
  }

  // Parse data rows (skip header)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // skip header

    const phoneCell = row.getCell(headers.phone)
    let phone = String(phoneCell.value ?? '').replace(/\s|-|\(|\)/g, '').trim()

    if (!phone) return

    // Ensure E.164 format — add + if missing
    if (!phone.startsWith('+')) {
      // If starts with 0, assume local — strip it and add country code note
      if (phone.startsWith('0')) phone = phone.substring(1)
      phone = '+' + phone
    }

    // Basic validation — must be 7-15 digits after +
    if (!/^\+\d{7,15}$/.test(phone)) return

    const contact: ParsedContact = { phone }

    if (headers.name) {
      const name = String(row.getCell(headers.name).value ?? '').trim()
      if (name) contact.name = name
    }

    if (headers.email) {
      const email = String(row.getCell(headers.email).value ?? '').trim()
      if (email) contact.email = email
    }

    contacts.push(contact)
  })

  if (contacts.length === 0) {
    throw new Error('No valid phone numbers found in the Excel file.')
  }

  return contacts
}
