/** Stage 01 authority: the generated coloured GEOMETRIC BLOCKOUT sheet.
 * The detailed character concept is archived in conceptReference.ts and is not
 * used for fitting this stage. Coordinates belong to the 1536 × 1024 sheet. */
export const referenceFrame={width:1536,height:1024,ground:943,top:59,frontAxis:383,sideAxis:800,backAxis:1151,scale:1.8/884,cropTop:45,cropHeight:910,frontCrop:350,sideCrop:260,pelvisRise:52} as const;
export const referenceStage={id:'geometric-blockout',label:'几何体块简化图',next:'低面结构完成后再复核原概念图'} as const;
export type SourcePoint=readonly [frontX:number,frontY:number,sideX:number];
export function sourcePoint([x,y,sx]:SourcePoint):[number,number,number]{const f=referenceFrame;return [(x-f.frontAxis)*f.scale,(f.ground-y)*f.scale,(f.sideAxis-sx)*f.scale];}
export const sourceJoints={
 crown:[383,59,765],chin:[383,171,733],neck:[383,205,791],
 rightShoulder:[281,255,800],leftShoulder:[485,255,800],
 rightElbow:[269,365,792],leftElbow:[497,365,792],
 rightWrist:[248,493,764],leftWrist:[518,493,764],
 rightHip:[339,453,776],leftHip:[427,453,776],
 rightKnee:[320,685,790],leftKnee:[446,685,790],
 rightAnkle:[306,880,800],leftAnkle:[458,880,800],
} as const satisfies Record<string,SourcePoint>;
export const landmarkNames:Record<keyof typeof sourceJoints,string>={crown:'头顶',chin:'下巴',neck:'颈根',rightShoulder:'右肩',leftShoulder:'左肩',rightElbow:'右肘',leftElbow:'左肘',rightWrist:'右腕',leftWrist:'左腕',rightHip:'右髋',leftHip:'左髋',rightKnee:'右膝',leftKnee:'左膝',rightAnkle:'右踝',leftAnkle:'左踝'};
export type SourceBand=readonly [y:number,left:number,right:number,front:number,back:number];
export const bodyBands={
 pelvis:[[507,324,443,730,812],[463,306,461,717,838],[435,314,452,718,825],[410,321,444,719,807]],
 abdomen:[[410,321,444,720,807],[365,328,443,720,818]],
 ribcage:[[365,328,443,720,818],[320,306,461,711,830],[300,303,464,710,837],[292,302,465,707,840],[280,301,466,706,841],[266,299,468,714,840],[244,298,469,730,838],[232,298,469,739,837],[220,297,470,746,834],[183,355,411,772,811]],
 neck:[[205,355,411,765,828],[180,359,407,753,817],[164,360,405,749,810],[138,365,401,753,800]],
 head:[[171,375,391,733,754],[150,355,410,721,778],[120,350,416,715,789],[95,350,415,715,794],[80,360,406,737,794]],
 hair:[[136,350,416,714,800],[95,345,421,712,814],[80,350,416,724,808],[72,354,412,732,802],[65,363,403,745,791],[59,380,386,761,769]],
 rightDeltoid:[[315,266,287,770,812],[298,261,295,761,819],[281,255,304,752,827],[255,258,303,754,837],[237,269,304,761,835],[220,285,304,774,821]],
 leftDeltoid:[[315,479,500,770,812],[298,471,505,761,819],[281,462,511,752,827],[255,463,508,754,837],[237,462,497,761,835],[220,462,481,774,821]],
 rightUpperArm:[[365,250,289,773,812],[348,249,294,766,817],[315,250,301,754,823],[295,254,302,753,824],[280,257,303,756,823]],
 leftUpperArm:[[365,477,517,773,812],[348,472,517,766,817],[315,464,516,754,823],[295,463,512,753,824],[280,463,509,756,823]],
 rightForearm:[[493,237,260,747,776],[410,234,284,761,815],[365,246,287,773,811]],
 leftForearm:[[493,505,528,747,776],[410,481,532,761,815],[365,479,519,773,811]],
 rightHand:[[573,261,268,730,754],[552,245,272,728,771],[523,234,277,727,780],[493,237,260,747,776]],
 leftHand:[[573,497,504,730,754],[552,493,520,728,771],[523,489,532,727,780],[493,505,528,747,776]],
 rightThigh:[[699,293,339,768,827],[650,299,347,755,809],[580,290,365,735,819],[520,287,375,727,818],[453,307,371,720,827]],
 leftThigh:[[699,425,475,768,827],[650,417,466,755,809],[580,400,475,735,819],[520,390,478,727,818],[453,394,458,720,827]],
 rightShin:[[880,293,318,782,817],[800,284,330,778,829],[740,276,346,770,841],[699,289,339,768,827]],
 leftShin:[[880,445,470,782,817],[800,433,480,778,829],[740,418,488,770,841],[699,425,475,768,827]],
 rightFoot:[[943,261,332,695,829],[934,264,332,695,829],[926,270,333,710,828],[916,280,333,736,825],[904,286,330,759,823],[894,290,324,776,820],[880,293,318,782,817]],
 leftFoot:[[943,433,504,695,829],[934,433,501,695,829],[926,434,494,710,828],[916,434,485,736,825],[904,437,478,759,823],[894,441,473,776,820],[880,445,470,782,817]],
} as const satisfies Record<string,readonly SourceBand[]>;
export type JointName=keyof typeof sourceJoints;
export type BodyTargets=Record<JointName,SourcePoint>;
export type StudyView='front'|'side'|'back';
export type ImagePoint=readonly [x:number,y:number];
const backJoints:Partial<Record<JointName,ImagePoint>>={crown:[1151,59],neck:[1151,205],rightShoulder:[1253,255],leftShoulder:[1049,255],rightElbow:[1268,365],leftElbow:[1034,365],rightWrist:[1286,493],leftWrist:[1017,493],rightHip:[1195,453],leftHip:[1107,453],rightKnee:[1216,685],leftKnee:[1085,685],rightAnkle:[1229,880],leftAnkle:[1072,880]};
export const viewJoints={} as Record<JointName,{front:ImagePoint;side:ImagePoint;back?:ImagePoint}>;
for(const name of Object.keys(sourceJoints) as JointName[]){const [x,y,sx]=sourceJoints[name];viewJoints[name]={front:[x,y],side:[sx,name==='chin'?174:y],back:backJoints[name]};}
export function fitJointTargets():BodyTargets{
 const result={} as BodyTargets;for(const name of Object.keys(viewJoints) as JointName[]){const p=viewJoints[name];result[name]=[p.back?(p.front[0]+referenceFrame.frontAxis+referenceFrame.backAxis-p.back[0])/2:p.front[0],name==='crown'?referenceFrame.top:(p.front[1]+p.side[1]+(p.back?.[1]??0))/(p.back?3:2),p.side[0]];}return result;
}
/** Single blue cranial cap, not the original character's hairstyle. */
export const hairRim:readonly SourcePoint[]=[
 [383,95,714],[398,95,721],[411,100,739],[417,112,756],
 [419,107,774],[416,120,790],[409,136,798],[397,137,801],
 [383,136,803],[369,137,801],[355,136,798],[350,120,790],
 [347,107,774],[349,112,756],[355,100,739],[368,95,721],
];

