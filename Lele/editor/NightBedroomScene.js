/**
 * Memory Rewrite Demo 2.0 — Present / Past 闭环
 * 资源：assets/NightBedroom；缺省 UI 用 Graphics/Text 绘制
 */

import { LayoutManager } from '../utils/LayoutManager.js';
import { DebugManager } from '../utils/DebugManager.js';

export class NightBedroomScene extends Phaser.Scene
{
    constructor()
    {
        super('NightBedroom');
    }

    preload()
    {
        this.load.image('nb_bg', 'assets/NightBedroom/bg.png');
        this.load.image('nb_desk_past', 'assets/NightBedroom/sub_scenes/desk_now_lighton.png');
    }

    create()
    {
        this.mode = 'present';
        this.memory = this.registry.get('memory') || { tail4: '', unlocked: false };
        this.registry.set('memory', this.memory);

        this.presentBuffer = '';
        this.pastBuffer = '';
        this.computerModal = null;
        this.thoughtUi = null;
        this.hintText = null;
        this.noteExtra = null;
        this.lightSprite = null;
        this.coldOverlay = null;
        this.bgImage = null;
        this.deskHotzone = null;
        this.hotzonesConfig = null;

        const w = this.scale.width;
        const h = this.scale.height;
        this.sidebarWidth = 260;
        this.playArea = {
            x: 0,
            y: 0,
            width: w - this.sidebarWidth,
            height: h
        };
        this.playCenterX = this.playArea.x + this.playArea.width * 0.5;

        this.drawRightSidebar();

        this.bgImage = this.add.image(this.playCenterX, h * 0.5, 'nb_bg');
        this.fitCover(this.bgImage, this.playArea.width, this.playArea.height);
        this.bgImage.name = 'background';
        this.bgImage.setInteractive({ useHandCursor: false });

        // Night 场景不再叠加额外灯光层，避免影响原图观感
        this.lightSprite = null;

        if (this.memory.unlocked)
        {
            this.coldOverlay = this.add.rectangle(this.playCenterX, h * 0.5, this.playArea.width, this.playArea.height, 0xffecd2, 0.14);
        }
        else
        {
            this.coldOverlay = this.add.rectangle(this.playCenterX, h * 0.5, this.playArea.width, this.playArea.height, 0x1a2844, 0.45);
        }
        this.coldOverlay.setDepth(1);

        // “桌子”热区：点击进入 DeskNow
        this.deskHotzone = this.add.rectangle(
            this.playArea.x + this.playArea.width * 0.53,
            h * 0.6,
            this.playArea.width * 0.34,
            h * 0.25,
            0x93c5fd,
            0.001
        );
        this.deskHotzone.setDepth(10);
        this.deskHotzone.setInteractive({ useHandCursor: true });
        this.deskHotzone.name = 'deskHotzone';

        this.deskHotzone.on('pointerover', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.deskHotzone.setFillStyle(0x93c5fd, 0.08);
        });
        this.deskHotzone.on('pointerout', () =>
        {
            this.deskHotzone.setFillStyle(0x93c5fd, 0.001);
        });
        this.deskHotzone.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.openDeskNow();
        });

        this._layoutManager = new LayoutManager(this);
        this._debugManager = new DebugManager(this, this._layoutManager, {
            editRectProvider: () => this.playArea
        });
        // 只把热区注册为可编辑对象：D 模式仅调整热区
        this._debugManager.registerEditableObject(this.deskHotzone, { useHandCursor: true, pixelPerfect: false });

        this._debugManager.ready.then(() =>
        {
            this._debugManager.applyConfig();
            this.loadAndApplyHotzonesConfig();
        });

        this._keyDownHandler = (evt) =>
        {
            this.onKeyDown(evt);
        };
        this.input.keyboard.on('keydown', this._keyDownHandler);
        this.events.on('shutdown', this.onShutdown, this);

        if (this.memory.unlocked)
        {
            this.applyUnlockedLook();
        }

        this.events.on('resume', this.onRoomResume, this);
    }

    onRoomResume()
    {
        this.memory = this.registry.get('memory') || this.memory;
        if (this.memory.unlocked)
        {
            this.applyUnlockedLook();
        }
    }

    openDeskNow()
    {
        this.scene.launch('DeskNow');
        this.scene.pause('NightBedroom');
    }

    onShutdown()
    {
        if (this._keyDownHandler)
        {
            this.input.keyboard.off('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
    }

    getHotzonesStorageKey()
    {
        return 'hotzones';
    }

    getHotzonesDefaultUrl()
    {
        return new URL('../../hotzones.json', import.meta.url).href;
    }

    async loadHotzonesConfig()
    {
        const key = this.getHotzonesStorageKey();
        const saved = localStorage.getItem(key);
        if (saved)
        {
            try
            {
                return JSON.parse(saved);
            }
            catch (e)
            {
                // ignore
            }
        }

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
                // 如果默认/本地配置加载失败，则保留调试默认（来自 ui_config）
            });
    }

    applyHotzonesConfig(cfg)
    {
        if (!cfg || typeof cfg !== 'object')
        {
            return;
        }

        const night = cfg.nightBedroom || cfg['nightBedroom'] || {};

        if (this.deskHotzone && night.deskHotzone)
        {
            this.applyZoneConfigFromPercents(this.deskHotzone, night.deskHotzone);
        }

    }

    applyZoneConfigFromPercents(zone, z)
    {
        const rect = this.playArea;
        const xPercent = z.xPercent ?? 50;
        const yPercent = z.yPercent ?? 50;
        const x = rect.x + rect.width * (xPercent / 100);
        const y = rect.y + rect.height * (yPercent / 100);
        zone.setPosition(x, y);

        const scaleXPercent = z.scaleXPercent ?? z.scalePercent ?? 100;
        const scaleYPercent = z.scaleYPercent ?? z.scalePercent ?? 100;
        zone.setScale(scaleXPercent / 100, scaleYPercent / 100);
    }

    async exportHotzonesConfigToDownloadAndStorage()
    {
        const rect = this.playArea;

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
        data.nightBedroom = data.nightBedroom || {};
        data.nightBedroom.deskHotzone = this.deskHotzone ? zoneToConfig(this.deskHotzone) : null;

        // 持久化到 localStorage，方便刷新后立刻生效
        localStorage.setItem(this.getHotzonesStorageKey(), JSON.stringify(data));

        // 也导出文件，方便你复制回项目里的 `Lele/hotzones.json`
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

    fitCover(img, tw, th)
    {
        const s = Math.max(tw / img.width, th / img.height);
        img.setScale(s);
    }

    fitContain(img, mw, mh)
    {
        const s = Math.min(mw / img.width, mh / img.height);
        img.setScale(s);
    }

    drawRightSidebar()
    {
        const w = this.scale.width;
        const h = this.scale.height;
        const x = this.playArea.width;

        const panel = this.add.rectangle(x + this.sidebarWidth * 0.5, h * 0.5, this.sidebarWidth, h, 0x0a111f, 0.95);
        panel.setDepth(6);
        panel.setStrokeStyle(2, 0x2c3f5f, 0.9);

        this.add.text(x + this.sidebarWidth * 0.5, h * 0.08, '背包预留区', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '17px',
            color: '#9fb6d9'
        }).setOrigin(0.5).setDepth(7);
    }

    buildStickyNote(w, h)
    {
        const nx = this.playArea.width * 0.16;
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

        this.add.text(nx, ny - 2, '我记得是', {
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

    buildHintLine(w, h)
    {
        this.hintText = this.add.text(this.playCenterX, h * 0.94, '点击电脑打开界面  ·  键盘输入密码', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            color: '#aabbdd'
        }).setOrigin(0.5).setDepth(5).setAlpha(0.85);
    }

    openComputerModal()
    {
        if (this.mode !== 'present')
        {
            return;
        }
        if (this.computerModal)
        {
            return;
        }

        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(this.playCenterX, h * 0.5);
        c.setDepth(20);

        const panel = this.add.rectangle(0, 0, w * 0.72, h * 0.62, 0x0d1118, 0.94);
        panel.setStrokeStyle(2, 0x3d5a80);
        c.add(panel);

        if (this.memory.unlocked)
        {
            this.buildUnlockedPanel(c);
            this.computerModal = c;
            return;
        }

        const title = this.add.text(0, -h * 0.22, '终端锁定 · 需要 4 位密码', {
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

        const btnThink = this.makeButton(0, h * 0.16, '○ 回忆（进入过去）', () =>
        {
            this.closeComputerModal();
            this.gotoPast();
        });
        c.add(btnThink);

        const btnClose = this.makeButton(0, h * 0.24, '关闭', () => this.closeComputerModal());
        c.add(btnClose);

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

        const body = this.add.text(0, h * 0.02, '本地会话已验证。\n灯光与备忘已按你的记忆更新。', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '16px',
            color: '#c8e6d8',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);
        c.add(body);

        const btn = this.makeButton(0, h * 0.22, '关闭', () => this.closeComputerModal());
        c.add(btn);
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

        t.on('pointerover', () => t.setStyle({ backgroundColor: '#3d5a8a' }));
        t.on('pointerout', () => t.setStyle({ backgroundColor: '#2a3f5f' }));
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
        if (this.computerModal)
        {
            this.computerModal.destroy(true);
            this.computerModal = null;
            this.modalDisp = null;
            this.modalMsg = null;
            this.modalPanel = null;
        }
    }

    onKeyDown(evt)
    {
        const debugMode = this._debugManager?.debugMode;
        const key = (evt.key || '').toUpperCase();

        if (debugMode)
        {
            // 按 S 导出/持久化热区数据（不使用 Ctrl/Meta）
            if (key === 'S' && !evt.ctrlKey && !evt.metaKey)
            {
                this.exportHotzonesConfigToDownloadAndStorage();
                return;
            }

            // 调试模式下阻断密码输入，避免误触把热区调试当作输入
            if (evt.key !== 'Escape')
            {
                return;
            }
        }

        if (evt.key === 'Escape')
        {
            if (this.computerModal)
            {
                this.closeComputerModal();
            }
            return;
        }

        if (this.mode === 'present' && this.computerModal && !this.memory.unlocked)
        {
            this.handlePresentKeys(evt);
        }
        else if (this.mode === 'past' && this.thoughtUi)
        {
            this.handlePastKeys(evt);
        }
    }

    handlePresentKeys(evt)
    {
        const k = evt.key;
        if (k === 'Backspace')
        {
            this.presentBuffer = this.presentBuffer.slice(0, -1);
            this.refreshPresentModal();
            return;
        }
        if (k === 'Enter')
        {
            this.tryUnlockPresent();
            return;
        }
        if (this.presentBuffer.length >= 4)
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
        if (k.length === 1)
        {
            if (/^[0-9]$/.test(k))
            {
                return k;
            }
            if (/^[a-zA-Z]$/.test(k))
            {
                return k.toUpperCase();
            }
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
        }
    }

    tryUnlockPresent()
    {
        const need = this.memory.tail4 || '';

        if (this.presentBuffer.length !== 4)
        {
            if (this.modalMsg)
            {
                this.modalMsg.setText('请输入完整 4 位。');
                this.modalMsg.setColor('#ff8888');
            }
            return;
        }

        const ok = need.length === 4 && this.presentBuffer === need;
        if (ok)
        {
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
                this.modalMsg.setText('验证失败 · 你的记忆不一致');
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
        if (this.lightSprite)
        {
            this.tweens.add({
                targets: this.lightSprite,
                alpha: 0.72,
                duration: 900,
                ease: 'Sine.easeOut'
            });
        }
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
            this.hintText.setText('记录已写入现在  ·  可再次点击电脑查看');
        }
    }

    gotoPast()
    {
        this.closeComputerModal();
        const cam = this.cameras.main;
        cam.fadeOut(280, 0, 0, 0);
        this.time.delayedCall(300, () =>
        {
            this.mode = 'past';
            this.bgImage.setTexture('nb_desk_past');
            this.fitCover(this.bgImage, this.playArea.width, this.playArea.height);
            this.pastBuffer = '';
            this.buildThoughtUi();
            cam.fadeIn(320, 0, 0, 0);
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
        const c = this.add.container(this.playCenterX, h * 0.42);
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

        const title = this.add.text(0, -bh * 0.32, '写下一段会留在记忆里的记录', {
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

    handlePastKeys(evt)
    {
        const k = evt.key;
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
        this.memory.tail4 = this.pastBuffer;
        this.registry.set('memory', this.memory);

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
            this.bgImage.setTexture('nb_bg');
            this.fitCover(this.bgImage, this.playArea.width, this.playArea.height);
            cam.fadeIn(300, 0, 0, 0);
            this.showReturnToast();
        });
    }

    showReturnToast()
    {
        const w = this.scale.width;
        const t = this.add.text(this.playCenterX, this.scale.height * 0.12, '已回到现在 · 4位不会显示，请凭记忆输入电脑', {
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
                onComplete: () => t.destroy()
            });
        });
    }
}
