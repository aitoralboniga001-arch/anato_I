'use client';

import { C, Label, Note, Part, clamp, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { E6, somiteClose, somiteLips } from '@/components/scenes/week4-meso/Stage3Somite';
import { SOMITE, catmull, off, placer, skinIn, trunkGeom, type Place } from '@/components/scenes/week4-meso/trunk';
import { Steps, W, f1, vis } from './common';

/**
 * Topic 9 retells the somite on topic 4's own close-up (week4-meso/Stage3Somite, Langman fig. 6-12):
 * the same section, cells and colours, so the student recognises the picture from topic 4 and only
 * the new layer is added on top — the two lips named as muscle precursors, the green lateral somitic
 * frontier, the somite walls, the domains. The topic-4 drawing runs on its own clock; `retell` maps
 * topic-9 stage time onto it.
 */

/** Same placement as topic 4's close-up (somiteClose default). */
export const CLOSE: Place = { k: 3.4, ox: 270, oy: 40 };
const M = placer(CLOSE);
const G = trunkGeom(E6);

/** Topic-4 time for a topic-9 time, piecewise linear through `keys` ([t9, t4] pairs). */
export function retell(t: number, keys: [number, number][]) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, x] = keys[i];
    const [b, y] = keys[i + 1];
    if (t <= b) return lerp(x, y, clamp((t - a) / (b - a)));
  }
  return keys[keys.length - 1][1];
}

/** Lateral somitic frontier (model space): from under the ectoderm beside the somite down to where the parietal layer starts. */
const FRONTIER_X = SOMITE.cx + SOMITE.rx + 6;
export const FRONTIER: Pt[] = catmull([[FRONTIER_X, skinIn(FRONTIER_X) + 1], [(FRONTIER_X + G.Pa[0]) / 2 + 1, (skinIn(FRONTIER_X) + G.Pa[1]) / 2], [G.Pa[0], G.Pa[1] + 2]], 8).map((p) => M(p));
const frontierMid = FRONTIER[Math.round(FRONTIER.length * 0.45)];

/** The green frontier line (somitaren alboko muga). */
export function Frontier({ show }: { show: number }) {
  if (show <= 0.01) return null;
  const d = smoothPath(FRONTIER, false, 0.4);
  return (
    <Part id="somitaren-alboko-muga" show={show}>
      <path d={d} fill="none" stroke="#06210f" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      <path d={d} fill="none" stroke={W.frontier} strokeWidth={4} strokeLinecap="round" />
    </Part>
  );
}

/** The two lips of the dorsal plate, glowing as muscle precursors (the drawing under them is topic 4's). */
function Lips({ show }: { show: number }) {
  if (show <= 0.01) return null;
  const [dm, vl] = somiteLips(CLOSE);
  const glow = (p: Pt) => (
    <g>
      <ellipse cx={f1(p[0])} cy={f1(p[1])} rx={30} ry={22} fill="url(#w9-lipglow)" />
      <ellipse cx={f1(p[0])} cy={f1(p[1])} rx={17} ry={12} fill="none" stroke="#ffd08a" strokeWidth={1.6} opacity={0.75} />
    </g>
  );
  const groups = ['mioblastoak', 'somitaren-atzeko-pareta', 'mesodermo-paraxiala'];
  return (
    <g>
      <defs>
        <radialGradient id="w9-lipglow">
          <stop offset="0" stopColor="#ffc46b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Part id="muskulu-zelula-atze-erdialdekoak" show={show} groups={groups}>
        {glow(dm)}
      </Part>
      <Part id="aurre-alboko-muskulu-zelulak" show={show} groups={groups}>
        {glow(vl)}
      </Part>
    </g>
  );
}

/** Somitomere inset: loose paraxial mesenchyme where myoblasts appear directly (no walls). */
function SomitomereInset({ show, myo }: { show: number; myo: number }) {
  if (show <= 0.01) return null;
  const x0 = 22;
  const y0 = 470;
  const w = 206;
  const h = 128;
  const cells = Array.from({ length: 26 }, (_, i) => ({ x: x0 + 16 + rand(i * 3.7) * (w - 32), y: y0 + 30 + rand(i * 5.3 + 1) * (h - 44), a: rand(i * 2.9) * 180, m: i % 3 === 0 }));
  return (
    <g opacity={show}>
      <rect x={x0} y={y0} width={w} height={h} rx={12} fill="#1d0f16" stroke="rgba(255,220,200,0.35)" strokeWidth={1.2} />
      <Note x={x0 + w / 2} y={y0 + 15} size={11.5} tone="dim">
        Somitomeroa (buruan): paretarik ez
      </Note>
      <Part id="somitomeroak" groups={['mesodermo-paraxiala']}>
        {cells.map((c, i) =>
          c.m ? null : (
            <g key={i} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(c.a)})`}>
              <path d="M-7,-2L7,2M-1.5,6L1.5,-6" stroke={C.mesoParaxial} strokeWidth={1.4} strokeLinecap="round" />
              <ellipse rx={4} ry={3.2} fill={C.mesoParaxial} stroke="rgba(60,10,14,0.6)" strokeWidth={0.6} />
              <circle r={1.6} fill="rgba(70,4,14,0.8)" />
            </g>
          ),
        )}
      </Part>
      <Part id="mioblastoak" show={myo} groups={['mesodermo-paraxiala']}>
        {cells.map((c, i) =>
          c.m ? (
            <g key={i} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(c.a * 0.3 - 20)})`}>
              <ellipse rx={9} ry={3.6} fill="#f2a33a" stroke="#7a3b06" strokeWidth={0.7} />
              <ellipse rx={3.2} ry={1.8} fill="#7a3b06" />
            </g>
          ) : null,
        )}
      </Part>
    </g>
  );
}

/** 9:ildaskatuak `miotoma` — topic 4's somite close-up, with the muscle layer named. */
export function MyotomeSection({ t }: SceneProps) {
  // Topic-4 clock: epithelial somite → sclerotome + plate (0.45–0.55) → dermatome, lips, myotome (0.57–0.64) → lip cells into the body wall (0.665–0.75).
  const t4 = retell(t, [[0.45, 0.06], [0.55, 0.5], [0.57, 0.52], [0.64, 0.8], [0.665, 0.8], [0.75, 0.87]]);
  const { drawing, anchors: a } = somiteClose(t4);
  const lips = seg(t, 0.56, 0.6);
  const frontier = seg(t, 0.63, 0.67);
  const sclero = seg(t, 0.46, 0.5);
  const derm = seg(t, 0.57, 0.6);
  const myo = seg(t, 0.6, 0.64);
  const plate = seg(t, 0.5, 0.53) * (1 - derm);
  const [dm, vl] = somiteLips(CLOSE);
  const L = (id: string, x: number, y: number, show = 1, small = false, at?: Pt, align?: 'start' | 'middle' | 'end') => (
    <Label key={`${id}${x}${y}`} id={id} x={x} y={y} ax={(at ?? a[id])[0]} ay={(at ?? a[id])[1]} show={show} small={small} align={align} />
  );
  // Before the dermatome forms, the dorsal plate is the somite's dorsal wall: it carries the wall's name.
  const plateP: Pt = a.dermatoma;
  return (
    <g>
      <defs>
        <radialGradient id="w9-sclglow">
          <stop offset="0" stopColor="#ffb08a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffb08a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {drawing}
      {plate > 0.01 && (
        <Part id="somitaren-atzeko-pareta" show={plate} groups={['mesodermo-paraxiala']}>
          <path d={smoothPath([dm, plateP, vl], false, 0.4)} fill="none" stroke="#ffe1d2" strokeWidth={13} strokeLinecap="round" opacity={0.3} />
        </Part>
      )}
      {/* The sclerotome: the loose cells round the neural tube and notochord, glowing while they are named. */}
      {sclero > 0.01 && (
        <Part id="esklerotoma" show={sclero} groups={['mesodermo-paraxiala']}>
          <ellipse cx={f1(a.esklerotoma[0])} cy={f1(a.esklerotoma[1])} rx={46} ry={40} fill="url(#w9-sclglow)" />
        </Part>
      )}
      <Lips show={lips} />
      <Frontier show={frontier} />
      <SomitomereInset show={vis(t, 0.45, 0.56)} myo={seg(t, 0.47, 0.51)} />
      <Steps
        t={t}
        steps={[
          [0.45, 'Buruan: somitomeroen mesodermotik zuzenean mioblastoak · somitan: aurreko eta erdialdeko paretak → esklerotoma'],
          [0.56, 'Somitetan: atzeko paretaren bi ertzetako zelulak → mioblastoak → miotoma (dermatomaren azpian)'],
          [0.66, 'Aurre-alboko zelula batzuek muga gurutzatu → alboko mesodermoaren paretako orria'],
        ]}
      />

      {L('hodi-neurala', 190, 170)}
      {L('esklerotoma', 190, 270, sclero)}
      {L('notokorda', 190, 400)}
      {L('aorta-dortsalak', 190, 446, 1, true)}
      {L('muskulu-zelula-atze-erdialdekoak', 330, 34, lips, false, [dm[0] - 6, dm[1] - 6], 'middle')}
      {L('aurre-alboko-muskulu-zelulak', 990, 286, lips, false, [vl[0] + 8, vl[1] + 4], 'end')}
      {L('azaleko-ektodermoa', 810, 96, 1, true, a.ektodermoa)}
      {L('somitak', 810, 150, 1 - seg(t, 0.5, 0.53))}
      {L('somitaren-atzeko-pareta', 810, 150, plate, false, plateP)}
      {L('dermatoma', 810, 150, derm)}
      {L('miotoma', 810, 200, myo)}
      {L('somitaren-alboko-muga', 810, 250, frontier, false, frontierMid)}
      {L('paretako-orria', 810, 370, frontier, false, [a['paretako-orria'][0] + 32, a['paretako-orria'][1] + 51])}
      {L('bitarteko-mesodermoa', 810, 560, 1, true)}
      <Label id="mioblastoak" x={125} y={584} align="middle" show={vis(t, 0.45, 0.56) * seg(t, 0.47, 0.51)} small />
    </g>
  );
}
