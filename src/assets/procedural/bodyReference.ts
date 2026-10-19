/** Hand digitized design coordinates, in the original 1200 × 800 sheet.
 * Front/back are not identical anatomical poses; hidden body contours are estimates.
 * +Z is towards the face. Joint centres are distinct from surface outlines. */
export const referenceFrame={width:1200,height:800,ground:772,top:24,frontAxis:554,sideAxis:821,backAxis:1042,scale:1.8/748} as const;
export type SourcePoint=readonly [frontX:number,frontY:number,sideX:number];
export function sourcePoint([x,y,sx]:SourcePoint):[number,number,number]{const f=referenceFrame;return [(x-f.frontAxis)*f.scale,(f.ground-y)*f.scale,(f.sideAxis-sx)*f.scale];}
export const sourceJoints={
 crown:[554,24,790],chin:[555,121,770],neck:[554,150,800],
 rightShoulder:[483,181,818],leftShoulder:[631,181,818],
 rightElbow:[463,285,818],leftElbow:[648,285,818],
 rightWrist:[458,386,785],leftWrist:[648,386,785],
 rightHip:[513,384,798],leftHip:[599,384,798],
 rightKnee:[513,543,800],leftKnee:[601,543,800],
 rightAnkle:[499,726,820],leftAnkle:[611,726,820],
} as const satisfies Record<string,SourcePoint>;
export const landmarkNames:Record<keyof typeof sourceJoints,string>={crown:'头顶',chin:'下巴',neck:'颈根',rightShoulder:'右肩',leftShoulder:'左肩',rightElbow:'右肘',leftElbow:'左肘',rightWrist:'右腕',leftWrist:'左腕',rightHip:'右髋',leftHip:'左髋',rightKnee:'右膝',leftKnee:'左膝',rightAnkle:'右踝',leftAnkle:'左踝'};
/** y, front silhouette left/right, side silhouette front/back, all pixels.
 * Rings run from the ground upwards. Garment edges do not assert bare anatomy. */
export type SourceBand=readonly [y:number,left:number,right:number,front:number,back:number];
export const bodyBands={
 pelvis:[[421,482,625,775,816],[390,482,625,750,841],[365,485,618,752,839],[344,489,616,753,836]],
 abdomen:[[350,488,617,754,836],[320,493,615,754,836],[290,491,620,753,840]],
 ribcage:[[315,493,615,754,836],[260,488,623,754,845],[210,491,621,756,850],[175,492,621,772,849],[156,497,616,790,838],[144,534,580,790,825]],
 neck:[[151,531,579,789,823],[132,538,575,781,815],[116,542,574,779,810]],
 head:[[121,551,559,768,783],[110,539,575,758,804],[94,531,581,746,820],[73,525,589,747,830],[48,529,585,760,825],[31,544,567,779,804]],
 hair:[[73,506,601,742,835],[47,514,596,751,831],[30,534,579,769,816],[24,550,558,786,794]],
 rightDeltoid:[[226,458,485,797,849],[196,459,494,794,851],[175,465,500,799,847],[158,484,497,812,835]],
 leftDeltoid:[[226,628,655,797,849],[196,618,653,794,851],[175,611,648,799,847],[158,614,627,812,835]],
 rightUpperArm:[[287,452,474,804,832],[240,455,481,797,845],[211,459,491,795,850]],
 leftUpperArm:[[287,637,659,804,832],[240,630,658,797,845],[211,622,653,795,850]],
 rightForearm:[[388,449,467,772,797],[338,448,472,777,812],[310,449,474,793,824],[283,452,475,804,832]],
 leftForearm:[[388,639,657,772,797],[338,637,662,777,812],[310,635,660,793,824],[283,636,659,804,832]],
 rightHand:[[446,464,473,766,779],[431,452,476,758,789],[405,446,472,760,793],[386,449,468,772,798]],
 leftHand:[[446,631,640,766,779],[431,628,652,758,789],[405,630,659,760,793],[386,638,658,772,798]],
 rightThigh:[[547,493,533,783,830],[505,483,535,771,831],[451,480,545,760,832],[384,483,547,753,839]],
 leftThigh:[[547,580,620,783,830],[505,572,623,771,831],[451,564,626,760,832],[384,559,623,753,839]],
 rightShin:[[731,487,511,807,834],[674,481,517,801,838],[607,484,526,792,844],[570,489,529,789,839],[539,494,534,783,828]],
 leftShin:[[731,599,623,807,834],[674,591,627,801,838],[607,585,628,792,844],[570,580,620,789,839],[539,580,620,783,828]],
 rightFoot:[[772,458,512,738,835],[758,463,513,746,837],[741,481,513,773,837],[726,488,511,807,834]],
 leftFoot:[[772,595,645,738,835],[758,594,638,746,837],[741,595,627,773,837],[726,599,623,807,834]],
} as const satisfies Record<string,readonly SourceBand[]>;
