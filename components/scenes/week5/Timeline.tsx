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
const TX0 = 120;
const TX1 = 880;
const X = (d: number) => TX0 + (d / DMAX) * (TX1 - TX0);
const RA = 182; // row: from the last menstrual period
const RB = 362; // row: from fertilization
const RC = 516; // row: birth earlier / later than expected
const DUE = X(280);
const FERT = X(14);

const EMB_C = '#f09a8a';
const FET_C = '#8fb4f7';
const LMP_C = '#e6dccb';
const FERT_C = '#ffb86b';
const BIRTH_C = '#ff8a7a';

/** Week ticks under a row; week numbers count from that row's own start. */
function Ticks({ y, from, weeks, show = 1, hot }: { y: number; from: number; weeks: number; show?: number; hot?: number }) {
  return (
    <g pointerEvents="none" opacity={show}>
      {Array.from({ length: weeks + 1 }, (_, w) => {
        const x = X(from + w * 7);
        const major = w % 4 === 0 || w === weeks;
        const isHot = hot !== undefined && Math.abs(from + w * 7 - hot) < 3.5;
        return (
          <g key={w}>
            <line x1={x} x2={x} y1={y + 13} y2={y + (major ? 22 : 17)} stroke={major ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.2)'} />
            {major && (
              <text x={x} y={y + 37} textAnchor="middle" fill={isHot ? '#f1eee8' : '#8b867d'} fontSize={11.5} fontWeight={isHot ? 650 : 500} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {w}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Bar({ y, x0, x1, color, h = 16, opacity = 1 }: { y: number; x0: number; x1: number; color: string; h?: number; opacity?: number }) {
  if (x1 - x0 < 1) return null;
  return <rect x={x0} y={y - h / 2} width={x1 - x0} height={h} rx={h / 2} fill={color} opacity={opacity} />;
}

/** The running count, riding on the bar's leading edge while it grows, parked at the due date after. */
function Counter({ x, min, y, days, color, show }: { x: number; min: number; y: number; days: number; color: string; show: number }) {
  if (show < 0.02) return null;
  const d = Math.round(days);
  const wk = Math.floor(days / 7);
  // Just ahead of the growing edge, clear of the row's name on the left, parked against the due date at the end.
  const xx = Math.min(Math.max(x + 16, min), DUE - 178);
  return (
    <g opacity={show} pointerEvents="none">
      <text x={xx} y={y} textAnchor="start" fill="#f6f2ea" fontSize={26} fontWeight={650} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {d}
        <tspan fill="#b4afa6" fontSize={14} fontWeight={500} dx={4}>
          egun
        </tspan>
        <tspan fill={color} fontSize={18} fontWeight={650} dx={12}>
          {wk}
        </tspan>
        <tspan fill="#b4afa6" fontSize={14} fontWeight={500} dx={4}>
          aste
        </tspan>
      </text>
    </g>
  );
}

/** Soft light at a growing bar's leading edge. */
const Edge = ({ x, y, color, show }: { x: number; y: number; color: string; show: number }) =>
  show > 0.02 ? (
    <g pointerEvents="none" opacity={show}>
      <circle cx={x} cy={y} r={15} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={6} fill="#fff8ee" />
    </g>
  ) : null;

const smooth = (k: number) => k * k * (3 - 2 * k);

export function PregnancyTimeline({ t }: SceneProps) {
  const intro = 1 - seg(t, 0.18, 0.21);
  const pin = seg(t, 0.02, 0.09);
  const growA = seg(t, 0.215, 0.335, smooth);
  const showA = seg(t, 0.2, 0.23);
  const gap = seg(t, 0.43, 0.47);
  const growB = seg(t, 0.47, 0.565, smooth);
  const diff = seg(t, 0.565, 0.585);
  const phases = seg(t, 0.62, 0.67);
  const early = seg(t, 0.8, 0.85);
  const endA = lerp(X(0), DUE, growA);
  const endB = lerp(FERT, DUE, growB);
  const embA = X(14 + 14);
  const embB = X(14 + 56);
  const growingA = growA > 0 && growA < 1 ? 1 : 0;
  const growingB = growB > 0 && growB < 1 ? 1 : 0;

  return (
    <g>
      {/* Due date: one solid line through every count, its pin at the top. */}
      <Part id="erditze-data" show={pin}>
        <line x1={DUE} x2={DUE} y1={lerp(112, 98, pin)} y2={RC - 22} stroke={BIRTH_C} strokeWidth={1.6} opacity={0.75} />
        <circle cx={DUE} cy={lerp(80, 98, pin)} r={7} fill={BIRTH_C} />
        <circle cx={DUE} cy={lerp(80, 98, pin)} r={14} fill={BIRTH_C} opacity={0.18} />
      </Part>
      <Label id="erditze-data" x={DUE - 22} y={98} align="end" show={pin} />
      <Note x={500} y={458} tone="accent" size={16} show={intro * seg(t, 0.06, 0.1)}>
        Erditze-data jakin → haurdunaldia eta fetuaren garapena kontrolatu
      </Note>
      <Note x={500} y={486} size={14} show={intro * seg(t, 0.08, 0.12)}>
        batez ere arrisku handiko haurdunaldietan
      </Note>

      {/* Row A: from the last menstrual period (week 0 = first day of the period). */}
      <line x1={X(0)} x2={X(DMAX)} y1={RA} y2={RA} stroke="rgba(255,255,255,0.08)" strokeWidth={16} strokeLinecap="round" />
      <Part id="azken-hilekoa" show={Math.max(showA, 0.3)}>
        <Bar y={RA} x0={X(0)} x1={endA} color={LMP_C} opacity={lerp(0.92, 0.55, phases)} />
        <circle cx={X(0)} cy={RA} r={8} fill="#0c1220" stroke={LMP_C} strokeWidth={2.6} />
      </Part>
      {phases > 0.01 && (
        <g opacity={phases * 0.45} pointerEvents="none">
          <Bar y={RA} x0={embA} x1={embB} color={EMB_C} h={6} />
          <Bar y={RA} x0={embB} x1={DUE} color={FET_C} h={6} />
        </g>
      )}
      <Ticks y={RA} from={0} weeks={40} hot={growingA ? lerp(0, 280, growA) : undefined} />
      <Label id="azken-hilekoa" text="Azken hilekotik" x={X(0) - 6} y={RA - 38} align="start" />
      <g opacity={showA} pointerEvents="none">
        <rect x={X(0) + 132} y={RA - 49} width={132} height={22} rx={11} fill="rgba(143,180,247,0.16)" stroke="rgba(143,180,247,0.35)" />
        <text x={X(0) + 198} y={RA - 38} dy="0.35em" textAnchor="middle" fill={FET_C} fontSize={12} fontWeight={650}>
          Askoz zehatzagoa
        </text>
      </g>
      <Edge x={endA} y={RA} color={LMP_C} show={showA * growingA} />
      <Counter x={endA} min={X(0) + 284} y={RA - 30} days={lerp(0, 280, growA)} color={LMP_C} show={showA} />

      {/* The ~14 days between the period and ovulation/fertilization: the gap between the two counts. */}
      <g opacity={gap} pointerEvents="none">
        <line x1={FERT} x2={FERT} y1={RA + 10} y2={RB - 54} stroke="rgba(255,184,107,0.55)" strokeWidth={1.4} />
        <path d={`M${X(0) + 1},${RA + 58} v-6 H${FERT - 1} v6`} fill="none" stroke={FERT_C} strokeWidth={1.6} />
        <text x={FERT + 10} y={RA + 62} fill={FERT_C} fontSize={15} fontWeight={700}>
          ~14 egun
          <tspan fill="#b4afa6" fontSize={12.5} fontWeight={500} dx={10}>
            hilekoaren hasieratik obulaziora (ernalkuntza)
          </tspan>
        </text>
      </g>
      <Note x={FERT + 10} y={RA + 92} align="start" tone="accent" size={14} show={diff}>
        280 − 266 = 14 egun: bi kontaketen arteko aldea
      </Note>

      {/* Row B: from fertilization, with the embryonic and fetal periods. */}
      {/* First step: the second count's empty track is already laid out under the first (one axis, two counts). */}
      <line x1={FERT} x2={X(DMAX)} y1={RB} y2={RB} stroke="rgba(255,255,255,0.08)" strokeWidth={16} strokeLinecap="round" opacity={Math.max(gap, 0.7 * intro * pin)} />
      <Part id="ernalkuntza" show={Math.max(gap, 0.02)}>
        <Bar y={RB} x0={FERT} x1={endB} color={FERT_C} opacity={0.9 * (1 - phases)} />
        <circle cx={FERT} cy={RB} r={8} fill="#0c1220" stroke={FERT_C} strokeWidth={2.6} opacity={gap} />
      </Part>
      {phases > 0.01 && (
        <g opacity={phases}>
          <Bar y={RB} x0={FERT} x1={embA} color="rgba(255,255,255,0.3)" />
          <Part id="enbrioi-aroa">
            <Bar y={RB} x0={embA} x1={embB} color={EMB_C} />
          </Part>
          <Part id="fetu-aroa">
            <Bar y={RB} x0={embB} x1={DUE} color={FET_C} />
          </Part>
          {/* Boundaries: end of week 2 and end of week 8. */}
          {[embA, embB].map((x, i) => (
            <line key={i} x1={x} x2={x} y1={RB - 9} y2={RB + 9} stroke="#0c1220" strokeWidth={2.4} />
          ))}
          <text x={(FERT + embA) / 2} y={RB - 16} textAnchor="middle" fill="#8b867d" fontSize={11}>
            1.–2.
          </text>
        </g>
      )}
      <Ticks y={RB} from={14} weeks={38} show={Math.max(gap, 0.45 * intro * pin)} hot={growingB ? lerp(14, 280, growB) : undefined} />
      <Label id="ernalkuntza" text="Ernalkuntzatik" x={FERT - 6} y={RB - 38} align="start" show={gap} />
      <Edge x={endB} y={RB} color={FERT_C} show={gap * growingB} />
      <Counter x={endB} min={FERT + 140} y={RB - 30} days={lerp(0, 266, growB)} color={FERT_C} show={gap * seg(t, 0.47, 0.49)} />
      <Label id="enbrioi-aroa" text="Enbrioi aroa · 3.–8. asteak" x={(embA + embB) / 2 + 30} y={RB + 70} align="middle" ax={(embA + embB) / 2} ay={RB + 8} show={phases} />
      <Label id="fetu-aroa" text="Umeki edo fetu aroa · 9. astetik jaio arte" x={lerp(embB, DUE, 0.55)} y={RB + 70} align="middle" ax={lerp(embB, DUE, 0.55)} ay={RB + 8} show={phases} />

      <Note x={FERT} y={RB + 64} align="start" tone="dim" size={13} show={seg(t, 0.5, 0.54) * (1 - phases)}>
        Ernalkuntza-data zaila: obulazioa aldakorra da; espermatozoideak 6 egunez mantentzen dira
      </Note>

      {/* Row C: born earlier or later than the expected date. */}
      <defs>
        <linearGradient id="w5t-early" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor={BIRTH_C} stopOpacity="0.55" />
          <stop offset="1" stopColor={BIRTH_C} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="w5t-late" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={BIRTH_C} stopOpacity="0.55" />
          <stop offset="1" stopColor={BIRTH_C} stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x={TX0} y={RC + 4} fill="#8b867d" fontSize={11} letterSpacing="0.12em" opacity={early} style={{ textTransform: 'uppercase' }} pointerEvents="none">
        Jaiotza
      </text>
      <Mark id="goiztiarra" show={early}>
        <g>
          <rect x={X(224)} y={RC - 9} width={DUE - X(224) - 6} height={18} rx={9} fill="url(#w5t-early)" />
          <path d={`M${DUE - 10},${RC} H${X(236)}`} stroke={BIRTH_C} strokeWidth={2} strokeLinecap="round" />
          <path d={`M${X(236) - 2},${RC} l10,-6 v12z`} fill={BIRTH_C} />
        </g>
      </Mark>
      <Mark id="berantiarra" show={early}>
        <g>
          <rect x={DUE + 6} y={RC - 9} width={X(DMAX) - DUE - 6} height={18} rx={9} fill="url(#w5t-late)" />
          <path d={`M${DUE + 10},${RC} H${X(292)}`} stroke={BIRTH_C} strokeWidth={2} strokeLinecap="round" />
          <path d={`M${X(292) + 2},${RC} l-10,-6 v12z`} fill={BIRTH_C} />
        </g>
      </Mark>
      <Label id="goiztiarra" text="Goiztiarra: lehenago" x={X(222) - 8} y={RC} align="end" show={early} />
      <Label id="berantiarra" x={DUE + 20} y={RC + 34} align="start" ax={X(288)} ay={RC + 8} show={early} />

      <text x={TX0} y={588} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }} pointerEvents="none">
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
  // The sweep reaches the first milestones within seconds and the whole table by 60 %, then holds.
  const w = lerp(MW0, 38, seg(t, 0, 0.6, (k) => k));
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
        <line x1={XW(9)} x2={XW(9)} y1={MROW0 - 40} y2={bottom} stroke={FET_C} strokeOpacity={0.55} strokeWidth={1.4} />
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
      <line x1={cx} x2={cx} y1={MROW0 - 30} y2={bottom} stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} pointerEvents="none" />
      <circle cx={cx} cy={bottom} r={6} fill="#f1eee8" stroke="#1b1916" strokeWidth={2} pointerEvents="none" />
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
