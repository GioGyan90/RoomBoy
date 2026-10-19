# 交接状态

- 仓库：https://github.com/GioGyan90/RoomBoy
- 分享：https://giogyan90.github.io/RoomBoy/
- 已完成：Vite + 严格 TypeScript 模块；房间资产分组；角色/动画/动作队列拆分；静态 GLB 顶点转换及替换接口；Pages 工作流与首次部署。
- 验证：本地及 GitHub Actions 中构建通过，4 项资产测试通过。Pages 部署成功，公开入口可访问。
- 浏览器限制：当前云浏览器不支持 WebGL，页面显示硬件加速提示；尚未确认三维画面和交互。请在支持 WebGL 的桌面浏览器完成视觉验收。
- 下一步：导入 GLB 静态家具，使用 assets:convert 转为 TS 顶点模块，在 registry 注册替换。角色完整蒙皮/骨骼/动画需专门适配，不能按静态家具转换。
- 当前保留原版直线移动，没有家具碰撞与寻路；移动端相机手势尚未实现。
