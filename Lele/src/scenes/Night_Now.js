export class Night extends Phaser.Scene
{
	constructor()
	{
		super('Night');
	}

	init()
	{
		const broken = this.registry.get('snailShellBroken');
		if (broken !== true && broken !== false)
		{
			this.registry.set('snailShellBroken', false);
		}

		const hitCount = this.registry.get('snailShellHitCount');
		if (!Number.isFinite(hitCount))
		{
			this.registry.set('snailShellHitCount', 0);
		}
	}

	preload()
	{
		this.load.image('night-bg', 'assets/NightBedroom/bg.png');
		this.load.image('night-computer', 'assets/NightBedroom/Object/Computer.png');
		this.load.image('lamp-big', 'assets/NightBedroom/Light/lamp_big.png');
		this.load.image('lamp-tomb', 'assets/NightBedroom/Light/lamp_tomb.jpg');
	}

	create()
	{
		const { width, height } = this.scale;
		const broken = this.registry.get('snailShellBroken') === true;

		const ART_W = 1280;
		const ART_H = 960;

		const scale = Math.min(width / ART_W, height / ART_H);

		const bg = this.add.image(width / 2, height / 2, 'night-bg');
		bg.setOrigin(0.5);
		bg.setScale(scale);

		const bgLeft = bg.x - (ART_W * scale) / 2;
		const bgTop = bg.y - (ART_H * scale) / 2;

		// 状态变量控制台灯交互
		let showLampBig = false;
		let showLampTomb = false;

		// 创建 lamp_big 图片（初始隐藏）
		const lampBig = this.add.image(width / 2, height / 2, 'lamp-big');
		lampBig.setOrigin(0.5);
		lampBig.setScale(scale * 1.2); // 适当放大显示
		lampBig.setVisible(false);
		lampBig.setInteractive({ useHandCursor: true });
		lampBig.setDepth(9500); // 设置更高的深度，确保在最上层

		// 创建 lamp_tomb 图片（初始隐藏）
		const lampTomb = this.add.image(width / 2, height / 2, 'lamp-tomb');
		lampTomb.setOrigin(0.5);
		lampTomb.setScale(scale * 1.5); // 适当放大显示
		lampTomb.setVisible(false);
		lampTomb.setInteractive({ useHandCursor: true });
		lampTomb.setDepth(9500); // 设置更高的深度，确保在最上层

		const darkness = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, broken ? 0.22 : 0.55).setOrigin(0.5);
		darkness.setDepth(9000);
		darkness.setBlendMode(Phaser.BlendModes.MULTIPLY);

		if (broken)
		{
			const relief = this.add.rectangle(width / 2, height / 2, width, height, 0xfff1b6, 0.08).setOrigin(0.5);
			relief.setDepth(8999);
			relief.setBlendMode(Phaser.BlendModes.SCREEN);
		}

		const getVisualBottomOriginY = (textureKey) =>
		{
			const texture = this.textures.get(textureKey);
			const source = texture?.getSourceImage?.();

			const w = source?.width ?? 0;
			const h = source?.height ?? 0;

			if (!w || !h)
			{
				return 1;
			}

			const step = 2;

			for (let y = h - 1; y >= 0; y -= step)
			{
				for (let x = 0; x < w; x += step)
				{
					const a = this.textures.getPixelAlpha(x, y, textureKey);
					if (a > 0)
					{
						return (y + 1) / h;
					}
				}
			}

			return 1;
		};

		// 电脑在原图(1280x960)中的摆放坐标（需要微调就改这两个数）
		// 这里的 Y 表示“电脑视觉底边落在桌面”的位置（会自动忽略 PNG 的透明留白）
		const DEFAULT_COMPUTER_X = 640;
		const DEFAULT_COMPUTER_Y = 640;

		const savedX = Number.parseFloat(window?.localStorage?.getItem?.('night.computerX') ?? '');
		const savedY = Number.parseFloat(window?.localStorage?.getItem?.('night.computerY') ?? '');

		let computerX = Number.isFinite(savedX) ? savedX : DEFAULT_COMPUTER_X;
		let computerY = Number.isFinite(savedY) ? savedY : DEFAULT_COMPUTER_Y;

		const computer = this.add.image(bgLeft + computerX * scale, bgTop + computerY * scale, 'night-computer');
		computer.setOrigin(0.5, getVisualBottomOriginY('night-computer'));
		computer.setScale(scale);
		computer.setAlpha(0.8);
		computer.setInteractive({ useHandCursor: true });

		// 台灯（占位热区，后续替换素材时可微调坐标）
		const DEFAULT_LAMP_X = 860;
		const DEFAULT_LAMP_Y = 560;
		const savedLampX = Number.parseFloat(window?.localStorage?.getItem?.('night.lampX') ?? '');
		const savedLampY = Number.parseFloat(window?.localStorage?.getItem?.('night.lampY') ?? '');

		let lampX = Number.isFinite(savedLampX) ? savedLampX : DEFAULT_LAMP_X;
		let lampY = Number.isFinite(savedLampY) ? savedLampY : DEFAULT_LAMP_Y;

		const lampHit = this.add.rectangle(bgLeft + lampX * scale, bgTop + lampY * scale, 180 * scale, 180 * scale, 0xffff00, 0);
		lampHit.setOrigin(0.5);
		lampHit.setInteractive({ useHandCursor: true });

		// 调试用：按 D 显示/隐藏锚点十字
		const debug =
		{
			enabled: false,
			graphics: this.add.graphics().setDepth(9999).setVisible(false)
		};

		const infoText = this.add.text(16, 48, '', {
			fontFamily: 'Consolas, Arial',
			fontSize: '16px',
			color: '#ffffff',
			backgroundColor: 'rgba(0,0,0,0.35)',
			padding: { x: 10, y: 6 }
		}).setDepth(9999).setVisible(false);

		const updateComputerPosition = () =>
		{
			const left = bg.x - (ART_W * scale) / 2;
			const top = bg.y - (ART_H * scale) / 2;

			computer.x = left + computerX * scale;
			computer.y = top + computerY * scale;

			lampHit.x = left + lampX * scale;
			lampHit.y = top + lampY * scale;

			if (debug.enabled)
			{
				infoText.setText(
					`Computer X=${computerX.toFixed(1)}  Y=${computerY.toFixed(1)} (art 1280x960)\n` +
					`Lamp     X=${lampX.toFixed(1)}  Y=${lampY.toFixed(1)} (art 1280x960)\n` +
					`←→↑↓ 微调电脑  Shift=10倍  S保存电脑\n` +
					`J/L/I/K 微调台灯  Shift=10倍  P保存台灯`
				);
			}
		};

		const drawCross = () =>
		{
			debug.graphics.clear();
			debug.graphics.lineStyle(2, 0xff2d2d, 1);
			debug.graphics.beginPath();
			debug.graphics.moveTo(computer.x - 16, computer.y);
			debug.graphics.lineTo(computer.x + 16, computer.y);
			debug.graphics.moveTo(computer.x, computer.y - 16);
			debug.graphics.lineTo(computer.x, computer.y + 16);

			debug.graphics.lineStyle(2, 0x2dff7a, 1);
			debug.graphics.moveTo(lampHit.x - 16, lampHit.y);
			debug.graphics.lineTo(lampHit.x + 16, lampHit.y);
			debug.graphics.moveTo(lampHit.x, lampHit.y - 16);
			debug.graphics.lineTo(lampHit.x, lampHit.y + 16);

			debug.graphics.strokePath();
		};

		updateComputerPosition();
		drawCross();
		this.scale.on('resize', () =>
		{
			updateComputerPosition();
			drawCross();
		});

		this.input.keyboard?.on('keydown-D', () =>
		{
			debug.enabled = !debug.enabled;
			debug.graphics.setVisible(debug.enabled);
			infoText.setVisible(debug.enabled);
			updateComputerPosition();
			drawCross();
		});

		this.input.keyboard?.on('keydown', (evt) =>
		{
			if (!debug.enabled)
			{
				return;
			}

			const step = evt.shiftKey ? 10 : 1;

			if (evt.code === 'ArrowLeft') { computerX -= step; }
			else if (evt.code === 'ArrowRight') { computerX += step; }
			else if (evt.code === 'ArrowUp') { computerY -= step; }
			else if (evt.code === 'ArrowDown') { computerY += step; }
			else if (evt.code === 'KeyS')
			{
				window?.localStorage?.setItem?.('night.computerX', String(computerX));
				window?.localStorage?.setItem?.('night.computerY', String(computerY));
			}
			else if (evt.code === 'KeyJ') { lampX -= step; }
			else if (evt.code === 'KeyL') { lampX += step; }
			else if (evt.code === 'KeyI') { lampY -= step; }
			else if (evt.code === 'KeyK') { lampY += step; }
			else if (evt.code === 'KeyP')
			{
				window?.localStorage?.setItem?.('night.lampX', String(lampX));
				window?.localStorage?.setItem?.('night.lampY', String(lampY));
			}
			else
			{
				return;
			}

			updateComputerPosition();
			drawCross();
		});

		this.input.on('gameobjectdown', (_pointer, gameObject) =>
		{
			if (gameObject === computer)
			{
				this.scene.start('MemoryBedroom');
			}
			else if (gameObject === lampHit && !showLampBig && !showLampTomb)
			{
				// 点击台灯热区，显示 lamp_big
				showLampBig = true;
				lampBig.setVisible(true);
			}
			else if (gameObject === lampBig && showLampBig && !showLampTomb)
			{
				// 点击 lamp_big，显示 lamp_tomb
				showLampTomb = true;
				lampTomb.setVisible(true);
			}
			else if ((gameObject === lampTomb || gameObject === lampBig) && showLampTomb)
			{
				// 点击 lamp_tomb 或 lamp_big，返回 Night 场景（清除显示）
				showLampBig = false;
				showLampTomb = false;
				lampBig.setVisible(false);
				lampTomb.setVisible(false);
			}
		});
	}
}

