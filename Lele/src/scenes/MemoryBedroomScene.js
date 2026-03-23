/**
 * Memory Rewrite Demo 2.0 — Past 管理主场景
 * 背景：assets/MemoryBedroom/bg.png
 * 目的：点击桌子进入 desk_past 子场景（DeskPastScene）
 */

import { LayoutManager } from '../utils/LayoutManager.js';
import { DebugManager } from '../utils/DebugManager.js';

export class MemoryBedroomScene extends Phaser.Scene
{
    constructor()
    {
        super('MemoryBedroom');
    }

    preload()
    {
        this.load.image('mb_bg', 'assets/MemoryBedroom/bg.png');
        this.load.image('mb_desk_past', 'assets/MemoryBedroom/Desk/desk_past.png');
    }

    create()
    {
        this.mode = 'past';
        this.memory = this.registry.get('memory') || { tail4: '', unlocked: false };
        this.registry.set('memory', this.memory);
        this.deskZone = null;
        this.hotzonesConfig = null;
        this.resetModal = null;
        this.resetSlots = null;
        this.resetTip = null;
        this.resetBuffer = '';

        const w = this.scale.width;
        const h = this.scale.height;

        this.bgImage = this.add.image(w * 0.5, h * 0.5, 'mb_bg');
        this.fitContain(this.bgImage, w, h);
        this.bgImage.name = 'background';
        this.bgImage.setInteractive({ useHandCursor: false });

        // 保险处理：进入 MemoryBedroom 后不允许 DeskNow 仍在下层显示
        if (this.scene.isActive('DeskNow'))
        {
            this.scene.stop('DeskNow');
        }

        this.deskZone = this.add.rectangle(w * 0.53, h * 0.6, w * 0.34, h * 0.25, 0x93c5fd, 0.08);
        this.deskZone.setDepth(10);
        this.deskZone.setInteractive({ useHandCursor: true });
        this.deskZone.name = 'deskHotzone';
        this.deskZone.on('pointerover', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.deskZone.setFillStyle(0x93c5fd, 0.16);
        });
        this.deskZone.on('pointerout', () =>
        {
            this.deskZone.setFillStyle(0x93c5fd, 0.08);
        });
        this.deskZone.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.gotoDeskPast();
        });

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
        this._debugManager.registerEditableObject(this.deskZone, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.ready.then(() =>
        {
            this._debugManager.applyConfig();
            this.loadAndApplyHotzonesConfig();
        });

        this.buildTopReturnArrow();

        this.statusText = this.add.text(w * 0.5, h * 0.88, '', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            color: '#e0e8ff'
        }).setOrigin(0.5).setDepth(12);

        this.syncStatus();
        this.events.on('resume', this.onResume, this);

        this._keyDownHandler = (evt) =>
        {
            this.onKeyDown(evt);
        };
        this.input.keyboard.on('keydown', this._keyDownHandler);
        this.events.on('shutdown', this.onShutdown, this);
    }

    onResume()
    {
        this.memory = this.registry.get('memory') || this.memory;
        this.syncStatus();
    }

    syncStatus()
    {
        if (this.memory.tail4 && this.memory.tail4.length === 4)
        {
            this.statusText.setText('重置成功 · 回到现在验证');
            this.statusText.setColor('#a7f3d0');
            this.statusText.setAlpha(1);
        }
        else
        {
            this.statusText.setText('点击桌子进入「过去」重置记忆');
            this.statusText.setColor('#aabbd9');
            this.statusText.setAlpha(0.95);
        }
    }

    fitContain(img, mw, mh)
    {
        const s = Math.min(mw / img.width, mh / img.height);
        img.setScale(s);
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
                // keep debug defaults
            });
    }

    applyHotzonesConfig(cfg)
    {
        if (!cfg || typeof cfg !== 'object' || !this.deskZone)
        {
            return;
        }

        const mb = cfg.memoryBedroom || cfg['memoryBedroom'] || {};
        if (!mb.deskHotzone)
        {
            return;
        }

        const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
        const rawXPercent = mb.deskHotzone.xPercent ?? 50;
        const rawYPercent = mb.deskHotzone.yPercent ?? 50;
        const xPercent = Phaser.Math.Clamp(rawXPercent, 0, 100);
        const yPercent = Phaser.Math.Clamp(rawYPercent, 0, 100);
        const x = rect.x + rect.width * (xPercent / 100);
        const y = rect.y + rect.height * (yPercent / 100);
        this.deskZone.setPosition(x, y);

        const scaleXPercent = mb.deskHotzone.scaleXPercent ?? mb.deskHotzone.scalePercent ?? 100;
        const scaleYPercent = mb.deskHotzone.scaleYPercent ?? mb.deskHotzone.scalePercent ?? 100;
        this.deskZone.setScale(scaleXPercent / 100, scaleYPercent / 100);
    }

    async exportHotzonesConfigToDownloadAndStorage()
    {
        if (!this.deskZone)
        {
            return;
        }

        const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
        const data = await this.loadHotzonesConfig();
        data.memoryBedroom = data.memoryBedroom || {};
        data.memoryBedroom.deskHotzone = {
            xPercent: ((this.deskZone.x - rect.x) / rect.width) * 100,
            yPercent: ((this.deskZone.y - rect.y) / rect.height) * 100,
            scaleXPercent: this.deskZone.scaleX * 100,
            scaleYPercent: this.deskZone.scaleY * 100
        };

        localStorage.setItem(this.getHotzonesStorageKey(), JSON.stringify(data));

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

    openResetModal()
    {
        if (this.resetModal)
        {
            return;
        }

        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(w * 0.5, h * 0.5);
        c.setDepth(40);

        const mask = this.add.rectangle(0, 0, w, h, 0x000000, 0.45);
        mask.setInteractive({ useHandCursor: false });
        c.add(mask);

        const panel = this.add.rectangle(0, 0, w * 0.64, h * 0.56, 0x0d1118, 0.95);
        panel.setStrokeStyle(2, 0x3d5a80);
        c.add(panel);

        const title = this.add.text(0, -h * 0.17, '重置记忆记录（4位数字）', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '24px',
            color: '#e8eef8'
        }).setOrigin(0.5);
        c.add(title);

        this.resetBuffer = '';
        this.resetSlots = this.add.text(0, -h * 0.04, this.formatFourSlots(''), {
            fontFamily: 'monospace',
            fontSize: '40px',
            color: '#7ec8e3',
            letterSpacing: 12
        }).setOrigin(0.5);
        c.add(this.resetSlots);

        this.resetTip = this.add.text(0, h * 0.08, '', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            color: '#94a3b8'
        }).setOrigin(0.5);
        c.add(this.resetTip);

        const resetBtn = this.add.text(0, h * 0.19, '重置', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '20px',
            color: '#dde8ff',
            backgroundColor: '#2a3f5f',
            padding: { x: 22, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        resetBtn.on('pointerover', () =>
        {
            resetBtn.setStyle({ backgroundColor: '#3d5a8a' });
        });
        resetBtn.on('pointerout', () =>
        {
            resetBtn.setStyle({ backgroundColor: '#2a3f5f' });
        });
        resetBtn.on('pointerdown', () =>
        {
            this.submitReset();
        });
        c.add(resetBtn);

        const closeBtn = this.add.text(w * 0.28, -h * 0.23, 'x', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '30px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () =>
        {
            this.closeResetModal();
        });
        c.add(closeBtn);

        this.resetModal = c;
    }

    closeResetModal()
    {
        if (!this.resetModal)
        {
            return;
        }

        this.resetModal.destroy(true);
        this.resetModal = null;
        this.resetSlots = null;
        this.resetTip = null;
        this.resetBuffer = '';
    }

    handleResetKeys(k)
    {
        if (k === 'Backspace')
        {
            this.resetBuffer = this.resetBuffer.slice(0, -1);
            if (this.resetSlots)
            {
                this.resetSlots.setText(this.formatFourSlots(this.resetBuffer));
            }
            return;
        }

        if (this.resetBuffer.length >= 4)
        {
            return;
        }

        if (/^[0-9]$/.test(k))
        {
            this.resetBuffer += k;
            if (this.resetSlots)
            {
                this.resetSlots.setText(this.formatFourSlots(this.resetBuffer));
            }
        }
    }

    submitReset()
    {
        if (this.resetBuffer.length !== 4)
        {
            if (this.resetTip)
            {
                this.resetTip.setText('需要输入完整 4 位数字');
                this.resetTip.setColor('#fca5a5');
            }
            return;
        }

        this.memory.unlocked = false;
        this.memory.tail4 = this.resetBuffer;
        this.registry.set('memory', this.memory);
        this.syncStatus();

        if (this.resetTip)
        {
            this.resetTip.setText('重置成功');
            this.resetTip.setColor('#a7f3d0');
        }

        this.time.delayedCall(240, () =>
        {
            this.closeResetModal();
        });
    }

    onKeyDown(evt)
    {
        const key = (evt.key || '').toUpperCase();
        if (this._debugManager?.debugMode && key === 'S' && !evt.ctrlKey && !evt.metaKey)
        {
            this.exportHotzonesConfigToDownloadAndStorage();
            return;
        }

        if (!this.resetModal)
        {
            return;
        }

        if (evt.key === 'Escape')
        {
            this.closeResetModal();
            return;
        }

        this.handleResetKeys(evt.key);
    }

    onShutdown()
    {
        if (this._keyDownHandler)
        {
            this.input.keyboard.off('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
    }

    buildTopReturnArrow()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        const cx = w * 0.5;
        const y = h * 0.08;
        const size = 14;

        const g = this.add.graphics();
        g.setDepth(50);
        g.fillStyle(0xdbeafe, 0.9);
        g.lineStyle(2, 0x60a5fa, 1);

        g.beginPath();
        g.moveTo(cx - size, y + size * 0.7);
        g.lineTo(cx + size, y + size * 0.7);
        g.lineTo(cx, y - size * 0.65);
        g.closePath();
        g.fillPath();
        g.strokePath();

        const zone = this.add.zone(cx, y, size * 3, size * 3);
        zone.setDepth(51);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () =>
        {
            if (this.scene.isActive('DeskPast'))
            {
                this.scene.stop('DeskPast');
            }
            this.scene.stop('MemoryBedroom');
            this.scene.resume('NightBedroom');
        });
    }

    gotoDeskPast()
    {
        // 直接在 MemoryBedroom 内弹重置窗口，不再切场景
        this.openResetModal();
    }
}

