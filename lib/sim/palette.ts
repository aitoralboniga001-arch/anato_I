import type { StructureCategory } from './types';

/**
 * Tissue colours follow the convention of the course figures (Langman):
 * ectoderm/epiblast blue, endoderm/hypoblast yellow, intra-embryonic mesoderm red.
 * Extra-embryonic mesoderm is a distinct salmon so it is never confused with intra-embryonic
 * mesoderm (the notes flag this as a classic exam mistake).
 */
export const C = {
  // Embryoblast lineages
  epiblast: '#5b8def',
  ectoderm: '#5b8def',
  surfaceEcto: '#7aa7f5',
  neural: '#3a5fd9',
  neuralCrest: '#2dd4bf',
  hypoblast: '#f2c14e',
  endoderm: '#f2c14e',
  mesoIntra: '#ef4b4b',
  mesoParaxial: '#e0363f',
  mesoIntermediate: '#f97360',
  mesoLateral: '#ff7a7a',
  mesoExtra: '#f4a07f',
  notochord: '#a855f7',
  prechordal: '#d65db1',
  amnioblast: '#8fb4f7',
  // Trophoblast
  trophoblast: '#46b979',
  cyto: '#86dc9b',
  syncytio: '#1b7f55',
  syncytioDeep: '#11573b',
  // Early conceptus / gametes
  embryoblast: '#5b8def',
  zona: '#f29bb0',
  corona: '#b9a6f5',
  oocyte: '#f6c7bf',
  oocyteNucleus: '#c66a86',
  sperm: '#dbe7ff',
  acrosome: '#7dd3fc',
  pronucleusF: '#f472b6',
  pronucleusM: '#60a5fa',
  blastomere: '#f4b7ab',
  // Maternal
  stroma: '#f0c3cc',
  stromaDeep: '#e4a3b2',
  epithelium: '#f59bb1',
  gland: '#e98ea6',
  myometrium: '#c8645c',
  perimetrium: '#f7dfe3',
  maternalBlood: '#d8203a',
  fibrin: '#e9e4d8',
  ovary: '#f3d3b5',
  tube: '#e8889c',
  // Embryonic vessels
  artery: '#ef4444',
  vein: '#3b82f6',
  // Cavities (fills)
  amnionCavity: 'rgba(110, 170, 255, 0.16)',
  yolkCavity: 'rgba(242, 193, 78, 0.16)',
  chorionCavity: 'rgba(255, 255, 255, 0.035)',
  blastocele: 'rgba(125, 211, 252, 0.10)',
  coelom: 'rgba(255, 150, 150, 0.12)',
  // Ink
  ink: '#e8eefc',
  inkDim: '#8a97b3',
  outline: 'rgba(8, 12, 24, 0.55)',
} as const;

export const categoryColor: Record<StructureCategory, string> = {
  ektodermoa: C.ectoderm,
  mesodermoa: C.mesoIntra,
  endodermoa: C.endoderm,
  'enbrioi-kanpokoa': C.mesoExtra,
  trofoblastoa: C.trophoblast,
  enbrioblastoa: C.embryoblast,
  amarena: C.stromaDeep,
  barrunbea: '#9fb6d9',
  gametoa: C.oocyte,
  anatomia: '#c9a7b4',
  prozesua: '#fbbf24',
  ardatza: '#a5b4fc',
};

export const categoryLabel: Record<StructureCategory, string> = {
  ektodermoa: 'Ektodermoa',
  mesodermoa: 'Mesodermoa (enbrioi barrukoa)',
  endodermoa: 'Endodermoa',
  'enbrioi-kanpokoa': 'Enbrioi kanpoko egitura',
  trofoblastoa: 'Trofoblastoa',
  enbrioblastoa: 'Enbrioblastoa',
  amarena: 'Amaren ehuna',
  barrunbea: 'Barrunbea',
  gametoa: 'Gametoa / zelula',
  anatomia: 'Anatomia',
  prozesua: 'Prozesua',
  ardatza: 'Ardatza / planoa',
};
