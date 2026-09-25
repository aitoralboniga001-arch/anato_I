'use client';

import { C, Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { spineAt } from '@/components/scenes/week5/skin';
import { Embryo28Outline, G28, onEll } from './BrainVesicles';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';

/**
 * Stage `gandor-neurala` — crest cells detach from the neural fold edges (epithelial→mesenchymal),
 * migrate dorsolaterally (under the ectoderm → epidermal melanocytes, per SOURCE_ISSUES: NOT hair
 * follicles or nails) and ventrally (between the neural tube and the somites → ganglia and more),
 * per the notes' derivative list (figure 4).
 */

// ---------------------------------------------------------------------------
// View A: transverse section — the two migration streams.
// ---------------------------------------------------------------------------

const lin = (k: number) => k;

function crestSection(t: number) {
  return makeSection({
    fold: 0.22,
    neural: lerp(0.8, 1, seg(t, 0, 0.14)),
    meso: 0.62,
    somite: 0.45,
    crest: seg(t, 0.15, 0.85, lin),
    aorta: 1,
    k: 1.6,
    oy: 40,
  });
}

function sectionLabels(t: number) {
  const s = crestSection(t);
  const dl = seg(t, 0.3, 0.6);
  const ng = s.neural;
  const tubeL = s.map(-(ng.rho + 12) * ng.sx, ng.cy - 10);
  const home = s.map(ng.closed > 0.5 ? 14 : ng.crest[0], ng.closed > 0.5 ? ng.topBasal - 4 : ng.crest[1] - 2);
  const ecto = s.map(-120, 4.5);
  const mel = s.map(240, 15);
  const som = s.map(-s.somite.cx - 24, s.somite.cd + 6);
  const drg = s.map(-((ng.rho + 12) * ng.sx + 16), ng.cy + 14);
  const aorta = s.map(48, s.dAorta);
  return (
    <>
      <Label id="hodi-neurala" x={190} y={100} ax={tubeL[0]} ay={tubeL[1]} />
      <Label id="melanozitoak" x={810} y={140} ax={mel[0]} ay={mel[1]} show={dl} small />
      <Label id="somitak" x={810} y={470} ax={som[0] + 2 * (500 - som[0])} ay={som[1]} small />
      <Label id="gongoil-errakideoak" x={190} y={470} ax={drg[0] - 8} ay={drg[1]} show={seg(t, 0.55, 0.75)} small />
      <Label id="gongoil-sinpatikoak" x={190} y={510} ax={s.at.sympathetic[0] - 6} ay={s.at.sympathetic[1]} show={seg(t, 0.7, 0.85)} small />
      <Label id="notokorda" x={190} y={550} ax={s.at.notochord[0] - 16} ay={s.at.notochord[1]} small />
      <Label id="gandor-neurala" x={810} y={100} ax={home[0] + 6} ay={home[1]} />
      <Label id="azaleko-ektodermoa" x={190} y={140} ax={ecto[0]} ay={ecto[1]} />
      <Label id="aorta-dortsalak" x={810} y={510} ax={aorta[0] + 14} ay={aorta[1]} small />
    </>
  );
}

export function NeuralCrestSection({ t }: SceneProps) {
  return (
    <g>
      <SectionDrawing s={crestSection(t)} />
      <Note x={500} y={600} show={seg(t, 0.78, 0.98)}>
        Ile-folikuluak eta azazkalak gainazaleko ektodermotik dira, EZ gandor neuraletik
      </Note>
      {sectionLabels(t)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// View B: derivative map, over the folded day-28 embryo silhouette (fate destinations).
// ---------------------------------------------------------------------------

interface Dest {
  id: string;
  at: Pt;
  x: number;
  y: number;
  group: number;
}

const g = G28;
const sp = (u: number, d: number): Pt => spineAt(g.S, u, d).p;
const mid = (a: Pt, b: Pt, k = 0.5): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const L = 330;
const R = 740;

const DESTS: Dest[] = [
  // Head: skull/face bones, meninges, cranial ganglia, dermis, odontoblasts, facial vessel muscle
  { id: 'meningeak-kraneal', at: onEll(g.cran, -150, 0.78), x: L, y: 145, group: 0 },
  { id: 'buru-aurpegi-hezurrak', at: onEll(g.cran, 175, 0.72), x: L, y: 190, group: 0 },
  { id: 'nerbio-kranialen-gongoilak', at: mid(g.bars[1].top, sp(0.0, 30), 0.55), x: L, y: 100, group: 0 },
  { id: 'buru-lepo-dermisa', at: sp(0.02, 3), x: R, y: 80, group: 0 },
  { id: 'odontoblastoak', at: mid(g.bars[0].top, g.bars[0].bot, 0.75), x: L, y: 235, group: 1 },
  { id: 'aurpegi-hodi-muskulu-leuna', at: [g.face[0] - 10, g.face[1]], x: L, y: 280, group: 1 },
  { id: 'tiroide-c-zelulak', at: mid(g.bars[3].top, g.bars[3].bot, 0.8), x: R, y: 200, group: 1 },
  { id: 'bihotz-trenkada-tronkokonala', at: onEll(g.heart, -150, 0.55), x: L, y: 325, group: 1 },
  // Trunk: skin melanocytes, peripheral nerve glia, ganglia, adrenal medulla
  { id: 'melanozitoak', at: sp(0.38, 2), x: R, y: 320, group: 2 },
  { id: 'glia-zelulak', at: sp(0.3, 12), x: R, y: 250, group: 2 },
  { id: 'schwann-zelulak', at: sp(0.62, 24), x: R, y: 545, group: 2 },
  { id: 'gongoil-errakideoak', at: sp(0.42, 22), x: R, y: 390, group: 3 },
  { id: 'gongoil-sinpatikoak', at: sp(0.46, 44), x: R, y: 440, group: 3 },
  { id: 'giltzurrun-gaineko-muina', at: sp(0.55, 62), x: R, y: 490, group: 3 },
  { id: 'gongoil-parasinpatikoak', at: sp(0.5, 78), x: L, y: 420, group: 3 },
];

function groupShow(t: number, group: number) {
  const a = 0.06 + group * 0.22;
  return seg(t, a, a + 0.2);
}

function MapDrawing({ t }: SceneProps) {
  return (
    <g>
      <Embryo28Outline />
      {/* Origin: the crest along the dorsal neural tube */}
      <path d={smoothPath(Array.from({ length: 30 }, (_, i) => sp(0.02 + (0.93 * i) / 29, 8)), false)} fill="none" stroke={C.neuralCrest} strokeWidth={3} strokeDasharray="2 5" strokeLinecap="round" opacity={0.6} />
      {DESTS.map((d) => {
        const show = groupShow(t, d.group);
        return (
          <Part id={d.id} key={d.id} show={show}>
            <circle cx={d.at[0]} cy={d.at[1]} r={7} fill={C.neuralCrest} stroke="#0f766e" strokeWidth={1.4} />
          </Part>
        );
      })}
    </g>
  );
}

function mapLabels(t: number) {
  return (
    <>
      {DESTS.map((d) => (
        <Label key={d.id} id={d.id} x={d.x} y={d.y} ax={d.at[0]} ay={d.at[1]} show={groupShow(t, d.group)} small />
      ))}
    </>
  );
}

export function NeuralCrestDerivatives(props: SceneProps) {
  return (
    <g>
      <MapDrawing {...props} />
      {mapLabels(props.t)}
    </g>
  );
}
