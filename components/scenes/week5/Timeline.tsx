'use client';

import { Label, Mark, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';

/**
 * Stage `iraupena`: the two ways of counting a pregnancy on ONE true time axis. Counted from
 * the last menstrual period it lasts 40 weeks (280 days); from fertilization, 38 weeks
 * (266 days). The ~14-day offset is the gap between the period and ovulation/fertilization.
 * Stage `azken-hilabeteak`, view `gertaerak`: the fetal functional milestones, by week.
 */

// ---------------------------------------------------------------------------
// PregnancyTimeline
// ---------------------------------------------------------------------------

const DMAX = 296; // days after the LMP shown; room past day 280 for "berantiarra"
const TX0 = 110;
const TX1 = 880;
const X = (d: number) => TX0 + (d / DMAX) * (TX1 - TX0);
const RA = 226; // row: from the last menstrual period
const RB = 396; // row: from fertilization
const DUE = X(280);
const FERT = X(14);

const EMB_C = '#f09a8a';
const FET_C = '#8fb4f7';
const LMP_C = '#d9d3c7';

function Ticks({ y, from, weeks }: { y: number; from: number; weeks: number }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: weeks + 1 }, (_, w) => {
        const x = X(from + w * 7);
        const major = w % 4 === 0 || w === weeks;
        return (
          <g key={w}>
            <line x1={x} x2={x} y1={y + 12} y2={y + (major ? 20 : 16)} stroke="rgba(255,255,255,0.3)" />
            {major && (
              <text x={x} y={y + 34} textAnchor="middle" fill="#7c7870" fontSize={10.5} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {w}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Bar({ y, x0, x1, color, h = 12, opacity = 1 }: { y: number; x0: number; x1: number; color: string; h?: number; opacity?: number }) {
  if (x1 - x0 < 1) return null;
  return <rect x={x0} y={y - h / 2} width={x1 - x0} height={h} rx={h / 2} fill={color} opacity={opacity} />;
}

function Stat({ x, y, big, small, show, color }: { x: number; y: number; big: string; small: string; show: number; color: string }) {
  return (
    <g opacity={show} pointerEvents="none">
      <text x={x} y={y} textAnchor="end" fill="#f1eee8" fontSize={24} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {big}
      </text>
      <text x={x} y={y + 20} textAnchor="end" fill={color} fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        {small}
      </text>
    </g>
  );
}

export function PregnancyTimeline({ t }: SceneProps) {
  const due = 1;
  const growA = seg(t, 0.2, 0.34);
  const growB = seg(t, 0.42, 0.56);
  const gap = seg(t, 0.44, 0.5);
  const phases = seg(t, 0.62, 0.68);
  const early = seg(t, 0.8, 0.86);
  const endA = lerp(X(0), DUE, growA);
  const endB = lerp(FERT, DUE, growB);
  const embA = X(14 + 14);
  const embB = X(14 + 56);
  return (
    <g>
      {/* Due date: one line through both counts. */}
      <Part id="erditze-data" show={due}>
        <line x1={DUE} x2={DUE} y1={116} y2={506} stroke="#ff8a7a" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.85} />
        <circle cx={DUE} cy={116} r={5} fill="#ff8a7a" />
      </Part>
      <Label id="erditze-data" x={DUE - 14} y={116} align="end" />
      <Note x={(TX0 + DUE) / 2} y={312} tone="accent" show={1 - seg(t, 0.18, 0.2)}>
        Erditze-data jakin → haurdunaldia eta fetuaren garapena kontrolatu · batez ere arrisku handiko haurdunaldietan
      </Note>

      {/* Row A: from the last menstrual period. */}
      <line x1={X(0)} x2={X(DMAX)} y1={RA} y2={RA} stroke="rgba(255,255,255,0.1)" strokeWidth={12} strokeLinecap="round" />
      <Part id="azken-hilekoa">
        <Bar y={RA} x0={X(0)} x1={endA} color={LMP_C} opacity={0.85} />
        <circle cx={X(0)} cy={RA} r={7} fill="#0c1220" stroke={LMP_C} strokeWidth={2.4} />
      </Part>
      <Ticks y={RA} from={0} weeks={40} />
      <Label id="azken-hilekoa" text="Azken hilekotik" x={X(0)} y={RA - 36} align="start" />
      <g opacity={growA} pointerEvents="none">
        <rect x={X(0) + 124} y={RA - 46} width={122} height={20} rx={10} fill="rgba(143,180,247,0.14)" />
        <text x={X(0) + 185} y={RA - 36} dy="0.35em" textAnchor="middle" fill={FET_C} fontSize={11} fontWeight={600}>
          Askoz zehatzagoa
        </text>
      </g>
      <Stat x={DUE - 14} y={RA - 44} big="40 aste · 280 egun" small="" show={growA} color={LMP_C} />

      {/* The ~14-day offset between the two counts. */}
      <g opacity={gap} pointerEvents="none">
        <line x1={FERT} x2={FERT} y1={RA + 8} y2={RB - 8} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" />
        <path d={`M${X(0)},${RA + 48} v6 H${FERT} v-6`} fill="none" stroke="#ffb86b" strokeWidth={1.5} />
        <text x={(X(0) + FERT) / 2} y={RA + 72} textAnchor="middle" fill="#ffb86b" fontSize={12} fontWeight={600}>
          ~14 egun
        </text>
      </g>

      {/* Row B: from fertilization, with the embryonic and fetal periods. */}
      <line x1={FERT} x2={X(DMAX)} y1={RB} y2={RB} stroke="rgba(255,255,255,0.1)" strokeWidth={12} strokeLinecap="round" opacity={gap} />
      <Part id="ernalkuntza" show={Math.max(gap, 0.02)}>
        <Bar y={RB} x0={FERT} x1={endB} color="#ffb86b" opacity={0.85 * (1 - phases)} />
        <circle cx={FERT} cy={RB} r={7} fill="#0c1220" stroke="#ffb86b" strokeWidth={2.4} opacity={gap} />
      </Part>
      {phases > 0.01 && (
        <g opacity={phases}>
          <Bar y={RB} x0={FERT} x1={embA} color="rgba(255,255,255,0.28)" />
          <Part id="enbrioi-aroa">
            <Bar y={RB} x0={embA} x1={embB} color={EMB_C} />
          </Part>
          <Part id="fetu-aroa">
            <Bar y={RB} x0={embB} x1={DUE} color={FET_C} />
          </Part>
        </g>
      )}
      <g opacity={gap}>
        <Ticks y={RB} from={14} weeks={38} />
      </g>
      <Label id="ernalkuntza" text="Ernalkuntzatik" x={FERT} y={RB - 36} align="start" show={gap} />
      <Stat x={DUE - 14} y={RB - 44} big="38 aste · 266 egun" small="" show={growB} color="#ffb86b" />
      <Label id="enbrioi-aroa" text="Enbrioi aroa · 3.–8. asteak" x={250} y={RB + 70} ax={(embA + embB) / 2} ay={RB + 7} show={phases} />
      <Label id="fetu-aroa" text="Umeki edo fetu aroa · 9. astetik jaio arte" x={470} y={RB + 70} ax={lerp(embB, DUE, 0.35)} ay={RB + 7} align="start" show={phases} />

      <Note x={FERT} y={RB + 112} align="start" tone="dim" show={seg(t, 0.46, 0.52)}>
        Ernalkuntza-data zaila: obulazioa aldakorra da; espermatozoideak 6 egunez mantentzen dira
      </Note>

      {/* Born earlier / later than expected. */}
      <Mark id="goiztiarra" show={early}>
        <g>
          <rect x={DUE - 104} y={526} width={100} height={28} rx={8} fill="#ff8a7a" fillOpacity={0.1} />
          <path d={`M${DUE - 8},${540} H${DUE - 70}`} stroke="#ff8a7a" strokeWidth={1.8} />
          <path d={`M${DUE - 70},${540} l8,-5 v10z`} fill="#ff8a7a" />
        </g>
      </Mark>
      <Mark id="berantiarra" show={early}>
        <g>
          <rect x={DUE + 4} y={526} width={48} height={28} rx={8} fill="#ff8a7a" fillOpacity={0.1} />
          <path d={`M${DUE + 8},${540} H${DUE + 40}`} stroke="#ff8a7a" strokeWidth={1.8} />
          <path d={`M${DUE + 40},${540} l-8,-5 v10z`} fill="#ff8a7a" />
        </g>
      </Mark>
      <Label id="goiztiarra" text="Goiztiarra: lehenago" x={DUE - 80} y={540} align="end" show={early} />
      <Label id="berantiarra" x={DUE + 46} y={540} align="start" show={early} />

      <text x={TX0} y={606} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        Asteak · bi kontaketak denbora-ardatz berean
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// FetalMilestones
// ---------------------------------------------------------------------------

const MW0 = 4;
const MW1 = 40;
const MX0 = 360;
const MX1 = 900;
const XW = (w: number) => MX0 + ((w - MW0) / (MW1 - MW0)) * (MX1 - MX0);

const MILESTONES: { id: string; weeks: [number, number] }[] = [
  { id: 'mingainaren-papilak', weeks: [7, 7] },
  { id: 'degluzioa', weeks: [10, 10] },
  { id: 'arnasketa-mugimenduak', weeks: [14, 16] },
  { id: 'hurrupaketa-mugimenduak', weeks: [24, 24] },
  { id: 'entzumena', weeks: [24, 26] },
  { id: 'argi-sentikortasuna', weeks: [28, 28] },
];
const MROW0 = 128;
const MSTEP = 64;

export function FetalMilestones({ t }: SceneProps) {
  const w = lerp(MW0, 38, seg(t, 0.02, 0.9));
  const cx = XW(w);
  const bottom = MROW0 + (MILESTONES.length - 1) * MSTEP + 44;
  return (
    <g>
      {/* Week grid */}
      {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40].map((k) => (
        <g key={k}>
          <line x1={XW(k)} x2={XW(k)} y1={MROW0 - 40} y2={bottom} stroke="rgba(255,255,255,0.05)" />
          <text x={XW(k)} y={bottom + 20} textAnchor="middle" fill={Math.abs(k - w) < 1 ? '#f1eee8' : '#7c7870'} fontSize={10.5} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {k}
          </text>
        </g>
      ))}
      <line x1={MX0} x2={MX1} y1={bottom} y2={bottom} stroke="rgba(255,255,255,0.22)" />
      <text x={MX1} y={bottom + 42} textAnchor="end" fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        Adina · asteak
      </text>

      {/* Start of the fetal period */}
      <Part id="fetu-aroa">
        <rect x={XW(9)} y={MROW0 - 40} width={XW(MW1) - XW(9)} height={bottom - MROW0 + 40} fill="rgba(143,180,247,0.035)" />
        <line x1={XW(9)} x2={XW(9)} y1={MROW0 - 40} y2={bottom} stroke={FET_C} strokeOpacity={0.5} strokeDasharray="3 5" />
      </Part>
      <text x={XW(9) + 8} y={MROW0 - 48} fill={FET_C} fontSize={11} letterSpacing="0.1em" style={{ textTransform: 'uppercase' }}>
        9. astea · fetu aroa
      </text>

      {MILESTONES.map((m, i) => {
        const y = MROW0 + i * MSTEP;
        const on = seg(w, m.weeks[0] - 0.4, m.weeks[0] + 0.6);
        const range = m.weeks[1] > m.weeks[0];
        const x0 = XW(m.weeks[0]);
        const x1 = XW(m.weeks[1]);
        const txt = range ? `${m.weeks[0]}.–${m.weeks[1]}. asteak` : `${m.weeks[0]}. astea`;
        return (
          <g key={m.id}>
            <line x1={MX0} x2={MX1} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" />
            <Part id={m.id} show={Math.max(on, 0.02)}>
              <circle cx={x0} cy={y} r={16 * on} fill="#ffb86b" opacity={0.12} />
              {range ? (
                <rect x={x0 - 7} y={y - 7} width={(x1 - x0) * seg(w, m.weeks[0], m.weeks[1]) + 14} height={14} rx={7} fill="#ffb86b" opacity={on} />
              ) : (
                <circle cx={x0} cy={y} r={7} fill="#ffb86b" opacity={on} />
              )}
            </Part>
            <text x={x1 + 16} y={y} dy="0.35em" fill="#f1eee8" fontSize={12.5} fontWeight={600} opacity={on} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {txt}
            </text>
            <Label id={m.id} x={MX0 - 24} y={y} align="end" show={0.35 + 0.65 * on} />
          </g>
        );
      })}

      {/* Sweeping cursor */}
      <line x1={cx} x2={cx} y1={MROW0 - 30} y2={bottom} stroke="rgba(255,255,255,0.35)" strokeDasharray="2 4" pointerEvents="none" />
      <g pointerEvents="none">
        <text x={40} y={572} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
          Fetuaren adina
        </text>
        <text x={40} y={606} fill="#f1eee8" fontSize={30} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(w)}
          <tspan fill="#b4afa6" fontSize={16} fontWeight={500} dx={2}>
            . astea
          </tspan>
        </text>
      </g>
    </g>
  );
}
