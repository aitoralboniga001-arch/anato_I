'use client';

import { Arrow, C, FollowRing, Journey, Label, Mark, Note, Part, lerp, mix, rand, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { cleavageFrame } from '@/components/shell/intro/cleavage';
import { CellRing, Epithelium, Gland, SpiralArtery, Vessel, W2Defs, epiBoundary, glandPath, spiralPath } from '../week2/materials';
import { Hud, vis } from './common';
import { Conceptus, ConceptusDefs } from './conceptus';

/**
 * 4.5 Blastozistoaren habiratze-prozesua (6. eguna). First the whole uterine wall — endometrium
 * (secretory: corkscrew glands, spiral arteries; inner), myometrium (muscular, middle) and perimetrium
 * (outer) — then the camera closes in on the endometrial surface: the blastocyst approaches and turns so
 * its embryonic pole leads, touches the epithelium with it (apposition, it flattens a little), and the
 * trophoblast cells next to the embryoblast proliferate and wedge between the epithelial cells into the
 * stroma (Langman fig. 3-10 C). Same histology language as week 2, which continues on day 8.
 *
 * Windows (beats at .00 / .20 / .45 / .66 / .84 → done frames .165 / .415 / .625 / .805 / 1):
 *   .00–.20 overview of the wall · .20–.38 camera closes in · .24–.44 the blastocyst turns, pole first
 *   .44–.55 it reaches the surface · .55–.63 adhesion (flattens against the epithelium)
 *   .66–.74 camera pushes in to the contact · .67–.80 polar trophoblast proliferates and invades
 */

const SURF = 500; // endometrial surface (local); uterine lumen below
const MYO_TOP = -112;
const MYO_BOTTOM = 196;
const BASAL = 236; // basal / functional layer boundary of the endometrium
const SB = 0.62; // blastocyst scale (local)
const RB = 138 * SB;
const ROT = 43; // embryonic pole up, towards the endometrium

/** Secretory glands: mouths on the surface (clear of the implantation site at x≈500). */
const GLANDS = [-330, -120, 90, 340, 615, 830, 1040, 1250].map((x, i) => glandPath([x, SURF - 18], 224 + ((i * 37) % 40), i + 1));
/** Spiral arteries: straight radial arteries through the myometrium, coiling in the functional layer. */
const ARTERIES = [-230, -10, 250, 515, 735, 950, 1150].map((x, i) => ({
  radial: spiralPath([x - 4, 50], [x, BASAL - 20], 1.2, 1.4, i),
  spiral: spiralPath([x, BASAL - 20], [x + 8 + (i % 2) * 6, 404 + ((i * 23) % 30)], 6.5, 6.5, i * 1.3),
}));
/**
 * One subepithelial capillary placed where both close-ups keep it in view, left of the implantation
 * site and clear of the glands: the anchor of the maternal vessels' name (short leader, crossing nothing).
 */
const CAP_A: [number, number, number, number] = [452, 434, 7, 20];
/** Subepithelial capillaries (cross-sections). */
const CAPS: [number, number, number, number][] = Array.from({ length: 26 }, (_, i) => {
  const x = -380 + i * 70 + rand(i * 5.1) * 36;
  const y = 296 + rand(i * 2.3 + 1) * 170;
  return [x, y, 5 + rand(i * 7.7) * 3.5, rand(i * 3.3) * 180] as [number, number, number, number];
}).filter(([x, y]) => !(Math.abs(x - 500) < 70 && y > 420) && Math.hypot(x - CAP_A[0], y - CAP_A[1]) > 34);
/** Arcuate vessels in the vascular (middle) layer of the myometrium. */
const ARCUATE: Pt[] = [-260, 0, 250, 520, 770, 1020, 1280].map((x, i) => [x + 10, 40 + (i % 2) * 18]);
/** Smooth-muscle fascicles cut across in the myometrium. */
const FASCICLES = Array.from({ length: 34 }, (_, i) => {
  const row = i % 2;
  return { x: -390 + Math.floor(i / 2) * 106 + row * 53 + rand(i) * 18, y: (row ? 112 : -40) + rand(i * 1.9) * 26, rx: 34 + rand(i * 4.1) * 10, ry: 16 + rand(i * 2.7) * 6 };
});

/** Surface epithelium: x0, x1, cell width; columnar cells (taller than wide), as in Langman fig. 3-10 C. */
const EPI = [-400, 1400, 16] as const;
const EPI_TH = 22;
/**
 * Wedges of invading trophoblast (day 6): offset from the pole, extra length, sway. Each pushes up
 * between two epithelial cells and its tip only just passes the epithelium's base (Langman fig. 3-10 C):
 * the deep invasion of the stroma is the syncytiotrophoblast of week 2, not this.
 */
const TONGUES: [number, number, number][] = [
  [-27, 18, -1],
  [1, 25, 1],
  [28, 16, 1],
];
const TONGUE_W = 7;

function tonguePath(x: number, base: number, len: number, w: number, sway: number) {
  const n = 9;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const cx = x + sway * Math.sin(s * Math.PI * 1.2) * 4;
    const y = base - s * len;
    const hw = w * (1 - 0.45 * s);
    L.push([cx - hw, y]);
    R.push([cx + hw, y]);
  }
  const tip: Pt = [x + sway * Math.sin(Math.PI * 1.2) * 4, base - len - w * 0.55];
  return smoothPath([...L, tip, ...R.reverse()], true, 0.4);
}

export function Implantation({ t }: SceneProps) {
  // Camera: overview → endometrial surface → the contact itself.
  const e = seg(t, 0.2, 0.38);
  const e2 = seg(t, 0.66, 0.74);
  const zs = lerp(lerp(0.62, 1.75, e), 2.35, e2);
  const z = zoom(lerp(500, 506, e2), lerp(lerp(300, 540, e), 510, e2), zs, 500, lerp(lerp(320, 300, e), 318, e2));
  const u = 1 / zs;

  // Blastocyst: approaches, turns its embryonic pole to the wall, touches, flattens, sinks in slightly.
  const approach = seg(t, 0, 0.55);
  const touchY = SURF + RB + 2;
  const cy = lerp(SURF + RB + 170, touchY, approach);
  const cx = lerp(560, 500, seg(t, 0, 0.5));
  const rot = lerp(ROT + 118, ROT, seg(t, 0.24, 0.44));
  const flat = seg(t, 0.55, 0.63);
  const top = cy - RB;
  const f = cleavageFrame(7, 0, 5);
  f.zonaO = 0;
  const squash = `translate(${cx} ${top}) scale(${1 + 0.05 * flat} ${1 - 0.07 * flat}) translate(${-cx} ${-top})`;

  // Invasion: the polar trophoblast thickens, then its cells push between the epithelial cells.
  const prolif = seg(t, 0.64, 0.72);
  const inv = seg(t, 0.68, 0.8);
  const invader = mix(C.trophoblast, C.syncytio, 0.72);
  // Each tongue goes up where two epithelial cells part (a cell boundary next to its place on the pole).
  const tx = TONGUES.map(([dx]) => epiBoundary(cx + dx, EPI[0], EPI[1], EPI[2]));
  const gaps: [number, number][] = TONGUES.map((_, i) => [tx[i], 9 * seg(inv, i * 0.12, 0.35 + i * 0.12)]);

  const P = (x: number, y: number) => z.at(x, y);
  const pole = P(cx, top + 6);
  const abpole = P(cx, cy + RB - 8);
  const emb = P(cx - 10, top + 40);
  const cav = P(cx + 22, cy + 30 - 40 * e2);
  const tro = P(cx + RB * 0.74, cy + RB * 0.6);
  const epi = P(612, SURF - 8);
  const str = P(440, 400);
  // Name points close to the surface, so they stay in the picture once the camera has closed in.
  const nearY = (pts: Pt[], y: number) => pts.reduce((b, p) => (Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b));
  const gl = nearY(GLANDS[4], SURF - 80);
  const gland = P(gl[0], gl[1]);
  const artery = P(CAP_A[0] - CAP_A[2] * 0.6, CAP_A[1]);
  const layer = (y: number): Pt => P(1000, y);
  const over = vis(t, 0, 0.26);
  const close = seg(t, 0.35, 0.4);
  const tipY = SURF - EPI_TH - 16 * inv;
  const site = P(tx[1], lerp(SURF - 8, tipY + 18, inv));

  // The approach as a route: where the blastocyst has come from, newest stretch bright.
  const route: Pt[] = [];
  for (let k = 0; k <= 24; k++) {
    const tt = lerp(0.2, Math.min(t, 0.55), k / 24);
    if (t < 0.21) break;
    const a = seg(tt, 0, 0.55);
    route.push(P(lerp(560, 500, seg(tt, 0, 0.5)), lerp(SURF + RB + 170, touchY, a)));
  }
  const routeShow = seg(t, 0.22, 0.26) * (1 - seg(t, 0.6, 0.66));

  return (
    <g>
      <ConceptusDefs id="w1i" />
      <W2Defs />
      <g mask="url(#m-slab)">
        <g transform={z.transform}>
          {/* Uterine cavity (lumen) */}
          <Part id="umetoki-barrunbea" quiet>
            <rect x={-400} y={SURF} width={1800} height={700} fill="#1a1426" />
            <rect x={-400} y={SURF} width={1800} height={160} fill="url(#g-shade)" opacity={0.35} />
          </Part>

          {/* Endometrium: the whole layer in the overview; once close, its stroma. */}
          <Part id={close > 0.5 ? 'endometrio-estroma' : 'endometrioa'} quiet={close > 0.5}>
            <rect x={-400} y={MYO_BOTTOM} width={1800} height={SURF - MYO_BOTTOM} fill="url(#w2-p-stroma)" />
            <rect x={-400} y={MYO_BOTTOM} width={1800} height={SURF - MYO_BOTTOM} fill="url(#w2-p-stroma2)" />
          </Part>
          {/* Basal layer of the endometrium (the layer as a whole stays named in the close-up). */}
          <Part id="endometrioa" quiet>
            <g pointerEvents="none">
              <rect x={-400} y={MYO_BOTTOM} width={1800} height={BASAL - MYO_BOTTOM} fill="#9e3a58" opacity={0.2} />
              <path d={`M-400,${BASAL} ${Array.from({ length: 37 }, (_, i) => `L${-400 + i * 50},${BASAL + 4 * Math.sin(i * 1.7)}`).join(' ')}`} fill="none" stroke="#b9607a" strokeWidth={1} opacity={0.4} />
            </g>
          </Part>
          <Part id="amaren-odol-hodiak">
            {[CAP_A, ...CAPS].map(([x, y, r, a], i) => (
              <Vessel key={i} x={x} y={y} rx={r} ry={r * 0.62} rot={a} />
            ))}
            {ARTERIES.map((a, i) => (
              <g key={`a${i}`}>
                <SpiralArtery pts={a.radial} w={4.6} />
                <SpiralArtery pts={a.spiral} w={4} />
              </g>
            ))}
          </Part>
          <Part id="umetoki-guruina">
            {GLANDS.map((g, i) => (
              <Gland key={i} pts={g} secretion={0.8} />
            ))}
          </Part>
          <Part id="miometrioa">
            <rect x={-400} y={MYO_TOP} width={1800} height={MYO_BOTTOM - MYO_TOP} fill={C.myometrium} />
            <rect x={-400} y={MYO_TOP} width={1800} height={MYO_BOTTOM - MYO_TOP} fill="url(#p-muscle)" opacity={0.4} />
            {FASCICLES.map((q, i) => (
              <g key={i}>
                <ellipse cx={q.x} cy={q.y} rx={q.rx} ry={q.ry} fill="#bb5852" stroke="#94403b" strokeWidth={0.8} opacity={0.75} />
                <ellipse cx={q.x - q.rx * 0.2} cy={q.y - q.ry * 0.32} rx={q.rx * 0.55} ry={q.ry * 0.36} fill="#d98a80" opacity={0.3} />
              </g>
            ))}
            {ARCUATE.map(([x, y], i) => (
              <Vessel key={`v${i}`} x={x} y={y} rx={13} ry={8} rot={8 * (i % 2 ? 1 : -1)} rim="#e8a0a8" />
            ))}
            <rect x={-400} y={MYO_TOP} width={1800} height={MYO_BOTTOM - MYO_TOP} fill="url(#w2-g-light)" />
          </Part>
          <Part id="perimetrioa">
            <rect x={-400} y={MYO_TOP - 20} width={1800} height={20} fill={C.perimetrium} />
            {/* Mesothelium: a row of flat cells on the outer surface. */}
            <path d={`M-400,${MYO_TOP - 18} L1400,${MYO_TOP - 18}`} stroke="#c98a98" strokeWidth={3} strokeDasharray="7 9" strokeLinecap="round" opacity={0.75} />
            <path d={`M-400,${MYO_TOP - 2} L1400,${MYO_TOP - 2}`} stroke="#d9a3ae" strokeWidth={1.2} opacity={0.7} />
          </Part>
          {/* The endometrium as one layer (light over its whole depth): still there, and named by the steps, once the camera is close. */}
          <Part id="endometrioa" quiet>
            <rect x={-400} y={MYO_BOTTOM} width={1800} height={SURF - MYO_BOTTOM} fill="url(#w2-g-light)" pointerEvents="none" />
          </Part>

          {/* Blastocyst (zona pellucida already lost): soft contact shadow, then its cells. */}
          <ellipse cx={cx} cy={cy + RB * 0.25} rx={RB * 1.05} ry={RB * 0.95} fill="rgba(0,0,0,0.28)" pointerEvents="none" />
          <g transform={squash}>
            <Part id="blastozistoa">
              <circle cx={cx} cy={cy} r={RB} fill="none" stroke="rgba(232,238,252,0.16)" strokeWidth={1.5} />
            </Part>
            <Conceptus f={f} x={cx} y={cy} s={SB} rot={rot} mass={1} id="w1i" parts={{ cell: (c) => (c.kind === 'enbrioblasto' || c.fate === 'enbrioblasto' ? 'enbrioblastoa' : 'trofoblastoa') }} />
          </g>

          <Part id="endometrio-epitelioa">
            <Epithelium x0={EPI[0]} x1={EPI[1]} y={SURF} th={EPI_TH} w={EPI[2]} gaps={gaps} />
          </Part>

          {/* The trophoblast next to the embryoblast proliferates (a thicker, darker cap) … */}
          {prolif > 0.01 && (
            <Part id="trofoblastoa">
              <g opacity={prolif}>
                <CellRing cx={cx} cy={top + RB} r={RB - 5} th={lerp(3, 10, prolif)} n={8} a0={240} a1={300} outward color={mix(C.trophoblast, invader, 0.6)} edge="#0f4f31" nucleus="#0b3a24" seed={4} />
              </g>
              {/* … and its cells wedge between the epithelial cells, into the stroma. */}
              {TONGUES.map(([, len, sway], i) => {
                const k = seg(inv, i * 0.12, 0.7 + i * 0.1);
                if (k < 0.02) return null;
                const base = SURF + 3;
                const L = 16 + len * k;
                const x = tx[i];
                const at = (s: number): Pt => [x + sway * Math.sin(s * Math.PI * 1.2) * 4, base - s * L];
                const d = tonguePath(x, base, L, TONGUE_W, sway);
                return (
                  <g key={i}>
                    <path d={d} fill={invader} stroke="#0c4a2f" strokeWidth={0.9} />
                    <path d={d} fill="url(#w2-g-cell)" opacity={0.8} />
                    {/* Borders between the cells of the column, and their nuclei. */}
                    {[0.36, 0.68].map((s) => {
                      const [px, py] = at(s);
                      const hw = TONGUE_W * (1 - 0.45 * s);
                      return L * s > 14 ? <path key={`b${s}`} d={`M${px - hw},${py + 1.5} Q${px},${py - 1.5} ${px + hw},${py + 1.5}`} fill="none" stroke="#0c4a2f" strokeWidth={0.8} /> : null;
                    })}
                    {[0.2, 0.52, 0.84].map((s) => {
                      const [px, py] = at(s);
                      return L * s > 10 ? <ellipse key={s} cx={px} cy={py} rx={2.3} ry={3} fill="#06301c" opacity={0.8} /> : null;
                    })}
                  </g>
                );
              })}
            </Part>
          )}

        </g>
      </g>

      {/* The approach: where it came from, which way it turns. */}
      <Journey pts={route} color="#8fb4f7" show={routeShow} head={8} width={2.4} r={RB * zs * 0.3} />
      <Arrow
        from={P(cx + RB * 1.25 * Math.cos(1.0), cy + RB * 1.25 * Math.sin(1.0))}
        to={P(cx + RB * 1.25 * Math.cos(-0.35), cy + RB * 1.25 * Math.sin(-0.35))}
        bend={0.3}
        color="#8fb4f7"
        width={2.2}
        show={seg(t, 0.25, 0.28) * (1 - seg(t, 0.43, 0.46))}
        progress={seg(t, 0.25, 0.4)}
      />
      <FollowRing x={P(cx, cy)[0]} y={P(cx, cy)[1]} r={(RB + 3) * zs} show={vis(t, 0.1, 0.46) * 0.9} u={1} />

      {/* Overview: the three layers of the uterine wall */}
      <Label id="perimetrioa" x={812} y={layer(MYO_TOP - 10)[1]} ax={layer(MYO_TOP - 10)[0] - 60} ay={layer(MYO_TOP - 10)[1]} align="start" show={over} />
      <Label id="miometrioa" x={812} y={layer(40)[1]} ax={layer(40)[0] - 60} ay={layer(40)[1]} align="start" show={over} />
      <Label id="endometrioa" x={812} y={layer(330)[1]} ax={layer(330)[0] - 60} ay={layer(330)[1]} align="start" show={over} />
      <Label id="umetoki-barrunbea" x={812} y={Math.min(600, layer(SURF + 60)[1])} ax={layer(SURF + 60)[0] - 60} ay={layer(SURF + 60)[1]} align="start" show={over} />
      <Label id="blastozistoa" x={190} y={470} ax={P(cx - RB, cy)[0]} ay={P(cx - RB, cy)[1]} show={vis(t, 0.1, 0.46)} />

      {/* The embryonic pole leading, and the implantation itself where the trophoblast meets the epithelium */}
      <Mark id="mutur-enbrionarioa" x={pole[0]} y={pole[1]} rx={30 * zs * 0.7} color="#8fb4f7" show={vis(t, 0.45, 0.66)} />
      <Mark id="habiratzea" x={site[0]} y={site[1]} rx={42 * zs * 0.55} ry={30 * zs * 0.55} show={seg(t, 0.7, 0.76)} />

      {/* Close-up */}
      <Label id="endometrio-estroma" x={190} y={70} ax={str[0]} ay={str[1]} show={close} />
      <Label id="amaren-odol-hodiak" x={190} y={118} ax={artery[0]} ay={artery[1]} show={close} />
      <Label id="umetoki-guruina" x={812} y={150} ax={gland[0]} ay={gland[1]} align="start" show={close * (gland[0] < 790 ? 1 : 0)} />
      <Label id="endometrio-epitelioa" x={812} y={262} ax={epi[0]} ay={epi[1]} align="start" show={close} />
      <Label id="mutur-enbrionarioa" x={190} y={200} ax={pole[0] - 26 * zs * 0.6} ay={pole[1]} show={vis(t, 0.45, 0.66)} />
      <Label id="habiratzea" x={190} y={200} ax={site[0] - 14} ay={site[1]} show={seg(t, 0.7, 0.76)} />
      <Label id="enbrioblastoa" x={190} y={410} ax={emb[0] - 8} ay={emb[1]} show={close} />
      <Label id="mutur-anenbrionarioa" x={812} y={520} ax={abpole[0]} ay={abpole[1]} align="start" show={vis(t, 0.45, 0.66)} />
      <Label id="blastozelea" x={812} y={440} ax={cav[0]} ay={cav[1]} align="start" show={close} />
      <Label id="trofoblastoa" x={812} y={482} ax={tro[0]} ay={tro[1]} align="start" show={close * (1 - seg(t, 0.64, 0.68))} />
      <Label id="trofoblastoa" x={812} y={340} ax={P(tx[2], SURF - 10 - 20 * inv)[0]} ay={P(tx[2], SURF - 10 - 20 * inv)[1]} align="start" show={seg(t, 0.66, 0.7)} />

      <Note x={500} y={618} show={vis(t, 0, 0.2)}>Umetokiaren pareta: endometrioa, miometrioa, perimetrioa</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.2, 0.45)}>Normalean atzeko (edo aurreko) paretan, ez albokoetan</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.45, 0.66)}>Mutur enbrionarioa aurretik: enbrioblastoaren ondoko trofoblastoa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.66, 0.84)}>Trofoblasto-zelulak zelula epitelialen artean inplantatzen dira</Note>
      <Note x={500} y={618} show={vis(t, 0.84)}>2. astean jarraitzen du (8. eguna →)</Note>

      <Hud value="6." unit=" eguna" caption="Ernalkuntzatik" />
    </g>
  );
}
