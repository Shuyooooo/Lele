import { Night } from './scenes/Night_Now.js';
import { MemoryBedroom } from './scenes/MemoryBedroom.js';
import { SnailDemoPresent } from './scenes/SnailDemoPresent.js';
import { SnailDemoPast } from './scenes/SnailDemoPast.js';

const config =
{
	type: Phaser.AUTO,
	title: 'Overlord Rising',
	description: '',
	parent: 'game-container',
	width: 1152,
	height: 648,
	backgroundColor: '#000000',
	pixelArt: false,
	scene: [
		Night,
		MemoryBedroom,
		SnailDemoPresent,
		SnailDemoPast
	],
	scale:
	{
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	},
};

new Phaser.Game(config);
