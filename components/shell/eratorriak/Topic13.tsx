'use client';
import { VEINS } from '@/content/eratorriak/veins';
import { CARDS13, TAGS13 } from '@/content/eratorriak/cards13';
import { StudyRoom } from './kit/StudyRoom';
import { Vein3D } from './Vein3D';
import { VeinDiagram } from './VeinDiagram';
import { VeinFigures } from './figures13';

export function Topic13Study() {
  return (
    <StudyRoom
      data={VEINS}
      cards={CARDS13}
      tags={TAGS13}
      diagram={(p) => <VeinDiagram {...p} />}
      Figures={VeinFigures}
      view3d={(s) => <Vein3D {...s} />}
    />
  );
}
