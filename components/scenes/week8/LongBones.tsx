'use client';

import { useId } from 'react';
import { Arrow, Label, Note, Part, lerp, seg, smoothPath, zoom, type Pt, type SceneProps } from '@/components/kit';
import { Defs8, Q, f1, spline, vis } from './common';

/**
 * 8:hezur-luzeak — apunteen 4. atalaren bigarren zatia (12. astetik helduarora) eta haren irudiak.
 * Femur bat zutik: kartilago ereduan zentro primarioa (12. astea) → diafisia erditik muturretara hezurtzen da
 * (jaiotzean diafisia hezurra, epifisiak kartilagoa) → jaio ondoren zentro sekundarioak epifisietan → bien artean
 * hazkuntza plaka (kartilagoa) hezurra luzatzen (hurbilketa: zutabeetako kondrozitoak) → hazkuntza amaitzean plaka
 * hezurtu eta fusioa → bi plaka (femurra) eta plaka bakarra (falangea).
 */

export const HL_T = { primary: 0, parts: 0.14, prenatal: 0.26, secondary: 0.42, plate: 0.56, fusion: 0.72, count: 0.84 };

const CX = 470;
const MID = 322;
const SW = 40;
const EW = 76;
const E = 80;

/** A long bone standing upright, two wide ends (or one, for a phalanx). */
function boneOutline(cx: number, top: number, bot: number, sw: number, ew: number, e: number, oneEnd = false): Pt[] {
  const mid = (top + bot) / 2;
  const bw = oneEnd ? sw * 1.25 : ew;
  const R: Pt[] = [
    [cx, top - 4],
    [cx + ew * 0.7, top],
    [cx + ew, top + e * 0.4],
    [cx + ew * 0.85, top + e * 0.9],
    [cx + sw, top + e * 1.5],
    [cx + sw * 0.94, mid],
    [cx + sw, bot - (oneEnd ? e * 0.6 : e * 1.5)],
    [cx + bw * 0.85, bot - (oneEnd ? e * 0.35 : e * 0.9)],
    [cx + bw, bot - e * 0.4 * (oneEnd ? 0.5 : 1)],
    [cx + bw * 0.7, bot],
    [cx, bot + 4],
  ];
  const L = R.slice(1, -1)
    .map(([x, y]) => [2 * cx - x, y] as Pt)
    .reverse();
  return spline([...R, ...L], 8, true);
}

/** Columns of chondrocytes in a growth plate band [y0, y1], streaming toward the shaft (dir +1 = down). */
function PlateColumns({ cx, y0, y1, half, dir, t, rate }: { cx: number; y0: number; y1: number; half: number; dir: 1 | -1; t: number; rate: number }) {
  const cols = Math.floor((half * 2) / 7);
  const h = y1 - y0;
  return (
    <g>
      {Array.from({ length: cols }, (_, c) => {
        const x = cx - half + 4 + c * 7;
        return Array.from({ length: 5 }, (_, k) => {
          const u = (k / 5 + t * rate + c * 0.013) % 1;
          const y = dir > 0 ? y0 + u * h : y1 - u * h;
          const big = lerp(1, 1.9, Math.max(0, u - 0.5) * 2);
          return <ellipse key={`${c}-${k}`} cx={x} cy={y} rx={2.6 * big} ry={1.3 * big} fill={Q.cartCell} stroke={Q.cartDeep} strokeWidth={0.4} opacity={Math.min(1, (1 - u) * 6)} />;
        });
      })}
    </g>
  );
}

export function LongBone({ t, reduced }: SceneProps) {
  const cid = useId().replace(/:/g, '');
  const p1 = seg(t, 0.02, 0.08);
  const reach0 = seg(t, 0.08, 0.13) * 0.15 + seg(t, HL_T.prenatal + 0.01, HL_T.prenatal + 0.11) * 0.85;
  const Ld = 170 + 60 * seg(t, HL_T.prenatal + 0.01, HL_T.prenatal + 0.12) + 130 * seg(t, HL_T.plate + 0.02, HL_T.plate + 0.14);
  const s2 = seg(t, HL_T.secondary + 0.01, HL_T.secondary + 0.08);
  const cmp = seg(t, HL_T.count + 0.01, HL_T.count + 0.06);
  // In the comparison the femur is shown again as a growing (child) bone, with both plates open.
  const fzRaw = seg(t, HL_T.fusion + 0.01, HL_T.fusion + 0.07);
  const fz = fzRaw * (1 - cmp);
  const fid = (id: string) => (cmp > 0.01 ? 'femurra' : id);
  const push = seg(t, HL_T.plate + 0.04, HL_T.plate + 0.07) * (1 - seg(t, HL_T.fusion - 0.03, HL_T.fusion - 0.005));
  const top = MID - Ld / 2 - E;
  const bot = MID + Ld / 2 + E;
  const plateT = top + E + 8; // upper growth plate (between epiphysis and diaphysis)
  const plateB = bot - E - 8;
  const PH = 14;
  const reach = reach0 * (Ld / 2 + 8);
  const outline = boneOutline(CX, top, bot, SW, EW, E);
  // The rim of each joint end (outline from the top-left round over the top to the top-right; same at the bottom).
  const half = Math.floor(outline.length / 2);
  const line = (pts: Pt[]) => `M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}`;
  const capTop = line([...outline.slice(half).filter((p) => p[1] < top + E * 0.5), ...outline.slice(0, half).filter((p) => p[1] < top + E * 0.5)]);
  const capBot = line(outline.filter((p) => p[1] > bot - E * 0.5));
  // Camera: in on the upper growth plate while the bone lengthens.
  const zs = lerp(1, 2.8, push);
  const z = zoom(CX, lerp(320, plateT, push), zs, 500, 320);
  const A = (p: Pt) => z.at(p[0], p[1]);
  const inFrame = (p: Pt) => 1 - Math.min(1, Math.max(30 - p[0], p[0] - 970, 40 - p[1], p[1] - 596, 0) / 24);
  // Comparison: the femur slides left and shrinks, a phalanx comes in on the right.
  const fk = lerp(1, 0.78, cmp);
  const fx = lerp(0, -150, cmp);
  const femurT = `translate(${f1(fx)},0) translate(${CX},${MID}) scale(${fk.toFixed(3)}) translate(${-CX},${-MID})`;
  const F = (p: Pt): Pt => {
    const q = A(p);
    return [CX + fx + (q[0] - CX) * fk, MID + (q[1] - MID) * fk];
  };
  const clipId = `w8-hl-clip${cid}`;
  const age = t < HL_T.parts ? '12. astea' : t < HL_T.secondary ? (reach0 > 0.98 ? 'Jaiotza' : 'Jaio aurretik') : t < HL_T.fusion ? 'Jaio ondoren · haurtzaroa' : 'Helduaroa';
  const PX = 760;
  const ptop = 200;
  const pbot = 440;
  const phal = boneOutline(PX, ptop, pbot, 22, 40, 46, true);
  return (
    <g>
      <Defs8 />
      <rect x={0} y={0} width={1000} height={640} fill="#0f0f11" />
      <defs>
        {/* Spongy bone: ivory trabeculae with red marrow between them. */}
        <pattern id={`w8-hl-spongy${cid}`} width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#a5463a" />
          <circle cx="5" cy="20" r="1.3" fill="#d9776a" />
          <circle cx="19" cy="4" r="1.3" fill="#d9776a" />
          <path
            d="M0,6L9,4L15,11L26,8M9,4L10,0M9,4L6,15L15,11M6,15L0,19M6,15L12,23L21,19L26,21M15,11L21,19M12,23L11,26M21,19L23,26"
            fill="none"
            stroke={Q.bone}
            strokeWidth={2.6}
            strokeLinejoin="round"
          />
        </pattern>
        {/* Red marrow of the cavity: blood-forming cells. */}
        <pattern id={`w8-hl-marrow${cid}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#8e2f28" />
          <circle cx="3" cy="3" r="1.6" fill="#c2564a" />
          <circle cx="9" cy="8" r="1.4" fill="#b84a3f" />
          <circle cx="5" cy="10" r="0.9" fill="#e7b7a8" />
        </pattern>
        {/* Compact bone of the cortex: lamellae along the shaft. */}
        <pattern id={`w8-hl-compact${cid}`} width="6" height="40" patternUnits="userSpaceOnUse">
          <path d="M1.5,0V40" stroke="rgba(150,120,70,0.35)" strokeWidth={0.9} />
          <ellipse cx="4.5" cy="20" rx="0.8" ry="2" fill="rgba(110,85,40,0.45)" />
        </pattern>
        <linearGradient id={`w8-hl-round${cid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.3} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.08} />
          <stop offset="0.7" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.32} />
        </linearGradient>
      </defs>
      <clipPath id={clipId}>
        <path d={smoothPath(outline, true, 0.25)} />
      </clipPath>
      <g transform={femurT}>
        <g transform={z.transform}>
          {/* The cartilage model. */}
          <Part id="kartilago-eredua" show={1 - fzRaw}>
            <path d={smoothPath(outline, true, 0.25)} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={2} />
            <path d={smoothPath(outline, true, 0.25)} fill="url(#w8-cart)" />
          </Part>
          {/* Opaque backing under each later layer, so a dimmed layer recedes instead of showing the cartilage under it. */}
          <g clipPath={`url(#${clipId})`} fill="#1d1a22">
            {reach0 > 0.01 && <rect x={CX - 120} y={MID - reach} width={240} height={reach * 2} />}
            {s2 > 0.01 && (
              <>
                <rect x={CX - 120} y={top - 10} width={240} height={plateT - PH / 2 - top + 10} />
                <rect x={CX - 120} y={plateB + PH / 2} width={240} height={bot + 10 - plateB - PH / 2} />
              </>
            )}
          </g>
          {/* Diaphysis: bone spreading from the primary centre toward both ends. */}
          <Part id={fid('diafisia')} show={reach0 > 0.01 ? 1 : 0}>
            <g clipPath={`url(#${clipId})`}>
              {/* Compact cortex, spongy bone toward the ends, the marrow cavity hollowed out in the middle. */}
              <rect x={CX - 120} y={MID - reach} width={240} height={reach * 2} fill={Q.bone} />
              <rect x={CX - 120} y={MID - reach} width={240} height={reach * 2} fill={`url(#w8-hl-compact${cid})`} />
              <rect x={CX - SW * 0.68} y={MID - reach} width={SW * 1.36} height={reach * 2} rx={SW * 0.3} fill={`url(#w8-hl-spongy${cid})`} opacity={seg(reach0, 0.1, 0.5)} />
              <rect x={CX - SW * 0.6} y={MID - reach * 0.62} width={SW * 1.2} height={reach * 1.24} rx={SW * 0.6} fill={`url(#w8-hl-marrow${cid})`} opacity={seg(reach0, 0.3, 1)} />
            </g>
          </Part>
          {/* Epiphyses: cartilage until birth, then bone from their secondary centres. */}
          <Part id={fid('epifisiak')} show={Math.max(seg(t, HL_T.parts, HL_T.parts + 0.03) * (1 - s2), s2)}>
            <g clipPath={`url(#${clipId})`}>
              {[
                [top - 10, plateT - PH / 2],
                [plateB + PH / 2, bot + 10],
              ].map(([y0, y1], i) => (
                <g key={i}>
                  <rect x={CX - 120} y={y0} width={240} height={y1 - y0} fill={Q.cart} opacity={1 - s2} />
                  <rect x={CX - 120} y={y0} width={240} height={y1 - y0} fill="url(#w8-cart)" opacity={1 - s2} />
                  {s2 > 0.01 && (
                    <>
                      <circle cx={CX} cy={(y0 + y1) / 2} r={lerp(4, 90, s2)} fill={Q.bone} />
                      <circle cx={CX} cy={(y0 + y1) / 2} r={lerp(4, 90, s2) * 0.86} fill={`url(#w8-hl-spongy${cid})`} />
                    </>
                  )}
                </g>
              ))}
            </g>
          </Part>
          <Part id="hezurtzapen-zentro-sekundarioak" show={s2 > 0.01 ? 1 - fz * 0.8 : 0}>
            {[(top + plateT) / 2, (plateB + bot) / 2].map((y, i) => (
              <g key={i}>
                <ellipse cx={CX} cy={y} rx={lerp(3, 16, s2)} ry={lerp(3, 12, s2)} fill={Q.centre} stroke={Q.osteo} strokeWidth={1} opacity={1 - 0.6 * seg(s2, 0.7, 1)} />
                {[-1, 0, 1].map((q) => (
                  <circle key={q} cx={CX + q * 6 * s2} cy={y + (q % 2) * 3} r={1.6} fill={Q.osteo} opacity={1 - 0.6 * seg(s2, 0.7, 1)} />
                ))}
              </g>
            ))}
          </Part>
          {/* Growth plates (metaphyses): cartilage left between epiphysis and diaphysis, until growth ends. */}
          <Part id="hazkuntza-plaka" show={reach0 > 0.98 ? 1 : 0}>
            <g clipPath={`url(#${clipId})`}>
              {[plateT, plateB].map((y, i) => (
                <g key={i}>
                  <rect x={CX - 120} y={y - PH / 2} width={240} height={PH} fill={fz > 0.5 ? Q.bone : Q.cart} opacity={1 - fz * 0.85} />
                  {fz < 0.5 && <PlateColumns cx={CX} y0={y - PH / 2} y1={y + PH / 2} half={SW * 1.25} dir={i ? -1 : 1} t={reduced ? 0 : t} rate={12} />}
                </g>
              ))}
              {/* After fusion only a thin epiphyseal line is left. */}
              {fz > 0.01 && [plateT, plateB].map((y, i) => <path key={i} d={`M${CX - 100},${f1(y)}H${CX + 100}`} stroke={Q.boneDeep} strokeWidth={1.4} opacity={fz} />)}
            </g>
          </Part>
          {/* Primary ossification centre with its vessel, in the middle of the shaft. */}
          <Part id="hezurtzapen-zentroak" show={p1 * (1 - 0.7 * seg(t, HL_T.prenatal + 0.12, HL_T.secondary))}>
            <path d={`M${CX + 110},${MID - 30}Q${CX + 60},${MID - 10} ${CX + 6},${MID}`} fill="none" stroke={Q.vessel} strokeWidth={3} strokeLinecap="round" />
            {/* The centre melts into the marrow cavity; its vessel stays as the nutrient artery. */}
            <g opacity={1 - seg(t, HL_T.secondary, HL_T.secondary + 0.03)}>
              <ellipse cx={CX} cy={MID} rx={lerp(4, 22, p1)} ry={lerp(4, 16, p1)} fill={Q.centre} stroke={Q.osteo} strokeWidth={1.2} />
              {[-2, -1, 0, 1, 2].map((q) => (
                <circle key={q} cx={CX + q * 7 * p1} cy={MID + (q % 2) * 5} r={1.8} fill={Q.osteo} />
              ))}
            </g>
          </Part>
          {/* Joint ends: a cap of articular cartilage stays on each epiphysis for life. */}
          {s2 > 0.01 && (
            <g clipPath={`url(#${clipId})`} opacity={seg(s2, 0.4, 1)} pointerEvents="none">
              {[capTop, capBot].map((d, i) => (
                <g key={i}>
                  <path d={d} fill="none" stroke={Q.cart} strokeWidth={13} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="url(#w8-cart)" strokeWidth={13} strokeLinecap="round" />
                </g>
              ))}
            </g>
          )}
          {/* The bone is round: shade both flanks. */}
          <path d={smoothPath(outline, true, 0.25)} fill={`url(#w8-hl-round${cid})`} pointerEvents="none" />
          <Part id="femurra" quiet>
            <path d={smoothPath(outline, true, 0.25)} fill="none" stroke={fz > 0.5 ? Q.boneDeep : Q.cartDeep} strokeWidth={2.2} />
          </Part>
        </g>
      </g>
      {/* Phalanx: one growth plate only. */}
      {cmp > 0.01 && (
        <g opacity={cmp}>
          <Part id="falangeak">
            <clipPath id={`w8-hl-pclip${cid}`}>
              <path d={smoothPath(phal, true, 0.25)} />
            </clipPath>
            <path d={smoothPath(phal, true, 0.25)} fill={Q.bone} />
            <g clipPath={`url(#w8-hl-pclip${cid})`}>
              <rect x={PX - 60} y={ptop - 10} width={120} height={pbot - ptop + 20} fill={`url(#w8-hl-compact${cid})`} />
              <rect x={PX - 34} y={ptop - 10} width={68} height={60} fill={`url(#w8-hl-spongy${cid})`} />
              <rect x={PX - 14} y={ptop + 62} width={28} height={pbot - ptop - 96} rx={12} fill={`url(#w8-hl-marrow${cid})`} />
              <rect x={PX - 22} y={pbot - 40} width={44} height={44} rx={14} fill={`url(#w8-hl-spongy${cid})`} />
              <path d={`M${PX - 44},${ptop + 10}Q${PX},${ptop - 16} ${PX + 44},${ptop + 10}`} fill="none" stroke={Q.cart} strokeWidth={12} />
            </g>
            <path d={smoothPath(phal, true, 0.25)} fill={`url(#w8-hl-round${cid})`} stroke={Q.boneDeep} strokeWidth={2} />
          </Part>
          <Part id="hazkuntza-plaka">
            <rect x={PX - 34} y={ptop + 46 - 6} width={68} height={12} rx={3} fill={Q.cart} stroke={Q.cartDeep} strokeWidth={1.2} />
          </Part>
        </g>
      )}
      {/* Growth arrows: from both plates of the femur, from the single plate of the phalanx. */}
      {cmp > 0.5 && (
        <>
          <Arrow from={F([CX, plateT - 20])} to={[F([CX, plateT - 20])[0], F([CX, plateT - 20])[1] - 46]} bend={0} color="#f0c674" width={3.4} show={seg(cmp, 0.5, 1)} />
          <Arrow from={F([CX, plateB + 20])} to={[F([CX, plateB + 20])[0], F([CX, plateB + 20])[1] + 46]} bend={0} color="#f0c674" width={3.4} show={seg(cmp, 0.5, 1)} />
          <Arrow from={[PX, ptop + 20]} to={[PX, ptop - 30]} bend={0} color="#f0c674" width={3.4} show={seg(cmp, 0.5, 1)} />
        </>
      )}

      {/* Age along a timeline. */}
      <Note x={250} y={30} size={13} tone="accent" show={1 - cmp}>
        {age}
      </Note>
      {push > 0.5 && (
        <Note x={500} y={56} size={12} show={seg(push, 0.5, 1)}>
          Hazkuntza plaka: kondrozitoak zutabetan, diafisirantz hezurra eratuz
        </Note>
      )}
      <Note x={500} y={612} tone="accent" show={vis(t, 0, HL_T.parts)}>
        12. astea: hezur luze guztien erdiko atalean hezurtzapen zentro primarioa
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.parts, HL_T.prenatal)}>
        Bi atal: diafisia (gorputza, erdian) eta epifisiak (muturrak)
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.prenatal, HL_T.secondary)}>
        Jaio aurretik diafisia erditik muturretara hezurtzen da; epifisiak kartilago jaiotzara arte
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.secondary, HL_T.plate)}>
        Jaio ondoren: epifisietan hezurtzapen zentro sekundarioak
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.plate, HL_T.fusion)}>
        Diafisi eta epifisien artean hazkuntza plaka (metafisia) hezurtu gabe: hezurra luzatzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.fusion, HL_T.count)}>
        Hazkuntza maximoan metafisia desagertu eta diafisia epifisiekin fusionatzen da
      </Note>
      <Note x={500} y={612} tone="accent" show={vis(t, HL_T.count)}>
        Femurra: bi hazkuntza plaka (bi muturretatik) · falangea: plaka bakarra (mutur batetik)
      </Note>

      <Label id="epifisiak" x={190} y={130} {...pt(F([CX - EW * 0.8, top + E * 0.45]))} show={vis(t, HL_T.parts) * (1 - cmp) * inFrame(F([CX - EW * 0.8, top + E * 0.45]))} />
      <Label id="hazkuntza-plaka" x={190} y={230} {...pt(F([CX - SW * 1.1, plateT]))} show={vis(t, HL_T.plate) * inFrame(F([CX - SW * 1.1, plateT]))} />
      {/* Inside the bone already formed (it spreads from the centre toward the ends). */}
      <Label id="diafisia" x={190} y={390} {...pt(F([CX - SW * 0.9, MID + Math.min(40, reach * 0.5)]))} show={vis(t, HL_T.parts) * (1 - cmp) * inFrame(F([CX - SW * 0.9, MID + 40]))} />
      <Label id="kartilago-eredua" x={190} y={500} {...pt(F([CX - SW, bot - E * 1.6]))} show={(1 - seg(t, HL_T.secondary, HL_T.secondary + 0.03)) * inFrame(F([CX - SW, bot - E * 1.6]))} />
      <Label id="hezurtzapen-zentro-sekundarioak" x={716} y={240} {...pt(F([CX + 14, (top + plateT) / 2]))} show={vis(t, HL_T.secondary, HL_T.fusion) * inFrame(F([CX + 14, (top + plateT) / 2]))} />
      <Label id="hezurtzapen-zentroak" text="Zentro primarioa" x={810} y={360} {...pt(F([CX + 20, MID + 4]))} show={p1 * (1 - seg(t, HL_T.secondary, HL_T.secondary + 0.03)) * inFrame(F([CX + 20, MID + 4]))} />
      <Label id="femurra" x={190} y={520} {...pt(F([CX - SW, MID + 110]))} show={vis(t, HL_T.count)} />
      <Label id="falangeak" x={810} y={250} ax={PX + 24} ay={(ptop + pbot) / 2} show={cmp} />
    </g>
  );
}

const pt = (p: Pt) => ({ ax: p[0], ay: p[1] });
