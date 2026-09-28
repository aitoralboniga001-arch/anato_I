import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Course figures (Langman, lecture slides…) are copyrighted: they are never committed nor deployed.
 * A student can keep them on their own computer, in `private-images/` (git-ignored) with a
 * `manifest.json`, and the image lab reads them from there through `/api/irudiak`. On the public
 * site the folder does not exist and the lab only shows the atlas's own figures.
 */
export interface PrivateHotspot {
  /** A structure id of the atlas (the attempt then counts for its "Irudian" competence) or free text. */
  id: string;
  /** Shown name; the atlas name of `id` when omitted. */
  label?: string;
  /** Centre and radius as fractions of the image width/height (0..1). */
  x: number;
  y: number;
  r?: number;
}

export interface PrivateItem {
  file: string;
  title?: string;
  source?: string;
  plane?: string;
  hotspots: PrivateHotspot[];
}

// Kept out of the build trace on purpose: the folder must never be bundled into a deployment.
export const PRIVATE_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.PRIVATE_IMAGES_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'private-images'));

const num = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;

/** The manifest, validated; null when there is none (the public site). */
export async function readManifest(): Promise<PrivateItem[] | null> {
  // Safety net: a public deployment never serves them, even if the folder slipped into it.
  if (process.env.VERCEL) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(PRIVATE_DIR, 'manifest.json'), 'utf8');
  } catch {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const items = (data as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((it): PrivateItem[] => {
    const file = str(it?.file);
    // Plain file names only: nothing outside the folder can be named.
    if (!file || file !== path.basename(file) || !IMAGE.test(file)) return [];
    const hotspots = (Array.isArray(it.hotspots) ? it.hotspots : [])
      .filter((h: PrivateHotspot) => str(h?.id) && num(h.x, 0, 1) && num(h.y, 0, 1))
      .map((h: PrivateHotspot) => ({ id: str(h.id, 80)!, label: str(h.label, 120), x: h.x, y: h.y, r: num(h.r, 0.005, 0.5) ? h.r : 0.05 }));
    return [{ file, title: str(it.title), source: str(it.source), plane: str(it.plane, 20), hotspots }];
  });
}

export const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
