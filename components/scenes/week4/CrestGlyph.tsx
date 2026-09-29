import type { Pt } from '@/components/kit';

/** Original, deliberately schematic silhouettes: fate is a tissue/cell, not another location dot. */
export function CrestGlyph({ id, at: [x, y], color, scale = 1 }: { id: string; at: Pt; color: string; scale?: number }) {
  const ganglion = id.includes('gongoil');
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    {ganglion ? <>
      <path d="M-21,-8L-9,-3M9,3L22,10M-20,13L-8,5" fill="none" />
      <ellipse rx={11} ry={16} fill={color} fillOpacity={0.25} />
      {[-8, 0, 8].map(y0 => <circle key={y0} cy={y0} r={3.4} fill={color} />)}
    </> : id === 'melanozitoak' || id === 'glia-zelulak' ? <>
      <path d="M0,0L-21,-12l-5,3M0,0L-18,13l-1,6M0,0L6,19M0,0L22,5l4,-4M0,0L11,-17" fill="none" />
      <ellipse rx={9} ry={7} fill={id === 'melanozitoak' ? '#9a542b' : color} /><circle r={3} fill="#173344" stroke="none" />
    </> : id === 'ile-folikuluak' ? <>
      <path d="M-14,4Q0,22 14,4" fill={color} fillOpacity={0.25} />
      <path d="M0,10V-20M-5,10Q-9,-8 -13,-17M5,10Q9,-8 13,-17" fill="none" />
      <circle cy={10} r={3.5} fill={color} />
    </> : id === 'azazkalak' ? <>
      <path d="M-16,14V-6Q-16,-19 0,-19T16,-6V14Z" fill={color} fillOpacity={0.3} />
      <path d="M-9,-9Q0,-13 9,-9" fill="none" strokeWidth={1} />
      <path d="M-20,14H20" strokeWidth={3} />
    </> : id === 'schwann-zelulak' ? <>
      <path d="M-25,0H25" strokeWidth={3} />
      {[-14, 0, 14].map(x0 => <g key={x0}><rect x={x0 - 5} y={-9} width={10} height={18} rx={5} fill={color} fillOpacity={0.4} /><circle cx={x0} cy={-5} r={2} fill={color} /></g>)}
    </> : id === 'meningeak-kraneal' ? <>
      <path d="M-20,14Q-29,-25 10,-19Q25,-15 24,5M-15,13Q-24,-19 9,-13Q19,-10 18,5M-10,11Q-15,-11 8,-7Q13,-5 12,5" fill="none" strokeWidth={3} />
    </> : id === 'buru-aurpegi-hezurrak' ? <>
      <path d="M-20,8Q-26,-18 -6,-21L10,-15L19,-3L12,3L15,14L-4,21L-15,13Z" fill={color} fillOpacity={0.22} />
      <path d="M-13,-12L0,-7L10,-15M0,-7L-4,7L12,3M-4,7L-4,21" fill="none" />
    </> : id === 'odontoblastoak' ? <>
      <path d="M-21,-10Q0,-17 21,-10" fill="none" strokeWidth={4} />
      {[-14, -5, 5, 14].map(x0 => <g key={x0}><path d={`M${x0},-12v9`} /><rect x={x0 - 3} y={-3} width={6} height={17} rx={3} fill={color} fillOpacity={0.4} /></g>)}
    </> : id === 'buru-lepo-dermisa' ? <>
      <path d="M-22,-10Q-10,-17 0,-10T22,-10M-22,1Q-10,-6 0,1T22,1M-22,12Q-10,5 0,12T22,12" fill="none" strokeWidth={3} />
    </> : id === 'aurpegi-hodi-muskulu-leuna' ? <>
      <ellipse rx={19} ry={12} fill={color} fillOpacity={0.25} /><ellipse rx={11} ry={5} fill="#12212c" />
      {[-15, 0, 15].map(x0 => <ellipse key={x0} cx={x0} cy={x0 === 0 ? -9 : 1} rx={3} ry={1.5} fill={color} />)}
    </> : id === 'bihotz-trenkada-tronkokonala' ? <>
      <path d="M-16,21V-18Q0,-25 16,-18V21" fill={color} fillOpacity={0.12} />
      <path d="M-7,-20C22,-6 -22,6 7,21" fill="none" strokeWidth={5} />
    </> : <>
      {/* Endocrine cells: a cluster, not a claim that the whole gland comes from crest. */}
      {[[0, 0], [-11, -7], [10, -8], [-9, 9], [11, 9]].map(([cx, cy], i) => <g key={i}>
        <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.4} /><circle cx={cx} cy={cy} r={2} fill={color} stroke="none" />
      </g>)}
    </>}
  </g>;
}
