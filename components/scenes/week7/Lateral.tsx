'use client';

import { useId } from 'react';
import { Arrow, C, Label, Note, OnTop, Part, clamp, lerp, mix, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { CavityKey, Defs7, KEY7, P, along, f1, poly, sm, spline, vis } from './common';
import { HEART_C, LoopHeart } from './LoopHeart';
import { CANAL, DUCT, HEART_IN, SideEmbryo, backAt, placeXY, planeAt, type Place, type SideState } from './SideEmbryo';

export { HEART_C, HEART_SINUS, HEART_VENT, LoopHeart, cum, table, tubeD } from './LoopHeart';

/**
 * Topic 7's side views of the ~4–5 week embryo (apunteen 24. orriko irudiak: "Hasierako perikardio
 * barrunbea · Septum transversuma · Erreten perikardioperitonealak · Peritoneo barrunbea"; Langman 15.1),
 * drawn on topic 5's day-32 embryo (SideEmbryo: the same figure as topics 5, 6 and 9, its trunk see-through,
 * the cavities inside it). Ventral is on the left, dorsal on the right, cranial at the top.
 *  - `zeloma` (§1): the intra-embryonic coelom is one continuous cavity from the future thorax to the
 *    future abdomen; the head fold brought the heart into its cranial part;
 *  - `septum-transversum` (§2): the septum condenses at C3–C5 as a mesenchymal plate between the heart
 *    and the gut, anchored ventrally on the body wall and dorsally on the mesenchyme round the oesophagus;
 *    it splits the coelom into the primitive pericardial cavity (above) and the peritoneal cavity (below),
 *    except for the two dorsolateral pericardioperitoneal canals (beside the foregut, and in a loupe as
 *    the transverse section at the septum).
 */

const ORIENT_LABELS = { left: 'Bentrala', right: 'Dortsala' };
export const lateralOrientation = { top: 'Kraneala', bottom: 'Kaudala', ...ORIENT_LABELS };

// ——— The two side views: topic 5's day-32 embryo (SideEmbryo), its trunk see-through ———

/** The embryo in the frame: centred between the two label columns. */
const PLACE: Place = { dx: -40, dy: 14, s: 1.04 };
const A = placeXY(PLACE);
const bead = (k: number, d = 0) => backAt(0.06 + (0.9 * k) / 35, d);

/** A name column whose names follow their anchors down the frame, in the anchors' order (leaders never cross). */
export interface Item {
  id: string;
  a: Pt;
  show?: number;
  small?: boolean;
}
/** A box no leader may pass through (a level tag, a descent arrow). */
export interface Band {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
/** The box round a level tag (a Note centred on x, y), with room for its halo. */
export const tagBand = (x: number, y: number): Band => ({ x0: x - 17, x1: x + 17, y0: y - 12, y1: y + 12 });
/** Where a right-column leader is at x: the Label's plate edge (lx) → horizontal to the elbow (35 %) → the anchor. */
function leaderY(y: number, a: Pt, x: number, lx: number) {
  const ex = lx + (a[0] - lx) * 0.35;
  if (x >= ex) return y;
  if (x <= a[0]) return null;
  return y + ((a[1] - y) * (ex - x)) / (ex - a[0]);
}
function crosses(y: number, a: Pt, bands: Band[], lx: number) {
  for (const b of bands)
    for (let i = 0; i <= 8; i++) {
      const ly = leaderY(y, a, b.x0 + ((b.x1 - b.x0) * i) / 8, lx);
      if (ly !== null && ly > b.y0 && ly < b.y1) return true;
    }
  return false;
}
const cut = (p: Pt, q: Pt, r: Pt, s: Pt) => {
  const d = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return d(p, q, r) * d(p, q, s) < 0 && d(r, s, p) * d(r, s, q) < 0;
};
/** How many pairs of right-column leaders cross. */
function crossings(out: { y: number; a: Pt }[], lx: number) {
  const legs = out.map((r) => {
    const ex = lx + (r.a[0] - lx) * 0.35;
    return [[lx, r.y], [ex, r.y], r.a] as Pt[];
  });
  let n = 0;
  for (let i = 0; i < legs.length; i++)
    for (let j = i + 1; j < legs.length; j++)
      if ([0, 1].some((a) => [0, 1].some((b) => cut(legs[i][a], legs[i][a + 1], legs[j][b], legs[j][b + 1])))) n++;
  return n;
}
/**
 * The names follow their anchors down the column, in an order whose leaders do not cross (anchors further from
 * the column come first at about the same height: their leaders pass over the nearer anchors), each clear of the
 * bands. The names keep these places (noArrange): the view's label layer would not know the bands.
 */
export function column(items: Item[], top = 64, bottom = 560, gap = 34, x = 790, bands: Band[] = []) {
  const lx = x - 6;
  let best: ReturnType<typeof columnAt> = [];
  let bestN = Infinity;
  for (const f of [0.5, 0.3, 0.15, 0, 0.75]) {
    const out = columnAt(items, top, bottom, gap, x, bands, f);
    const n = crossings(out, lx) * 10 + out.filter((r) => crosses(r.y, r.a, bands, lx)).length;
    if (n < bestN) [best, bestN] = [out, n];
    if (n === 0) break;
  }
  return best;
}
function columnAt(items: Item[], top: number, bottom: number, gap: number, x: number, bands: Band[], f: number) {
  const key = (r: Item) => r.a[1] + f * (r.a[0] - x);
  const out = items
    .filter((r) => (r.show ?? 1) > 0)
    .sort((p, q) => key(p) - key(q))
    .map((r) => ({ ...r, y: 0 }));
  const lx = x - 6;
  // A name's right end (the rules' estimate): long ones keep out of the orientation pill and the toolbar.
  const ok = (r: Item, y: number) => {
    const x1 = x + r.id.length * (r.small ? 6.4 : 7.1);
    if (x1 > 891 && y > 290 && y < 352) return false;
    if (x1 > 932 && y < 232) return false;
    return !crosses(y, r.a, bands, lx);
  };
  // The nearest height at or below `from` (or, failing that, above it down to `floor`) that is clear.
  const clear = (r: Item, from: number, floor: number, ceil: number) => {
    for (let d = 0; d <= 240; d += 2) {
      if (from + d <= ceil && ok(r, from + d)) return from + d;
      if (from - d >= floor && ok(r, from - d)) return from - d;
    }
    return from;
  };
  out.forEach((r, i) => {
    const floor = i ? out[i - 1].y + gap : top;
    r.y = clear(r, Math.max(r.a[1], floor), floor, bottom);
  });
  // Too low at the bottom: pushed back up, each still clear of the bands where it can be.
  for (let i = out.length - 1; i >= 0; i--) {
    const ceil = i === out.length - 1 ? bottom : out[i + 1].y - gap;
    if (out[i].y > ceil) out[i].y = clear(out[i], ceil, i ? out[i - 1].y + gap : top, ceil);
  }
  // A long name still under the orientation pill: lifted above it, the names over it lifted with it.
  const pill = (r: Item, y: number) => x + r.id.length * (r.small ? 6.4 : 7.1) > 891 && y > 290 && y < 352;
  out.forEach((r, i) => {
    if (!pill(r, r.y) || 290 - i * gap < top) return;
    r.y = 290;
    for (let j = i - 1; j >= 0; j--) out[j].y = Math.min(out[j].y, out[j + 1].y - gap);
  });
  return out;
}

/** Inside the pericardial cavity (dorsal to the heart, clear of it) and on the heart's tube: reached from the dorsal side. */
export const PERI_AT: Pt = [626, 336];
export const HEART_AT: Pt = [590, 330];

/** The region names of the one coelom (uppercase, spaced, as the region names of topic 1). */
function Region({ x, y, show, children }: { x: number; y: number; show: number; children: string }) {
  if (show <= 0.02) return null;
  return (
    <OnTop>
      <text x={x} y={y} textAnchor="middle" fill="#efe6ff" fontSize={11} fontWeight={700} letterSpacing="0.12em" opacity={show} style={{ textTransform: 'uppercase', paintOrder: 'stroke', stroke: 'rgba(12,8,20,0.85)', strokeWidth: 3.5 }}>
        {children}
      </text>
    </OnTop>
  );
}

/**
 * Where the heart lay before the head fold (week 3, in front of the head) and the way it came: round the
 * face, ventrally, into the heart prominence, in the embryo's coordinates; it ends where SideEmbryo draws it.
 */
const FOLD_ARC: Pt[] = spline([[318, 196], [298, 262], [318, 330], [376, 372], [446, 362], [520, 336], [HEART_IN.x, HEART_IN.y]], 10);
const turnAt = (k: number) => along(FOLD_ARC, clamp(k));

/**
 * 7:zeloma:sagitala — shown from the stage's last two steps:
 *  - .86 where the heart in the cranial coelom came from: the head fold swung it in from in front of the
 *    head (a small dot marks where it lay, the arc the way it went: the topic-4 convention);
 *  - .93 the coelom is one cavity, from the future thorax (round the heart) to the future abdomen.
 */
export function CoelomExtent({ t, reduced }: SceneProps) {
  const late = t >= 0.84;
  const turn = late ? sm(seg(t, 0.87, 0.915)) : 1;
  const trail = late ? vis(t, 0.862, 0.93, 0.012) : 0;
  const sweep = late ? seg(t, 0.94, 0.985) : 1;
  const one = late ? seg(t, 0.93, 0.945) : 1;
  const start = A(FOLD_ARC[0]);
  const c = turnAt(turn);
  const done = FOLD_ARC.filter((_, i) => i / (FOLD_ARC.length - 1) <= turn + 1e-6);
  const heartT = `translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(HEART_IN.rot - 160 * (1 - turn))}) scale(${lerp(0.24, HEART_IN.k, turn).toFixed(3)}) translate(${-HEART_C[0]} ${-HEART_C[1]})`;
  const st: SideState = { upper: P.coelomSolid, lower: P.coelomSolid, side: P.coelomSolid, sep: 0, canal: 0, lung: 0, ppm: 0, pom: 0, ids: { upper: 'enbrioi-barruko-zeloma', lower: 'enbrioi-barruko-zeloma', canal: 'enbrioi-barruko-zeloma', gut: 'aurreko-hestea' } };
  const [pa, pb] = planeAt(0.26).map(A);
  const heartA = A([lerp(c[0], 566, turn ** 3), lerp(c[1], 318, turn ** 3)]);
  // While the head fold swings it in, the heart is in front of the face and named from the ventral side; once in
  // place it is behind the face, and named from the dorsal side (a ventral leader would cross the face).
  // Near the end of the swing the name hands over: the ventral one fades as the heart passes behind the face, the
  // dorsal one fades in (its anchor follows the heart to HEART_AT), so the heart is never drawn without a name.
  const leftShow = late ? 1 - seg(turn, 0.88, 0.95) : 0;
  const rightShow = late ? seg(turn, 0.91, 0.98) : 1;
  const heartR = A([lerp(c[0], HEART_AT[0], turn ** 3), lerp(c[1], HEART_AT[1], turn ** 3)]);
  const right = column([
    ...(rightShow > 0 ? [{ id: 'bihotza', a: heartR }] : []),
    { id: 'hodi-neurala', a: A(bead(6.5, 6).p) },
    { id: 'somitak', a: A(bead(11, 16).p), small: true },
    { id: 'aurreko-hestea', a: A([670, 268]) },
    { id: 'mesenterio-dortsala', a: A([700, 452]), small: true },
    { id: 'erdiko-hestea', a: A([640, 458]) },
  ]);
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <SideEmbryo st={st} place={PLACE} whole={1} wholeId="enbrioi-barruko-zeloma" septum={false} meso={0} midgut heart={turn > 0.999} beating={!reduced} reduced={reduced} pour={late ? seg(t, 0.935, 0.975) : 1}>
        {/* The head fold's path for the heart: from in front of the head round the face to the cranial coelom. */}
        {trail > 0.01 && (
          <g opacity={trail} pointerEvents="none">
            <path d={smoothPath(FOLD_ARC, false, 0.3)} fill="none" stroke="#ffd29a" strokeWidth={1.4} opacity={0.35} />
            {done.length > 1 && <path d={smoothPath([...done, c], false, 0.3)} fill="none" stroke="#ffd29a" strokeWidth={2.8} strokeLinecap="round" />}
            <circle cx={f1(FOLD_ARC[0][0])} cy={f1(FOLD_ARC[0][1])} r={5.5} fill="#0f0f11" stroke="#ffd29a" strokeWidth={2.2} />
          </g>
        )}
        {turn <= 0.999 && (
          <Part id="bihotza">
            <g transform={heartT}>
              <LoopHeart beating={!reduced} />
            </g>
          </Part>
        )}
      </SideEmbryo>
      {/* The plane of the transverse view (midgut level, through the midgut loop at the yolk stalk). */}
      <g opacity={one} pointerEvents="none">
        <path d={`M${f1(pa[0])},${f1(pa[1])}L${f1(pb[0])},${f1(pb[1])}`} stroke="#0f0f11" strokeWidth={4.6} strokeLinecap="round" opacity={0.8} />
        <path d={`M${f1(pa[0])},${f1(pa[1])}L${f1(pb[0])},${f1(pb[1])}`} stroke="#ffb86b" strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <Note x={start[0] + 4} y={start[1] - 26} size={12.5} tone="accent" show={trail}>
        hasieran (3. astea)
      </Note>
      <Note x={500} y={616} tone="accent" show={late ? vis(t, 0.862, 0.93, 0.012) : 0}>
        Buruaren tolespenak (4. astea) bihotza buruaren aurretik hona ekarri zuen: aurreko hestearen aurrera
      </Note>
      <Note x={846} y={580} size={12.5} show={one}>
        marra laranja: zeharkako ebakiaren maila
      </Note>
      <Note x={500} y={616} tone="accent" show={one}>
        Barrunbe bakarra: geroko toraxetik (bihotza) geroko abdomenera (hestea)
      </Note>
      {/* One cavity from the thorax to the abdomen: the arrows run from its middle up and down. */}
      <Arrow from={A([548, 402])} to={A([lerp(548, 540, sweep), lerp(402, 284, sweep)])} color="#d9c6ff" width={2.6} show={sweep > 0.05 ? 1 : 0} bend={-0.08} />
      <Arrow from={A([560, 410])} to={A([lerp(560, 560, sweep), lerp(410, 484, sweep)])} color="#d9c6ff" width={2.6} show={sweep > 0.05 ? 1 : 0} bend={0.1} />
      <Region x={A([600, 262])[0]} y={A([600, 262])[1]} show={one}>
        geroko toraxa
      </Region>
      <Region x={A([590, 492])[0]} y={A([590, 492])[1]} show={one}>
        geroko abdomena
      </Region>

      <CavityKey rows={[KEY7.zeloma]} />
      {leftShow > 0.01 && <Label id="bihotza" x={236} y={250} ax={heartA[0]} ay={heartA[1]} show={leftShow} />}
      <Label id="enbrioi-barruko-zeloma" x={236} y={440} ax={A([520, 452])[0]} ay={A([520, 452])[1]} />
      <Label id="hodi-onfalomesenterikoa" x={236} y={520} ax={A(DUCT[2])[0]} ay={A(DUCT[2])[1]} small />
      {right.map((r) => (
        <Label key={r.id} id={r.id} x={790} y={r.y} ax={r.a[0]} ay={r.a[1]} small={r.small} show={r.id === 'bihotza' ? rightShow : 1} noArrange />
      ))}
    </g>
  );
}

/** 7:septum-transversum:sagitala — the septum condenses at C3–C5 and splits the coelom, except the canals. */
export function SeptumLateral({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const cells = seg(t, 0.185, 0.3);
  const reach = seg(t, 0.2, 0.32) * 0.9 + 0.1 * seg(t, 0.41, 0.47);
  const solid = seg(t, 0.27, 0.34);
  const eso = seg(t, 0.36, 0.42);
  const anchors = vis(t, 0.44, 0.56, 0.04);
  const split = seg(t, 0.55, 0.63);
  const canals = seg(t, 0.72, 0.77);
  const loupe = seg(t, 0.75, 0.8);
  const levels = vis(t, 0.18, 0.54);
  const upper = mix(P.coelomSolid, P.periSolid, split);
  const st: SideState = {
    upper,
    lower: mix(P.coelomSolid, P.peritoSolid, split),
    side: mix(upper, '#56c8f0', 0.35 + 0.4 * canals),
    sep: split,
    canal: canals,
    lung: 0,
    ppm: 0,
    pom: 0,
    ids: { upper: 'hasierako-perikardio-barrunbea', lower: 'peritoneo-barrunbea', canal: canals > 0.02 ? 'erreten-perikardioperitonealak' : 'hasierako-perikardio-barrunbea', gut: 'aurreko-hestea' },
  };
  const canalA = A(CANAL[2]);
  // C3–C5: the levels the septum faces when it forms, just outside the back; no leader runs through them.
  const tags = ['C3', 'C4', 'C5'].map((l, j) => {
    const q = A(bead(14 + j, -22).p);
    return { l, x: q[0] + 6, y: q[1] + 3 };
  });
  const right = column(
    [
      // The heart and the pericardial cavity are named from the dorsal side: from the ventral side the face is in the way.
      // In the cavity's lower part, below the heart: its leader runs under the heart's, clear of its anchor.
      { id: 'hasierako-perikardio-barrunbea', a: A([572, 352]), show: split, small: true },
      { id: 'bihotza', a: A(HEART_AT) },
      { id: 'hodi-neurala', a: A(bead(6.5, 6).p) },
      { id: 'somitak', a: A(bead(11, 16).p), small: true },
      { id: 'aurreko-hestea', a: A([668, 246]) },
      { id: 'hestegorri-inguruko-mesenkima', a: A([696, 300]), show: eso, small: true },
      { id: 'erreten-perikardioperitonealak', a: [canalA[0] + 4, canalA[1]] as Pt, show: canals, small: true },
      { id: 'mesenterio-dortsala', a: A([700, 452]), small: true },
      { id: 'erdiko-hestea', a: A([640, 458]) },
    ],
    64,
    // With the loupe the column is shorter: tighter rows keep the long canal name below the orientation pill.
    loupe > 0.01 ? 460 : 560,
    loupe > 0.01 ? 27 : 34,
    790,
    levels > 0.02 ? tags.map((q) => tagBand(q.x, q.y)) : [],
  );
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <SideEmbryo st={st} place={PLACE} whole={1 - split} wholeId="enbrioi-barruko-zeloma" cells={cells} reach={reach} solid={solid} meso={eso} anchors={anchors} midgut beating={!reduced} reduced={reduced} flow={canals} />
      {/* C3–C5: the levels the septum faces when it forms (the somites beside it). */}
      {levels > 0.02 &&
        tags.map((q) => (
          <Note key={q.l} x={q.x} y={q.y} size={13} tone="accent" show={levels}>
            {q.l}
          </Note>
        ))}
      <CanalLoupe show={loupe} reduced={!!reduced} cid={cid} src={canalA} />
      <Note x={500} y={616} tone="accent" show={vis(t, 0.19, 0.36)}>
        4. astea: lepo mailan (C3–C5) mesenkima trinkotu eta trenkada horizontala sortzen da
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, 0.36, 0.54)}>
        Aurrean eta alboetan gorputz paretan finkatuta; atzean, hestegorri inguruko mesenkiman
      </Note>
      <Note x={500} y={616} tone="accent" show={vis(t, 0.54, 0.72)}>
        Goian hasierako perikardio barrunbea · behean peritoneo barrunbea
      </Note>
      <Note x={440} y={616} tone="accent" show={vis(t, 0.72)}>
        Banaketa partziala: bi erretenek goiko eta beheko barrunbeak lotzen dituzte
      </Note>

      <CavityKey rows={split < 0.5 ? [KEY7.zeloma, cells > 0.02 && KEY7.septum] : [KEY7.hperi, canals > 0.02 && KEY7.canal, KEY7.perito, KEY7.septum]} />
      <Label id="enbrioi-barruko-zeloma" x={236} y={366} ax={A([530, 346])[0]} ay={A([530, 346])[1]} show={1 - split} />
      {/* The septum's upper half: its leader passes above the vitelline duct's anchor, not over it. */}
      <Label id="septum-transversum" x={236} y={A([552, 382])[1]} ax={A([552, 382])[0]} ay={A([552, 382])[1]} show={seg(t, 0.2, 0.24)} />
      <Label id="peritoneo-barrunbea" x={236} y={470} ax={A([522, 462])[0]} ay={A([522, 462])[1]} show={split} small />
      <Label id="hodi-onfalomesenterikoa" x={236} y={530} ax={A(DUCT[2])[0]} ay={A(DUCT[2])[1]} small />
      {right.map((r) => (
        <Label key={r.id} id={r.id} x={790} y={r.y} ax={r.a[0]} ay={r.a[1]} show={r.show} small={r.small} noArrange />
      ))}
    </g>
  );
}

/** Transverse section at the septum (dorsal up), in a loupe: the septum leaves two dorsolateral canals open. */
const LOUPE: Pt = [896, 562];
const LR = 62;
function CanalLoupe({ show, reduced, cid, src }: { show: number; reduced: boolean; cid: string; src: Pt }) {
  if (show <= 0.01) return null;
  const [cx, cy] = LOUPE;
  // Source of the cone: the canal in the main drawing.
  const [sx, sy] = src;
  const dx = sx - cx;
  const dy = sy - cy;
  const L = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const half = Math.acos(Math.min(1, LR / L));
  const t1: Pt = [cx + Math.cos(ang + half) * LR, cy + Math.sin(ang + half) * LR];
  const t2: Pt = [cx + Math.cos(ang - half) * LR, cy + Math.sin(ang - half) * LR];
  // Section (in loupe coordinates, centre 0,0): body wall ring, neural tube + aorta dorsally, oesophagus in its mesenchyme, septum ventral.
  const wallOut = 'M-74,-6 C-74,-50 -40,-74 0,-74 C40,-74 74,-50 74,-6 C74,40 44,72 0,74 C-44,72 -74,40 -74,-6Z';
  const septum = 'M-60,10 C-48,-6 -30,-4 -22,4 C-12,14 12,14 22,4 C30,-4 48,-6 60,10 C58,40 34,62 0,64 C-34,62 -58,40 -60,10Z';
  const flowD = (k: number) => `M${k * 34},-10 C${k * 40},-26 ${k * 40},-30 ${k * 34},-34`;
  return (
    <g opacity={show}>
      <defs>
        <clipPath id={`w7-loupe${cid}`}>
          <circle cx={cx} cy={cy} r={LR} />
        </clipPath>
        <linearGradient id={`w7-cone${cid}`} gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={cx} y2={cy}>
          <stop offset="0" stopColor="#7fc8e8" stopOpacity={0.3} />
          <stop offset="1" stopColor="#7fc8e8" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <path d={poly([[sx, sy], t1, t2])} fill={`url(#w7-cone${cid})`} pointerEvents="none" />
      <circle cx={cx} cy={cy} r={LR + 3} fill="#0b0d12" stroke="#7fc8e8" strokeWidth={2} opacity={0.95} pointerEvents="none" />
      {/* Every piece of the small section names itself too: the same parts as the big drawing. */}
      <g clipPath={`url(#w7-loupe${cid})`}>
        <g transform={`translate(${cx} ${cy}) scale(0.94)`}>
          <Part id="gorputz-pareta" quiet>
            <path d={wallOut} fill={P.wall} />
            <path d={wallOut} fill="url(#w7-mesench)" />
          </Part>
          {/* Pericardial cavity side (cut above the septum): dark coelom between the wall and the septum. */}
          <Part id="hasierako-perikardio-barrunbea">
            <path d="M-62,-4 C-62,-36 -34,-54 0,-54 C34,-54 62,-36 62,-4 C62,30 40,56 0,58 C-40,56 -62,30 -62,-4Z" fill={P.space} />
            <path d="M-62,-4 C-62,-36 -34,-54 0,-54 C34,-54 62,-36 62,-4 C62,30 40,56 0,58 C-40,56 -62,30 -62,-4Z" fill={P.peri} />
          </Part>
          {/* Dorsal block: neural tube, notochord, aorta and the oesophageal mesenchyme. */}
          <Part id="gorputz-pareta" quiet>
            <path d="M-26,-74 C-26,-60 -18,-40 -18,-24 C-18,-6 -10,8 0,8 C10,8 18,-6 18,-24 C18,-40 26,-60 26,-74Z" fill={P.wall} />
            <path d="M-26,-74 C-26,-60 -18,-40 -18,-24 C-18,-6 -10,8 0,8 C10,8 18,-6 18,-24 C18,-40 26,-60 26,-74Z" fill="url(#w7-mesench)" />
          </Part>
          <Part id="hodi-neurala">
            <circle cx={0} cy={-62} r={10} fill={C.neural} stroke="rgba(10,16,48,0.7)" />
            <circle cx={0} cy={-62} r={2.6} fill="#101a3a" />
          </Part>
          <Part id="notokorda">
            <circle cx={0} cy={-46} r={3} fill={C.notochord} />
          </Part>
          <Part id="aorta-dortsalak">
            <circle cx={-6} cy={-36} r={3.6} fill={C.artery} />
            <circle cx={6} cy={-36} r={3.6} fill={C.artery} />
          </Part>
          <Part id="hestegorri-inguruko-mesenkima">
            <ellipse cx={0} cy={-10} rx={17} ry={15} fill={P.eso} opacity={0.75} />
          </Part>
          <Part id="aurreko-hestea">
            <circle cx={0} cy={-10} r={6.5} fill={P.gut} />
            <circle cx={0} cy={-10} r={2.4} fill="#3a2a10" />
          </Part>
          {/* The septum: ventral and lateral on the wall, dorsally on the oesophageal mesenchyme… */}
          <Part id="septum-transversum">
            <path d={septum} fill={P.septum} />
            <path d={septum} fill="url(#w7-mesench)" />
            <path d={septum} fill="none" stroke={P.septumDeep} strokeWidth={1.2} />
          </Part>
          {/* …leaving the two canals open on each side of the oesophagus. */}
          <Part id="erreten-perikardioperitonealak">
            {[-1, 1].map((k) => (
              <g key={k}>
                <ellipse cx={k * 36} cy={-20} rx={12} ry={15} fill={P.space} />
                <ellipse cx={k * 36} cy={-20} rx={12} ry={15} fill={P.canal} stroke="#7fc8e8" strokeWidth={1.4} />
                {!reduced &&
                  [0, 1].map((j) => (
                    <circle key={j} r={2.2} fill="#c8ecff">
                      <animateMotion dur="1.6s" repeatCount="indefinite" begin={`${(-j * 0.8).toFixed(1)}s`} path={flowD(k)} />
                    </circle>
                  ))}
              </g>
            ))}
          </Part>
        </g>
      </g>
      <circle cx={cx} cy={cy} r={LR + 3} fill="none" stroke="#7fc8e8" strokeWidth={2} pointerEvents="none" />
      <Note x={cx - 14} y={cy - LR - 14} size={12.5}>
        zeharkako ebakia septumaren mailan
      </Note>
    </g>
  );
}
