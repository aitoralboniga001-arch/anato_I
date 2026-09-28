import { readManifest } from '@/lib/privateImages';

export const runtime = 'nodejs';

const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' };

/** The private course figures listed in `private-images/manifest.json`, if this computer has them. */
export async function GET() {
  const items = await readManifest();
  if (!items) return Response.json({ available: false, items: [] }, { status: 404, headers: HEADERS });
  // The file name stays on the server: images are fetched by their position in the list.
  return Response.json({ available: true, items: items.map(({ file: _file, ...rest }, i) => ({ ...rest, i })) }, { headers: HEADERS });
}
