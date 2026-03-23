import { LayoutManager } from '../utils/LayoutManager.js';
import { DebugManager } from '../utils/DebugManager.js';

export class DeskNowLightOffScene extends Phaser.Scene
{
    constructor()
    {
        super('DeskNowLightOff');
    }

    preload()
    {
        this.load.image('desk_bg_lightoff', 'assets/NightBedroom/sub_scenes/desk_now_lightoff.png');
        this.load.image('dn_text_1', 'assets/NightBedroom/sub_scenes/text_1.png');
        this.load.image('dn_text_2', 'assets/NightBedroom/sub_scenes/text_2.png');
    }

    create()
    {
        this.memory = this.registry.get('memory') || { unlocked: false, powerOn: false };
        this.memory.powerOn = false;
        this.registry.set('memory', this.memory);

        const w = this.scale.width;
        const h = this.scale.height;

        this.bgImage = this.add.image(w * 0.5, h * 0.5, 'desk_bg_lightoff');
        this.fitContain(this.bgImage, w, h);
        this.bgImage.name = 'background';
        this.bgImage.setInteractive({ useHandCursor: false });
        this.textModal1 = null;
        this.textModal2 = null;
        this.isTransitioning = false;

        this.powerOnHotzone = this.add.rectangle(w * 0.5, h * 0.45, w * 0.95, h * 0.95, 0xffecd2, 0.001);
        this.powerOnHotzone.name = 'powerOnHotzone';
        this.powerOnHotzone.setInteractive({ useHandCursor: true });
        this.powerOnHotzone.on('pointerdown', () =>
        {
            if (this._debugManager?.debugMode)
            {
                return;
            }
            this.turnPowerOn();
        });

        this.textHotzone1 = this.add.rectangle(
            w * 0.30,
            h * 0.25,
            w * 0.08,
            h * 0.06,
            0x9ca3af,
            0.001
        );
        this.textHotzone1.name = 'textHotzone1';
        this.textHotzone1.setInteractive({ useHandCursor: true });
        this.textHotzone1.on('pointerdown', () =>
        {
            if (this._debugManager?.debugMode)
            {
                return;
            }
            this.openTextModal(1);
        });

        this.textHotzone2 = this.add.rectangle(
            w * 0.42,
            h * 0.25,
            w * 0.08,
            h * 0.06,
            0x9ca3af,
            0.001
        );
        this.textHotzone2.name = 'textHotzone2';
        this.textHotzone2.setInteractive({ useHandCursor: true });
        this.textHotzone2.on('pointerdown', () =>
        {
            if (this._debugManager?.debugMode)
            {
                return;
            }
            this.openTextModal(2);
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
        this._debugManager.registerEditableObject(this.powerOnHotzone, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.registerEditableObject(this.textHotzone1, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.registerEditableObject(this.textHotzone2, { useHandCursor: true, pixelPerfect: false });
        this._debugManager.ready.then(() =>
        {
            this._debugManager.applyConfig();
            this.loadAndApplyHotzonesConfig();
        });

        this._keyDownHandler = (evt) =>
        {
            const key = (evt.key || '').toUpperCase();
            if (this._debugManager?.debugMode && key === 'S' && !evt.ctrlKey && !evt.metaKey)
            {
                this.exportHotzonesConfigToDownloadAndStorage();
                return;
            }
            if (evt.key === 'Escape')
            {
                this.closeTextModal();
            }
        };
        this.input.keyboard.on('keydown', this._keyDownHandler);
        this.events.on('shutdown', this.onShutdown, this);
        this.cameras.main.fadeIn(220, 0, 0, 0);
    }

    onShutdown()
    {
        if (this._keyDownHandler)
        {
            this.input.keyboard.off('keydown', this._keyDownHandler);
            this._keyDownHandler = null;
        }
    }

    fitContain(img, mw, mh)
    {
        const s = Math.min(mw / img.width, mh / img.height);
        img.setScale(s);
    }

    turnPowerOn()
    {
        this.closeTextModal();
        this.memory.powerOn = true;
        this.registry.set('memory', this.memory);
        this.transitionWithFade(() =>
        {
            this.scene.stop('DeskNowLightOff');
            this.scene.launch('DeskNow');
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
                if (!cfg || typeof cfg !== 'object' || !this.powerOnHotzone)
                {
                    return;
                }
                const off = cfg.deskNowLightOff || {};
                const deskNow = cfg.deskNow || {};
                if (!off.powerOnHotzone)
                {
                    // keep defaults
                }
                const rect = { x: 0, y: 0, width: this.scale.width, height: this.scale.height };
                if (off.powerOnHotzone)
                {
                    const x = rect.width * ((off.powerOnHotzone.xPercent ?? 50) / 100);
                    const y = rect.height * ((off.powerOnHotzone.yPercent ?? 50) / 100);
                    this.powerOnHotzone.setPosition(x, y);
                    const sx = off.powerOnHotzone.scaleXPercent ?? off.powerOnHotzone.scalePercent ?? 100;
                    const sy = off.powerOnHotzone.scaleYPercent ?? off.powerOnHotzone.scalePercent ?? 100;
                    this.powerOnHotzone.setScale(sx / 100, sy / 100);
                }

                const applyDeskTextZone = (zone, z) =>
                {
                    if (!zone || !z)
                    {
                        return;
                    }
                    const x = rect.width * ((z.xPercent ?? 50) / 100);
                    const y = rect.height * ((z.yPercent ?? 50) / 100);
                    zone.setPosition(x, y);
                    const sx = z.scaleXPercent ?? z.scalePercent ?? 100;
                    const sy = z.scaleYPercent ?? z.scalePercent ?? 100;
                    zone.setScale(sx / 100, sy / 100);
                };
                applyDeskTextZone(this.textHotzone1, deskNow.textHotzone1);
                applyDeskTextZone(this.textHotzone2, deskNow.textHotzone2);
            })
            .catch(() =>
            {
                // keep defaults
            });
    }

    async exportHotzonesConfigToDownloadAndStorage()
    {
        if (!this.powerOnHotzone)
        {
            return;
        }
        const data = await this.loadHotzonesConfig();
        data.deskNowLightOff = data.deskNowLightOff || {};
        data.deskNowLightOff.powerOnHotzone = {
            xPercent: (this.powerOnHotzone.x / this.scale.width) * 100,
            yPercent: (this.powerOnHotzone.y / this.scale.height) * 100,
            scaleXPercent: this.powerOnHotzone.scaleX * 100,
            scaleYPercent: this.powerOnHotzone.scaleY * 100
        };
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
        if (index === 1 && this.textModal1)
        {
            this.closeTextModal();
            return;
        }
        if (index === 2 && this.textModal2)
        {
            this.closeTextModal();
            return;
        }
        this.closeTextModal();

        const textureKey = index === 1 ? 'dn_text_1' : 'dn_text_2';
        const w = this.scale.width;
        const h = this.scale.height;
        const c = this.add.container(w * 0.5, h * 0.5);
        c.setDepth(40);

        const img = this.add.image(0, 0, textureKey);
        img.setOrigin(0.5);
        img.setDisplaySize(1280, 960);
        img.setInteractive({ useHandCursor: false });
        img.on('pointerdown', () =>
        {
            // capture click to avoid passthrough
        });
        c.add(img);

        const closeBtn = this.add.text(620, -450, 'x', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '42px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 12, y: 2 }
        }).setOrigin(0.5).setDepth(41).setInteractive({ useHandCursor: true });
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
}
