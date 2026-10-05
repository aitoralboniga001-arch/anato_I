'use client';

import { Label, Mark, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Defs7, P, f1, offset, poly, resample, spline, vis } from './common';

/**
 * 7:diafragma-heldua — apunteen 3.1 atala (osagaien patua, atalak, zeharkatzen duten egiturak) eta 4.
 *  - `azpitik`: diafragma behetik ikusita (aurrea goian; ikuslearen ezkerra = gorputzaren eskuina): zentro
 *    tendinosoa (eskuineko, erdiko eta ezkerreko hostoak), bularrezur, saihets-hezur eta gerriko atalak, bi
 *    zutabeak (eskuinekoa L1–L3, ezkerrekoa L1–L2), erdiko lotailu arkutua eta hiru zuloak.
 *  - `sagitala`: kupularen profila: aurrean askoz gorago insertatzen da atzean baino; goian barrunbe torazikoa
 *    (pleura eta perikardio barrunbeak), behean abdomenekoa (peritoneo barrunbea, ez osoa).
 */

// ——— Inferior view ———

const C0: Pt = [500, 222];
const OUTLINE = spline(
  [
    [500, 92], [640, 100], [740, 150], [786, 240], [780, 330], [740, 410], [660, 452], [580, 448], [552, 420], [500, 412], [448, 420], [420, 448],
    [340, 452], [260, 410], [220, 330], [214, 240], [260, 150], [360, 100],
  ],
  8,
  true,
);
const TENDON = spline(
  [
    [500, 142], [568, 150], [618, 186], [676, 226], [700, 280], [672, 322], [622, 316], [580, 286], [540, 268], [500, 276], [460, 268], [420, 286],
    [378, 316], [328, 322], [300, 280], [324, 226], [382, 186], [432, 150],
  ],
  8,
  true,
);

/** The point of a closed curve in a given direction from C0 (degrees, 0 = right, 90 = down = posterior). */
function rayHit(curve: Pt[], deg: number): Pt {
  const want = (deg * Math.PI) / 180;
  let best = curve[0];
  let err = Infinity;
  for (const q of resample(curve, 360)) {
    const a = Math.atan2(q[1] - C0[1], q[0] - C0[0]);
    let d = Math.abs(a - want) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d < err) {
      err = d;
      best = q;
    }
  }
  return best;
}

/** Muscle between the outline and the tendon from angle a0 to a1 (degrees, increasing). */
function sector(a0: number, a1: number): Pt[] {
  const n = Math.max(4, Math.round((a1 - a0) / 3));
  const out: Pt[] = [];
  const inn: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(rayHit(OUTLINE, a));
    inn.push(rayHit(TENDON, a));
  }
  return [...out, ...inn.reverse()];
}

function fibres(a0: number, a1: number, step = 4) {
  const d: string[] = [];
  for (let a = a0 + step / 2; a < a1; a += step) {
    const o = rayHit(OUTLINE, a);
    const i = rayHit(TENDON, a);
    d.push(`M${f1(o[0])},${f1(o[1])}L${f1(i[0])},${f1(i[1])}`);
  }
  return d.join('');
}

// Angles (inferior view, posterior = 90°): sternal part at the front, lumbar part at the back.
const STERNAL: [number, number] = [-102, -78];
const COSTAL_R: [number, number] = [-78, 58];
const LUMBAR: [number, number] = [58, 122];
const COSTAL_L: [number, number] = [122, 258];
const MUSCLE = '#b84a5a';

const VERT = [
  { n: 'L1', y: 502 },
  { n: 'L2', y: 546 },
  { n: 'L3', y: 590 },
];
const CRUS_R = spline([[438, 330], [440, 390], [450, 440], [464, 500], [470, 600]], 8);
const CRUS_L = spline([[562, 330], [560, 390], [550, 440], [536, 500], [530, 552]], 8);
const AORTA: Pt = [500, 446];
const ESO: Pt = [532, 372];
const IVC: Pt = [438, 238];

function band(c: Pt[], w0: number, w1: number) {
  const n = c.length;
  const a = offset(c, (i) => lerp(w0, w1, i / (n - 1)));
  const b = offset(c, (i) => -lerp(w0, w1, i / (n - 1)));
  return smoothPath([...a, ...b.reverse()], true, 0.3);
}

export function DiaphragmBelow({ t }: SceneProps) {
  const septTint = 1 - seg(t, 0.08, 0.15);
  const esoTint = vis(t, 0.32, 0.48);
  const fromBelow = vis(t, 0.48);

  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />

      {/* Lumbar vertebrae behind the crura. */}
      <Part id="ornoak" quiet>
        {VERT.map((v) => (
          <g key={v.n}>
            <rect x={458} y={v.y - 19} width={84} height={38} rx={8} fill={P.bone} opacity={0.9} />
            <rect x={458} y={v.y - 19} width={84} height={38} rx={8} fill="url(#w7-light)" />
          </g>
        ))}
      </Part>
      {VERT.map((v) => (
        <Note key={v.n} x={500} y={v.y} size={11}>
          {v.n}
        </Note>
      ))}

      {/* Muscle parts round the central tendon. */}
      <Part id="saihets-hezur-atala">
        {[COSTAL_R, COSTAL_L].map(([a, b], i) => (
          <g key={i}>
            <path d={poly(sector(a, b))} fill={MUSCLE} />
            <path d={fibres(a, b)} stroke="rgba(255,210,210,0.28)" strokeWidth={1.1} />
          </g>
        ))}
      </Part>
      <Part id="bularrezur-atala">
        <path d={poly(sector(...STERNAL))} fill="#c45a6a" />
        <path d={fibres(...STERNAL)} stroke="rgba(255,210,210,0.32)" strokeWidth={1.1} />
      </Part>
      <Part id="gerriko-atala">
        <path d={poly(sector(...LUMBAR))} fill="#a8404f" />
        <path d={fibres(...LUMBAR)} stroke="rgba(255,210,210,0.28)" strokeWidth={1.1} />
        <path d={poly(sector(...LUMBAR))} fill={P.eso} opacity={0.6 * esoTint} />
      </Part>
      <Part id="diafragmaren-zutabeak">
        <path d={band(CRUS_R, 20, 9)} fill="#a8404f" stroke="#6e1f2e" strokeWidth={1} />
        <path d={band(CRUS_L, 18, 9)} fill="#a8404f" stroke="#6e1f2e" strokeWidth={1} />
        <path d={band(CRUS_R, 20, 9)} fill={P.eso} opacity={0.6 * esoTint} />
        <path d={band(CRUS_L, 18, 9)} fill={P.eso} opacity={0.6 * esoTint} />
      </Part>

      {/* Central tendon: three leaflets; from the septum transversum (its colour fades to tendon). */}
      <Part id="zentro-tendinosoa">
        <path d={poly(TENDON)} fill="#e9e2d6" stroke="#b8ab96" strokeWidth={1.2} />
        <path d={poly(TENDON)} fill="url(#w7-tendon)" />
        <path d={poly(TENDON)} fill={P.septum} opacity={0.75 * septTint} />
        <path d="M500,262L452,206M500,262L548,206" stroke="#c9bda8" strokeWidth={1.2} opacity={0.8} />
      </Part>
      <Note x={360} y={286} size={11} show={vis(t, 0, 0.16)}>
        eskuineko hostoa
      </Note>
      <Note x={500} y={186} size={11} show={vis(t, 0, 0.16)}>
        erdiko hostoa
      </Note>
      <Note x={640} y={286} size={11} show={vis(t, 0, 0.16)}>
        ezkerreko hostoa
      </Note>

      {/* The whole diaphragm: its outer rim (where it inserts on the body wall). */}
      <Part id="diafragma">
        <path d={smoothPath(OUTLINE, true, 0.3)} fill="none" stroke="#6e1f2e" strokeWidth={3} />
      </Part>

      {/* Openings and what passes through them. */}
      <Part id="beheko-kabaren-zuloa">
        <circle cx={IVC[0]} cy={IVC[1]} r={17} fill="#141018" stroke="#8c8070" strokeWidth={1.4} />
      </Part>
      <Part id="beheko-kaba-zaina">
        <circle cx={IVC[0]} cy={IVC[1]} r={12} fill={P.ivc} stroke="#1c3c88" strokeWidth={1.2} />
      </Part>
      <Part id="hestegorriaren-hiatoa">
        <ellipse cx={ESO[0]} cy={ESO[1]} rx={18} ry={14} fill="#141018" stroke="#6e1f2e" strokeWidth={1.4} />
      </Part>
      <Part id="hestegorria">
        <circle cx={ESO[0]} cy={ESO[1]} r={10} fill="#d98a6a" stroke="#7a3b2a" strokeWidth={1} />
        <circle cx={ESO[0]} cy={ESO[1]} r={3} fill="#3a1a10" />
      </Part>
      <Part id="aortaren-hiatoa">
        <ellipse cx={AORTA[0]} cy={AORTA[1]} rx={24} ry={20} fill="#141018" />
      </Part>
      <Part id="aorta">
        <circle cx={AORTA[0]} cy={AORTA[1]} r={15} fill={P.aorta} stroke="#7a0f1e" strokeWidth={1.4} />
      </Part>
      <Part id="erdiko-lotailu-arkutua">
        <path d={`M466,452Q500,404 534,452`} fill="none" stroke="#efe6d6" strokeWidth={5} strokeLinecap="round" />
      </Part>
      <Mark id="aortaren-hiatoa" x={AORTA[0]} y={AORTA[1]} rx={26} show={vis(t, 0.48, 0.62)} />
      <Mark id="hestegorriaren-hiatoa" x={ESO[0]} y={ESO[1]} rx={22} show={vis(t, 0.48, 0.62)} />
      <Mark id="beheko-kabaren-zuloa" x={IVC[0]} y={IVC[1]} rx={22} show={vis(t, 0.48, 0.62)} />

      <Note x={500} y={624} tone="accent" show={vis(t, 0, 0.16)}>
        Septum transversumetik: zentro tendinosoa (eskuineko, erdiko eta ezkerreko hostoak)
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.16, 0.32)}>
        Bularrezur atala (aurrean) · saihets-hezur atala (saihetsetan)
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.32, 0.48)}>
        Gerriko atala (hestegorri inguruko mesenkimatik): eskuineko zutabea L1–L3, ezkerrekoa L1–L2
      </Note>
      <Note x={500} y={624} tone="accent" show={fromBelow}>
        Aorta (lotailu arkutuaren azpitik) · beheko kaba (tendoian) · hestegorria
      </Note>

      <Label id="bularrezur-atala" x={796} y={104} ax={510} ay={104} />
      <Label id="zentro-tendinosoa" x={790} y={196} ax={640} ay={226} />
      <Label id="hestegorriaren-hiatoa" x={810} y={250} ax={ESO[0] + 16} ay={ESO[1] - 6} show={vis(t, 0.32)} />
      <Label id="hestegorria" x={810} y={286} ax={ESO[0] + 8} ay={ESO[1] + 4} show={vis(t, 0.32)} small />
      <Label id="erdiko-lotailu-arkutua" x={810} y={400} ax={522} ay={424} />
      <Label id="aortaren-hiatoa" x={810} y={448} ax={AORTA[0] + 22} ay={AORTA[1] + 6} />
      <Label id="aorta" x={810} y={492} ax={AORTA[0] + 12} ay={AORTA[1] + 4} small />
      <Label id="diafragma" x={810} y={548} ax={664} ay={451} />

      <Label id="beheko-kabaren-zuloa" x={190} y={180} ax={IVC[0] - 16} ay={IVC[1] - 6} show={vis(t, 0.32)} />
      <Label id="beheko-kaba-zaina" x={190} y={222} ax={IVC[0] - 8} ay={IVC[1] + 4} show={vis(t, 0.32)} small />
      <Label id="saihets-hezur-atala" x={190} y={400} ax={248} ay={392} />
      <Label id="gerriko-atala" x={190} y={448} ax={448} ay={430} />
      <Label id="diafragmaren-zutabeak" x={190} y={500} ax={CRUS_R[30][0] - 12} ay={CRUS_R[30][1]} />
      <Label id="ornoak" x={190} y={580} ax={458} ay={580} small />
    </g>
  );
}

// ——— Sagittal profile ———

const TORSO = spline([[370, 30], [630, 30], [706, 110], [724, 300], [708, 520], [650, 606], [372, 608], [306, 524], [288, 300], [306, 110]], 8, true);
const SPINE_X = 650;
const SPINE = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3'];
const spineY = (i: number) => 60 + i * 30;
/** The dome: anterior insertion (xiphoid, high) → apex → posterior insertion (L1–L3, low). */
const DOME = spline([[332, 334], [372, 282], [440, 252], [520, 258], [588, 300], [624, 360], [640, 420], [648, 474]], 12);
const DOME_U = { sternal: [0, 0.14], tendon: [0.2, 0.56], lumbar: [0.66, 1] } as const;

function domePart(u0: number, u1: number) {
  const r = resample(DOME, 201);
  return r.slice(Math.round(u0 * 200), Math.round(u1 * 200) + 1);
}

const PLEURA = spline([[410, 66], [520, 56], [618, 86], [640, 190], [638, 330], [618, 336], [590, 292], [530, 262], [496, 254], [520, 190], [476, 128], [420, 112]], 8, true);
const LUNG = offset(PLEURA, -9, true);
const PERI = spline([[372, 262], [376, 196], [420, 150], [486, 150], [520, 196], [516, 244], [440, 244]], 8, true);
const HEART = spline([[392, 246], [398, 200], [430, 170], [480, 168], [504, 200], [498, 236], [450, 240]], 8, true);
const PERITO = spline(
  [[338, 352], [376, 300], [440, 272], [520, 278], [584, 318], [604, 380], [604, 470], [592, 540], [556, 580], [384, 584], [334, 524], [324, 420]],
  8,
  true,
);

export function DiaphragmProfile({ t }: SceneProps) {
  const cav = vis(t, 0.7);
  const stroke = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <path d={poly(TORSO)} fill={P.wall} />
      <path d={poly(TORSO)} fill="url(#w7-mesench)" />
      <path d={poly(offset(TORSO, -16, true))} fill={P.space} />

      {/* Thorax: the pleural cavity (lung) behind and the pericardial cavity (heart) on the central tendon. */}
      <Part id="pleura-barrunbea">
        <path d={smoothPath(PLEURA, true, 0.3)} fill={P.pleura} stroke="#9fd0ff" strokeWidth={1.4} />
      </Part>
      <Part id="birikak">
        <path d={smoothPath(LUNG, true, 0.3)} fill={P.lung} opacity={0.8} />
        <path d={smoothPath(LUNG, true, 0.3)} fill="url(#w7-lung)" />
      </Part>
      <Part id="perikardio-barrunbea">
        <path d={smoothPath(PERI, true, 0.3)} fill={P.peri} stroke="#ffb3c4" strokeWidth={1.4} />
      </Part>
      <Part id="bihotza">
        <path d={smoothPath(HEART, true, 0.3)} fill={P.heart} stroke={P.heartDeep} strokeWidth={1.2} />
      </Part>

      {/* Abdomen: the peritoneal cavity does not fill it (a retroperitoneal kidney behind it). */}
      <Part id="peritoneo-barrunbea" show={cav}>
        <path d={smoothPath(PERITO, true, 0.3)} fill={P.perito} stroke="#7ed492" strokeWidth={1.2} />
      </Part>
      <Part id="giltzurruna" show={cav}>
        <ellipse cx={626} cy={478} rx={16} ry={32} fill="#b2485a" stroke="#6e1f2e" strokeWidth={1.2} />
      </Part>

      {/* Sternum and vertebrae. */}
      <Part id="ornoak" quiet>
        {SPINE.map((n, i) => (
          <rect key={n} x={SPINE_X - 2} y={spineY(i) - 11} width={44} height={22} rx={5} fill={P.bone} opacity={['L1', 'L2', 'L3'].includes(n) ? 0.95 : 0.6} />
        ))}
      </Part>
      {SPINE.map((n, i) =>
        ['T6', 'T12', 'L1', 'L3'].includes(n) ? (
          <Note key={n} x={SPINE_X + 64} y={spineY(i)} size={11} tone={n === 'L1' || n === 'L3' ? 'accent' : 'dim'}>
            {n}
          </Note>
        ) : null,
      )}
      <rect x={312} y={70} width={20} height={262} rx={8} fill={P.bone} opacity={0.9} />

      {/* The dome, with its parts. */}
      <Part id="diafragma">
        <path d={stroke(DOME)} fill="none" stroke={MUSCLE} strokeWidth={14} strokeLinecap="round" />
      </Part>
      <Part id="bularrezur-atala">
        <path d={stroke(domePart(...DOME_U.sternal))} fill="none" stroke="#c45a6a" strokeWidth={14} strokeLinecap="round" />
      </Part>
      <Part id="zentro-tendinosoa">
        <path d={stroke(domePart(...DOME_U.tendon))} fill="none" stroke="#e9e2d6" strokeWidth={12} strokeLinecap="round" />
      </Part>
      <Part id="gerriko-atala">
        <path d={stroke(domePart(...DOME_U.lumbar))} fill="none" stroke="#a8404f" strokeWidth={14} strokeLinecap="round" />
      </Part>
      <Mark id="bularrezur-atala" x={334} y={330} rx={22} show={vis(t, 0.62, 0.78)} />
      <Mark id="gerriko-atala" x={646} y={470} rx={22} show={vis(t, 0.62, 0.78)} />
      <path d={poly(TORSO)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={500} y={16} size={11.5}>
        aurrea ← → atzea
      </Note>
      <Note x={460} y={538} tone="accent" show={vis(t, 0.7)}>
        Abdomeneko barrunbea
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0, 0.78)}>
        Aurrean askoz gorago insertatzen da atzean baino
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.78, 0.9)}>
        Goian 2 pleura + perikardio barrunbea · behean peritoneo barrunbea, ez abdomen osoa
      </Note>
      <Note x={500} y={624} tone="accent" show={vis(t, 0.9)}>
        Laburpena: zeloma → perikardio, pleura eta peritoneo barrunbeak; espazio birtualak
      </Note>

      <Label id="perikardio-barrunbea" x={190} y={150} ax={386} ay={196} />
      <Label id="bihotza" x={190} y={196} ax={400} ay={222} small />
      <Label id="zentro-tendinosoa" x={190} y={250} ax={440} ay={252} />
      <Label id="bularrezur-atala" x={190} y={340} ax={326} ay={332} />
      <Label id="peritoneo-barrunbea" x={190} y={460} ax={340} ay={460} show={cav} />
      <Label id="pleura-barrunbea" x={796} y={110} ax={616} ay={120} />
      <Label id="birikak" x={810} y={170} ax={600} ay={190} small />
      <Label id="diafragma" x={810} y={260} ax={600} ay={318} />
      <Label id="giltzurruna" x={810} y={420} ax={638} ay={470} show={cav} small />
      <Label id="gerriko-atala" x={810} y={500} ax={652} ay={468} />
      <Label id="ornoak" x={810} y={560} ax={SPINE_X + 42} ay={spineY(14)} small />
    </g>
  );
}
