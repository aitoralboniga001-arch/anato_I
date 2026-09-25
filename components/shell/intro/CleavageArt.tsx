import type { Cell, Frame } from './cleavage';

/** Warm dark-field microscopy look: opaque bodies, bright membranes, faint nuclei. */
export function CleavageDefs({ id = 'cl' }: { id?: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-body`} cx="38%" cy="32%" r="78%">
        <stop offset="0" stopColor="#3a2e27" />
        <stop offset="0.72" stopColor="#261e1a" />
        <stop offset="1" stopColor="#4a3a30" />
      </radialGradient>
      <radialGradient id={`${id}-body-front`} cx="38%" cy="32%" r="78%">
        <stop offset="0" stopColor="#4b3b31" />
        <stop offset="0.72" stopColor="#30251f" />
        <stop offset="1" stopColor="#5a473a" />
      </radialGradient>
      <radialGradient id={`${id}-cav`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#8fb3c9" stopOpacity="0.02" />
        <stop offset="0.8" stopColor="#8fb3c9" stopOpacity="0.07" />
        <stop offset="1" stopColor="#8fb3c9" stopOpacity="0.14" />
      </radialGradient>
      <radialGradient id={`${id}-light`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#f3dcc2" stopOpacity="0.09" />
        <stop offset="0.55" stopColor="#f3dcc2" stopOpacity="0.025" />
        <stop offset="1" stopColor="#f3dcc2" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-goo`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="g" />
        <feComposite in="SourceGraphic" in2="g" operator="atop" />
      </filter>
    </defs>
  );
}

const RIM = '#ecd7bf';

function Body({ c, id, inset = 0 }: { c: Cell; id: string; inset?: number }) {
  return (
    <ellipse
      cx={c.x}
      cy={c.y}
      rx={Math.max(1, c.rx - inset)}
      ry={Math.max(1, c.ry - inset)}
      transform={`rotate(${c.rot} ${c.x} ${c.y})`}
      fill={inset ? `url(#${id}-body${c.z > 0.6 || c.kind === 'enbrioblasto' ? '-front' : ''})` : RIM}
      fillOpacity={inset ? 1 : 0.28 + 0.5 * Math.min(1, c.rim)}
    />
  );
}

function Nucleus({ c }: { c: Cell }) {
  if (c.nuc <= 0.02) return null;
  const r = Math.min(c.rx, c.ry) * (c.kind === 'trofoblasto' ? 0.55 : 0.27);
  return (
    <g opacity={c.nuc}>
      <circle cx={c.x + r * 0.15} cy={c.y - r * 0.1} r={r} fill="#f3dcc2" fillOpacity={0.06} stroke="#f3dcc2" strokeOpacity={0.38} strokeWidth={1} />
      <circle cx={c.x + r * 0.35} cy={c.y - r * 0.2} r={Math.max(1.4, r * 0.26)} fill="#f3dcc2" fillOpacity={0.55} />
    </g>
  );
}

function Shine({ c }: { c: Cell }) {
  return (
    <ellipse
      cx={c.x - c.rx * 0.3}
      cy={c.y - c.ry * 0.38}
      rx={c.rx * 0.42}
      ry={c.ry * 0.22}
      transform={`rotate(-28 ${c.x} ${c.y})`}
      fill="#fff"
      opacity={0.045}
    />
  );
}

/** Draws a cleavage frame centred on (0,0). Wrap it in a translated group. */
export function CleavageArt({ f, id = 'cl', polar = 1 }: { f: Frame; id?: string; polar?: number }) {
  // Units: single cells, or a dividing pair drawn together (goo furrow). Painter's order by depth.
  const inPair = new Set(f.pairs.flat());
  const units: { z: number; cells: Cell[]; goo: boolean }[] = [
    ...f.pairs.map(([a, b]) => ({ z: (f.cells[a].z + f.cells[b].z) / 2, cells: [f.cells[a], f.cells[b]], goo: true })),
    ...f.cells.filter((_, i) => !inPair.has(i)).map((c) => ({ z: c.z, cells: [c], goo: false })),
  ].sort((a, b) => a.z - b.z || (a.cells[0].kind === 'enbrioblasto' ? 1 : -1));

  const zo = f.zonaO;
  return (
    <g>
      <circle r={260} fill={`url(#${id}-light)`} />
      {zo > 0.01 && (
        <g opacity={zo}>
          <circle r={f.zonaR + 9} fill="none" stroke="#ecd7bf" strokeOpacity={0.06} strokeWidth={18} />
          <circle r={f.zonaR} fill="none" stroke="#ecd7bf" strokeOpacity={0.22} strokeWidth={0.8} />
          <circle r={f.zonaR + 18} fill="none" stroke="#ecd7bf" strokeOpacity={0.32} strokeWidth={0.9} />
          <circle r={f.zonaR + 13} fill="none" stroke="#ecd7bf" strokeOpacity={0.05} strokeWidth={0.6} strokeDasharray="1.5 5" />
        </g>
      )}
      {polar > 0.01 && (
        <g opacity={polar * zo}>
          <circle cx={78} cy={-94} r={9} fill={`url(#${id}-body)`} stroke={RIM} strokeOpacity={0.5} />
          <circle cx={94} cy={-78} r={7} fill={`url(#${id}-body)`} stroke={RIM} strokeOpacity={0.45} />
        </g>
      )}
      {f.cavO > 0.01 && <circle r={f.cavR} fill={`url(#${id}-cav)`} opacity={f.cavO} />}
      {units.map((u, k) =>
        u.goo ? (
          <g key={k}>
            <g filter={`url(#${id}-goo)`}>
              {u.cells.map((c, j) => (
                <Body key={j} c={c} id={id} />
              ))}
            </g>
            <g filter={`url(#${id}-goo)`}>
              {u.cells.map((c, j) => (
                <Body key={j} c={c} id={id} inset={2.2} />
              ))}
            </g>
            {u.cells.map((c, j) => (
              <Nucleus key={j} c={c} />
            ))}
          </g>
        ) : (
          <g key={k}>
            <Body c={u.cells[0]} id={id} />
            <Body c={u.cells[0]} id={id} inset={2.2} />
            <Shine c={u.cells[0]} />
            <Nucleus c={u.cells[0]} />
          </g>
        ),
      )}
      {f.pro.o > 0.01 && (
        <g opacity={f.pro.o}>
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={s * (8 + 30 * f.pro.sep)} cy={s * -4 * f.pro.sep} r={19} fill="#f3dcc2" fillOpacity={0.05} stroke="#f3dcc2" strokeOpacity={0.45} />
              <circle cx={s * (8 + 30 * f.pro.sep) + 4} cy={s * -4 * f.pro.sep - 3} r={4.5} fill="#f3dcc2" fillOpacity={0.55} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}
