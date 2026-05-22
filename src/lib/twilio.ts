// src/lib/twilio.ts
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken  = process.env.TWILIO_AUTH_TOKEN!
const fromNumber = process.env.TWILIO_PHONE_NUMBER!

export const twilioClient = twilio(accountSid, authToken)

export async function sendSMS(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to,
    })
    return { success: true, sid: message.sid }
  } catch (error: any) {
    console.error(`SMS failed to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}
