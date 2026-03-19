export class MemoryBedroom extends Phaser.Scene
{
	constructor()
	{
		super('MemoryBedroom');
	}

	preload()
	{
		this.load.image('memory-bg', 'assets/MemoryBedroom/bg.png');
		this.load.image('lamp-big', 'assets/NightBedroom/Light/lamp_big.png');
		this.load.image('lamp-tomb', 'assets/NightBedroom/Light/lamp_tomb.jpg');
	}

	create()
	{
		const { width, height } = this.scale;

		const ART_W = 1280;
		const ART_H = 960;

		const scale = Math.min(width / ART_W, height / ART_H);

		const bg = this.add.image(width / 2, height / 2, 'memory-bg');
		bg.setOrigin(0.5);
		bg.setScale(scale);

		const bgLeft = bg.x - (ART_W * scale) / 2;
		const bgTop = bg.y - (ART_H * scale) / 2;

		// 状态变量
		let showLampBig = false;
		let showLampTomb = false;

		// 台灯（占位热区，后续替换素材时可微调坐标）
		const DEFAULT_LAMP_X = 872;
		const DEFAULT_LAMP_Y = 487;
		const savedLampX = Number.parseFloat(window?.localStorage?.getItem?.('memory.lampX') ?? '');
		const savedLampY = Number.parseFloat(window?.localStorage?.getItem?.('memory.lampY') ?? '');

		let lampX = Number.isFinite(savedLampX) ? savedLampX : DEFAULT_LAMP_X;
		let lampY = Number.isFinite(savedLampY) ? savedLampY : DEFAULT_LAMP_Y;

		const lampHit = this.add.rectangle(bgLeft + lampX * scale, bgTop + lampY * scale, (180 / 2.5) * scale, (180 / 2.5) * scale, 0x00ffcc, 0.08);
		lampHit.setOrigin(0.5);
		lampHit.setInteractive({ useHandCursor: true });

		// 电脑（占位热区）：点击后返回 Night
		const DEFAULT_COMPUTER_X = 785;
		const DEFAULT_COMPUTER_Y = 461;
		const savedComputerX = Number.parseFloat(window?.localStorage?.getItem?.('memory.computerX') ?? '');
		const savedComputerY = Number.parseFloat(window?.localStorage?.getItem?.('memory.computerY') ?? '');

		let computerX = Number.isFinite(savedComputerX) ? savedComputerX : DEFAULT_COMPUTER_X;
		let computerY = Number.isFinite(savedComputerY) ? savedComputerY : DEFAULT_COMPUTER_Y;

		const computerHit = this.add.rectangle(bgLeft + computerX * scale, bgTop + computerY * scale, (220 / 2.5) * scale, (160 / 2.5) * scale, 0x7db3ff, 0.1);
		computerHit.setOrigin(0.5);
		computerHit.setInteractive({ useHandCursor: true });

		// 创建 lamp_big 图片（初始隐藏）
		const lampBig = this.add.image(width / 2, height / 2, 'lamp-big');
		lampBig.setOrigin(0.5);
		lampBig.setScale(scale * 1.2); // 适当放大显示
		lampBig.setVisible(false);
		lampBig.setInteractive({ useHandCursor: true });

		// 创建 lamp_tomb 图片（初始隐藏）
		const lampTomb = this.add.image(width / 2, height / 2, 'lamp-tomb');
		lampTomb.setOrigin(0.5);
		lampTomb.setScale(scale * 1.5); // 适当放大显示
		lampTomb.setVisible(false);
		lampTomb.setInteractive({ useHandCursor: true });

		this.input.on('gameobjectdown', (_pointer, gameObject) =>
		{
			if (gameObject === lampHit && !showLampBig && !showLampTomb)
			{
				// 点击台灯热区，进入过去场景（可砸壳）
				this.scene.start('SnailDemoPast');
			}
			else if (gameObject === lampBig && showLampBig && !showLampTomb)
			{
				// 点击 lamp_big，显示 lamp_tomb
				showLampTomb = true;
				lampTomb.setVisible(true);
			}
			else if ((gameObject === lampTomb || gameObject === lampBig) && showLampTomb)
			{
				// 点击 lamp_tomb 或 lamp_big 返回 Night
				this.scene.start('Night');
			}
			else if (gameObject === computerHit)
			{
				this.scene.start('Night');
			}
		});

		this.input.keyboard?.once('keydown-ESC', () =>
		{
			this.scene.start('Night');
		});

		this.add.text(16, 16, 'ESC 返回 Night', {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#ffffff',
			backgroundColor: 'rgba(0,0,0,0.35)',
			padding: { x: 10, y: 6 }
		});

		this.add.text(16, 56, '提示：青色=台灯进绿地，蓝色=电脑回 Night\nD 显示/隐藏十字；J/L/I/K 微调台灯；F/H/T/G 微调电脑；P/O 保存', {
			fontFamily: 'Arial',
			fontSize: '16px',
			color: '#d7ffe1',
			backgroundColor: 'rgba(0,0,0,0.25)',
			padding: { x: 10, y: 6 }
		});

		const debug =
		{
			enabled: false,
			graphics: this.add.graphics().setDepth(9999).setVisible(false)
		};

		const infoText = this.add.text(16, 106, '', {
			fontFamily: 'Consolas, Arial',
			fontSize: '16px',
			color: '#ffffff',
			backgroundColor: 'rgba(0,0,0,0.35)',
			padding: { x: 10, y: 6 }
		}).setDepth(9999).setVisible(false);

		const updateLampPosition = () =>
		{
			const left = bg.x - (ART_W * scale) / 2;
			const top = bg.y - (ART_H * scale) / 2;

			lampHit.x = left + lampX * scale;
			lampHit.y = top + lampY * scale;
			computerHit.x = left + computerX * scale;
			computerHit.y = top + computerY * scale;

			if (debug.enabled)
			{
				infoText.setText(
					`Lamp X=${lampX.toFixed(1)}  Y=${lampY.toFixed(1)} (art 1280x960)\n` +
					`Comp X=${computerX.toFixed(1)}  Y=${computerY.toFixed(1)} (art 1280x960)\n` +
					`J/L/I/K 台灯  F/H/T/G 电脑  Shift=10倍  P存台灯  O存电脑`
				);
			}
		};

		const drawCross = () =>
		{
			debug.graphics.clear();
			debug.graphics.lineStyle(2, 0x2dff7a, 1);
			debug.graphics.beginPath();
			debug.graphics.moveTo(lampHit.x - 16, lampHit.y);
			debug.graphics.lineTo(lampHit.x + 16, lampHit.y);
			debug.graphics.moveTo(lampHit.x, lampHit.y - 16);
			debug.graphics.lineTo(lampHit.x, lampHit.y + 16);
			debug.graphics.lineStyle(2, 0x7db3ff, 1);
			debug.graphics.moveTo(computerHit.x - 16, computerHit.y);
			debug.graphics.lineTo(computerHit.x + 16, computerHit.y);
			debug.graphics.moveTo(computerHit.x, computerHit.y - 16);
			debug.graphics.lineTo(computerHit.x, computerHit.y + 16);
			debug.graphics.strokePath();
		};

		updateLampPosition();
		drawCross();
		this.scale.on('resize', () =>
		{
			updateLampPosition();
			drawCross();
		});

		this.input.keyboard?.on('keydown-D', () =>
		{
			debug.enabled = !debug.enabled;
			debug.graphics.setVisible(debug.enabled);
			infoText.setVisible(debug.enabled);
			lampHit.setAlpha(debug.enabled ? 0.16 : 0.08);
			computerHit.setAlpha(debug.enabled ? 0.18 : 0.1);
			updateLampPosition();
			drawCross();
		});

		this.input.keyboard?.on('keydown', (evt) =>
		{
			if (!debug.enabled)
			{
				return;
			}

			const step = evt.shiftKey ? 10 : 1;

			if (evt.code === 'KeyJ') { lampX -= step; }
			else if (evt.code === 'KeyL') { lampX += step; }
			else if (evt.code === 'KeyI') { lampY -= step; }
			else if (evt.code === 'KeyK') { lampY += step; }
			else if (evt.code === 'KeyF') { computerX -= step; }
			else if (evt.code === 'KeyH') { computerX += step; }
			else if (evt.code === 'KeyT') { computerY -= step; }
			else if (evt.code === 'KeyG') { computerY += step; }
			else if (evt.code === 'KeyP')
			{
				window?.localStorage?.setItem?.('memory.lampX', String(lampX));
				window?.localStorage?.setItem?.('memory.lampY', String(lampY));
			}
			else if (evt.code === 'KeyO')
			{
				window?.localStorage?.setItem?.('memory.computerX', String(computerX));
				window?.localStorage?.setItem?.('memory.computerY', String(computerY));
			}
			else
			{
				return;
			}

			updateLampPosition();
			drawCross();
		});
	}
}

