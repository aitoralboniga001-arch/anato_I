'use client';

import type { ReactNode } from 'react';
import { C, Part, mix } from '@/components/kit';
import type { Cell as CCell, Frame } from '@/components/shell/intro/cleavage';

/**
 * The conceptus of week 1 in the course-figure palette (Langman, as in the notes):
 * blastomeres salmon, zona pellucida pink, corona radiata lilac, and — once they separate —
 * trophoblast GREEN and embryoblast BLUE ("argazkian berdea / urdina").
 * Geometry comes from the shared cleavage engine (components/shell/intro/cleavage.ts).
 */

export function ConceptusDefs({ id = 'w1c' }: { id?: string }) {
  return (
    <defs>
      <filter id={`${id}-goo`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g" />
        <feComposite in="SourceGraphic" in2="g" operator="atop" />
      </filter>
      <radialGradient id={`${id}-zona`} cx="50%" cy="50%" r="50%">
        <stop offset="0.86" stopColor={C.zona} stopOpacity="0.2" />
        <stop offset="0.93" stopColor={C.zona} stopOpacity="0.75" />
        <stop offset="1" stopColor={C.zona} stopOpacity="0.35" />
      </radialGradient>
      <radialGradient id={`${id}-cav`} cx="50%" cy="45%" r="55%">
        <stop offset="0" stopColor="#1d2a44" />
        <stop offset="1" stopColor="#2a3b5c" />
      </radialGradient>
    </defs>
  );
}

const TROPHO = C.trophoblast;
const EMBRYO = C.embryoblast;

/** Cell colour: blastomere salmon, tinted towards its fate by `mass` (0..1). */
function fill(c: CCell, mass: number) {
  if (c.kind === 'trofoblasto') return TROPHO;
  if (c.kind === 'enbrioblasto') return EMBRYO;
  if (c.fate && mass > 0) return mix(C.blastomere, c.fate === 'trofoblasto' ? TROPHO : EMBRYO, mass);
  return C.blastomere;
}

function CellShape({ c, mass, stroke = true }: { c: CCell; mass: number; stroke?: boolean }) {
  return (
    <ellipse
      cx={c.x}
      cy={c.y}
      rx={Math.max(1, c.rx)}
      ry={Math.max(1, c.ry)}
      transform={`rotate(${c.rot} ${c.x} ${c.y})`}
      fill={fill(c, mass)}
      stroke={stroke ? 'rgba(40,16,20,0.55)' : 'none'}
      strokeWidth={1.4}
    />
  );
}

function Nucleus({ c }: { c: CCell }) {
  if (c.nuc <= 0.02) return null;
  const flat = c.kind === 'trofoblasto';
  const r = Math.min(c.rx, c.ry) * (flat ? 0.5 : 0.3);
  return (
    <g opacity={c.nuc}>
      <ellipse
        cx={c.x}
        cy={c.y}
        rx={flat ? c.rx * 0.32 : r}
        ry={r}
        transform={`rotate(${c.rot} ${c.x} ${c.y})`}
        fill="rgba(60,22,40,0.5)"
      />
    </g>
  );
}

export interface ConceptusProps {
  f: Frame;
  /** Centre and scale (the engine works around ±150 units). */
  x: number;
  y: number;
  s?: number;
  /** 0..1 corona radiata around the zona. */
  corona?: number;
  /** 0..1 polar bodies in the perivitelline space. */
  polar?: number;
  /** 0..1 tint of outer / inner cell masses before they separate. */
  mass?: number;
  id?: string;
  /** Draw a light outline when the conceptus is tiny (tract overview). */
  tiny?: boolean;
  /** 0..1 "cut open": front outer cells fade so the inner cell mass shows. */
  cut?: number;
  /** Rotation of the whole conceptus (degrees). */
  rot?: number;
  /**
   * Make its structures clickable/highlightable (zona, corona, polar bodies, blastocoel and each
   * cell with the id `cell` gives it). Leave out when a parent already wraps it in a <Part>.
   */
  parts?: { cell: (c: CCell) => string };
}

/** Wraps in a <Part> only when the conceptus is interactive (parts must not nest). */
const P = ({ on, id, children }: { on: boolean; id: string; children: ReactNode }) => (on ? <Part id={id}>{children}</Part> : <>{children}</>);

/** Corona radiata: radially arranged follicular cells around the zona. */
function Corona({ r, o }: { r: number; o: number }) {
  if (o <= 0.02) return null;
  const cells = [];
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 30 : 24;
    for (let i = 0; i < n; i++) {
      const a = ((i + ring * 0.5) / n) * Math.PI * 2;
      const rr = r + 18 + ring * 22;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      cells.push(
        <ellipse key={`${ring}-${i}`} cx={x} cy={y} rx={12} ry={7.5} transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} fill={C.corona} stroke="rgba(40,20,70,0.5)" strokeWidth={1} opacity={0.9 - ring * 0.25} />,
      );
    }
  }
  return <g opacity={o}>{cells}</g>;
}

export function Conceptus({ f, x, y, s = 1, corona = 0, polar = 0, mass = 0, id = 'w1c', tiny, cut = 0, rot = 0, parts }: ConceptusProps) {
  const on = !!parts;
  const inPair = new Set(f.pairs.flat());
  const units: { z: number; cells: CCell[]; goo: boolean }[] = [
    ...f.pairs.map(([a, b]) => ({ z: (f.cells[a].z + f.cells[b].z) / 2, cells: [f.cells[a], f.cells[b]], goo: true })),
    ...f.cells.filter((_, i) => !inPair.has(i)).map((c) => ({ z: c.z, cells: [c], goo: false })),
  ].sort((a, b) => a.z - b.z || (a.cells[0].kind === 'enbrioblasto' ? 1 : -1));
  const zo = f.zonaO;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <P on={on && corona * zo > 0.02} id="koroa-erradiatua">
        <Corona r={f.zonaR} o={corona * zo} />
      </P>
      {zo > 0.01 && (
        <P on={on} id="mintz-peluzidoa">
        <g opacity={zo}>
          <circle r={f.zonaR + 9} fill="none" stroke={C.zona} strokeOpacity={0.55} strokeWidth={18} />
          <circle r={f.zonaR + 18} fill="none" stroke="#b64f6b" strokeWidth={tiny ? 4 : 1.6} />
          <circle r={f.zonaR} fill="none" stroke="#b64f6b" strokeWidth={1} strokeOpacity={0.7} />
        </g>
        </P>
      )}
      {polar > 0.01 && (
        <P on={on} id="gorpuskulu-polarrak">
        <g opacity={polar * zo}>
          <circle cx={84} cy={-92} r={10} fill={C.blastomere} stroke="rgba(40,16,20,0.55)" strokeWidth={1.2} />
          <circle cx={100} cy={-72} r={7.5} fill={C.blastomere} stroke="rgba(40,16,20,0.55)" strokeWidth={1.2} />
        </g>
        </P>
      )}
      {f.cavO > 0.01 && (
        <P on={on && f.cavO > 0.3} id="blastozelea">
          <circle r={f.cavR} fill={`url(#${id}-cav)`} opacity={f.cavO} />
        </P>
      )}
      {units.map((u, k) =>
        u.goo ? (
          <P key={k} on={on} id={parts ? parts.cell(u.cells[0]) : ''}>
          <g>
            {/* Outline and shading as for a single cell, so a dividing pair reads as cells (not a flat blob)
                and nothing pops when the daughters separate: the rim is a slightly larger merged silhouette. */}
            <g filter={`url(#${id}-goo)`}>
              {u.cells.map((c, j) => (
                <g key={j} transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
                  <ellipse cx={c.x} cy={c.y} rx={Math.max(1, c.rx) + 1.4} ry={Math.max(1, c.ry) + 1.4} fill={fill(c, mass)} />
                  <ellipse cx={c.x} cy={c.y} rx={Math.max(1, c.rx) + 1.4} ry={Math.max(1, c.ry) + 1.4} fill="rgba(40,16,20,0.55)" />
                </g>
              ))}
            </g>
            <g filter={`url(#${id}-goo)`}>
              {u.cells.map((c, j) => (
                <CellShape key={j} c={c} mass={mass} stroke={false} />
              ))}
              {u.cells.map((c, j) => (
                <ellipse key={`s${j}`} cx={c.x} cy={c.y} rx={Math.max(1, c.rx)} ry={Math.max(1, c.ry)} transform={`rotate(${c.rot} ${c.x} ${c.y})`} fill="url(#g-cell)" />
              ))}
            </g>
            {u.cells.map((c, j) => (
              <Nucleus key={j} c={c} />
            ))}
          </g>
          </P>
        ) : (
          <P key={k} on={on} id={parts ? parts.cell(u.cells[0]) : ''}>
          <g opacity={cut > 0 && u.cells[0].fate === 'trofoblasto' && u.cells[0].z > 0.45 ? 1 - 0.6 * cut : 1}>
            <CellShape c={u.cells[0]} mass={mass} />
            <ellipse
              cx={u.cells[0].x}
              cy={u.cells[0].y}
              rx={Math.max(1, u.cells[0].rx)}
              ry={Math.max(1, u.cells[0].ry)}
              transform={`rotate(${u.cells[0].rot} ${u.cells[0].x} ${u.cells[0].y})`}
              fill="url(#g-cell)"
            />
            <Nucleus c={u.cells[0]} />
          </g>
          </P>
        ),
      )}
      {f.pro.o > 0.01 && (
        <g opacity={f.pro.o}>
          {[-1, 1].map((sg) => (
            <circle
              key={sg}
              cx={sg * (8 + 30 * f.pro.sep)}
              cy={sg * -4 * f.pro.sep}
              r={18}
              fill={sg < 0 ? C.pronucleusF : C.pronucleusM}
              fillOpacity={0.55}
              stroke="rgba(30,20,50,0.6)"
              strokeWidth={1.2}
            />
          ))}
        </g>
      )}
    </g>
  );
}
