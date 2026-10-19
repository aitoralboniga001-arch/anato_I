'use client';

import { Label, Note, Part, lerp, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
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
const hits = new WeakMap<Pt[], Map<number, Pt>>();
function rayHit(curve: Pt[], deg: number): Pt {
  // The curves are fixed: each direction is searched once.
  let m = hits.get(curve);
  if (!m) hits.set(curve, (m = new Map()));
  let p = m.get(deg);
  if (!p) m.set(deg, (p = rayHitAt(curve, deg)));
  return p;
}
function rayHitAt(curve: Pt[], deg: number): Pt {
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
/** A lumbar vertebral body from below: wide, kidney-shaped, hollowed behind where the canal is. */
const BODY_V = 'M-42,-3 C-42,-17 -26,-19 0,-19 C26,-19 42,-17 42,-3 C42,12 30,19 17,19 C8,19 6,12 0,12 C-6,12 -8,19 -17,19 C-30,19 -42,12 -42,-3Z';
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
      <defs>
        <radialGradient id="w7-below-vert" cx="45%" cy="35%" r="75%">
          <stop offset="0" stopColor="#f6f0e2" />
          <stop offset="0.7" stopColor="#ddd3bd" />
          <stop offset="1" stopColor="#b3a88f" />
        </radialGradient>
      </defs>

      {/* Lumbar vertebrae behind the crura. */}
      <Part id="ornoak" quiet>
        {VERT.map((v, i) => (
          <g key={v.n} transform={`translate(500 ${v.y})`}>
            {/* Transverse processes, then the body (kidney-shaped, hollow behind for the canal), the disc below it. */}
            {[-1, 1].map((s) => (
              <path key={s} d={`M${s * 34},2 L${s * 66},${-2} L${s * 68},8 L${s * 34},12Z`} fill="#cfc6b2" stroke="#7d7462" strokeWidth={1} strokeLinejoin="round" />
            ))}
            {i < VERT.length - 1 && <rect x={-36} y={18} width={72} height={8} rx={3} fill="#9fb4c8" opacity={0.6} />}
            <path d={BODY_V} fill="url(#w7-below-vert)" stroke="#7d7462" strokeWidth={1.2} />
            <path d={BODY_V} fill="url(#w7-light)" />
          </g>
        ))}
      </Part>
      {VERT.map((v) => (
        <Note key={v.n} x={500} y={v.y} size={12.5}>
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
      <Note x={360} y={286} size={12.5} show={vis(t, 0, 0.16)}>
        eskuineko hostoa
      </Note>
      <Note x={500} y={186} size={12.5} show={vis(t, 0, 0.16)}>
        erdiko hostoa
      </Note>
      <Note x={640} y={286} size={12.5} show={vis(t, 0, 0.16)}>
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
      {/* Each opening's own edge, over the vessel through it: lit, the hole glows by its rim. */}
      <Part id="aortaren-hiatoa">
        <ellipse cx={AORTA[0]} cy={AORTA[1]} rx={23} ry={19} fill="none" stroke="#e8d2c0" strokeWidth={2.4} opacity={0.75} />
      </Part>
      <Part id="hestegorriaren-hiatoa">
        <ellipse cx={ESO[0]} cy={ESO[1]} rx={17} ry={13} fill="none" stroke="#e8d2c0" strokeWidth={2.4} opacity={0.75} />
      </Part>
      <Part id="beheko-kabaren-zuloa">
        <circle cx={IVC[0]} cy={IVC[1]} r={16} fill="none" stroke="#e8d2c0" strokeWidth={2.4} opacity={0.75} />
      </Part>
      {/* Over the hiatus' rim: the ligament arching over the aorta stays pickable while the hiatus is lit. */}
      <Part id="erdiko-lotailu-arkutua">
        <path d={`M466,452Q500,404 534,452`} fill="none" stroke="#efe6d6" strokeWidth={5} strokeLinecap="round" />
      </Part>

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
        Aorta (lotailu arkutuaren atzetik) · beheko kaba (tendoian) · hestegorria
      </Note>

      <Label id="bularrezur-atala" x={796} y={104} ax={510} ay={104} />
      <Label id="zentro-tendinosoa" x={790} y={196} ax={640} ay={226} />
      <Label id="hestegorriaren-hiatoa" x={810} y={250} ax={ESO[0] + 16} ay={ESO[1] - 6} />
      <Label id="hestegorria" x={810} y={286} ax={ESO[0] + 6} ay={ESO[1] + 2} small />
      <Label id="erdiko-lotailu-arkutua" x={810} y={400} ax={478} ay={438} />
      <Label id="aortaren-hiatoa" x={810} y={448} ax={AORTA[0] + 22} ay={AORTA[1] + 6} />
      <Label id="aorta" x={810} y={492} ax={AORTA[0] + 12} ay={AORTA[1] + 4} small />
      <Label id="diafragma" x={810} y={548} ax={664} ay={451} />

      <Label id="beheko-kabaren-zuloa" x={190} y={180} ax={IVC[0] - 15} ay={IVC[1] - 5} />
      <Label id="beheko-kaba-zaina" x={190} y={222} ax={IVC[0] - 6} ay={IVC[1] + 3} small />
      <Label id="saihets-hezur-atala" x={190} y={400} ax={248} ay={392} />
      <Label id="gerriko-atala" x={190} y={448} ax={478} ay={318} />
      <Label id="diafragmaren-zutabeak" x={190} y={500} ax={CRUS_R[30][0] - 6} ay={CRUS_R[30][1]} />
      <Label id="ornoak" x={190} y={580} ax={458} ay={580} small />
    </g>
  );
}

// ——— Sagittal profile ———

// Trunk in profile: chest in front (sternum), the abdominal wall bulging below the xiphoid, the back behind.
const TORSO = spline(
  [
    [338, 70], [368, 38], [414, 12], [424, -30], [592, -30], [604, 8], [662, 46], [704, 100], [720, 210], [714, 330], [696, 440], [706, 530], [670, 604],
    [372, 610], [314, 560], [298, 470], [310, 386], [322, 336], [316, 240], [320, 150],
  ],
  8,
  true,
);
/** Sternum down the front of the chest: manubrium, body, and the xiphoid process (where the sternal part inserts). */
const STERNUM = [
  { d: 'M341,66 L337,108', w: 22 },
  { d: 'M336,118 C333,180 332,240 334,288', w: 16 },
  { d: 'M334,296 L338,322', w: 8 },
];
/** The liver under the right half of the dome, the IVC running up through it. */
const LIVER = spline([[346, 340], [378, 294], [440, 266], [514, 270], [566, 298], [584, 328], [560, 352], [500, 372], [430, 394], [372, 402], [342, 382]], 8, true);
const SPINE_X = 650;
const SPINE = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'L1', 'L2', 'L3'];
const spineY = (i: number) => 60 + i * 30;
/** The dome: anterior insertion (xiphoid, high) → apex → posterior insertion (L1–L3, low). */
const DOME = spline([[332, 334], [372, 282], [440, 252], [520, 258], [588, 300], [624, 360], [640, 420], [648, 474]], 12);
const DOME_U = { sternal: [0, 0.14], tendon: [0.2, 0.56], lumbar: [0.66, 1] } as const;

/** The dome at the end of an inspiration: the insertions stay, the central tendon goes down and flattens. */
const DOME_IN = resample(DOME, 201).map((p, i) => [p[0], p[1] + 30 * Math.pow(Math.sin((Math.PI * i) / 200), 0.9)] as Pt);
/** Anything below `top` follows the dome down (lungs, pleura). */
const breathe = (pts: Pt[], top = 230, k = 0.3): Pt[] => pts.map(([x, y]) => [x, y + Math.max(0, Math.min(30, (y - top) * k))]);

function domePart(u0: number, u1: number, pts: Pt[] = DOME) {
  const r = resample(pts, 201);
  return r.slice(Math.round(u0 * 200), Math.round(u1 * 200) + 1);
}

const ESO_P = 'M566,40 C574,140 586,230 590,300 C592,330 588,350 574,372';
const AORTA_P = 'M462,170 C462,120 492,92 540,92 C590,92 618,116 622,160 C626,240 628,360 628,600';
const IVC_P = 'M600,600 C590,480 520,330 470,268 C462,256 456,248 450,240';
const PLEURA = spline([[410, 66], [520, 56], [618, 86], [640, 190], [638, 330], [618, 336], [590, 292], [530, 262], [496, 254], [520, 190], [476, 128], [420, 112]], 8, true);
const LUNG = offset(PLEURA, -9, true);
const PERI = spline([[372, 262], [376, 196], [420, 150], [486, 150], [520, 196], [516, 244], [440, 244]], 8, true);
const HEART = spline([[392, 246], [398, 200], [430, 170], [480, 168], [504, 200], [498, 236], [450, 240]], 8, true);
const PERITO = spline(
  [[338, 352], [376, 300], [440, 272], [520, 278], [584, 318], [604, 380], [604, 470], [592, 540], [556, 580], [384, 584], [334, 524], [324, 420]],
  8,
  true,
);

export function DiaphragmProfile({ t, reduced }: SceneProps) {
  const cav = vis(t, 0.7);
  const stroke = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`;
  // Breathing: the dome contracts (goes down, flattens) and the lungs fill the space; the heart rides on the tendon.
  const breath = !reduced;
  const B = { dur: '4.2s', repeatCount: 'indefinite', calcMode: 'spline', keyTimes: '0;0.45;1', keySplines: '0.4 0 0.6 1;0.4 0 0.6 1' } as const;
  const anim = (a: string, b: string) => (breath ? <animate attributeName="d" values={`${a};${b};${a}`} {...B} /> : null);
  const dome = resample(DOME, 201);
  const sp = (pts: Pt[]) => smoothPath(pts, true, 0.3);
  return (
    <g>
      <Defs7 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        <linearGradient id="w7-adult-vert" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b3a88f" />
          <stop offset="0.45" stopColor="#f1eadb" />
          <stop offset="1" stopColor="#a39880" />
        </linearGradient>
        <radialGradient id="w7-adult-heart" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ec6378" />
          <stop offset="0.6" stopColor="#c62d42" />
          <stop offset="1" stopColor="#7d1527" />
        </radialGradient>
      </defs>
      {/* The wall is the ring only: the room inside it is the cavities and organs, each named on its own. */}
      <Part id="gorputz-pareta" quiet>
        <path d={`${poly(TORSO)}${poly([...offset(TORSO, -16, true)].reverse())}`} fill={P.wall} fillRule="evenodd" />
        <path d={`${poly(TORSO)}${poly([...offset(TORSO, -16, true)].reverse())}`} fill="url(#w7-mesench)" fillRule="evenodd" />
      </Part>
      <path d={poly(offset(TORSO, -16, true))} fill={P.space} pointerEvents="none" />

      {/* Thorax: the pleural cavity (lung) behind and the pericardial cavity (heart) on the central tendon. */}
      {/* Oesophagus behind the heart, through its hiatus to the stomach; aorta (arch, then down in front of the column); IVC up through the tendon. */}
      {/* The liver under the dome: it goes down with it at each breath. */}
      <Part id="gibela" quiet>
        <g>
          {breath && <animateTransform attributeName="transform" type="translate" values="0 0;0 22;0 0" {...B} />}
          <path d={sp(LIVER)} fill="#8d3a34" stroke="#4d1714" strokeWidth={1.4} />
          <path d={sp(LIVER)} fill="url(#w7-light)" />
        </g>
      </Part>
      <Part id="hestegorria">
        <path d={ESO_P} fill="none" stroke="#6a4c16" strokeWidth={13} strokeLinecap="round" />
        <path d={ESO_P} fill="none" stroke="#d9ab3c" strokeWidth={9} strokeLinecap="round" />
      </Part>
      <Part id="giltzurruna" show={cav}>
        <ellipse cx={626} cy={478} rx={16} ry={32} fill="#b2485a" stroke="#6e1f2e" strokeWidth={1.2} />
      </Part>
      <Part id="aorta">
        <path d={AORTA_P} fill="none" stroke="#7a0f1e" strokeWidth={15} strokeLinecap="round" />
        <path d={AORTA_P} fill="none" stroke={P.aorta} strokeWidth={11} strokeLinecap="round" />
      </Part>
      <Part id="beheko-kaba-zaina">
        <path d={IVC_P} fill="none" stroke="#1c3c88" strokeWidth={14} strokeLinecap="round" />
        <path d={IVC_P} fill="none" stroke={P.ivc} strokeWidth={10} strokeLinecap="round" />
      </Part>
      <Part id="pleura-barrunbea">
        <path d={sp(PLEURA)} fill={P.pleura} stroke="#9fd0ff" strokeWidth={1.4}>
          {anim(sp(PLEURA), sp(breathe(PLEURA)))}
        </path>
      </Part>
      <Part id="birikak">
        <path d={sp(LUNG)} fill={P.lung} opacity={0.8}>
          {anim(sp(LUNG), sp(breathe(LUNG)))}
        </path>
        <path d={sp(LUNG)} fill="url(#w7-lung)">
          {anim(sp(LUNG), sp(breathe(LUNG)))}
        </path>
      </Part>
      <g>
        {breath && <animateTransform attributeName="transform" type="translate" values="0 0;0 12;0 0" {...B} />}
        <Part id="perikardio-barrunbea">
          <path d={smoothPath(PERI, true, 0.3)} fill={P.peri} stroke="#ffb3c4" strokeWidth={1.4} />
        </Part>
        <Part id="bihotza">
          <path d={smoothPath(HEART, true, 0.3)} fill="url(#w7-adult-heart)" stroke={P.heartDeep} strokeWidth={1.4} />
          <path d="M404,214 C420,196 446,188 470,192" fill="none" stroke="#7d1527" strokeWidth={1.4} opacity={0.6} />
          <ellipse cx={428} cy={196} rx={16} ry={9} fill="#fff" opacity={0.12} />
        </Part>
      </g>

      {/* Abdomen: the peritoneal cavity does not fill it (a retroperitoneal kidney behind it). */}
      <Part id="peritoneo-barrunbea" show={cav}>
        <path d={smoothPath(PERITO, true, 0.3)} fill={P.perito} stroke="#7ed492" strokeWidth={1.2} />
      </Part>

      {/* Sternum and vertebrae. */}
      <Part id="ornoak" quiet>
        {SPINE.map((n, i) => {
          const y = spineY(i);
          const lumbar = i >= 12;
          const h = lumbar ? 24 : 21;
          // Body in front, the intervertebral disc below it, the spinous process down and back.
          const spine = lumbar ? `M${SPINE_X + 40},${y - 7} L${SPINE_X + 56},${y - 5} L${SPINE_X + 57},${y + 7} L${SPINE_X + 40},${y + 6}Z` : `M${SPINE_X + 40},${y - 6} L${SPINE_X + 52},${y - 1} L${SPINE_X + 54},${y + 16} L${SPINE_X + 46},${y + 12} L${SPINE_X + 40},${y + 5}Z`;
          return (
            <g key={n} opacity={['L1', 'L2', 'L3'].includes(n) ? 1 : 0.78}>
              <path d={spine} fill={P.bone} stroke="#7d7462" strokeWidth={1} />
              {i < SPINE.length - 1 && <rect x={SPINE_X} y={y + h / 2} width={40} height={30 - h} rx={2} fill="#9fb4c8" opacity={0.55} />}
              <rect x={SPINE_X - 2} y={y - h / 2} width={44} height={h} rx={4} fill="url(#w7-adult-vert)" stroke="#7d7462" strokeWidth={1} />
            </g>
          );
        })}
      </Part>
      {SPINE.map((n, i) =>
        ['T6', 'T12', 'L1', 'L3'].includes(n) ? (
          <Note key={n} x={SPINE_X + 96} y={spineY(i)} size={12.5} tone={n === 'L1' || n === 'L3' ? 'accent' : 'dim'}>
            {n}
          </Note>
        ) : null,
      )}
      <Part id="esternoia" quiet>
        {STERNUM.map((b, i) => (
          <path key={`o${i}`} d={b.d} fill="none" stroke="#7d7462" strokeWidth={b.w + 2.4} strokeLinecap="round" />
        ))}
        {STERNUM.map((b, i) => (
          <path key={i} d={b.d} fill="none" stroke={P.bone} strokeWidth={b.w} strokeLinecap="round" />
        ))}
      </Part>

      {/* The dome, with its parts. */}
      <Part id="diafragma">
        <path d={stroke(dome)} fill="none" stroke={MUSCLE} strokeWidth={14} strokeLinecap="round">
          {anim(stroke(dome), stroke(DOME_IN))}
        </path>
      </Part>
      <Part id="bularrezur-atala">
        <path d={stroke(domePart(...DOME_U.sternal))} fill="none" stroke="#c45a6a" strokeWidth={14} strokeLinecap="round">
          {anim(stroke(domePart(...DOME_U.sternal)), stroke(domePart(...DOME_U.sternal, DOME_IN)))}
        </path>
      </Part>
      <Part id="zentro-tendinosoa">
        <path d={stroke(domePart(...DOME_U.tendon))} fill="none" stroke="#e9e2d6" strokeWidth={12} strokeLinecap="round">
          {anim(stroke(domePart(...DOME_U.tendon)), stroke(domePart(...DOME_U.tendon, DOME_IN)))}
        </path>
      </Part>
      <Part id="gerriko-atala">
        <path d={stroke(domePart(...DOME_U.lumbar))} fill="none" stroke="#a8404f" strokeWidth={14} strokeLinecap="round">
          {anim(stroke(domePart(...DOME_U.lumbar)), stroke(domePart(...DOME_U.lumbar, DOME_IN)))}
        </path>
      </Part>
      <path d={poly(TORSO)} fill="url(#w7-light)" pointerEvents="none" />

      <Note x={250} y={16} size={13}>
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
      <Label id="bularrezur-atala" x={190} y={358} ax={326} ay={332} />
      <Label id="beheko-kaba-zaina" x={190} y={400} ax={471} ay={265} small />
      <Label id="peritoneo-barrunbea" x={190} y={460} ax={340} ay={460} show={cav} />
      <Label id="pleura-barrunbea" x={796} y={110} ax={628} ay={120} />
      <Label id="birikak" x={810} y={170} ax={600} ay={190} small />
      <Label id="hestegorria" x={810} y={194} ax={590} ay={322} small />
      <Label id="diafragma" x={810} y={260} ax={595} ay={309} />
      <Label id="giltzurruna" x={810} y={420} ax={618} ay={500} show={cav} small />
      <Label id="aorta" x={810} y={460} ax={628} ay={540} small />
      <Label id="gerriko-atala" x={810} y={500} ax={652} ay={468} />
      <Label id="ornoak" x={810} y={560} ax={SPINE_X + 42} ay={spineY(14)} small />
    </g>
  );
}
