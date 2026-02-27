import { google } from 'googleapis';
import { CardData } from '@/types/card';

const HEADER_ROW = [
  'Company Name',
  'Full Name',
  'Job Title',
  'Sector',
  'Mobile',
  'Office Phone',
  'Email',
  'Website',
  'Image Link',
];

// Column index of "Email" in the header (0-based)
const EMAIL_COL = 6;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function cardToRow(card: CardData): string[] {
  return [
    card.companyName,
    card.fullName,
    card.jobTitle,
    card.sector,
    card.mobile,
    card.officePhone,
    card.email,
    card.website,
    card.imageLink,
  ];
}

export async function syncToSheet(
  card: CardData
): Promise<{ action: 'updated' | 'appended'; row?: number }> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
  const range = `${sheetName}!A:I`;

  // Fetch all existing data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  let values: string[][] = (response.data.values as string[][]) || [];

  // Ensure header row exists
  if (values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] },
    });
    values = [HEADER_ROW];
  }

  const newRow = cardToRow(card);
  const incomingEmail = card.email.toLowerCase().trim();

  // Smart sync: check for existing email (skip header at index 0)
  if (incomingEmail !== 'null') {
    for (let i = 1; i < values.length; i++) {
      const existingEmail = (values[i][EMAIL_COL] ?? '').toLowerCase().trim();
      if (existingEmail === incomingEmail) {
        const rowNumber = i + 1; // Sheets rows are 1-indexed
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${rowNumber}:I${rowNumber}`,
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] },
        });
        return { action: 'updated', row: rowNumber };
      }
    }
  }

  // No match found — append a new row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] },
  });

  return { action: 'appended' };
}
