'use client';

import { Arrow, C, Cell, Label, Mark, Note, Part, lerp, seg, zoom, type Pt, type SceneProps } from '@/components/kit';

const GOLD = '#ffba72';
const TEAL = '#5eead4';

/** Original schematic: dorsal is up. Coordinates are local tissue units, magnified by zoom(). */
function geometry(t: number) {
  const close = seg(t, 0, 0.095);
  const gap = lerp(18, 0, close);
  const z = zoom(0, 61, lerp(3.15, 2.65, seg(t, 0.15, 0.175)), 500, 320);
  return { gap, close, z };
}
function Melanocyte({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M0,0L-8,-3M0,0L-7,5M0,0L2,7M0,0L9,2M0,0L5,-5" fill="none" stroke={GOLD} strokeWidth={1.2} />
    <ellipse rx={4.5} ry={3} fill="#8b482a" stroke={GOLD} strokeWidth={0.8} />
  </g>;
}

export function CrestSection({ t, reduced }: SceneProps) {
  const { gap, close, z } = geometry(t);
  const emt = seg(t, 0.025, 0.13);
  const dorsal = seg(t, 0.182, 0.247);
  const ventral = seg(t, 0.31, 0.455);
  const mode = t < 0.18 ? 0 : t < 0.3 ? 1 : 2;
  const dimD = mode === 2 ? 0.28 : 1;
  const dimV = mode === 1 ? 0.22 : 1;
  const label = (id: string, x: number, y: number, p: Pt, show = 1) => {
    const [ax, ay] = z.at(...p);
    return <Label key={id} id={id} x={x} y={y} ax={ax} ay={ay} show={show} small />;
  };
  return <g>
    <defs>
      <clipPath id="w4-crest-section-crop"><rect x={218} y={76} width={564} height={476} rx={28} /></clipPath>
      <linearGradient id="w4-crest-tissue" x2="0" y2="1"><stop stopColor="#15283b" /><stop offset="1" stopColor="#101821" /></linearGradient>
    </defs>
    <rect x={218} y={76} width={564} height={476} rx={28} fill="url(#w4-crest-tissue)" stroke="#28414b" />
    <g clipPath="url(#w4-crest-section-crop)">
      <g transform={z.transform}>
        {/* A paired somite leaves a conspicuous corridor on each side of the tube. */}
        <Part id="somitak" show={mode === 2 ? 0.85 : 0.35}>
          {[-1, 1].map(sd => <g key={sd}>
            <ellipse cx={sd * 84} cy={64} rx={27} ry={35} fill={C.mesoIntra} fillOpacity={0.5} stroke="#f3a9a1" strokeWidth={0.8} />
            {Array.from({ length: 16 }, (_, i) => {
              const a = i * Math.PI / 8;
              return <ellipse key={i} cx={sd * 84 + Math.cos(a) * 21} cy={64 + Math.sin(a) * 28} rx={2} ry={3} fill="#bf6c75" transform={`rotate(${i * 22.5} ${sd * 84 + Math.cos(a) * 21} ${64 + Math.sin(a) * 28})`} />;
            })}
            <ellipse cx={sd * 84} cy={64} rx={9} ry={15} fill="#342634" />
          </g>)}
        </Part>
        <Part id="azaleko-ektodermoa" show={mode === 1 ? 1 : 0.48}>
          {[-1, 1].map(sd => <g key={sd} transform={`scale(${sd} 1)`}>
            <path d={`M${gap},-10H116V-2H${gap}Z`} fill={C.surfaceEcto} stroke="#a5c7f9" strokeWidth={0.7} />
            <path d={`M${gap},-2Q${gap - 5},2 ${gap},14`} fill="none" stroke={C.surfaceEcto} strokeWidth={6} opacity={1 - close} />
            {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${22 + i * 5},-10v8`} stroke="#244e81" strokeWidth={0.6} />)}
          </g>)}
        </Part>
        <Part id="hodi-neurala" show={0.64}>
          <path d={`M${-gap},19 C-39,18 -38,85 -20,96 Q0,113 20,96 C38,85 39,18 ${gap},19`}
            fill="none" stroke={C.neural} strokeWidth={14} strokeLinecap="round" />
          {Array.from({ length: 21 }, (_, i) => {
            const a = (24 + i * 15.6) * Math.PI / 180;
            return <path key={i} d={`M${Math.sin(a) * 22},${61 - Math.cos(a) * 34}L${Math.sin(a) * 33},${61 - Math.cos(a) * 45}`} stroke="#193c74" strokeWidth={0.7} />;
          })}
        </Part>
        <Part id="notokorda" show={0.38}><ellipse cy={119} rx={10} ry={7} fill={C.notochord} stroke="#c4b5fd" strokeWidth={0.8} /></Part>
        <Part id="aorta-dortsalak" show={0.3}>
          {[-1, 1].map(sd => <ellipse key={sd} cx={sd * 30} cy={142} rx={9} ry={6} fill="#3f2033" stroke="#ec8290" strokeWidth={2} />)}
        </Part>
        {[-1, 1].map(sd => <g key={sd}>
          <Mark id="tolesdura-neuralak" x={sd * (gap + 3)} y={17} rx={12} ry={13} show={mode === 0 ? 0.85 : 0} color="#fbd68c" />
          {/* Cells start IN the fold rim, lose their tall shape and separate into a dorsal pool. */}
          <Part id="gandor-neurala">
            {[0, 1, 2].map(i => <Cell key={i} x={sd * lerp(gap + 3 + i * 4, 13 + i * 9, emt)} y={lerp(17, 6 + i * 2, emt)} r={4} rx={lerp(2, 4.5, emt)} ry={lerp(7, 3.7, emt)} color={TEAL} nucleus="#155e59" />)}
          </Part>
          <g opacity={dimD}>
            <Arrow from={[sd * 29, 8]} to={[sd * 100, 8]} bend={0} color={GOLD} width={1.3} head={4} progress={dorsal} flow={!reduced && dorsal > 0 && dorsal < 1} />
            <Part id="gandor-neurala">
              {[0, 1, 2].map(i => {
                const u = seg(t, 0.182 + i * 0.003, 0.235 + i * 0.005);
                return <g key={i} opacity={(1 - seg(t, 0.247, 0.258)) * (mode === 0 ? 0 : 1)}>
                  <Cell x={sd * lerp(26, 65 + i * 17, u)} y={8} r={4} rx={5} ry={3.7} color={GOLD} nucleus="#874820" />
                </g>;
              })}
            </Part>
            <Part id="melanozitoak" show={seg(t, 0.247, 0.258)}>
              {[65, 82, 99].map(x => <Melanocyte key={x} x={sd * x} y={-1} />)}
            </Part>
          </g>
          <g opacity={dimV}>
            <Arrow from={[sd * 41, 19]} to={[sd * 45, 120]} bend={0.025 * sd} color={TEAL} width={1.5} head={4} progress={ventral} flow={!reduced && ventral > 0 && ventral < 1} />
            <Part id="gandor-neurala">
              {[0, 1, 2].map(i => {
                const u = seg(t, 0.305 + i * 0.01, 0.425 + i * 0.014);
                return <g key={i} opacity={seg(t, 0.3, 0.314) * (1 - seg(t, 0.453, 0.461))}>
                  <Cell x={sd * lerp(30, 45, Math.min(1, u * 3))} y={lerp(13, 66 + i * 26, u)} r={4.5} rx={4} ry={5.6} color={TEAL} nucleus="#155e59" />
                </g>;
              })}
            </Part>
            <Part id="gongoil-errakideoak" show={seg(t, 0.419, 0.442)}>
              <ellipse cx={sd * 45} cy={69} rx={7} ry={12} fill={TEAL} stroke="#12594f" strokeWidth={1} />
              {[0, 1, 2].map(i => <circle key={i} cx={sd * 45} cy={63 + i * 6} r={1.5} fill="#155e59" />)}
            </Part>
            <Part id="gongoil-sinpatikoak" show={seg(t, 0.444, 0.463)}>
              <ellipse cx={sd * 45} cy={124} rx={7} ry={6} fill={TEAL} stroke="#12594f" strokeWidth={1} />
            </Part>
          </g>
        </g>)}
      </g>
    </g>
    {label('tolesdura-neuralak', 204, 108, [-gap - 5, 19], mode === 0 ? 1 : 0)}
    {label('azaleko-ektodermoa', 204, 166, [-90, -6])}
    {label('hodi-neurala', 204, 273, [-29, 63])}
    {label('notokorda', 204, 507, [0, 119])}
    {label('gandor-neurala', 790, 103, [lerp(gap + 7, 22, emt), lerp(17, 8, emt)])}
    {label('somitak', 790, 284, [83, 62])}
    {label('melanozitoak', 790, 232, [82, -1], seg(t, 0.247, 0.258) * dimD)}
    {label('gongoil-errakideoak', 790, 387, [45, 69], seg(t, 0.419, 0.442))}
    {label('gongoil-sinpatikoak', 790, 455, [45, 124], seg(t, 0.444, 0.463))}
    {label('aorta-dortsalak', 790, 528, [30, 142], mode === 2 ? 0.7 : 0)}
    <Note x={500} y={57} tone="accent" size={16}>
      {mode === 0 ? '01 · Ertzetik askatu' : mode === 1 ? '02 · Azaleko ektodermopean' : '03 · Hodi neuralaren eta somiten artetik'}
    </Note>
    <Note x={500} y={574} tone="accent" size={16}>
      {mode === 0 ? 'Trantsizio epitelio-mesenkimatikoa: zelulak bereizi eta migratzeko prest' : mode === 1 ? 'Bide dortsolaterala → epidermiseko melanozitoak' : 'Bide bentrala → gongoil errakideoak eta gongoil sinpatikoak'}
    </Note>
    <Note x={500} y={602} tone="dim" size={15}>
      {mode === 0 ? 'Tolesdura neuralak → gandor neurala → migrazioa' : mode === 1 ? 'Epidermisean: melanozitoak, ile-folikuluak eta azazkalak' : 'Enborreko ebaki eskematikoa; gainerako eratorriak hurrengo ikuspegian'}
    </Note>
  </g>;
}
