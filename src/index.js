import Phaser from "phaser";
import TT from "./gameconfig";
import Nonograms from "./scene/nonograms"

const config = {
    type: Phaser.AUTO,
    backgroundColor: 0xffffff,
    scale: {
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        autoCenter: Phaser.Scale.CENTER,
        width: 1800,
        height: 2400
    },
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            debug: true,
            gravity: { y: 0 }
        },
    },
    input: {
        gamepad: true
    },
    scene: [Nonograms]

}

class GameConfig extends Phaser.Game {
    //显示尺寸
    width = parseInt(this.config.width);
    height = parseInt(this.config.height);

    constructor(config) {
        if(window.innerWidth > window.innerHeight){
            TT.IsLandscape = true;  //横屏
        }
        
        super(config);
    }
}

TT.game = new GameConfig(config);