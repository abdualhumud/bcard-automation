import { google } from 'googleapis';
import { Readable } from 'stream';

function getDriveAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/devstorage.full_control',
    ],
  });
}

// ── Google Cloud Storage upload (service accounts have full access to their project) ─
async function uploadToGCS(
  imageBase64: string,
  mimeType: string,
  filename: string
): Promise<string> {
  const auth = getDriveAuth();
  const storage = google.storage({ version: 'v1', auth });
  const projectId = process.env.GOOGLE_PROJECT_ID!;
  const bucket = `bcard-images-${projectId}`;

  // Ensure bucket exists
  try {
    await storage.buckets.get({ bucket });
  } catch {
    // Bucket doesn't exist — create it
    await storage.buckets.insert({
      project: projectId,
      requestBody: {
        name: bucket,
        location: 'US',
        storageClass: 'STANDARD',
        iamConfiguration: { uniformBucketLevelAccess: { enabled: true } },
      },
    });
    // Make all objects in bucket publicly readable
    await storage.buckets.setIamPolicy({
      bucket,
      requestBody: {
        bindings: [
          { role: 'roles/storage.objectViewer', members: ['allUsers'] },
        ],
      },
    });
  }

  // Upload the image
  const buffer = Buffer.from(imageBase64, 'base64');
  await storage.objects.insert({
    bucket,
    name: filename,
    predefinedAcl: 'publicRead',
    media: { mimeType, body: Readable.from(buffer) },
    requestBody: { name: filename, contentType: mimeType },
  });

  return `https://storage.googleapis.com/${bucket}/${encodeURIComponent(filename)}`;
}

// ── Google Drive upload (fallback — works only with Shared Drives) ─────────────
async function uploadToDriveFolder(
  imageBase64: string,
  mimeType: string,
  filename: string
): Promise<string> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: 'v3', auth });

  const buffer = Buffer.from(imageBase64, 'base64');
  const stream = Readable.from(buffer);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined,
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  });

  const fileId = file.data.id!;

  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
}

// ── Main export: try GCS first, fall back to Drive folder, then empty ─────────
export async function uploadToDrive(
  imageBase64: string,
  mimeType: string,
  filename: string
): Promise<string> {
  // 1. Try Google Cloud Storage (preferred — works with service accounts)
  try {
    return await uploadToGCS(imageBase64, mimeType, filename);
  } catch (gcsErr) {
    console.warn('[Drive] GCS upload failed:', (gcsErr as Error).message);
  }

  // 2. Try Drive folder with supportsAllDrives (works for Shared Drives)
  try {
    return await uploadToDriveFolder(imageBase64, mimeType, filename);
  } catch (driveErr) {
    console.warn('[Drive] Drive folder upload failed:', (driveErr as Error).message);
  }

  // 3. Return empty — Sheets sync still succeeds; image column will be blank
  console.warn('[Drive] All upload attempts failed — continuing without image URL');
  return '';
}
