import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PRIVATE_DIR } from '@/lib/privateImages';
import { BEL_PLATES } from '@/content/belortzioak';

export const runtime = 'nodejs';

/**
 * One belortzio figure from `private-images/belortzioak/` (made by scripts/belortzioak/extract.py).
 * Course figures are copyrighted: only on the student's own computer, never on the public site.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ plate: string }> }) {
  const { plate } = await ctx.params;
  // Only ids of the figure set: nothing from the request becomes a path.
  if (process.env.VERCEL || !BEL_PLATES.some((p) => p.id === plate)) return new Response('Not found', { status: 404 });
  try {
    const body = await readFile(path.join(PRIVATE_DIR, 'belortzioak', `${plate}.webp`));
    return new Response(new Uint8Array(body), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=3600', 'X-Robots-Tag': 'noindex' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
