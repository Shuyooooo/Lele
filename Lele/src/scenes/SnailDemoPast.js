export class SnailDemoPast extends Phaser.Scene
{
	constructor()
	{
		super('SnailDemoPast');
	}

	create()
	{
		const { width, height } = this.scale;
		const alreadyBroken = this.registry.get('snailShellBroken') === true;
		let hitCount = Number(this.registry.get('snailShellHitCount') ?? 0);
		if (!Number.isFinite(hitCount))
		{
			hitCount = 0;
		}

		this.cameras.main.setBackgroundColor('#0f2a18');

		// Background (past = green field)
		const grass = this.add.rectangle(width / 2, height * 0.68, width, height * 0.64, 0x1f6b3a).setOrigin(0.5);
		grass.setAlpha(0.95);

		this.add.text(16, 16, 'Past（过去）\n点击蜗牛壳（用锤子砸）', {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#ffffff',
			backgroundColor: 'rgba(0,0,0,0.35)',
			padding: { x: 10, y: 8 }
		});

		// Snail + oversized shell
		const baseY = height * 0.66;
		const snailBody = this.add.ellipse(width * 0.45, baseY - 20, 180, 70, 0x8b6a4f).setOrigin(0.5);
		snailBody.setAlpha(0.95);

		const shell =
		{
			x: width * 0.58,
			y: baseY - 70,
			w: 200,
			h: 180
		};

		const shellShape = this.add.ellipse(shell.x, shell.y, shell.w, shell.h, 0x4a2f22).setOrigin(0.5);
		shellShape.setAlpha(0.98);

		const shellHit = this.add.rectangle(shell.x, shell.y, shell.w, shell.h, 0x000000, 0).setOrigin(0.5);
		shellHit.setInteractive({ useHandCursor: true });

		// Hammer icon (visual cue)
		const hammerX = width * 0.18;
		const hammerY = height * 0.38;
		const hammerHandle = this.add.rectangle(hammerX, hammerY + 30, 18, 120, 0x7b4a2d).setOrigin(0.5);
		const hammerHead = this.add.rectangle(hammerX + 35, hammerY - 10, 95, 30, 0x9aa3ad).setOrigin(0.5);
		const hammerNeck = this.add.rectangle(hammerX + 10, hammerY + 5, 22, 36, 0x8c5a3a).setOrigin(0.5);

		const hint = this.add.text(16, 78, '', {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#d7ffe1',
			backgroundColor: 'rgba(0,0,0,0.25)',
			padding: { x: 10, y: 6 }
		});

		const updateHint = () =>
		{
			if (alreadyBroken)
			{
				hint.setText('已完成：壳已经被砸碎\nESC 返回记忆卧室');
				return;
			}

			const remain = Math.max(0, 3 - hitCount);
			hint.setText(`砸壳进度：${hitCount}/3（还需 ${remain} 次）\n完成后自动返回 Night`);
		};

		updateHint();

		let done = alreadyBroken;

		const doSmash = () =>
		{
			if (done)
			{
				return;
			}
			hitCount += 1;
			this.registry.set('snailShellHitCount', hitCount);

			// Visual feedback: crack + small shake
			const crack1 = this.add.line(0, 0, shell.x - 40, shell.y - 60, shell.x + 30, shell.y + 70, 0xfff4de, 1);
			crack1.setLineWidth(5, 5);
			const crack2 = this.add.line(0, 0, shell.x + 30, shell.y - 70, shell.x - 25, shell.y + 50, 0xfff4de, 0.9);
			crack2.setLineWidth(4, 4);

			this.tweens.add({
				targets: [shellShape, crack1, crack2],
				x: { from: shellShape.x - 6, to: shellShape.x + 6 },
				duration: 60,
				yoyo: true,
				repeat: 5
			});

			this.tweens.add({
				targets: [hammerHead, hammerNeck],
				angle: { from: -10, to: 10 },
				duration: 60,
				yoyo: true,
				repeat: 5
			});

			updateHint();

			if (hitCount >= 3)
			{
				done = true;
				hint.setText('砸壳完成：正在返回 Night…');
				this.registry.set('snailShellBroken', true);

				this.time.delayedCall(600, () =>
				{
					this.scene.start('Night');
				});
			}
		};

		shellHit.on('pointerdown', () =>
		{
			doSmash();
		});

		this.input.keyboard?.once('keydown-ESC', () =>
		{
			this.scene.start('MemoryBedroom');
		});
	}
}

