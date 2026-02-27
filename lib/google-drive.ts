import { google } from 'googleapis';
import { Readable } from 'stream';

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
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function uploadToDrive(
  imageBase64: string,
  mimeType: string,
  filename: string
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const buffer = Buffer.from(imageBase64, 'base64');
  const stream = Readable.from(buffer);

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const file = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = file.data.id!;

  // Make the file publicly viewable (read-only)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return (
    file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
  );
}
