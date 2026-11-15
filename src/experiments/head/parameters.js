// Shape controls, not expression controls. Ranges are project-tested editing limits.
// [id, label, min, max, default, step, first stage, explanation]
export const parameterGroups = [
 {name:'颅骨与额头',hint:'额头前平面、太阳穴和后脑分别控制；不靠整体缩放代替局部造型。',items:[
 ['depth','整体头部厚度',.9,1.1,1,.01,1,'统一前后厚度；侧面观察。'],
 ['skullHeight','颅顶高度',-.08,.10,0,.01,1,'只调整眉线上方的颅顶，不拉长下半脸。'],
 ['foreheadWidth','额头宽度',.9,1.1,1,.01,1,'控制额头横向体积，过渡至太阳穴。'],
 ['foreheadSlope','额头前凸',-.08,.08,0,.01,1,'正值增加额部前凸，负值后收；侧面观察。'],
 ['templeWidth','太阳穴宽度',.94,1.06,1,.01,1,'控制眼眶外侧至颅骨的侧平面。'],
 ['backDepth','后脑饱满度',.88,1.12,1,.01,1,'仅调整后脑，面部深度保持。']]},
 {name:'颧颊与下颌',hint:'颧部、面颊、下颌角、下巴各有自己的体积与转折。',items:[
 ['cheek','颧颊宽度',.9,1.1,1,.01,1,'影响左右面部宽度，眼眶随基础脸宽对齐。'],
 ['cheekFullness','面颊前凸',-.045,.045,0,.005,1,'控制眼下至口侧的饱满度，不刻写实法令纹。'],
 ['cheekHeight','颧部高度',-.035,.035,0,.005,1,'调整颧部转折的高度。'],
 ['jaw','下颌宽度',.85,1.15,1,.01,1,'调整下颌整体宽度，并平滑过渡至脸颊。'],
 ['jawAngle','下颌角外展',-.04,.04,0,.005,1,'局部控制下颌侧方转折，不改变下巴尖端。'],
 ['chinWidth','下巴宽度',.8,1.2,1,.01,1,'控制下巴前平面宽度，避免收成单点。'],
 ['chinLength','下巴长度',-.05,.06,0,.01,1,'正值延长下巴，负值缩短。'],
 ['chinForward','下巴前凸',-.055,.055,0,.005,1,'独立控制下巴的侧面投影。']]},
 {name:'眉弓与眼眶',hint:'先定眼裂与眼角，再定深度。眼球、睫毛和眉毛仍不加入。',items:[
 ['browProjection','眉弓前凸',-.025,.035,0,.005,2,'改变上眼眶骨性转折，不添加眉毛物体。'],
 ['eyeGap','眼距偏移',-.025,.025,0,.005,3,'正值双眼向外，负值向内；单位为模型局部坐标。'],
 ['eyeWidth','眼裂宽度',.92,1.08,1,.01,3,'围绕每侧眼中心缩放，周边面片跟随。'],
 ['eyeHeight','眼裂高度',.75,1.2,1,.01,3,'调节眼裂开口高度，并保留上下眼睑间距。'],
 ['eyeY','眼眶高度',-.025,.025,0,.005,3,'整体移动眼眶及相邻过渡区。'],
 ['eyeTilt','外眼角上挑',-.04,.04,0,.005,3,'正值外眼角上扬、负值下垂，左右镜像。'],
 ['eyeDepth','眼眶前后',-.035,.035,0,.005,3,'正值向前，负值内收；侧面检查。'],
 ['upperLid','上睑弧度',-.018,.018,0,.003,3,'局部改变上眼睑弧线，眼角保持。'],
 ['lowerLid','下睑弧度',-.012,.012,0,.003,3,'正值下睑抬高，负值降低。'],
 ['lidDepth','眼睑内沿深度',.7,1.35,1,.05,3,'控制眼睑向内的厚度；不封闭眼眶。']]},
 {name:'鼻梁与鼻底',hint:'鼻梁、鼻尖和鼻翼是连在脸上的浅楔形；侧面优先校准。',items:[
 ['nose','鼻尖前凸',.65,1.25,1,.01,2,'原有鼻部楔形的前凸幅度。'],
 ['noseBridge','鼻梁前凸',-.025,.03,0,.005,2,'局部控制鼻根至鼻梁，不整体推移鼻尖。'],
 ['noseWidth','鼻部宽度',.85,1.15,1,.01,2,'改变鼻部连接列宽度，保持中线。'],
 ['noseY','鼻尖高度',-.025,.025,0,.005,2,'调节鼻尖和鼻底的局部高度。'],
 ['alarWidth','鼻底宽度',.88,1.12,1,.01,2,'只调节鼻底两侧的体积。']]},
 {name:'吻部体块',hint:'鼻底至下唇是一个浅凸的口轮匝肌体块：中部前面、两侧斜面，下接颏唇沟；不是独立贴上的嘴。',items:[
 ['muzzleProjection','吻部前凸',.015,.075,.045,.005,2,'整个口周体块前凸，鼻尖和下巴不跟随。'],
 ['muzzleWidth','吻部宽度',.88,1.12,1,.01,2,'控制口周体块及两侧转折，不等于口缝宽度。'],
 ['muzzleHeight','吻部高度',.9,1.1,1,.01,2,'围绕口缝调整鼻底至下唇的体块高度。'],
 ['labiomentalFold','颏唇沟内收',0,.025,.012,.001,2,'下唇与下巴之间的浅内收；避免刻成深沟。']]},
 {name:'嘴部与口鼻区',hint:'当前是闭合口缝。嘴宽、位置和浅唇面独立控制，暂不制作张嘴动画。',items:[
 ['mouthWidth','嘴部宽度',.85,1.15,1,.01,2,'调整口缝两侧控制列的间距。'],
 ['mouthY','嘴部高度',-.025,.025,0,.005,2,'整体上移或下移口缝与上下唇。'],
 ['mouthForward','口鼻区前凸',-.025,.03,0,.005,2,'控制口部的侧面深度。'],
 ['lipFullness','嘴唇厚度',.6,1.5,1,.05,2,'改变浅唇面的凸起，不添加独立嘴唇物体。'],
 ['mouthCorner','嘴角抬高',-.018,.018,0,.003,2,'调节两侧嘴角的静态走势，不等同完整笑容。']]},
 {name:'耳部',hint:'耳朵保持独立封闭分块，根部随头部位置衔接。',items:[
 ['earSize','耳朵大小',.88,1.12,1,.01,2,'围绕耳根调整耳廓尺寸。'],
 ['earY','耳朵高度',-.04,.04,0,.01,2,'仅移动耳部，不改变眼睛高度。'],
 ['earOut','耳廓外展',.8,1.2,1,.05,2,'围绕耳根调整横向外展。']]},
];
export const specs=Object.fromEntries(parameterGroups.flatMap(g=>g.items.map(s=>[s[0],s])));
export const defaults=Object.fromEntries(Object.values(specs).map(s=>[s[0],s[4]]));
export function normalizeParameters(input={}){
 const out={...defaults};
 for(const [key,s]of Object.entries(specs))if(typeof input?.[key]==='number'&&Number.isFinite(input[key]))out[key]=Math.max(s[2],Math.min(s[3],input[key]));
 return out;
}
export function serializeParameters(params){return JSON.stringify({schema:'roomboy-boy-head',version:2,parameters:normalizeParameters(params)},null,2);}
export function parseParameters(text){
 const obj=JSON.parse(text);
 if(!obj||obj.schema!=='roomboy-boy-head'||obj.version!==2||!obj.parameters||typeof obj.parameters!=='object'||Array.isArray(obj.parameters))throw new Error('请使用本实验页导出的 v2 参数 JSON。');
 for(const [key,value]of Object.entries(obj.parameters))if(!specs[key]||typeof value!=='number'||!Number.isFinite(value))throw new Error('参数字段或数值不合法：'+key);
 return normalizeParameters(obj.parameters);
}
