'use client';

import { Label, Note, Part, clamp, lerp, mix, rand, seg, smoothPath, type Pt, type SceneProps } from '@/components/kit';
import { Cells } from '@/components/scenes/section/Section';
import { Stellate } from '@/components/scenes/week3/dorsalKit';
import { D1 } from './Disc';
import { Defs10, Steps, T, arc, f1, mirror, vis } from './common';
import { F, coelomRight, ectoBottomAt, ectoTopAt, range } from './flat';

/**
 * 10:eskualde-kardiogenikoa `zeharkakoa` — disko lauaren zeharkako mozketa, gertutik, ferra formako
 * egituraren alboko adarren mailan (dortsala goian). Geruzek irudiaren erdia betetzen dute; amnios
 * barrunbea eta bitelo zakua ertzetan bakarrik. Alboko mesodermoa zelomak bi orritan banatzen du;
 * errai orrira zelulak iristen dira, odol irlatxoak osatzen dituzte, irlatxoak hodi bihurtzen dira eta
 * alde bakoitzean endokardio hodi bakarra osatzen dute; zeloma perikardio barrunbe bihurtzen ari da;
 * azkenik notokordaren bi aldeetan aorta dortsalak.
 */

/** Section times (within the stage's beats: 0, .14, .32, .48, .62, .74, .86). */
const S = {
  migrate: [0.15, 0.3],
  islands: [0.33, 0.45],
  vessels: [0.49, 0.6],
  fuse: [0.63, 0.73],
  peri: [0.75, 0.84],
  aortae: [0.87, 0.96],
} as const;

const XS = range(F.x0 - 6, F.x1 + 6, 110);
const flip = (pts: Pt[], sd: 1 | -1) => (sd > 0 ? pts : pts.map((p) => mirror(p)));
const closed = (top: Pt[], bot: Pt[]) => [...top, ...bot.slice().reverse()];
const d = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z`;

/** Migrating cells (right side; mirrored on the left): from beside the midline out to an island. */
const MIG = Array.from({ length: 12 }, (_, i) => {
  const isl = i % 3;
  return {
    from: [lerp(560, 600, rand(i * 2.3)), lerp(300, 390, rand(i * 3.9))] as Pt,
    to: [F.islands[isl] + (rand(i * 5.1) - 0.5) * 16, F.tube[1] + (rand(i * 7.7) - 0.5) * 14] as Pt,
    delay: rand(i * 1.7) * 0.4,
  };
});

/** One blood island: a cluster of angioblasts → blood cells inside, a flat wall outside. */
function Island({ c, r, ves, seed }: { c: Pt; r: number; ves: number; seed: number }) {
  const cells = Array.from({ length: 7 }, (_, q) => {
    const a = q * 0.9 + seed;
    const k = q === 0 ? 0 : 0.58;
    return [c[0] + Math.cos(a) * r * k, c[1] + Math.sin(a) * r * k * 0.8] as Pt;
  });
  return (
    <g>
      {ves > 0.02 && <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(r * 1.15)} ry={f1(r * 0.95)} fill={T.blood} opacity={ves} />}
      {cells.map((p, q) => {
        const rr = lerp(r * 0.4, r * 0.3, ves);
        return <circle key={q} cx={f1(p[0])} cy={f1(p[1])} r={f1(rr)} fill={mix(T.angioblast, T.island, ves)} stroke="rgba(110,20,24,0.7)" strokeWidth={0.8} />;
      })}
      {ves > 0.02 && <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(r * 1.15)} ry={f1(r * 0.95)} fill="none" stroke={T.endocard} strokeWidth={f1(lerp(0.5, 3.4, ves))} opacity={ves} />}
    </g>
  );
}

export function SectionArt({ t }: { t: number }) {
  const mig = seg(t, S.migrate[0], S.migrate[1]);
  const isl = seg(t, S.islands[0], S.islands[1]);
  const ves = seg(t, S.vessels[0], S.vessels[1]);
  const fuse = seg(t, S.fuse[0], S.fuse[1]);
  const peri = seg(t, S.peri[0], S.peri[1]);
  const ao = seg(t, S.aortae[0], S.aortae[1]);

  const ectoTop = XS.map((x): Pt => [x, ectoTopAt(x)]);
  const ectoBot = XS.map((x): Pt => [x, ectoBottomAt(x)]);
  const plateI = XS.map((x, i) => (Math.abs(x - 500) <= F.plateHalf ? i : -1)).filter((i) => i >= 0);
  const [pa, pb] = [plateI[0], plateI[plateI.length - 1] + 1];
  const { top: cTop, bot: cBot } = coelomRight(peri, fuse * 0.6 + peri * 0.5);
  const latX = range(F.cm, F.x1 + 6, 28);
  // Parietal layer: ectoderm → coelom roof; visceral layer: coelom floor → endoderm (both lateral to `cm`).
  const parietal = closed(latX.map((x): Pt => [x, ectoBottomAt(x) + 1]), cTop);
  const visceral = closed(cBot, latX.map((x): Pt => [x, F.endoTop - 1]));
  // Mesothelium lining the coelom (the cavity's walls).
  const roofLining = cTop.map((p): Pt => [p[0], p[1] - 9]);
  const floorLining = cBot.map((p): Pt => [p[0], p[1] + 10]);

  // Tube: three vessels gather at the tube's centre and merge.
  const tubeR = lerp(1, 1.12, peri);
  const tubeShow = clamp((fuse - 0.55) / 0.45);

  // Hints of the cavities at the edges: amnion above, the yolk-sac wall below.
  const amnOut = arc(500, 186, 460, 140, 180, 360, 70);
  const amnIn = arc(500, 186, 452, 132, 180, 360, 70);
  const yolkIn = arc(500, F.endoBot - 12, 454, 112, 0, 180, 70);
  const yolkOut = arc(500, F.endoBot - 12, 464, 122, 0, 180, 70);

  return (
    <g>
      <Defs10 />
      <defs>
        <linearGradient id="w10s-fadeg" x1={F.x0} x2={F.x1} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset={(F.fade / (F.x1 - F.x0)).toFixed(3)} stopColor="#fff" stopOpacity={1} />
          <stop offset={(1 - F.fade / (F.x1 - F.x0)).toFixed(3)} stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="w10s-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
          <rect x={F.x0} y={0} width={F.x1 - F.x0} height={640} fill="url(#w10s-fadeg)" />
        </mask>
      </defs>

      <g mask="url(#w10s-fade)">
        <Part id="amnios-barrunbea">
          <path d={d([...amnIn, ...ectoTop.slice().reverse()])} fill={T.space} />
          <path d={d([...amnIn, ...ectoTop.slice().reverse()])} fill={T.amnionCavity} />
        </Part>
        <Part id="amnioblastoak" quiet>
          <Cells outer={amnOut} inner={amnIn} n={70} fill={T.amnion} nucleus="rgba(30,60,140,0.6)" seed={3} />
        </Part>
        <Part id="bitelo-zaku-sekundarioa">
          <path d={d([...XS.map((x): Pt => [x, F.endoBot]).reverse(), ...yolkIn])} fill={T.yolk} />
          <Cells outer={yolkOut} inner={yolkIn} n={64} fill={T.endo} nucleus="rgba(90,60,10,0.7)" seed={5} />
        </Part>

        {/* Mesoderm beside the midline (paraxial; it stays put while the lateral layers change). */}
        <Part id="mesodermo-intraenbrionarioa" quiet>
          <path d={d([...ectoBot, ...XS.map((x): Pt => [x, F.endoTop]).reverse()])} fill={T.mesoDeep} />
          <path d={d([...ectoBot, ...XS.map((x): Pt => [x, F.endoTop]).reverse()])} fill="url(#w10-mes)" />
          {Array.from({ length: 46 }, (_, i) => {
            const sd = i % 2 ? 1 : -1;
            const x = 500 + sd * lerp(26, F.cm - 500 - 8, rand(i * 2.7));
            const y = lerp(ectoBottomAt(x) + 8, F.endoTop - 8, rand(i * 4.1));
            const nearNoto = Math.hypot(x - F.noto[0], y - F.noto[1]) < F.notoR + 8;
            const nearAo = Math.hypot(Math.abs(x - 500) - (F.aorta[0] - 500), y - F.aorta[1]) < F.aortaR + 9;
            if (nearNoto || nearAo) return null;
            return <Stellate key={i} x={x} y={y} r={2.6} a={rand(i * 9.1) * 180} color={T.paraxial} />;
          })}
        </Part>

        {/* Lateral mesoderm, both sides: parietal layer, coelom, visceral layer. */}
        {([1, -1] as const).map((sd) => (
          <g key={sd}>
            <Part id="paretako-orria">
              <path d={d(flip(parietal, sd))} fill={mix(T.parietal, '#1a0a10', 0.5)} />
              <path d={d(flip(parietal, sd))} fill="url(#w10-mes)" />
              <Cells outer={flip(roofLining, sd)} inner={flip(cTop, sd)} n={13} fill={T.parietal} nucleus="rgba(120,20,30,0.7)" edge="rgba(120,20,30,0.35)" seed={11 + sd} />
            </Part>
            <Part id="errai-orria">
              <path d={d(flip(visceral, sd))} fill={mix(T.visceral, '#1a0a10', 0.55)} />
              <path d={d(flip(visceral, sd))} fill="url(#w10-mes)" />
              <Cells outer={flip(floorLining, sd)} inner={flip(cBot, sd)} n={13} fill={T.visceral} nucleus="rgba(90,10,24,0.75)" edge="rgba(90,10,24,0.35)" seed={21 + sd} />
            </Part>
            <Part id="enbrioi-barruko-zeloma" show={1 - peri}>
              <path d={smoothPath(flip(closed(cTop, cBot), sd), true, 0.1)} fill={T.space} />
              <path d={smoothPath(flip(closed(cTop, cBot), sd), true, 0.1)} fill={T.cavity} />
            </Part>
            <Part id="perikardio-barrunbea" show={peri}>
              <path d={smoothPath(flip(closed(cTop, cBot), sd), true, 0.1)} fill={T.space} />
              <path d={smoothPath(flip(closed(cTop, cBot), sd), true, 0.1)} fill={T.peri} />
            </Part>

            {/* Cells arriving from the streak into the visceral layer. */}
            <g opacity={vis(t, S.migrate[0] - 0.01, S.islands[1])}>
              {MIG.map((m, i) => {
                const k = clamp((mig - m.delay) / 0.6);
                const p: Pt = [lerp(m.from[0], m.to[0], k), lerp(m.from[1], m.to[1], k) - Math.sin(k * Math.PI) * 10];
                const q = sd > 0 ? p : mirror(p);
                return <Stellate key={i} x={q[0]} y={q[1]} r={3.2} a={lerp(0, 20, k) + i * 30} color={T.angioblast} />;
              })}
            </g>

            {/* Blood islands → vessels → one endocardial tube on each side. */}
            <Part id="odol-irlatxoak" show={isl * (1 - tubeShow)}>
              {F.islands.map((x, j) => {
                const c: Pt = [lerp(x, F.tube[0], fuse), F.tube[1] + (j === 1 ? 2 : -2) * (1 - fuse)];
                const cc = sd > 0 ? c : mirror(c);
                return <Island key={j} c={cc} r={lerp(8, 16, isl)} ves={ves} seed={j * 2 + (sd > 0 ? 0 : 5)} />;
              })}
            </Part>
            <Part id="bihotz-hodiak" show={tubeShow}>
              {(() => {
                const c: Pt = sd > 0 ? [F.tube[0], F.tube[1] - peri * 4] : mirror([F.tube[0], F.tube[1] - peri * 4]);
                const rx = 44 * tubeR;
                const ry = 25 * tubeR;
                return (
                  <g>
                    <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(rx)} ry={f1(ry)} fill={T.blood} />
                    {Array.from({ length: 8 }, (_, q) => (
                      <ellipse key={q} cx={f1(c[0] - rx * 0.62 + q * rx * 0.18)} cy={f1(c[1] + Math.sin(q * 2.3 + sd) * ry * 0.38)} rx={3.4} ry={2.5} fill={T.island} stroke="rgba(70,8,14,0.6)" strokeWidth={0.6} />
                    ))}
                    <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(rx)} ry={f1(ry)} fill="none" stroke={T.endocard} strokeWidth={4} />
                    <ellipse cx={f1(c[0])} cy={f1(c[1])} rx={f1(rx)} ry={f1(ry)} fill="url(#w10-ball)" />
                  </g>
                );
              })()}
            </Part>
          </g>
        ))}

        {/* Notochord in the midline; the dorsal aortae beside it (cell islands first, then two vessels). */}
        <Part id="notokorda">
          <circle cx={F.noto[0]} cy={F.noto[1]} r={F.notoR} fill={T.noto} stroke="#4c1d95" strokeWidth={1.2} />
          <circle cx={F.noto[0]} cy={F.noto[1]} r={F.notoR} fill="url(#w10-ball)" />
        </Part>
        <Part id="aorta-dortsalak" show={clamp(ao * 3)}>
          {[-1, 1].map((sd) => {
            const c: Pt = sd > 0 ? F.aorta : mirror(F.aorta);
            const lumen = seg(ao, 0.35, 1);
            const r = lerp(8, F.aortaR, lumen);
            return (
              <g key={sd}>
                {lumen < 0.98 &&
                  Array.from({ length: 6 }, (_, q) => {
                    const a = q * 1.05;
                    const k = q === 0 ? 0 : 0.6;
                    return <circle key={q} cx={f1(c[0] + Math.cos(a) * 8 * k)} cy={f1(c[1] + Math.sin(a) * 8 * k)} r={3.2} fill={T.angioblast} stroke="rgba(110,20,24,0.7)" strokeWidth={0.8} opacity={1 - lumen} />;
                  })}
                <g opacity={lumen}>
                  <circle cx={c[0]} cy={c[1]} r={f1(r)} fill={T.aorta} stroke={T.aortaDeep} strokeWidth={1.4} />
                  <circle cx={c[0]} cy={c[1]} r={f1(r * 0.62)} fill={T.blood} />
                  <circle cx={c[0]} cy={c[1]} r={f1(r)} fill="url(#w10-ball)" />
                </g>
              </g>
            );
          })}
        </Part>

        <Part id="endodermoa">
          <Cells outer={XS.map((x): Pt => [x, F.endoTop])} inner={XS.map((x): Pt => [x, F.endoBot])} n={64} fill={T.endo} nucleus="rgba(90,60,10,0.7)" seed={41} />
        </Part>
        <Part id="ektodermoa">
          <Cells outer={ectoTop.slice(0, pa + 1)} inner={ectoBot.slice(0, pa + 1)} n={22} fill={T.ecto} nucleus="rgba(20,40,110,0.7)" pseudo seed={51} />
          <Cells outer={ectoTop.slice(pb - 1)} inner={ectoBot.slice(pb - 1)} n={22} fill={T.ecto} nucleus="rgba(20,40,110,0.7)" pseudo seed={52} />
        </Part>
        <Part id="plaka-neurala">
          <Cells outer={ectoTop.slice(pa, pb)} inner={ectoBot.slice(pa, pb)} n={34} fill={T.neural} nucleus="rgba(10,20,70,0.75)" pseudo seed={61} />
        </Part>
      </g>

      <Label id="amnios-barrunbea" x={210} y={84} ax={300} ay={100} />
      <Label id="ektodermoa" x={210} y={140} ax={300} ay={148} />
      <Label id="paretako-orria" x={210} y={190} ax={300} ay={186} />
      <Label id="enbrioi-barruko-zeloma" x={210} y={244} ax={300} ay={243} show={1 - peri} small />
      <Label id="perikardio-barrunbea" x={210} y={244} ax={300} ay={243} show={peri} />
      <Label id="errai-orria" x={210} y={330} ax={300} ay={392} />
      <Label id="endodermoa" x={210} y={428} ax={300} ay={428} />
      <Label id="bitelo-zaku-sekundarioa" x={210} y={510} ax={330} ay={500} small />
      <Label id="plaka-neurala" x={790} y={96} ax={548} ay={164} />
      <Label id="notokorda" x={790} y={214} ax={510} ay={236} />
      <Label id="aorta-dortsalak" x={790} y={280} ax={F.aorta[0] + 4} ay={F.aorta[1]} show={seg(ao, 0.3, 0.7)} />
      <Label id="odol-irlatxoak" x={790} y={356} ax={F.islands[1] + 4} ay={F.tube[1] - 2} show={vis(t, S.islands[0] + 0.02, S.fuse[1] - 0.02)} />
      <Label id="bihotz-hodiak" x={790} y={356} ax={F.tube[0] + 14} ay={F.tube[1] - peri * 4} show={tubeShow} text="Endokardio hodia" />
    </g>
  );
}

/** 10:eskualde-kardiogenikoa `zeharkakoa`. */
export function CardiogenicSection({ t }: SceneProps) {
  return (
    <g>
      <SectionArt t={t} />
      <Note x={500} y={22} size={12.5} tone="dim">
        3. astea · zeharkako mozketa endokardio hodien mailan (gertutik)
      </Note>
      <Steps
        t={t}
        steps={[
          [0, 'Disko laua: ektodermoa, mesodermoa (alboetan zelomak bi orritan banatua) eta endodermoa'],
          [0.14, 'Lerro primitibotik datozen zelulak alboko mesodermoaren errai orrira'],
          [0.32, 'Errai orrian zelula multzoak: odol irlatxoak'],
          [0.48, 'Irlatxoetatik odoleko zelulak (barruan) eta odol hodiak (pareta)'],
          [0.62, 'Hodiak fusionatu: alde bakoitzean endokardio hodi bat'],
          [0.74, 'Zeloma zabaltzen da: perikardio barrunbea'],
          [0.86, 'Notokordaren bi aldeetan: aorta dortsalak'],
        ]}
      />
    </g>
  );
}
