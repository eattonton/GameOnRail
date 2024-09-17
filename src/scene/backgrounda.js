import Phaser from "phaser";
import SceneInit from "../js/sceneinit";

export default class BackGroundA extends Phaser.Scene{
    constructor(){
        super({
            key: "BackGroundA"
        });
    }

    preload() {
        
    }

    create() {
        this.SCInfo = new SceneInit(this);
        this.SCInfo.Init(400, 800, 2);
        this.CreateBall();
        setInterval(()=>{
            this.CreateBall();
        },2000);
    }

    CreateBall(){
        let idx = Phaser.Math.Between(0,8);
        let posX = Phaser.Math.Between(-300,300);
        let ball = this.add.image(this.SCInfo.CX+posX, this.SCInfo.CY - 450, 'imgNumBalls',idx);
        ball.setScale(2);
        this.tweens.add({
            targets: ball,
            ease: 'Bounce.Out',
            y:this.SCInfo.CY + 500,
            angle: 360,
            duration: 5000,
            onComplete: () => {
                ball.destroy();
            }
        })
    }   
}