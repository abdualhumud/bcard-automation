import { GoogleGenerativeAI } from '@google/generative-ai';
import { CardData } from '@/types/card';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Types ─────────────────────────────────────────────────────────────────────
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';

// ── Custom error ──────────────────────────────────────────────────────────────
export class QuotaExceededError extends Error {
  constructor() {
    super('Gemini daily quota exceeded for this model.');
    this.name = 'QuotaExceededError';
  }
}

// ── Main extraction function ──────────────────────────────────────────────────
export async function extractCardData(
  imageBase64: string,
  mimeType: string,
  modelId: GeminiModel = 'gemini-2.0-flash'
): Promise<CardData> {
  const model = genAI.getGenerativeModel({ model: modelId ?? 'gemini-2.0-flash' });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
    },
  };

  // ── Helper: wrap API calls to detect quota exhaustion ──────────────────────
  async function safeGenerate(prompt: string) {
    try {
      return await model.generateContent([prompt, imagePart]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Only catch RESOURCE_EXHAUSTED = true daily quota exceeded.
      // Do NOT catch generic 429 (per-minute rate limit) — that is a
      // cooldown, not a daily quota, and would cause a false-positive modal.
      if (msg.includes('RESOURCE_EXHAUSTED')) {
        throw new QuotaExceededError();
      }
      throw err;
    }
  }

  // ── PASS 1: Extract all textual data ──────────────────────────────────────
  const extractionPrompt = `You are an expert business card data extraction assistant.
Analyze this business card image. The card may have text in Arabic, English, or both.
Prefer English if both languages are present for the same field.

Extract exactly these fields and return ONLY valid JSON — no markdown, no explanation:

{
  "companyName": "The company or organization name",
  "fullName": "The person's full name",
  "jobTitle": "Their complete job title (e.g. General Manager of Procurement, CEO, Sales Director)",
  "sector": "The business sector / industry (e.g. Logistics, Real Estate, Marketing, Healthcare, Technology, Construction, Finance, Oil & Gas)",
  "mobile": "Mobile / cell phone number(s). Join multiple with ' | '",
  "officePhone": "Office / landline phone number(s). Join multiple with ' | '",
  "email": "Email address",
  "website": "Website URL"
}

Rules:
- Use the string "Null" (not null, not empty) for any field not found on the card.
- Never guess or fabricate information.
- Include country codes for phone numbers if shown.
- Return ONLY the JSON object.`;

  const pass1Result = await safeGenerate(extractionPrompt);
  const pass1Text = pass1Result.response.text().trim();
  const cleanJson = pass1Text.replace(/```json\s*|\s*```/g, '').trim();

  let extracted: Omit<CardData, 'imageLink'>;
  try {
    extracted = JSON.parse(cleanJson);
  } catch {
    throw new Error(`Gemini extraction parse error. Raw response: ${pass1Text.slice(0, 300)}`);
  }

  // Ensure every field has a value (fall back to 'Null')
  const safe = (val: unknown) =>
    typeof val === 'string' && val.trim() !== '' ? val.trim() : 'Null';

  extracted = {
    companyName: safe(extracted.companyName),
    fullName:    safe(extracted.fullName),
    jobTitle:    safe(extracted.jobTitle),
    sector:      safe(extracted.sector),
    mobile:      safe(extracted.mobile),
    officePhone: safe(extracted.officePhone),
    email:       safe(extracted.email),
    website:     safe(extracted.website),
  };

  // ── PASS 2: Self-verify company name from visual context (logos / branding) ─
  const verificationPrompt = `You are verifying one field from a business card.

The initial text extraction identified the company name as: "${extracted.companyName}"

Now look carefully at the card image for visual evidence:
  1. Company logos and the text embedded in / near them
  2. Brand name in a distinct colour, font, or style
  3. Watermarks, letterheads, or printed headers

Based ONLY on visual evidence, is the company name correct?
- If correct, or if visual context is ambiguous, return exactly: ${extracted.companyName}
- If a logo clearly shows a different name, return only that corrected name.

Return ONLY the company name — no punctuation, no explanation, nothing else.`;

  const pass2Result = await safeGenerate(verificationPrompt);
  const verifiedName = pass2Result.response.text().trim().replace(/^["']|["']$/g, '');

  return {
    companyName: verifiedName || extracted.companyName,
    fullName:    extracted.fullName,
    jobTitle:    extracted.jobTitle,
    sector:      extracted.sector,
    mobile:      extracted.mobile,
    officePhone: extracted.officePhone,
    email:       extracted.email,
    website:     extracted.website,
    imageLink:   '',
  };
}
