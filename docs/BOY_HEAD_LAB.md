# 少年头部：原始 GLB 直接减面（QEM 30K）

线上入口：[`?view=head`](https://giogyan90.github.io/RoomBoy/?view=head)

## 当前模型及来源

- 原始用户上传：`grey-head-fast-medium(2).glb`（与 `grey-head-fast-medium.glb` 的 SHA-256 相同）。
- 原文件 SHA-256：`cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817`。
- 源 GLB：797,528 顶点，1,424,998 三角面，`EXT_meshopt_compression`，同时包含 KTX2 贴图及法线。
- **当前仓库资产**：`public/heads/grey-head-qem-30000.glb`，27,463 顶点 / 30,000 三角面 / 1,020,232 字节，SHA-256 `36732c6a929e4e588314ba540255c8c2effe0f6880d6168a091f7922787e66d0`。
- 面数减少 **97.89%（约 47.5 倍）**。这是对源文件的**真实三角网格**进行 QEM 减面，而不是通过 57 层包络制作一个新的近似脸。

## 处理过程

1. 直接读取上传文件的 glTF 数据，解码 `POSITION`、`NORMAL`、`indices`。
2. 将完整的 142 万三角面交给 VTK `vtkQuadricDecimation`，目标面数 30,000，开启体积保留。
3. 从原始网格最近邻顶点转移法线，保留原模型设计好的低面风格光影转折。原模型没有被重新拓扑绘制。
4. 整体统一缩放至高 2.25，底部 y=-1.02、最前点 z=0.82、左右中心 x=0，与原高模对照预览坐标一致。只作刚性方向保持的等比例缩放与平移。
5. 以带 `POSITION`、`NORMAL` 和真实三角面索引的 GLB 导出；运行时可直接被 Three.js `GLTFLoader` 加载，**无需再解压 Meshopt**。默认显示为中性灰。
6. 用实际三角网格做正面、侧面及 45° 渲染，与源 142 万面原始模型比较；另比较 12,000 面候选版本，选择轮廓及五官细节更稳定的 30,000 面为正式交付。

### 比较结果

| 属性 | 原始 GLB | 当前 QEM 版本 |
| --- | ---: | ---: |
| 顶点 | 797,528 | 27,463 |
| 三角面 | 1,424,998 | 30,000 |
| 文件大小 | 18,896,752 字节 | 1,020,232 字节 |
| 几何来源 | 源 GLB | 源 GLB 三角网格 QEM 简化 |
| 五官/耳朵拓扑 | 原始 | 基于原网格保留的简化面 |
| 原始贴图/UV | 包含 | 未导出，使用中性灰材质 |
| 法线 | 原文件法线 | 最近邻转移的原始法线 |

最近邻原始**顶点**距离（简化顶点 → 源顶点）：RMS 约 0.00093，95 分位约 0.00180（源模型局部单位）。该指标不是三角面双向 Hausdorff 距离，不能用于声称整体表面误差低于某数值。实际高模和低模的五官细节、阴影及轮廓仍应视觉复查。

## 仓库变更

`src/experiments/head/headLab.js` 直接加载 **`public/heads/grey-head-qem-30000.glb`**；四方向查看、原始高模本地导入及并排对比、低模线框检查可用。

此前 541 顶点 / 1,046 面的程序化头模、GLB 57 截面拟合模块、旧资产工厂、旧参数面板与老测试已移除。构建流程不再输出过去的 `grey-head-lowpoly.js`；新网页只展示源网格实际减面后的版本。

**注意**：没有把 18.9 MB 原始 GLB、它的 KTX2 贴图或原始模型数据提交到仓库。上传的高模只作源数据；本仓库交付的是压缩网格。游戏人物 Haru 的原骨骼、衣服和当前头部暂时不替换，以免影响动画。

## 如需重新调整减面数量

本地准备 Python 的 `numpy scipy vtk trimesh` 和项目 `npm ci` 后：

```bash
node scripts/read-head-reference.mjs "./grey-head-fast-medium(2).glb" .head-work
python scripts/decimate-head.py --source .head-work --faces 30000 --output public/heads/grey-head-qem-30000.glb
npm test
npm run build
```

原始文件需用户自行放到本地，仓库不附带源 GLB。使用不同 VTK / Trimesh 版本时具体顶点顺序与文件 SHA 可能变化，新导出后应更新测试中的预期哈希和计数，并重新完成正面、45°、侧面、背面的视觉检查。

校验：`tests/head-glb-reduction.test.ts` 确认 GLB 头、压缩后真实面数、顶点/法线/索引与文件指纹；`tests/head-reference-copy.test.ts` 校验用于本地高模对照的几何副本。


## 2026-11-16：真实 GLB 中线切割和左右镜像

**当前默认显示的模型**：`public/heads/grey-head-qem-symmetric.glb`，**31,357 顶点 / 34,500 面 / 1,167,696 字节**。对称前的原模型 `public/heads/grey-head-qem-30000.glb` 保留作备份。相较最初 1,424,998 面的上传高模，对称版仍减少约 97.58% 面数。

算法来源：`scripts/symmetrize-head.py` 直接解析原 30K GLB 的实际网格位置、法线和三角面索引。根据头部包围盒计算 X 中线：输入坐标 `X=+0.000042945146560668945`；平移后在 `X=0` 做三角面裁切。保留负 X 半边，镜像到正 X 半边，镜像面反转绕序。

- 实际跨中线原三角面：593 个；保留负 X 半边：17,250 面。
- 对称后合计 34,500 面；中线共享 655 个顶点、593 条边。
- 每条中线边均被恰好两片面共用，**0 条未焊接的单侧中线边**。没有用额外平面封住切口。
- 真实源网格部分顶点位置相同但法线不同，保留这种分离，不盲目全局焊接；中心线顶点则真正复用同一个顶点索引。
- 保留来源半边的原始顶点法线，正 X 侧镜像法线，中线法线 X 分量设置为 0，防止中心光影接缝。
- 两侧顶点与面索引严格成对镜像。对称化不等于修复原眼窝、耳廓等所有造型细节。

`.github/workflows/head-symmetry.yml` 可重新生成、验证并提交实际 GLB 二进制与 JSON 报告；`tests/head-symmetry.test.ts` 从仓库提交的 GLB 中逐项验证顶点位置、法线、面配对、无断裂中线边。网页头部实验室新增 **X=0 对称轴**和**左右半边分开观察**开关；分开展示仅临时平移预览，不改最终焊接的模型。

本地重新生成：

```bash
python -m pip install "numpy>=1.26,<3" "trimesh>=4.5,<5"
python scripts/symmetrize-head.py public/heads/grey-head-qem-30000.glb public/heads/grey-head-qem-symmetric.glb --report public/heads/grey-head-qem-symmetric.report.json
npm test
npm run build
```

可用 `--side positive` 选择相反母版侧；默认保留负 X 半边。Haru 游戏角色现用骨骼头部没有改动。
