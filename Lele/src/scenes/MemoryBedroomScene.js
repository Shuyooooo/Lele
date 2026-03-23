/**
 * Memory Rewrite Demo 2.0 — Past 管理主场景
 * 背景：assets/MemoryBedroom/bg.png
 * 目的：点击桌子查看 note_past 线索
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
        this.load.image('mb_note_past', 'assets/MemoryBedroom/note_past.png');
    }

    create()
    {
        this.mode = 'past';
        this.memory = this.registry.get('memory') || { unlocked: false };
        this.registry.set('memory', this.memory);
        this.deskZone = null;
        this.lightZone = null;
        this.hotzonesConfig = null;
        this.notePastModal = null;
        this.isTransitioning = false;

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

        this.deskZone = this.add.rectangle(w * 0.53, h * 0.6, w * 0.34, h * 0.25, 0x93c5fd, 0.001);
        this.deskZone.setDepth(10);
        this.deskZone.setInteractive({ useHandCursor: true });
        this.deskZone.name = 'deskHotzone';
        this.deskZone.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.gotoDeskPast();
        });
        this.lightZone = this.add.rectangle(w * 0.60, h * 0.43, w * 0.12, h * 0.14, 0xffecd2, 0.001);
        this.lightZone.setDepth(10);
        this.lightZone.setInteractive({ useHandCursor: true });
        this.lightZone.name = 'lightHotzone';
        this.lightZone.on('pointerdown', () =>
        {
            if (this._debugManager && this._debugManager.debugMode)
            {
                return;
            }
            this.returnToDeskNow();
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
        this._debugManager.registerEditableObject(this.lightZone, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.ready.then(() =>
        {
            this._debugManager.applyConfig();
            this.loadAndApplyHotzonesConfig();
        });

        this.events.on('resume', this.onResume, this);

        this._keyDownHandler = (evt) =>
        {
            this.onKeyDown(evt);
        };
        this.input.keyboard.on('keydown', this._keyDownHandler);
        this.events.on('shutdown', this.onShutdown, this);
        this.cameras.main.fadeIn(220, 0, 0, 0);
    }

    onResume()
    {
        this.memory = this.registry.get('memory') || this.memory;
    }

    fitContain(img, mw, mh)
    {
        const s = Math.min(mw / img.width, mh / img.height);
        img.setScale(s);
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
        if (!cfg || typeof cfg !== 'object' || !this.deskZone)
        {
            return;
        }

        const mb = cfg.memoryBedroom || cfg['memoryBedroom'] || {};
        if (!mb.deskHotzone && !mb.lightHotzone)
        {
            return;
        }

        const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
        if (mb.deskHotzone && this.deskZone)
        {
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

        if (mb.lightHotzone && this.lightZone)
        {
            const rawXPercent = mb.lightHotzone.xPercent ?? 50;
            const rawYPercent = mb.lightHotzone.yPercent ?? 50;
            const xPercent = Phaser.Math.Clamp(rawXPercent, 0, 100);
            const yPercent = Phaser.Math.Clamp(rawYPercent, 0, 100);
            const x = rect.x + rect.width * (xPercent / 100);
            const y = rect.y + rect.height * (yPercent / 100);
            this.lightZone.setPosition(x, y);

            const scaleXPercent = mb.lightHotzone.scaleXPercent ?? mb.lightHotzone.scalePercent ?? 100;
            const scaleYPercent = mb.lightHotzone.scaleYPercent ?? mb.lightHotzone.scalePercent ?? 100;
            this.lightZone.setScale(scaleXPercent / 100, scaleYPercent / 100);
        }
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
        data.memoryBedroom.lightHotzone = this.lightZone ? {
            xPercent: ((this.lightZone.x - rect.x) / rect.width) * 100,
            yPercent: ((this.lightZone.y - rect.y) / rect.height) * 100,
            scaleXPercent: this.lightZone.scaleX * 100,
            scaleYPercent: this.lightZone.scaleY * 100
        } : null;

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

    openNotePastModal()
    {
        if (this.notePastModal)
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

        const note = this.add.image(0, 0, 'mb_note_past');
        const scale = Math.min((w * 0.9) / note.width, (h * 0.9) / note.height);
        note.setScale(scale);
        c.add(note);

        const closeBtn = this.add.text(note.displayWidth * 0.5 - 22, -note.displayHeight * 0.5 + 22, 'x', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '30px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () =>
        {
            this.closeNotePastModal();
        });
        c.add(closeBtn);

        this.notePastModal = c;
    }

    closeNotePastModal()
    {
        if (!this.notePastModal)
        {
            return;
        }

        this.notePastModal.destroy(true);
        this.notePastModal = null;
    }

    onKeyDown(evt)
    {
        const key = (evt.key || '').toUpperCase();
        if (this._debugManager?.debugMode && key === 'S' && !evt.ctrlKey && !evt.metaKey)
        {
            this.exportHotzonesConfigToDownloadAndStorage();
            return;
        }

        if (evt.key === 'Escape')
        {
            this.closeNotePastModal();
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

    returnToDeskNow()
    {
        this.transitionWithFade(() =>
        {
            if (this.scene.isActive('DeskPast'))
            {
                this.scene.stop('DeskPast');
            }

            if (this.scene.isPaused('DeskNow'))
            {
                this.scene.resume('DeskNow');
            }
            else if (!this.scene.isActive('DeskNow'))
            {
                this.scene.launch('DeskNow');
            }

            this.scene.stop('MemoryBedroom');
        });
    }

    gotoDeskPast()
    {
        this.openNotePastModal();
    }

    transitionWithFade(action)
    {
        if (this.isTransitioning)
        {
            return;
        }

        this.isTransitioning = true;
        const cam = this.cameras.main;
        let executed = false;
        const runActionOnce = () =>
        {
            if (executed)
            {
                return;
            }
            executed = true;
            action();
        };

        cam.once('camerafadeoutcomplete', runActionOnce);
        cam.fadeOut(240, 0, 0, 0);
        // fallback: prevent rare timer/camera event race from leaving a black screen
        this.time.delayedCall(320, runActionOnce);
    }
}

