# RoomBoy — Haru's Room

[在线游玩 / 分享链接](https://giogyan90.github.io/RoomBoy/) · [GitHub 仓库](https://github.com/GioGyan90/RoomBoy)

基于 `reference/roomboydeepseek.html` 拆分的 Three.js 房间小游戏。默认使用 Room v4 剖面场景。使用 Vite + TypeScript，游戏运行时不依赖 CDN。

## 本地运行（Windows / macOS / Linux）

安装 Node.js 22 LTS，在项目文件夹运行：

```sh
npm ci
npm run dev
```

打开终端显示的地址。验证与打包：

```sh
npm test
npm run build
npm run preview
```

点击角色开启动作菜单；点击地面移动；右键拖动旋转；Shift + 右键或中键拖动平移；滚轮缩放；Q/E 旋转；Esc 关闭菜单。

点击床沿或椅子，Haru 会绕到家具边坐下。再点击地面会起身并沿可通行的路线移动，浴室通过门洞进出。

右上角可以切换昼夜、灯光、电脑屏幕和窗帘，也可以点击房间内相应物件。

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/game/Game.ts` | 场景装配与帧循环 |
| `src/game/actions.ts` | 动作队列、走路、坐卧与状态提示 |
| `src/game/animation.ts` / `poses.ts` | 关节动画、姿势与动画状态 |
| `src/assets/procedural/roomV4/` | 默认房间的程序化模型、布局与环境效果 |
| `src/assets/procedural/character.ts` / `characterSurface.ts` | 结构研究截面、贴身服装裁切与骨骼蒙皮 |
| `src/assets/procedural/materials.ts` / `textures.ts` | 材质与画布纹理 |
| `src/assets/registry.ts` | 家具替换入口与默认回退 |
| `src/assets/vertexAsset.ts` | 顶点资产格式和 Three.js 构建器 |
| `src/assets/generated/` | 后续转换生成的顶点 TS 模块 |
| `assets/source/` | 后续导入的源 GLB |
| `tools/glb-to-vertices.ts` | 静态 GLB 转 TS 顶点数据 |
| `src/core/` | 渲染、相机、灯光与数学 |
| `src/input/` / `src/ui/` | 鼠标键盘输入、动作菜单和界面 |
| `.github/workflows/pages.yml` | 测试、构建与 GitHub Pages 部署 |

## 概念图复现

已按两张参考图重建程序化场景与角色，并加入房间/人物/脸部检查视图和“概念图对照”。详见 [视觉验收记录](docs/VISUAL_REVIEW.md)，其中列明迭代过程与尚存差异。

第二轮角色细化依据补充的正、侧、背面设定图完成，新增人物三方向检查，见 [角色细化记录](docs/CHARACTER_REFINEMENT.md)。

## 后续替换模型

参见 [资产流程](docs/ASSETS.md)。静态家具可以转换为 TS 顶点模块，再编译成 JS；角色骨骼与动画需要适配器，工具会拒绝有损扁平化。

## GitHub Pages

1. 将本项目提交至新仓库 `main` 分支。
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
3. 在 Actions 运行 **Build and deploy game**。
4. 部署成功后，以 Actions 的 `github-pages` 环境实际返回的 URL 为分享地址。

Vite 使用相对资源路径，兼容仓库子路径。已创建公开仓库并完成首次 Pages 部署；后续推送 main 会自动测试、构建和更新分享页。

## 当前边界

墙壁和家具采用固定碰撞体。行走以 Haru 的水平占位扫掠检测，并在家具与门框之间寻找路径。桌椅和床的尺寸与动作锚点位于 `roomV4/definitions.ts`。相机操作主要面向桌面鼠标。

## 坐下动作

床沿和椅子的 `motion-plan v1` 源方案位于 `assets/source/motions/`。通过 [3D_AItool 的 Prompt2Rig](https://github.com/GioGyan90/3D_AItool/tree/0434ddfaee268531cf6141b8cbf19c6d64c2decf/experiments/prompt2rig) 校验、采样和重定向到 Haru 的关节，再按当前座面和实际脚底校准高度。游戏读取生成的本地动画数据。

在 RoomBoy 与 3D_AItool 并排检出的情况下，修改动作方案后重新烘焙。

```sh
node --import tsx --experimental-loader ../3D_AItool/experiments/prompt2rig/tests/vendor-loader.mjs tools/bake-seating.ts ../3D_AItool/experiments/prompt2rig
```

## 人体结构研究

[打开体块与低面三视图](https://giogyan90.github.io/RoomBoy/?view=structure) · [建模顺序与比例基准](docs/STRUCTURE_STUDY.md)。游戏人物沿用研究截面和关节位置，使用可变形的身体与贴身服装表面。头部保留素模供轮廓检查。

点位校准版支持“定位点”与“原图叠合”，在参考图面板中选择原始设定图即可检查。[坐标与校准记录](docs/POINT_CALIBRATION.md)。

最新一轮已让定点驱动实际网格端面，加入独立背面点位、并排对照及误差检查。[实际网格对齐记录](docs/MESH_ALIGNMENT.md)。

## 当前阶段：先对齐几何体块简化图

当前检查页以已生成的彩色几何体块三视图为唯一基准，详细概念图暂不参与拟合。低面细化入口暂锁定。详见 [BLOCKOUT_BASELINE.md](docs/BLOCKOUT_BASELINE.md)。

本轮补足颈后、臀部、颅顶、脚背与胸臂体积，新增前斜侧和后斜侧检查。[结构体积修订与验证](docs/STRUCTURE_VOLUMES.md)。

胸肩与发际线继续修订：锁骨下方、胸肌下缘、三角肌收口及多段发际边界已更新，仍以简化图为基准。

当前已撤销共边重建，退回基础几何体并按简化三视图编号移动原有顶点；局部放大功能保留。[逐点校正记录](docs/VERTEX_CORRECTION.md)。

## 当前分块重建：臀部待审阅

[独立臀部分块](https://giogyan90.github.io/RoomBoy/?view=pelvis)：当前为36顶点/68面镜像外轮廓笼架，所有点在轮廓边界；支持编号与本地参考并排。侧面已按可见边界拟合，橙点标记遮挡处推定。全身检查页已移除旧臀块，新块尚未安装，等待用户确认。[分块审阅记录](docs/PELVIS_PART_REVIEW.md)。
