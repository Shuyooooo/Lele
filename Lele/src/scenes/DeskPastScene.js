/**
 * Memory Rewrite Demo 2.0 — desk_past 子场景
 * 负责：展示过去输入体验（不再修改密码状态）
 */

export class DeskPastScene extends Phaser.Scene
{
    constructor()
    {
        super('DeskPast');
    }

    preload()
    {
        this.load.image('dp_bg', 'assets/MemoryBedroom/Desk/desk_past.png');
    }

    create()
    {
        this.memory = this.registry.get('memory') || { unlocked: false };
        this.registry.set('memory', this.memory);

        this.mode = 'past';
        this.pastBuffer = '';

        this.computerModal = null;
        this.thoughtUi = null;
        this.pastSlots = null;

        this.messageText = null;
        this.isTransitioning = false;

        const w = this.scale.width;
        const h = this.scale.height;

        this.bgImage = this.add.image(w * 0.5, h * 0.5, 'dp_bg');
        this.fitContain(this.bgImage, w, h);

        this.lightSprite = this.add.rectangle(w * 0.5, h * 0.45, w * 0.95, h * 0.95, 0xffecd2, 0.2);
        this.lightSprite.setBlendMode(Phaser.BlendModes.SCREEN);

        this.coldOverlay = this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x0f172a, 0.2);
        this.coldOverlay.setDepth(1);

        this.buildThoughtUi();
        this.buildSaveButton();
        this.buildBottomReturnArrow();

        this._keyDownHandler = (evt) =>
        {
            this.onKeyDown(evt);
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

    buildThoughtUi()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        const c = this.add.container(w * 0.5, h * 0.42);
        c.setDepth(25);
        this.thoughtUi = c;

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
        this.pastSlots = slots;

        const tip = this.add.text(0, bh * 0.22, '输入数字 · Enter确认（或点击确认按钮）', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '12px',
            color: '#94a3b8'
        }).setOrigin(0.5);
        c.add(tip);
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

    buildSaveButton()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        this.messageText = this.add.text(w * 0.5, h * 0.70, '', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            color: '#93c5fd'
        }).setOrigin(0.5).setDepth(40);

        const btn = this.add.text(w * 0.5, h * 0.78, '确认', {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '18px',
            color: '#dde8ff',
            backgroundColor: '#2a3f5f',
            padding: { x: 22, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(41);

        btn.on('pointerover', () =>
        {
            btn.setStyle({ backgroundColor: '#3d5a8a' });
        });
        btn.on('pointerout', () =>
        {
            btn.setStyle({ backgroundColor: '#2a3f5f' });
        });
        btn.on('pointerdown', () =>
        {
            this.submitPast();
        });
    }

    buildBottomReturnArrow()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        const g = this.add.graphics();
        g.setDepth(60);
        g.fillStyle(0xdbeafe, 0.9);
        g.lineStyle(2, 0x60a5fa, 1);

        const cx = w * 0.5;
        const y = h * 0.92;
        const size = 14;

        g.beginPath();
        g.moveTo(cx - size, y - size * 0.65);
        g.lineTo(cx + size, y);
        g.lineTo(cx - size, y + size * 0.65);
        g.closePath();
        g.fillPath();
        g.strokePath();

        const zone = this.add.zone(cx, y, size * 3, size * 3);
        zone.setDepth(61);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () =>
        {
            this.transitionWithFade(() =>
            {
                this.scene.stop('DeskPast');
                this.scene.resume('MemoryBedroom');
            });
        });
    }

    onKeyDown(evt)
    {
        const k = evt.key;

        if (k === 'Escape')
        {
            this.pastBuffer = '';
            if (this.pastSlots)
            {
                this.pastSlots.setText(this.formatFourSlots(''));
            }
            if (this.messageText)
            {
                this.messageText.setText('已清空 · 输入后按 Enter 确认');
                this.messageText.setColor('#93c5fd');
            }
            return;
        }

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

        if (/^[0-9]$/.test(k))
        {
            if (this.pastBuffer.length >= 4)
            {
                return;
            }
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
            if (this.messageText)
            {
                this.messageText.setText('需要输入完整 4 位数字');
                this.messageText.setColor('#fca5a5');
            }
            this.shakeThought();
            return;
        }

        if (this.messageText)
        {
            this.messageText.setText('已确认输入');
            this.messageText.setColor('#a7f3d0');
        }

        this.flashLight();

        this.time.delayedCall(420, () =>
        {
            this.transitionWithFade(() =>
            {
                this.scene.stop('DeskPast');
                this.scene.resume('MemoryBedroom');
            });
        });
    }

    shakeThought()
    {
        if (!this.thoughtUi)
        {
            return;
        }

        this.tweens.add({
            targets: this.thoughtUi,
            x: this.thoughtUi.x + 10,
            duration: 40,
            yoyo: true,
            repeat: 4,
            ease: 'Sine.easeInOut'
        });
    }

    flashLight()
    {
        if (!this.lightSprite)
        {
            return;
        }

        this.tweens.add({
            targets: this.lightSprite,
            alpha: 0.42,
            duration: 140,
            yoyo: true,
            ease: 'Sine.easeOut'
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
}

