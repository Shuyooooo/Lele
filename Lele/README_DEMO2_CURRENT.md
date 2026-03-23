# Memory Rewrite Demo2.0 Current State

本文是 Demo2.0 的“当前实现快照”，用于跨聊天窗口快速恢复上下文。

## Current Scene Flow

- 主流程：`NightBedroom -> DeskNow -> MemoryBedroom`
- `NightBedroom`
  - 点击 `deskHotzone` 进入 `DeskNow`
- `DeskNow`
  - 点击 `computer` 热区打开电脑验证面板
  - 点击 `textHotzone1` / `textHotzone2` 分别展示 `text_1` / `text_2` 资源（带关闭按钮）
  - 底部返回箭头回 `NightBedroom`
- `MemoryBedroom`
  - 点击 `deskHotzone` 直接在本场景弹“重置窗口”（不再切到 `DeskPast`）
  - 重置窗口输入 4 位数字，点击“重置”按钮执行重置
  - 顶部返回箭头回 `NightBedroom`

## Keyboard And Debug Rules

- `D`：切换 Debug 模式（由 `DebugManager` 处理）
- Debug 下选中热区后：
  - 方向键：移动
  - `PageUp` / `PageDown`：缩放
- `S`（不带 Ctrl/Meta）：
  - 在各场景里导出热区配置到 `hotzones` 结构
  - 同时写入 `localStorage.hotzones`
  - 同时触发浏览器下载 `hotzones.json`
- `Ctrl+S`：仍是 `DebugManager` 的 `ui_config` 保存逻辑（与 `hotzones` 是两套数据）

## Hotzone Persistence Model

- 默认配置文件：`Lele/hotzones.json`
- 运行期缓存：`localStorage.hotzones`
- 读取优先级：
  1. `localStorage.hotzones`
  2. `Lele/hotzones.json`
- 每个场景都有 `loadAndApplyHotzonesConfig()` 与 `exportHotzonesConfigToDownloadAndStorage()`

## Current Hotzones (By Scene)

- `nightBedroom`
  - `deskHotzone`
- `deskNow`
  - `computerHotzone`
  - `textHotzone1`
  - `textHotzone2`
- `memoryBedroom`
  - `deskHotzone`

## Key Files

- 场景实现：
  - `Lele/src/scenes/NightBedroomScene.js`
  - `Lele/src/scenes/DeskNowScene.js`
  - `Lele/src/scenes/MemoryBedroomScene.js`
- 热区配置：
  - `Lele/hotzones.json`
- 旧的对象布局调试配置（非 hotzones）：
  - `Lele/ui_config.json`
  - `Lele/src/utils/DebugManager.js`

## Common Pitfalls

- 只按 `S` 保存的是 `hotzones`；`Ctrl+S` 保存的是 `ui_config`。
- 如果热区“消失”，优先检查 `localStorage.hotzones` 是否有旧位置把热区移出可视区。
- `MemoryBedroom` 当前是场景内 modal 重置，不再依赖 `DeskPast` 打开重置窗口。
