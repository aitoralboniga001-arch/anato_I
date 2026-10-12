'use client';

import { Label, Note, Part, clamp, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { somiteClose, somiteLips } from '@/components/scenes/week4-meso/Stage3Somite';
import { SOMITE, placer } from '@/components/scenes/week4-meso/trunk';
import { Steps, W, f1, vis } from './common';
import { CLOSE, FRONTIER, Frontier, retell } from './Somite';

/**
 * 9:somitaren-paretak — 2.2 "birpasoa": the somite's walls and what each makes, on topic 4's close-up again
 * (same drawing as topic 4 and as the myotome view of this topic). Topic 9 adds the walls named on the
 * epithelial somite, the sclerotome cells that cross the green frontier (costal cartilage), the rib's two
 * parts, and the muscle precursors that cross it too.
 */

const M = placer(CLOSE);
const SC: Pt = M([SOMITE.cx, SOMITE.cy]);
const RX = SOMITE.rx * CLOSE.k;
const RY = SOMITE.ry * CLOSE.k;
/** An arc of the somite wall (degrees, SVG sense: 0 = lateral, 90 = ventral, 180 = medial, 270 = dorsal). */
function wallArc(a0: number, a1: number) {
  const n = 24;
  const k = 0.88;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [SC[0] + Math.cos(a) * RX * k, SC[1] + Math.sin(a) * RY * k] as Pt;
  });
  return smoothPath(pts, false, 0.3);
}
const WALLS = [
  { id: 'somitaren-atzeko-pareta', a0: 200, a1: 340, color: '#ffd1c2' },
  { id: 'somitaren-erdialdeko-pareta', a0: 140, a1: 200, color: '#f59e7a' },
  { id: 'somitaren-aurreko-pareta', a0: -20, a1: 140, color: '#c2543c' },
];
const wallMid = (w: (typeof WALLS)[number]): Pt => {
  const a = (((w.a0 + w.a1) / 2) * Math.PI) / 180;
  return [SC[0] + Math.cos(a) * RX * 0.88, SC[1] + Math.sin(a) * RY * 0.88];
};

/** The rib (from topic 4's own rib line), split where it crosses the frontier: bony part medially, costal cartilage beyond. */
const RIB = somiteClose(1).rib;
const CROSS = (() => {
  let best = 0;
  let d = Infinity;
  RIB.forEach((p, i) => {
    for (const q of FRONTIER) {
      const e = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (e < d) {
        d = e;
        best = i;
      }
    }
  });
  return best;
})();
const BONE = RIB.slice(0, CROSS + 1);
const CART = RIB.slice(CROSS);

/** Cells that leave across the frontier: from beside the somite into the parietal layer (no route drawn). */
function Crossers({ k, color, n, seed, from, into }: { k: number; color: string; n: number; seed: number; from: Pt; into: Pt }) {
  if (k <= 0.01) return null;
  // Where the frontier meets the parietal layer → spread along the layer towards its anchor.
  const gate = FRONTIER.reduce((b, q) => (Math.hypot(q[0] - into[0], q[1] - into[1]) < Math.hypot(b[0] - into[0], b[1] - into[1]) ? q : b));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const d = rand(seed + i * 2.3) * 0.4;
        const u = clamp((k - d) / (1 - d));
        if (u <= 0) return null;
        const r = 0.25 + 0.75 * rand(seed + i * 5.1);
        const to: Pt = [lerp(gate[0], into[0], r) + (rand(seed + i * 7.7) - 0.5) * 14, lerp(gate[1], into[1], r) + (rand(seed + i * 9.3) - 0.5) * 14];
        const p: Pt = [lerp(from[0] + (rand(i + seed) - 0.5) * 30, to[0], u), lerp(from[1] + (rand(i * 3 + seed) - 0.5) * 30, to[1], u)];
        return <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={5.5} fill={color} stroke="#fff3e0" strokeWidth={1.4} />;
      })}
    </g>
  );
}

/** Thorax in miniature (from above): vertebra, rib (bone, then cartilage) round to the sternum in front. */
function ThoraxInset({ show, ribs }: { show: number; ribs: number }) {
  if (show <= 0.01) return null;
  const x0 = 22;
  const y0 = 452;
  const c: Pt = [x0 + 104, y0 + 78];
  const arc = (a0: number, a1: number, sd: 1 | -1) =>
    smoothPath(Array.from({ length: 13 }, (_, i) => {
      const a = ((a0 + ((a1 - a0) * i) / 12) * Math.PI) / 180;
      return [c[0] + sd * Math.cos(a) * 72, c[1] + Math.sin(a) * 50] as Pt;
    }), false, 0.3);
  return (
    <g opacity={show}>
      <rect x={x0} y={y0} width={208} height={150} rx={12} fill="#1d0f16" stroke="rgba(255,220,200,0.35)" strokeWidth={1.2} />
      <Note x={x0 + 104} y={y0 + 14} size={11} tone="dim">
        Toraxa goitik (atzea goian)
      </Note>
      <g opacity={ribs}>
      <Part id="saihets-hezurra" show={ribs}>
        {([1, -1] as const).map((sd) => (
          <path key={sd} d={arc(-80, 30, sd)} fill="none" stroke={W.bone} strokeWidth={7} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="saihets-kartilagoa" show={ribs}>
        {([1, -1] as const).map((sd) => (
          <path key={sd} d={arc(30, 82, sd)} fill="none" stroke={W.cart} strokeWidth={7} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="esternoia" show={ribs}>
        <rect x={c[0] - 9} y={c[1] + 44} width={18} height={14} rx={4} fill={W.bone} stroke={W.boneDeep} strokeWidth={1.2} />
      </Part>
      </g>
      <Part id="ornoak">
        <circle cx={c[0]} cy={c[1] - 40} r={12} fill={W.bone} stroke={W.boneDeep} strokeWidth={1.2} />
      </Part>
    </g>
  );
}

export function SomiteWalls({ t }: SceneProps) {
  // Topic-4 clock: epithelial somite (walls named) → sclerotome forms and goes medially → (hold: rib, crossers) →
  // dermatomyotome → dermatome → myotome → lip cells into the body wall.
  const t4 = retell(t, [[0.2, 0.06], [0.3, 0.38], [0.52, 0.38], [0.62, 0.62], [0.64, 0.64], [0.72, 0.8], [0.76, 0.8], [0.84, 0.87]]);
  const { drawing, anchors: a } = somiteClose(t4);
  const walls = vis(t, 0.1, 0.35) * (1 - 0.45 * seg(t, 0.22, 0.28));
  // The dorsal wall again at 0.52: by now it is the dermomyotome sheet (centre → dermatome, lips → muscle precursors).
  const dorsal = vis(t, 0.52, 0.64);
  const lips = vis(t, 0.53, 0.76);
  const sclLat = seg(t, 0.32, 0.38);
  const rib = seg(t, 0.37, 0.42);
  const front = seg(t, 0.32, 0.35);
  const myoX = seg(t, 0.44, 0.5) * (1 - seg(t, 0.52, 0.55));
  const vlX = seg(t, 0.76, 0.84);
  const derm = seg(t, 0.58, 0.62);
  const myo = seg(t, 0.66, 0.72);
  const [dm, vl] = somiteLips(CLOSE);
  const frontierMid = FRONTIER[Math.round(FRONTIER.length * 0.45)];
  const ribD = (pts: Pt[]) => smoothPath(pts, false, 0.3);
  return (
    <g>
      {drawing}
      {/* The three walls of the epithelial somite. */}
      {walls > 0.01 &&
        WALLS.map((w) => (
          <Part key={w.id} id={w.id} show={walls} groups={['somitak']}>
            <path d={wallArc(w.a0, w.a1)} fill="none" stroke="#1a0606" strokeWidth={17} strokeLinecap="round" opacity={0.6} />
            <path d={wallArc(w.a0, w.a1)} fill="none" stroke={w.color} strokeWidth={12} strokeLinecap="round" />
          </Part>
        ))}
      {dorsal > 0.01 && (
        <Part id="somitaren-atzeko-pareta" show={dorsal}>
          <path d={smoothPath([dm, a.dermatoma, vl], false, 0.4)} fill="none" stroke="#ffd1c2" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
        </Part>
      )}
      {/* The lip cells of the dorsal wall: muscle precursors (both lips), before they move. */}
      {lips > 0.01 && (
        <g>
          <Part id="muskulu-zelula-atze-erdialdekoak" show={lips} groups={['mioblastoak']}>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={f1(dm[0] + (i - 1) * 7)} cy={f1(dm[1] + (i % 2) * 6)} r={5} fill="#f2a33a" stroke="rgba(40,10,4,0.7)" strokeWidth={1} />
            ))}
          </Part>
          <Part id="aurre-alboko-muskulu-zelulak" show={lips} groups={['mioblastoak']}>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={f1(vl[0] + (i - 1) * 7)} cy={f1(vl[1] + (i % 2) * 6)} r={5} fill="#f2a33a" stroke="rgba(40,10,4,0.7)" strokeWidth={1} />
            ))}
          </Part>
        </g>
      )}
      <Frontier show={front} />
      {/* Some sclerotome cells go laterally, across the frontier, into the parietal layer. */}
      <Part id="esklerotoma" show={sclLat * (1 - rib * 0.7)}>
        <Crossers k={sclLat} color="#d27a52" n={9} seed={3} from={[SC[0] + RX * 0.2, SC[1] + RY * 1.1]} into={a['paretako-orria']} />
      </Part>
      {/* The rib: bone medially (sclerotome), cartilage in front (the cells that crossed). */}
      {rib > 0.01 && (
        <g opacity={rib}>
          <Part id="saihets-hezurra" groups={['saihetsak']}>
            <path d={ribD(BONE)} fill="none" stroke="#3a2a14" strokeWidth={15} strokeLinecap="round" />
            <path d={ribD(BONE)} fill="none" stroke={W.bone} strokeWidth={11} strokeLinecap="round" />
          </Part>
          <Part id="saihets-kartilagoa" groups={['saihetsak']}>
            <path d={ribD(CART)} fill="none" stroke="#2a2250" strokeWidth={15} strokeLinecap="round" />
            <path d={ribD(CART)} fill="none" stroke={W.cart} strokeWidth={11} strokeLinecap="round" />
          </Part>
        </g>
      )}
      <ThoraxInset show={vis(t, 0.24, 0.5)} ribs={seg(t, 0.37, 0.4)} />
      {/* Muscle precursors cross the frontier too (they will be the body-wall muscles). */}
      <Part id="aurre-alboko-muskulu-zelulak" show={Math.max(myoX, vlX)} groups={['mioblastoak']}>
        <Crossers k={Math.max(seg(t, 0.44, 0.5), vlX)} color="#f2a33a" n={7} seed={11} from={vl} into={a['paretako-orria']} />
      </Part>

      <Steps
        t={t}
        steps={[
          [0, 'Birpasoa: muskulu horiek guztiak somiten mesodermotik; hasieran somita guztiak berdinak'],
          [0.1, 'Somitaren paretak: atzekoa (dortsala), erdialdekoa (mediala) eta aurrekoa'],
          [0.2, 'Erdialdeko eta aurreko paretak → esklerotoma → erdikaldera: hodi neurala eta notokorda inguratu → ornoak'],
          [0.32, 'Esklerotoma zelula batzuk albora: muga gurutzatu → paretako orria → saihets kartilagoak'],
          [0.44, 'Zelula muskular aintzindari batzuek ere gurutzatzen dute muga'],
          [0.52, 'Atzeko paretaren erdia → dermatoma · ertzetako zelulak → zelula muskularren aintzindariak'],
          [0.64, 'Bi ertzetakoak bentralera → miotoma (dermatomaren azpian): bizkarra, eskapula ingurua, saihets artekoak'],
          [0.76, 'Aurre-alboko batzuk albora: muga gurutzatu → paretako orria → gorputz paretako eta gorputz-adarretako muskuluak'],
        ]}
      />
      <Note x={a.miotoma[0] + 60} y={a.miotoma[1] + 48} size={12} tone="accent" show={vis(t, 0.68, 0.76)}>
        bizkarra · eskapula ingurua · saihets artekoak
      </Note>

      <Label id="hodi-neurala" x={190} y={170} ax={a['hodi-neurala'][0]} ay={a['hodi-neurala'][1]} />
      <Label id="esklerotoma" x={190} y={270} ax={a.esklerotoma[0]} ay={a.esklerotoma[1]} show={seg(t, 0.22, 0.26)} />
      <Label id="notokorda" x={190} y={400} ax={a.notokorda[0]} ay={a.notokorda[1]} />
      <Label id="somitaren-erdialdeko-pareta" x={190} y={220} ax={wallMid(WALLS[1])[0] - 8} ay={wallMid(WALLS[1])[1]} show={walls} small />
      <Label id="somitaren-atzeko-pareta" x={500} y={34} align="middle" ax={wallMid(WALLS[0])[0]} ay={wallMid(WALLS[0])[1] - 8} show={Math.max(walls, dorsal)} />
      <Label id="somitaren-aurreko-pareta" x={810} y={250} ax={wallMid(WALLS[2])[0] + 8} ay={wallMid(WALLS[2])[1]} show={walls} small />
      <Label id="somitak" x={810} y={150} ax={a.somitak[0]} ay={a.somitak[1]} show={1 - seg(t, 0.52, 0.58)} />
      <Label id="dermatoma" x={810} y={150} ax={a.dermatoma[0]} ay={a.dermatoma[1]} show={derm} />
      <Label id="miotoma" x={810} y={200} ax={a.miotoma[0]} ay={a.miotoma[1]} show={myo} />
      <Label id="muskulu-zelula-atze-erdialdekoak" x={14} y={110} align="start" ax={dm[0] - 6} ay={dm[1] - 6} show={vis(t, 0.54, 0.76)} small />
      <Label id="somitaren-alboko-muga" x={810} y={286} ax={frontierMid[0]} ay={frontierMid[1]} show={front} small />
      <Label id="aurre-alboko-muskulu-zelulak" x={990} y={360} align="end" ax={vl[0] + 8} ay={vl[1] + 4} show={Math.max(myoX, vlX, vis(t, 0.54, 0.76))} small />
      <Label id="saihets-hezurra" x={190} y={446} ax={BONE[Math.round(BONE.length * 0.4)][0]} ay={BONE[Math.round(BONE.length * 0.4)][1]} show={rib} small />
      <Label id="paretako-orria" x={810} y={400} ax={a['paretako-orria'][0]} ay={a['paretako-orria'][1]} />
      <Label id="saihets-kartilagoa" x={810} y={446} ax={CART[Math.round(CART.length * 0.6)][0]} ay={CART[Math.round(CART.length * 0.6)][1]} show={rib} small />
      <Label id="ornoak" x={258} y={492} align="start" ax={138} ay={490} show={vis(t, 0.26, 0.5)} small />
      <Label id="esternoia" x={128} y={622} align="middle" ax={126} ay={584} show={vis(t, 0.37, 0.5)} small />
      <Label id="bitarteko-mesodermoa" x={810} y={560} ax={a['bitarteko-mesodermoa'][0]} ay={a['bitarteko-mesodermoa'][1]} small />
    </g>
  );
}
