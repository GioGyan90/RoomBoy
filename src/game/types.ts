import type { Vector3 } from 'three';

export type Seat = 'bed' | 'chair' | 'toilet';
export type Posture = 'stand' | 'sitChair' | 'sitDesk' | 'sitBed' | 'sitToilet' | 'lieBed' | 'stretch';
export type PoseStep = {
  type: 'pose';
  posture: Posture;
  pos: Vector3;
  rot: number;
  bodyY?: number;
  rotX?: number;
  duration?: number;
  hold?: boolean;
  seat?: Seat;
  motion?: 'sit' | 'rise';
  exitSeat?: boolean;
};
export type Step = { type: 'walk'; pos: Vector3 } | PoseStep;
export interface Action {
  id: string;
  icon: string;
  label: string;
  nap?: boolean;
  steps: () => Step[];
  status: string;
}
