# Memory Rewrite Demo 2.0

策划见仓库根目录 `Memory-Rewrite-demo2.0-Design.md`。
当前实现快照见 `README_DEMO2_CURRENT.md`。

## 运行

需安装 [Node.js](https://nodejs.org/)，在项目目录执行：

```bash
npm install
npm run dev
```

浏览器打开终端里提示的本地地址（一般为 `http://localhost:5173`）。

## 玩法简述

1. **现在**：点击电脑 →「回忆（进入过去）」→ 在思考圆里输入 **4 位数字** 作为后四位，Enter 确认。  
2. 回到现在后 **不会显示** 这四位；便利贴上固定为前两位 **`3A`**。  
3. 再打开电脑，输入完整 **6 位**（`3A` + 你记住的 4 位数字），Enter 验证。  
4. 成功：界面解锁、灯光变暖、便利贴出现「已同步」提示；失败：简短抖动反馈。

按 **Esc** 可关闭电脑面板。

## 技术说明

- Phaser 3 + Vite；贴图通过 `?url` 导入，便于打包与开发服务器解析路径。
