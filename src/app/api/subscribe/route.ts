import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIENCE_NAME = 'Nexnews Subscribers';

async function getOrCreateAudience(apiKey: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Fetch existing audiences
  const listRes = await fetch('https://api.resend.com/audiences', {
    method: 'GET',
    headers,
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    if (Array.isArray(listData.data)) {
      const existing = listData.data.find(
        (aud: { name: string; id: string }) => aud.name === AUDIENCE_NAME
      );
      if (existing) {
        return existing.id;
      }
    }
  }

  // 2. Create new audience if not found
  const createRes = await fetch('https://api.resend.com/audiences', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: AUDIENCE_NAME }),
  });

  if (createRes.ok) {
    const createData = await createRes.json();
    return createData.id;
  }

  // Fallback: If creation fails or list was restricted, throw or return error details
  const errorText = await createRes.text();
  throw new Error(`Failed to get/create Resend Audience: ${createRes.status} ${errorText}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    // 1. Validate email input
    if (!email || typeof email !== 'string' || email.trim().length > 254 || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('[Subscribe API] RESEND_API_KEY is not configured in environment.');
      return NextResponse.json(
        { success: false, error: 'Newsletter service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    // 2. Get or create the Resend Audience
    let audienceId: string;
    try {
      audienceId = await getOrCreateAudience(apiKey);
    } catch (audErr) {
      console.error('[Subscribe API] Audience retrieval error:', audErr);
      return NextResponse.json(
        { success: false, error: 'Unable to process subscription at this time.' },
        { status: 500 }
      );
    }

    // 3. Add contact to Resend Audience
    const contactRes = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          unsubscribed: false,
        }),
      }
    );

    if (contactRes.ok) {
      return NextResponse.json({
        success: true,
        message: "You're subscribed!",
      });
    }

    const resBody = await contactRes.json().catch(() => ({}));
    const errorMessage = resBody?.message || resBody?.error || '';

    // Handle duplicate signups gracefully
    // Resend may return status 400/409/422 with message indicating contact already exists
    if (
      contactRes.status === 400 ||
      contactRes.status === 409 ||
      contactRes.status === 422 ||
      errorMessage.toLowerCase().includes('already exists') ||
      errorMessage.toLowerCase().includes('duplicate')
    ) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
      });
    }

    console.error(`[Subscribe API] Resend contact creation error (${contactRes.status}):`, resBody);
    return NextResponse.json(
      { success: false, error: 'Failed to complete subscription. Please try again later.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Subscribe API] Internal server error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
