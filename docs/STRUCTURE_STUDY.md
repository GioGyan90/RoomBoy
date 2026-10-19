# 人体结构研究 · 第一阶段

入口：`?view=structure`。这是一套重新建立的静态结构模型，旧游戏人物保留供对照。当前没有把结构模型绑定到原有动画。

## 先比例，再体块，再加面

1. 以原设定三视图的全身部分为比例依据，头部特写只辅助理解头颅与下颌。
2. 生成低面参考和几何体块参考。首轮体块参考出现头大、腿短的偏移，第二轮明确加入原图关键点比例进行修正。生成图是辅助材料，不作为比例真值。
3. 用封闭的多边形截面建立头颅、胸腔、腹部、骨盆、四肢、手脚。肩颈由斜面连接，关节不使用外露球体。
4. 本轮校准后第一阶段 1,312 三角面；第二阶段 1,968 三角面，共享原图截面站位，仅增加周向分段，尚不做眼睛、发丝、衣褶、饰品或肌肉刻线。
5. 两阶段均使用正交投影，支持三视同屏、单视角、剪影、线框、水平比例线和本地参考图。

截面与基准集中在 `src/assets/procedural/bodyBlockout.ts`，没有样条平滑或隐藏细分。各体块分别闭合，交接处允许相交；这不是已经焊接的连续变形拓扑。

## 原图量取的设计基准

下面保留首轮设计基准的历史记录。本轮改以原图像素截面驱动，最新基准见 [POINT_CALIBRATION.md](POINT_CALIBRATION.md)，不再以本表直接控制模型。

| 关键点 | 离地高度 | 身高占比 |
| --- | ---: | ---: |
| 头顶 | 1.800 | 100% |
| 下巴 | 1.563 | 86.8% |
| 肩部 | 1.490 | 82.8% |
| 腰部 | 1.063 | 59.1% |
| 胯底 | 0.842 | 46.8% |
| 膝盖 | 0.553 | 30.7% |
| 脚踝 | 0.115 | 6.4% |

肩宽目标约 0.461、腰宽约 0.300、髋宽约 0.345。手臂与手部的最大外宽不等同于肩宽。头身约 7.6。

## 实渲染检查与修正

- 第一轮：检查两个密度的正侧背面，发现鼻部独立体块与面部悬空、骨盆下缘与大腿衔接不顺。
- 第二轮：体块阶段移除鼻部细节；低面阶段将鼻面转折并入头部自身的截面，修改骨盆下缘斜率，并按原图收窄上臂根部和肩外缘。
- 桌面与 390 × 844 移动视口检查：阶段、三视同屏、单视角、剪影、线框、比例线和本地图片选择正常；旧人物入口仍可用，无页面脚本异常。
- 自动测试检查两阶段高度与地面、顶点有效性、三角面预算、每个体块的边界闭合；原房间与六种动作的检查继续保留。

## 进入细节前仍需做的事

当前只有大体块。原画的肩颈倾斜、侧面胸背曲率、髋腿连接和头发外轮廓还需要逐区对齐，不能据此宣称已保真复现。下一轮先改这些外形；轮廓稳定后再焊接关节拓扑、安排变形边流，并逐步加入衣物和五官。

## 最后一轮参考图提示词

使用内置 imagegen，输入为原设定与首轮简化图；输出仅作为生产参考，不打包进游戏场景。

> Create a corrected geometric BLOCKOUT modeling sheet using IMAGE1 as anatomical proportion authority and IMAGE2 only as simplification language. White landscape sheet, just THREE equal-sized full-body geometric mannequins: FRONT, SIDE facing left, BACK. SAME adult man proportions and hanging-arms pose as IMAGE1: 7.5 heads tall, head SMALL and narrow, lean athletic not bodybuilder. Precisely proportionate landmark heights measured FROM THE GROUND as fraction of entire height: top of head1.0, chin0.868, shoulder0.827, waist0.59, crotch0.468, knees0.307, ankle0.064, feet0.0. Shoulder width 0.256 times body height, hip width0.192. DO NOT use IMAGE2 bottom row's oversized head and short legs. The shins and thighs must be long like IMAGE1. Face blank wedge with minimal nose plane, no facial features or strand hair; a simple skull cap indicates hair volume. Only simple tapered polygon solids for ribcage, abdomen, pelvis, upper and lower limbs, wedge hands and feet. Flat matte muted clay surfaces, 6-8 sided limb cross sections. Upper chest flows into sloped trapezius and short neck, no disconnected sphere shoulders. No muscles, skin anatomy grooves, clothing, jewelry, fingers, joint balls, scenery. Single row of three figures exactly same height, front/back same outline, correct side depth, all feet visible. No perspective. Small FRONT SIDE BACK headings only. This is a working proportion study, not a polished character render.
