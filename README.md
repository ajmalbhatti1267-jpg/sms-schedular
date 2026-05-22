# 📱 SMS Scheduler — Call Center Platform

A full-stack Next.js application that lets call center agents upload client Excel files, compose personalized SMS messages, and schedule bulk delivery via Twilio. Built for free-tier deployment on Vercel + Neon PostgreSQL.

---

## 🗺️ Project Overview

```
User uploads Excel → API parses phone numbers → User writes message
→ User picks date/time → Vercel Cron fires → Twilio sends SMS → Logs saved to DB
```

---

## 🏗️ Tech Stack

| Layer        | Technology               | Why / Notes                                      |
|-------------|--------------------------|--------------------------------------------------|
| Frontend    | Next.js 14 (App Router)  | Full-stack — UI + API in one framework           |
| Database    | Neon PostgreSQL (free)   | Serverless Postgres, generous free tier          |
| ORM         | Prisma                   | Type-safe DB queries, easy migrations            |
| SMS         | Twilio                   | Free trial credit (~$15), then ~$0.008/msg       |
| Scheduler   | Vercel Cron Jobs         | Built-in to Vercel, fires `/api/cron` on schedule|
| Excel Parse | ExcelJS                  | Read .xlsx/.xls, auto-detect columns             |
| Styling     | Tailwind CSS             | Utility-first, fast development                  |
| Hosting     | Vercel (free hobby tier) | One-click deploy, free SSL, global CDN           |

---

## 📁 Project Structure

```
sms-scheduler/
├── prisma/
│   └── schema.prisma          # Database schema (Contact, ScheduledJob, MessageLog)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with toast provider
│   │   ├── page.tsx            # Home / landing page with stats
│   │   ├── globals.css         # Tailwind + custom component classes
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Sidebar navigation layout
│   │   │   ├── page.tsx        # Jobs overview table
│   │   │   ├── send/
│   │   │   │   └── page.tsx    # 3-step campaign creator (upload → compose → review)
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx    # Contact list with search
│   │   │   └── jobs/
│   │   │       └── [id]/
│   │   │           └── page.tsx # Individual job detail (TODO: add this page)
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts    # POST — parse uploaded Excel file
│   │       ├── schedule/
│   │       │   └── route.ts    # POST — create ScheduledJob + MessageLogs
│   │       ├── cron/
│   │       │   └── route.ts    # GET — fires due jobs, sends SMS via Twilio
│   │       ├── jobs/
│   │       │   └── route.ts    # GET — list all jobs
│   │       ├── contacts/
│   │       │   └── route.ts    # GET — list all contacts
│   │       └── stats/
│   │           └── route.ts    # GET — dashboard counts
│   └── lib/
│       ├── prisma.ts           # Prisma client singleton
│       ├── twilio.ts           # Twilio client + sendSMS helper
│       └── excel-parser.ts     # ExcelJS parser — auto-detects Phone/Name/Email columns
├── vercel.json                 # Cron job config (runs /api/cron every minute)
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
├── .env.example                # Copy to .env.local and fill in values
└── .gitignore
```

---

## 🗄️ Database Schema

### `contacts`
Stores all client phone numbers from uploaded Excel files.

| Column     | Type      | Notes                          |
|-----------|-----------|--------------------------------|
| id        | String    | CUID primary key               |
| name      | String?   | Optional                       |
| phone     | String    | Unique, E.164 format (+92...)  |
| email     | String?   | Optional                       |
| createdAt | DateTime  | Auto                           |

### `scheduled_jobs`
Each campaign/bulk message send is one job.

| Column        | Type      | Notes                                    |
|--------------|-----------|------------------------------------------|
| id           | String    | CUID                                     |
| message      | String    | The SMS text. Use {name} for personalisation |
| scheduledAt  | DateTime  | When to send                             |
| status       | JobStatus | PENDING → RUNNING → COMPLETED / FAILED  |
| totalContacts| Int       | Number of recipients                     |
| sentCount    | Int       | Updated as sends complete                |
| failedCount  | Int       | Updated on errors                        |
| contactIds   | String[]  | Array of contact IDs                     |

### `message_logs`
One row per contact per job — tracks individual delivery.

| Column    | Type      | Notes                          |
|----------|-----------|--------------------------------|
| id       | String    | CUID                           |
| jobId    | String    | FK → scheduled_jobs            |
| contactId| String    | FK → contacts                  |
| phone    | String    | Denormalised for quick reads   |
| status   | LogStatus | PENDING → SENT / FAILED        |
| twilioSid| String?   | Twilio message SID for tracking|
| errorMsg | String?   | Error if send failed           |
| sentAt   | DateTime? | Timestamp of successful send   |

---

## 🔄 How the Scheduler Works

1. **User creates a campaign** → `POST /api/schedule` saves a `ScheduledJob` (status: `PENDING`) plus one `MessageLog` per contact.

2. **Vercel Cron** calls `GET /api/cron` every minute (configured in `vercel.json`).

3. **Cron handler** queries: `SELECT * FROM scheduled_jobs WHERE status = 'PENDING' AND scheduledAt <= NOW()`

4. For each due job:
   - Sets job status → `RUNNING`
   - Iterates all `PENDING` MessageLogs for that job
   - Calls `sendSMS(phone, message)` via Twilio for each
   - Updates each log: `SENT` (with Twilio SID) or `FAILED` (with error)
   - Sets final job status → `COMPLETED` or `FAILED`

5. **Personalisation**: `{name}` in the message is replaced with `contact.name` or `"Customer"` as fallback.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Neon PostgreSQL — from neon.tech dashboard
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Twilio — from twilio.com/console
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"  # Your Twilio number

# Security
CRON_SECRET="make-this-a-long-random-string"  # Protects /api/cron from abuse
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

---

## 🚀 Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your-username/sms-scheduler.git
cd sms-scheduler
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Push schema to Neon
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Run development server
npm run dev
# → http://localhost:3000
```

---

## 🌐 Vercel Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/sms-scheduler.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Add all environment variables from `.env.example`
4. Click **Deploy**

### Step 3 — Configure Cron Secret in vercel.json
Edit `vercel.json` and replace `YOUR_CRON_SECRET` with your actual value:
```json
{
  "crons": [
    {
      "path": "/api/cron?secret=your-actual-cron-secret",
      "schedule": "* * * * *"
    }
  ]
}
```

> ⚠️ **Note**: Vercel hobby (free) plan only allows cron jobs to run **once per day**. For per-minute scheduling, upgrade to Vercel Pro ($20/mo) OR use **QStash by Upstash** (free, 500 msg/day) — see section below.

---

## 🔁 Free Per-Minute Scheduling with QStash

If you need per-minute cron on the free tier:

1. Sign up at [upstash.com](https://upstash.com) → QStash
2. Create a new schedule:
   - **URL**: `https://your-app.vercel.app/api/cron`
   - **Schedule**: `* * * * *` (every minute)
   - Add header: `x-cron-secret: your-cron-secret`
3. Remove the cron entry from `vercel.json`

---

## 📊 Excel File Format

Your Excel file should have a header row. Column names are auto-detected (case-insensitive):

| Supported header names          | Mapped to |
|---------------------------------|-----------|
| Phone, Mobile, Number, Tel      | `phone`   |
| Name, Full Name, Client Name    | `name`    |
| Email, Email Address            | `email`   |

**Example:**
```
| Name          | Phone         | Email               |
|---------------|---------------|---------------------|
| Ahmed Khan    | +923001234567 | ahmed@example.com   |
| Sara Malik    | +923009876543 |                     |
```

Phone numbers are automatically normalised to E.164 format (e.g. `03001234567` → `+923001234567`).

---

## 💬 Message Personalisation

Use `{name}` anywhere in your message — it gets replaced with the contact's name:

```
Hello {name}, your appointment is confirmed for tomorrow at 10 AM. — City Clinic
```

If a contact has no name, it falls back to `"Customer"`.

---

## 🧩 API Reference

| Method | Endpoint        | Description                             |
|--------|----------------|-----------------------------------------|
| POST   | /api/upload    | Upload Excel, returns parsed contacts   |
| POST   | /api/schedule  | Create a new scheduled job              |
| GET    | /api/cron      | Run due jobs (called by scheduler)      |
| GET    | /api/jobs      | List all jobs (latest 50)               |
| GET    | /api/contacts  | List all contacts (latest 500)          |
| GET    | /api/stats     | Dashboard counts                        |

---

## 🛠️ Development Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Build for production
npx prisma studio    # Open Prisma DB GUI at :5555
npx prisma db push   # Sync schema changes to database
npx prisma generate  # Regenerate Prisma client after schema changes
```

---

## 🔮 Suggested Future Features (ask Claude to build these)

- [ ] **Job detail page** — `/dashboard/jobs/[id]` showing per-contact delivery status
- [ ] **Cancel/reschedule** — ability to cancel a pending job or change its time
- [ ] **WhatsApp support** — swap Twilio SMS for Twilio WhatsApp API
- [ ] **CSV upload** — support `.csv` files in addition to Excel
- [ ] **Auth** — add NextAuth.js so only your team can log in
- [ ] **Templates** — save and reuse message templates
- [ ] **Retry failed** — one-click retry for failed message logs
- [ ] **Webhook delivery status** — Twilio webhook to update log from SENT → DELIVERED
- [ ] **Export logs** — download campaign report as Excel/CSV
- [ ] **Contact groups** — tag contacts and send to specific groups

---

## 🐛 Troubleshooting

**`prisma generate` fails**
→ Run `npm install` first, then `npx prisma generate`

**Excel upload says "No phone column found"**
→ Make sure your header row has a column named Phone, Mobile, or Number

**SMS not sending**
→ Check Twilio credentials in `.env.local`. On free trial, you can only send to verified numbers.

**Cron not firing locally**
→ Test manually: `curl "http://localhost:3000/api/cron?secret=your-cron-secret"`

**`DATABASE_URL` error**
→ Make sure your Neon connection string ends with `?sslmode=require`

---

## 📄 License

MIT — free to use and modify.
