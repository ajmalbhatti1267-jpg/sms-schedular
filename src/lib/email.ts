import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <p style="font-size:15px;line-height:1.6;color:#1e293b">${body.replace(/\n/g, '<br/>')}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="font-size:12px;color:#94a3b8">Sent via Lumio Message Scheduler</p>
      </div>`,
    })
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error(`Email failed to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}
