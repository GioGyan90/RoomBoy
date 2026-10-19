# 资产替换约定

## 静态家具：GLB → TS → 构建后 JS

```sh
npm run assets:convert -- assets/source/desk.glb src/assets/generated/desk.ts
```

支持当前场景中的静态三角网格、索引、法线、UV、节点世界变换与基础 PBR 颜色。多节点、多 primitive 和同一个 mesh 的不同节点实例均独立导出。没有法线时运行时重新计算。数据保持原始数值，不做降面或量化。

含贴图会默认报错；若确定只用纯色，可显式使用 `--strip-textures`。贴图图片不会被打包到顶点模块中。暂不支持 Draco/Meshopt 压缩扩展、骨骼、蒙皮、动画、Morph、材质扩展以及非三角 primitive，转换会报错，不会默默丢失数据。JS 数字数组可能比 GLB 更大，这个工具用于可编辑资产结构，不代表压缩方案。

在 `src/assets/registry.ts` 中注册：

```ts
import desk from './generated/desk';
export const roomOverrides = {
  desk: vertexFactory(desk),
};
```

保留原有 `Partial<Record<RoomAssetId,AssetFactory>>` 类型标注。可用 ID：`bed`、`desk`、`chair`、`wardrobe`、`shelves`、`props`、`window`、`outside`、`decor`。`props` 当前包含地毯、垃圾桶和背包。每个逻辑家具均为独立 Group。

默认模型内的顶点/节点坐标已经是房间坐标；新模型建议以家具局部原点建模，再在 factory 外层 Group 上设置位置、旋转和缩放。约定单位米、Y 轴朝上。GLB 节点变换会保留，避免重复应用位移。

`shell` 含墙体、地板、踢脚线和特殊的天花板引用，替换必须修改 `createRoom()`，不能直接覆盖以免悬空引用。

## 角色替换

角色返回 `{charRoot, body, J, charMeshes, ...}`，游戏动作通过 `body` 髋部枢轴和 `J` 的关节名称驱动。当前关节包括 pelvis/spine/chest/neck/head，以及左右 UpperArm/ForeArm/Hand/Thigh/Shin/Foot，另有 Shoulder。

后续可把静态身体部件替换为顶点模型并挂到这些枢轴上；完整蒙皮角色需要建立 `Bone` 名称、初始朝向、关节偏移和姿势适配，不能直接把整个蒙皮 GLB 当作静态家具替换。

拾取使用 `charMeshes`，新部件需要更新这个数组。睡眠气泡和头顶标记依赖 `J.head`，必须保留。角色身高改变后，需要一起校准髋高、坐卧高度、床和桌椅交互锚点。

## 布局与动作

`layout.ts` 管理视觉布局。`actions.ts` 中目前保留原版坐卧动作坐标；替换家具时应同步对应坐卧点和站起点。后续再把这些点迁移为每个资产的命名 anchor，接入碰撞与寻路。
