'use client';
import { SEPTA } from '@/content/eratorriak/septa';
import { CARDS11, TAGS11 } from '@/content/eratorriak/cards11';
import { StudyRoom } from './kit/StudyRoom';
import { Septa3D } from './Septa3D';
import { SeptaDiagram } from './SeptaDiagram';
import { SeptaFigures } from './figures11';
export function Topic11Study() {
  return (
    <StudyRoom
      data={SEPTA}
      cards={CARDS11}
      tags={TAGS11}
      diagram={(p) => <SeptaDiagram {...p} />}
      Figures={SeptaFigures}
      view3d={(s) => <Septa3D {...s} />}
    />
  );
}
