import type { Stage } from '../../content/types';

export interface TimelineState {
  time: number;
  playing: boolean;
  direction: 1 | -1;
  speed: number;
  stageIndex: number;
  stageId: string;
  stageProgress: number;
}

export interface TimelineSnapshot extends TimelineState {
  stage: Stage;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export class TimelineEngine {
  private readonly stages: Stage[];
  private time = 0;
  private playing = false;
  private direction: 1 | -1 = 1;
  private speed = 1;

  constructor(stages: Stage[]) {
    this.stages = [...stages].sort((a, b) => a.order - b.order);
    this.validate();
  }

  private validate() {
    if (!this.stages.length || this.stages[0].start !== 0 || this.stages.at(-1)?.end !== 1) throw new Error('Timeline must cover 0..1');
    this.stages.forEach((stage, index) => {
      if (stage.start < 0 || stage.end > 1 || stage.end <= stage.start) throw new Error(`Invalid stage range: ${stage.id}`);
      if (index > 0 && stage.start !== this.stages[index - 1].end) throw new Error('Stages must be contiguous and ordered');
    });
  }

  getState(): TimelineSnapshot {
    const index = this.stageIndexAt(this.time);
    const stage = this.stages[index];
    return { time: this.time, playing: this.playing, direction: this.direction, speed: this.speed, stageIndex: index, stageId: stage.id, stageProgress: clamp((this.time - stage.start) / (stage.end - stage.start)), stage };
  }

  private stageIndexAt(time: number) {
    const index = this.stages.findIndex((stage, i) => time < stage.end || i === this.stages.length - 1);
    return Math.max(0, index);
  }

  scrub(time: number) { this.time = clamp(time); return this.getState(); }
  play() { this.playing = true; return this.getState(); }
  pause() { this.playing = false; return this.getState(); }
  reverse() { this.direction = this.direction === 1 ? -1 : 1; this.playing = true; return this.getState(); }
  restart() { this.time = this.direction === 1 ? 0 : 1; this.playing = false; return this.getState(); }
  next() { this.time = this.stages[Math.min(this.stageIndexAt(this.time) + 1, this.stages.length - 1)].start; return this.getState(); }
  previous() { this.time = this.stages[Math.max(this.stageIndexAt(this.time) - 1, 0)].start; return this.getState(); }
  setSpeed(speed: number) { if (!Number.isFinite(speed) || speed < 0) throw new Error('Speed must be a non-negative finite number'); this.speed = speed; return this.getState(); }
  tick(seconds: number) { if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Tick duration must be non-negative'); if (this.playing) this.time = clamp(this.time + seconds * this.speed * this.direction); if (this.time === 0 || this.time === 1) this.playing = false; return this.getState(); }
}
