import { NextRequest, NextResponse } from 'next/server';
import { extractCardData } from '@/lib/gemini';

// Server-side rate limiting: 30-second cooldown between Gemini calls
let lastCallTimestamp = 0;
const COOLDOWN_MS = 30_000;

export async function POST(request: NextRequest) {
  try {
    const now = Date.now();
    const elapsed = now - lastCallTimestamp;

    if (lastCallTimestamp > 0 && elapsed < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Rate limit active. Please wait ${waitSec}s before scanning again.`, waitSec },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body as {
      imageBase64: string;
      mimeType: string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'imageBase64 and mimeType are required.' },
        { status: 400 }
      );
    }

    // Reserve the slot before the async call to prevent concurrent abuse
    lastCallTimestamp = now;

    const cardData = await extractCardData(imageBase64, mimeType);

    return NextResponse.json({ success: true, data: cardData });
  } catch (error) {
    console.error('[/api/scan]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to extract card data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
