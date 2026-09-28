import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MIME, PRIVATE_DIR, readManifest } from '@/lib/privateImages';

export const runtime = 'nodejs';

/** One private figure, by its position in the manifest (never by a path from the request). */
export async function GET(_req: Request, ctx: { params: Promise<{ n: string }> }) {
  const { n } = await ctx.params;
  const items = await readManifest();
  const i = Number(n);
  const item = items && Number.isInteger(i) && i >= 0 ? items[i] : undefined;
  if (!item) return new Response('Not found', { status: 404 });
  const file = path.join(PRIVATE_DIR, item.file);
  if (path.dirname(file) !== PRIVATE_DIR) return new Response('Not found', { status: 404 });
  try {
    const body = await readFile(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
        // An SVG from the folder must not run scripts.
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
