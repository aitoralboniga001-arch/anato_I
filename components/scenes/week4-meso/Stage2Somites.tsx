'use client';

import { C, Label, Note, Part, fade, lerp, lin, seg, zoom, type SceneProps } from '@/components/kit';
import { SOMITE_REGIONS, TOTAL_SOMITES, buildSomites } from './common';

/**
 * `somitak` — somitomeres appear first, cranially (they never fully segment into somites); from
 * ~day 20 true somites bud off the paraxial mesoderm craniocaudally, ~3 pairs/day until the end
 * of week 5 (~day 35): 42-44 pairs total (4 occipital, 8 cervical, 12 thoracic, 5 lumbar, 5
 * sacral, 8-10 coccygeal). The first occipital pair and the last 5-7 coccygeal pairs normally
 * regress. Somite count is used clinically to estimate embryonic age (day ≈ 20 + (count-1)/3).
 */
const Y_TOP = 130;
const Y_BOT = 520;
const SOM_Y_TOP = Y_TOP + 62; // leaves room above for the (permanent, cranial) somitomeres
const SOMITES = buildSomites(SOM_Y_TOP, Y_BOT);

/** day(t): linear day-20..35 mapping so the somite count matches the notes' ~3 pairs/day rule. */
function dayFor(t: number) {
  return 20 + 15 * lin(t, 0, 0.92);
}
function countFor(day: number) {
  return Math.max(0, Math.min(TOTAL_SOMITES, Math.round(1 + 3 * (day - 20))));
}
/** t at which somite index i (0-based) first appears, inverting countFor. */
function appearT(index: number) {
  return index / 45; // matches count(t) = min(44, round(1 + 45t))
}

const REGION_STARTS = (() => {
  let idx = 0;
  return SOMITE_REGIONS.map((r) => {
    const start = idx;
    idx += r.n;
    return { ...r, start };
  });
})();

function BodyOutline({ t }: { t: number }) {
  const grow = seg(t, 0, 0.1);
  const halfW = lerp(48, 74, grow);
  const cap = 34;
  const top = Y_TOP + cap;
  const bot = Y_BOT - cap;
  return (
    <path
      d={`M${500 - halfW},${top}
          C${500 - halfW},${Y_TOP} ${500 + halfW},${Y_TOP} ${500 + halfW},${top}
          L${500 + halfW},${bot}
          C${500 + halfW},${Y_BOT} ${500 - halfW},${Y_BOT} ${500 - halfW},${bot}
          Z`}
      fill="#182238"
      stroke="#3a3a40"
      strokeWidth={1.4}
      opacity={0.9}
    />
  );
}

/** Cranial (permanent) somitomeres: sit ABOVE (cranial to) the first true somite, never overlapping it. */
function Somitomeres({ t: _t }: { t: number }) {
  // Already-present cranial anatomy at this stage's start (the beat-0 focus) — always fully shown,
  // not faded in, since a fade starting at t=0 would leave it invisible at the exact beat it stars in.
  void _t;
  const show = 1;
  const pts = Array.from({ length: 5 }, (_, i) => Y_TOP + 8 + i * 9);
  const gap = 20;
  return (
    <Part id="somitomeroak" show={show}>
      {pts.map((y, i) => (
        <g key={i}>
          <ellipse cx={500 - gap} cy={y} rx={9} ry={4} fill={C.mesoParaxial} opacity={0.65} />
          <ellipse cx={500 + gap} cy={y} rx={9} ry={4} fill={C.mesoParaxial} opacity={0.65} />
        </g>
      ))}
    </Part>
  );
}

function SomitePairs({ t, scale = 1, onlyFrom = 0, onlyTo = TOTAL_SOMITES }: { t: number; scale?: number; onlyFrom?: number; onlyTo?: number }) {
  const day = dayFor(t);
  const count = countFor(day);
  const disappear = seg(t, 0.8, 0.88);
  const gap = 22 * scale; // >= 22: keeps the neural tube (width 14, centred on x=500) visible between pairs
  const rx = 10 * scale; // <= 12
  const ry = 7 * scale;
  return (
    <Part id="somitak" quiet>
      {SOMITES.filter((s) => s.index >= onlyFrom && s.index < onlyTo).map((s) => {
        const a = fade(t, appearT(s.index), Infinity, 0.03);
        const show = s.index < count ? a * (s.transient ? 1 - disappear : 1) : 0;
        if (show <= 0.02) return null;
        return (
          <g key={s.index} opacity={show}>
            <ellipse cx={500 - gap} cy={s.y} rx={rx} ry={ry} fill={s.color} stroke="rgba(10,14,28,0.5)" strokeWidth={0.8} />
            <ellipse cx={500 + gap} cy={s.y} rx={rx} ry={ry} fill={s.color} stroke="rgba(10,14,28,0.5)" strokeWidth={0.8} />
          </g>
        );
      })}
    </Part>
  );
}

function NeuralAxis({ t }: { t: number }) {
  const grow = seg(t, 0, 0.1);
  return (
    <Part id="hodi-neurala" quiet>
      <rect x={493} y={Y_TOP} width={14} height={lerp(30, Y_BOT - Y_TOP, grow)} rx={7} fill={C.neural} opacity={0.55} />
    </Part>
  );
}

export function SomiteDorsal({ t }: SceneProps) {
  const day = dayFor(t);
  const count = countFor(day);
  const disappear = seg(t, 0.8, 0.88);
  const regressed = disappear > 0.15 ? Math.round(7 * disappear) : 0;
  // The body is a tall strip: magnify it so it fills the frame (labels keep their own size).
  const z = zoom(500, 325, 1.2, 500, 325);
  const at = (x: number, y: number) => z.at(x, y);
  return (
    <g>
      <g transform={z.transform}>
        <BodyOutline t={t} />
        <NeuralAxis t={t} />
        <Somitomeres t={t} />
        <SomitePairs t={t} />
      </g>
      <Note x={500} y={at(500, Y_TOP - 26)[1] + 4} tone="dim">Kraneala</Note>
      <Note x={500} y={at(500, Y_BOT + 30)[1]} tone="dim">Kaudala</Note>
      <g fontSize={15} fontWeight={700} fill="#e8eefc">
        <text x={700} y={78}>
          {Math.round(day)}. eguna · {count} / {TOTAL_SOMITES} bikote
        </text>
        {regressed > 0 && (
          <text x={700} y={100} fontSize={12} fontWeight={400} fill="#ffb3b3">
            {TOTAL_SOMITES - regressed}-{TOTAL_SOMITES} eratuak · {regressed} desagertzen
          </text>
        )}
      </g>
      <Label id="somitomeroak" x={190} y={150} ax={at(478, Y_TOP + 22)[0]} ay={at(478, Y_TOP + 22)[1]} show={1} />
      <Label id="somitak" x={190} y={280} ax={at(478, SOM_Y_TOP + 10)[0]} ay={at(478, SOM_Y_TOP + 10)[1]} show={fade(t, appearT(0), Infinity, 0.05)} />
      <Label id="hodi-neurala" x={810} y={200} ax={500} ay={at(500, Y_TOP + 90)[1]} small />
      {REGION_STARTS.map((r) => {
        const show = fade(t, appearT(r.start), Infinity, 0.05);
        const y0 = SOMITES[r.start]?.y ?? SOM_Y_TOP;
        const y1 = SOMITES[Math.min(r.start + r.n - 1, TOTAL_SOMITES - 1)]?.y ?? Y_BOT;
        return (
          <Note key={r.id} x={at(640, 0)[0]} y={at(0, (y0 + y1) / 2)[1]} tone="dim" size={13} show={show}>
            {`${r.n} ${r.id}`}
          </Note>
        );
      })}
    </g>
  );
}

/** Close-up on the caudal growth front: newest somites budding off the unsegmented paraxial mesoderm. */
export function SomiteBud({ t }: SceneProps) {
  const day = dayFor(t);
  const count = countFor(day);
  // Stay clear of the very tapering caudal tip so the paraxial block never pokes outside the outline.
  const frontIndex = Math.max(0, Math.min(TOTAL_SOMITES - 4, count - 1));
  const front = SOMITES[frontIndex] ?? SOMITES[0];
  const frontY = front.y;
  const nextY = SOMITES[Math.min(TOTAL_SOMITES - 1, frontIndex + 1)]?.y ?? frontY + 30;
  const spacing = Math.max(18, nextY - frontY);
  const z = zoom(500, frontY, 2.2, 500, 340);
  const gap = 22;
  const rx = 10;
  const ry = 7;
  const paraxTop = frontY - ry; // flush against the newest somite pair, no gap
  const paraxH = spacing * 2.4;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <BodyOutline t={t} />
        <NeuralAxis t={t} />
        {frontIndex <= 4 && <Somitomeres t={t} />}
        <SomitePairs t={t} scale={1} onlyFrom={Math.max(0, frontIndex - 6)} onlyTo={Math.min(TOTAL_SOMITES, frontIndex + 1)} />
        <Part id="mesodermo-paraxiala" quiet>
          <rect x={500 - gap - rx} y={paraxTop - paraxH} width={2 * rx} height={paraxH} rx={4} fill={C.mesoParaxial} opacity={0.6} />
          <rect x={500 + gap - rx} y={paraxTop - paraxH} width={2 * rx} height={paraxH} rx={4} fill={C.mesoParaxial} opacity={0.6} />
        </Part>
      </g>
      <Label id="somitak" x={190} y={220} ax={z.at(500 - gap, frontY)[0]} ay={z.at(500 - gap, frontY)[1]} />
      <Label id="mesodermo-paraxiala" x={190} y={440} ax={z.at(500 - gap, paraxTop - paraxH / 2)[0]} ay={z.at(500 - gap, paraxTop - paraxH / 2)[1]} />
      {frontIndex <= 4 && (
        <Label id="somitomeroak" x={810} y={140} ax={z.at(478, Y_TOP + 22)[0]} ay={z.at(478, Y_TOP + 22)[1]} show={1} small />
      )}
      <Note x={500} y={90} tone="accent">Hazkuntza-gunea: bikote berriak egunero (~3/egun)</Note>
    </g>
  );
}
