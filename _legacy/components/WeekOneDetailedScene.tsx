"use client";

import type { KeyboardEvent, ReactNode } from 'react';
import type { Stage, Topic } from '@/content/types';

type Props = {
  topic: Topic;
  stage: Stage;
  stageProgress: number;
  selectedId?: string;
  relationIds: string[];
  isolated: boolean;
  showLabels: boolean;
  showComparison: boolean;
  onSelect: (id: string) => void;
};

const ink = '#263e46';
const soft = '#dbe7e4';
const teal = '#5d9e98';
const coral = '#dc8477';
const gold = '#d7ab66';
const paper = '#f6f2eb';

export default function WeekOneDetailedScene({ topic, stage, stageProgress, selectedId, relationIds, isolated, showLabels, showComparison, onSelect }: Props) {
  const pick = (id: string, child: ReactNode) => {
    const active = selectedId === id;
    const dimmed = isolated && selectedId !== id && !relationIds.includes(id);
    const selectable = stage.structures.includes(id);
    const key = (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(id); }
    };
    return <g key={id} role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
      aria-label={selectable ? topic.structures.find((item) => item.id === id)?.label.primary ?? id : undefined}
      onClick={selectable ? () => onSelect(id) : undefined} onKeyDown={selectable ? key : undefined}
      style={{ cursor: selectable ? 'pointer' : undefined, opacity: dimmed ? .22 : 1, filter: active ? 'drop-shadow(0 0 8px #4f9f93)' : undefined }}>{child}</g>;
  };
  const label = (x: number, y: number, title: string, anchor: 'start' | 'middle' | 'end' = 'start') =>
    showLabels ? <text x={x} y={y} textAnchor={anchor} fill={ink} fontSize="15" fontWeight="650">{title}</text> : null;
  const caption = (text: string) => <text x="450" y="510" textAnchor="middle" fill="#536971" fontSize="13">{text}</text>;
  const oocyte = (cx: number, cy: number, radius = 92, corona = true, zona = true) => <>
    {corona && pick('corona-radiata', <g>{Array.from({ length: 18 }, (_, i) => {
      const a = i * Math.PI * 2 / 18;
      return <ellipse key={i} cx={cx + Math.cos(a) * (radius + 21)} cy={cy + Math.sin(a) * (radius + 21)} rx="14" ry="10" transform={`rotate(${i * 20} ${cx + Math.cos(a) * (radius + 21)} ${cy + Math.sin(a) * (radius + 21)})`} fill="#f5d5c5" stroke={coral} strokeWidth="2" />;
    })}</g>)}
    {zona && pick('zona-pellucida', <circle cx={cx} cy={cy} r={radius + 3} fill="#f5ead8" stroke={gold} strokeWidth="13" />)}
    {pick('secondary-oocyte', <><circle cx={cx} cy={cy} r={radius - 7} fill="#e4f0e9" stroke={teal} strokeWidth="3" />{stageId !== 'pronuclei-zygote' && <circle cx={cx + 5} cy={cy} r="17" fill="#9fc7bd" stroke={teal} strokeWidth="2" />}</>)}
  </>;
  const sperm = (x: number, y: number, id = 'sperm', angle = 0) => pick(id, <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <path d="M-13 0 C-36 -22 -54 22 -79 3 C-91 -4 -103 3 -115 7" fill="none" stroke={ink} strokeWidth="3" />
    <ellipse cx="0" cy="0" rx="19" ry="8" fill="#d2e4e1" stroke={ink} strokeWidth="2" />
    <path d="M10 -6 Q25 0 10 6" fill={coral} stroke={coral} />
  </g>);
  const zoneTitle = (title: string, subtitle?: string) => <><text x="42" y="57" fill={ink} fontSize="22" fontWeight="750">{title}</text>{subtitle && <text x="42" y="82" fill="#64777a" fontSize="14">{subtitle}</text>}</>;
  const stageId = stage.id;
  const isAnatomy = stageId === 'anatomy' || stageId === 'ovulation';
  const isBarrier = ['capacitation', 'corona-radiata', 'acrosome-reaction', 'membrane-fusion', 'cortical-reaction', 'pronuclei-zygote'].includes(stageId);
  const cleavageCount = stageId === 'cleavage-2' ? 2 : stageId === 'cleavage-4' ? 4 : stageId === 'cleavage-8' ? 8 : stageId === 'morula-compaction' ? 16 : 0;
  const isBlast = ['blastocyst-formation', 'hatching', 'implantation'].includes(stageId);

  return <svg className="scene-svg" viewBox="0 0 900 520" role="img" aria-label={stage.title.primary} style={{ width: '100%', height: '100%' }}>
    <rect width="900" height="520" fill={paper} />
    {stageId === 'orientation' && <>
      {zoneTitle('Gorputzaren planoak', 'Kokapen anatomikoa, gorputzaren orientazioa aldatuta ere')}
      {pick('sagittal-plane', <><ellipse cx="175" cy="264" rx="78" ry="108" fill="#e9ded2" stroke={gold} strokeWidth="2" /><path d="M175 154 V373" stroke={coral} strokeWidth="5" strokeDasharray="9 7" />{label(175, 407, 'Plano sagitala', 'middle')}{label(175, 429, 'goitik ikusita', 'middle')}</>)}
      {pick('coronal-plane', <><path d="M424 157 Q484 157 514 213 L514 330 Q483 373 425 373 Q389 341 389 264 Q389 193 424 157Z" fill="#e9ded2" stroke={gold} strokeWidth="2" /><path d="M450 154 V373" stroke={teal} strokeWidth="5" strokeDasharray="9 7" />{label(450, 407, 'Plano koronala', 'middle')}{label(450, 429, 'albotik ikusita', 'middle')}</>)}
      {pick('transverse-plane', <><rect x="640" y="157" width="170" height="215" rx="55" fill="#e9ded2" stroke={gold} strokeWidth="2" /><path d="M640 264 H810" stroke={coral} strokeWidth="5" strokeDasharray="9 7" />{label(725, 407, 'Zeharkako planoa', 'middle')}{label(725, 429, 'aurretik ikusita', 'middle')}</>)}
      {caption('Kraneala ↕ kaudala · bentrala ↔ dortsala')}
    </>}
    {isAnatomy && <>
      {zoneTitle(stageId === 'ovulation' ? 'Obulazioa eta harrera' : 'Ugal-aparatuko ibilbidea', 'Eskema aurretik ikusita · distantziak eskematikoak dira')}
      {pick('uterus', <path d="M357 188 Q310 216 330 302 Q352 372 450 389 Q548 372 570 302 Q590 216 543 188 Q506 216 450 219 Q394 216 357 188Z" fill="#f4d3ca" stroke={coral} strokeWidth="5" />)}
      {pick('endometrium', <path d="M383 240 Q362 286 390 321 Q412 340 450 347 Q488 340 510 321 Q538 286 517 240 Q485 257 450 260 Q415 257 383 240Z" fill="#ffeae0" stroke="#d79a8d" strokeWidth="3" />)}
      {pick('ampulla', <><path d="M350 207 C263 169 202 190 155 213 M550 207 C637 169 698 190 745 213" fill="none" stroke={coral} strokeWidth="28" strokeLinecap="round" /><path d="M350 207 C263 169 202 190 155 213 M550 207 C637 169 698 190 745 213" fill="none" stroke="#fff3ea" strokeWidth="14" strokeLinecap="round" /></>)}
      {pick('isthmus', <><path d="M357 207 Q331 193 300 189 M543 207 Q569 193 600 189" fill="none" stroke="#b96361" strokeWidth="9" />{label(450, 166, 'Istmoa', 'middle')}</>)}
      {pick('infundibulum', <><path d="M140 215 Q116 190 105 234 M760 215 Q784 190 795 234" fill="none" stroke={coral} strokeWidth="18" />{label(133, 147, 'Infundibulua')}</>)}
      {pick('fimbriae', <><path d="M105 234 l-26 -31 m26 31 l-37 -4 m37 4 l-18 32 M795 234 l26 -31 m-26 31 l37 -4 m-37 4 l18 32" fill="none" stroke={coral} strokeWidth="7" strokeLinecap="round" />{label(66, 285, 'Finbriak')}</>)}
      {pick('ovary', <><ellipse cx="95" cy="305" rx="60" ry="43" fill="#f1c7bb" stroke={coral} strokeWidth="4" /><ellipse cx="805" cy="305" rx="60" ry="43" fill="#f1c7bb" stroke={coral} strokeWidth="4" />{label(94, 371, 'Obulutegia', 'middle')}</>)}
      {stageId === 'ovulation' && <>{pick('secondary-oocyte', <><circle cx={110 + stageProgress * 32} cy="225" r="19" fill="#e6eee6" stroke={teal} strokeWidth="4" /><circle cx={110 + stageProgress * 32} cy="225" r="6" fill={teal} /></>)}<path d="M104 253 Q145 212 209 211" fill="none" stroke={teal} strokeWidth="3" markerEnd="url(#arrow-w1)" />{label(155, 323, 'Obozito sekundarioa')}</>}
      {caption(stageId === 'ovulation' ? 'Obulazioan obozito sekundarioa askatzen da; II. meiosia geldirik dago.' : 'Ernalkuntza anpuluan · habiratzea endometrioan')}
    </>}
    {isBarrier && <>
      {zoneTitle(stage.title.primary, 'Anpuluko ernalkuntzaren xehetasun eskematikoa')}
      {oocyte(530, 285, 110, stageId !== 'pronuclei-zygote', true)}
      {stageId === 'capacitation' && <>{sperm(232 + stageProgress * 54, 280)}{pick('capacitation', <><path d="M270 230 Q336 195 368 232" fill="none" stroke={teal} strokeWidth="4" markerEnd="url(#arrow-w1)" />{label(153, 391, 'Gaikuntza: mintzeko aldaketak')}</>)}</>}
      {stageId === 'corona-radiata' && <>{sperm(341 + stageProgress * 35, 283)}{label(159, 397, 'Koroa erradiatuko zelulen artetik')}</>}
      {stageId === 'acrosome-reaction' && <>{sperm(388 + stageProgress * 29, 284)}{pick('acrosome-reaction', <><path d="M409 280 l24 -18 m-21 23 l27 0 m-30 6 l24 20" stroke={coral} strokeWidth="3" />{label(147, 398, 'Akrosomaren edukia askatu')}</>)}</>}
      {stageId === 'membrane-fusion' && <>{sperm(448 + stageProgress * 19, 285)}<path d="M475 273 Q480 285 475 297" fill="none" stroke={teal} strokeWidth="5" />{label(159, 398, 'Bi mintz plasmatikoak fusionatu')}</>}
      {stageId === 'cortical-reaction' && <>{pick('cortical-reaction', <g>{Array.from({ length: 14 }, (_, i) => { const a = i * Math.PI * 2 / 14; return <g key={i}><circle cx={530 + Math.cos(a) * 98} cy={285 + Math.sin(a) * 98} r="5" fill={coral} /><path d={`M${530 + Math.cos(a) * 105} ${285 + Math.sin(a) * 105} l${Math.cos(a) * 16} ${Math.sin(a) * 16}`} stroke={coral} strokeWidth="2" /></g>; })}</g>)}{sperm(305, 285)}{label(130, 402, 'Beste espermatozoideentzako hesia')}</>}
      {stageId === 'pronuclei-zygote' && <>{pick('pronuclei', <><circle cx="493" cy="278" r="24" fill="#a5cbc4" stroke={teal} strokeWidth="3" /><circle cx="567" cy="278" r="24" fill="#e8b6aa" stroke={coral} strokeWidth="3" />{label(530, 378, 'Pronukleo arra eta emea', 'middle')}</>)}{pick('second-polar-body', <><circle cx="645" cy="196" r="12" fill="#e8b6aa" stroke={coral} strokeWidth="2" />{label(657, 175, '2. gorputz polarra')}</>)}</>}
      {caption(stageId === 'pronuclei-zygote' ? 'Bi genoma haploide → lehen mitosia prestatzen duen zigoto diploidea' : 'Ordena: gaikuntza → koroa → akrosoma → fusioa → erreakzio kortikala')}
    </>}
    {cleavageCount > 0 && <>
      {zoneTitle(stage.title.primary, 'Alde peluzidoaren barruan · tamaina orokorra ia berdina')}
      {pick('zona-pellucida', <circle cx="450" cy="280" r="155" fill="#fff8ec" stroke={gold} strokeWidth="17" />)}
      {pick(stageId === 'morula-compaction' ? 'morula' : 'blastomeres', <g>{Array.from({ length: cleavageCount }, (_, i) => {
        const grid = cleavageCount === 2 ? [[-57, 0], [57, 0]] : cleavageCount === 4 ? [[-55,-55], [55,-55],[-55,55],[55,55]] : cleavageCount === 8 ?
          [[-58,-75],[0,-75],[58,-75],[-58,-20],[58,-20],[-58,42],[0,42],[58,42]] :
          Array.from({length: 16}, (_, n) => [(n % 4 - 1.5) * 56, (Math.floor(n / 4) - 1.5) * 56]);
        const [dx, dy] = grid[i]; const r = cleavageCount === 2 ? 62 : cleavageCount === 4 ? 56 : cleavageCount === 8 ? 41 : 31;
        return <circle key={i} cx={450 + dx} cy={280 + dy} r={r} fill={i % 4 === 0 && cleavageCount === 16 ? '#95c3ba' : '#c9e0da'} stroke={teal} strokeWidth="3" />;
      })}</g>)}
      {showLabels && <>{label(667, 248, stageId === 'morula-compaction' ? '12–16 → ~32 zelula' : cleavageCount + ' blastomero')}{label(667, 282, 'Alde peluzidoa')}</>}
      {caption(stageId === 'morula-compaction' ? '3. eguna: morula · kanpoko eta barruko zelulen bereizketa' : 'Mitosiak zelula kopurua handitzen du, kontzeptua handitu gabe')}
    </>}
    {isBlast && <>
      {zoneTitle(stage.title.primary, 'Umetoki-barrunbea eta endometrioa')}
      {stageId === 'implantation' && <>
        {pick('perimetrium', <rect x="0" y="500" width="900" height="20" fill="#a7807c" />)}
        {pick('myometrium', <rect x="0" y="432" width="900" height="68" fill="#d7958b" />)}
        {pick('endometrium', <><path d="M0 368 Q150 350 300 365 Q450 378 600 360 Q750 347 900 367 V432 H0Z" fill="#e8b9ac" stroke={coral} strokeWidth="4" />{label(80, 410, 'Endometrioa')}</>)}
      </>}
      {stageId === 'hatching' && pick('zona-pellucida', <path d="M305 215 A150 150 0 1 1 629 366 M293 234 A150 150 0 0 1 301 218" fill="none" stroke={gold} strokeWidth="15" strokeLinecap="round" />)}
      {pick('blastocyst', <circle cx="470" cy={stageId === 'implantation' ? 293 : 270} r="127" fill="#eef5ee" stroke={teal} strokeWidth="3" />)}
      {pick('blastocoel', <circle cx="487" cy={stageId === 'implantation' ? 278 : 255} r="89" fill="#d7edf0" stroke="#a9d5d8" strokeWidth="2" />)}
      {pick('trophoblast', <g>{Array.from({ length: 20 }, (_, i) => { const a = i * 2 * Math.PI / 20; return <ellipse key={i} cx={470 + Math.cos(a) * 117} cy={(stageId === 'implantation' ? 293 : 270) + Math.sin(a) * 117} rx="17" ry="12" transform={`rotate(${i * 18} ${470 + Math.cos(a) * 117} ${(stageId === 'implantation' ? 293 : 270) + Math.sin(a) * 117})`} fill="#a1ccc1" stroke={teal} strokeWidth="2" />; })}</g>)}
      {pick('embryoblast', <g>{Array.from({ length: 8 }, (_, i) => { const a = i * 2 * Math.PI / 8; return <circle key={i} cx={stageId === 'implantation' ? 470 + Math.cos(a) * 26 : 394 + Math.cos(a) * 26} cy={(stageId === 'implantation' ? 370 : 272) + Math.sin(a) * 21} r="13" fill={coral} stroke="#ae675e" strokeWidth="2" />; })}</g>)}
      {showLabels && <>{label(660, 183, 'Trofoblastoa')}{label(660, 224, 'Blastozelea')}{label(650, 290, 'Enbrioblastoa')}</>}
      {caption(stageId === 'implantation' ? 'Mutur enbrionarioa endometrioari lotu eta bertan sartzen hasten da' : stageId === 'hatching' ? 'Alde peluzidoa galdu ondoren habiratzea posible da' : 'Kanpoko trofoblastoa · mutur bateko enbrioblastoa · blastozelea')}
    </>}
    {showLabels && <g>
      <rect x="22" y="438" width="856" height="63" rx="10" fill={paper} opacity=".96" />
      {stage.structures.map((id, index) => {
        const name = topic.structures.find((item) => item.id === id)?.label.primary ?? id;
        const x = 40 + Math.floor(index / 3) * 282;
        const y = 455 + (index % 3) * 19;
        return pick(id, <text x={x} y={y} fill={selectedId === id ? teal : ink} fontSize="12" fontWeight={selectedId === id ? 750 : 550}>{name}</text>);
      })}
    </g>}
    {showComparison && <text x="853" y="50" textAnchor="end" fontSize="12" fill="#64777a">ETAPEN ARTEKO ALDERAKETA: DENBORA-LERROA</text>}
    <defs><marker id="arrow-w1" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill={teal} /></marker></defs>
  </svg>;
}
