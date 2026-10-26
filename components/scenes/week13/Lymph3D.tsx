'use client';

import { blobParts, mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import type { V3 } from '@/lib/three-d/math';
import { curve3 } from '@/lib/three-d/mesh';
import type { Item3 } from '@/lib/three-d/scene';
import { ADULT, VC, tintCells, type VeinPose } from './veins3d';
import { orbit, veinStage } from './common';

/**
 * Topic 13, stage 16 (notes 5): the lymphatic system. The adult veins stay as a faint frame; on it the lymph sacs
 * and vessels of the notes' figure («Zaku linfatikoak»): two jugular sacs, the retroperitoneal sac, the cisterna
 * chyli and two posterior sacs; the two thoracic ducts rising from the cisterna, one of them kept, crossing the
 * diaphragm and the mediastinum to open at the left jugulo-subclavian junction. Lymph runs as small pale-green drops.
 */

const SH: [number, number] = [30, 0];
const LY = '#7ee08a';
const LY_DEEP = '#2b6b38';
const LY_SAC = '#9ce8a2';

const X = (s: number, p: V3): V3 => [s * p[0], p[1], p[2]];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (a: number, b: number, v: number) => {
  const k = clamp01((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** The first `k` of a polyline (it grows from its first point). */
function part(line: V3[], k: number): V3[] {
  if (k >= 0.999) return line;
  const n = line.length - 1;
  const f = Math.max(0.02, k) * n;
  const i = Math.floor(f);
  return [...line.slice(0, i + 1), lerp3(line[i], line[Math.min(n, i + 1)], f - i)];
}

/** The sacs (centre, semi-axes); each side's mirror where there are two. */
const JUG = (s: number): V3 => X(s, [1.32, 2.85, -0.5]);
const RETRO: V3 = [0.32, -3.3, -0.22];
const CIST: V3 = [0.08, -2.78, -0.98];
const POST = (s: number): V3 => X(s, [1.22, -6.05, -0.62]);
/** Left jugulo-subclavian junction (the left internal jugular meets the left subclavian). */
const JSL: V3 = [0.95, 2.45, -0.7];
const JSR: V3 = [-0.95, 2.45, -0.65];

/** Lymph vessels (lymph runs from the first point to the last). */
const upper = (s: number) => ({
  head: curve3([X(s, [0.45, 4.95, -0.15]), X(s, [0.85, 4.1, -0.3]), X(s, [1.18, 3.3, -0.45]), X(s, [1.28, 3.1, -0.48])], 16),
  neck: curve3([X(s, [1.6, 4.15, 0.12]), X(s, [1.55, 3.55, -0.2]), X(s, [1.42, 3.1, -0.42])], 12),
  arm: curve3([X(s, [2.95, 1.85, -0.4]), X(s, [2.25, 2.4, -0.38]), X(s, [1.62, 2.78, -0.46])], 14),
  trunk: curve3([X(s, [1.75, 0.45, -0.62]), X(s, [1.62, 1.55, -0.58]), X(s, [1.42, 2.5, -0.52])], 14),
});
const lower = (s: number) => ({
  leg: curve3([X(s, [1.6, -7.95, 0.22]), X(s, [1.42, -7.0, -0.15]), X(s, [1.28, -6.38, -0.55])], 12),
  pelvis: curve3([X(s, [0.45, -7.35, -0.42]), X(s, [0.85, -6.7, -0.62]), X(s, [1.08, -6.25, -0.66])], 10),
  /** Posterior sac → cisterna chyli. */
  up: curve3([X(s, [1.12, -5.72, -0.7]), X(s, [0.62, -4.6, -0.95]), X(s, [0.22, -3.62, -1.0]), [0.08 * s, -3.18, -0.99]], 16),
});
const GUT_IN = [
  curve3([[0.75, -3.85, 0.35], [0.55, -3.55, 0.08], [0.42, -3.38, -0.1]], 10),
  curve3([[-0.2, -3.95, 0.35], [0.05, -3.6, 0.05], [0.22, -3.4, -0.12]], 10),
];
const RETRO_UP = curve3([[0.28, -3.08, -0.38], [0.18, -2.98, -0.7], [0.1, -2.95, -0.88]], 8);

/** The two thoracic ducts (cisterna → each jugulo-subclavian junction) and the one kept (the left course). */
const DUCT_R = curve3([[0.0, -2.32, -0.98], [-0.18, -1.0, -1.06], [-0.24, 0.5, -1.02], [-0.32, 1.6, -0.86], [-0.72, 2.3, -0.66], JSR], 40);
const DUCT_L = curve3([[0.16, -2.32, -0.98], [0.3, -1.0, -1.06], [0.32, 0.5, -1.02], [0.4, 1.6, -0.9], [0.75, 2.3, -0.72], JSL], 40);
const DUCT_KEPT = curve3([[0.08, -2.32, -0.98], [-0.04, -1.0, -1.06], [-0.1, 0.4, -1.02], [0.1, 1.25, -0.96], [0.48, 1.9, -0.86], [0.78, 2.62, -0.76], JSL], 40);

export interface LymphState {
  /** The sacs and vessels starting (small buds and stubs). */
  bud: number;
  /** Head, neck, trunk and upper-limb vessels grown into the two jugular sacs. */
  up: number;
  /** The four abdominal sacs and the lower-limb and abdominal vessels. */
  low: number;
  /** The abdominal sacs drained to the cisterna chyli. */
  join: number;
  /** The two thoracic ducts rising. */
  ducts: number;
  /** One duct kept (the other regresses), on its final course to the left. */
  keep: number;
}
export const LS0: LymphState = { bud: 0, up: 0, low: 0, join: 0, ducts: 0, keep: 0 };

type Dim = { ids: readonly string[]; k: number } | null | undefined;

export function lymphModel(t: number, x: LymphState, dim: Dim) {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const lines: Record<string, V3[]> = {};
  const lit = (id: string) => !dim || dim.k <= 0.001 || dim.ids.includes(id);
  const dk = (id: string) => (lit(id) ? 1 : 1 - 0.7 * (dim?.k ?? 0));
  const phase = t * 60;

  const sac = (key: string, id: string, c: V3, r: V3, k: number, color = LY_SAC) => {
    if (k <= 0.01) return;
    const g = 0.35 + 0.65 * k;
    items.push({ key: `ly-${key}`, id, ...blobParts({ center: c, radii: [r[0] * g, r[1] * g, r[2] * g], rings: 14, sides: 20 }), color, deep: LY_DEEP, tissue: 'epithelium', opacity: Math.min(1, k * 2) * 0.92 * dk(id), outline: true, thin: 0.45 });
  };
  const vessel = (key: string, id: string, line: V3[], k: number, r = 0.034, flow = true) => {
    if (k <= 0.01) return;
    const l = part(line, k);
    lines[key] = l;
    items.push({ key: `ly-${key}`, id, ...tubeParts(l, { radius: (u) => r * (0.75 + 0.25 * Math.sin(u * 40) ** 2), ref: [0, 0, 1], sides: 8, capStart: true, capEnd: true }), color: LY, deep: LY_DEEP, tissue: 'vessel', opacity: 0.95 * dk(id), outline: false });
    if (flow) items.push(...tintCells(key, line, phase * 0.5, ss(0.9, 1, k) * dk(id), mixHex(LY, '#ffffff', 0.35), LY_DEEP, Math.max(4, Math.round(line.length / 3))));
  };

  // ———— upper body → jugular sacs ————
  const upK = Math.max(0.3 * x.bud, x.up);
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    sac(`jug${n}`, 'linfa-zaku-yugularrak', JUG(s), [0.3, 0.42, 0.26], upK);
    const u = upper(s);
    vessel(`head${n}`, 'linfa-hodiak', u.head, upK);
    vessel(`neck${n}`, 'linfa-hodiak', u.neck, upK);
    vessel(`arm${n}`, 'linfa-hodiak', u.arm, upK);
    vessel(`trunk${n}`, 'linfa-hodiak', u.trunk, upK);
  }
  pts['linfa-zaku-yugularrak'] = add3(JUG(-1), [0.02, 0.05, 0.05]);
  pts['linfa-zaku-yugularrakL'] = add3(JUG(1), [-0.02, 0.05, 0.05]);
  pts['linfa-hodiak'] = upper(-1).arm[7];

  // ———— abdomen: four sacs ————
  const lowK = Math.max(0.3 * x.bud, x.low);
  sac('retro', 'peritoneo-atzeko-linfa-zakua', RETRO, [0.3, 0.25, 0.2], lowK);
  sac('cist', 'kiloren-zisterna', CIST, [0.19, 0.48, 0.16], lowK, '#b4f0b0');
  for (const s of [-1, 1]) {
    const n = s < 0 ? 'R' : 'L';
    sac(`post${n}`, 'atzeko-linfa-zakuak', POST(s), [0.3, 0.38, 0.26], lowK);
    const l = lower(s);
    vessel(`leg${n}`, 'linfa-hodiak', l.leg, lowK);
    vessel(`pelvis${n}`, 'linfa-hodiak', l.pelvis, lowK);
    vessel(`postUp${n}`, 'linfa-hodiak', l.up, x.join, 0.04);
  }
  GUT_IN.forEach((g, i) => vessel(`gut${i}`, 'linfa-hodiak', g, lowK));
  vessel('retroUp', 'linfa-hodiak', RETRO_UP, x.join, 0.04);
  pts['peritoneo-atzeko-linfa-zakua'] = RETRO;
  pts['kiloren-zisterna'] = add3(CIST, [0, -0.12, 0.04]);
  pts['atzeko-linfa-zakuak'] = POST(-1);
  pts['atzeko-linfa-zakuakL'] = POST(1);
  pts['linfa-hodiak-low'] = lower(-1).leg[5];

  // ———— thoracic ducts ————
  if (x.ducts > 0.01) {
    const gone = ss(0, 0.8, x.keep);
    const kept = ss(0.2, 1, x.keep);
    // The right one regresses: thinner and fading, then gone.
    if (gone < 0.98) {
      const l = part(DUCT_R, x.ducts);
      lines.ductR = l;
      items.push({ key: 'ly-ductR', id: 'hodi-toraxikoa', ...tubeParts(l, { radius: () => 0.045 * (1 - 0.6 * gone), ref: [0, 0, 1], sides: 10, capStart: true, capEnd: true }), color: LY, deep: LY_DEEP, tissue: 'vessel', opacity: 0.95 * (1 - gone) * dk('hodi-toraxikoa'), outline: false });
      if (gone < 0.3) items.push(...tintCells('ductR', DUCT_R, phase * 0.5, ss(0.9, 1, x.ducts) * (1 - gone / 0.3), mixHex(LY, '#ffffff', 0.35), LY_DEEP, 12));
    }
    // The left one takes its final course (crossing to the left in the mediastinum).
    const course = DUCT_L.map((p, i) => lerp3(p, DUCT_KEPT[i], kept));
    const l = part(course, x.ducts);
    lines.ductL = l;
    items.push({ key: 'ly-ductL', id: 'hodi-toraxikoa', ...tubeParts(l, { radius: () => 0.05 + 0.008 * kept, ref: [0, 0, 1], sides: 10, capStart: true, capEnd: true }), color: LY, deep: LY_DEEP, tissue: 'vessel', opacity: 0.97 * dk('hodi-toraxikoa'), outline: false });
    items.push(...tintCells('ductL', course, phase * 0.5, ss(0.9, 1, x.ducts), mixHex(LY, '#ffffff', 0.35), LY_DEEP, 14));
    pts['hodi-toraxikoa'] = course[20];
    pts['hodi-toraxikoaR'] = DUCT_R[20];
  }

  // ———— diaphragm (the duct crosses it) ————
  items.push({ key: 'ly-diaphragm', id: 'diafragma', ...blobParts({ center: [0, -1.2, -0.3], radii: [1.95, 0.62, 1.42], rings: 18, sides: 30, shape: (d) => (d[1] >= 0 ? 1 : 0.12) }, 'diaphragm13'), color: '#d49a86', deep: '#7a4234', tissue: 'muscle', opacity: 0.2 * dk('diafragma'), outline: true, thin: 0.4, quiet: true });
  pts['diafragma'] = [1.05, -0.78, 0.1];
  // The left jugulo-subclavian junction: a small bulb where the internal jugular meets the subclavian (the duct opens here).
  items.push({ key: 'ly-jsl', id: 'lotura-yugulosubklabikoa', ...blobParts({ center: JSL, radii: [0.1, 0.1, 0.1], rings: 10, sides: 14 }), color: VC.deo2, deep: VC.deo2Deep, tissue: 'vessel', opacity: 0.9 * dk('lotura-yugulosubklabikoa'), outline: false });
  pts['lotura-yugulosubklabikoa'] = JSL;

  return { items, pts, lines };
}
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ———————————————————————————— stage 16 (notes 5) ————————————————————————————

const ADULT_V: VeinPose = { ...ADULT, colour: 0, names: { ...ADULT.names } };
const C_ALL = orbit(-24, 8, 27, [0, -1.3, -0.3], SH);
const C_NECK = orbit(-18, 10, 9.5, [0, 3.05, -0.4], SH);
const C_ABD = orbit(-28, 8, 13.5, [0, -4.6, -0.5], SH);

export const S16 = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] as const;

export const Lymph3D = veinStage({
  S: S16,
  pose: ADULT_V,
  opts: { heart: 0, liverOp: 0.28, gut: 0.4, kidneys: 0.45, ghosts: 0, faint: 0.6 },
  dimStrength: 0.75,
  x0: { ...LS0 },
  key: [
    { color: LY, text: 'linfa' },
    { color: VC.deo2, text: 'zainak' },
  ],
  keyTitle: 'Kolorea',
  caption: 'Linfa sistema',
  extra: (t, _pose, opts, _lines, x) => lymphModel(t, x as unknown as LymphState, opts.dim),
  steps: [
    {
      x: { bud: 1 },
      run: [0.02, 0.4],
      cam: C_ALL,
      names: [{ id: 'linfa-zaku-yugularrak', from: 0.15 }, { id: 'kiloren-zisterna', from: 0.15 }, { id: 'atzeko-linfa-zakuak', from: 0.15 }, { id: 'linfa-hodiak', from: 0.15 }],
      note: 'Linfa zakuak eta linfa hodiak alboko mesodermoaren errai orritik garatzen dira',
    },
    {
      x: { up: 1 },
      cam: C_NECK,
      glide: 0.07,
      dim: ['linfa-hodiak', 'linfa-zaku-yugularrak', 'barneko-jugularrak'],
      names: [{ id: 'linfa-hodiak', sub: '(burua, lepoa, enborra, goiko gorputz-adarrak)' }, { id: 'linfa-zaku-yugularrak', sub: '(bi)', from: 0.35 }, { id: 'barneko-jugularrak', p: 'barneko-jugularrakL', small: true, from: 0.5 }],
      note: 'Buruko, lepoko, enborreko eta goiko gorputz-adarretako linfa hodiak → bi linfa zaku yugularrak',
    },
    {
      x: { low: 1 },
      cam: C_ABD,
      glide: 0.07,
      dim: ['linfa-hodiak', 'peritoneo-atzeko-linfa-zakua', 'kiloren-zisterna', 'atzeko-linfa-zakuak'],
      names: [{ id: 'peritoneo-atzeko-linfa-zakua', from: 0.25 }, { id: 'kiloren-zisterna', from: 0.35 }, { id: 'atzeko-linfa-zakuak', from: 0.45 }, { id: 'linfa-hodiak', p: 'linfa-hodiak-low', small: true, from: 0.55 }],
      note: 'Abdomenean 4 linfa zaku: beheko gorputz-adarretako eta abdomeneko linfa hodiak haietara heltzen dira',
    },
    {
      cam: orbit(-52, 8, 7.5, [0.2, -3.2, -0.4], SH),
      glide: 0.07,
      dim: ['peritoneo-atzeko-linfa-zakua'],
      names: [{ id: 'peritoneo-atzeko-linfa-zakua', sub: '(peritoneoaren atzekaldean)' }],
      note: 'Peritoneo atzeko linfa zakua: peritoneoaren atzekaldean',
    },
    {
      cam: orbit(-38, 8, 7, [0.05, -2.9, -0.9], SH),
      glide: 0.07,
      dim: ['kiloren-zisterna'],
      names: [{ id: 'kiloren-zisterna', sub: '(Pecquet zisterna)' }],
      note: 'Kiloren zisterna (Pecquet zisterna): abdomenean, eta garrantzitsuena',
    },
    {
      cam: orbit(-12, 6, 8.5, [0, -6.25, -0.45], SH),
      glide: 0.07,
      dim: ['atzeko-linfa-zakuak', 'kanpoko-zain-iliakoak', 'barneko-zain-iliakoak'],
      opts: { faint: 0.25 },
      names: [{ id: 'atzeko-linfa-zakuak', sub: '(eskumakoa eta ezkerrekoa)' }, { id: 'kanpoko-zain-iliakoak', p: 'kanpoko-zain-iliakoakL', small: true, from: 0.4 }, { id: 'barneko-zain-iliakoak', p: 'barneko-zain-iliakoakL', small: true, from: 0.4 }],
      note: '2 atzeko linfa zaku: barneko eta kanpoko zain iliakoak batzen diren eskualdeetan',
    },
    {
      x: { join: 1, ducts: 1 },
      run: [0.06, 0.85],
      cam: C_ALL,
      glide: 0.08,
      opts: { faint: 0.6 },
      dim: ['kiloren-zisterna', 'hodi-toraxikoa', 'linfa-hodiak'],
      names: [{ id: 'kiloren-zisterna', small: true }, { id: 'linfa-hodiak', p: 'linfa-hodiak-low', small: true }, { id: 'hodi-toraxikoa', text: 'Hodi toraxikoak', sub: '(bi, gorantz)', from: 0.45 }],
      note: 'Linfa guztia kiloren zisternara; bertatik bi linfa hodi nagusi gorantz: hodi toraxikoak',
    },
    {
      x: { keep: 1 },
      run: [0.08, 0.85],
      cam: orbit(-14, 8, 15, [0, 0.2, -0.7], SH),
      glide: 0.08,
      dim: ['hodi-toraxikoa'],
      names: [{ id: 'hodi-toraxikoa', sub: '(bakarra mantentzen da)', from: 0.5 }],
      note: 'Garapenean bat bakarrik mantentzen da: toraxeko linfa hodia',
    },
    {
      cam: orbit(-34, 10, 13, [0.25, 0.45, -0.6], SH),
      glide: 0.08,
      dim: ['hodi-toraxikoa', 'diafragma', 'lotura-yugulosubklabikoa'],
      names: [{ id: 'diafragma', small: true }, { id: 'hodi-toraxikoa', sub: '(mediastinotik gora, ezkerrerantz)' }, { id: 'lotura-yugulosubklabikoa', text: 'Ezkerreko lotura yugulosubklabikoa', from: 0.5 }],
      note: 'Hodi toraxikoak diafragma zeharkatu, mediastinotik gora egin eta ezkerrerantz jotzen du: ezkerreko lotura yugulosubklabikoan irekitzen da',
    },
    {
      cam: orbit(-14, 10, 6.2, [0.95, 2.6, -0.62], SH),
      glide: 0.08,
      opts: { faint: 0 },
      dim: ['lotura-yugulosubklabikoa', 'barneko-jugularrak', 'zain-subklabioak', 'hodi-toraxikoa'],
      names: [{ id: 'lotura-yugulosubklabikoa', text: 'Lotura yugulosubklabikoa' }, { id: 'barneko-jugularrak', p: 'barneko-jugularrakL', text: 'Ezkerreko zain yugularra', from: 0.3 }, { id: 'zain-subklabioak', p: 'zain-subklabioakL', text: 'Ezkerreko zain subklabioa', from: 0.4 }, { id: 'hodi-toraxikoa', small: true }],
      note: 'Lotura yugulosubklabikoa: ezkerreko zain yugularra eta ezkerreko zain subklabioa elkartzen diren puntua',
    },
  ],
});
