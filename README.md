# RoomBoy — Haru's Room

[在线游玩 / 分享链接](https://giogyan90.github.io/RoomBoy/) · [GitHub 仓库](https://github.com/GioGyan90/RoomBoy)

基于 `reference/roomboydeepseek.html` 拆分的 Three.js 房间小游戏。保留原版视觉与六种互动，使用 Vite + TypeScript，游戏运行时不依赖 CDN。

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

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/game/Game.ts` | 场景装配与帧循环 |
| `src/game/actions.ts` | 动作队列、走路、坐卧与状态提示 |
| `src/game/animation.ts` / `poses.ts` | 关节动画、姿势与动画状态 |
| `src/assets/procedural/room.ts` | 房间与家具的程序生成模型 |
| `src/assets/procedural/character.ts` | 角色与关节层级 |
| `src/assets/procedural/materials.ts` / `textures.ts` | 材质与画布纹理 |
| `src/assets/layout.ts` | 房间尺寸、家具位置 |
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

原版直线点击移动未包含家具碰撞和寻路；本次保留该行为。当前桌椅/床坐卧坐标按原版尺寸设定。替换成新尺寸时，需要同步动作锚点。当前以桌面鼠标操作为主，触屏相机操作尚未实现。

## 人体结构研究

[打开体块与低面三视图](https://giogyan90.github.io/RoomBoy/?view=structure) · [建模顺序与比例基准](docs/STRUCTURE_STUDY.md)。独立静态研究，保留旧人物作对照。

点位校准版支持“定位点”与“原图叠合”，在参考图面板中选择原始设定图即可检查。[坐标与校准记录](docs/POINT_CALIBRATION.md)。
