import { getNarrationAsset, narrationConfigured, narrationProvider } from '@/lib/narration/server';
import { NarrationError, isSameOriginNarrationRequest, parseNarrationRequest, readBoundedBody } from '@/lib/narration/server-utils';

export const runtime = 'nodejs';

const errorResponse = (error: NarrationError) => Response.json({ error: error.message, code: error.code }, {
  status: error.status,
  headers: { 'Cache-Control': 'no-store', ...(error.status === 429 ? { 'Retry-After': '60' } : {}) },
});

export function GET() {
  return Response.json({ configured: narrationConfigured(), provider: narrationProvider() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    // Browser POSTs must come from the current origin; this is not user authentication.
    if (!isSameOriginNarrationRequest(request)) {
      throw new NarrationError('FORBIDDEN', 403, 'Eskaeraren jatorria ez da baliozkoa.');
    }
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      throw new NarrationError('INVALID_REQUEST', 400, 'JSON eskaera behar da.');
    }
    const raw = await readBoundedBody(request, 2048);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new NarrationError('INVALID_REQUEST', 400, 'JSON eskaera ez da baliozkoa.'); }
    const audio = getNarrationAsset(parseNarrationRequest(body));
    return new Response(null, { status: 303, headers: {
      'Location': audio.url,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    return errorResponse(error instanceof NarrationError ? error : new NarrationError('SERVER_ERROR', 500, 'Ahotsa ezin izan da prestatu.'));
  }
}
