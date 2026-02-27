import { NextRequest, NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/google-drive';
import { syncToSheet } from '@/lib/google-sheets';
import { CardData } from '@/types/card';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      card: CardData;
      imageBase64: string;
      mimeType: string;
    };

    const { card, imageBase64, mimeType } = body;

    if (!card || !imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'card, imageBase64, and mimeType are all required.' },
        { status: 400 }
      );
    }

    // 1. Upload image (GCS → Drive → graceful empty fallback)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
    const safeName = (card.fullName !== 'Null' ? card.fullName : 'unknown')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);
    const filename = `bcard-${safeName}-${timestamp}.${ext}`;

    // uploadToDrive already handles its own errors and returns '' on failure
    const imageLink = await uploadToDrive(imageBase64, mimeType, filename);

    // 2. Sync to Google Sheets with the image link (may be empty if upload failed)
    const cardWithImage: CardData = { ...card, imageLink };
    const result = await syncToSheet(cardWithImage);

    return NextResponse.json({
      success: true,
      action: result.action,     // 'updated' | 'appended'
      imageLink,
      row: result.row,
    });
  } catch (error) {
    console.error('[/api/sync]', error);
    const message =
      error instanceof Error ? error.message : 'Sync failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
