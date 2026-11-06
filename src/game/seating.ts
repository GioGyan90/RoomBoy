import { LinearInterpolant, Quaternion, QuaternionLinearInterpolant, type Bone } from 'three';
import data from '../assets/generated/seating.json';
import type { Seat } from './types';

function createClip(clip: typeof data.chair) {
  const times = new Float32Array(clip.times);
  const root = new LinearInterpolant(times, new Float32Array(clip.root), 3);
  const tracks = Object.entries(clip.joints).map(([name, values]) => ({
    name,
    sampler: new QuaternionLinearInterpolant(times, new Float32Array(values), 4),
  }));
  const quaternion = new Quaternion();
  return {
    duration: clip.duration,
    placement(time: number) {
      const [horizontal, height] = root.evaluate(time);
      return { horizontal, height };
    },
    apply(joints: Record<string, Bone>, time: number, weight: number) {
      for (const { name, sampler } of tracks) {
        quaternion.fromArray(sampler.evaluate(time)).normalize();
        joints[name].quaternion.slerp(quaternion, weight);
      }
    },
  };
}

export const seats: Record<Seat, ReturnType<typeof createClip>> = {
  chair: createClip(data.chair),
  bed: createClip(data.bed),
};
