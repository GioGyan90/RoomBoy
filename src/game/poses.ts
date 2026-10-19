import {clamp} from '../core/math';
export type Pose=Record<string,[number,number,number]>;
export function standPose(t:number):Pose{
  const b = Math.sin(t*1.5)*0.025;
  return {
    spine:[0.02 + b*0.6, 0, 0],
    chest:[-0.01 + b, 0, 0],
    neck:[0.02, 0, 0],
    head:[0.02 + Math.sin(t*0.7)*0.03, Math.sin(t*0.42)*0.10, 0],
    lThigh:[0,0,0.02], rThigh:[0,0,-0.02],
    lShin:[0.03,0,0],  rShin:[0.03,0,0],
    lFoot:[-0.02,0,0], rFoot:[-0.02,0,0],
    lUpperArm:[0.05, 0, 0.11 + b*0.5], rUpperArm:[0.05, 0, -0.11 - b*0.5],
    lForeArm:[-0.18, 0, 0], rForeArm:[-0.18, 0, 0],
    lHand:[0,0,0.04], rHand:[0,0,-0.04],
  };
}

export function walkPose(p:number):Pose{
  const s = Math.sin(p);
  return {
    pelvis:[0, 0.10*s, 0],
    spine:[0.05, -0.06*s, 0],
    chest:[0.00, -0.10*s, 0],
    neck:[0.02, 0, 0],
    head:[0.0, 0.05*s, 0],
    lThigh:[-0.55*s, 0, 0.03], rThigh:[0.55*s, 0, -0.03],
    lShin:[Math.max(0.02, 1.05*Math.sin(p-1.9)), 0, 0],
    rShin:[Math.max(0.02, 1.05*Math.sin(p+Math.PI-1.9)), 0, 0],
    lFoot:[0.18*Math.sin(p-2.5), 0, 0],
    rFoot:[0.18*Math.sin(p+Math.PI-2.5), 0, 0],
    lUpperArm:[ 0.50*s, 0, 0.10], rUpperArm:[-0.50*s, 0, -0.10],
    lForeArm:[-0.35 - 0.18*Math.max(0,-s), 0, 0],
    rForeArm:[-0.35 - 0.18*Math.max(0, s), 0, 0],
    lHand:[0,0,0.05], rHand:[0,0,-0.05],
  };
}

export function sitDeskPose(t:number):Pose{
  const ty = Math.sin(t*11.0)*0.055;
  return {
    spine:[0.13, 0, 0], chest:[0.04, 0, 0],
    neck:[-0.10, 0, 0],
    head:[-0.04 + Math.sin(t*1.1)*0.02, Math.sin(t*0.7)*0.07, 0],
    lThigh:[-1.50, 0, 0.06], rThigh:[-1.50, 0, -0.06],
    lShin:[1.50, 0, 0], rShin:[1.50, 0, 0],
    lFoot:[0,0,0], rFoot:[0,0,0],
    lUpperArm:[-0.43, 0, -0.10], rUpperArm:[-0.43, 0, 0.10],
    lForeArm:[-1.50 + ty, 0, 0], rForeArm:[-1.50 - ty, 0, 0],
    lHand:[0.15,0,0], rHand:[0.15,0,0],
  };
}

export function sitBedPose(t:number):Pose{
  const sw = Math.sin(t*1.6)*0.13;
  return {
    spine:[0.10, 0, 0], chest:[0.02, 0, 0], neck:[-0.02, 0, 0],
    head:[-0.02 + Math.sin(t*0.6)*0.05, Math.sin(t*0.45)*0.16, 0],
    lThigh:[-1.52, 0, 0.13], rThigh:[-1.52, 0, -0.13],
    lShin:[1.18 + sw, 0, 0], rShin:[1.18 - sw, 0, 0],
    lFoot:[0.22,0,0], rFoot:[0.22,0,0],
    lUpperArm:[0.15, 0, 0.22], rUpperArm:[0.15, 0, -0.22],
    lForeArm:[-0.55, 0, 0], rForeArm:[-0.55, 0, 0],
    lHand:[-0.25,0,0], rHand:[-0.25,0,0],
  };
}

export function liePose(t:number):Pose{
  const br = Math.sin(t*1.15)*0.025;
  return {
    spine:[br, 0, 0], chest:[br*0.6, 0, 0],
    neck:[0.05, 0, 0], head:[0.02, 0.11, 0.05],
    lThigh:[-0.04, 0, 0.07], rThigh:[-0.04, 0, -0.07],
    lShin:[0.10, 0, 0], rShin:[0.10, 0, 0],
    lFoot:[-0.30, 0, 0], rFoot:[-0.30, 0, 0],
    lUpperArm:[0.12, 0, 0.30], rUpperArm:[0.12, 0, -0.30],
    lForeArm:[-0.30, 0, 0], rForeArm:[-0.30, 0, 0],
    lHand:[0,0,0], rHand:[0,0,0],
  };
}

export function stretchPose(t:number):Pose{
  const u = clamp(t/2.6, 0, 1);
  const e = Math.pow(Math.sin(Math.PI*Math.pow(u, 0.85)), 0.75);
  return {
    spine:[-0.11*e, 0, 0], chest:[-0.08*e, 0, 0], neck:[-0.15*e, 0, 0], head:[-0.18*e, 0, 0],
    lUpperArm:[-2.55*e, 0, 0.26], rUpperArm:[-2.55*e, 0, -0.26],
    lForeArm:[-0.12 - 0.25*e, 0, 0], rForeArm:[-0.12 - 0.25*e, 0, 0],
    lHand:[0,0,0], rHand:[0,0,0],
    lThigh:[0,0,0.02], rThigh:[0,0,-0.02],
    lShin:[0.03,0,0], rShin:[0.03,0,0],
    lFoot:[-0.02,0,0], rFoot:[-0.02,0,0],
  };
}
