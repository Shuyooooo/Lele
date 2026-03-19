---
name: phaser-memory-rewrite-workflow
description: 用于实现并迭代 Memory Rewrite 的 Phaser 原型工作流。当用户提出场景新增/调整、谜题流程、状态变量、交互热区、反馈表现或阶段文档同步需求时使用，适配 Night/MemoryBedroom/SnailDemo 链路。
---

# Phaser 记忆重构工作流

## 用途

本技能用于本项目核心原型闭环与快速 AI 接管：

- `Night -> MemoryBedroom -> SnailDemoPast -> Night`
- 现在/过去状态改写与视觉反馈
- “描述需求 -> 实现代码 -> 总结结果 -> 同步文档”

## 项目默认信息

- 引擎：Phaser 3（H5 原型）
- 主要场景文件：
  - `Lele/src/scenes/Night_Now.js`
  - `Lele/src/scenes/MemoryBedroom.js`
  - `Lele/src/scenes/SnailDemoPresent.js`
  - `Lele/src/scenes/SnailDemoPast.js`
- 入口：`Lele/src/main.js`
- 规划文档：
  - `Memory-Rewrite-Plan.md`
  - `Memory-Rewrite-GDD.md`
  - `Memory-Rewrite-Puzzle-SnailDemo.md`

## 编码约束

- 优先遵守项目 Cursor 规则（尤其 `.cursor/rules/` 中的大括号风格）。
- 场景代码保持可读、渐进式修改；除非用户明确要求，不做大重构。
- 未明确要求迁移时，保持现有 registry key 不变。

## 标准执行流程

当用户提出玩法/美术/交互需求时，按以下顺序执行：

1. 将需求拆解为可执行项：
   - 场景进入/退出路径
   - 交互对象与触发条件
   - 状态读写（`registry`）
   - 视觉/音频反馈
2. 先实现最小可用版本（MVP 行为）。
3. 验证流程连续性：
   - 能进入目标场景
   - 能触发交互
   - 状态变化可持续
   - 返回路径可用
4. 行为有变化时同步阶段文档：
   - 更新 `Memory-Rewrite-Plan.md` 的 checklist 状态
   - 需要时追加/更新“当前实现快照”
5. 输出简洁回报：
   - 改了什么
   - 为什么满足需求
   - 如何手动验证

## 状态管理模式

跨场景原型状态统一使用 Phaser registry。

当前优先使用的 key：

- `snailShellBroken` (boolean)
- `snailShellHitCount` (number)

规则：

- 场景依赖某个 key 时，在 `init()` 中做防御式初始化。
- 只在明确玩法节点写入状态（不要每帧写）。
- 保持 key 命名稳定；新增 key 必须语义清晰。

## 交互实现模式

每个可交互对象按以下结构实现：

1. 可见对象或明确热区
2. `setInteractive({ useHandCursor: true })`
3. 单一明确处理器（`pointerdown` 或集中式 `gameobjectdown`）
4. 立即反馈（文本/tween/overlay/状态提示）
5. 反馈或状态写入完成后再切场景

## 文档更新模板

更新计划/设计文档时，优先使用以下结构：

- **Implemented（已实现）**
  - 已交付行为清单
- **Pending（待实现）**
  - 明确缺口与下一步
- **Verification（验证步骤）**
  - 手动测试路径（`打开 -> 点击 -> 观察 -> 返回`）

## 变更完成标准

任务只有在以下条件全部满足时才算完成：

- 代码已更新到正确场景文件
- 场景切换闭环仍可游玩
- 状态行为可重复、可预期
- 文档已同步到当前真实实现
- 回复中包含简短“如何验证”清单

