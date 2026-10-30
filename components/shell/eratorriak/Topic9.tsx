'use client';
import { MUSCLES } from '@/content/eratorriak/muscles';
import { CARDS9, TAGS9 } from '@/content/eratorriak/cards9';
import { StudyRoom } from './kit/StudyRoom';
import { MuscleDiagram } from './MuscleDiagram';
import { MuscleFigures } from './figures9';
import { Muscle3D } from './Muscle3D';
export function Topic9Study() {
  return (
    <StudyRoom
      data={MUSCLES}
      cards={CARDS9}
      tags={TAGS9}
      diagram={(p) => <MuscleDiagram {...p} />}
      Figures={MuscleFigures}
      view3d={(s) => <Muscle3D {...s} />}
    />
  );
}
