import Phaser from "phaser";
import pngCells from "../assets/cells.png"
import pngBtns from "../assets/btns.png"
import pngBridges from "../assets/bridges.png"
import pngNumbers from "../assets/numbers.png"
//breakout
import pngBall from "../assets/breakout/ball.png"
import pngBall2 from "../assets/breakout/ball2.png"
import pngBalls from "../assets/breakout/balls.png"
import pngBrick from "../assets/breakout/brick.png"
import pngDestroyed from "../assets/breakout/destroyed.png"
import pngPaddle from "../assets/breakout/paddle.png"

export default class Preload extends Phaser.Scene {
    constructor() {
        super({
            key: "Preload",
            active: true
        });
    }

    preload() {
        if(document.getElementById("homeload")) document.getElementById("homeload").remove();
        this.load.spritesheet('imgCells', pngCells, { frameWidth: 85, frameHeight: 85 });
        this.load.spritesheet('imgBtns', pngBtns, {frameWidth:150, frameHeight:150});
        this.load.spritesheet('imgBridges', pngBridges, { frameWidth: 85, frameHeight: 19 });
        this.load.image('imgNumbers',pngNumbers);
        //breakout
        this.load.image('imgBall', pngBall);
        this.load.image('imgBall2', pngBall2);
        this.load.spritesheet('imgBalls', pngBalls, { frameWidth: 40, frameHeight: 40 });
        this.load.image('imgBrick', pngBrick);
        this.load.image('imgDestroyed', pngDestroyed);
        this.load.image('imgPaddle', pngPaddle);
        // 监听加载过程
        this.load.on('progress', (value) => {
            this.UpdateProgressBar(value)
        });
        this.load.on('complete', () => {
           this.LoadComplete();
        });
    }

    /** @type {Phaser.GameObjects.Graphics} */
    m_ProgressBar=null;

    create() {
         
    }

    // 更新进度条
    UpdateProgressBar(progress) {
        if (!this.m_ProgressBar) {
            // 创建进度条
            this.m_ProgressBar = this.add.graphics();
        }
        this.m_ProgressBar.clear();
        this.m_ProgressBar.fillStyle(0x3f72af);
        this.m_ProgressBar.fillRoundedRect(50, 200, 350 * progress, 40, 15);
    }

    // 加载完成
    LoadComplete() {
        // 进度条加载完毕后的操作
        this.m_ProgressBar.destroy();
        this.scene.start('Menu');
    }

}