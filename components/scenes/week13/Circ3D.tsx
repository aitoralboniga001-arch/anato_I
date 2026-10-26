'use client';

import { mixHex } from '@/components/scenes/week10/model3d';
import type { V3 } from '@/lib/three-d/math';
import { ADULT, VC, type VeinPose } from './veins3d';
import { CS0, circModel, satColour, type CircState } from './circulation3d';
import { ORIGIN_KEY13, orbit, veinStage, type Flow, type StageSpec } from './common';

/**
 * Topic 13, stages 13–15 (notes 4.1–4.3): the circulation before birth, the changes at birth and the
 * circulation after it. One frame for all three: the venous model of the earlier stages (now carrying blood
 * colours, not origins) with the four-chamber heart, the arteries, the lungs, the cord and the placenta
 * of circulation3d.ts. Saturation is the share of red cells in each stream; the notes give two numbers (80 % in the
 * umbilical vein, about 58 % in the umbilical arteries) and those are the only ones written.
 */

const SH: [number, number] = [30, 0];

/** The venous side at term: everything in its adult place, but the left umbilical vein and the ductus venosus still open. */
const TERM: VeinPose = { ...ADULT, sinus: 0, intercostal: 0, teres: 0, venosum: 0, colour: 0, names: { ...ADULT.names } };
const VOPTS = { heart: 0, liverOp: 0.42, gut: 0.15, kidneys: 0.55, ghosts: 0, glass: 0.55 };

/** Vein walls by what they are (umbilical red, the rest blue; the cells carry the mixing, never a purple wall), turning grey as they close. */
const blood = (pose: VeinPose) => {
  return { 'gibeleko-lotailu-borobila': VC.ligament, 'gibeleko-lotailu-benosoa': VC.ligament, 'ezkerreko-zilbor-zaina': mixHex(VC.o2, VC.ligament, pose.teres), 'hodi-benosoa': mixHex(VC.o2, VC.ligament, pose.venosum) };
};

/** The IVC below the ductus venosus' junction (its blood is still venous) and above it. */
function circExtra(_t: number, _pose: VeinPose, opts: { dim?: { ids: readonly string[]; k: number } | null; glass?: number }, lines: Record<string, V3[]>, x: Record<string, number>) {
  const m = circModel(x as unknown as CircState, { dim: opts.dim, glass: opts.glass });
  const hc = lines['hcR'] ?? [];
  const cut = Math.max(1, hc.findIndex((p) => p[1] > -1.2));
  return { items: m.items, pts: m.pts, lines: { ...m.lines, ivcLow: hc.slice(0, cut + 1), uaR: m.lines.uaR, uaL: m.lines.uaL } };
}

const base = (S: readonly number[]): Pick<StageSpec, 'S' | 'pose' | 'opts' | 'extra' | 'blood' | 'key' | 'dimStrength' | 'cellGap'> => ({
  S,
  pose: TERM,
  opts: VOPTS,
  extra: circExtra,
  blood,
  key: ORIGIN_KEY13.blood,
  dimStrength: 0.62,
  cellGap: 0.42,
});

// Cameras (x = the embryo's left; negative yaw = from its right side, so the placenta stands clear in front).
const C_ALL = orbit(-42, 9, 26, [0, -2.6, 1.8], SH);
const C_CORD = orbit(-55, 6, 13, [0, -4.6, 2.6], SH);
const C_LIVER = orbit(-28, 12, 9, [-0.05, -1.55, 0.25], SH);
const C_HEART = orbit(-22, 8, 8, [0, -0.2, 0.4], SH);
const C_ATRIA = orbit(-78, 8, 6.2, [-0.25, 0.12, -0.05], SH);
const C_GREAT = orbit(-28, 14, 9.5, [0.1, 0.75, 0.15], SH);
const C_HEAD = orbit(-30, 10, 13, [0, 1.6, 0], SH);
const C_PELVIS = orbit(-62, 5, 11.5, [0, -5.3, 1.2], SH);
const C_LUNGS = orbit(-12, 10, 11, [0, 0.45, -0.1], SH);

// Blood (the share of red cells = the saturation of the stream).
const UV: Flow = { path: ['cordV', 'umbDistL', 'dv'], sat: 0.8, n: 16 };
const IVC_LOW: Flow = { path: ['-sacroDistR', '-sacroProxR', '-subLowR', '-subUpR', 'hepSub', 'ivcLow'], sat: 0.1, n: 14 };
const PORTAL: Flow = { path: ['-smv', 'vitPeriR', 'vitHepR'], sat: 0.1, n: 10 };
const MIXED_UP: Flow = { path: ['hcUpR'], sat: 0.68, n: 10 };
const FO_PATH: Flow = { path: ['hcUpR', 'raFo'], sat: 0.68, n: 18 };
const TO_AORTA: Flow = { path: ['raFo', 'asc', 'arch', 'desc'], sat: 0.68, n: 22 };
const HEAD: Flow[] = [
  { path: ['asc', 'bct'], sat: 0.68, n: 12 },
  { path: ['asc', 'arch'], sat: 0.68, n: 8 },
];
const SVC: Flow = { path: ['-acTopR', '-acMidR', '-acLowR', '-commonR'], sat: 0.1, n: 14 };
const TO_RV: Flow = { path: ['-acLowR', '-commonR', 'raRv'], sat: 0.15, n: 14 };
const TO_PT: Flow = { path: ['raRv', 'pt'], sat: 0.15, n: 14 };
const DUCT: Flow = { path: ['pt', 'da', 'desc'], sat: 0.2, n: 18 };
const LUNG_TRICKLE: Flow[] = [
  { path: ['pt', 'lpa'], sat: 0.15, n: 3, speed: 0.6 },
  { path: ['pt', 'rpa'], sat: 0.15, n: 3, speed: 0.6 },
];
const DESC: Flow = { path: ['desc'], sat: 0.58, n: 14 };
const TO_PLACENTA: Flow[] = [
  { path: ['desc', 'ciaR', 'iiaR', 'uaR', 'cordAR'], sat: 0.58, n: 16 },
  { path: ['desc', 'ciaL', 'iiaL', 'uaL', 'cordAL'], sat: 0.58, n: 16 },
];

const F_NAMES = {
  placenta: { id: 'karena', text: 'Karena' },
  uv: { id: 'ezkerreko-zilbor-zaina', p: 'zilbor-zainak-cord', text: 'Ezkerreko zilborreko zaina' },
  dv: { id: 'hodi-benosoa', sub: '(gibelaren azalean)' },
};

// ———————————————————————————— stage 13: before birth (notes 4.1) ————————————————————————————

export const S13 = [0, 0.08, 0.16, 0.24, 0.32, 0.41, 0.5, 0.58, 0.66, 0.75, 0.84, 0.92] as const;

export const Fetal3D = veinStage({
  ...base(S13),
  x0: { ...CS0 },
  caption: 'Jaio aurreko zirkulazioa',
  steps: [
    {
      cam: C_ALL,
      dim: ['karena', 'zilbor-zainak', 'ezkerreko-zilbor-zaina', 'hodi-benosoa', 'beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'behin-betiko-zilbor-hestea'],
      names: [F_NAMES.placenta, F_NAMES.uv, F_NAMES.dv, { id: 'beheko-kaba-zaina', p: 'kabaren-giltzurrun-segmentua', from: 0.2 }],
      note: 'Karenako odol oxigenatua (%80) ezkerreko zilborreko zainetik itzultzen da; hodi benosoak beheko bena kabarekin lotzen du',
      marks: [{ p: 'zilbor-zainak-cord', text: '%80', dy: -16 }],
      flows: [UV],
    },
    {
      cam: C_LIVER,
      glide: 0.06,
      dim: ['hodi-benosoa', 'ezkerreko-zilbor-zaina', 'kabaren-gibel-segmentua', 'gibela', 'beheko-kaba-zaina'],
      names: [F_NAMES.dv, { id: 'gibela', small: true }, { id: 'kabaren-gibel-segmentua', text: 'Hodi hepatokardiakoa', sub: '→ beheko kabaren gibel segmentua', from: 0.4 }],
      note: 'Odol gehiena gibelaren azaleko hodi benosotik hodi hepatokardiakora, eta hortik beheko bena kabara',
      flows: [UV, MIXED_UP],
    },
    {
      cam: orbit(-35, 6, 11, [-0.1, -2.4, 0.1], SH),
      glide: 0.06,
      dim: ['beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'kabaren-giltzurrun-segmentua', 'hodi-benosoa', 'ezkerreko-giltzurrun-zaina', 'giltzurruna'],
      names: [{ id: 'beheko-kaba-zaina', p: 'kabaren-giltzurrun-segmentua' }, { id: 'giltzurruna', small: true }, F_NAMES.dv],
      note: 'Odol nahasketa: zilborreko odol oxigenatua eta beheko bena kabatik (giltzurrunetatik…) igotzen den oxigeno gutxikoa',
      flows: [UV, IVC_LOW, MIXED_UP],
    },
    {
      cam: C_LIVER,
      glide: 0.06,
      dim: ['porta-zaina', 'gibela', 'kabaren-gibel-segmentua', 'hodi-benosoa', 'beheko-kaba-zaina'],
      names: ['porta-zaina', { id: 'gibela', small: true }, { id: 'kabaren-gibel-segmentua', text: 'Beheko bena kaba', sub: '(odol nahastua)' }],
      note: 'Bena portaren odol desoxigenatuarekin ere nahasten da (gibeletik pasatzen dena): oxigeno kontzentrazioa jaisten da',
      flows: [UV, PORTAL, IVC_LOW, MIXED_UP],
    },
    {
      cam: C_ATRIA,
      glide: 0.07,
      dim: ['eskuineko-aurikula', 'ezkerreko-aurikula-jaiotakoan', 'zulo-obala', 'zulo-obalaren-balbula', 'septum-primum', 'septum-secundum', 'aurikula-arteko-trenkada', 'kabaren-gibel-segmentua'],
      names: ['eskuineko-aurikula', { id: 'zulo-obala', from: 0.3 }, { id: 'zulo-obalaren-balbula', sub: '(septum primum)', small: true, from: 0.45 }, { id: 'septum-secundum', small: true, from: 0.45 }, { id: 'ezkerreko-aurikula-jaiotakoan', from: 0.25 }],
      note: 'Nahastutako odola eskuineko aurikulara; gehiena (ez osoa) zulo obaletik ezkerreko aurikulara',
      flows: [FO_PATH],
    },
    {
      cam: C_GREAT,
      glide: 0.07,
      dim: ['ezkerreko-aurikula-jaiotakoan', 'ezkerreko-zulo-ab', 'ezkerreko-bentrikulua', 'aorta', 'goranzko-aorta', 'aortaren-makoa', 'beheranzko-aorta'],
      names: [{ id: 'ezkerreko-zulo-ab', small: true }, 'ezkerreko-bentrikulua', { id: 'goranzko-aorta', from: 0.15 }, { id: 'aortaren-makoa', from: 0.2 }, { id: 'beheranzko-aorta', from: 0.25 }],
      note: 'Ezkerreko zulo aurikulobentrikularretik ezkerreko bentrikulura, eta aortatik gorputz osora (goranzkoa, makoa, beheranzkoa)',
      flows: [TO_AORTA, ...HEAD],
    },
    {
      cam: orbit(-60, 18, 6.8, [-0.45, 0.2, 0.0], SH),
      glide: 0.07,
      dim: ['eskuineko-aurikula', 'septum-secundum', 'goiko-kaba-zaina', 'zulo-obala', 'aurikula-arteko-trenkada', 'kabaren-gibel-segmentua'],
      names: [{ id: 'septum-secundum', sub: '(beheko atala)' }, { id: 'goiko-kaba-zaina', p: 'goiko-kabaren-bukaerako-atala' }, { id: 'eskuineko-aurikula', small: true }],
      note: 'Kantitate txiki bat eskuineko aurikulan geratzen da (septum secundumaren beheko atala) eta goiko bena kabako odolarekin nahasten da',
      flows: [FO_PATH, SVC, { path: ['hcUpR', 'raRv'], sat: 0.68, n: 4 }],
    },
    {
      cam: C_HEART,
      glide: 0.07,
      dim: ['eskuineko-aurikula', 'eskuineko-zulo-ab', 'eskuineko-bentrikulua', 'birika-enborra', 'birika-arteria'],
      names: [{ id: 'eskuineko-zulo-ab', small: true }, 'eskuineko-bentrikulua', { id: 'birika-enborra', from: 0.4 }],
      note: 'Eskuineko zulo aurikulobentrikularretik eskuineko bentrikulura, eta birika enborretik irteten da',
      flows: [TO_RV, TO_PT],
    },
    {
      cam: C_GREAT,
      glide: 0.07,
      dim: ['birika-enborra', 'birika-arteria', 'birikak', 'hodi-arteriosoa', 'beheranzko-aorta', 'aorta'],
      names: [{ id: 'birikak', p: 'birikakR', text: 'Birikak', sub: '(erresistentzia handia)' }, { id: 'birika-arteria', small: true }, { id: 'hodi-arteriosoa', from: 0.3 }],
      note: 'Biriketan erresistentzia handia: odol gutxi heltzen da; gehiena hodi arteriosotik aortara pasatzen da',
      flows: [TO_PT, DUCT, ...LUNG_TRICKLE],
    },
    {
      cam: C_HEAD,
      glide: 0.07,
      dim: ['enbor-brakiozefalikoa', 'karotida-komuna', 'ezkerreko-subklabioa', 'aortaren-makoa', 'goranzko-aorta', 'hodi-arteriosoa', 'beheranzko-aorta', 'aorta'],
      names: [{ id: 'enbor-brakiozefalikoa', small: true }, { id: 'karotida-komuna', text: 'Ezkerreko karotida komuna', small: true }, 'hodi-arteriosoa', { id: 'beheranzko-aorta', sub: '(oxigeno gutxiago)', from: 0.4 }],
      note: 'Odol aberatsena aortaren lehen adarretatik burura; beherantz doana hodi arteriosokoarekin nahasten da eta saturazioa asko jaisten da',
      flows: [...HEAD, { path: ['asc', 'arch', 'lcc'], sat: 0.68, n: 8 }, DUCT, DESC],
    },
    {
      cam: orbit(-60, 6, 13.5, [0, -5.8, 1.9], SH),
      glide: 0.07,
      dim: ['zilbor-arteriak', 'beheranzko-aorta', 'karena', 'behin-betiko-zilbor-hestea', 'arteria-iliako-primitiboak', 'barneko-arteria-iliakoa', 'gernu-maskuria'],
      names: [{ id: 'zilbor-arteriak', p: 'zilbor-arteriakR', text: 'Zilborreko arteriak' }, { id: 'gernu-maskuria', small: true }, { id: 'karena', from: 0.2 }],
      note: 'Zilborreko arterietako odola (%58 inguru) karenara itzultzen da berriz oxigenatzeko',
      marks: [{ p: 'zilbor-arteriakR', text: '%58', dx: -18, dy: -12 }],
      flows: [DESC, ...TO_PLACENTA],
    },
    {
      cam: orbit(-20, 4, 9, [0, -5.4, -0.2], SH),
      glide: 0.07,
      dim: ['zilbor-arteriak', 'barneko-arteria-iliakoa', 'arteria-iliako-primitiboak', 'beheranzko-aorta'],
      names: [{ id: 'arteria-iliako-primitiboak', p: 'arteria-iliako-primitiboakR', text: 'Arteria iliako komuna' }, { id: 'barneko-arteria-iliakoa', p: 'barneko-arteria-iliakoaR', sub: '(barneko adarra)' }, { id: 'zilbor-arteriak', p: 'zilbor-arteriakR', small: true }],
      note: 'Hasieran aortatik zuzenean; gero arteria iliako komunaren barneko adarretik (gerriko 5. arteria segmentua) irteten dira',
      flows: TO_PLACENTA,
    },
  ],
});

// ———————————————————————————— stage 14: at birth (notes 4.2) ————————————————————————————

export const S14 = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] as const;

const PV_IN: Flow[] = [
  { path: ['pvL1', 'laLv'], sat: 1, n: 8 },
  { path: ['pvR1', 'laLv'], sat: 1, n: 8 },
];
const TO_LUNGS: Flow[] = [
  { path: ['raRv', 'pt', 'lpa'], sat: 0.1, n: 10 },
  { path: ['raRv', 'pt', 'rpa'], sat: 0.1, n: 10 },
];

export const Birth3D = veinStage({
  ...base(S14),
  x0: { ...CS0 },
  caption: 'Jaiotzaren momentuko aldaketak',
  steps: [
    {
      x: { lungs: 1 },
      run: [0.1, 0.6],
      cam: C_LUNGS,
      glide: 0.07,
      dim: ['birikak', 'birika-arteria', 'birika-enborra', 'birika-zainak', 'ezkerreko-aurikula-jaiotakoan'],
      names: [{ id: 'birikak', p: 'birikakR' }, { id: 'birika-arteria', small: true }, { id: 'birika-zainak', small: true, from: 0.2 }],
      note: 'Jaiotza momentuan birika zirkulazioa hasten da',
      flows: [...TO_LUNGS, ...PV_IN],
    },
    {
      x: { uaClose: 0.42 },
      cam: C_PELVIS,
      glide: 0.07,
      dim: ['zilbor-arteriak', 'gernu-maskuria', 'barneko-arteria-iliakoa', 'behin-betiko-zilbor-hestea'],
      names: [{ id: 'zilbor-arteriak', p: 'zilbor-arteriakR', text: 'Zilborreko arteriak', sub: '(muskulu lisoa uzkurtzen da)' }],
      note: 'Jaiotzaren 2–3 minutuetara zilborreko arterien muskulu lisoa uzkurtzen da eta arteriak ixten dira',
      flows: [{ ...TO_PLACENTA[0], n: 6, speed: 0.4 }, { ...TO_PLACENTA[1], n: 6, speed: 0.4 }],
    },
    {
      x: { uaClose: 1, cord: 0 },
      cam: C_PELVIS,
      dim: ['erdialdeko-zilbor-lotailua', 'zilbor-arteriak', 'gernu-maskuria'],
      names: [{ id: 'erdialdeko-zilbor-lotailua', p: 'erdialdeko-zilbor-lotailuaR', text: 'Zilborreko erdialdeko lotailuak', sub: '(urrutiko atala, fibrosia)', from: 0.4 }],
      note: 'Urrutiko atala: zilborreko erdialdeko lotailuak (fibrosia, jaio osteko hilabeteetan)',
    },
    {
      cam: orbit(-60, 4, 8, [0, -6.0, 0.3], SH),
      glide: 0.07,
      dim: ['goiko-gernu-maskuri-arteria', 'barneko-arteria-iliakoa', 'gernu-maskuria', 'erdialdeko-zilbor-lotailua'],
      names: [{ id: 'goiko-gernu-maskuri-arteria', p: 'goiko-gernu-maskuri-arteriaR', sub: '(hurbileko atala)' }, { id: 'barneko-arteria-iliakoa', p: 'barneko-arteria-iliakoaR', small: true }, { id: 'gernu-maskuria', small: true }],
      note: 'Hurbileko atala irekita geratzen da: goiko gernu maskuriaren arteriak, barneko arteria iliakoen zatiak',
      flows: [{ path: ['desc', 'ciaR', 'iiaR', 'uaR'], sat: 1, n: 6, speed: 0.6 }],
    },
    {
      to: { teres: 1 },
      cam: orbit(-20, 4, 10, [0.1, -2.8, 0.9], SH),
      glide: 0.07,
      dim: ['gibeleko-lotailu-borobila', 'ezkerreko-zilbor-zaina', 'zilbor-zainak', 'gibela', 'hodi-benosoa'],
      names: [{ id: 'gibeleko-lotailu-borobila', p: 'zilbor-zainakL', text: 'Gibeleko lotailu borobila', sub: '(gibeletik zilborrera)', from: 0.5 }, { id: 'gibela', small: true }],
      note: 'Ezkerreko zilborreko zaina ixten da (minutuetan): gibeleko lotailu borobila',
    },
    {
      to: { venosum: 1 },
      cam: orbit(168, -28, 9.5, [0.0, -1.7, 0.1], SH),
      glide: 0.08,
      dim: ['gibeleko-lotailu-benosoa', 'hodi-benosoa', 'gibela', 'kabaren-gibel-segmentua'],
      names: [{ id: 'gibeleko-lotailu-benosoa', sub: '(gibelaren azalean)', from: 0.45 }, { id: 'gibela', small: true }],
      note: 'Hodi benosoa ere ixten da: gibeleko lotailu benosoa, gibelaren azalean',
    },
    {
      x: { daClose: 1 },
      cam: C_GREAT,
      glide: 0.08,
      dim: ['lotailu-arteriosoa', 'hodi-arteriosoa', 'birika-enborra', 'birika-arteria', 'aortaren-makoa', 'beheranzko-aorta', 'aorta'],
      names: [{ id: 'lotailu-arteriosoa', sub: '(2–3 hilabete beranduago)', from: 0.45 }, { id: 'birika-enborra', small: true }, { id: 'aortaren-makoa', small: true }],
      note: 'Hodi arteriosoa ixten da: lotailu arteriosoa. Birika arteriaren eta aortaren arteko komunikazioa eteten da',
      flows: TO_LUNGS,
    },
    {
      x: { press: 1 },
      cam: C_ATRIA,
      glide: 0.08,
      dim: ['zulo-obalaren-balbula', 'septum-primum', 'septum-secundum', 'ezkerreko-aurikula-jaiotakoan', 'eskuineko-aurikula', 'zulo-obala', 'birika-zainak'],
      names: [{ id: 'ezkerreko-aurikula-jaiotakoan', sub: '(presioa igotzen da)' }, { id: 'zulo-obalaren-balbula', sub: '(septum primum)' }, { id: 'septum-secundum', small: true }],
      note: 'Ezkerreko aurikularen presioa handitzen da: zulo obalaren balbula septum secundumaren aurka bultzatzen du',
      flows: PV_IN,
    },
    {
      x: { fuse: 1 },
      cam: C_ATRIA,
      dim: ['aurikula-arteko-trenkada', 'septum-primum', 'septum-secundum', 'zulo-obalaren-balbula'],
      names: [{ id: 'aurikula-arteko-trenkada', p: 'zulo-obalaren-balbula', text: 'Aurikula arteko trenkada', sub: '(primum + secundum fusionatuta)', from: 0.3 }],
      note: 'Septum primuma eta secunduma poliki fusionatzen dira (urtebete inguru): aurikulen arteko komunikazioa ixten da',
    },
    {
      x: { patent: 1, fuse: 0.55 },
      run: [0.06, 0.4],
      cam: C_ATRIA,
      dim: ['zulo-obala', 'aurikula-arteko-trenkada', 'septum-secundum', 'zulo-obalaren-balbula'],
      names: [{ id: 'zulo-obala', sub: '(%20an iragazkor)', from: 0.3 }],
      note: 'Hala ere, kasuen %20an komunikazioa iragazkor geratzen da: odol apur bat eskuinetik ezkerrera',
      flows: [{ path: ['hcUpR', 'raFo'], sat: 0.1, n: 3, speed: 0.5, from: 0.4 }],
    },
  ],
});

// ———————————————————————————— stage 15: after birth (notes 4.3) ————————————————————————————

export const S15 = [0, 0.11, 0.22, 0.33, 0.45, 0.56, 0.67, 0.78, 0.89] as const;

const BORN: Partial<CircState> = { lungs: 1, uaClose: 1, daClose: 1, press: 1, fuse: 1, patent: 0, cord: 0 };
const BORN_V: VeinPose = { ...TERM, teres: 1, venosum: 1 };
const VEINS_IN: Flow[] = [
  { path: ['-acTopR', '-acMidR', '-acLowR', '-commonR'], sat: 0.05, n: 12 },
  { path: ['-sacroDistR', '-sacroProxR', '-subLowR', '-subUpR', 'hepSub', 'hcR'], sat: 0.05, n: 14 },
];
const OUT_RED: Flow[] = [
  { path: ['laLv', 'asc', 'arch', 'desc'], sat: 1, n: 22 },
  { path: ['asc', 'bct'], sat: 1, n: 10 },
];

export const Postnatal3D = veinStage({
  S: S15,
  pose: BORN_V,
  opts: VOPTS,
  extra: circExtra,
  blood,
  key: ORIGIN_KEY13.blood,
  dimStrength: 0.62,
  cellGap: 0.42,
  x0: { ...CS0, ...BORN },
  caption: 'Jaio osteko zirkulazioa',
  steps: [
    {
      cam: C_HEART,
      glide: 0.07,
      dim: ['goiko-kaba-zaina', 'beheko-kaba-zaina', 'kabaren-gibel-segmentua', 'eskuineko-aurikula'],
      names: [{ id: 'goiko-kaba-zaina', p: 'goiko-kabaren-bukaerako-atala' }, { id: 'beheko-kaba-zaina', p: 'kabaren-gibel-segmentua' }, { id: 'eskuineko-aurikula', from: 0.4 }],
      note: 'Gorputzaren zain odol guztia goiko eta beheko bena kaben bidez eskuineko aurikulara',
      flows: VEINS_IN,
    },
    {
      cam: C_HEART,
      dim: ['eskuineko-aurikula', 'eskuineko-zulo-ab', 'eskuineko-bentrikulua'],
      names: [{ id: 'eskuineko-zulo-ab', small: true }, 'eskuineko-bentrikulua'],
      note: 'Eskuineko zulo aurikulobentrikularretik eskuineko bentrikulura',
      flows: [{ path: ['-acLowR', '-commonR', 'raRv'], sat: 0.05, n: 14 }],
    },
    {
      cam: C_LUNGS,
      glide: 0.07,
      dim: ['birika-enborra', 'birika-arteria', 'birikak'],
      names: [{ id: 'birika-arteria', text: 'Ezkerreko birika arteria' }, { id: 'birika-arteria', p: 'birika-arteriaR', text: 'Eskuineko birika arteria', key: 'pa-r' }, { id: 'birikak', p: 'birikakR', small: true }],
      note: 'Birika arteriaren eskuineko eta ezkerreko arterien bidez biriketara, oxigenatzeko',
      flows: TO_LUNGS,
    },
    {
      cam: orbit(160, 14, 9, [0.35, 0.3, -0.4], SH),
      glide: 0.08,
      dim: ['birika-zainak', 'ezkerreko-aurikula-jaiotakoan', 'ezkerreko-zulo-ab', 'ezkerreko-bentrikulua', 'birikak'],
      names: [{ id: 'birika-zainak', sub: '(4 zain)' }, 'ezkerreko-aurikula-jaiotakoan', { id: 'ezkerreko-bentrikulua', small: true, from: 0.5 }],
      note: 'Oxigenatuta, 4 birika zainetatik ezkerreko aurikulara, eta ezkerreko zulo aurikulobentrikularretik ezkerreko bentrikulura',
      flows: [...PV_IN, { path: ['pvL2', 'laLv'], sat: 1, n: 6 }, { path: ['pvR2', 'laLv'], sat: 1, n: 6 }],
    },
    {
      cam: C_GREAT,
      glide: 0.08,
      warn: true,
      dim: ['goranzko-aorta', 'aortaren-makoa', 'beheranzko-aorta', 'aorta', 'ezkerreko-bentrikulua'],
      names: ['goranzko-aorta', 'aortaren-makoa', { id: 'beheranzko-aorta', from: 0.3 }],
      note: 'Aortatik (goranzkoa, makoa, beheranzkoa) odol OXIGENATUA gorputz osora. KONTUZ: apunteek «zain-odola» diote, baina arteria odola da',
      flows: OUT_RED,
    },
    {
      x: { valsalva: 1 },
      run: [0.05, 0.45],
      cam: orbit(-18, 22, 4.6, [0.28, 0.05, 0.6], SH),
      glide: 0.08,
      dim: ['aorta-balbula', 'valsalva-sinuak', 'goranzko-aorta'],
      names: [{ id: 'aorta-balbula', sub: '(3 balbo)' }, { id: 'valsalva-sinuak', from: 0.4 }],
      note: 'Aortaren irteeran balbula bat, 3 balboz osatua; alboetan Valsalvaren sinuak',
      flows: [{ path: ['laLv', 'asc'], sat: 1, n: 10 }],
    },
    {
      cam: orbit(-22, 12, 8.5, [0.1, 0.6, 0.4], SH),
      glide: 0.08,
      dim: ['arteria-koronarioak', 'valsalva-sinuak', 'enbor-brakiozefalikoa', 'karotida-komuna', 'aortaren-makoa'],
      names: [{ id: 'arteria-koronarioak', sub: '(eskuinekoa eta ezkerrekoa)' }, { id: 'enbor-brakiozefalikoa', from: 0.4 }, { id: 'karotida-komuna', text: 'Ezkerreko karotida komuna', from: 0.5 }],
      note: 'Sinuen paretetatik arteria koronarioak; aorta makotik arteria brakiozefalikoa eta ezkerreko karotida komuna',
      flows: [{ path: ['laLv', 'corR'], sat: 1, n: 6 }, { path: ['laLv', 'corL'], sat: 1, n: 6 }, ...OUT_RED.slice(1), { path: ['asc', 'arch', 'lcc'], sat: 1, n: 8 }],
    },
    {
      cam: C_ALL,
      glide: 0.08,
      dim: ['arteria-koronarioak', 'beheranzko-aorta', 'goiko-kaba-zaina', 'beheko-kaba-zaina', 'enbor-brakiozefalikoa', 'karotida-komuna'],
      names: [{ id: 'arteria-koronarioak', small: true }, { id: 'beheranzko-aorta', sub: '(gero eta oxigeno gutxiago)' }, { id: 'goiko-kaba-zaina', p: 'goiko-kabaren-hasierako-atala', small: true, from: 0.5 }, { id: 'beheko-kaba-zaina', p: 'kabaren-giltzurrun-segmentua', small: true, from: 0.5 }],
      note: 'Koronarioetan saturazioa oso altua (miokardioa eta entzefaloa); beherantz gero eta gutxiago; zainek berriro eskuineko aurikulara',
      flows: [{ path: ['laLv', 'asc', 'bct'], sat: 1, n: 10 }, { path: ['desc', 'ciaR', 'eiaR'], sat: 0.85, n: 12 }, { path: ['desc', 'ciaL', 'eiaL'], sat: 0.85, n: 12 }, ...VEINS_IN],
    },
    {
      x: { patent: 1, fuse: 0.6 },
      run: [0.05, 0.35],
      cam: C_ATRIA,
      glide: 0.08,
      dim: ['zulo-obala', 'aurikula-arteko-trenkada', 'eskuineko-aurikula', 'ezkerreko-aurikula-jaiotakoan'],
      names: [{ id: 'zulo-obala', sub: '(ez guztiz itxita)', from: 0.3 }, { id: 'ezkerreko-aurikula-jaiotakoan', small: true }],
      note: 'Jaioberriak askotan zianotikoak (urdinak): aurikula arteko trenkada ez da guztiz ixten eta odola nahasten da; komunikazioa txikia da',
      flows: [{ path: ['hcUpR', 'raFo'], sat: 0.1, n: 3, speed: 0.5, from: 0.35 }, ...PV_IN],
    },
  ],
});
