'use client';

import { Arrow, C, Flow, Label, Mark, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { VilliDefs } from '@/components/scenes/week3-villi/common';
import { K, W3bDefs } from '@/components/scenes/week3-villi/art';
import { useId } from 'react';
import { COTS, CORD_X, FA, FV, PlacentaSection, SEPTA, SEPT_L, VEIN_X, Y, at, spiralPts } from './placentaSection';
import { FaceDefs, FetalFace, INS, MaternalFace, MiniMaternal, Profile, RX, RY, TH, lobeAt } from './placentaFaces';

/**
 * Topic 6 — the placenta (Langman ch. 8, figs. 8-13 and 8-14; notes 2 and 3).
 * - Cotyledons (6:kotiledoiak:ebakia): the placenta cut through, maternal side up: deziduaren orria,
 *   trenkadak hanging part of the way down, kotiledoiak, the villous trees, arteria kiribilak and
 *   endometrio-zainak; korion plaka, amniosa and the cord below.
 * - PlacentaCirculation: the same section closed in on one cotyledon (jet, return), with the term
 *   placental barrier (sinzitiotrofoblastoa + endotelioa) magnified.
 * - PlacentaFaces: the term placenta whole, at its real proportions: fetal and maternal faces.
 * - PlacentaFunctions: maternal blood | placental barrier | fetal blood, one row per function.
 */

const vis = (t: number, a: number, b = 2) => Math.min(a <= 0 ? 1 : seg(t, a, a + 0.03), 1 - seg(t, b - 0.03, b));
const f1 = (v: number) => v.toFixed(1);

/** A tree anchor for labels: a point on cotyledon i's stem or on one of its free villi (bowed). */
const stemAt = (i: number, u: number): Pt => at(COTS[i] + Math.sin(u * 3) * 2, lerp(Y.plate, Y.plate - 118, u));
const branchAt = (i: number, side: -1 | 1, u: number): Pt => {
  const c = COTS[i];
  const f: Pt = [c, Y.plate - 118];
  const k: Pt = [c + side * 70, Y.plate - 190];
  const e: Pt = [c + side * 60, Y.shell + 2];
  const x = (1 - u) * (1 - u) * f[0] + 2 * (1 - u) * u * k[0] + u * u * e[0];
  const y = (1 - u) * (1 - u) * f[1] + 2 * (1 - u) * u * k[1] + u * u * e[1];
  return at(x, y);
};

/* ---------------------------------------------------------------------------------------------- */
/* 6:kotiledoiak:ebakia                                                                             */
/* ---------------------------------------------------------------------------------------------- */

export function Cotyledons({ t, reduced }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const branch = 0.55 + 0.45 * seg(t, 0, 0.16);
  const septa = seg(t, 0.38, 0.54);
  const tint = vis(t, 0.56);
  const cross = vis(t, 0.72);
  const jets = 0.3 + 0.7 * seg(t, 0.86, 0.9);
  const veins = 0.25 + 0.75 * seg(t, 0.86, 0.92);
  const L = SEPT_L * septa;
  const sp = spiralPts(COTS[0]);
  const lobes = vis(t, 0.56, 0.72);
  return (
    <g>
      <VilliDefs />
      <W3bDefs />
      <FaceDefs uid={uid} />
      <g mask="url(#m-slab)">
        <PlacentaSection id={`${uid}-s`} branch={branch} septa={septa} tint={tint} cross={cross} jets={jets} veins={veins} cordId="zilbor-hodiak" reduced={reduced} />
      </g>

      {/* 16–20 cotyledons: the same compartments seen from the maternal face */}
      <g opacity={lobes}>
        <MiniMaternal cx={300} cy={566} rx={50} ry={26} uid={uid} />
      </g>
      <Note x={362} y={570} align="start" show={lobes} tone="accent">
        Amaren aurpegian: 16–20 kotiledoi
      </Note>

      {/* Left gutter: maternal side above, fetal side below */}
      <Label id="arteria-espiralak" x={190} y={40} ax={sp[6][0]} ay={sp[6][1]} show={vis(t, 0.18)} />
      <Label id="dezidua-basala" x={190} y={78} ax={at(262, (Y.dec + Y.plt) / 2)[0]} ay={at(262, (Y.dec + Y.plt) / 2)[1]} show={vis(t, 0.18)} />
      <Label id="deziduaren-orria" x={190} y={114} ax={at(262, Y.plt + 14)[0]} ay={at(262, Y.plt + 14)[1]} show={vis(t, 0.18)} />
      <Label id="kanpoko-zorro-zitotrofoblastikoa" x={234} y={150} align="end" small ax={at(276, (Y.shell + Y.ivs) / 2)[0]} ay={at(276, (Y.shell + Y.ivs) / 2)[1]} show={vis(t, 0.18)} />
      <Label id="biloxka-askea" x={190} y={250} ax={branchAt(0, -1, 0.55)[0] - 28} ay={branchAt(0, -1, 0.55)[1] + 6} show={vis(t, 0)} />
      <Label id="biloxka-tertziarioa" x={190} y={392} ax={stemAt(0, 0.35)[0] - 6} ay={stemAt(0, 0.35)[1]} show={vis(t, 0)} />
      <Label id="korion-plaka" x={190} y={468} ax={at(244, Y.plate + 13)[0]} ay={at(244, Y.plate + 13)[1]} show={vis(t, 0)} />
      <Label id="amniosa" x={190} y={504} ax={at(244, Y.plateB + 3)[0]} ay={at(244, Y.plateB + 3)[1]} show={vis(t, 0)} />

      {/* Right gutter */}
      <Label id="endometrio-zainak" x={810} y={64} ax={at(VEIN_X[VEIN_X.length - 2], Y.dec + 14)[0]} ay={at(VEIN_X[VEIN_X.length - 2], Y.dec + 14)[1]} show={vis(t, 0.18)} />
      <Label id="deziduaren-trenkadak" x={810} y={240} ax={at(SEPTA[3] + 8, Y.shell + L * 0.55)[0]} ay={at(SEPTA[3] + 8, Y.shell + L * 0.55)[1]} show={vis(t, 0.38)} />
      <Label id="kotiledoiak" x={810} y={300} ax={at(726, 300)[0]} ay={at(726, 300)[1]} show={vis(t, 0.56)} />
      <Label id="biloxka-arteko-espazioa" x={810} y={360} ax={at(742, 410)[0]} ay={at(742, 410)[1]} show={vis(t, 0.72)} />
      <Label id="korioneko-odol-hodiak" x={810} y={470} ax={at(772, Y.plate + 18)[0]} ay={at(772, Y.plate + 18)[1]} show={vis(t, 0.04)} />
      <Label id="zilbor-hodiak" x={810} y={548} ax={CORD_X + 20} ay={548} show={vis(t, 0.04)} />

      <Note x={500} y={618} show={vis(t, 0, 0.18)}>Korion plakatik biloxka tertziarioak; hauetatik biloxka askeak</Note>
      <Note x={500} y={618} show={vis(t, 0.18, 0.38)}>Biloxka tertziarioek deziduaren orriarekin kontaktatzen dute</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.38, 0.56)}>4.–5. hilabeteak: deziduaren trenkadak biloxka arteko guneetan</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.56, 0.72)}>Trenkadek karena konpartimendutan banatzen dute: kotiledoiak</Note>
      <Note x={500} y={618} show={vis(t, 0.72, 0.86)}>Trenkadak ez dira korion plakara heltzen: odola kotiledoi batetik bestera</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.86)}>Biloxka arteko odola amaren endometriotik dator (arteria kiribilak)</Note>
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* Shared captions for the three views of 6:karena-aterminoa                                        */
/* ---------------------------------------------------------------------------------------------- */

function TermNotes({ t }: { t: number }) {
  return (
    <>
      <Note x={500} y={618} show={vis(t, 0, 0.1)}>Erditzean askatu; ~ordu erdi beranduago kanporatzen da</Note>
      <Note x={500} y={618} show={vis(t, 0.1, 0.2)}>Disko itxura: 15–20 cm · 3–4 cm · 500–600 g</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.2, 0.3)}>Fetuaren aurpegia: orri korionikoa, odol-hodi korionikoak, amniosa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.3, 0.4)}>Amaren aurpegia: kotiledoiak, dezidua basalez inguratuta</Note>
      <Note x={500} y={618} show={vis(t, 0.4, 0.5)}>80–100 arteria espiral: lumen estua → presio handia</Note>
      <Note x={500} y={618} show={vis(t, 0.5, 0.6)}>Endometrio-zainetatik itzuli · 150–200 ml, 3–4 aldiz minutuko</Note>
      <Note x={500} y={618} show={vis(t, 0.6, 0.68)}>Umetokiaren azaleraren %20–30; gero eta lodiagoa</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.68, 0.78)}>Gasak (difusioz) eta elikagaiak</Note>
      <Note x={500} y={618} tone="accent" show={vis(t, 0.78, 0.88)}>Hormonak eta IgG antigorputzak</Note>
      <Note x={500} y={618} tone="warn" show={vis(t, 0.88)}>Ez dira beti onuragarriak</Note>
    </>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* 6:karena-aterminoa:zirkulazioa                                                                   */
/* ---------------------------------------------------------------------------------------------- */

/** The magnified barrier card (bottom left, over the neighbouring cotyledon). */
const CARD = { x: 210, y: 300, w: 176, h: 196 };
const STRIP = { syn0: CARD.x + 70, syn1: CARD.x + 80, lam: CARD.x + 81.5, endo1: CARD.x + 86 };

export function PlacentaCirculation({ t, reduced }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const z = zoom(500, 262, 1.3, 500, 318);
  const jets = 0.25 + 0.75 * seg(t, 0.4, 0.46);
  const veins = 0.2 + 0.8 * seg(t, 0.5, 0.56);
  const zat = (p: Pt) => z.at(p[0], p[1]);
  const sp = spiralPts(COTS[1]).map(zat);
  const vein = zat(at(SEPTA[2] - 27, Y.dec + 30));
  const yRows = [CARD.y + 62, CARD.y + 92, CARD.y + 122];
  const tt = reduced ? 0 : t;
  return (
    <g>
      <VilliDefs />
      <W3bDefs />
      <g mask="url(#m-slab)">
        <g transform={z.transform}>
          <PlacentaSection id={`${uid}-s`} branch={1} septa={1} tint={0} cross={0} jets={jets} veins={veins} cordId="zilborrestea" reduced={reduced} arrowCots={[1]} />
        </g>
      </g>
      <Mark id="karenaren-zirkulazioa" x={z.at(500, Y.ivs + 130)[0]} y={z.at(500, Y.ivs + 130)[1]} rx={70} ry={96} show={vis(t, 0.4)} />

      {/* The term placental barrier, magnified: two thin layers between the two bloods, which never mix */}
      <g>
        <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill="#0b1020" stroke="#3b4a6b" strokeWidth={1.4} opacity={0.96} />
        <text x={CARD.x + CARD.w / 2} y={CARD.y + 18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#e6ecf8">
          Karena muga, bukaeran
        </text>
        <clipPath id={`${uid}-card`}>
          <rect x={CARD.x + 8} y={CARD.y + 28} width={CARD.w - 16} height={CARD.h - 62} rx={6} />
        </clipPath>
        <g clipPath={`url(#${uid}-card)`}>
          <Part id="biloxka-arteko-espazioa" quiet>
            <rect x={CARD.x} y={CARD.y + 20} width={STRIP.syn0 - CARD.x} height={CARD.h} fill="url(#w3b-blood)" />
          </Part>
          <Part id="karena-muga">
            <Part id="sinzitiotrofoblastoa">
              <rect x={STRIP.syn0} y={CARD.y + 20} width={STRIP.syn1 - STRIP.syn0} height={CARD.h} fill="url(#w3b-syn)" />
              <path d={Array.from({ length: 16 }, (_, i) => `M${STRIP.syn0},${CARD.y + 30 + i * 9} l-3,1.6`).join('')} stroke={K.fringe} strokeWidth={1} />
            </Part>
            <rect x={STRIP.syn1} y={CARD.y + 20} width={STRIP.lam - STRIP.syn1} height={CARD.h} fill={C.fibrin} opacity={0.8} />
            <Part id="endotelioa">
              <rect x={STRIP.lam} y={CARD.y + 20} width={STRIP.endo1 - STRIP.lam} height={CARD.h} fill={K.endo} />
              {[0, 1, 2].map((i) => (
                <ellipse key={i} cx={STRIP.endo1 - 1} cy={CARD.y + 52 + i * 52} rx={3} ry={7} fill={K.endoNuc} />
              ))}
            </Part>
          </Part>
          {/* fetal capillary blood with its red cells */}
          <rect x={STRIP.endo1} y={CARD.y + 20} width={CARD.x + CARD.w - STRIP.endo1} height={CARD.h} fill="#5a1430" />
          {[0, 1, 2, 3, 4].map((i) => {
            const y = CARD.y + 40 + ((i * 31 + tt * 300) % 140);
            return <ellipse key={i} cx={STRIP.endo1 + 22 + (i % 3) * 22} cy={y} rx={7} ry={4.5} fill="#d94a63" stroke="#7c0f25" strokeWidth={0.6} />;
          })}
        </g>
        {/* exchange by diffusion */}
        <Arrow from={[CARD.x + 26, yRows[0]]} to={[CARD.x + CARD.w - 22, yRows[0]]} bend={0} color="#ff8a8a" width={2.2} head={8} />
        <Arrow from={[CARD.x + CARD.w - 22, yRows[1]]} to={[CARD.x + 26, yRows[1]]} bend={0} color="#93b4ff" width={2.2} head={8} />
        <Arrow from={[CARD.x + 26, yRows[2]]} to={[CARD.x + CARD.w - 22, yRows[2]]} bend={0} color="#fbbf24" width={2.2} head={8} />
        <text x={CARD.x + 16} y={yRows[0] - 7} fontSize={10.5} fontWeight={700} fill="#ffb4b4">
          O₂
        </text>
        <text x={CARD.x + CARD.w - 16} y={yRows[1] - 7} textAnchor="end" fontSize={10.5} fontWeight={700} fill="#b9ccff">
          CO₂
        </text>
        <text x={CARD.x + 16} y={yRows[2] - 7} fontSize={10.5} fontWeight={700} fill="#fde68a">
          elikagaiak
        </text>
        <text x={CARD.x + 38} y={CARD.y + CARD.h - 22} textAnchor="middle" fontSize={9.5} fill="#ffb4bf">
          ama
        </text>
        <text x={CARD.x + CARD.w - 40} y={CARD.y + CARD.h - 22} textAnchor="middle" fontSize={9.5} fill="#ffb4bf">
          fetua
        </text>
        <text x={CARD.x + CARD.w / 2} y={CARD.y + CARD.h - 8} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fbbf24">
          Bi odolak ez dira nahasten
        </text>
      </g>

      {/* Umbilical vessels: arteries carry deoxygenated blood to the placenta, the vein oxygenated blood back */}
      <g>
        <rect x={CARD.x} y={CARD.y + CARD.h + 8} width={250} height={46} rx={10} fill="#0b1020" stroke="#3b4a6b" strokeWidth={1.2} opacity={0.96} />
        <path d={`M${CARD.x + 12},${CARD.y + CARD.h + 23} h22`} stroke={FA} strokeWidth={5} strokeLinecap="round" />
        <path d={`M${CARD.x + 12},${CARD.y + CARD.h + 41} h22`} stroke={FV} strokeWidth={5} strokeLinecap="round" />
        <text x={CARD.x + 42} y={CARD.y + CARD.h + 23} dy="0.35em" fontSize={10.5} fill="#c7d2fe">
          Zilbor-arteriak: odol desoxigenatua
        </text>
        <text x={CARD.x + 42} y={CARD.y + CARD.h + 41} dy="0.35em" fontSize={10.5} fill="#fecaca">
          Zilbor-zaina: odol oxigenatua
        </text>
      </g>

      {/* Left gutter */}
      <Label id="arteria-espiralak" x={190} y={60} ax={sp[8][0]} ay={sp[8][1]} show={vis(t, 0)} />
      <Label id="dezidua-basala" x={190} y={104} ax={z.at(420, Y.dec + 18)[0]} ay={z.at(420, Y.dec + 18)[1]} show={vis(t, 0)} />
      <Label id="karenaren-zirkulazioa" x={190} y={200} ax={z.at(470, Y.ivs + 120)[0]} ay={z.at(470, Y.ivs + 120)[1]} show={vis(t, 0.4)} />
      <Label id="biloxka-askea" x={190} y={250} ax={zat(branchAt(1, -1, 0.6))[0] - 34} ay={zat(branchAt(1, -1, 0.6))[1] + 8} show={vis(t, 0)} />
      {/* horizontal leaders between the card's arrows and words */}
      <Label id="karena-muga" x={190} y={CARD.y + 40} ax={STRIP.syn1} ay={CARD.y + 40} show={vis(t, 0)} />
      <Label id="sinzitiotrofoblastoa" x={190} y={CARD.y + 76} ax={(STRIP.syn0 + STRIP.syn1) / 2} ay={CARD.y + 76} show={vis(t, 0)} small />
      <Label id="endotelioa" x={190} y={CARD.y + 140} ax={STRIP.endo1 - 2} ay={CARD.y + 140} show={vis(t, 0)} />
      <Label id="korion-plaka" x={190} y={560} ax={z.at(420, Y.plate + 6)[0]} ay={z.at(420, Y.plate + 6)[1]} show={vis(t, 0)} />

      {/* Right gutter */}
      <Label id="endometrio-zainak" x={810} y={110} ax={vein[0]} ay={vein[1]} show={vis(t, 0)} />
      <Label id="deziduaren-trenkadak" x={810} y={300} ax={z.at(SEPTA[2] + 6, Y.shell + SEPT_L * 0.55)[0]} ay={z.at(SEPTA[2] + 6, Y.shell + SEPT_L * 0.55)[1] + 10} show={vis(t, 0)} />
      <Label id="biloxka-arteko-espazioa" x={810} y={370} ax={z.at(560, Y.ivs + 200)[0]} ay={z.at(560, Y.ivs + 200)[1]} show={vis(t, 0)} />
      <Label id="korioneko-odol-hodiak" x={810} y={540} ax={z.at(600, Y.plate + 18)[0]} ay={z.at(600, Y.plate + 18)[1]} show={vis(t, 0)} />
      <Label id="amniosa" x={810} y={584} ax={z.at(640, Y.plateB + 3)[0]} ay={z.at(640, Y.plateB + 3)[1]} show={vis(t, 0)} />

      <TermNotes t={t} />
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* 6:karena-aterminoa:aurpegiak                                                                     */
/* ---------------------------------------------------------------------------------------------- */

const FCY = 322;
/** The uterus inset (beat .6): the placenta covers 20–30 % of the uterine wall. */
const UT: Pt = [500, 150];

export function PlacentaFaces({ t }: SceneProps) {
  const uid = useId().replace(/:/g, '');
  const detach = seg(t, 0.02, 0.09);
  // Step .2 slides the fetal face left; step .3 lifts a copy out from under it, slides it right and turns
  // it over to show the maternal face — both done by the complete frames.
  const split = seg(t, 0.2, 0.26);
  const lx = lerp(500, 334, split);
  const flip = seg(t, 0.3, 0.36);
  const rxPos = lerp(lx, 666, seg(t, 0.3, 0.35));
  const showRight = t > 0.3;
  const sq = flip < 0.5 ? 1 - flip * 2 : flip * 2 - 1;
  const dims = vis(t, 0.1, 0.22);
  const bob = Math.sin(t * 20) * 2;
  const ut = vis(t, 0.6, 0.68);
  const thick = seg(t, 0.6, 0.66);
  const ins: Pt = [lx + INS[0] * RX, FCY + INS[1] * RY];
  // Placenta arc in the inset: a quarter of the wall, thickening as it grows.
  const uw = (a: number, d: number): Pt => [UT[0] + (46 + d) * Math.cos(a), UT[1] + (52 + d) * Math.sin(a)];
  const arc = (d: number) => smoothPath(Array.from({ length: 13 }, (_, i) => uw(lerp(-2.6, -0.95, i / 12), d)), false);
  return (
    <g>
      <FaceDefs uid={uid} />

      {/* Uterine wall the placenta peels away from */}
      <g opacity={1 - detach} transform={`translate(0 ${-70 * detach})`}>
        <path d={`M${lx - RX - 60},${FCY - RY + 20} Q${lx},${FCY - RY - 70} ${lx + RX + 60},${FCY - RY + 20} L${lx + RX + 60},${FCY - RY - 20} Q${lx},${FCY - RY - 110} ${lx - RX - 60},${FCY - RY - 20} Z`} fill="url(#p-muscle)" opacity={0.9} />
        <path d={`M${lx - RX - 60},${FCY - RY + 20} Q${lx},${FCY - RY - 70} ${lx + RX + 60},${FCY - RY + 20}`} fill="none" stroke="#f3cdd5" strokeWidth={5} opacity={0.8} />
      </g>

      <Mark id="karena-aterminoa" x={lx} y={FCY + TH / 2} rx={RX + 22} ry={RY + TH + 22} show={vis(t, 0, 0.28)} />
      <Part id="fetuaren-aurpegia">
        <g transform={`translate(0 ${bob})`}>
          <FetalFace cx={lx} cy={FCY} t={t} uid={uid} />
        </g>
      </Part>
      {showRight && (
        <Part id="amaren-aurpegia">
          <g transform={`translate(${rxPos} ${FCY - bob}) scale(1 ${Math.max(sq, 0.02)}) translate(${-rxPos} ${-FCY})`}>
            {flip < 0.5 ? <FetalFace cx={rxPos} cy={FCY} t={t} uid={uid} /> : <MaternalFace cx={rxPos} cy={FCY} uid={uid} />}
          </g>
        </Part>
      )}

      {/* Size of the term placenta: diameter under the disc, thickness on its profile, weight */}
      <g opacity={dims} pointerEvents="none">
        <Arrow from={[lx - RX + 8, FCY + RY + TH + 26]} to={[lx + RX - 8, FCY + RY + TH + 26]} bend={0} color="#fbbf24" width={1.6} head={7} />
        <Arrow from={[lx + RX - 8, FCY + RY + TH + 26]} to={[lx - RX + 8, FCY + RY + TH + 26]} bend={0} color="#fbbf24" width={1.6} head={7} />
        <Profile cx={lx} cy={548} w={RX * 2} th={2 * RX * (3.5 / 17.5)} />
        <Arrow from={[lx + 14, 548 - RX * 0.2 - 4]} to={[lx + 14, 548 - RX * 0.2 + 20]} bend={0} color="#fbbf24" width={1.4} head={6} />
        <Arrow from={[lx + 14, 548 + RX * 0.2 + 4]} to={[lx + 14, 548 + RX * 0.2 - 20]} bend={0} color="#fbbf24" width={1.4} head={6} />
      </g>
      <Note x={lx} y={FCY + RY + TH + 46} show={dims} tone="accent">15–20 cm diametroa</Note>
      <Note x={lx + RX + 18} y={552} align="start" show={dims} tone="accent">3–4 cm lodiera (erdian)</Note>
      <Note x={lx - RX - 18} y={FCY + TH / 2} align="end" show={dims} tone="accent">500–600 g</Note>

      {/* The uterus with the placenta on its wall: 20–30 % of the surface, ever thicker */}
      <g opacity={ut}>
        <path d={`M${UT[0] - 60},${UT[1] - 6} C${UT[0] - 62},${UT[1] - 80} ${UT[0] + 62},${UT[1] - 80} ${UT[0] + 60},${UT[1] - 6} C${UT[0] + 58},${UT[1] + 40} ${UT[0] + 22},${UT[1] + 62} ${UT[0] + 12},${UT[1] + 84} L${UT[0] - 12},${UT[1] + 84} C${UT[0] - 22},${UT[1] + 62} ${UT[0] - 58},${UT[1] + 40} ${UT[0] - 60},${UT[1] - 6} Z`} fill="url(#p-muscle)" stroke="#4a1a20" strokeWidth={1.4} />
        <ellipse cx={UT[0]} cy={UT[1]} rx={46} ry={52} fill="#121a2e" />
        <ellipse cx={UT[0]} cy={UT[1]} rx={46} ry={52} fill="rgba(110,170,255,0.16)" stroke="#9fc3e6" strokeWidth={1.2} />
      </g>
      <Part id="karena" show={ut}>
        <path d={arc(-2)} fill="none" stroke="#7c1f36" strokeWidth={lerp(8, 13, thick) + 2.4} strokeLinecap="round" />
        <path d={arc(-2)} fill="none" stroke="#c2415f" strokeWidth={lerp(8, 13, thick)} strokeLinecap="round" />
      </Part>
      <Note x={UT[0] + 72} y={UT[1] - 40} align="start" show={ut} tone="accent">%20–30</Note>

      <Label id="karena-aterminoa" x={812} y={250} ax={lx + RX * 0.7} ay={FCY + 10} show={vis(t, 0, 0.28)} />
      <Label id="karena" x={190} y={120} ax={uw(-1.9, 2)[0]} ay={uw(-1.9, 2)[1]} show={ut} />
      <Label id="zilborrestea" x={190} y={78} ax={ins[0] + 4} ay={ins[1] - 120} show={vis(t, 0.2)} />
      <Label id="fetuaren-aurpegia" x={190} y={180} ax={lx - RX * 0.62} ay={FCY - RY * 0.5} show={vis(t, 0.2)} />
      <Label id="korion-plaka" x={190} y={232} ax={lx - RX * 0.4} ay={FCY + RY * 0.12} show={vis(t, 0.2)} text="Orri korionikoa" />
      <Label id="korioneko-odol-hodiak" x={190} y={420} ax={lx + RX * 0.2} ay={FCY + RY * 0.5} show={vis(t, 0.2)} />
      <Label id="amniosa" x={190} y={472} ax={lx - RX * 1.03} ay={FCY + RY * 0.42} show={vis(t, 0.2)} />

      <Label id="amaren-aurpegia" x={812} y={232} ax={rxPos + RX * 0.62} ay={FCY - RY * 0.5} show={vis(t, 0.33)} />
      <Label id="kotiledoiak" x={812} y={392} ax={lobeAt(rxPos, FCY, 9)[0]} ay={lobeAt(rxPos, FCY, 9)[1]} show={vis(t, 0.33)} />
      <Label id="dezidua-basala" x={812} y={444} ax={rxPos + RX * 0.86} ay={FCY + RY * 0.38} show={vis(t, 0.33)} />
      <Note x={rxPos} y={FCY + RY + TH + 34} show={vis(t, 0.33)}>Kolore argiagoa: dezidua basala erauzi den tokia</Note>

      <TermNotes t={t} />
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------- */
/* 6:karena-aterminoa:funtzioak                                                                     */
/* ---------------------------------------------------------------------------------------------- */

const MOM: [number, number] = [272, 480];
const BAR: [number, number] = [480, 522];
const FET: [number, number] = [522, 790];
/** Row names sit left of the panel (the longest, 38 characters, needs ~245 units). */
const LX = 262;
const MID = (MOM[0] + FET[1]) / 2;
const TOP = 92;
const BOT = 586;
const ROWS = { gas: 140, food: 220, horm: 300, igg: 380, rh: 460, bad: 540 };
const SYN1 = BAR[0] + 26;

type Glyph = 'o2' | 'co2' | 'food' | 'horm' | 'igg' | 'rh' | 'virus' | 'drug';

function GlyphAt({ g, x, y, o }: { g: Glyph; x: number; y: number; o: number }) {
  switch (g) {
    case 'o2':
      return (
        <g opacity={o}>
          <circle cx={x - 3.4} cy={y} r={4} fill="#ff6b6b" stroke="#7c0f25" strokeWidth={0.7} />
          <circle cx={x + 3.4} cy={y} r={4} fill="#ff6b6b" stroke="#7c0f25" strokeWidth={0.7} />
        </g>
      );
    case 'co2':
      return (
        <g opacity={o}>
          <circle cx={x - 6} cy={y} r={3.2} fill="#93b4ff" />
          <circle cx={x} cy={y} r={4} fill="#4b5d86" stroke="#1d2a5c" strokeWidth={0.7} />
          <circle cx={x + 6} cy={y} r={3.2} fill="#93b4ff" />
        </g>
      );
    case 'food':
      return <path d={Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${f1(x + 5.5 * Math.cos((i * Math.PI) / 3))},${f1(y + 5.5 * Math.sin((i * Math.PI) / 3))}`).join('') + 'Z'} fill="#fbbf24" stroke="#8a5a00" strokeWidth={0.8} opacity={o} />;
    case 'horm':
      return <path d={`M${x},${y - 6} L${x + 5},${y} L${x},${y + 6} L${x - 5},${y} Z`} fill="#c084fc" stroke="#5b2a8a" strokeWidth={0.8} opacity={o} />;
    case 'igg':
    case 'rh':
      return <path d={`M${x},${y + 6} L${x},${y} L${x - 5},${y - 6} M${x},${y} L${x + 5},${y - 6}`} stroke={g === 'igg' ? '#7ed492' : '#ff7b72'} strokeWidth={2.4} fill="none" opacity={o} strokeLinecap="round" />;
    case 'virus':
      return (
        <g opacity={o} stroke="#ff7b72" strokeWidth={1.4} strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <path key={i} d={`M${f1(x + 4 * Math.cos(a))},${f1(y + 4 * Math.sin(a))} L${f1(x + 7 * Math.cos(a))},${f1(y + 7 * Math.sin(a))}`} />;
          })}
          <circle cx={x} cy={y} r={4.2} fill="#7f1d1d" />
        </g>
      );
    case 'drug':
      return (
        <g opacity={o}>
          <rect x={x - 7} y={y - 3.5} width={14} height={7} rx={3.5} fill="#fca5a5" stroke="#7f1d1d" strokeWidth={0.8} />
          <rect x={x} y={y - 3.5} width={7} height={7} rx={0} fill="#f87171" />
        </g>
      );
  }
}

/** Molecules crossing (or leaving) the barrier along a row, positions pure functions of t. */
function Movers({ y, dir, t, glyphs, n = 3, speed = 0.9, x0 = MOM[0] + 22, x1 = FET[1] - 22 }: { y: number; dir: 1 | -1; t: number; glyphs: Glyph[]; n?: number; speed?: number; x0?: number; x1?: number }) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const u = (t * speed * 8 + i / n) % 1;
        const x = dir > 0 ? lerp(x0, x1, u) : lerp(x1, x0, u);
        const o = Math.min(1, u * 6, (1 - u) * 6);
        return <GlyphAt key={i} g={glyphs[i % glyphs.length]} x={x} y={y} o={o} />;
      })}
    </g>
  );
}

/** One function row: a soft band (lit as one part) holding its arrows and molecules. */
function Row({ id, y, show, tint, children }: { id: string; y: number; show: number; tint: string; children: React.ReactNode }) {
  return (
    <Mark id={id} show={show}>
      <g>
        <rect x={MOM[0] + 6} y={y - 30} width={FET[1] - MOM[0] - 12} height={60} rx={14} fill={tint} fillOpacity={0.1} />
        {children}
      </g>
    </Mark>
  );
}

/** Number chip at a row's start, in the maternal column. */
const Chip = ({ n, y, show, warn = false }: { n: string; y: number; show: number; warn?: boolean }) => (
  <g opacity={show}>
    <circle cx={MOM[0] + 22} cy={y - 16} r={9} fill={warn ? '#7f1d1d' : '#1e293b'} stroke={warn ? '#ff7b72' : '#94a3b8'} strokeWidth={1.2} />
    <text x={MOM[0] + 22} y={y - 16} dy="0.35em" textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#f1f5f9">
      {n}
    </text>
  </g>
);

export function PlacentaFunctions({ t, reduced }: SceneProps) {
  const g = vis(t, 0.68);
  const food = vis(t, 0.71);
  const horm = vis(t, 0.78);
  const igg = vis(t, 0.81);
  const rh = vis(t, 0.88);
  const bad = vis(t, 0.91);
  const tt = reduced ? 0 : t;
  // Fetal red cells hit by the Rh antibodies: they burst (pale, broken outline) once the antibodies arrive.
  const lysis = seg(t, 0.9, 0.95);
  return (
    <g>
      <VilliDefs />
      <W3bDefs />
      {/* Maternal blood | placental barrier (at term: syncytiotrophoblast + endothelium) | fetal blood */}
      <Part id="biloxka-arteko-espazioa" quiet>
        <rect x={MOM[0]} y={TOP} width={MOM[1] - MOM[0] + 8} height={BOT - TOP} rx={16} fill="url(#w3b-blood)" />
        <rect x={MOM[0]} y={TOP} width={MOM[1] - MOM[0] + 8} height={BOT - TOP} rx={16} fill="#1a0610" opacity={0.45} />
      </Part>
      <rect x={FET[0] - 8} y={TOP} width={FET[1] - FET[0] + 8} height={BOT - TOP} rx={16} fill="#3a0f24" />
      <rect x={FET[0] - 8} y={TOP} width={FET[1] - FET[0] + 8} height={BOT - TOP} rx={16} fill="#0c0612" opacity={0.4} />
      <Part id="karena-muga">
        <Part id="sinzitiotrofoblastoa">
          <rect x={BAR[0]} y={TOP} width={SYN1 - BAR[0]} height={BOT - TOP} fill="url(#w3b-syn)" />
          <path d={Array.from({ length: 50 }, (_, i) => `M${BAR[0]},${TOP + 6 + i * 10} l-4,2`).join('')} stroke={K.fringe} strokeWidth={1.1} />
        </Part>
        <rect x={SYN1} y={TOP} width={3} height={BOT - TOP} fill={C.fibrin} opacity={0.8} />
        <Part id="endotelioa">
          <rect x={SYN1 + 3} y={TOP} width={BAR[1] - SYN1 - 3} height={BOT - TOP} fill={K.endo} />
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={i} cx={BAR[1] - 2} cy={TOP + 40 + i * 72} rx={4} ry={10} fill={K.endoNuc} />
          ))}
        </Part>
      </Part>
      {/* Ambient blood flow on both sides */}
      <Flow d={`M${MOM[0] + 40},${TOP + 4} L${MOM[0] + 40},${BOT - 4}`} n={6} dur={5} r={2.8} color="#ff8a9b" reduced={reduced} />
      <Flow d={`M${FET[1] - 30},${BOT - 4} L${FET[1] - 30},${TOP + 4}`} n={6} dur={5.5} r={2.6} color="#d94a63" reduced={reduced} />

      <Note x={(MOM[0] + MOM[1]) / 2} y={72} tone="accent">Amaren odola</Note>
      <Note x={(FET[0] + FET[1]) / 2} y={72} tone="accent">Fetuaren odola</Note>

      {/* 1) Gases, by diffusion */}
      <Row id="gasen-elkartrukea" y={ROWS.gas} show={g} tint="#ff8a8a">
        <Arrow from={[MOM[0] + 40, ROWS.gas - 10]} to={[FET[1] - 24, ROWS.gas - 10]} bend={0} color="#ff8a8a" width={2.2} progress={seg(t, 0.68, 0.72)} />
        <Arrow from={[FET[1] - 24, ROWS.gas + 12]} to={[MOM[0] + 40, ROWS.gas + 12]} bend={0} color="#93b4ff" width={2.2} progress={seg(t, 0.69, 0.73)} />
        <Movers y={ROWS.gas - 10} dir={1} t={tt} glyphs={['o2']} />
        <Movers y={ROWS.gas + 12} dir={-1} t={tt} glyphs={['co2']} />
      </Row>
      <Chip n="1" y={ROWS.gas} show={g} />
      <Note x={FET[0] + 24} y={ROWS.gas + 29} align="start" show={g} tone="accent">O₂ fetura</Note>
      <Note x={MOM[1] - 16} y={ROWS.gas + 29} align="end" show={g}>CO₂ eta CO amarengana</Note>
      <Label id="gasen-elkartrukea" x={LX} y={ROWS.gas} align="end" show={g} />

      {/* 2) Nutrients and electrolytes */}
      <Row id="elikagaien-elkartrukea" y={ROWS.food} show={food} tint="#fbbf24">
        <Arrow from={[MOM[0] + 40, ROWS.food - 4]} to={[FET[1] - 24, ROWS.food - 4]} bend={0} color="#fbbf24" width={2.2} progress={seg(t, 0.71, 0.75)} />
        <Movers y={ROWS.food - 4} dir={1} t={tt} glyphs={['food']} n={4} speed={0.75} />
      </Row>
      <Chip n="2" y={ROWS.food} show={food} />
      <Note x={MID} y={ROWS.food + 20} show={food} size={11.5}>aminoazidoak · karbohidratoak · gantz-azido askeak · bitaminak</Note>
      <Label id="elikagaien-elkartrukea" x={LX} y={ROWS.food} align="end" show={food} small />

      {/* 3) Hormones made by the placenta (syncytiotrophoblast), into the mother's blood */}
      <Row id="karenaren-hormonak" y={ROWS.horm} show={horm} tint="#c084fc">
        <ellipse cx={(BAR[0] + SYN1) / 2} cy={ROWS.horm - 4} rx={16} ry={20 + 3 * Math.sin(t * 60)} fill="#c084fc" opacity={0.3} />
        <Arrow from={[BAR[0] - 4, ROWS.horm - 4]} to={[MOM[0] + 40, ROWS.horm - 4]} bend={0} color="#c084fc" width={2.2} progress={seg(t, 0.78, 0.82)} />
        <Movers y={ROWS.horm - 4} dir={-1} t={tt} glyphs={['horm']} x0={MOM[0] + 40} x1={BAR[0] - 4} speed={0.6} />
      </Row>
      <Chip n="3" y={ROWS.horm} show={horm} />
      <Note x={MID} y={ROWS.horm + 20} show={horm} size={11}>estrogenoa · progesterona · gonadotropina · hazkuntza hormonaren antzekoa · somatomamotropina</Note>
      <Label id="karenaren-hormonak" x={LX} y={ROWS.horm} align="end" show={horm} />

      {/* 4) IgG antibodies from mother to fetus */}
      <Row id="igg-antigorputzak" y={ROWS.igg} show={igg} tint="#7ed492">
        <Arrow from={[MOM[0] + 40, ROWS.igg - 4]} to={[FET[1] - 24, ROWS.igg - 4]} bend={0} color="#7ed492" width={2.2} progress={seg(t, 0.81, 0.85)} />
        <Movers y={ROWS.igg - 4} dir={1} t={tt} glyphs={['igg']} speed={0.6} />
      </Row>
      <Chip n="4" y={ROWS.igg} show={igg} />
      <Note x={FET[0] + 24} y={ROWS.igg + 20} align="start" show={igg} size={11.5}>amarengandik fetura: babesa</Note>
      <Label id="igg-antigorputzak" x={LX} y={ROWS.igg} align="end" show={igg} />

      {/* Not always beneficial: Rh antibodies destroy the (second) fetus's red cells */}
      <Row id="eritroblastosi-fetala" y={ROWS.rh} show={rh} tint="#ff7b72">
        <Arrow from={[MOM[0] + 40, ROWS.rh - 4]} to={[FET[1] - 70, ROWS.rh - 4]} bend={0} color="#ff7b72" width={2.2} progress={seg(t, 0.88, 0.92)} />
        <Movers y={ROWS.rh - 4} dir={1} t={tt} glyphs={['rh']} x1={FET[1] - 70} speed={0.6} />
        {[0, 1].map((k) => {
          const cx = FET[1] - 48 + k * 18;
          const cy = ROWS.rh - 4 + k * 6;
          // a burst cell: its outline turns ragged and pale
          const d = Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const j = 1 + lysis * (i % 2 ? -0.28 : 0.12);
            return `${i ? 'L' : 'M'}${f1(cx + 9 * j * Math.cos(a))},${f1(cy + 6 * j * Math.sin(a))}`;
          }).join('') + 'Z';
          return <path key={k} d={d} fill={lysis > 0.5 ? '#f3a6b4' : '#d94a63'} fillOpacity={1 - 0.5 * lysis} stroke="#7c0f25" strokeWidth={1} />;
        })}
      </Row>
      <Chip n="!" y={ROWS.rh} show={rh} warn />
      <Note x={MID} y={ROWS.rh + 20} show={rh} tone="warn" size={11.5}>Rh antigorputzak: 2. haurdunaldian fetuaren globulu gorriak suntsitu</Note>
      <Label id="eritroblastosi-fetala" x={LX} y={ROWS.rh} align="end" show={rh} />

      <Row id="karena-zeharkatzen-duten-kalteak" y={ROWS.bad} show={bad} tint="#ff7b72">
        <Arrow from={[MOM[0] + 40, ROWS.bad - 4]} to={[FET[1] - 24, ROWS.bad - 4]} bend={0} color="#ff7b72" width={2.2} progress={seg(t, 0.91, 0.95)} />
        <Movers y={ROWS.bad - 4} dir={1} t={tt} glyphs={['virus', 'drug']} n={4} speed={0.7} />
      </Row>
      <Chip n="!" y={ROWS.bad} show={bad} warn />
      <Note x={MID} y={ROWS.bad + 20} show={bad} tone="warn" size={11.5}>biruela · barizela · poliomielitisa · errubeola · drogak · alkohola</Note>
      <Label id="karena-zeharkatzen-duten-kalteak" x={LX} y={ROWS.bad} align="end" show={bad} small />

      {/* The barrier named once the rows are on, from the right gutter */}
      {/* Leaders run along the gaps between the rows, so they cross no words */}
      <Label id="karena-muga" x={810} y={TOP + 8} ax={BAR[1] + 1} ay={TOP + 8} show={g} />
      <Label id="endotelioa" x={810} y={ROWS.food - 35} ax={BAR[1] - 3} ay={ROWS.food - 35} show={g} />
      <Label id="sinzitiotrofoblastoa" x={810} y={(ROWS.food + ROWS.horm) / 2} ax={(BAR[0] + SYN1) / 2} ay={(ROWS.food + ROWS.horm) / 2} show={g} small />
      <Note x={(FET[0] + FET[1]) / 2} y={BOT + 16} show={g} size={11}>4. hilabetetik: endotelioa + sinzitiotrofoblastoa (muga mehea)</Note>

      <TermNotes t={t} />
    </g>
  );
}
