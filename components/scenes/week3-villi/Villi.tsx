'use client';

import { C, Flow, Label, Note, Part, clamp, lerp, seg, zoom, type SceneProps } from '@/components/kit';
import { V, VilliDefs, f1, filletD, fingerD, loopD, place } from './common';

/**
 * Stage `biloxkak` — primary → secondary → tertiary villus (day 13 → end of week 3).
 * Windows (shared by every view and by the beats in content/weeks/week3b.ts):
 *   .00–.30 primary villus: cytotrophoblast core covered by syncytium, it lengthens (.08–.26)
 *   .30–.48 extra-embryonic mesoderm of the chorionic plate grows into the core → secondary villus
 *   .55–.63 blood islands (angioblast clusters) differentiate in the mesoderm core
 *   .67–.78 they join into capillaries, continuous with the chorionic-plate vessels → tertiary villus
 *   (each window starts at its beat and ends before the step's complete frame)
 *   .82–1   comparison: only the core changes
 */
export const W = {
  grow: [0.08, 0.26],
  meso: [0.3, 0.46],
  islands: [0.55, 0.63],
  vessels: [0.67, 0.78],
} as const;

const PLATE = { syn: 470, cyto: 484, meso: 498, bottom: 560 };
const ROOF = { synTop: 95, synBottom: 125 };
const BASE = { syn: 478, cyto: 490, meso: 504, vessel: 528 };

const VILLI = [
  { x: 500, len0: 228, len1: 300, hw: 46, ts: 12, tc: 11 },
  { x: 290, len0: 150, len1: 214, hw: 32, ts: 9, tc: 8 },
  { x: 710, len0: 160, len1: 226, hw: 32, ts: 9, tc: 8 },
];

function geometry(t: number) {
  const grow = seg(t, W.grow[0], W.grow[1]);
  const meso = seg(t, W.meso[0], W.meso[1]);
  const islands = seg(t, W.islands[0], W.islands[1]);
  const vessels = seg(t, W.vessels[0], W.vessels[1]);
  const villi = VILLI.map((v) => {
    const len = lerp(v.len0, v.len1, grow);
    const synTip = BASE.syn - len;
    const cytoLen = BASE.cyto - (synTip + v.ts);
    const mesoHw = v.hw - v.ts - v.tc;
    const mesoFull = BASE.meso - (synTip + v.ts + v.tc);
    const mesoLen = mesoFull * meso;
    const mesoTip = BASE.meso - mesoLen;
    const half = mesoHw * 0.48;
    const loopLen = BASE.vessel - (synTip + v.ts + v.tc + 7);
    return { ...v, len, synTip, cytoLen, mesoHw, mesoLen, mesoTip, half, loopLen };
  });
  return { grow, meso, islands, vessels, villi };
}
type Geo = ReturnType<typeof geometry>;

/** Blood-island positions (local offsets along the capillary path of each villus). */
function islandPts(v: Geo['villi'][number]) {
  return [0.3, 0.55, 0.8].map((k, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return [v.x + side * v.half, BASE.vessel - v.loopLen * k] as [number, number];
  });
}

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: f1(1 - p) });

function VilliDrawing({ t, reduced }: SceneProps) {
  const g = geometry(t);
  const { villi, meso, islands, vessels } = g;
  const islandShow = islands * (1 - seg(t, 0.72, 0.8));
  const primary = 1 - seg(t, 0.3, 0.38);
  const secondary = seg(t, 0.3, 0.38) * (1 - seg(t, 0.67, 0.75));
  const tertiary = seg(t, 0.67, 0.75);
  const ivsShow = seg(t, 0.68, 0.78);
  const lakunaShow = 1 - ivsShow;
  const c = villi[0];
  return (
    <g mask="url(#m-slab)">
      <Part id="dezidua-basala">
        <rect x={0} y={0} width={1000} height={ROOF.synTop + 1} fill="url(#p-decidua)" />
      </Part>

      <Part id="lakuak" show={lakunaShow}>
        <rect x={0} y={ROOF.synBottom - 1} width={1000} height={PLATE.syn - ROOF.synBottom + 2} fill="url(#w3v-mblood)" opacity={0.92} />
      </Part>
      <Part id="biloxka-arteko-espazioa" show={ivsShow}>
        <rect x={0} y={ROOF.synBottom - 1} width={1000} height={PLATE.syn - ROOF.synBottom + 2} fill="url(#w3v-mblood)" opacity={0.92} />
      </Part>
      {[
        'M398,140 C380,250 420,360 396,462',
        'M604,462 C620,360 588,250 606,140',
        'M222,150 C238,280 214,380 230,462',
        'M778,462 C764,340 790,250 772,150',
      ].map((d, i) => (
        <Flow key={i} d={d} n={5} dur={7 + i} r={2.4} color="#ff6b81" reduced={reduced} />
      ))}

      {/* Central villus outline: one clickable id per villus type, cross-fading with the core change. A rim
          drawn under the villus, so only its outer edge shows. */}
      {(
        [
          ['biloxka-primarioa', primary],
          ['biloxka-sekundarioa', secondary],
          ['biloxka-tertziarioa', tertiary],
        ] as const
      ).map(([id, s]) => (
        <Part key={id} id={id} show={s}>
          <path transform={place(c.x, BASE.syn)} d={fingerD(c.len, c.hw)} fill="none" stroke="#e8eefc" strokeWidth={4.5} opacity={0.6} />
        </Part>
      ))}

      {/* Each layer: the villi's outlines (double width), then the plate band and fillets, then the villi's
          fills — villi and plate read as one tissue, with no seams or feet where they meet. */}
      <Part id="sinzitiotrofoblastoa">
        <rect x={0} y={ROOF.synTop} width={1000} height={ROOF.synBottom - ROOF.synTop} fill="url(#p-syncytio)" />
        {villi.map((v, i) => (
          <path key={i} transform={place(v.x, BASE.syn)} d={fingerD(v.len, v.hw)} fill="none" stroke={C.syncytioDeep} strokeWidth={2.4} />
        ))}
        <rect x={0} y={PLATE.syn} width={1000} height={PLATE.cyto - PLATE.syn + 1} fill="url(#p-syncytio)" />
        {villi.map((v, i) => (
          <g key={i}>
            <path d={filletD(v.x, v.hw, PLATE.syn, 12)} fill="url(#p-syncytio)" />
            <path transform={place(v.x, BASE.syn)} d={fingerD(v.len, v.hw)} fill="url(#p-syncytio)" />
          </g>
        ))}
      </Part>

      <Part id="zitotrofoblastoa">
        {villi.map((v, i) => (
          <path key={i} transform={place(v.x, BASE.cyto)} d={fingerD(v.cytoLen, v.hw - v.ts, 6)} fill="none" stroke="rgba(22,80,45,0.6)" strokeWidth={2} />
        ))}
        <rect x={0} y={PLATE.cyto} width={1000} height={PLATE.meso - PLATE.cyto + 1} fill="url(#w3v-cyto)" />
        {villi.map((v, i) => (
          <g key={i}>
            <path d={filletD(v.x, v.hw - v.ts, PLATE.cyto, 8)} fill="url(#w3v-cyto)" />
            <path transform={place(v.x, BASE.cyto)} d={fingerD(v.cytoLen, v.hw - v.ts, 6)} fill="url(#w3v-cyto)" />
          </g>
        ))}
      </Part>

      <Part id="enbrioi-kanpoko-mesodermoa">
        {meso > 0.01 &&
          villi.map((v, i) => <path key={i} transform={place(v.x, BASE.meso)} d={fingerD(v.mesoLen, v.mesoHw, 5)} fill="none" stroke="#d9785a" strokeWidth={1.6} />)}
        <rect x={0} y={PLATE.meso} width={1000} height={PLATE.bottom - PLATE.meso} fill={C.mesoExtra} />
        {meso > 0.01 &&
          villi.map((v, i) => (
            <g key={i}>
              <path d={filletD(v.x, v.mesoHw, PLATE.meso, Math.min(6, Math.max(0, v.mesoLen - (BASE.meso - PLATE.meso))))} fill={C.mesoExtra} />
              <path transform={place(v.x, BASE.meso)} d={fingerD(v.mesoLen, v.mesoHw, 5)} fill={C.mesoExtra} />
            </g>
          ))}
        <rect x={0} y={PLATE.meso} width={1000} height={PLATE.bottom - PLATE.meso} fill="url(#p-meso-extra)" />
        {meso > 0.01 && villi.map((v, i) => <path key={i} transform={place(v.x, BASE.meso)} d={fingerD(v.mesoLen, v.mesoHw, 5)} fill="url(#p-meso-extra)" />)}
      </Part>

      <Part id="korion-barrunbea" quiet>
        <rect x={0} y={PLATE.bottom} width={1000} height={640 - PLATE.bottom} fill="#131a2b" />
        <rect x={0} y={PLATE.bottom} width={1000} height={640 - PLATE.bottom} fill="url(#g-shade)" opacity={0.35} />
      </Part>

      <Part id="enbrioi-kanpoko-hodiak" show={vessels > 0 ? 1 : 0}>
        <path d={`M200,${BASE.vessel} L800,${BASE.vessel}`} fill="none" stroke={V.endothelium} strokeWidth={9} strokeLinecap="round" {...dash(vessels)} />
        <path d={`M200,${BASE.vessel} L800,${BASE.vessel}`} fill="none" stroke={V.fetal} strokeWidth={5.5} strokeLinecap="round" {...dash(vessels)} />
      </Part>

      <Part id="biloxka-kapilarrak" show={Math.max(islandShow, vessels > 0 ? 1 : 0)}>
        {vessels > 0 &&
          villi.map((v, i) => (
            <g key={i} transform={place(v.x, BASE.vessel)}>
              <path d={loopD(v.loopLen, v.half)} fill="none" stroke={V.endothelium} strokeWidth={7} {...dash(vessels)} />
              <path d={loopD(v.loopLen, v.half)} fill="none" stroke={V.fetal} strokeWidth={4} {...dash(vessels)} />
            </g>
          ))}
        {islandShow > 0.01 &&
          villi.flatMap((v, i) =>
            islandPts(v).map(([x, y], j) => (
              <g key={`${i}-${j}`} opacity={islandShow}>
                <circle cx={x} cy={y} r={lerp(2, 5.5, islands)} fill={V.endothelium} />
                <circle cx={x - 1.6} cy={y - 1} r={1.8 * islands} fill={V.fetal} />
                <circle cx={x + 1.8} cy={y + 1.2} r={1.8 * islands} fill={V.fetal} />
              </g>
            )),
          )}
      </Part>

      {/* Chorionic plate bracket (the plate = extra-embryonic mesoderm + cyto + syncytio). */}
      <Part id="korion-plaka">
        <path d={`M232,${PLATE.syn} h-8 v${PLATE.bottom - PLATE.syn} h8`} fill="none" stroke="#e8eefc" strokeWidth={2} opacity={0.85} />
      </Part>
    </g>
  );
}

function labels(t: number, at: (x: number, y: number) => [number, number], closeUp: boolean) {
  const g = geometry(t);
  const [c, l, r] = g.villi;
  const primary = 1 - seg(t, 0.3, 0.38);
  const secondary = seg(t, 0.3, 0.38) * (1 - seg(t, 0.67, 0.75));
  const tertiary = seg(t, 0.67, 0.75);
  const vessels = clamp((g.vessels - 0.02) / 0.08);
  const ivsShow = seg(t, 0.68, 0.78);
  const lakunaShow = 1 - ivsShow;
  const L = (id: string, x: number, y: number, p: [number, number], show = 1, text?: string) => {
    const [ax, ay] = at(p[0], p[1]);
    return <Label key={id} id={id} x={x} y={y} ax={ax} ay={ay} show={show} text={text} />;
  };
  if (closeUp) {
    // Zoomed on the tip of the central villus.
    const v = c;
    return (
      <>
        {L('lakuak', 180, 110, [v.x - v.hw - 40, v.synTip + 30], lakunaShow)}
        {L('biloxka-arteko-espazioa', 180, 110, [v.x - v.hw - 40, v.synTip + 30], ivsShow)}
        {L('sinzitiotrofoblastoa', 180, 190, [v.x - v.hw + 5, v.synTip + 90])}
        {L('zitotrofoblastoa', 180, 280, [v.x - v.hw + v.ts + 4, v.synTip + 60])}
        {L('biloxka-primarioa', 180, 470, [v.x - v.hw - 3, 420], primary)}
        {L('biloxka-sekundarioa', 180, 500, [v.x - v.hw - 3, 420], secondary)}
        {L('biloxka-tertziarioa', 180, 530, [v.x - v.hw - 3, 420], tertiary)}
        {L('enbrioi-kanpoko-mesodermoa', 820, 300, [v.x + v.mesoHw * 0.7, Math.max(v.mesoTip + 16, 330)], clamp(g.meso / 0.05) * clamp((420 - v.mesoTip) / 40), 'Kanpoko mesodermoa')}
        {L('biloxka-kapilarrak', 820, 400, [v.x + v.half, BASE.vessel - v.loopLen * 0.55], Math.max(vessels, g.islands * (1 - seg(t, 0.72, 0.8))), 'Biloxka kapilarrak')}
      </>
    );
  }
  const mesoMid = (v: typeof r) => (BASE.meso + v.mesoTip) / 2;
  return (
    <>
      {L('dezidua-basala', 190, 58, [262, 58])}
      {L('sinzitiotrofoblastoa', 190, 110, [250, 110])}
      {L('biloxka-primarioa', 190, 165, [c.x - c.hw - 3, 330], primary)}
      {L('biloxka-sekundarioa', 190, 195, [c.x - c.hw - 3, 330], secondary)}
      {L('biloxka-tertziarioa', 190, 225, [c.x - c.hw - 3, 330], tertiary)}
      {L('zitotrofoblastoa', 190, 400, [l.x - l.hw + l.ts + 4, 400])}
      {L('korion-plaka', 190, 510, [224, 510])}
      {L('korion-barrunbea', 190, 590, [262, 590])}
      {L('lakuak', 810, 260, [772, 260], lakunaShow)}
      {L('biloxka-arteko-espazioa', 810, 260, [772, 260], ivsShow)}
      {L('enbrioi-kanpoko-mesodermoa', 810, 330, [r.x, mesoMid(r)], clamp((g.meso - 0.2) / 0.12), 'Kanpoko mesodermoa')}
      {L('biloxka-kapilarrak', 810, 400, [r.x + r.half, BASE.vessel - r.loopLen * 0.55], Math.max(vessels, g.islands * (1 - seg(t, 0.72, 0.8))), 'Biloxka kapilarrak')}
      {L('enbrioi-kanpoko-hodiak', 810, 528, [Math.max(250, Math.min(752, 200 + 600 * g.vessels - 6)), BASE.vessel], vessels, 'Enbrioi kanpoko hodiak')}
    </>
  );
}

export function VilliLongitudinal(props: SceneProps) {
  const id = (x: number, y: number): [number, number] => [x, y];
  return (
    <g>
      <VilliDefs />
      <VilliDrawing {...props} />
      {labels(props.t, id, false)}
    </g>
  );
}

export function VilliTip(props: SceneProps) {
  const z = zoom(500, 300, 2, 500, 330);
  return (
    <g>
      <VilliDefs />
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <VilliDrawing {...props} />
      </g>
      {labels(props.t, z.at, true)}
    </g>
  );
}

/* ---------- Transverse sections (like the notes' figure) ---------- */

const SEC_R = 82;
const SEC_Y = 300;

function Section({ cx, kind, t }: { cx: number; kind: 0 | 1 | 2; t: number }) {
  const g = geometry(t);
  const coreR = SEC_R - 14;
  const mesoR = SEC_R - 27;
  const mesoGrow = kind === 0 ? 0 : kind === 1 ? g.meso : 1;
  const islands = kind === 2 ? g.islands * (1 - seg(t, 0.72, 0.8)) : 0;
  const vessels = kind === 2 ? g.vessels : 0;
  const fringe = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2;
    return `M${f1(cx + SEC_R * Math.cos(a))},${f1(SEC_Y + SEC_R * Math.sin(a))} l${f1(4 * Math.cos(a))},${f1(4 * Math.sin(a))}`;
  }).join('');
  const lumens: [number, number, number, number][] = [
    [cx - 22, SEC_Y - 16, 9, 6],
    [cx + 20, SEC_Y - 20, 7, 10],
    [cx - 16, SEC_Y + 22, 7, 6],
    [cx + 22, SEC_Y + 18, 10, 7],
  ];
  return (
    <g>
      <Part id="sinzitiotrofoblastoa">
        <path d={fringe} stroke={C.syncytioDeep} strokeWidth={1} />
        <circle cx={cx} cy={SEC_Y} r={SEC_R} fill="url(#p-syncytio)" stroke={C.syncytioDeep} strokeWidth={1.4} />
      </Part>
      <Part id="zitotrofoblastoa">
        <circle cx={cx} cy={SEC_Y} r={coreR} fill="url(#w3v-cyto)" stroke="rgba(22,80,45,0.6)" />
      </Part>
      {mesoGrow > 0.01 && (
        <Part id="enbrioi-kanpoko-mesodermoa">
          <circle cx={cx} cy={SEC_Y} r={mesoR * mesoGrow} fill={C.mesoExtra} />
          <circle cx={cx} cy={SEC_Y} r={mesoR * mesoGrow} fill="url(#p-meso-extra)" stroke="#d9785a" strokeWidth={0.8} />
        </Part>
      )}
      {kind === 2 && (islands > 0.01 || vessels > 0.01) && (
        <Part id="biloxka-kapilarrak">
          {lumens.map(([x, y, rx, ry], i) => (
            <g key={i}>
              <g opacity={islands}>
                <circle cx={x} cy={y} r={5} fill={V.endothelium} />
                <circle cx={x - 1.5} cy={y} r={1.8} fill={V.fetal} />
                <circle cx={x + 1.8} cy={y + 1} r={1.8} fill={V.fetal} />
              </g>
              <g opacity={vessels}>
                <ellipse cx={x} cy={y} rx={lerp(4, rx, vessels) + 2} ry={lerp(4, ry, vessels) + 2} fill={V.endothelium} />
                <ellipse cx={x} cy={y} rx={lerp(3, rx, vessels)} ry={lerp(3, ry, vessels)} fill={V.fetal} />
              </g>
            </g>
          ))}
        </Part>
      )}
    </g>
  );
}

export function VilliTransverse({ t, reduced }: SceneProps) {
  const g = geometry(t);
  // The third section appears with the blood islands (a secondary villus turning tertiary); its name waits for the vessels.
  const show = [1, seg(t, W.meso[0], W.meso[0] + 0.08), seg(t, W.islands[0], W.islands[0] + 0.06)];
  const named = [1, show[1], seg(t, W.vessels[0], W.vessels[0] + 0.08)];
  const xs = [300, 500, 700];
  const ids = ['biloxka-primarioa', 'biloxka-sekundarioa', 'biloxka-tertziarioa'];
  const days = ['13. eguna', '3. astearen hasiera–erdia', '3. astearen amaiera'];
  const vessel = clamp((g.vessels - 0.02) / 0.08);
  const ivsShow = seg(t, 0.68, 0.78);
  const lakunaShow = 1 - ivsShow;
  return (
    <g>
      <VilliDefs />
      <Part id="lakuak" quiet show={lakunaShow}>
        <rect x={200} y={170} width={600} height={260} rx={40} fill="url(#w3v-mblood)" opacity={0.28} />
      </Part>
      <Part id="biloxka-arteko-espazioa" quiet show={ivsShow}>
        <rect x={200} y={170} width={600} height={260} rx={40} fill="url(#w3v-mblood)" opacity={0.28} />
      </Part>
      {!reduced && <Flow d="M215,300 C300,180 700,180 785,300" n={8} dur={10} r={2.2} color="#ff6b81" />}
      {xs.map((x, i) => (
        <g key={i} opacity={show[i]}>
          <Section cx={x} kind={i as 0 | 1 | 2} t={t} />
        </g>
      ))}
      {ids.map((id, i) => (
        <Part key={id} id={id} show={named[i]}>
          <circle cx={xs[i]} cy={SEC_Y} r={SEC_R + 8} fill="none" stroke="#e8eefc" strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
        </Part>
      ))}
      {ids.map((id, i) => (
        <Label key={id} id={id} x={xs[i]} y={SEC_Y + SEC_R + 36} align="middle" show={named[i]} />
      ))}
      {days.map((d, i) => (
        <Note key={d} x={xs[i]} y={SEC_Y + SEC_R + 60} show={named[i]}>
          {d}
        </Note>
      ))}
      <Label id="sinzitiotrofoblastoa" x={190} y={200} ax={300 - (SEC_R - 6) * 0.7071} ay={SEC_Y - (SEC_R - 6) * 0.7071} />
      <Label id="zitotrofoblastoa" x={190} y={410} ax={280} ay={SEC_Y + 24} />
      <Label id="enbrioi-kanpoko-mesodermoa" x={500} y={150} ax={500} ay={SEC_Y - 20} align="middle" show={clamp((g.meso - 0.4) / 0.1) * show[1]} text="Kanpoko mesodermoa" />
      <Label id="biloxka-kapilarrak" x={810} y={400} ax={722} ay={SEC_Y + 18} show={Math.max(vessel, g.islands) * show[2]} text="Biloxka kapilarrak" />
      <Label id="lakuak" x={810} y={500} ax={770} ay={400} small show={lakunaShow} />
      <Label id="biloxka-arteko-espazioa" x={810} y={500} ax={770} ay={400} small show={ivsShow} />
    </g>
  );
}
