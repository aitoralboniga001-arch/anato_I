'use client';

import { C, Note, type Pt, type SceneProps } from '@/components/kit';
import { ModelView, cameraAt, orbit, type CalloutSpec } from '@/components/scenes/week10/Heart3D';
import { T, vis } from '@/components/scenes/week10/common';
import { mixHex, tubeParts } from '@/components/scenes/week10/model3d';
import { foldXGeo, type FoldX, type Spine } from '@/components/scenes/week4/FoldTransverse';
import { seg } from '@/lib/sim/anim';
import { add, type V3 } from '@/lib/three-d/math';
import { blob, grid, merge, type Mesh } from '@/lib/three-d/mesh';
import type { Item3 } from '@/lib/three-d/scene';
import { ColourKey } from './common';
import { GC } from './gut3d';

/**
 * Topic 14, stage 1 (notes 1, figure p1 A–C): the transverse fold as a real 3D block. Every layer is topic 4's
 * own section (`foldXGeo`: the dorsal spine with the ectoderm and the parietal layer, the ventral spine with the
 * endoderm and the visceral layer, the vitelline duct and the yolk sac) extruded along the body axis, so the
 * block's cut face IS the notes' figure while the walls fold, the endoderm rolls into the gut tube and the
 * yolk sac stays outside, joined by the vitelline duct; then the section moves caudally, the walls meet and the
 * gut hangs from the dorsal mesentery (p1 C). A small sagittal key would only repeat stage 2, which shows the
 * cephalocaudal fold's result: the whole gut in the curled embryo.
 *
 * Axes of this block (a section, as the notes draw it): y DORSAL (up), z cranial (towards the viewer, who looks
 * at the cut face from the head end), x the embryo's LEFT, so the embryo's left is on the viewer's right.
 */

const S = 1 / 100;
/** Half-length of the block along the body axis. */
const ZL = 1.15;
/** The section's height centre (section px, y down = ventral). */
const MY = 150;

const FOLD_AXES = {
  up: 'dortsala',
  front: 'kraneala',
  side: 'ezkerra',
  sideDir: [1, 0, 0] as V3,
  edges: { up: 'Dortsala', down: 'Bentrala', front: 'Kraneala', back: 'Kaudala', side: 'Ezkerra', otherSide: 'Eskuina' },
};

export const S1 = [0, 0.2, 0.45, 0.7] as const;

/** Fold over stage time: flat → folded by S1[3]; then the section slides caudally (walls meet). */
function timing(t: number) {
  const f = 0.9 * Math.pow(seg(t, 0.06, 0.66), 1.08);
  const lam = seg(t, S1[3] + 0.04, S1[3] + 0.16);
  return { f, lam };
}

/** Section px → block space at depth z; side +1 = the embryo's right half (viewer's left), −1 its mirror. */
const W = (p: Pt, side: 1 | -1, z: number): V3 => [-side * p[0] * S, -(p[1] - MY) * S, z];

const off = (sp: Spine, i: number, d: number): Pt => [sp.pts[i][0] + sp.n[i][0] * d, sp.pts[i][1] + sp.n[i][1] * d];

/** A layer between offsets d0..d1 of a spine (samples i0..i1), extruded: its two faces, the two cut faces, its ends. */
function slab(sp: Spine, i0: number, i1: number, d0: (i: number) => number, d1: (i: number) => number, side: 1 | -1): Mesh | null {
  if (i1 - i0 < 1) return null;
  const n = i1 - i0;
  const A = (u: number, d: (i: number) => number) => {
    const i = i0 + Math.round(u * n);
    return off(sp, i, d(i));
  };
  const face = (d: (i: number) => number) => grid(n, 2, (u, v) => W(A(u, d), side, -ZL + 2 * ZL * v));
  const cut = (z: number) => grid(n, 1, (u, v) => W(v < 0.5 ? A(u, d0) : A(u, d1), side, z));
  const end = (u: number) => grid(1, 2, (a, v) => W(a < 0.5 ? A(u, d0) : A(u, d1), side, -ZL + 2 * ZL * v));
  return merge([face(d0), face(d1), cut(ZL), cut(-ZL), end(0), end(1)]);
}

/** The mesh and its reverse side: the extruded faces (and the mirrored half) do not all wind the same way. */
function twoSided(m: Mesh): Mesh {
  const idx = new Uint32Array(m.idx.length);
  for (let i = 0; i < idx.length; i += 3) {
    idx[i] = m.idx[i];
    idx[i + 1] = m.idx[i + 2];
    idx[i + 2] = m.idx[i + 1];
  }
  return merge([m, { pos: m.pos, nrm: m.nrm.map((v) => -v), uv: m.uv, idx }]);
}

const both = (f: (side: 1 | -1) => Mesh | null) => {
  const ms = [f(1), f(-1)].filter((m): m is Mesh => !!m);
  return ms.length ? twoSided(merge(ms)) : null;
};

/** The block at fold f, section slide lam. */
function foldModel(g: FoldX, dimIds: readonly string[] | null) {
  const items: Item3[] = [];
  const pts: Record<string, V3> = {};
  const top = g.topSp;
  const bot = g.botSp;
  const lit = (id: string) => !dimIds || dimIds.includes(id);
  const push = (key: string, id: string | undefined, m: Mesh | null, color: string, op: number, tissue: Item3['tissue'] = 'epithelium', quiet = false, groups?: string[]) => {
    if (!m) return;
    const on = !id || lit(id) || !!groups?.some(lit);
    items.push({ key, id, groups, mesh: m, color, deep: mixHex(color, '#000000', 0.5), tissue, opacity: op * (on ? 1 : 0.25), quiet, outline: false });
  };
  const ZF = ZL - 0.02;
  const atFace = (p: Pt, side: 1 | -1 = 1): V3 => W(p, side, ZF);

  // Dorsal spine: the embryo's surface ectoderm and its parietal (somatic) layer; past the U-turn, the amnion.
  const iB = top.iBody;
  push('ecto', 'azaleko-ektodermoa', both((s) => slab(top, 0, iB, () => 0, (i) => top.a[i], s)), C.surfaceEcto, 0.95);
  push('parietal', 'paretako-orria', both((s) => slab(top, 0, iB, (i) => top.a[i], (i) => top.a[i] + top.b[i], s)), T.parietal, 0.95, 'mesenchyme');
  push('amnion', 'amniosa', both((s) => slab(top, iB, top.pts.length - 1, () => 0, (i) => top.a[i] + top.b[i], s)), C.amnioblast, 0.45, 'membrane');
  pts['azaleko-ektodermoa'] = atFace(off(top, Math.round(iB * 0.55), top.a[Math.round(iB * 0.55)] * 0.5));
  pts['amnios-barrunbea'] = atFace([0, top.pts[0][1] - 40]);

  // Ventral spine: the endoderm (gut, then duct and yolk sac) and its visceral (splanchnic) layer.
  const iP = bot.iBody;
  // Inside the body the endoderm is the gut's lining: once it has rolled in, it stands for the gut (named "Hestea").
  push('endo', 'endodermoa', both((s) => slab(bot, 0, iP, () => 0, (i) => bot.a[i], s)), GC.endo, 0.95, 'epithelium', false, g.ff > 0.45 ? ['erdiko-hestea'] : undefined);
  push('visceral', 'errai-orria', both((s) => slab(bot, 0, iP, (i) => bot.a[i], (i) => bot.a[i] + bot.b[i], s)), T.visceral, 0.95, 'mesenchyme');
  const iT = Math.min(bot.iTurn, bot.pts.length - 1);
  push('duct', 'hodi-onfalomesenterikoa', both((s) => slab(bot, iP, iT, () => 0, (i) => bot.a[i] + bot.b[i], s)), GC.yolk, 0.9);
  push('sac', 'bitelo-zaku-sekundarioa', both((s) => slab(bot, iT, bot.pts.length - 1, () => 0, (i) => bot.a[i] + bot.b[i], s)), GC.yolk, 0.6);
  pts['endodermoa'] = atFace(off(bot, Math.round(iP * 0.35), bot.a[Math.round(iP * 0.35)] * 0.5));
  pts['errai-orria'] = atFace(off(bot, Math.round(iP * 0.7), bot.a[Math.round(iP * 0.7)] + bot.b[Math.round(iP * 0.7)] * 0.5));
  pts['paretako-orria'] = atFace(off(top, Math.round(iB * 0.85), top.a[Math.round(iB * 0.85)] + top.b[Math.round(iB * 0.85)] * 0.5));
  pts['hodi-onfalomesenterikoa'] = atFace(bot.pts[Math.round((iP + iT) / 2)]);
  pts['bitelo-zaku-sekundarioa'] = atFace(g.sacC);
  pts['heste-lumena'] = atFace([0, (bot.pts[0][1] + g.Pr[1]) / 2]);

  // Axial structures: neural tube, notochord, the two dorsal aortas, the somites (cut and extruded too).
  const rod = (key: string, id: string, p: Pt, r: number, color: string, side: 1 | -1 = 1, rx = r) => {
    const c = W(p, side, 0);
    items.push({ key, id, ...tubeParts([add(c, [0, 0, -ZL]), add(c, [0, 0, ZL])], { radius: () => r * S, ref: [1, 0, 0], sides: 18, capStart: true, capEnd: true, around: (a) => 1 + (rx / r - 1) * Math.cos(a) ** 2 }), color, deep: mixHex(color, '#000000', 0.5), tissue: 'neural', opacity: lit(id) ? 1 : 0.25 });
  };
  rod('nt', 'hodi-neurala', g.tubeC, 26, C.neural);
  rod('noto', 'notokorda', g.noto, 7, C.notochord);
  rod('aoR', 'aorta-dortsalak', g.aorta, 8, T.aorta, 1);
  rod('aoL', 'aorta-dortsalak', g.aorta, 8, T.aorta, -1);
  pts['hodi-neurala'] = atFace(g.tubeC);
  pts['aorta-dortsalak'] = atFace(g.aorta, -1);
  for (const s of [1, -1] as const) {
    const c = W(g.somite, s, 0);
    items.push({ key: `som${s}`, id: 'somitak', mesh: blob({ center: c, radii: [0.3, 0.24, ZL * 0.98], rings: 10, sides: 16 }), color: C.mesoParaxial, deep: '#7a1a20', tissue: 'mesenchyme', opacity: lit('somitak') ? 0.9 : 0.25 });
  }

  // The coelom between the two layers (a space: its walls, see-through).
  pts['enbrioi-barruko-zeloma'] = atFace(off(top, Math.round(iB * 0.92), top.a[Math.round(iB * 0.92)] + top.b[Math.round(iB * 0.92)] + 14));
  // The dorsal mesentery: from the gut roof up to the axial mesenchyme (p1 C).
  if (g.mes > 1) {
    const y0 = g.S0[1];
    const y1 = g.S0[1] - g.mes;
    // Two layers of the visceral mesoderm, one from each side, back to back in the midline.
    const layer = (side: 1 | -1) => grid(6, 2, (u, v) => W([g.mesWaist, y0 + (y1 - y0) * u], side, -ZF + 2 * ZF * v));
    push('mes', 'mesenterio-dortsala', both(layer), T.visceral, 0.95, 'mesenchyme');
    pts['mesenterio-dortsala'] = atFace([0, g.S0[1] - g.mes * 0.5]);
  }
  return { items, pts };
}

/** Stage 1 scene. */
export function Fold3D({ t }: SceneProps) {
  const { f, lam } = timing(t);
  const g = foldXGeo(f, lam);
  const i = t < S1[1] ? 0 : t < S1[2] ? 1 : t < S1[3] ? 2 : 3;
  const dim = i === 2 ? ['endodermoa', 'heste-lumena', 'hodi-onfalomesenterikoa', 'bitelo-zaku-sekundarioa', 'errai-orria'] : i === 3 ? ['endodermoa', 'errai-orria', 'mesenterio-dortsala', 'heste-lumena'] : null;
  const m = foldModel(g, dim && t > (i === 2 ? S1[2] : S1[3]) + 0.02 ? dim : null);
  const camera = cameraAt(t, [
    [0, orbit(-24, 22, 10.5, [0, 0.0, 0.2], [0, -10])],
    [S1[1], orbit(-14, 14, 10, [0, -0.2, 0.3], [0, -10]), 0.08],
    [S1[2], orbit(10, 10, 9, [0, -0.5, 0.4], [0, -10]), 0.08],
    [S1[3], orbit(-4, 6, 8, [0, 0.0, 0.5], [0, -10]), 0.08],
  ]);
  const names: CalloutSpec[] = [
    { id: 'azaleko-ektodermoa', p: 'azaleko-ektodermoa', show: vis(t, 0, S1[2]) },
    { id: 'endodermoa', p: 'endodermoa', show: vis(t, 0) },
    { id: 'errai-orria', p: 'errai-orria', text: 'Errai mesodermoa', show: vis(t, S1[1] + 0.04) },
    { id: 'amnios-barrunbea', p: 'amnios-barrunbea', show: vis(t, 0, S1[2]), small: true },
    { id: 'bitelo-zaku-sekundarioa', p: 'bitelo-zaku-sekundarioa', text: 'Bitelo zakua', show: vis(t, 0, S1[3]) },
    { id: 'hodi-onfalomesenterikoa', p: 'hodi-onfalomesenterikoa', show: vis(t, S1[2] + 0.06, S1[3]) },
    { id: 'enbrioi-barruko-zeloma', p: 'enbrioi-barruko-zeloma', text: 'Enbrioi barruko barrunbea', show: vis(t, S1[2] + 0.04), small: true },
    { id: 'erdiko-hestea', p: 'heste-lumena', text: 'Hestea', show: vis(t, S1[2] + 0.08) },
    { id: 'mesenterio-dortsala', p: 'mesenterio-dortsala', text: 'Atzeko mesenterioa', show: vis(t, S1[3] + 0.12) },
  ].filter((n) => m.pts[n.p]);
  return (
    <ModelView
      model={m}
      continuity="digestioa-14-tolespena"
      camera={camera}
      names={names}
      axes={FOLD_AXES}
      caption="Zeharkako tolespena (3D blokea; ebaketa-aurpegia = apunteetako irudia, A → C)"
      over={() => (
        <>
          <ColourKey
            items={[
              { color: C.surfaceEcto, text: 'ektodermoa' },
              { color: GC.endo, text: 'endodermoa' },
              { color: T.parietal, text: 'paretako orria' },
              { color: T.visceral, text: 'errai orria' },
            ]}
            show={1}
            title="Kolorea = geruza"
            y={46}
          />
          <Note x={500} y={612} tone="accent" show={vis(t, 0, S1[1])}>
            Gogoratu: enbrioi laua (diskoa) bi planotan tolesten da, zeharkakoan eta sagitalean
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[1], S1[2])}>
            Zeharkako tolespena: alboko paretak beherantz eta erdirantz tolesten dira, endodermoa barnera eramanez
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[2], S1[3])}>
            Endodermoa eta bitelo zakuaren zatirik garrantzitsuena gorputzaren barnean geratzen dira: hestea; zakua kanpoan, hodi onfalomesenterikoaren bidez lotuta
          </Note>
          <Note x={500} y={612} tone="accent" show={vis(t, S1[3])}>
            Paretak elkartzen dira: hestea hodi itxia da, atzeko mesenteriotik zintzilik (C irudia)
          </Note>
        </>
      )}
    />
  );
}
