'use client';

import { Label, Note, Part, lerp, seg, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, arc, poly, sm, spline, vis } from './common';
import { TYPES } from './timing';

/**
 * 7:peritoneo-barrunbea:motak — apunteen 2.1 atala (p8–p12): abdomeneko hiru organo motak alderatuta,
 * hiru zutabetan, mozketa beraren zati bat bakoitza (dortsala goian): atzeko pareta, paretako peritoneoa
 * eta barrunbea. Galdera bakarrak bereizten ditu: mesenterioa izan duen ala ez.
 *  - barrukoa: hestetik sortua, mesenteriotik zintzilik, errai peritoneoz inguratuta;
 *  - kanpokoa: atzeko paretan (giltzurruna, aorta, beheko kaba), paretako peritoneoaren atzean, inoiz mesenteriorik gabe;
 *  - atzekoa: hasieran barrukoa; haren mesenterioa atzeko paretako peritoneoarekin fusionatzen da.
 */

const COLS = [180, 500, 820] as const;
const WALL_Y = 162;
const HALF = 128;

const INSIDE = ['peritoneo-barruko-egiturak'];
const OUTSIDE = ['peritoneo-kanpoko-egiturak'];
const BEHIND = ['peritoneo-atzeko-egiturak'];

/** The cavity under the dorsal wall of a column: its front edge along the wall may bulge round a fused colon. */
function cavityPts(c: number, bulge = 0, bx = c): Pt[] {
  const top: Pt[] = bulge > 0.01
    ? spline([[c - HALF, WALL_Y], [bx - 50, WALL_Y], [bx - 30, WALL_Y + 14 * bulge], [bx, WALL_Y + 30 * bulge], [bx + 30, WALL_Y + 14 * bulge], [bx + 50, WALL_Y], [c + HALF, WALL_Y]], 8)
    : [[c - HALF, WALL_Y], [c + HALF, WALL_Y]];
  const bottom = spline([[c + HALF, WALL_Y], [c + HALF, 318], [c + HALF - 30, 366], [c, 376], [c - HALF + 30, 366], [c - HALF, 318], [c - HALF, WALL_Y]], 8);
  return [...top, ...bottom.slice(1)];
}

function Wall({ c }: { c: number }) {
  const d = `M${c - HALF - 10},${WALL_Y} L${c - HALF - 10},104 Q${c},88 ${c + HALF + 10},104 L${c + HALF + 10},${WALL_Y} Z`;
  return (
    <Part id="gorputz-pareta" quiet>
      <path d={d} fill={P.wall} />
      <path d={d} fill="url(#w7-mesench)" />
      <path d={d} fill="url(#w7-light)" />
    </Part>
  );
}

function Cavity({ c, bulge = 0 }: { c: number; bulge?: number }) {
  const pts = cavityPts(c, bulge);
  return (
    <>
      <Part id="peritoneo-barrunbea">
        <path d={poly(pts)} fill={P.space} />
        <path d={poly(pts)} fill="rgba(120,220,140,0.26)" />
      </Part>
      <Part id="paretako-peritoneoa">
        <path d={poly(pts)} fill="none" stroke={P.serosa} strokeWidth={3.4} strokeLinejoin="round" />
      </Part>
    </>
  );
}

function Tube({ c, r }: { c: Pt; r: number }) {
  return (
    <>
      <circle cx={c[0]} cy={c[1]} r={r} fill="#7a3b48" stroke="rgba(40,10,20,0.6)" strokeWidth={1} />
      <circle cx={c[0]} cy={c[1]} r={r} fill="url(#w7-muscle)" opacity={0.5} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.62} fill={P.gut} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.24} fill="#1a1208" />
      <circle cx={c[0]} cy={c[1]} r={r} fill="url(#w7-light)" />
    </>
  );
}

export function PeritoneumTypes({ t }: SceneProps) {
  // Before the step the table is a finished reference; in the step the columns come one by one.
  const ref = t < TYPES.at - 0.001;
  const s1 = ref ? 1 : seg(t, TYPES.at, TYPES.at + 0.01);
  const s2 = ref ? 1 : seg(t, TYPES.c2, TYPES.c2 + 0.01);
  const s3 = ref ? 1 : seg(t, TYPES.c3, TYPES.c3 + 0.01);
  const fuse = ref ? 1 : sm(seg(t, TYPES.fuse[0], TYPES.fuse[1]));
  const [a, b, c] = COLS;

  // Column 1: the gut hanging on its two-layered mesentery.
  const gut: Pt = [a, 270];
  // Column 3: the colon on a short mesentery, then pressed to the back wall (its mesentery fused).
  const colon: Pt = [c, lerp(250, WALL_Y + 6, fuse)];
  const CR = 30;

  // Four rows per column: where it comes from, the mesentery (the one question that sorts them), where it is now, examples.
  const rows = (x: number, show: number, lines: string[]) =>
    lines.map((l, i) => (
      <Note key={i} x={x} y={420 + i * 28} show={show} tone={i === 1 ? 'warn' : i === 0 ? 'accent' : 'dim'} size={i === 1 ? 14 : 13}>
        {l}
      </Note>
    ));

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      {/* ——— Peritoneo barrukoa ——— */}
      <g opacity={s1}>
        <Wall c={a} />
        <Cavity c={a} />
        <Part id="mesenterio-dortsala">
          <path d={`M${a - 9},${WALL_Y} L${a - 6},${gut[1] - 34} L${a + 6},${gut[1] - 34} L${a + 9},${WALL_Y} Z`} fill="#a8606b" />
          <path d={`M${a - 9},${WALL_Y} L${a - 6},${gut[1] - 34} L${a + 6},${gut[1] - 34} L${a + 9},${WALL_Y} Z`} fill="url(#w7-mesench)" />
          <path d={`M${a},${WALL_Y + 2} L${a},${gut[1] - 36}`} stroke="#d8203a" strokeWidth={2.2} opacity={0.75} />
        </Part>
        <Part id="erdiko-hestea" groups={INSIDE}>
          <Tube c={gut} r={36} />
        </Part>
        <Part id="errai-peritoneoa">
          <path d={poly(arc(gut[0], gut[1], 39, 39, -78, 258, 40), false)} fill="none" stroke="#ffd29a" strokeWidth={3.2} />
          <path d={`M${a - 9},${WALL_Y + 2} L${a - 7},${gut[1] - 37} M${a + 9},${WALL_Y + 2} L${a + 7},${gut[1] - 37}`} stroke="#ffd29a" strokeWidth={2.6} />
        </Part>
      </g>

      {/* ——— Peritoneo kanpokoa ——— */}
      <g opacity={s2}>
        <Wall c={b} />
        <Cavity c={b} />
        <Part id="giltzurruna" groups={OUTSIDE}>
          <ellipse cx={b - 62} cy={128} rx={34} ry={20} transform={`rotate(-18 ${b - 62} 128)`} fill="#b2485a" stroke="#6e1f2e" strokeWidth={1.2} />
          <ellipse cx={b + 62} cy={128} rx={34} ry={20} transform={`rotate(18 ${b + 62} 128)`} fill="#b2485a" stroke="#6e1f2e" strokeWidth={1.2} />
          <ellipse cx={b - 62} cy={128} rx={34} ry={20} transform={`rotate(-18 ${b - 62} 128)`} fill="url(#w7-light)" />
          <ellipse cx={b + 62} cy={128} rx={34} ry={20} transform={`rotate(18 ${b + 62} 128)`} fill="url(#w7-light)" />
        </Part>
        <Part id="aorta" groups={OUTSIDE}>
          <circle cx={b + 8} cy={136} r={12} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.2} />
        </Part>
        <Part id="beheko-kaba-zaina" groups={OUTSIDE}>
          <ellipse cx={b - 20} cy={140} rx={11} ry={9} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
        </Part>
      </g>

      {/* ——— Peritoneo atzekoa ——— */}
      <g opacity={s3}>
        <Wall c={c} />
        <Cavity c={c} bulge={seg(fuse, 0.55, 1)} />
        {colon[1] - CR > WALL_Y + 2 && (
          <Part id="mesenterio-dortsala">
            <path d={`M${c - 8},${WALL_Y} L${c - 6},${colon[1] - CR + 2} L${c + 6},${colon[1] - CR + 2} L${c + 8},${WALL_Y} Z`} fill="#c98a8a" />
          </Part>
        )}
        <Part id="beheranzko-kolona" groups={BEHIND}>
          <Tube c={colon} r={CR} />
        </Part>
        {/* Its visceral peritoneum: all round while it hangs, only in front once fused to the wall. */}
        <Part id="errai-peritoneoa">
          <path d={poly(arc(colon[0], colon[1], CR + 3, CR + 3, lerp(-80, 8, fuse), lerp(260, 172, fuse), 36), false)} fill="none" stroke="#ffd29a" strokeWidth={3} opacity={1 - 0.6 * seg(fuse, 0.6, 1)} />
        </Part>
      </g>

      {/* Column heads: the group names (each lights its organs). */}
      <Label id="peritoneo-barruko-egiturak" x={a} y={64} align="middle" show={s1} />
      <Label id="peritoneo-kanpoko-egiturak" x={b} y={64} align="middle" show={s2} />
      <Label id="peritoneo-atzeko-egiturak" x={c} y={64} align="middle" show={s3} />

      {/* A few names inside the sketches. */}
      <Label id="mesenterio-dortsala" x={a + 52} y={200} align="start" ax={a + 8} ay={204} show={s1} small />
      <Label id="errai-peritoneoa" x={a + 70} y={320} align="start" ax={a + 36} ay={286} show={s1} small />
      <Label id="paretako-peritoneoa" x={b} y={250} align="middle" ax={b + 40} ay={WALL_Y + 2} show={s2} small />
      <Label id="peritoneo-barrunbea" x={b} y={330} align="middle" ax={b + 70} ay={312} show={s2} small />
      <Label id="giltzurruna" x={b + 84} y={204} align="middle" ax={b + 66} ay={130} show={s2} small />
      <Label id="beheko-kaba-zaina" x={b - 74} y={206} align="middle" ax={b - 20} ay={141} show={s2} small />
      <Label id="beheranzko-kolona" x={c} y={334} align="middle" ax={c} ay={colon[1] + CR - 10} show={s3} small />

      {rows(a, s1, ['Hestetik sortuak', 'Mesenterioa: BAI, zintzilik', 'Errai peritoneoz inguratuta', 'Adib.: urdaila (hestetik sortutakoak)'])}
      {rows(b, s2, ['Atzeko paretan, barrunbetik kanpo', 'Mesenterioa: INOIZ EZ', 'Paretako peritoneoaren atzean', 'Adib.: giltzurrunak, aorta, beheko kaba'])}
      {rows(c, s3, ['Hestetik sortuak: hasieran barrukoak', 'Mesenterioa: BAI → paretari fusionatua', 'Orain barrunbearen atzean', 'Adib.: duodenoa, goranzko eta beheranzko kolona'])}

      <Note x={500} y={590} tone="warn" show={Math.max(ref ? 1 : 0, vis(t, TYPES.fuse[1]))}>
        Atzekoa ≠ kanpokoa: atzekoak mesenterioa izan zuen (barrunbean egon ziren); kanpokoak inoiz ez
      </Note>
      <Note x={500} y={614} show={Math.max(ref ? 1 : 0, vis(t, TYPES.fuse[1]))}>
        Horregatik peritoneo barrunbeak ez du abdomeneko barrunbe osoa okupatzen
      </Note>
      <Note x={500} y={600} tone="accent" show={ref ? 0 : vis(t, TYPES.c3, TYPES.fuse[1])}>
        Mesenterioa atzeko paretako peritoneoarekin fusionatzen da: barrukoa → atzekoa
      </Note>
    </g>
  );
}
