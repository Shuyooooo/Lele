// src/utils/DebugManager.js
export class DebugManager {
    constructor(scene, layoutManager) {
      this.scene = scene;
      this.layoutManager = layoutManager;
      this.debugMode = false;
      this.selectedObject = null;
      this.uiConfig = {};
      this.loadConfig();
      this.setupDebugControls();
    }
  
    loadConfig() {
      // 从localStorage加载配置（或从文件加载）
      const savedConfig = localStorage.getItem('ui_config');
      if (savedConfig) {
        this.uiConfig = JSON.parse(savedConfig);
      }
    }
  
    saveConfig() {
      localStorage.setItem('ui_config', JSON.stringify(this.uiConfig));
    }
  
    setupDebugControls() {
      // 按D键切换调试模式
      this.scene.input.keyboard.on('keydown-D', () => {
        this.toggleDebugMode();
      });
  
      // 鼠标点击选择对象
      this.scene.input.on('pointerdown', (pointer) => {
        if (!this.debugMode) return;
        
        const objects = this.scene.children.list;
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          if (obj.input && obj.input.hitArea) {
            if (Phaser.Geom.Rectangle.Contains(obj.getBounds(), pointer.x, pointer.y)) {
              this.selectObject(obj);
              break;
            }
          }
        }
      });
  
      // 方向键调整位置
      this.scene.input.keyboard.on('keydown', (event) => {
        if (!this.debugMode || !this.selectedObject) return;
        
        let moved = false;
        switch (event.key) {
          case 'ArrowUp':
            this.selectedObject.y -= 1;
            moved = true;
            break;
          case 'ArrowDown':
            this.selectedObject.y += 1;
            moved = true;
            break;
          case 'ArrowLeft':
            this.selectedObject.x -= 1;
            moved = true;
            break;
          case 'ArrowRight':
            this.selectedObject.x += 1;
            moved = true;
            break;
          case 'PageUp':
            this.selectedObject.scale += 0.01;
            moved = true;
            break;
          case 'PageDown':
            this.selectedObject.scale -= 0.01;
            moved = true;
            break;
          case 'S':
            if (event.ctrlKey || event.metaKey) {
              this.saveCurrentObjectConfig();
            }
            break;
        }
        
        if (moved) {
          this.updateObjectConfig();
        }
      });
    }
  
    toggleDebugMode() {
      this.debugMode = !this.debugMode;
      if (this.debugMode) {
        this.showDebugUI();
        console.log('调试模式已开启 - 点击对象选择，方向键调整位置，PageUp/PageDown调整大小，Ctrl+S保存');
      } else {
        this.hideDebugUI();
        this.selectedObject = null;
        console.log('调试模式已关闭');
      }
    }
  
    selectObject(obj) {
      this.selectedObject = obj;
      this.updateDebugInfo();
      this.showSelectionIndicator();
    }
  
    showSelectionIndicator() {
      // 显示选择框
      if (this.selectionBox) {
        this.selectionBox.destroy();
      }
      
      const bounds = this.selectedObject.getBounds();
      this.selectionBox = this.scene.add.graphics();
      this.selectionBox.lineStyle(2, 0xff0000);
      this.selectionBox.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  
    updateObjectConfig() {
      if (!this.selectedObject || !this.selectedObject.name) return;
      
      const obj = this.selectedObject;
      this.uiConfig[obj.name] = {
        x: obj.x,
        y: obj.y,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY
      };
    }
  
    saveCurrentObjectConfig() {
      this.updateObjectConfig();
      this.saveConfig();
      console.log('配置已保存:', this.uiConfig);
    }
  
    applyConfig() {
      // 应用保存的配置到所有对象
      Object.keys(this.uiConfig).forEach(name => {
        const obj = this.scene.children.getByName(name);
        if (obj) {
          const config = this.uiConfig[name];
          obj.setPosition(config.x, config.y);
          obj.setScale(config.scaleX, config.scaleY);
        }
      });
    }
  
    showDebugUI() {
      // 显示调试信息面板
      if (this.debugPanel) return;
      
      this.debugPanel = this.scene.add.text(10, 10, '调试模式', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#ff0000'
      }).setDepth(1000);
    }
  
    hideDebugUI() {
      if (this.debugPanel) {
        this.debugPanel.destroy();
        this.debugPanel = null;
      }
      
      if (this.selectionBox) {
        this.selectionBox.destroy();
        this.selectionBox = null;
      }
      
      if (this.objectInfo) {
        this.objectInfo.destroy();
        this.objectInfo = null;
      }
    }
  
    updateDebugInfo() {
      if (!this.selectedObject) return;
      
      if (this.objectInfo) {
        this.objectInfo.destroy();
      }
      
      const obj = this.selectedObject;
      const info = `
  对象: ${obj.name || '未命名'}
  位置: x=${Math.round(obj.x)}, y=${Math.round(obj.y)}
  缩放: x=${obj.scaleX.toFixed(2)}, y=${obj.scaleY.toFixed(2)}
  尺寸: ${Math.round(obj.width)}, ${Math.round(obj.height)}
  按Ctrl+S保存配置
  `;
      
      this.objectInfo = this.scene.add.text(10, 50, info, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      }).setDepth(1000);
    }
  }