'use client';

import { C, Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { SectionDrawing, makeSection } from '@/components/scenes/section/Section';
import { bodyLoop, dorsalPt, ventralPt, type Pt } from './common';

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

const DESTS: Dest[] = [
  { id: 'buru-aurpegi-hezurrak', at: [dorsalPt(0.03, 1, 30)[0], dorsalPt(0.03, 1, 30)[1]], x: 770, y: 250, group: 0 },
  { id: 'meningeak-kraneal', at: [dorsalPt(0.06, 1, 12)[0], dorsalPt(0.06, 1, 12)[1]], x: 190, y: 130, group: 0 },
  { id: 'nerbio-kranialen-gongoilak', at: [dorsalPt(0.1, 1, 4)[0], dorsalPt(0.1, 1, 4)[1]], x: 770, y: 290, group: 0 },
  { id: 'buru-lepo-dermisa', at: [dorsalPt(0.14, 1, -10)[0], dorsalPt(0.14, 1, -10)[1]], x: 190, y: 170, group: 0 },
  { id: 'melanozitoak', at: [dorsalPt(0.2, 1, -8)[0], dorsalPt(0.2, 1, -8)[1]], x: 770, y: 130, group: 1 },
  { id: 'odontoblastoak', at: [dorsalPt(0.04, 1, 40)[0], dorsalPt(0.04, 1, 40)[1]], x: 190, y: 210, group: 1 },
  { id: 'tiroide-c-zelulak', at: [ventralPt(0.25, 1, 30)[0], ventralPt(0.25, 1, 30)[1]], x: 770, y: 170, group: 1 },
  { id: 'bihotz-trenkada-tronkokonala', at: [ventralPt(0.3, 1, 10)[0], ventralPt(0.3, 1, 10)[1]], x: 190, y: 250, group: 1 },
  { id: 'aurpegi-hodi-muskulu-leuna', at: [dorsalPt(0.08, 1, 20)[0], dorsalPt(0.08, 1, 20)[1]], x: 770, y: 330, group: 2 },
  { id: 'schwann-zelulak', at: [dorsalPt(0.5, 1, 20)[0], dorsalPt(0.5, 1, 20)[1]], x: 190, y: 290, group: 2 },
  { id: 'glia-zelulak', at: [dorsalPt(0.6, 1, 12)[0], dorsalPt(0.6, 1, 12)[1]], x: 770, y: 210, group: 2 },
  { id: 'gongoil-errakideoak', at: [dorsalPt(0.45, 1, 4)[0], dorsalPt(0.45, 1, 4)[1]], x: 190, y: 330, group: 3 },
  { id: 'gongoil-sinpatikoak', at: [ventralPt(0.55, 1, 30)[0], ventralPt(0.55, 1, 30)[1]], x: 770, y: 370, group: 3 },
  { id: 'giltzurrun-gaineko-muina', at: [ventralPt(0.62, 1, 34)[0], ventralPt(0.62, 1, 34)[1]], x: 190, y: 370, group: 3 },
  { id: 'gongoil-parasinpatikoak', at: [ventralPt(0.4, 1, 36)[0], ventralPt(0.4, 1, 36)[1]], x: 770, y: 410, group: 3 },
];

function groupShow(t: number, group: number) {
  const a = 0.06 + group * 0.22;
  return seg(t, a, a + 0.2);
}

function MapDrawing({ t }: SceneProps) {
  return (
    <g>
      <path d={bodyLoop(1, 0)} fill="rgba(122,150,220,0.07)" stroke="rgba(232,238,252,0.28)" strokeWidth={1.2} />
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
