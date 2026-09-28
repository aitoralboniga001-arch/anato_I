'use client';

import { Arrow, Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { SectionDrawing, makeSection, type Section } from '@/components/scenes/section/Section';

/**
 * `somitaren-bereizketa` — a somite's cells are initially uniform (epithelial ball). The somite then
 * splits DORSOVENTRALLY (not mediolaterally): the dorsal plate, right under the ectoderm and spanning
 * the somite's full mediolateral width, becomes the dermomyotome (dermatome = its outer/dorsal
 * sub-layer -> dermis; myotome = the layer beneath it -> muscle). The ventromedial portion —
 * deeper, closest to the notochord/neural tube — becomes the sclerotome, whose cells migrate
 * medially to surround the notochord and neural tube (-> vertebrae + ribs).
 * Drawn with the shared realistic section engine (cells, epithelia, mesenchyme).
 */

// Step windows (week4b.ts beats): each change happens INSIDE its own step, never before it.
export const SB = { sclero: 0.12, migrate: 0.26, dermomyo: 0.4, dermato: 0.56, myo: 0.72, fate: 0.88 };
function geometry(t: number) {
  const uniform = 1 - seg(t, SB.sclero, SB.sclero + 0.08);
  const sclero = seg(t, SB.sclero, SB.sclero + 0.08);
  const migrate = seg(t, SB.migrate, SB.migrate + 0.12);
  const dermomyo = seg(t, SB.dermomyo, SB.dermomyo + 0.08) * (1 - seg(t, SB.dermato, SB.dermato + 0.03));
  const dermato = seg(t, SB.dermato + 0.04, SB.dermato + 0.08);
  const myo = seg(t, SB.myo, SB.myo + 0.08);
  /** Myotome cells travelling out into the somatic layer (limb / body-wall muscle). */
  const myoOut = seg(t, SB.myo + 0.04, SB.fate);
  const fate = seg(t, SB.fate, SB.fate + 0.06);
  return { uniform, sclero, migrate, dermomyo, dermato, myo, myoOut, fate };
}

const FOLD = 0.3;

function somiteSection(t: number, k: number, focus: boolean) {
  const params = {
    fold: FOLD,
    neural: 1,
    meso: 1,
    // .75: sclerotome out, dorsal plate intact; the plate splits in the dermatome step (.85) and the myotome completes in its own step (.95).
    somite: 0.45 + 0.3 * seg(t, SB.sclero, SB.sclero + 0.1) + 0.1 * seg(t, SB.dermato, SB.dermato + 0.08) + 0.1 * seg(t, SB.myo, SB.myo + 0.08),
    crest: 0,
    aorta: 1,
    k: 1,
    ids: { ectoderm: 'ektodermoa' },
  };
  if (!focus) return makeSection({ ...params, k, oy: 30 });
  // Centre the right somite on the canvas.
  const s1 = makeSection(params);
  const c = s1.map(s1.somite.cx - 20, s1.somite.cd);
  return makeSection({
    ...params,
    k,
    ox: -k * (c[0] - 500),
    oy: -k * (c[1] - 320),
  });
}

type P2 = [number, number];
const line = (pts: P2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');

/** Sclerotome fates (vertebra around the notochord/tube, ribs into the body wall) and myotome cells entering the somatic layer. */
function FateOverlay({ s, fate, myoOut }: { s: Section; fate: number; myoOut: number }) {
  if (fate <= 0.02 && myoOut <= 0.02) return null;
  const ng = s.neural;
  const [nx, ny] = s.at.notochord;
  const Rx = (ng.rho + 12) * ng.sx + 9;
  const Ry = (ng.rho + 12) * ng.sy + 9;
  const arch = (sd: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const th = lerp(0.92, 0.3, i / 11) * Math.PI;
      return s.map(sd * Rx * Math.sin(th), ng.cy + Ry * Math.cos(th));
    });
  // Ribs: from the vertebral body, ventral to the somite, then out into the somatic body wall.
  const ribD = (x: number) => {
    const u = Math.min(1, Math.max(0, (x - 100) / 100));
    return lerp(s.dNoto - 4, 17, u * u * (3 - 2 * u));
  };
  const rib = (sd: number) =>
    Array.from({ length: 16 }, (_, i) => {
      const x = lerp(26, 320, i / 15);
      return s.map(sd * x, ribD(x));
    });
  const myoFrom = s.map(s.somite.cx + s.somite.rx * 0.8, s.somite.cd - s.somite.rd * 0.4);
  const myoTo = s.map(250, 20);
  return (
    <g>
      <Part id="ornoak" show={fate}>
        <ellipse cx={nx} cy={ny} rx={24 * s.k} ry={17 * s.k} fill="#f0e6d2" opacity={0.5} stroke="#c8b98f" strokeWidth={1.2} />
        {[1, -1].map((sd) => (
          <path key={sd} d={line(arch(sd))} fill="none" stroke="#f0e6d2" strokeOpacity={0.75} strokeWidth={6 * s.k} strokeLinecap="round" />
        ))}
      </Part>
      <Part id="saihetsak" show={fate}>
        {[1, -1].map((sd) => (
          <path key={sd} d={line(rib(sd))} fill="none" stroke="#f0e6d2" strokeOpacity={0.75} strokeWidth={5 * s.k} strokeLinecap="round" strokeDasharray={`${9 * s.k} ${3 * s.k}`} />
        ))}
      </Part>
      {/* Some myotome cells migrate into the somatic (parietal) layer: limb / body-wall muscle. */}
      <g pointerEvents="none" opacity={Math.min(1, myoOut * 4)}>
        {[0.3, 0.55, 0.8].map((u) => {
          const k = u * myoOut;
          return <ellipse key={u} cx={lerp(myoFrom[0], myoTo[0], k)} cy={lerp(myoFrom[1], myoTo[1], k)} rx={3.6 * s.k} ry={2.4 * s.k} fill="#c2410c" stroke="#6b2413" strokeWidth={0.6} />;
        })}
      </g>
      <Arrow from={myoFrom} to={myoTo} bend={-0.12} color="#fb923c" width={1.8} dashed show={myoOut * (1 - fate)} />
    </g>
  );
}

/** Sclerotome cells heading medially to surround the notochord and neural tube. */
function ScleroArrows({ s, t }: { s: Section; t: number }) {
  const show = seg(t, SB.migrate, SB.migrate + 0.03) * (1 - seg(t, SB.dermomyo - 0.02, SB.dermomyo + 0.02));
  if (show <= 0.02) return null;
  const so = s.somite;
  return (
    <>
      {[1, -1].map((sd) => (
        <Arrow key={sd} from={s.map(sd * (so.cx - so.rx * 0.3), so.cd + so.rd * 0.5)} to={s.map(sd * 26, s.dNoto - 6)} bend={sd * 0.18} color="#fbbf24" width={2} show={show} progress={seg(t, SB.migrate, SB.migrate + 0.1)} />
      ))}
    </>
  );
}

function anchors(s: Section, t: number): Record<string, P2> {
  const { migrate } = geometry(t);
  const so = s.somite;
  const ng = s.neural;
  const top = so.cd - so.rd * 0.85;
  return {
    somitak: s.map(so.cx + so.rx * 0.55, so.cd),
    dermatomiotoma: s.map(so.cx + 8, top + 5.5),
    dermatoma: s.map(so.cx + 8, top + 3),
    miotoma: s.map(so.cx + 8, top + 19),
    esklerotoma: s.map(lerp(so.cx - so.rx * 0.35, 30, migrate), lerp(so.cd + so.rd * 0.45, (ng.cy + s.dNoto) / 2 + 6, migrate)),
    notokorda: [s.at.notochord[0] - 10 * s.k, s.at.notochord[1]],
    'hodi-neurala': s.map(-(ng.rho + 12) * ng.sx, ng.cy - 8),
    ornoak: s.map(-Math.min(60, (ng.rho + 12) * ng.sx + 9), ng.cy + 20),
    saihetsak: s.map(250, 17),
    ektodermoa: s.map(-200, 4.5),
    'alboko-mesodermoa': s.map(-330, 15),
    'bitarteko-mesodermoa': s.map(-169, (9 + s.dEndo(169)) / 2),
    endodermoa: s.map(250, s.dEndo(250) + 4.5),
  };
}

function labels(s: Section, t: number, close: boolean) {
  const g = geometry(t);
  const a = anchors(s, t);
  const L = (id: string, x: number, y: number, show = 1, small = false) => <Label key={id} id={id} x={x} y={y} ax={a[id][0]} ay={a[id][1]} show={show} small={small} />;
  if (close)
    return (
      <>
        {L('ektodermoa', 820, 110, 1, true)}
        {L('dermatoma', 820, 150, g.dermato)}
        {L('dermatomiotoma', 820, 190, g.dermomyo)}
        {L('somitak', 820, 190, g.uniform)}
        {L('miotoma', 820, 240, g.myo)}
        {L('saihetsak', 820, 470, g.fate, true)}
        {L('hodi-neurala', 150, 200)}
        {L('esklerotoma', 150, 370, g.sclero)}
        {L('notokorda', 150, 420)}
        {L('ornoak', 150, 470, g.fate, true)}
      </>
    );
  return (
    <>
      {L('hodi-neurala', 190, 110)}
      {L('ektodermoa', 190, 150, 1, true)}
      {L('somitak', 810, 110, g.uniform)}
      {L('dermatomiotoma', 810, 150, g.dermomyo)}
      {L('dermatoma', 810, 150, g.dermato)}
      {L('miotoma', 810, 190, g.myo)}
      {L('notokorda', 190, 440)}
      {L('ornoak', 190, 480, g.fate, true)}
      {L('bitarteko-mesodermoa', 190, 520, 1, true)}
      {L('alboko-mesodermoa', 190, 560, 1, true)}
      {L('esklerotoma', 810, 440, g.sclero)}
      {L('saihetsak', 810, 480, g.fate, true)}
      {L('endodermoa', 810, 520, 1, true)}
    </>
  );
}

/** Wide context: the somite pair within the whole transverse section. */
export function SomiteContext({ t }: SceneProps) {
  const s = somiteSection(t, 1, false);
  return (
    <g>
      <SectionDrawing s={s} show={{ crest: 0 }} />
      <FateOverlay s={s} fate={geometry(t).fate} myoOut={geometry(t).myoOut} />
      <ScleroArrows s={s} t={t} />
      <Note x={500} y={610} tone="dim" size={11}>
        Odol-hodiak mesodermotik sortzen dira (hemangioblastoak), somiten inguruan barne
      </Note>
      {labels(s, t, false)}
    </g>
  );
}

/** Close-up of the right somite (neural tube and notochord at its medial side). */
export function SomiteClose({ t }: SceneProps) {
  const s = somiteSection(t, 2.3, true);
  return (
    <g>
      <SectionDrawing s={s} show={{ crest: 0 }} />
      <FateOverlay s={s} fate={geometry(t).fate} myoOut={geometry(t).myoOut} />
      <ScleroArrows s={s} t={t} />
      {labels(s, t, true)}
    </g>
  );
}
