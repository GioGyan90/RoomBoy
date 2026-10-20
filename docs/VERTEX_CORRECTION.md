# 按简化三视图逐点校正

撤销45dc52c中的颈胸、臀腿共边重建，恢复e19f870的闭合基础体块。当前以原有顶点为操作对象，不把解剖想象当作新增结构依据。保留局部放大视图。

## 本轮决策

| 区域 | 操作 | 理由 |
| --- | --- | --- |
| 颈根 | 移动既有8点，胸腔顶圈16点随同对齐 | 原有点数足以表达简化图中的前低、后高边界 |
| 骨盆下缘、面片转折 | 移动两圈既有16点 | 先对齐边界和参考图可见的折线 |
| 骨盆y=490截面 | 删除整圈16点 | 与重新定位后的折线重复，不需要额外一圈 |
| 大腿隐藏顶端 | 移动既有16点，收进遮挡体块 | 不从看不见的结构推造型，避免端面穿出 |
| 新增点/面 | 0 / 0 | 本轮没有证据证明需要更多点 |

## 数量和验证

相对回退后的基模：1,104 → 1,088个缓冲顶点，2,128 → 2,096个三角面。上一轮发布版为2,244面。底层后续密度版本为2,680面，入口仍锁定。72个既有缓冲顶点发生移动；其中40个编号顶点有54个可见投影读点，另外是胸腔边界随动与隐藏端点处理。

12项测试检查闭合、有限坐标、不增点不增面、索引不变（同一删圈基模校正前后）、读点误差下降，以及原有游戏/资产兼容。局部正侧背及斜侧、桌面和手机布局已自查。

已编号点的投影RMS为21.42 → 2.84个源图像素，最大残差8像素。这是对本轮手工读点的局部统计，不是整体相似度评分；读点有人工误差，三视图的高度不完全一致。不同视图同一候选点的高度取平均，并显示剩余差异，不宣称零误差。被遮挡或无法确认对应关系的表面深度不补测。

## 参考读点与实际投影

N：颈根；H：骨盆下缘；M：骨盆面片折线。坐标均为1536×1024简化图的源像素。空白表示该视角没有确认对应点。页面“本轮改点”读取实际网格坐标，与旧关节中心定位点分开。

| 点号 | 正面读点 | 侧面读点 | 背面读点 | 读点最大残差(px) |
| --- | --- | --- | --- | --- |
| N0 | 383, 216 | 751, 209 |  | 3.50 |
| N1 | 411, 211 | 770, 204 |  | 3.50 |
| N2 | 432, 197 | 800, 190 |  | 3.50 |
| N3 |  | 811, 185 | 1121, 177 | 4.00 |
| N4 |  | 818, 186 | 1151, 176 | 5.00 |
| N5 |  | 811, 185 | 1181, 177 | 4.00 |
| N6 | 334, 197 | 800, 190 |  | 3.50 |
| N7 | 357, 211 | 770, 204 |  | 3.50 |
| H0 | 383, 513 | 725, 497 |  | 8.00 |
| H1 | 409, 506 |  |  | 0.00 |
| H2 | 432, 488 |  |  | 0.00 |
| H3 | 447, 475 |  |  | 0.00 |
| H4 | 459, 464 |  | 1071, 470 | 3.61 |
| H5 |  |  | 1086, 485 | 0.00 |
| H6 |  |  | 1108, 499 | 0.00 |
| H7 |  |  | 1129, 507 | 0.00 |
| H8 |  | 814, 510 | 1151, 510 | 0.00 |
| H9 |  |  | 1173, 507 | 0.00 |
| H10 |  |  | 1194, 499 | 0.00 |
| H11 |  |  | 1216, 485 | 0.00 |
| H12 | 307, 464 |  | 1231, 470 | 3.61 |
| H13 | 319, 475 |  |  | 0.00 |
| H14 | 334, 488 |  |  | 0.00 |
| H15 | 357, 506 |  |  | 0.00 |
| M0 | 383, 490 | 718, 488 |  | 1.00 |
| M1 | 411, 485 |  |  | 0.00 |
| M2 | 432, 480 |  |  | 0.00 |
| M3 | 447, 467 |  |  | 0.00 |
| M4 | 455, 459 |  |  | 0.00 |
| M5 |  |  | 1107, 470 | 0.00 |
| M6 |  |  | 1123, 473 | 0.00 |
| M7 |  |  | 1139, 475 | 0.00 |
| M8 |  | 835, 470 | 1151, 476 | 3.00 |
| M9 |  |  | 1163, 475 | 0.00 |
| M10 |  |  | 1179, 473 | 0.00 |
| M11 |  |  | 1195, 470 | 0.00 |
| M12 | 311, 459 |  |  | 0.00 |
| M13 | 319, 467 |  |  | 0.00 |
| M14 | 334, 480 |  |  | 0.00 |
| M15 | 355, 485 |  |  | 0.00 |

## 既有顶点移动量

下面是像素坐标系中的移动量；ΔY向图像下方为正。深度用侧图X表示，向侧图右侧为正。

| 来源 | 网格 | 顶点索引 | Δ正面X | Δ图像Y | Δ侧图X |
| --- | --- | --- | --- | --- | --- |
| N0 | neck | 0 | 0.00 | 7.50 | -8.50 |
| N1 | neck | 1 | 8.20 | 2.50 | 1.27 |
| N2 | neck | 2 | 21.00 | -11.50 | 9.00 |
| N3 | neck | 3 | 5.30 | -33.03 | -2.27 |
| N4 | neck | 4 | -0.00 | -36.77 | -4.50 |
| N5 | neck | 5 | -5.30 | -33.03 | -2.27 |
| N6 | neck | 6 | -21.00 | -11.50 | 9.00 |
| N7 | neck | 7 | -6.20 | 2.50 | 1.27 |
| H0 | pelvis | 0 | -0.50 | -2.00 | -5.00 |
| H1 | pelvis | 1 | 2.73 | 18.90 | 0.00 |
| H2 | pelvis | 2 | 6.43 | 17.77 | 0.00 |
| H3 | pelvis | 3 | 8.53 | 16.04 | 0.00 |
| H4 | pelvis | 4 | 18.00 | 12.00 | 0.00 |
| H5 | pelvis | 5 | 9.53 | 15.88 | 0.00 |
| H6 | pelvis | 6 | 0.43 | 5.01 | 0.00 |
| H7 | pelvis | 7 | -1.27 | 2.94 | 0.00 |
| H8 | pelvis | 8 | -0.50 | 22.00 | 2.96 |
| H9 | pelvis | 9 | 0.27 | 2.94 | 0.00 |
| H10 | pelvis | 10 | -1.43 | 5.01 | 0.00 |
| H11 | pelvis | 11 | -10.53 | 15.88 | 0.00 |
| H12 | pelvis | 12 | -19.00 | 12.00 | 0.00 |
| H13 | pelvis | 13 | -9.53 | 16.04 | 0.00 |
| H14 | pelvis | 14 | -7.43 | 17.77 | 0.00 |
| H15 | pelvis | 15 | -3.73 | 18.90 | 0.00 |
| M0 | pelvis | 16 | -0.50 | 26.00 | 1.00 |
| M1 | pelvis | 17 | -2.16 | 25.69 | 0.00 |
| M2 | pelvis | 18 | -6.30 | 23.81 | 0.00 |
| M3 | pelvis | 19 | -8.10 | 12.90 | 0.00 |
| M4 | pelvis | 20 | -6.00 | 5.63 | 0.00 |
| M5 | pelvis | 21 | -28.10 | 14.02 | 0.00 |
| M6 | pelvis | 22 | -27.30 | 12.41 | 0.00 |
| M7 | pelvis | 23 | -18.16 | 12.54 | 0.00 |
| M8 | pelvis | 24 | -0.50 | 13.52 | 1.40 |
| M9 | pelvis | 25 | 17.16 | 12.54 | 0.00 |
| M10 | pelvis | 26 | 26.30 | 12.41 | 0.00 |
| M11 | pelvis | 27 | 27.10 | 14.02 | 0.00 |
| M12 | pelvis | 28 | 5.00 | 5.63 | 0.00 |
| M13 | pelvis | 29 | 7.10 | 12.90 | 0.00 |
| M14 | pelvis | 30 | 5.30 | 23.81 | 0.00 |
| M15 | pelvis | 31 | 1.16 | 25.69 | 0.00 |
| neck boundary interpolation | ribcage | 144 | 0.00 | 29.50 | -21.02 |
| neck boundary interpolation | ribcage | 145 | 3.28 | 27.00 | -12.99 |
| neck boundary interpolation | ribcage | 146 | 8.20 | 24.50 | -7.70 |
| neck boundary interpolation | ribcage | 147 | 12.63 | 17.50 | 0.99 |
| neck boundary interpolation | ribcage | 148 | 21.00 | 10.50 | 8.50 |
| neck boundary interpolation | ribcage | 149 | 13.63 | 4.25 | 6.54 |
| neck boundary interpolation | ribcage | 150 | 10.20 | -2.00 | 5.71 |
| neck boundary interpolation | ribcage | 151 | 4.28 | -2.00 | 4.98 |
| neck boundary interpolation | ribcage | 152 | -0.00 | -2.00 | 7.00 |
| neck boundary interpolation | ribcage | 153 | -4.28 | -2.00 | 4.98 |
| neck boundary interpolation | ribcage | 154 | -10.20 | -2.00 | 5.71 |
| neck boundary interpolation | ribcage | 155 | -13.63 | 4.25 | 6.54 |
| neck boundary interpolation | ribcage | 156 | -21.00 | 10.50 | 8.50 |
| neck boundary interpolation | ribcage | 157 | -11.63 | 17.50 | 0.99 |
| neck boundary interpolation | ribcage | 158 | -6.20 | 24.50 | -7.70 |
| neck boundary interpolation | ribcage | 159 | -2.28 | 27.00 | -12.99 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 40 | 0.00 | 0.00 | 42.80 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 41 | -18.10 | 0.00 | 30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 42 | -25.60 | 0.00 | 0.00 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 43 | -18.10 | 0.00 | -30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 44 | 0.00 | 0.00 | -42.80 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 45 | 18.10 | 0.00 | -30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 46 | 25.60 | 0.00 | 0.00 |
| occluded endpoint retained inside pelvis, not a reference surface point | right-thigh | 47 | 18.10 | 0.00 | 30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 40 | 0.00 | 0.00 | 42.80 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 41 | -18.10 | 0.00 | 30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 42 | -25.60 | 0.00 | 0.00 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 43 | -18.10 | 0.00 | -30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 44 | 0.00 | 0.00 | -42.80 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 45 | 18.10 | 0.00 | -30.26 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 46 | 25.60 | 0.00 | 0.00 |
| occluded endpoint retained inside pelvis, not a reference surface point | left-thigh | 47 | 18.10 | 0.00 | 30.26 |

## 尚未解决

这轮是可复核的首轮点位校正，不是造型验收完成。颈前内部折线还未逐点确认；臀腿斜侧的面片关系仍粗，隐藏深度也未确认。后续先修正对应关系与点位，再判断是否需要局部加点；不得直接增加连接圈或肌肉鼓包。参考图和编号对照图片不进入公开仓库。
