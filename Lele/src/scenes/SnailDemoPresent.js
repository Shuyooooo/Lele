export class SnailDemoPresent extends Phaser.Scene
{
	constructor()
	{
		super('SnailDemoPresent');
	}

	init()
	{
		const existing = this.registry.get('snailShellBroken');
		if (existing !== true && existing !== false)
		{
			this.registry.set('snailShellBroken', false);
		}
	}

	create()
	{
		const { width, height } = this.scale;
		const broken = this.registry.get('snailShellBroken') === true;

		// Background (present = dry land)
		this.cameras.main.setBackgroundColor('#17130f');

		const ground = this.add.rectangle(width / 2, height * 0.68, width, height * 0.64, 0x3b2b1f).setOrigin(0.5);
		ground.setAlpha(0.95);

		// Lamp (interactive entry to past)
		const lamp =
		{
			x: width * 0.5,
			y: height * 0.25,
			w: Math.min(220, width * 0.25),
			h: Math.min(220, height * 0.3),
		};

		const lampBase = this.add.ellipse(lamp.x, lamp.y, lamp.w, lamp.h, 0x2a2a2a).setOrigin(0.5);
		const lampGlass = this.add.ellipse(lamp.x, lamp.y, lamp.w * 0.82, lamp.h * 0.82, 0x9aa3ad).setOrigin(0.5);
		lampGlass.setAlpha(0.25);

		const lampHit = this.add.rectangle(lamp.x, lamp.y, lamp.w, lamp.h, 0x000000, 0).setOrigin(0.5);
		lampHit.setInteractive({ useHandCursor: true });

		lampHit.on('pointerdown', () =>
		{
			this.scene.start('Night');
		});

		// Objects: grave or snail depending on state
		const objY = height * 0.66;

		if (!broken)
		{
			const grave = this.add.rectangle(width * 0.5, objY, 140, 120, 0x5a5a5a).setOrigin(0.5, 1);
			this.add.rectangle(width * 0.5, objY - 95, 110, 25, 0x6d6d6d).setOrigin(0.5);
			grave.setAlpha(0.9);

			this.add.text(16, 16, 'Present（现在）\n点击灯泡返回 Night', {
				fontFamily: 'Arial',
				fontSize: '18px',
				color: '#ffffff',
				backgroundColor: 'rgba(0,0,0,0.35)',
				padding: { x: 10, y: 8 }
			});

			this.add.text(16, 78, '不合理：蜗牛已死亡，但原因未知', {
				fontFamily: 'Arial',
				fontSize: '18px',
				color: '#ffe9d6',
				backgroundColor: 'rgba(0,0,0,0.25)',
				padding: { x: 10, y: 6 }
			});
		}
		else
		{
			const snailBody = this.add.ellipse(width * 0.48, objY - 20, 180, 70, 0x8b6a4f).setOrigin(0.5);
			snailBody.setAlpha(0.95);

			const shell = this.add.ellipse(width * 0.56, objY - 55, 120, 110, 0x5b3b2b).setOrigin(0.5);
			const crack = this.add.line(0, 0, width * 0.53, objY - 85, width * 0.60, objY - 25, 0xefe0d0, 0.9);
			crack.setLineWidth(4, 4);

			const glow = this.add.rectangle(width / 2, height / 2, width, height, 0xfff1b6, 0.12).setOrigin(0.5);
			glow.setBlendMode(Phaser.BlendModes.SCREEN);
			glow.setDepth(-10);

			this.add.text(16, 16, 'Present（现在）\n变化：坟墓消失，蜗牛仍在（壳受损）', {
				fontFamily: 'Arial',
				fontSize: '18px',
				color: '#ffffff',
				backgroundColor: 'rgba(0,0,0,0.35)',
				padding: { x: 10, y: 8 }
			});

			this.add.text(16, 88, '点击灯泡返回 Night\n按 R 重置（测试用）', {
				fontFamily: 'Arial',
				fontSize: '18px',
				color: '#fff7d1',
				backgroundColor: 'rgba(0,0,0,0.25)',
				padding: { x: 10, y: 6 }
			});

			this.input.keyboard?.once('keydown-R', () =>
			{
				this.registry.set('snailShellBroken', false);
				this.registry.set('snailShellHitCount', 0);
				this.scene.restart();
			});
		}

		// Light overlay (darker in present, brighter after change)
		const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, broken ? 0.25 : 0.55).setOrigin(0.5);
		darkness.setDepth(9999);
		darkness.setBlendMode(Phaser.BlendModes.MULTIPLY);

		this.input.keyboard?.once('keydown-ESC', () =>
		{
			this.scene.start('Night');
		});
	}
}

