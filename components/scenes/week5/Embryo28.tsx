'use client';

import { Label, Note, OnTop, Part, lerp, lerpPt, seg, zoom, type Pt, type SceneProps } from '@/components/kit';
import { EarlyEmbryo, earlyGeom, heartLobes, somiteAt } from './EarlyEmbryo';
import { AgeHud, polar, spineAt } from './skin';

/**
 * Topic 5, step 1 — the embryo on days 28–32 seen from its left side (course figures "28. eguna"
 * and "32. eguna"). The somites are counted one by one, the crown–rump length is measured, the
 * camera pushes in on the head for the placodes, and the body morphs from day 28 to day 32.
 */

const day28to32 = (t: number) => (t < 0.62 ? 28 : t < 0.74 ? lerp(28, 32, seg(t, 0.62, 0.74)) : 32);

/** Fade in at `a`, out at `b` (stage time). */
const vis = (t: number, a: number, b = 2) => Math.min(seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));

/** Camera: push in on the head for the placode steps (beats .37 and .74), full figure otherwise. */
function camera(t: number) {
  const p1 = seg(t, 0.37, 0.405) * (1 - seg(t, 0.452, 0.478));
  const p2 = seg(t, 0.742, 0.778) * (1 - seg(t, 0.828, 0.858));
  const push = Math.max(p1, p2);
  const f: Pt = p2 > p1 ? [488, 250] : [515, 196];
  const s = lerp(1, p2 > p1 ? 1.5 : 1.66, push);
  // Interpolate the focus so the head glides to the middle as the camera closes in.
  const fx = lerp(500, f[0], push);
  const fy = lerp(320, f[1], push);
  return { push, day32Zoom: p2 > p1, z: zoom(fx, fy, s, 500, lerp(320, p2 > p1 ? 332 : 300, push)) };
}

export function Embryo28to32({ t }: SceneProps) {
  const day = day28to32(t);
  const g = earlyGeom(day);
  const { S, cran, heart } = g;
  const beat = Math.sin(t * 160);
  const { push, day32Zoom, z } = camera(t);
  const at = (p: readonly number[]) => z.at(p[0], p[1]);
  /** 1 while a camera-mapped anchor is inside the frame, fading to 0 just past the edge. */
  const inFrame = (p: readonly number[]) => {
    const d = Math.max(30 - p[0], p[0] - 970, 34 - p[1], p[1] - 604, 0);
    return 1 - Math.min(1, d / 24);
  };

  // Step 2: count the somites one by one (28 pairs on day 28).
  const countK = seg(t, 0.14, 0.205, (k) => k);
  const counting = vis(t, 0.13, 0.25);
  const counted = counting > 0.02 ? Math.round(28 * countK) : -1;
  const lastSom = counted > 0 ? somiteAt(day, counted - 1) : null;

  // Step 3: crown–rump length, drawn from the vertex to the rump.
  const vertex = polar(cran, -100, Math.max(cran[2], cran[3]) * 0.98);
  const rump = spineAt(S, 0.72, 0).p;
  const crl = vis(t, 0.25, 0.37);
  const draw = seg(t, 0.262, 0.31);
  const crlEnd = lerpPt(vertex, rump, draw);

  const legGrow = t < 0.6 ? 0.35 : lerp(0.35, 1, seg(t, 0.6, 0.68));
  const b0 = g.bars[0];
  const b1 = g.bars[1];
  const archC = lerpPt(b0.top, b0.bot, 0.5);
  const groove: Pt = [(b0.top[0] + b1.top[0]) / 2 + 1, lerp(b0.top[1], b0.bot[1], 0.45)];
  const bl = g.bars[g.bars.length - 1];
  const sinus: Pt = [bl.top[0] + 18, bl.top[1] + g.archLen[3] * 0.5];
  const { vent, atr } = heartLobes(heart, g.atrium);
  const meso = g.meso[2];
  // While the camera is on the head the lower somites leave the frame: name the highest ones instead.
  const somP: Pt = lastSom ?? spineAt(S, lerp(0.6, day32Zoom ? 0.45 : 0.34, push), 16).p;
  const heartP: Pt = [heart[0] - heart[2] * 0.3, heart[1] - heart[3] * 0.25];
  const mesen = polar(cran, -150, cran[2] * 0.75);
  const legS = lerp(0.45, 1, legGrow);

  const crlA = at(vertex);
  const crlB = at(crlEnd);
  const ang = Math.atan2(crlB[1] - crlA[1], crlB[0] - crlA[0]);
  const cap = (p: Pt, k: number) => {
    const n: Pt = [-Math.sin(ang) * 9 * k, Math.cos(ang) * 9 * k];
    return `M${p[0] - n[0]},${p[1] - n[1]} L${p[0] + n[0]},${p[1] + n[1]}`;
  };
  const lastSomS = lastSom ? at(lastSom) : null;

  return (
    <g>
      <g transform={z.transform}>
        <EarlyEmbryo day={day} beat={beat} counted={counted} legGrow={legGrow} />
      </g>

      {/* Crown–rump length: a measuring line with end caps, drawn vertex → rump. */}
      {crl > 0.02 && (
        <Part id="luzera-zefalokaudala" show={crl}>
          <path d={`M${crlA[0]},${crlA[1]} L${crlB[0]},${crlB[1]}`} stroke="#2b0f0c" strokeWidth={5} strokeLinecap="round" opacity={0.45} fill="none" />
          <path d={`M${crlA[0]},${crlA[1]} L${crlB[0]},${crlB[1]}`} stroke="#ffb86b" strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <path d={cap(crlA, 1)} stroke="#ffb86b" strokeWidth={2.6} strokeLinecap="round" />
          {draw > 0.97 && <path d={cap(crlB, 1)} stroke="#ffb86b" strokeWidth={2.6} strokeLinecap="round" />}
          <circle cx={crlB[0]} cy={crlB[1]} r={3.6} fill="#ffe2bf" />
        </Part>
      )}

      {/* The somite being counted gets a soft pool of light. */}
      {lastSomS && counted < 28 && (
        <circle cx={lastSomS[0]} cy={lastSomS[1]} r={16} fill="url(#w5c-glow)" pointerEvents="none" opacity={counting} />
      )}
      <defs>
        <radialGradient id="w5c-glow">
          <stop offset="0" stopColor="#ffd59a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Left gutter */}
      <Label id="mesentzefaloa" x={290} y={100} ax={at(mesen)[0]} ay={at(mesen)[1]} show={vis(t, 0.37)} />
      <Label id="kristalinoaren-plaka" x={290} y={165} ax={at(g.eye)[0] - 9} ay={at(g.eye)[1]} show={vis(t, 0.37, 0.7)} />
      <Label id="kristalinoaren-hobitxoa" x={290} y={165} ax={at(g.eye)[0] - 9} ay={at(g.eye)[1]} show={vis(t, 0.74)} />
      <Label id="sudur-plaka" x={290} y={225} ax={at(g.nose)[0] - 7} ay={at(g.nose)[1]} show={vis(t, 0.74)} />
      {/* In the day-32 push-in the heart's line threads between the lens pit and the nasal placode. */}
      <Label id="bihotz-goragunea" x={290} y={lerp(345, 377, day32Zoom ? push : 0)} ax={at(heartP)[0]} ay={at(heartP)[1]} show={vis(t, 0.48) * inFrame(at(heartP))} />
      <Label id="ezkerreko-bentrikulua" x={290} y={390} ax={at(vent)[0]} ay={at(vent)[1] + 6} show={vis(t, 0.48, 0.74) * inFrame(at(vent))} />
      <Label id="zilborrestea" x={290} y={440} ax={at(g.cordTip)[0]} ay={at(g.cordTip)[1]} show={vis(t, 0.6) * inFrame(at(g.cordTip))} />
      <Label id="goragune-kaudala" x={290} y={492} ax={at(g.tail)[0]} ay={at(g.tail)[1]} show={vis(t, 0.6) * inFrame(at(g.tail))} />
      <Label id="beheko-gorputz-adarraren-hasikina" x={300} y={540} ax={at(g.leg)[0]} ay={at(g.leg)[1] + 4 * legS} show={vis(t, 0.6) * inFrame(at(g.leg))} />

      {/* Right gutter */}
      <Label id="laugarren-bentrikulua" x={770} y={60} ax={at(g.v4)[0]} ay={at(g.v4)[1]} show={vis(t, 0.86)} />
      <Label id="entzumen-plaka" x={770} y={105} ax={at(g.ear)[0] + 9} ay={at(g.ear)[1]} show={vis(t, 0.37, 0.7)} />
      <Label id="faringe-arkuak" x={770} y={150} ax={at(archC)[0]} ay={at(archC)[1]} show={inFrame(at(archC))} />
      <Label id="arrialdura-brankialak" x={770} y={195} ax={at(groove)[0]} ay={at(groove)[1]} show={vis(t, 0.86)} />
      <Label id="lepoko-sinua" x={770} y={240} ax={at(sinus)[0]} ay={at(sinus)[1]} show={vis(t, 0.86)} />
      <Label id="ezkerreko-aurikula" x={770} y={285} ax={at(atr)[0]} ay={at(atr)[1]} show={vis(t, 0.48, 0.74) * inFrame(at(atr))} />
      <Label id="goiko-gorputz-adarraren-hasikina" x={738} y={372} ax={at(g.arm)[0]} ay={at(g.arm)[1]} show={vis(t, 0.48) * inFrame(at(g.arm))} />
      <Label id="mesonefros-gandorra" x={770} y={440} ax={at(meso)[0]} ay={at(meso)[1]} show={vis(t, 0.86)} />
      <Label id="somitak" x={770} y={520} ax={at(somP)[0]} ay={at(somP)[1]} show={inFrame(at(somP))} />
      <Label id="luzera-zefalokaudala" x={770} y={566} ax={lerp(crlA[0], crlB[0], 0.6)} ay={lerp(crlA[1], crlB[1], 0.6)} show={crl * seg(t, 0.27, 0.3)} />
      <Note x={770} y={590} align="start" tone="accent" show={crl * seg(t, 0.3, 0.32)}>
        kraneoaren erpina → koxisa · mm
      </Note>

      {/* Step 2 read-out: the count climbs as the beads light up. */}
      {counting > 0.02 && (
        <OnTop>
          <g opacity={counting} pointerEvents="none">
            <text x={40} y={470} fill="#ffc98a" fontSize={11} letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
              Somitak zenbatzen
            </text>
            <text x={40} y={508} fill="#fff1e2" fontSize={34} fontWeight={650} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.max(0, counted)}
              <tspan fill="#b4afa6" fontSize={16} fontWeight={500} dx={4}>
                / 28 bikote
              </tspan>
            </text>
          </g>
        </OnTop>
      )}
      <Note x={40} y={534} align="start" tone="accent" show={counting * seg(t, 0.204, 0.214)}>
        28 bikote ≈ 28. eguna
      </Note>
      <Note x={40} y={500} align="start" tone="warn" show={crl * seg(t, 0.31, 0.33)}>
        Tolestuta dago: neurria aldakorra
      </Note>
      <AgeHud value={Math.round(day)} unit=". eguna" caption="Enbrioiaren adina" />
    </g>
  );
}
