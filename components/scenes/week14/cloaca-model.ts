import { add, type V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import type { Item3 } from '@/lib/three-d/scene';
import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { T } from '@/components/scenes/week10/common';
import { EC } from '@/components/scenes/week12/embryo-model';

/**
 * Topic 14, stage 22 (notes 5): the cloaca divided by the urorectal septum, in 3D, as the notes' sagittal
 * figure: the hindgut ending in the cloaca with the cloacal membrane, the allantois leaving it ventrally; the
 * urorectal septum growing down between the allantois and the hindgut to the membrane, splitting cloaca and
 * membrane in two: in front the primitive urogenital sinus (blue, as the notes) with the urogenital membrane
 * → bladder and urethra; behind the anorectal canal with the anal membrane, its proximal part endoderm (the
 * hindgut's end) and its distal part ectoderm (the proctodeum). The anal membrane opens (the anus); the
 * septum's end between the two is the perineum.
 *
 * A close-up in its own small frame: y cranial, z ventral, x the embryo's left (the cut is the midline).
 */

export const CC = {
  endo: T.endo,
  endoDeep: T.endoDeep,
  ecto: T.ecto,
  ectoDeep: T.ectoDeep,
  sinus: '#4a8fe7',
  sinusDeep: '#1f4f9a',
  septum: T.lateral,
  membrane: '#f4efe2',
  hind: EC.ima,
} as const;

export interface CloacaPose {
  /** The urorectal septum's growth (0: none → 1: reaches the cloacal membrane). */
  sept: number;
  /** The two cavities coloured and named apart (urogenital sinus | anorectal canal). */
  split: number;
  /** The anorectal canal's two origins coloured (endoderm above, ectoderm below). */
  origins: number;
  /** The proctodeum deepening from the surface ectoderm. */
  procto: number;
  /** The anal membrane gone (the anus opens). */
  open: number;
  /** The urogenital sinus → bladder and urethra. */
  bladder: number;
}

export const CP0: CloacaPose = { sept: 0, split: 0, origins: 0, procto: 0, open: 0, bladder: 0 };

export interface CloacaOpts {
  dim?: { ids: readonly string[]; k: number } | null;
}

const darker = (c: string) => mixHex(c, '#000000', 0.55);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const tube = (pts: V3[], r: (u: number) => number, sides = 16) => tubeParts(pts, { radius: r, ref: [1, 0, 0], sides, capStart: true, capEnd: true });

/** The septum's tip as it grows: from the angle between allantois and hindgut down to the membrane. */
const SEPT_TOP: V3 = [0, 0.62, 0.02];
const SEPT_BOT: V3 = [0, -0.42, 0.02];

export function cloacaModel(pose: CloacaPose, o: CloacaOpts = {}) {
  const dim = o.dim;
  const lit = (id: string, groups?: readonly string[]) => !dim || dim.k <= 0.001 || dim.ids.includes(id) || (groups ?? []).some((g) => dim.ids.includes(g));
  const fade = (id: string, groups?: readonly string[], k = 0.75) => (lit(id, groups) ? 1 : 1 - k * (dim?.k ?? 0));
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const sept = clamp01(pose.sept);
  const split = clamp01(pose.split);
  const orig = clamp01(pose.origins);
  const procto = clamp01(pose.procto);
  const open = clamp01(pose.open);
  const bl = clamp01(pose.bladder);

  // ———— the hindgut, coming down dorsally into the cloaca ————
  const hg = curve3([[0, 1.9, -0.62], [0, 1.2, -0.6], [0, 0.6, -0.42], [0, 0.25, -0.32]], 18);
  items.push({ key: 'hindgut', id: 'atzeko-hestea', ...tube(hg, () => 0.17), color: CC.endo, deep: CC.endoDeep, tissue: 'epithelium', opacity: 0.9 * fade('atzeko-hestea') });
  pts['atzeko-hestea'] = add(hg[6], [0.18, 0, 0]);

  // ———— the allantois, leaving the cloaca ventrally and cranially (endoderm) ————
  const top: V3 = lerp3([0, 0.3, 0.38], [0, 0.62, 0.46], bl);
  const al = curve3([top, [0, 0.95, 0.72], [0, 1.5, 0.9], [0, 2.0, 0.98]], 16);
  items.push({ key: 'allantois', id: 'alantoidea', ...tube(al, (u) => lerp(0.09, 0.06, u)), color: CC.endo, deep: CC.endoDeep, tissue: 'epithelium', opacity: 0.9 * fade('alantoidea') });
  pts['alantoidea'] = add(al[9], [0.1, 0, 0]);

  // ———— the cloaca → urogenital sinus (front) + anorectal canal (back) ————
  const one = 1 - split;
  if (one > 0.01) {
    const c: V3 = [0, 0, 0];
    items.push({ key: 'cloaca', id: 'kloaka', ...blobParts({ center: c, radii: [0.34, 0.44, 0.58], rings: 16, sides: 20 }), color: CC.endo, deep: CC.endoDeep, tissue: 'epithelium', opacity: 0.85 * one * fade('kloaka') });
    pts['kloaka'] = [0.32, 0.05, 0.12];
  }
  if (split > 0.01) {
    // Front: the primitive urogenital sinus (blue in the notes); with time the bladder above, the urethra below.
    const sc: V3 = lerp3([0, -0.02, 0.32], [0, 0.32, 0.46], bl);
    const sr: V3 = [lerp(0.3, 0.34, bl), lerp(0.42, 0.34, bl), lerp(0.28, 0.32, bl)];
    const sinusId = bl > 0.5 ? 'gernu-maskuria' : 'sinu-urogenitala';
    items.push({ key: 'sinus', id: sinusId, groups: ['sinu-urogenitala'], ...blobParts({ center: sc, radii: sr, rings: 14, sides: 18 }), color: mixHex(CC.endo, CC.sinus, split), deep: CC.sinusDeep, tissue: 'epithelium', opacity: 0.9 * split * fade(sinusId, ['sinu-urogenitala']) });
    pts[sinusId] = add(sc, [0.3, 0.05, 0.05]);
    pts['sinu-urogenitala'] = add(sc, [0.28, 0.05, 0.05]);
    if (bl > 0.01) {
      const ur = curve3([add(sc, [0, -0.25, -0.02]), [0, -0.3, 0.32], [0, -0.44, 0.3]], 10);
      items.push({ key: 'urethra', id: 'uretra', groups: ['sinu-urogenitala'], ...tube(ur, () => 0.07, 12), color: CC.sinus, deep: CC.sinusDeep, tissue: 'epithelium', opacity: bl * fade('uretra', ['sinu-urogenitala']) });
      pts['uretra'] = add(ur[6], [0.1, 0, 0]);
    }
    // Back: the anorectal canal (the rectum's end), endoderm above; below, its distal ectodermal part.
    const ac: V3 = [0, -0.02, -0.3];
    items.push({ key: 'anorect', id: 'hodi-anoerrektala', ...blobParts({ center: ac, radii: [0.22, 0.4, 0.2], rings: 14, sides: 18 }), color: CC.endo, deep: CC.endoDeep, tissue: 'epithelium', opacity: 0.9 * split * fade('hodi-anoerrektala') });
    pts['hodi-anoerrektala'] = add(ac, [0.22, 0.05, -0.02]);
    pts['hurbileko-atala'] = add(ac, [0.2, 0.12, -0.04]);
  }

  // ———— the urorectal septum (mesoderm), growing down to the membrane ————
  if (sept > 0.01) {
    const tip = lerp3(SEPT_TOP, SEPT_BOT, sept);
    const sp = curve3([SEPT_TOP, lerp3(SEPT_TOP, tip, 0.5), tip], 12);
    items.push({ key: 'septum', id: 'trenkada-uroerrektala', ...tube(sp, (u) => lerp(0.11, 0.07, u), 14), color: CC.septum, deep: darker(CC.septum), tissue: 'mesenchyme', opacity: fade('trenkada-uroerrektala') });
    pts['trenkada-uroerrektala'] = add(sp[5], [0.14, 0, 0]);
    // A sheet across the cloaca (left to right) so the division reads as a wall, not a rod.
    items.push({ key: 'septumWall', id: 'trenkada-uroerrektala', ...blobParts({ center: lerp3(SEPT_TOP, tip, 0.5), radii: [0.36, Math.max(0.02, (SEPT_TOP[1] - tip[1]) / 2), 0.05], rings: 10, sides: 14 }), color: CC.septum, deep: darker(CC.septum), tissue: 'mesenchyme', opacity: 0.55 * fade('trenkada-uroerrektala') });
  }
  // The perineum: the septum's end between the two openings, once it reaches the membrane.
  const per = ss01(0.85, 1, sept) * split;
  if (per > 0.01) {
    items.push({ key: 'perineum', id: 'perineoa', ...blobParts({ center: [0, -0.5, 0.02], radii: [0.3, 0.1, 0.12], rings: 10, sides: 14 }), color: mixHex(CC.septum, '#ffffff', 0.15), deep: darker(CC.septum), tissue: 'mesenchyme', opacity: per * fade('perineoa') });
    pts['perineoa'] = [0.28, -0.52, 0.02];
  }

  // ———— the membranes: one cloacal membrane → urogenital (front) + anal (back) ————
  const mem = (key: string, id: string, z0: number, z1: number, op: number, color: string, groups?: string[]) => {
    if (op <= 0.01) return;
    items.push({ key, id, groups, ...blobParts({ center: [0, -0.46, (z0 + z1) / 2], radii: [0.3, 0.03, Math.abs(z1 - z0) / 2], rings: 8, sides: 14 }), color, deep: darker(color), tissue: 'membrane', opacity: op * fade(id, groups), thin: 0.7 });
    pts[id] = [0.3, -0.48, (z0 + z1) / 2];
  };
  mem('cloacalM', 'kloaka-mintza', -0.5, 0.52, 1 - split, CC.membrane);
  mem('ugM', 'mintz-urogenitala', 0.08, 0.52, split, mixHex(CC.membrane, CC.sinus, 0.25), ['kloaka-mintza']);
  mem('analM', 'uzki-mintza', -0.5, -0.08, split * (1 - open), CC.membrane, ['kloaka-mintza']);
  // Once it opens, its site stays as a ring where the endodermal and ectodermal parts meet.
  if (open > 0.01) {
    const ring = Array.from({ length: 25 }, (_, i): V3 => {
      const a = (i / 24) * Math.PI * 2;
      return [0.15 * Math.cos(a), -0.47, -0.29 + 0.15 * Math.sin(a)];
    });
    items.push({ key: 'analRing', id: 'uzki-mintza', ...tube(ring, () => 0.025, 8), color: CC.membrane, deep: darker(CC.membrane), tissue: 'membrane', opacity: open * fade('uzki-mintza') });
    pts['uzki-mintza'] = [0.16, -0.47, -0.29];
  }

  // ———— the surface ectoderm with the proctodeum (anal pit) deepening under the anal membrane ————
  {
    const pitDepth = 0.32 * procto;
    const surf = (z: number): number => -0.56 - 0.22 + pitDepth * Math.exp(-Math.pow((z + 0.29) / 0.16, 2));
    const rows: V3[] = [];
    for (let i = 0; i <= 24; i++) rows.push([0, surf(lerp(-1.1, 1.0, i / 24)), lerp(-1.1, 1.0, i / 24)]);
    const line = rows.map((p) => add(p, [0, -0.02, 0]));
    items.push({ key: 'ecto', id: 'azaleko-ektodermoa', ...tube(line, () => 0.04, 10), color: CC.ecto, deep: CC.ectoDeep, tissue: 'epithelium', opacity: 0.9 * fade('azaleko-ektodermoa') });
    pts['azaleko-ektodermoa'] = add(line[3], [0.06, -0.06, 0]);
    if (procto > 0.01) {
      // The pit: a short ectodermal tube up to the anal membrane (the anorectal canal's distal part).
      const pit = curve3([[0, -0.78 + pitDepth * 0.2, -0.29], [0, -0.62, -0.29], [0, -0.5, -0.29]], 8);
      items.push({ key: 'procto', id: 'proktodeoa', groups: orig > 0.5 ? ['hodi-anoerrektala'] : undefined, ...tube(pit, () => 0.13 * procto + 0.02, 14), color: CC.ecto, deep: CC.ectoDeep, tissue: 'epithelium', opacity: procto * fade('proktodeoa', orig > 0.5 ? ['hodi-anoerrektala'] : undefined) });
      pts['proktodeoa'] = [0.18, -0.66, -0.3];
      pts['urrutiko-atala'] = [0.18, -0.64, -0.32];
    }
  }

  // The anorectal canal's proximal part in the endoderm colour, its distal in the ectoderm's (once told).
  if (orig > 0.01 && split > 0.5) pts['hurbileko-atala'] = [0.22, 0.05, -0.32];

  return { items, pts };
}

function ss01(a: number, b: number, x: number) {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
}
