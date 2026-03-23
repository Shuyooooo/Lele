/**
 * Memory Rewrite Demo 2.0 — Desk 子场景
 * 负责：电脑输入验证（固定 1867）与过去线索查看
 */

import { LayoutManager } from '../utils/LayoutManager.js';
import { DebugManager } from '../utils/DebugManager.js';

export class DeskNowScene extends Phaser.Scene
{
    constructor()
    {
        super('DeskNow');
    }

    preload()
    {
        this.load.image('desk_bg', 'assets/NightBedroom/sub_scenes/desk_now_lighton.png');
        this.load.image('dn_text_1', 'assets/NightBedroom/sub_scenes/text_1.png');
        this.load.image('dn_text_2', 'assets/NightBedroom/sub_scenes/text_2.png');
    }

    create()
    {
        this.memory = this.registry.get('memory') || {
            unlocked: false,
            powerOn: true
        };
        if (typeof this.memory.powerOn !== 'boolean')
        {
            this.memory.powerOn = true;
        }
        this.registry.set('memory', this.memory);

        this.mode = 'present';

        this.presentBuffer = '';
        this.pastBuffer = '';

        this.computerModal = null;
        this.thoughtUi = null;

        this.noteExtra = null;
        this.hintText = null;

        this.lightSprite = null;
        this.coldOverlay = null;
        this.bgImage = null;
        this.computerHotzone = null;
        this.hotzonesConfig = null;
        this.textHotzone1 = null;
        this.textHotzone2 = null;
        this.powerOffHotzone = null;
        this.textModal1 = null;
        this.textModal2 = null;
        this.isTransitioning = false;

        const w = this.scale.width;
        const h = this.scale.height;

        this.bgImage = this.add.image(w * 0.5, h * 0.5, 'desk_bg');
        this.fitContain(this.bgImage, w * 1.0, h * 1.0);
        this.bgImage.name = 'background';
        this.bgImage.setInteractive({ useHandCursor: false });

        this.lightSprite = this.add.rectangle(
            w * 0.5,
            h * 0.45,
            w * 0.95,
            h * 0.95,
            0xffecd2,
            0.001
        );
        // 光源仅作为穿越热区，不再提供可见发光效果
        this.lightSprite.name = 'light';
        this.lightSprite.setInteractive({ useHandCursor: true });

        this.coldOverlay = this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x1a2844, this.memory.unlocked ? 0.12 : 0.45);
        this.coldOverlay.setDepth(1);
        this.enforceBaseLayerOrder();

        this.buildHintLine();

        const comp = this.add.rectangle(
            w * 0.52,
            h * 0.58,
            w * 0.20,
            h * 0.16,
            0x7ec8e3,
            0.001
        );
        comp.setDepth(2);
        comp.setInteractive({ useHandCursor: true });
        comp.name = 'computer';
        this.computerHotzone = comp;

        // 两个小文本热区（点击显示 text_1 / text_2 资源）
        this.textHotzone1 = this.add.rectangle(
            w * 0.30,
            h * 0.25,
            w * 0.08,
            h * 0.06,
            0x9ca3af,
            0.001
        );
        this.textHotzone1.setDepth(3);
        this.textHotzone1.setInteractive({ useHandCursor: true });
        this.textHotzone1.name = 'textHotzone1';

        this.textHotzone2 = this.add.rectangle(
            w * 0.42,
            h * 0.25,
            w * 0.08,
            h * 0.06,
            0x9ca3af,
            0.001
        );
        this.textHotzone2.setDepth(3);
        this.textHotzone2.setInteractive({ useHandCursor: true });
        this.textHotzone2.name = 'textHotzone2';

        this.powerOffHotzone = this.add.rectangle(
            w * 0.1,
            h * 0.08,
            w * 0.08,
            h * 0.08,
            0xfbbf24,
            0.001
        );
        this.powerOffHotzone.setDepth(3);
        this.powerOffHotzone.setInteractive({ useHandCursor: true });
        this.powerOffHotzone.name = 'powerOffHotzone';

        this._layoutManager = new LayoutManager(this);
        this._debugManager = new DebugManager(this, this._layoutManager, {
            editRectProvider: () =>
            {
                return {
                    x: 0,
                    y: 0,
                    width: this.scale.width,
                    height: this.scale.height
                };
            }
        });
        this._debugManager.registerEditableObject(this.bgImage, { useHandCursor: false, pixelPerfect: false });
        this._debugManager.registerEditableObject(this.lightSprite, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.registerEditableObject(comp, { useHandCursor: true });
        this._debugManager.registerEditableObject(this.textHotzone1, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.registerEditableObject(this.textHotzone2, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.registerEditableObject(this.powerOffHotzone, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.ready.then(() =>
        {
            this._debugManager.applyConfig();
            this.loadAndApplyHotzonesConfig();
        });

        comp.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            if (!this.isPuzzleEnabled())
            {
                return;
            }

            this.openComputerModal();
        });
        this.lightSprite.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            if (this.computerModal)
            {
                return;
            }
            this.gotoPast();
        });

        this.textHotzone1.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            if (!this.isPuzzleEnabled())
            {
                return;
            }

            this.openTextModal(1);
        });

        this.textHotzone2.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            if (!this.isPuzzleEnabled())
            {
                return;
            }

            this.openTextModal(2);
        });
        this.powerOffHotzone.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.turnPowerOff();
        });

        this._keyDownHandler = (evt) =>
        {
            this.onKeyDown(evt);
        };
        this.input.keyboard.on('keydown', this._keyDownHandler);

        this.events.on('shutdown', this.onShutdown, this);
        this.cameras.main.fadeIn(220, 0, 0, 0);

        if (this.memory.unlocked)
        {
            this.applyUnlockedLook();
        }
    }

    onShutdown()
    {
        if (this._keyDownHandler)
        {
            this.input.keyboard.off('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
    }

    getHotzonesDefaultUrl()
    {
        return new URL('../../hotzones.json', import.meta.url).href;
    }

    async loadHotzonesConfig()
    {
        const resp = await fetch(this.getHotzonesDefaultUrl(), { cache: 'no-store' });
        return await resp.json();
    }

    loadAndApplyHotzonesConfig()
    {
        this.loadHotzonesConfig()
            .then((cfg) =>
            {
                this.hotzonesConfig = cfg;
                this.applyHotzonesConfig(cfg);
            })
            .catch(() =>
            {
                // keep debug defaults
            });
    }

    applyHotzonesConfig(cfg)
    {
        if (!cfg || typeof cfg !== 'object')
        {
            return;
        }

        const deskNow = cfg.deskNow || cfg['deskNow'] || {};
        if (!this.computerHotzone)
        {
            return;
        }

        if (deskNow.computerHotzone)
        {
            const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
            this.applyZoneConfigFromPercents(this.computerHotzone, deskNow.computerHotzone, rect);
        }

        const lightCfg = deskNow.lightHotzone || deskNow.light;
        if (lightCfg && this.lightSprite)
        {
            const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
            this.applyZoneConfigFromPercents(this.lightSprite, lightCfg, rect);
        }

        if (deskNow.textHotzone1 && this.textHotzone1)
        {
            const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
            this.applyZoneConfigFromPercents(this.textHotzone1, deskNow.textHotzone1, rect);
        }

        if (deskNow.textHotzone2 && this.textHotzone2)
        {
            const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
            this.applyZoneConfigFromPercents(this.textHotzone2, deskNow.textHotzone2, rect);
        }

        if (deskNow.powerOffHotzone && this.powerOffHotzone)
        {
            const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
            this.applyZoneConfigFromPercents(this.powerOffHotzone, deskNow.powerOffHotzone, rect);
        }
    }

    applyZoneConfigFromPercents(zone, z, rect)
    {
        const rawXPercent = z.xPercent ?? 50;
        const rawYPercent = z.yPercent ?? 50;
        // 防止历史配置把热区保存到屏幕外
        const xPercent = Phaser.Math.Clamp(rawXPercent, 0, 100);
        const yPercent = Phaser.Math.Clamp(rawYPercent, 0, 100);
        const x = rect.x + rect.width * (xPercent / 100);
        const y = rect.y + rect.height * (yPercent / 100);
        zone.setPosition(x, y);

        const scaleXPercent = z.scaleXPercent ?? z.scalePercent ?? 100;
        const scaleYPercent = z.scaleYPercent ?? z.scalePercent ?? 100;
        zone.setScale(scaleXPercent / 100, scaleYPercent / 100);
    }

    async exportHotzonesConfigToDownloadAndStorage()
    {
        if (!this.computerHotzone)
        {
            return;
        }

        const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };

        const zoneToConfig = (zone) =>
        {
            return {
                xPercent: ((zone.x - rect.x) / rect.width) * 100,
                yPercent: ((zone.y - rect.y) / rect.height) * 100,
                scaleXPercent: zone.scaleX * 100,
                scaleYPercent: zone.scaleY * 100
            };
        };

        const data = await this.loadHotzonesConfig();
        data.deskNow = data.deskNow || {};
        data.deskNow.computerHotzone = zoneToConfig(this.computerHotzone);
        data.deskNow.lightHotzone = this.lightSprite ? zoneToConfig(this.lightSprite) : null;
        data.deskNow.textHotzone1 = this.textHotzone1 ? zoneToConfig(this.textHotzone1) : null;
        data.deskNow.textHotzone2 = this.textHotzone2 ? zoneToConfig(this.textHotzone2) : null;
        data.deskNow.powerOffHotzone = this.powerOffHotzone ? zoneToConfig(this.powerOffHotzone) : null;

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hotzones.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    fitContain(img, mw, mh)
    {
        const s = Math.min(mw / img.width, mh / img.height);
        img.setScale(s);
    }

    enforceBaseLayerOrder()
    {
        if (this.bgImage)
        {
            this.bgImage.setDepth(0);
        }
        if (this.lightSprite)
        {
            // 固定灯光层在背景之上、遮罩之下，避免切场景后漂到最上层
            this.lightSprite.setDepth(0.5);
        }
        if (this.coldOverlay)
        {
            this.coldOverlay.setDepth(1);
        }
    }

    buildStickyNote()
    {
        const w = this.scale.width;
        const h = this.scale.height;
        const nx = w * 0.18;
        const ny = h * 0.28;

        const g = this.add.graphics();
        g.fillStyle(0xfff8dc, 1);
        g.lineStyle(2, 0xc4a574, 1);
        g.fillRoundedRect(nx - 70, ny - 55, 140, 110, 6);
        g.strokeRoundedRect(nx - 70, ny - 55, 140, 110, 6);
        g.setDepth(3);

        this.add.text(nx, ny - 28, '门禁备忘', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            color: '#5c4a3a'
        }).setOrigin(0.5).setDepth(4);

        this.add.text(nx, ny - 2, '线索指向', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#2a1810',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4);

        this.add.text(nx, ny + 28, '需要 4 位密码', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '12px',
            color: '#7a6655'
        }).setOrigin(0.5).setDepth(4);

        this.noteExtra = this.add.text(nx, ny + 48, '', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '11px',
            color: '#3d7a4a'
        }).setOrigin(0.5).setDepth(4);

        if (this.memory.unlocked)
        {
            this.noteExtra.setText('已同步 · 笔迹加深');
        }
    }

    buildHintLine()
    {
        this.hintText = null;
    }

    openComputerModal()
    {
        if (this.mode !== 'present')
        {
            return;
        }
        if (!this.isPuzzleEnabled())
        {
            return;
        }
        if (this.computerModal)
        {
            return;
        }

        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(w * 0.5, h * 0.5);
        c.setDepth(20);

        const panel = this.add.rectangle(0, 0, w * 0.72, h * 0.62, 0x0d1118, 0.94);
        panel.setStrokeStyle(2, 0x3d5a80);
        panel.setInteractive({ useHandCursor: false });
        panel.on('pointerdown', () =>
        {
            // 捕获点击，避免点穿到底层灯泡热区
        });
        c.add(panel);
        const closeBtn = this.add.text(panel.width * 0.5 - 26, -panel.height * 0.5 + 24, 'x', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '30px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 9, y: 1 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () =>
        {
            this.closeComputerModal();
        });
        c.add(closeBtn);

        if (this.memory.unlocked)
        {
            this.buildUnlockedPanel(c);
            this.computerModal = c;
            return;
        }

        const title = this.add.text(0, -h * 0.22, '终端锁定 · 请输入 4 位密码', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '22px',
            color: '#e8eef8'
        }).setOrigin(0.5);
        c.add(title);

        const disp = this.add.text(0, -h * 0.05, this.formatFourDashSlots(''), {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#7ec8e3',
            letterSpacing: 8
        }).setOrigin(0.5);
        c.add(disp);

        const msg = this.add.text(0, h * 0.06, '', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            color: '#ff8888'
        }).setOrigin(0.5);
        c.add(msg);

        const btnLogin = this.makeButton(0, h * 0.20, '登录', () =>
        {
            this.tryUnlockPresent();
        });
        c.add(btnLogin);

        this.presentBuffer = '';
        this.computerModal = c;

        this.modalDisp = disp;
        this.modalMsg = msg;
        this.modalPanel = panel;
    }

    buildUnlockedPanel(c)
    {
        const h = this.scale.height;
        const title = this.add.text(0, -h * 0.18, '欢迎回来 · 记录已同步', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '24px',
            color: '#9dffb4'
        }).setOrigin(0.5);
        c.add(title);

        const body = this.add.text(0, h * 0.02, '本地会话已验证。\当前终端已解锁。', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '16px',
            color: '#c8e6d8',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);
        c.add(body);

    }

    makeButton(x, y, label, onClick)
    {
        const t = this.add.text(x, y, label, {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '16px',
            color: '#dde8ff',
            backgroundColor: '#2a3f5f',
            padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        t.on('pointerover', () =>
        {
            t.setStyle({ backgroundColor: '#3d5a8a' });
        });
        t.on('pointerout', () =>
        {
            t.setStyle({ backgroundColor: '#2a3f5f' });
        });
        t.on('pointerdown', onClick);
        return t;
    }

    formatFourDashSlots(buf)
    {
        const chars = buf.split('');
        while (chars.length < 4)
        {
            chars.push('-');
        }
        return chars.slice(0, 4).join(' ');
    }

    closeComputerModal()
    {
        if (!this.computerModal)
        {
            return;
        }

        this.computerModal.destroy(true);
        this.computerModal = null;
        this.modalDisp = null;
        this.modalMsg = null;
        this.modalPanel = null;
    }

    closeTextModal()
    {
        if (this.textModal1)
        {
            this.textModal1.destroy(true);
            this.textModal1 = null;
        }

        if (this.textModal2)
        {
            this.textModal2.destroy(true);
            this.textModal2 = null;
        }
    }

    openTextModal(index)
    {
        if (index === 1)
        {
            if (this.textModal1)
            {
                this.closeTextModal();
                return;
            }
        }

        if (index === 2)
        {
            if (this.textModal2)
            {
                this.closeTextModal();
                return;
            }
        }

        this.closeTextModal();

        const textureKey = index === 1 ? 'dn_text_1' : 'dn_text_2';
        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(w * 0.5, h * 0.5);
        c.setDepth(30);

        const img = this.add.image(0, 0, textureKey);
        img.setOrigin(0.5);
        // 按你的要求固定显示为 1280 * 960
        img.setDisplaySize(1280, 960);
        img.setInteractive({ useHandCursor: false });
        img.on('pointerdown', () =>
        {
            // 捕获点击，避免点穿
        });
        c.add(img);

        const closeBtn = this.add.text(620, -450, 'x', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '42px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 12, y: 2 }
        }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () =>
        {
            this.closeTextModal();
        });
        c.add(closeBtn);

        if (index === 1)
        {
            this.textModal1 = c;
        }
        else
        {
            this.textModal2 = c;
        }
    }

    onKeyDown(evt)
    {
        const k = evt.key;
        const debugMode = this._debugManager?.debugMode;
        const key = (k || '').toUpperCase();

        if (debugMode)
        {
            // 按 S 导出/持久化 deskNow 的 computer 热区数据（不使用 Ctrl/Meta）
            if (key === 'S' && !evt.ctrlKey && !evt.metaKey)
            {
                this.exportHotzonesConfigToDownloadAndStorage();
                return;
            }

            // 调试模式下，只允许 Esc，让其保持关闭弹窗/退出输入框逻辑
            if (k !== 'Escape')
            {
                return;
            }
        }

        if (k === 'Escape')
        {
            if (this.mode === 'past' && this.thoughtUi)
            {
                this.pastBuffer = '';
                if (this.pastSlots)
                {
                    this.pastSlots.setText(this.formatFourSlots(''));
                }
                if (this.pastTip)
                {
                    this.pastTip.setText('已清空 · 输入后按 Enter 确认');
                    this.pastTip.setColor('#94a3b8');
                }
                return;
            }

            if (this.computerModal)
            {
                this.closeComputerModal();
            }

            this.closeTextModal();
            return;
        }

        if (this.mode === 'present' && this.computerModal && !this.memory.unlocked)
        {
            if (!this.isPuzzleEnabled())
            {
                return;
            }
            this.handlePresentKeys(k);
            return;
        }

        if (this.mode === 'past' && this.thoughtUi)
        {
            this.handlePastKeys(k);
            return;
        }
    }

    handlePresentKeys(k)
    {
        if (k === 'Backspace')
        {
            this.presentBuffer = this.presentBuffer.slice(0, -1);
            this.refreshPresentModal();
            return;
        }

        if (k === 'Enter')
        {
            return;
        }

        const ch = this.normalizePassChar(k);
        if (ch)
        {
            this.presentBuffer += ch;
            this.refreshPresentModal();
        }
    }

    normalizePassChar(k)
    {
        if (k.length !== 1)
        {
            return null;
        }

        if (/^[0-9]$/.test(k))
        {
            return k;
        }

        if (/^[a-zA-Z]$/.test(k))
        {
            return k.toUpperCase();
        }

        return null;
    }

    refreshPresentModal()
    {
        if (this.modalDisp)
        {
            this.modalDisp.setText(this.formatFourDashSlots(this.presentBuffer));
        }
        if (this.modalMsg)
        {
            this.modalMsg.setText('');
            this.modalMsg.setColor('#ff8888');
        }
    }

    tryUnlockPresent()
    {
        if (!this.isPuzzleEnabled())
        {
            return;
        }
        const need = '1867';

        if (this.presentBuffer.length !== 4)
        {
            if (this.modalMsg)
            {
                this.modalMsg.setText('请输入完整 4 位。');
                this.modalMsg.setColor('#ff8888');
            }
            return;
        }

        const ok = this.presentBuffer === need;

        if (ok)
        {
            if (this.modalMsg)
            {
                this.modalMsg.setText('');
            }

            this.memory.unlocked = true;
            this.registry.set('memory', this.memory);

            this.flashSuccess();
            this.closeComputerModal();
            this.openComputerModal();
            this.applyUnlockedLook();
        }
        else
        {
            if (this.modalMsg)
            {
                this.modalMsg.setText('验证失败 · 密码错误');
                this.modalMsg.setColor('#ff8888');
            }
            this.shakeModal();
        }
    }

    shakeModal()
    {
        if (!this.computerModal)
        {
            return;
        }

        const c = this.computerModal;
        this.tweens.add({
            targets: c,
            x: c.x + 12,
            duration: 40,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut'
        });
    }

    flashSuccess()
    {
        const cam = this.cameras.main;
        cam.flash(200, 240, 250, 255, true);
        this.time.delayedCall(90, () =>
        {
            cam.shake(140, 0.0035);
        });
    }

    applyUnlockedLook()
    {
        this.enforceBaseLayerOrder();
        this.tweens.add({
            targets: this.coldOverlay,
            alpha: 0.08,
            duration: 900,
            ease: 'Sine.easeOut',
            onComplete: () =>
            {
                this.coldOverlay.setFillStyle(0xffecd2, 0.12);
            }
        });

        if (this.noteExtra)
        {
            this.noteExtra.setText('已同步 · 笔迹加深');
        }
        if (this.hintText)
        {
            this.hintText.setText('记录已写入桌面  ·  可再次点击电脑查看');
        }
    }

    gotoPast()
    {
        if (!this.isPuzzleEnabled())
        {
            return;
        }
        this.closeComputerModal();
        this.transitionWithFade(() =>
        {
            this.scene.stop('DeskNow');
            this.scene.launch('MemoryBedroom');
        });
    }

    buildThoughtUi()
    {
        if (this.thoughtUi)
        {
            this.thoughtUi.destroy(true);
        }

        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(w * 0.5, h * 0.42);
        c.setDepth(25);

        const bubble = this.add.graphics();
        bubble.fillStyle(0xf5f8ff, 0.92);
        bubble.lineStyle(3, 0x8899bb, 1);
        const bw = w * 0.55;
        const bh = h * 0.32;
        bubble.fillRoundedRect(-bw * 0.5, -bh * 0.5, bw, bh, 28);
        bubble.strokeRoundedRect(-bw * 0.5, -bh * 0.5, bw, bh, 28);
        bubble.fillTriangle(-40, bh * 0.5, 40, bh * 0.5, 0, bh * 0.5 + 36);
        c.add(bubble);

        const title = this.add.text(0, -bh * 0.32, '输入一段过去线索', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '17px',
            color: '#334155'
        }).setOrigin(0.5);
        c.add(title);

        const sub = this.add.text(0, -bh * 0.14, '4位（数字）', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            color: '#64748b'
        }).setOrigin(0.5);
        c.add(sub);

        const slots = this.add.text(0, bh * 0.02, this.formatFourSlots(''), {
            fontFamily: 'monospace',
            fontSize: '40px',
            color: '#2563eb',
            letterSpacing: 14
        }).setOrigin(0.5);
        c.add(slots);

        const tip = this.add.text(0, bh * 0.22, 'Enter 确认并回到现在  ·  Esc 仅清空', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '12px',
            color: '#94a3b8'
        }).setOrigin(0.5);
        c.add(tip);

        this.thoughtUi = c;
        this.pastSlots = slots;
        this.pastTip = tip;
    }

    formatFourSlots(buf)
    {
        const chars = buf.split('');
        while (chars.length < 4)
        {
            chars.push('·');
        }
        return chars.slice(0, 4).join(' ');
    }

    handlePastKeys(k)
    {
        if (k === 'Backspace')
        {
            this.pastBuffer = this.pastBuffer.slice(0, -1);
            if (this.pastSlots)
            {
                this.pastSlots.setText(this.formatFourSlots(this.pastBuffer));
            }
            return;
        }

        if (k === 'Enter')
        {
            this.submitPast();
            return;
        }

        if (this.pastBuffer.length >= 4)
        {
            return;
        }

        if (/^[0-9]$/.test(k))
        {
            this.pastBuffer += k;
            if (this.pastSlots)
            {
                this.pastSlots.setText(this.formatFourSlots(this.pastBuffer));
            }
        }
    }

    submitPast()
    {
        if (this.pastBuffer.length !== 4)
        {
            if (this.pastTip)
            {
                this.pastTip.setText('请输满 4 位数字后再确认');
                this.pastTip.setColor('#dc2626');
            }
            return;
        }

        const cam = this.cameras.main;
        cam.fadeOut(260, 0, 0, 0);
        this.time.delayedCall(280, () =>
        {
            if (this.thoughtUi)
            {
                this.thoughtUi.destroy(true);
                this.thoughtUi = null;
                this.pastSlots = null;
                this.pastTip = null;
            }

            this.mode = 'present';

            this.tweens.add({
                targets: this.coldOverlay,
                alpha: this.memory.unlocked ? 0.12 : 0.45,
                duration: 250,
                ease: 'Sine.easeOut',
                onComplete: () =>
                {
                    if (this.memory.unlocked)
                    {
                        this.coldOverlay.setFillStyle(0xffecd2, 0.14);
                    }
                    else
                    {
                        this.coldOverlay.setFillStyle(0x1a2844, 0.45);
                    }
                }
            });

            cam.fadeIn(300, 0, 0, 0);
            this.showReturnToast();
        });
    }

    isPuzzleEnabled()
    {
        return this.memory?.powerOn === true;
    }

    turnPowerOff()
    {
        this.closeComputerModal();
        this.closeTextModal();
        this.memory.powerOn = false;
        this.registry.set('memory', this.memory);
        this.transitionWithFade(() =>
        {
            this.scene.stop('DeskNow');
            this.scene.launch('DeskNowLightOff');
        });
    }

    transitionWithFade(action)
    {
        if (this.isTransitioning)
        {
            return;
        }

        this.isTransitioning = true;
        const cam = this.cameras.main;
        cam.fadeOut(240, 0, 0, 0);
        this.time.delayedCall(260, () =>
        {
            action();
        });
    }

    showReturnToast()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        const t = this.add.text(w * 0.5, h * 0.12, '已回到现在 · 请输入正确 4 位密码', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            color: '#e0e8ff',
            backgroundColor: 'rgba(20,30,50,0.75)',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        this.tweens.add({
            targets: t,
            alpha: 1,
            duration: 220,
            yoyo: false
        });
        this.time.delayedCall(3200, () =>
        {
            this.tweens.add({
                targets: t,
                alpha: 0,
                duration: 400,
                onComplete: () =>
                {
                    t.destroy();
                }
            });
        });
    }
}

