'use client';

import { C } from '@/components/kit';
import { f1 } from './common';

/**
 * Shared look of the week-3 discs seen from above (gastrulation, mesoderm spread, notochord):
 * the epiblast/ectoderm as a mosaic of cell apices lit from the top left, the endoderm and the
 * hypoblast as cobbled cuboidal cells, the streak as a raised ridge and the node as a mound, and
 * loose stellate mesenchyme for the intra-embryonic mesoderm. Ids are prefixed `w3g-`.
 */
export const HYP = '#a8976a';

export function DorsalDefs() {
  return (
    <>
      <pattern id="w3g-mosaic" width="13" height="11.3" patternUnits="userSpaceOnUse">
        <rect width="13" height="11.3" fill={C.epiblast} />
        <path d="M0,2.8 L3.2,0 L9.7,0 L13,2.8 L13,8.5 L9.7,11.3 L3.2,11.3 L0,8.5Z" fill="#6a99f2" stroke="rgba(18,36,92,0.45)" strokeWidth={0.8} />
        <circle cx={6.5} cy={5.6} r={1.5} fill="rgba(24,40,98,0.35)" />
      </pattern>
      <pattern id="w3g-endo" width="10" height="9" patternUnits="userSpaceOnUse">
        <rect width="10" height="9" fill="#e9b53c" />
        <rect x={0.6} y={0.6} width={8.8} height={7.8} rx={2.4} fill={C.endoderm} stroke="rgba(110,70,10,0.45)" strokeWidth={0.6} />
        <circle cx={5} cy={4.5} r={1.4} fill="rgba(110,70,10,0.4)" />
      </pattern>
      <pattern id="w3g-hyp" width="10" height="9" patternUnits="userSpaceOnUse">
        <rect width="10" height="9" fill="#8e7f58" />
        <rect x={0.6} y={0.6} width={8.8} height={7.8} rx={2.4} fill={HYP} stroke="rgba(60,48,20,0.5)" strokeWidth={0.6} />
        <circle cx={5} cy={4.5} r={1.3} fill="rgba(60,48,20,0.45)" />
      </pattern>
      <pattern id="w3g-extra" width="16" height="14" patternUnits="userSpaceOnUse">
        <rect width="16" height="14" fill="#d98a6c" />
        <circle cx={4} cy={4} r={1.6} fill="rgba(140,60,40,0.55)" />
        <circle cx={12} cy={10} r={1.6} fill="rgba(140,60,40,0.55)" />
      </pattern>
      <radialGradient id="w3g-light" cx="34%" cy="26%" r="78%">
        <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.36} />
      </radialGradient>
      <linearGradient id="w3g-ridge" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#c3d6ff" />
        <stop offset="0.45" stopColor="#8fb0f5" />
        <stop offset="1" stopColor="#4f75cf" />
      </linearGradient>
      <radialGradient id="w3g-node" cx="38%" cy="32%" r="70%">
        <stop offset="0" stopColor="#b9cdfb" />
        <stop offset="0.6" stopColor="#86a8f0" />
        <stop offset="1" stopColor="#4a6fc9" />
      </radialGradient>
      <linearGradient id="w3g-cut" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#2d4c9c" />
        <stop offset="1" stopColor="#5b8def" />
      </linearGradient>
      <radialGradient id="w3g-memb" cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor="#f4f7ff" />
        <stop offset="1" stopColor="#b8c6e6" />
      </radialGradient>
    </>
  );
}

/** A loose mesenchymal cell seen from above: a small body with processes, lit from the top left. */
export function Stellate({ x, y, r, a, color }: { x: number; y: number; r: number; a: number; color: string }) {
  return <StellateField cells={[{ x, y, a }]} r={r} color={color} />;
}

/** Rotated ellipse as path data (rx along the angle `a`, in degrees). */
export function ellipseD(x: number, y: number, rx: number, ry: number, a = 0) {
  const c = Math.cos((a * Math.PI) / 180);
  const s = Math.sin((a * Math.PI) / 180);
  return `M${f1(x + rx * c)},${f1(y + rx * s)}A${f1(rx)},${f1(ry)} ${f1(a)} 1,0 ${f1(x - rx * c)},${f1(y - rx * s)}A${f1(rx)},${f1(ry)} ${f1(a)} 1,0 ${f1(x + rx * c)},${f1(y + rx * s)}Z`;
}

/**
 * Many stellate mesenchymal cells drawn as three paths (processes, bodies, highlights) instead of one
 * group per cell: the same picture, a fraction of the elements.
 */
export function StellateField({ cells, r, color }: { cells: { x: number; y: number; a: number }[]; r: number; color: string }) {
  let procs = '';
  let bodies = '';
  let shine = '';
  for (const { x, y, a } of cells) {
    const c = Math.cos((a * Math.PI) / 180);
    const s = Math.sin((a * Math.PI) / 180);
    const P = (px: number, py: number) => `${f1(x + px * c - py * s)},${f1(y + px * s + py * c)}`;
    procs += `M${P(-r * 2.6, -r * 0.5)}L${P(r * 2.4, r * 0.6)}M${P(-r * 0.7, -r * 2.2)}L${P(r * 0.5, r * 2.3)}`;
    bodies += ellipseD(x, y, r * 1.25, r, a);
    const h = r * 0.45;
    const [hx, hy] = [x - r * 0.25 * c + r * 0.25 * s, y - r * 0.25 * s - r * 0.25 * c];
    shine += `M${f1(hx - h)},${f1(hy)}a${f1(h)},${f1(h)} 0 1,0 ${f1(2 * h)},0a${f1(h)},${f1(h)} 0 1,0 ${f1(-2 * h)},0Z`;
  }
  if (!cells.length) return null;
  return (
    <g>
      <path d={procs} stroke={color} strokeWidth={1.3} strokeLinecap="round" opacity={0.9} fill="none" />
      <path d={bodies} fill={color} stroke="rgba(70,8,14,0.6)" strokeWidth={0.6} />
      <path d={shine} fill="rgba(255,255,255,0.28)" />
    </g>
  );
}
