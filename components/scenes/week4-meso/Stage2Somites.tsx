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
const SOMITES = buildSomites(SOM_Y_TOP, Y_BOT - 24); // the last (coccygeal) pairs stay inside the tail's rounded end

/**
 * day(t), following the beats: somitomeres only before the first pair (step 1, ≈19.6) · first pair
 * on day 20 (step 2) · ~3 pairs/day from step 3 until all 44 by the totals step's complete frame (day 35).
 */
function dayFor(t: number) {
  return 19.6 + 0.4 * seg(t, 0.12, 0.16) + 0.4 * lin(t, 0.16, 0.26) + 14.6 * lin(t, 0.3, 0.84);
}
function countFor(day: number) {
  return Math.max(0, Math.min(TOTAL_SOMITES, Math.round(1 + 3 * (day - 20))));
}
/** t at which somite index i (0-based) first appears: inverts countFor(dayFor(t)) (monotonic). */
function appearT(index: number) {
  const need = 20 + (index - 0.5) / 3;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (dayFor(mid) >= need) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Fade of a new pair: about one budding interval, so the unsegmented block and the pair hand over smoothly. */
const BUD_FADE = 0.012;

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

function SomitePairs({ t, scale = 1, onlyFrom = 0, onlyTo = TOTAL_SOMITES, fadeLen = BUD_FADE }: { t: number; scale?: number; onlyFrom?: number; onlyTo?: number; fadeLen?: number }) {
  const day = dayFor(t);
  const count = countFor(day);
  const disappear = seg(t, 0.88, 0.93);
  const gap = 22 * scale; // >= 22: keeps the neural tube (width 14, centred on x=500) visible between pairs
  const rx = 10 * scale; // <= 12
  const ry = 7 * scale;
  return (
    <Part id="somitak" quiet>
      {SOMITES.filter((s) => s.index >= onlyFrom && s.index < onlyTo).map((s) => {
        const a = fade(t, appearT(s.index), Infinity, fadeLen);
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

/**
 * Unsegmented paraxial mesoderm: caudal to the newest pair, down to the tail. The newest pair's slot
 * stays filled by the block (fading out) while the pair fades in on top of it — it pinches off, no gap.
 */
function paraxialTail(t: number, fadeLen: number) {
  const count = countFor(dayFor(t));
  if (count <= 0) return { top: SOMITES[0].y - 7, slot: null as null | { y: number; o: number } };
  const i = Math.min(TOTAL_SOMITES - 1, count - 1);
  return { top: SOMITES[i].y + 7, slot: { y: SOMITES[i].y - 7, o: 1 - fade(t, appearT(i), Infinity, fadeLen) } };
}
/** Top of the block including the (fading) slot of the newest pair, for labels. */
function paraxialTop(t: number, fadeLen: number) {
  const { top, slot } = paraxialTail(t, fadeLen);
  return slot ? lerp(top, slot.y, slot.o) : top;
}
const PARAX_BOT = Y_BOT - 16;

/** Rect path with separate top / bottom corner radii (so stacked pieces join without notches). */
const rrect = (x: number, y: number, w: number, h: number, rt: number, rb: number) => {
  const a = Math.min(rt, h / 2, w / 2);
  const b = Math.min(rb, h / 2, w / 2);
  return `M${x},${y + a} Q${x},${y} ${x + a},${y} L${x + w - a},${y} Q${x + w},${y} ${x + w},${y + a} L${x + w},${y + h - b} Q${x + w},${y + h} ${x + w - b},${y + h} L${x + b},${y + h} Q${x},${y + h} ${x},${y + h - b} Z`;
};

function ParaxialTail({ t, fadeLen, opacity }: { t: number; fadeLen: number; opacity: number }) {
  const { top, slot } = paraxialTail(t, fadeLen);
  const h = PARAX_BOT - top;
  const slotOn = !!slot && slot.o > 0.01;
  if (h <= 1 && !slotOn) return null;
  return (
    <Part id="mesodermo-paraxiala" quiet>
      {[-1, 1].map((sd) => (
        <g key={sd} fill={C.mesoParaxial}>
          {h > 1 && <path d={rrect(500 + sd * 22 - 10, top, 20, h, slotOn ? 0 : 6, 6)} opacity={opacity} />}
          {slotOn && <path d={rrect(500 + sd * 22 - 10, slot.y, 20, top - slot.y, 5, h > 1 ? 0 : 5)} opacity={opacity * slot.o} />}
        </g>
      ))}
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
  const disappear = seg(t, 0.88, 0.93);
  const regressed = disappear > 0.15 ? Math.round(7 * disappear) : 0;
  // The body is a tall strip: magnify it so it fills the frame (labels keep their own size).
  const z = zoom(500, 325, 1.2, 500, 325);
  const at = (x: number, y: number) => z.at(x, y);
  const tailTop = paraxialTop(t, BUD_FADE);
  return (
    <g>
      <g transform={z.transform}>
        <BodyOutline t={t} />
        <NeuralAxis t={t} />
        <Somitomeres t={t} />
        <ParaxialTail t={t} fadeLen={BUD_FADE} opacity={0.35} />
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
            −{regressed}: 1. okzipitala + azken kokzigeoak
          </text>
        )}
      </g>
      <Label id="somitomeroak" x={190} y={150} ax={at(478, Y_TOP + 22)[0]} ay={at(478, Y_TOP + 22)[1]} show={1} />
      <Label id="somitak" x={190} y={280} ax={at(478, SOM_Y_TOP + 10)[0]} ay={at(478, SOM_Y_TOP + 10)[1]} show={fade(t, appearT(0), Infinity, 0.05)} />
      <Label id="hodi-neurala" x={810} y={200} ax={500} ay={at(500, Y_TOP + 90)[1]} small />
      <Label id="mesodermo-paraxiala" x={190} y={470} ax={at(478, lerp(tailTop, PARAX_BOT, 0.5))[0]} ay={at(478, lerp(tailTop, PARAX_BOT, 0.5))[1]} show={Math.max(0, Math.min(1, (PARAX_BOT - tailTop - 4) / 30))} small />
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
  const frontIndex = Math.max(0, Math.min(TOTAL_SOMITES - 1, count - 1));
  // The camera follows a continuous budding front (not the discrete newest pair), so it glides instead of stepping per pair.
  const f = Math.max(0, Math.min(TOTAL_SOMITES - 4, 3 * (day - 20)));
  const i0 = Math.floor(f);
  const camY = lerp(SOMITES[i0].y, SOMITES[Math.min(TOTAL_SOMITES - 1, i0 + 1)].y, f - i0);
  const z = zoom(500, camY, 2.2, 500, 340);
  const gap = 22;
  const rx = 10;
  const ry = 7;
  const paraxTop = paraxialTop(t, BUD_FADE);
  const paraxH = Math.max(0, PARAX_BOT - paraxTop);
  // The next pair takes shape inside the block before it pinches off (a faint outline, stronger as its time nears).
  const nextIndex = count;
  const forming = nextIndex < TOTAL_SOMITES ? Math.max(0, Math.min(1, 3 * (day - 20) - (nextIndex - 1.5))) : 0;
  const nextY = nextIndex < TOTAL_SOMITES ? SOMITES[nextIndex].y : 0;
  const paraxAt = z.at(500 - gap, paraxTop + Math.min(36, paraxH / 2));
  return (
    <g>
      <rect x={0} y={0} width={1000} height={640} fill="#101828" />
      <g transform={z.transform}>
        <BodyOutline t={t} />
        <NeuralAxis t={t} />
        <Somitomeres t={t} />
        <ParaxialTail t={t} fadeLen={BUD_FADE} opacity={0.55} />
        {forming > 0.02 && count > 0 &&
          [-1, 1].map((sd) => (
            <ellipse key={sd} cx={500 + sd * gap} cy={nextY} rx={rx - 1} ry={ry - 1} fill="none" stroke="rgba(10,14,28,0.7)" strokeWidth={0.9} strokeDasharray="2 2" opacity={forming} />
          ))}
        <SomitePairs t={t} scale={1} onlyFrom={Math.max(0, frontIndex - 7)} onlyTo={Math.min(TOTAL_SOMITES, frontIndex + 1)} fadeLen={BUD_FADE} />
      </g>
      <Label id="somitak" x={190} y={220} ax={z.at(500 - gap, camY - 14)[0]} ay={z.at(500 - gap, camY - 14)[1]} show={seg(t, appearT(0), appearT(0) + 0.03)} />
      <Label id="mesodermo-paraxiala" x={190} y={440} ax={paraxAt[0]} ay={paraxAt[1]} show={Math.max(0, Math.min(1, (paraxH - 4) / 24))} />
      <Label id="somitomeroak" x={810} y={140} ax={z.at(478, Y_TOP + 22)[0]} ay={z.at(478, Y_TOP + 22)[1]} show={1 - seg(t, appearT(3), appearT(5))} small />
      <Note x={500} y={90} tone="accent">Hazkuntza-gunea: bikote berriak egunero (~3/egun)</Note>
    </g>
  );
}
