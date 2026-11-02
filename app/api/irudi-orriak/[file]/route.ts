import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PRIVATE_DIR } from '@/lib/privateImages';

export const runtime = 'nodejs';
const counts = [4, 3, 2, 4, 4, 8, 13];

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  if (process.env.VERCEL) return new Response('Not found', { status: 404 });
  const { file } = await params;
  const match = /^(\d+)-(\d+)\.(jpg|json)$/.exec(file);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > counts.length || Number(match[2]) < 1 || Number(match[2]) > counts[Number(match[1]) - 1]) return new Response('Not found', { status: 404 });
  const actual = `${match[1]}-${match[2]}.jpg${match[3] === 'json' ? '.json' : ''}`;
  try {
    const body = await readFile(path.join(PRIVATE_DIR, 'irudiak', actual));
    return new Response(new Uint8Array(body), { headers: { 'Content-Type': match[3] === 'json' ? 'application/json; charset=utf-8' : 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
