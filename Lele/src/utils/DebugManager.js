export class DebugManager
{
    constructor(scene, layoutManager, options = {})
    {
        this.scene = scene;
        this.layoutManager = layoutManager;

        this.debugMode = false;
        this.selectedObject = null;

        // ui_config 的根对象（可能是嵌套结构：{ nightBedroom: { background: ... } }）
        this.uiConfig = {};

        // 当前场景对应的那一层（例如 nightBedroom / deskNow）
        this.sceneConfigKey = null;
        this.sceneConfig = {};

        this.selectionBox = null;
        this.debugPanel = null;
        this.objectInfo = null;

        this.sceneKey = options.sceneKey || this.getSceneKey();

        // 事件处理函数引用（用于 shutdown 清理）
        this.keyDownDHandler = null;
        this.keyDownHandler = null;
        this.onShutdownHandler = null;

        // 允许场景决定 x/y 的“百分比基准区域”
        this.editRectProvider = options.editRectProvider || null;

        // 用于避免 localStorage 保存的坐标体系/布局规则过期
        this.workflowId = options.workflowId || 'phaser-memory-workflow-v2';

        this.defaultConfigUrl = new URL('../../ui_config.json', import.meta.url).href;

        this.onShutdownHandler = () =>
        {
            this.onShutdown();
        };
        this.scene.events.on('shutdown', this.onShutdownHandler);

        // 异步加载默认 ui 配置（若 localStorage 已有则优先使用）
        this.ready = this.loadConfigAsync()
            .then(() =>
            {
                this.resolveSceneConfig();
                this.setupDebugControls();
            })
            .catch(() =>
            {
                // 默认配置加载失败时依旧允许调试，只是初始位置不会生效
                this.uiConfig = {};
                this.resolveSceneConfig();
                this.setupDebugControls();
            });
    }

    getSceneKey()
    {
        return this.scene?.sys?.settings?.key || this.scene?.scene?.key || '';
    }

    async loadConfigAsync()
    {
        const savedConfig = localStorage.getItem('ui_config');
        let meta = {};
        try
        {
            meta = JSON.parse(localStorage.getItem('ui_config_meta') || '{}');
        }
        catch (e)
        {
            meta = {};
        }

        // localStorage 不符合当前工作流版本，则忽略，使用项目默认 ui_config
        if (savedConfig && meta && meta.workflowId === this.workflowId)
        {
            try
            {
                this.uiConfig = JSON.parse(savedConfig);
                return;
            }
            catch (e)
            {
                this.uiConfig = {};
            }
        }

        // 首次运行/版本变更：从项目里的 ui_config.json 取默认值
        const resp = await fetch(this.defaultConfigUrl, { cache: 'no-store' });
        this.uiConfig = await resp.json();

        localStorage.setItem('ui_config_meta', JSON.stringify({ workflowId: this.workflowId }));
    }

    resolveSceneConfig()
    {
        if (!this.uiConfig || typeof this.uiConfig !== 'object')
        {
            this.uiConfig = {};
        }

        const sceneKey = this.sceneKey;
        const lowerFirst = sceneKey ? (sceneKey.charAt(0).toLowerCase() + sceneKey.slice(1)) : sceneKey;

        if (sceneKey && this.uiConfig[sceneKey])
        {
            this.sceneConfigKey = sceneKey;
            this.sceneConfig = this.uiConfig[sceneKey];
            return;
        }

        if (lowerFirst && this.uiConfig[lowerFirst])
        {
            this.sceneConfigKey = lowerFirst;
            this.sceneConfig = this.uiConfig[lowerFirst];
            return;
        }

        // 兼容：如果 uiConfig 直接是 flat 结构（background/computer/light）
        this.sceneConfigKey = null;
        this.sceneConfig = this.uiConfig;
    }

    getAllowedNames()
    {
        if (!this.sceneConfig || typeof this.sceneConfig !== 'object')
        {
            return [];
        }
        return Object.keys(this.sceneConfig);
    }

    getEditRect()
    {
        if (typeof this.editRectProvider === 'function')
        {
            const r = this.editRectProvider();
            if (r && typeof r.x === 'number' && typeof r.y === 'number' && typeof r.width === 'number' && typeof r.height === 'number')
            {
                return r;
            }
        }

        return {
            x: 0,
            y: 0,
            width: this.scene.scale.width,
            height: this.scene.scale.height
        };
    }

    applyConfig()
    {
        if (!this.sceneConfig || typeof this.sceneConfig !== 'object')
        {
            return;
        }

        Object.keys(this.sceneConfig).forEach(name =>
        {
            const obj = this.scene.children.getByName(name);
            if (!obj)
            {
                return;
            }

            const config = this.sceneConfig[name] || {};

            // 支持两种格式：
            // 1) xPercent/yPercent/scalePercent（来自 ui_config.json）
            // 2) x/y/scaleX/scaleY（来自调试编辑保存到 localStorage）
            if (config.xPercent !== undefined && config.yPercent !== undefined)
            {
                const rect = this.getEditRect();
                this.layoutManager.setPositionPercent(obj, config.xPercent, config.yPercent, rect);

                if (config.scalePercent !== undefined)
                {
                    this.layoutManager.setScalePercent(obj, config.scalePercent);
                }
                else if (config.scaleX !== undefined || config.scaleY !== undefined)
                {
                    obj.setScale(config.scaleX ?? obj.scaleX, config.scaleY ?? obj.scaleY);
                }

                return;
            }

            if (config.x !== undefined && config.y !== undefined)
            {
                obj.setPosition(config.x, config.y);
            }

            if (config.scaleX !== undefined || config.scaleY !== undefined)
            {
                obj.setScale(config.scaleX ?? obj.scaleX, config.scaleY ?? obj.scaleY);
            }
        });
    }

    setupDebugControls()
    {
        // 按 D 键切换调试模式
        this.keyDownDHandler = () =>
        {
            this.toggleDebugMode();
        };
        this.scene.input.keyboard.on('keydown-D', this.keyDownDHandler);

        // 方向键/缩放/保存
        this.keyDownHandler = (event) =>
        {
            if (!this.debugMode || !this.selectedObject)
            {
                return;
            }

            let moved = false;
            switch (event.key)
            {
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
                    if (event.ctrlKey || event.metaKey)
                    {
                        this.saveCurrentObjectConfig();
                    }
                    break;
            }

            if (moved)
            {
                this.updateObjectConfig();
            }
        };

        this.scene.input.keyboard.on('keydown', this.keyDownHandler);
    }

    // 给“可编辑小美术对象”注册像素级点击选择逻辑（用于调试模式）
    registerEditableObject(obj, options = {})
    {
        if (!obj || !obj.name)
        {
            return;
        }

        const useHandCursor = options.useHandCursor || false;
        const pixelPerfect = options.pixelPerfect ?? true;
        const alphaTolerance = options.alphaTolerance ?? 1;

        // pixelPerfect 会让点击更贴合贴图的非透明像素
        obj.setInteractive({
            pixelPerfect,
            alphaTolerance,
            useHandCursor
        });

        obj.on('pointerdown', () =>
        {
            if (!this.debugMode)
            {
                return;
            }
            this.selectObject(obj);
        });
    }

    onShutdown()
    {
        if (this.scene?.input?.keyboard && this.keyDownDHandler)
        {
            this.scene.input.keyboard.off('keydown-D', this.keyDownDHandler);
        }
        if (this.scene?.input?.keyboard && this.keyDownHandler)
        {
            this.scene.input.keyboard.off('keydown', this.keyDownHandler);
        }

        this.selectedObject = null;
        this.hideDebugUI();
    }

    toggleDebugMode()
    {
        this.debugMode = !this.debugMode;
        if (this.debugMode)
        {
            this.showDebugUI();
            console.log('调试模式已开启 - 点击对象选择，方向键移动，PageUp/PageDown缩放，Ctrl+S保存');
        }
        else
        {
            this.hideDebugUI();
            this.selectedObject = null;
            console.log('调试模式已关闭');
        }
    }

    selectObject(obj)
    {
        this.selectedObject = obj;
        this.updateDebugInfo();
        this.showSelectionIndicator();
    }

    showSelectionIndicator()
    {
        if (this.selectionBox)
        {
            this.selectionBox.destroy();
        }

        const bounds = this.selectedObject.getBounds();
        this.selectionBox = this.scene.add.graphics();
        this.selectionBox.lineStyle(2, 0xff0000);
        this.selectionBox.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    updateObjectConfig()
    {
        if (!this.selectedObject || !this.selectedObject.name)
        {
            return;
        }

        const obj = this.selectedObject;
        const name = obj.name;
        const target =
        {
            x: obj.x,
            y: obj.y,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY
        };

        if (this.sceneConfigKey)
        {
            if (!this.uiConfig[this.sceneConfigKey])
            {
                this.uiConfig[this.sceneConfigKey] = {};
            }
            this.uiConfig[this.sceneConfigKey][name] = target;
            this.sceneConfig = this.uiConfig[this.sceneConfigKey];
        }
        else
        {
            this.sceneConfig[name] = target;
            this.uiConfig = this.sceneConfig;
        }
    }

    saveCurrentObjectConfig()
    {
        this.updateObjectConfig();
        this.saveConfig();
        console.log('配置已保存:', this.uiConfig);
    }

    saveConfig()
    {
        localStorage.setItem('ui_config', JSON.stringify(this.uiConfig));
    }

    showDebugUI()
    {
        if (this.debugPanel)
        {
            return;
        }

        const info = '调试模式\n点击对象选择\n方向键移动 · PageUp/PageDown缩放\nCtrl+S保存';
        this.debugPanel = this.scene.add.text(10, 10, info, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#ff0000'
        }).setDepth(1000);
    }

    hideDebugUI()
    {
        if (this.debugPanel)
        {
            this.debugPanel.destroy();
            this.debugPanel = null;
        }

        if (this.selectionBox)
        {
            this.selectionBox.destroy();
            this.selectionBox = null;
        }

        if (this.objectInfo)
        {
            this.objectInfo.destroy();
            this.objectInfo = null;
        }
    }

    updateDebugInfo()
    {
        if (!this.selectedObject)
        {
            return;
        }

        if (this.objectInfo)
        {
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

