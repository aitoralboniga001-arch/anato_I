'use client';

import { Label, Note, Part, lerp, seg, type SceneProps } from '@/components/kit';
import { LEN, ROWS, WT, fmtWeight, interp } from './growth';

/**
 * The notes' length/weight table as two stacked charts on one week axis: crown–rump length on
 * top, weight below. A cursor sweeps the weeks of the stage so the contrast reads at a glance:
 * months 3–5 are mostly LENGTH, months 6–9 mostly WEIGHT.
 */

const X0 = 120;
const X1 = 868;
const W0 = 9;
const W1 = 38;
const xw = (w: number) => X0 + ((w - W0) / (W1 - W0)) * (X1 - X0);

const LEN_C = '#8fb4f7';
const WT_C = '#ffb86b';

interface Panel {
  top: number;
  bottom: number;
  max: number;
  ticks: number[];
  tab: [number, number][];
  range: (r: (typeof ROWS)[number]) => [number, number];
  color: string;
  title: string;
  fmt: (v: number) => string;
}

const P_LEN: Panel = {
  top: 96,
  bottom: 288,
  max: 40,
  ticks: [10, 20, 30, 40],
  tab: LEN,
  range: (r) => r.len,
  color: LEN_C,
  title: 'Luzera zefalokaudala · cm',
  fmt: (v) => `${v}`,
};
const P_WT: Panel = {
  top: 344,
  bottom: 536,
  max: 3500,
  ticks: [1000, 2000, 3000],
  tab: WT,
  range: (r) => r.wt,
  color: WT_C,
  title: 'Pisua · g',
  fmt: (v) => (v >= 1000 ? `${v / 1000} kg` : `${v}`),
};

const yOf = (p: Panel, v: number) => p.bottom - (v / p.max) * (p.bottom - p.top);

/** Smooth-ish polyline through the table, sampled every quarter week. */
function curve(p: Panel, a: number, b: number) {
  const pts: string[] = [];
  for (let w = a; w <= b + 1e-6; w += 0.25) pts.push(`${xw(w).toFixed(1)},${yOf(p, interp(p.tab, w)).toFixed(1)}`);
  return pts;
}

function Chart({ p, upTo, id, dim }: { p: Panel; upTo: number; id: string; dim: [number, number] }) {
  const full = curve(p, W0, W1);
  const done = curve(p, W0, Math.max(W0 + 0.25, upTo));
  const gid = `gc-${id}`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.color} stopOpacity="0.28" />
          <stop offset="1" stopColor={p.color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* grid */}
      {p.ticks.map((v) => (
        <g key={v}>
          <line x1={X0} x2={X1} y1={yOf(p, v)} y2={yOf(p, v)} stroke="rgba(255,255,255,0.06)" />
          <text x={X0 - 10} y={yOf(p, v)} dy="0.35em" textAnchor="end" fill="#7c7870" fontSize={10.5} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {p.fmt(v)}
          </text>
        </g>
      ))}
      <line x1={X0} x2={X1} y1={p.bottom} y2={p.bottom} stroke="rgba(255,255,255,0.22)" />
      <text x={X0} y={p.top - 14} fill="#b4afa6" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        {p.title}
      </text>

      {/* table rows: min–max range of each band */}
      {ROWS.map((r) => {
        const [lo, hi] = p.range(r);
        const inFocus = r.w[1] >= dim[0] && r.w[0] <= dim[1];
        return (
          <rect
            key={r.w[0]}
            x={xw(r.w[0] - 0.4)}
            width={xw(r.w[1] + 0.4) - xw(r.w[0] - 0.4)}
            y={yOf(p, hi) - 3}
            height={Math.max(4, yOf(p, lo) - yOf(p, hi) + 6)}
            rx={4}
            fill={p.color}
            opacity={inFocus ? 0.14 : 0.06}
          />
        );
      })}

      {/* the whole course, faint; the part reached so far, solid with an area fill */}
      <polyline points={full.join(' ')} fill="none" stroke={p.color} strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 5" />
      <Part id={id}>
        <path d={`M${xw(W0)},${p.bottom} L${done.join(' L')} L${done[done.length - 1].split(',')[0]},${p.bottom}Z`} fill={`url(#${gid})`} />
        <polyline points={done.join(' ')} fill="none" stroke={p.color} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
      </Part>
    </g>
  );
}

function Cursor({ w }: { w: number }) {
  const x = xw(w);
  const len = interp(LEN, w);
  const wt = interp(WT, w);
  // Tags quote the table row (a range), exactly as the notes give it.
  const row = ROWS.find((r) => w <= r.w[1] + 0.5) ?? ROWS[ROWS.length - 1];
  const kg = row.wt[0] >= 1000;
  const wtText = kg ? `${fmtWeight(row.wt[0])[0]}–${fmtWeight(row.wt[1])[0]} kg` : `${row.wt[0]}–${row.wt[1]} g`;
  const tag = (y: number, text: string, color: string) => {
    const right = x < X1 - 120;
    return (
      <g>
        <circle cx={x} cy={y} r={5.5} fill="#0c1220" stroke={color} strokeWidth={2.4} />
        <text x={x + (right ? 12 : -12)} y={y - 12} textAnchor={right ? 'start' : 'end'} fill="#f1eee8" fontSize={15} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {text}
        </text>
      </g>
    );
  };
  return (
    <g pointerEvents="none">
      <line x1={x} x2={x} y1={P_LEN.top - 4} y2={P_WT.bottom} stroke="rgba(255,255,255,0.28)" strokeDasharray="2 4" />
      {tag(yOf(P_LEN, len), `${row.len[0]}–${row.len[1]} cm`, LEN_C)}
      {tag(yOf(P_WT, wt), wtText, WT_C)}
    </g>
  );
}

function WeekAxis({ w }: { w: number }) {
  const ticks = [9, 12, 16, 20, 24, 28, 32, 36, 38];
  return (
    <g>
      {ticks.map((k) => (
        <g key={k}>
          <line x1={xw(k)} x2={xw(k)} y1={P_WT.bottom} y2={P_WT.bottom + 5} stroke="rgba(255,255,255,0.3)" />
          <text x={xw(k)} y={P_WT.bottom + 20} textAnchor="middle" fill={Math.abs(k - w) < 0.5 ? '#f1eee8' : '#7c7870'} fontSize={10.5} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {k}
          </text>
        </g>
      ))}
      <text x={X1} y={P_WT.bottom + 40} textAnchor="end" fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        Adina · asteak
      </text>
    </g>
  );
}

/** Background band marking the months the stage is about. */
function Focus({ a, b, text }: { a: number; b: number; text: string }) {
  return (
    <g pointerEvents="none">
      <rect x={xw(a - 0.5)} y={P_LEN.top - 30} width={xw(b + 0.5) - xw(a - 0.5)} height={P_WT.bottom - P_LEN.top + 30} rx={10} fill="rgba(255,255,255,0.028)" />
      <text x={(xw(a - 0.5) + xw(b + 0.5)) / 2} y={P_LEN.top - 40} textAnchor="middle" fill="#f1eee8" fontSize={13} fontWeight={600}>
        {text}
      </text>
    </g>
  );
}

function WeekTag({ w }: { w: number }) {
  return (
    <g pointerEvents="none">
      <text x={40} y={572} fill="#7c7870" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
        Fetuaren adina
      </text>
      <text x={40} y={606} fill="#f1eee8" fontSize={30} fontWeight={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(w)}
        <tspan fill="#b4afa6" fontSize={16} fontWeight={500} dx={2}>
          . astea
        </tspan>
      </text>
    </g>
  );
}

/** Stage `laugarren-bosgarren`: weeks 9 → 20, mostly length. */
export function GrowthChartLength({ t }: SceneProps) {
  const w = lerp(9, 20, seg(t, 0.02, 0.28));
  const callout = seg(t, 0.28, 0.33);
  return (
    <g>
      <Focus a={13} b={20} text="4. eta 5. hilabeteak" />
      <Chart p={P_LEN} upTo={w} id="luzera-zefalokaudala" dim={[13, 20]} />
      <Chart p={P_WT} upTo={w} id="fetuaren-pisua" dim={[13, 20]} />
      <WeekAxis w={w} />
      <Cursor w={w} />
      <Label id="luzera-zefalokaudala" x={150} y={150} ax={xw(12)} ay={yOf(P_LEN, 8)} align="start" />
      <Label id="fetuaren-pisua" x={150} y={410} ax={xw(15)} ay={yOf(P_WT, 150)} align="start" />
      <Note x={xw(29)} y={yOf(P_LEN, 36) - 2} tone="accent" show={callout}>
        ~15 cm: jaioberriaren luzeraren ia erdia
      </Note>
      <Note x={xw(29)} y={yOf(P_WT, 3000) - 2} tone="accent" show={callout}>
        Pisua, ordea: ~500 g baino ez
      </Note>
      <WeekTag w={w} />
    </g>
  );
}

/** Stage `azken-hilabeteak`: weeks 21 → 38, mostly weight (above all the last two months). */
export function GrowthChartWeight({ t }: SceneProps) {
  const w = lerp(20, 38, seg(t, 0.02, 0.84));
  const last2 = seg(t, 0.56, 0.62);
  const birth = seg(t, 0.86, 0.9);
  return (
    <g>
      <Focus a={21} b={38} text="6.–9. hilabeteak" />
      {last2 > 0.02 && (
        <Part id="gantz-metaketa" show={last2}>
          <rect x={xw(30.5)} y={P_WT.top - 6} width={xw(38.5) - xw(30.5)} height={P_WT.bottom - P_WT.top + 6} rx={8} fill="rgba(255,184,107,0.08)" stroke="rgba(255,184,107,0.35)" strokeDasharray="4 5" />
        </Part>
      )}
      <Chart p={P_LEN} upTo={w} id="luzera-zefalokaudala" dim={[21, 38]} />
      <Chart p={P_WT} upTo={w} id="fetuaren-pisua" dim={[21, 38]} />
      <WeekAxis w={w} />
      <Cursor w={w} />
      <Label id="luzera-zefalokaudala" x={150} y={150} ax={xw(14)} ay={yOf(P_LEN, 11)} align="start" />
      <Label id="fetuaren-pisua" x={150} y={410} ax={xw(24)} ay={yOf(P_WT, 820)} align="start" />
      <Label id="gantz-metaketa" text="Azken bi hilabeteak: gantza" x={440} y={372} ax={xw(31)} ay={yOf(P_WT, 1800)} show={last2} />
      <Note x={xw(20)} y={yOf(P_LEN, 36) - 2} tone="accent" show={birth}>
        Jaiotzean: 3–3,4 kg · ~36 cm · vertex–orpo 40–50 cm
      </Note>
      <WeekTag w={w} />
    </g>
  );
}
