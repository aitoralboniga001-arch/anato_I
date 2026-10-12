'use client';

import { Label, Note, Part, clamp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { E6, somiteClose, somiteLips } from '@/components/scenes/week4-meso/Stage3Somite';
import { NOTO, SOMITE, TUBE, band, placer, skinIn, trunkGeom } from '@/components/scenes/week4-meso/trunk';
import { HUE, Steps, f1, vis } from './common';
import { CLOSE, FRONTIER, Frontier, retell } from './Somite';

/**
 * 9:domeinuak — 2.2.1, domain classification. Same close-up as topic 4 and the two stages before (the student
 * already knows every cell in it): the green frontier splits the mesoderm into two coloured domains, primaxial
 * (blue, beside the neural tube: the somites) and abaxial (amber, the parietal layer and the somite cells that
 * reached it). Then the notes' table, built row by row, every muscle in its domain colour.
 */

const M = placer(CLOSE);
const G = trunkGeom(E6);
const MID = CLOSE.ox;
const mirror = (p: Pt): Pt => [2 * MID - p[0], p[1]];
const poly = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) => {
  const c = M([cx, cy]);
  const a = rx * CLOSE.k;
  const b = ry * CLOSE.k;
  return `M${f1(c[0] - a)},${f1(c[1])}a${f1(a)},${f1(b)} 0 1,0 ${f1(2 * a)},0a${f1(a)},${f1(b)} 0 1,0 ${f1(-2 * a)},0Z`;
};

/** Primaxial domain (screen): under the dorsal skin from the midline to the frontier, down the frontier, and the
 * mesoderm beside the neural tube down to the notochord level; both sides, the neural tube and notochord left out. */
const Y_CUT = NOTO.cy + 4;
const PRIM_R: Pt[] = (() => {
  const top: Pt[] = [];
  const x1 = FRONTIER_TOP_X();
  for (let x = 0; x <= x1; x += 3) top.push(M([x, skinIn(x)]));
  // From the foot of the frontier, medially past the intermediate mesoderm (which is not primaxial) to the notochord level.
  return [...top, ...FRONTIER, M([62, Y_CUT]), M([0, Y_CUT])];
})();
function FRONTIER_TOP_X() {
  return (FRONTIER[0][0] - CLOSE.ox) / CLOSE.k;
}
const PRIM_D = `${poly(PRIM_R)}${poly(PRIM_R.map(mirror).reverse())}${ell(TUBE.cx, TUBE.cy, TUBE.rx + 2, TUBE.ry + 2)}${ell(NOTO.cx, NOTO.cy, NOTO.r + 2, NOTO.r + 2)}`;

/** Abaxial domain (screen): the parietal layer from where the frontier meets it, down the body wall. */
const PAR = band(G.S, G.iA, G.iTip, (s) => s.a, (s) => s.a + s.b, 80);
const ABAX_D = poly([...PAR.outer, ...PAR.inner.slice().reverse()].map((p) => M(p)));
const abaxAt = (k: number): Pt => {
  const i = Math.round(k * (PAR.outer.length - 1));
  return M([(PAR.outer[i][0] + PAR.inner[i][0]) / 2, (PAR.outer[i][1] + PAR.inner[i][1]) / 2]);
};

/** Somite cells sitting in the parietal layer (those that crossed the frontier). */
function Arrived({ show }: { show: number }) {
  if (show <= 0.01) return null;
  return (
    <g opacity={show}>
      {Array.from({ length: 9 }, (_, i) => {
        const p = abaxAt(0.04 + i * 0.05 + rand(i * 3.1) * 0.03);
        return <circle key={i} cx={f1(p[0] + (rand(i * 7.3) - 0.5) * 8)} cy={f1(p[1] + (rand(i * 5.7) - 0.5) * 8)} r={5} fill="#f2a33a" stroke="#fff3e0" strokeWidth={1.3} />;
      })}
    </g>
  );
}

export function DomainSection({ t }: SceneProps) {
  // Topic-4 clock: the lip cells leaving into the body wall (0.8 → 0.87), then held.
  const t4 = retell(t, [[0, 0.8], [0.08, 0.87]]);
  const { drawing, anchors: a } = somiteClose(t4);
  const [dm, vl] = somiteLips(CLOSE);
  const front = seg(t, 0.1, 0.14);
  const prim = seg(t, 0.2, 0.25);
  const abax = seg(t, 0.32, 0.37);
  const back = seg(t, 0.44, 0.455);
  const recall = vis(t, 0.95, 2);
  const both = vis(t, 0.44, 2);
  const glow = (k: number) => 0.16 + 0.12 * k;
  const primLabel: Pt = M([SOMITE.cx - 10, SOMITE.cy + SOMITE.ry + 22]);
  const frontierMid = FRONTIER[Math.round(FRONTIER.length * 0.45)];
  return (
    <g>
      {drawing}
      {prim > 0.01 && (
        <Part id="domeinu-primaxiala" show={prim}>
          <path d={PRIM_D} fillRule="evenodd" fill={HUE.primaxial} fillOpacity={glow(prim)} stroke={HUE.primaxial} strokeWidth={2.5} strokeOpacity={0.85} strokeLinejoin="round" />
        </Part>
      )}
      {abax > 0.01 && (
        <Part id="domeinu-abaxiala" show={abax}>
          <path d={ABAX_D} fill={HUE.abaxial} fillOpacity={glow(abax) + 0.1} stroke={HUE.abaxial} strokeWidth={2.5} strokeOpacity={0.9} strokeLinejoin="round" />
        </Part>
      )}
      <Part id="aurre-alboko-muskulu-zelulak" show={vis(t, 0, 2)} groups={['mioblastoak']}>
        <Arrived show={clamp(seg(t, 0.02, 0.09))} />
      </Part>
      <Frontier show={front} />
      {/* The somite's own outline (dermatome + myotome lie inside the primaxial domain). */}
      <Part id="somitak" show={vis(t, 0.2, 0.44)}>
        <path d={smoothPath([dm, a.dermatoma, vl], false, 0.4)} fill="none" stroke="#fff3e0" strokeWidth={14} strokeLinecap="round" opacity={0.3} />
      </Part>
      {/* The myotome is primaxial: it becomes the deep (erector) back muscles. */}
      {back > 0.01 && (
        <Part id="bizkarreko-muskulu-sakonak" show={back}>
          <ellipse cx={f1(a.miotoma[0])} cy={f1(a.miotoma[1])} rx={46} ry={20} fill="none" stroke={HUE.primaxial} strokeWidth={3} opacity={0.9} transform={`rotate(-18 ${f1(a.miotoma[0])} ${f1(a.miotoma[1])})`} />
        </Part>
      )}
      <Note x={500} y={26} size={13} tone="accent" show={front * (1 - both)}>
        Muga berdeak mesodermoa bi domeinutan banatzen du
      </Note>
      <Note x={500} y={26} size={13} tone="accent" show={both * (1 - recall)}>
        Bi domeinuetatik muskulu ildaskatu desberdinak, eskualde bakoitzean
      </Note>

      <Steps
        t={t}
        steps={[
          [0, 'Somita-zelula batzuk (muskulu zelulak eta esklerotoma zelula batzuk) paretako orrira migratzen dute'],
          [0.1, 'Somitaren alboko muga (marra berdea): mesodermoa 2 domeinutan'],
          [0.2, 'Domeinu primaxiala: hodi neuralaren aldamenean, «erdialdean»; bertan somitak → bizkarreko muskuluak'],
          [0.32, 'Domeinu abaxiala: paretako orriko zelulak + bertara iritsitako somita-zelulak'],
          [0.44, 'Bizkarraren sakoneko muskulu zutitzaileak: primaxialak (miotomatik) · beste eskualdeetan, batzuk primaxialak eta beste batzuk abaxialak'],
          [0.95, 'GOGORATU: paretako orrira migratzen duten alboko ertzeko zelulak → gorputz paretako eta gorputz-adarretako muskulu gehienak'],
        ]}
      />

      <Label id="hodi-neurala" x={190} y={170} ax={a['hodi-neurala'][0]} ay={a['hodi-neurala'][1]} />
      <Label id="domeinu-primaxiala" x={190} y={270} ax={primLabel[0]} ay={primLabel[1]} show={prim} />
      <Label id="notokorda" x={190} y={400} ax={a.notokorda[0]} ay={a.notokorda[1]} small />
      <Label id="somitak" x={810} y={150} ax={a.dermatoma[0] + 10} ay={a.dermatoma[1] - 8} show={vis(t, 0.2, 0.44)} />
      <Label id="miotoma" x={810} y={200} ax={a.miotoma[0] + 20} ay={a.miotoma[1]} />
      <Label id="bizkarreko-muskulu-sakonak" x={990} y={240} align="end" ax={a.miotoma[0] + 44} ay={a.miotoma[1] - 10} show={back} text="→ bizkarreko muskulu sakonak" />
      <Label id="somitaren-alboko-muga" x={810} y={280} ax={frontierMid[0]} ay={frontierMid[1]} show={front} />
      <Label id="aurre-alboko-muskulu-zelulak" x={990} y={354} align="end" ax={vl[0] + 8} ay={vl[1] + 4} small />
      <Label id="paretako-orria" x={810} y={400} ax={a['paretako-orria'][0]} ay={a['paretako-orria'][1]} />
      <Label id="domeinu-abaxiala" x={810} y={450} ax={abaxAt(0.3)[0]} ay={abaxAt(0.3)[1]} show={abax} />
      <Label id="bitarteko-mesodermoa" x={810} y={560} ax={a['bitarteko-mesodermoa'][0]} ay={a['bitarteko-mesodermoa'][1]} small />
    </g>
  );
}

/* ---------------- The notes' table, by region and domain ---------------- */

type Item = { id?: string; text: string; sub?: boolean };
interface Row {
  region: string;
  at: number;
  prim: Item[];
  abax: Item[];
}
const ROWS: Row[] = [
  {
    region: 'Lepoko eskualdea',
    at: 0.5,
    prim: [{ id: 'muskulu-eskalenoak', text: 'Eskalenoak' }, { id: 'muskulu-genihioideoak', text: 'Genihioideoak' }, { id: 'muskulu-prebertebralak', text: 'Ornoaurrekoak' }],
    abax: [{ id: 'hioide-azpiko-muskuluak', text: 'Hioide azpiko muskuluak' }],
  },
  {
    region: 'Torako-abdominala',
    at: 0.6,
    prim: [{ id: 'saihets-arteko-muskuluak', text: 'Saihets artekoak (interkostalak)' }],
    abax: [
      { id: 'muskulu-pektoralak', text: 'Pektoralak (nagusia eta txikia)' },
      { id: 'bularrezur-giharra', text: 'Bularrezur giharra' },
      { id: 'abdomeneko-muskuluak', text: 'Abdomeneko muskulu ildaskatu guztiak:' },
      { id: 'abdomen-kanpoko-laprana', text: 'kanpoko laprana', sub: true },
      { id: 'abdomen-barruko-laprana', text: 'barruko laprana', sub: true },
      { id: 'abdomen-zeharkakoa', text: 'zeharkakoa', sub: true },
      { id: 'azpil-diafragma', text: 'Azpi diafragmaren giharrak (pelbisekoak)' },
    ],
  },
  {
    region: 'Goiko gorputz-adarrak',
    at: 0.7,
    prim: [
      { text: 'Hurbilekoak:' },
      { id: 'erronboideak', text: 'Erronboideak (nagusia, txikia)' },
      { id: 'eskapularen-jasotzailea', text: 'Eskapularen muskulu jasotzailea' },
      { id: 'bizkarreko-zabala', text: 'Bizkarraldeko muskulu zabala' },
      { text: '*Migratuak: bizkarrean, autoktonoen azalaldean' },
    ],
    abax: [{ id: 'urrutiko-muskuluak', text: 'Urrutiko muskuluak' }],
  },
  {
    region: 'Beheko gorputz-adarrak',
    at: 0.8,
    prim: [{ text: 'Ez dago hain argi' }],
    abax: [{ id: 'beheko-adarreko-muskuluak', text: 'Muskulu guztiak' }],
  },
  {
    region: 'Bizkarraren sakontasunean',
    at: 0.88,
    prim: [{ id: 'bizkarreko-muskulu-sakonak', text: 'Zutitzailea · bizkarreko muskulu autoktonoak' }, { text: '(hedatzailea: 3 muskulu; goitik behera, atzean)' }],
    abax: [{ text: '—' }],
  },
];
const X0 = 24;
const COLS = [170, 330, 400];
const XS = [X0, X0 + COLS[0] + 4, X0 + COLS[0] + COLS[1] + 8];
const LINE = 25;
const HEAD_Y = 74;
const HEAD_H = 40;

/** Lines a cell needs (the three abdominal ones share a line). */
const linesOf = (items: Item[]) => items.filter((it, i) => !(it.sub && items[i - 1]?.sub)).length;

/** Where each item of a cell sits: its line, and (for sub items sharing a line) its offset along it. */
function layout(items: Item[]) {
  const out: { line: number; subX: number }[] = [];
  let line = 0;
  let subX = 0;
  items.forEach((it, i) => {
    // A sub item right after another sub item stays on the same line.
    if (!(it.sub && items[i - 1]?.sub)) {
      if (i > 0) line++;
      subX = 0;
    }
    out.push({ line, subX });
    if (it.sub) subX += it.text.length * 7.6 + 34;
  });
  return out;
}

function Cell({ items, x, y, color, show }: { items: Item[]; x: number; y: number; color: string; show: number }) {
  const pos = layout(items);
  return (
    <g>
      {items.map((it, i) => {
        const yy = y + 18 + pos[i].line * LINE;
        const xx = x + 16 + (it.sub ? 12 + pos[i].subX : 0);
        const k = clamp(show * 1.6 - i * 0.12);
        if (!it.id)
          return (
            <Note key={i} x={x + 16} y={yy} align="start" size={12} tone="dim" show={k}>
              {it.text}
            </Note>
          );
        return (
          <g key={i}>
            <Part id={it.id} show={k}>
              <circle cx={f1(xx)} cy={f1(yy)} r={5} fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
            </Part>
            <Label id={it.id} x={xx + 10} y={yy} align="start" text={it.text} show={k} small />
          </g>
        );
      })}
    </g>
  );
}

export function DomainTable({ t }: SceneProps) {
  const rowY = ROWS.reduce<number[]>((acc, r) => [...acc, acc[acc.length - 1] + 12 + Math.max(linesOf(r.prim), linesOf(r.abax)) * LINE + 5], [HEAD_Y + HEAD_H + 6]);
  const head = seg(t, 0.44, 0.48);
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#120a10" />
      <Note x={470} y={34} size={14} tone="warn" show={head}>
        * Muskuluen izenak ez dira ikasi behar! Ikasi araua: zein domeinutatik.
      </Note>
      <g opacity={head}>
        <rect x={XS[0]} y={HEAD_Y} width={COLS[0]} height={HEAD_H} rx={8} fill="#2b2333" />
        <Note x={XS[0] + COLS[0] / 2} y={HEAD_Y + HEAD_H / 2} size={12.5} tone="dim">
          Eskualdea
        </Note>
      </g>
      <Part id="domeinu-primaxiala" show={head}>
        <rect x={XS[1]} y={HEAD_Y} width={COLS[1]} height={HEAD_H} rx={8} fill={HUE.primaxial} fillOpacity={0.5} stroke={HUE.primaxial} />
      </Part>
      <Label id="domeinu-primaxiala" x={XS[1] + COLS[1] / 2} y={HEAD_Y + HEAD_H / 2} align="middle" text="Domeinu primaxiala (miotometatik)" show={head} />
      <Part id="domeinu-abaxiala" show={head}>
        <rect x={XS[2]} y={HEAD_Y} width={COLS[2]} height={HEAD_H} rx={8} fill={HUE.abaxial} fillOpacity={0.5} stroke={HUE.abaxial} />
      </Part>
      <Label id="domeinu-abaxiala" x={XS[2] + COLS[2] / 2} y={HEAD_Y + HEAD_H / 2} align="middle" text="Domeinu abaxiala" show={head} />
      {ROWS.map((r, j) => {
        const n = Math.max(linesOf(r.prim), linesOf(r.abax));
        const h = 12 + n * LINE;
        const ry = rowY[j];
        const show = seg(t, r.at, r.at + 0.05);
        if (show <= 0.01) return null;
        return (
          <g key={j}>
            <g opacity={show}>
              <rect x={XS[0]} y={ry} width={COLS[0]} height={h} rx={7} fill="#2b2333" fillOpacity={0.7} />
              <rect x={XS[1]} y={ry} width={COLS[1]} height={h} rx={7} fill={HUE.primaxial} fillOpacity={0.12} stroke={HUE.primaxial} strokeOpacity={0.45} />
              <rect x={XS[2]} y={ry} width={COLS[2]} height={h} rx={7} fill={HUE.abaxial} fillOpacity={0.12} stroke={HUE.abaxial} strokeOpacity={0.45} />
            </g>
            <Note x={XS[0] + 10} y={ry + 18} align="start" size={12} tone="accent" show={show}>
              {r.region}
            </Note>
            <Cell items={r.prim} x={XS[1]} y={ry} color={HUE.primaxial} show={show} />
            <Cell items={r.abax} x={XS[2]} y={ry} color={HUE.abaxial} show={show} />
          </g>
        );
      })}
    </g>
  );
}
