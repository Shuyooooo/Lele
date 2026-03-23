import { DeskNowLightOffScene } from './scenes/DeskNowLightOffScene.js';
import { DeskNowScene } from './scenes/DeskNowScene.js';
import { MemoryBedroomScene } from './scenes/MemoryBedroomScene.js';
import { DeskPastScene } from './scenes/DeskPastScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'Memory Rewrite Demo 2.0',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 960,
    backgroundColor: '#000000',
    pixelArt: false,
    roundPixels: true,
    scene: [
        DeskNowLightOffScene,
        DeskNowScene,
        MemoryBedroomScene,
        DeskPastScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            