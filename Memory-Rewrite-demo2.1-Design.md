# 🧠 Memory Rewrite Demo 2.1 实现文档

> 本文仅保留当前项目中**已实现**的内容。

---

## ✦ 当前实现状态（Demo 2.1）

> 下列为当前代码里的**实际可玩状态**，优先级高于本文旧版 2.0 设想。

### 1) 场景结构（当前）

- 启动首场景：`DeskNowLightOff`
- 开灯流程：`DeskNowLightOff` 点击开灯热区 -> 进入 `DeskNow`
- 关灯流程：`DeskNow` 点击关灯热区 -> 回到 `DeskNowLightOff`
- 记忆场景：`DeskNow` 点击光源热区 -> `MemoryBedroom`
- 回程：`MemoryBedroom` 点击光源热区 -> `DeskNow`

### 2) 门禁与解谜可用性（当前）

- 仅当 `memory.powerOn === true` 时，`DeskNow` 的解谜入口可用：
  - 电脑验证面板
  - text1/text2 内容弹窗
  - 相关输入验证逻辑
- 关灯状态下上述入口被门禁直接阻断（不触发）。

### 3) 密码与验证（当前）

- 验证码已固定为：`1867`
- 不再使用 `tail4` 动态写入机制
- 过去输入不再改写现在密码，只保留线索/叙事交互

### 4) 热区与调试（当前）

- 主要热区均为透明可点击（alpha `0.001`）
- `D` 调试模式下可编辑热区，`S` 导出并持久化到 `hotzones`
- `DeskNowLightOff` 已支持与其他场景同一套 `S` 导出流程

### 5) LightOff text 热区同步（当前）

- `DeskNowLightOff` 已新增 `textHotzone1/2`
- 点击后打开与 `DeskNow` 相同的 `text_1 / text_2` 内容
- 几何优先读取 `deskNow.textHotzone1/2`，确保 on/off 两边位置尺寸一致

---

