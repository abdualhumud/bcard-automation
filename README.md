# Business Card Automation

A mobile-first Next.js web app that digitizes business cards using **Gemini 1.5 Pro** and archives them to **Google Sheets** + **Google Drive**.

---

## Features

- **Mobile camera capture** — one tap opens the rear camera directly
- **Dual-language extraction** — Arabic and English support
- **AI self-verification** — Gemini performs a second pass to confirm the company name from logos/branding
- **Editable review table** — correct any field before saving
- **Smart sync** — checks email uniqueness; updates existing rows or appends new ones
- **Drive archiving** — every image stored in your Drive folder with a link in the sheet
- **30-second rate-limit cooldown** — stays within Gemini free tier

---

## Data Schema (Google Sheet columns)

| Column | Description |
|---|---|
| Company Name | Verified via logo (two-pass AI) |
| Full Name | Person's name |
| Job Title | e.g. General Manager of Procurement |
| Sector | e.g. Logistics, Real Estate |
| Mobile | Cell number(s) |
| Office Phone | Landline(s) |
| Email | Used as unique key for smart sync |
| Website | URL |
| Image Link | Google Drive view link |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Google Cloud — Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: **Google Drive API** and **Google Sheets API**
3. Create a **Service Account** and download a JSON key
4. Copy values from the JSON key into `.env.local`

### 3. Google Drive — Target Folder

1. Create a folder in Google Drive
2. Share it with the service account email as **Editor**
3. Copy the folder ID from its URL → `GOOGLE_DRIVE_FOLDER_ID`

### 4. Google Sheets — Master Sheet

1. Create your spreadsheet
2. Share it with the service account email as **Editor**
3. Copy the sheet ID from its URL → `GOOGLE_SHEET_ID`
4. The header row is created automatically on first sync

### 5. Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Generate a key → `GEMINI_API_KEY`

### 6. Environment file

```bash
cp .env.local.example .env.local
# Fill in all values
```

### 7. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

```bash
npx vercel
```

Set all variables in your Vercel project under **Settings → Environment Variables**.

> **Private key note:** Paste the raw value from the JSON file exactly as-is (with `\n` sequences). The app automatically converts `\n` to real newlines.

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Main UI: camera, review table, sync button
│   ├── globals.css
│   └── api/
│       ├── scan/route.ts       # POST: Gemini extraction (rate-limited)
│       └── sync/route.ts       # POST: Drive upload + Sheets smart-sync
├── components/
│   ├── CardDataTable.tsx       # Editable data table
│   └── StatusToast.tsx         # Toast notification system
├── lib/
│   ├── gemini.ts               # Two-pass AI extraction & verification
│   ├── google-drive.ts         # Drive upload helper
│   └── google-sheets.ts        # Sheets smart-sync helper
├── types/
│   └── card.ts                 # CardData type + constants
├── .env.local.example          # Environment variable template
└── vercel.json                 # Vercel deployment config
```
