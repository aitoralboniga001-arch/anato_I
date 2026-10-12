'use client';

import { Label, Note, Part, lerp, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { GutSagittal, gutCoat } from '@/components/scenes/week4-meso/Stage5Endoderm';
import { HUE, Spindle, Steps, W, arc, f1, vis } from './common';
import { OriginsArt } from './Origins';
import { MuscleTissues } from './Tissues';

/**
 * 9:muskulu-lisoa — section 3. Three pictures the student already knows: this topic's own section at the heart
 * level (stage 1), its three tissues (stage 1), and topic 4's folded gut tube. New on them: the vegetative
 * (green, as in the spinal cord) fibres that reach the smooth muscle; the smooth muscle growing in the splanchnic
 * coat along the whole gut; and the second exception, the aortic wall, built from parietal-layer cells and neural
 * crest cells (teal, as in topic 4).
 */

const AO: Pt[] = [
  [452, 236],
  [548, 236],
];
const VEG = '#86efac';
/** A small vegetative ganglion beside each aorta, and its fibres to the gut wall and the heart tube. */
const GANG: Pt[] = [
  [412, 272],
  [588, 272],
];
const FIBRES = (sd: 0 | 1): Pt[][] => {
  const g = GANG[sd];
  const s = sd ? 1 : -1;
  return [
    [g, [500 + s * 64, 288], [500 + s * 54, 300]],
    [g, [500 + s * 76, 320], [500 + s * 40, 334]],
    [g, [500 + s * 92, 360], [500 + s * 70, 420], [500 + s * 64, 440]],
  ];
};

/** 9:muskulu-lisoa `jatorria`: stage 1's section; vegetative fibres (0.28), the aortic wall's two sources (0.72). */
export function SmoothSection({ t }: SceneProps) {
  const veg = seg(t, 0.28, 0.33);
  const ao = seg(t, 0.72, 0.8);
  const ring = seg(t, 0.78, 0.84);
  const crestFrom: Pt = [500, 70];
  return (
    <g>
      <OriginsArt t={1} />
      {/* Autonomic (vegetative) innervation: a ganglion beside each aorta, fibres to the gut wall and the heart. */}
      <Part id="nerbio-sistema-begetatiboa" show={veg}>
        {[0, 1].map((sd) => (
          <g key={sd} opacity={veg}>
            {FIBRES(sd as 0 | 1).map((f, i) => {
              const d = smoothPath(f, false, 0.4);
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="#14532d" strokeWidth={4.6} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={VEG} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={`${f1(400 * veg)} 400`} />
                </g>
              );
            })}
            <ellipse cx={GANG[sd][0]} cy={GANG[sd][1]} rx={13} ry={9} fill={VEG} stroke="#14532d" strokeWidth={1.6} />
          </g>
        ))}
      </Part>
      {/* Aortic wall: cells from the parietal layer and from the neural crest gather round each aorta → smooth muscle. */}
      {ao > 0.01 && (
        <g>
          <Part id="paretako-orria" show={ao}>
            {Array.from({ length: 16 }, (_, i) => {
              const sd = i % 2 ? 1 : -1;
              const from: Pt = [500 + sd * (250 + rand(i * 2.1) * 30), 330 + rand(i * 3.7) * 90];
              const a = (i * 47 + rand(i) * 40) * (Math.PI / 180);
              const c = AO[sd > 0 ? 1 : 0];
              const to: Pt = [c[0] + Math.cos(a) * 27, c[1] + Math.sin(a) * 27];
              const k = seg(ao, rand(i * 5.3) * 0.3, 0.7 + rand(i * 5.3) * 0.3);
              return <circle key={i} cx={f1(lerp(from[0], to[0], k))} cy={f1(lerp(from[1], to[1], k))} r={4.6} fill={W.parietal} stroke="#7a1d2b" strokeWidth={1} />;
            })}
          </Part>
          <Part id="gandor-neurala" show={ao}>
            {Array.from({ length: 12 }, (_, i) => {
              const sd = i % 2 ? 1 : -1;
              const from: Pt = [crestFrom[0] + sd * (20 + rand(i * 1.7) * 12), crestFrom[1] + rand(i * 2.9) * 12];
              const a = (i * 61 + 200) * (Math.PI / 180);
              const c = AO[sd > 0 ? 1 : 0];
              const to: Pt = [c[0] + Math.cos(a) * 27, c[1] + Math.sin(a) * 27];
              const mid: Pt = [500 + sd * 70, 160];
              const k = seg(ao, rand(i * 4.1) * 0.3, 0.7 + rand(i * 4.1) * 0.3);
              const p: Pt = k < 0.5 ? [lerp(from[0], mid[0], k * 2), lerp(from[1], mid[1], k * 2)] : [lerp(mid[0], to[0], k * 2 - 1), lerp(mid[1], to[1], k * 2 - 1)];
              return <circle key={i} cx={f1(p[0])} cy={f1(p[1])} r={4.6} fill={HUE.crest} stroke="#0f5e57" strokeWidth={1} />;
            })}
          </Part>
          <Part id="muskulu-leuna" show={ring}>
            {AO.map((c, i) => (
              <g key={i} opacity={ring}>
                <path d={`${smoothPath(arc(c[0], c[1], 30, 30, 0, 360, 30), true, 0.3)} ${smoothPath(arc(c[0], c[1], 22, 22, 360, 0, 30), true, 0.3)}`} fill={W.smooth} fillRule="evenodd" stroke="#7a4a06" strokeWidth={1} />
              </g>
            ))}
          </Part>
        </g>
      )}
      <Note x={500} y={22} size={12.5} tone="dim">
        4. astea · bihotzaren mailako zeharkako mozketa (1. urratseko irudia)
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Muskulu leuna: errai guztietan eta odol-hodien paretan · hestearen inguruko errai orritik'],
          [0.28, 'Inerbazioa ez da kraniala ez espinala: begetatiboa (sinpatikoa eta parasinpatikoa)'],
          [0.72, 'Bigarren salbuespena: aortaren eta haren adarren paretako muskulu leuna, paretako orritik eta gandor neuraletik'],
        ]}
      />
      <Label id="nerbio-sistema-begetatiboa" x={810} y={300} align="start" ax={GANG[1][0] + 12} ay={GANG[1][1]} show={veg} small />
      <Label id="gandor-neurala" x={810} y={130} align="start" ax={crestFrom[0] + 24} ay={crestFrom[1] + 8} show={ao} small />
    </g>
  );
}

/** 9:muskulu-lisoa `hestea`: topic 4's folded gut tube; smooth muscle grows in its splanchnic coat (0.56). */
export function SmoothGut({ t, reduced }: SceneProps) {
  const grow = seg(t, 0.56, 0.66);
  const coat = [...gutCoat(1, 0.04, 0.98, 46, 1), ...gutCoat(1, 0.04, 0.98, 46, -1)];
  const tip = coat.reduce((a, b) => (b.p[1] < a.p[1] ? b : a));
  return (
    <g>
      <GutSagittal t={1} reduced={reduced} />
      <Part id="muskulu-leuna" show={grow}>
        {coat.map((c, i) => {
          const u = (i % 47) / 46;
          const k = seg(grow, u * 0.6, u * 0.6 + 0.4);
          return k > 0.01 ? (
            <g key={i} opacity={k}>
              <Spindle x={c.p[0]} y={c.p[1]} len={13} h={4.6} rot={c.dir} />
            </g>
          ) : null;
        })}
      </Part>
      <Note x={500} y={24} size={12.5} tone="accent" show={vis(t, 0.56, 2)}>
        Eratorri guztien inguruko errai orritik: muskulu leuna (gernu- eta ugal-aparatuko erraiak ere badira)
      </Note>
      {/* Pointing at the top of the coat, so the leader does not cross the names in either column. */}
      <Label id="muskulu-leuna" x={500} y={60} align="middle" ax={tip.p[0]} ay={tip.p[1]} show={grow} />
    </g>
  );
}

/** Stage 1's three tissues, finished (exceptions included): stages 10 and 11 point into it. */
export function TissuesDone({ reduced }: SceneProps) {
  return <MuscleTissues t={1} reduced={reduced} />;
}
