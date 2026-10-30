'use client';
import { BONES } from '@/content/eratorriak/bones';
import { CARDS8, TAGS8 } from '@/content/eratorriak/cards8';
import { StudyRoom } from './kit/StudyRoom';
import { BoneDiagram } from './BoneDiagram';
import { BoneFigures } from './figures8';
import { Bone3D } from './Bone3D';
export function Topic8Study() {
  return (
    <StudyRoom
      data={BONES}
      cards={CARDS8}
      tags={TAGS8}
      diagram={(p) => <BoneDiagram {...p} />}
      Figures={BoneFigures}
      view3d={(s) => <Bone3D {...s} />}
    />
  );
}
