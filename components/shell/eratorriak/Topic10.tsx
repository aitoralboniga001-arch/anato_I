'use client';
import { HEART_TUBE } from '@/content/eratorriak/heart-tube';
import { CARDS10, TAGS10 } from '@/content/eratorriak/cards10';
import { StudyRoom } from './kit/StudyRoom';
import { HeartTubeDiagram } from './HeartTubeDiagram';
import { HeartTubeFigures } from './figures10';
import { Tube3D } from './Tube3D';
export function Topic10Study() {
  return (
    <StudyRoom
      data={HEART_TUBE}
      cards={CARDS10}
      tags={TAGS10}
      diagram={(p) => <HeartTubeDiagram {...p} />}
      Figures={HeartTubeFigures}
      view3d={(s) => <Tube3D {...s} />}
    />
  );
}
