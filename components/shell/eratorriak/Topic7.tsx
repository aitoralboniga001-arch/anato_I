'use client';
import { CAVITIES } from '@/content/eratorriak/cavities';
import { CARDS7, TAGS7 } from '@/content/eratorriak/cards7';
import { StudyRoom } from './kit/StudyRoom';
import { Cavity3D } from './Cavity3D';
import { CavityDiagram } from './CavityDiagram';
import { CavityFigures } from './figures7';
export function Topic7Study() {
  return (
    <StudyRoom
      data={CAVITIES}
      cards={CARDS7}
      tags={TAGS7}
      diagram={(p) => <CavityDiagram {...p} />}
      Figures={CavityFigures}
      view3d={(s) => <Cavity3D {...s} />}
    />
  );
}
