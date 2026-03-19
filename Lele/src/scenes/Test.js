// "Every great game begins with a single scene. Let's make this one unforgettable!"
export class Test extends Phaser.Scene
{
	constructor()
	{
		super('Test');
	}

	init()
	{
		// Initialize scene
	}

	preload()
	{
		// 当前 demo 不加载外部图片资源，直接用文字和图形
	}

	create()
	{
		const { width, height } = this.scale;

		// 背景色
		this.cameras.main.setBackgroundColor('#1e1e2f');

		// 场景标题
		this.add.text(width / 2, height / 2 - 80, 'Test 场景', {
			fontFamily: 'Arial',
			fontSize: '40px',
			color: '#ffffff'
		}).setOrigin(0.5);

		// 一个“假按钮”矩形
		const graphics = this.add.graphics();
		graphics.fillStyle(0xffcc00, 1);
		graphics.fillRoundedRect(width / 2 - 150, height / 2 - 20, 300, 80, 20);

		this.add.text(width / 2, height / 2 + 20, '解谜游戏从这里开始', {
			fontFamily: 'Arial',
			fontSize: '22px',
			color: '#000000'
		}).setOrigin(0.5);

		// 下方说明文字
		this.add.text(width / 2, height - 40, '现在你看到的就是 Test 场景', {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#cccccc'
		}).setOrigin(0.5);
	}

}
