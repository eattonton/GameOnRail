import Phaser from "phaser"
import { CreateNumberBalls } from "../js/textures";
import SceneInit from "../js/sceneinit";
import GuideLineHelper from "../js/guideline";

const textStyle = {
    font: 'bold 28px Arial',
    fill: '#ff0000'
}

export default class Breakout extends Phaser.Scene {
    constructor() {
        super({
            key: "Breakout"
        });
    }

    preload() {
        //创建球资源
        CreateNumberBalls(this);
        this.ballWidth = 66;
    }

    score = 0;
    isPointerDown = false;

    /** @type {Phaser.GameObjects.Line} */
    guideLines = [];
    bricks = [];
    /** @type{Array<Phaser.Types.Physics.Arcade.ImageWithDynamicBody>} */
    balls = [];
    numSmallBall = 0; //拾取的小球数量
    isOnGround = true;  //判断球是不是 都在 地上
    isMoveDown = false;  //是否往下移动
    isMerge = false;     //是否合并
    create() {
        this.SCInfo = new SceneInit(this);
        this.SCInfo.Init(400, 800, 2);

        this.paddle = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 399, 'imgPaddle').setImmovable();
        this.paddle.setOrigin(0.5, 0);
        this.paddle.setScale(10, 5);
        this.paddle.setDepth(100);
        this.paddle.setInteractive();

        let ball = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 390, 'imgBalls', 0);
        ball.setScale(0.8);
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        //ball.setInteractive();
        ball.setData("id", 1);
        this.paddle.on('pointerdown', (pointer) => {
            if(!this.isOnGround) return;
            this.x0 = ball.x;
            this.y0 = ball.y;
            this.isPointerDown = true;
        })
        this.balls.push(ball);

        this.input.on('pointermove', (pointer) => {
            if(!this.isPointerDown) return;
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.x1 = worldPoint.x;
            this.y1 = worldPoint.y;
            //绘制预览路径
            this.DrawPathLine();
        }).on('pointerup', () => {
            if(!this.isPointerDown) return;
            this.isPointerDown = false;
            this.startGame();
        })
        //生成砖块
        this.CreateBricks(this.SCInfo.CX, this.SCInfo.CY);

        this.scoreText = this.add.text(this.SCInfo.CX - 200, this.SCInfo.CY - 500, "Score:0", textStyle);
        
        //add collision 
        this.physics.add.collider(this.balls, this.bricks, this.brickHit, null, this);
        this.physics.add.collider(this.balls, this.paddle, this.paddleHit, null, this);
        this.physics.add.overlap(this.bricks, this.paddle, ()=>{
            this.reset();
        }, null, this);
        //indicate path
        let gWall = this.add.graphics({ lineStyle: { width: 5, color: 0xaa00aa }});
        let wall = new Phaser.Geom.Rectangle(this.SCInfo.X,this.SCInfo.Y,this.SCInfo.VW,this.SCInfo.VH);
        gWall.strokeRectShape(wall);
    }
    
    update() {
        this.isOnGround = true;
        for(let ball of this.balls){
            if(ball.body.velocity.length() != 0){
                this.isOnGround = false;
            }
        }
        if(this.isOnGround && this.isMerge){
            this.isMerge = false;
            setTimeout(() => {
               this.MergeBalls();
            }, 200);
        }
        //往下移动
        if(this.isOnGround && this.isMoveDown){
            this.isMoveDown = false;
            this.MoveDownBricks();
            this.CreateBricks(this.SCInfo.CX, this.SCInfo.CY);
        }
    }

    reset(){
        for(let bricks of this.bricks){
            bricks.destroy();
        }
        this.bricks.length = 0;
        for(let i=1;i<this.balls.length;i++){
            this.balls[i].destroy();
        }
        //只保留第一个
        this.balls.length = 1;
        this.score = 0;
        this.scoreText.setText(`Score: ${0}`);
        //创建下一组
        this.CreateBricks(this.SCInfo.CX, this.SCInfo.CY);
    }

    startGame() {
        if(!this.guideLineHelper) return;
        let vec = this.guideLineHelper.GetStartVector();
        if (vec.length() > 0) {
            //发射球
            vec.normalize();
            vec.setLength(1000);
            this.balls[0].setVelocity(vec.x, vec.y);

            let idx = 1;
            let fire = setInterval(() => {
                if (idx >= this.balls.length) {
                    clearInterval(fire);
                    return;
                }
                let ball2 = this.balls[idx++];
                ball2.setVelocity(vec.x, vec.y);
                ball2.body.checkCollision.none = false;
            }, 500);
        }
        //清除引导线
        this.guideLineHelper.Clear();
        setTimeout(()=>{
            this.isMoveDown = true;
            this.isMerge = true;
        },100);
    }

    brickHit(ball, brick) {
        if(this.balls.indexOf(ball) >= 0
         && this.balls.indexOf(brick) >= 0){
            return;
         }
        let brickIdx = brick.getData('idx');
        if(brickIdx >=2){
            brick.setTexture('ball'+(--brickIdx));
            brick.setData('idx', brickIdx);
            return;
        }
        if(brick.getData('num') >= 1){
            this.score += brick.getData('num');
            this.scoreText.setText(`Score: ${this.score}`);
        }
 
        this.tweens.add({
            targets: brick,
            ease: 'Power1',
            scaleX: 0,
            scaleY: 0,
            angle: 180,
            duration: 500,
            delay: 250,
            onComplete: () => {
                if (brick.getData('idx') == 0) {
                    ++this.numSmallBall;
                }
                brick.destroy();
            }
        })
    }

    paddleHit(ball, paddle) {
        if(this.balls.indexOf(ball) >= 0
         && this.balls.indexOf(paddle) >= 0){
            return;
         }
        //碰到停止
        ball.setVelocity(0);
        if (ball.getData("id") == 1) {
            setTimeout(() => {
                for (let i = 0; i < this.numSmallBall; i++) {
                    //创建小球
                    this.CreateBall();
                }
                this.numSmallBall = 0;
            }, 500);
        }
    }

    DrawPathLine() {
        if (!this.isPointerDown) return;
        //范围体
        let boxs = [];
        //画布范围
        boxs.push(new Phaser.Geom.Rectangle(this.physics.world.bounds.x,
            this.physics.world.bounds.y,
            this.physics.world.bounds.width,
            this.physics.world.bounds.height));

        for (let brick of this.bricks) {
            if (!brick || !brick.active) continue;
            //绘制体的边框
            const rect = new Phaser.Geom.Rectangle(brick.x - 0.5 * brick.width, brick.y - 0.5 * brick.height, brick.width, brick.height);
            boxs.push(rect);
        }

        //引导线
        if (!this.guideLineHelper) {
            this.glineGraphics = this.add.graphics({ lineStyle: { width: 1, color: 0x0000aa }, fillStyle: { color: 0x0000aa } });
            this.guideLineHelper = new GuideLineHelper(this.glineGraphics);
        }

        this.guideLineHelper.DrawGuideLine(this.x0, this.y0, this.x1, this.y1, boxs);
    }

    CreateBall() {
        if(this.balls.length > 5){
            return;
        }
        let ball2 = this.physics.add.image(this.balls[0].x, this.balls[0].y, 'imgBalls', 1);
        ball2.setScale(0.8);
        ball2.setCollideWorldBounds(true);
        ball2.setBounce(1);
        //ball2.body.checkCollision.none = true;
        ball2.setDepth(-1);
        ball2.setData("id", this.balls.length + 1);
        this.balls.push(ball2);
    }

    CreateBricks(x, y) {
        let lucky = 1;
        if(this.score >= 10){
            lucky = 0;
        }
        if(this.balls.length >=5){
            lucky = 1;
        }
        let hard = 2;
        if(this.balls.length > 2 && this.balls.length <= 4){
            hard = 5;
        }else if(this.balls.length > 4){
            hard = 9;
        }
        for (let i = 0; i < 6; i++) {
            if (Phaser.Math.Between(1, 10) <= 6) continue;
            let brickIdx = Phaser.Math.Between(lucky, hard);
            let x2 = x + this.ballWidth * (i - 3) + this.ballWidth * 0.5;
            let y2 = y - this.SCInfo.VH * 0.5 + this.ballWidth * 0.5;
            let brick;
            if (brickIdx == 0) {
                brick = this.physics.add.image(x2, y2, 'imgBalls', 2);
                brick.setScale(0.8);
                lucky = 1;  //每行小球只有一个
            } else {
                brick = this.physics.add.image(x2, y2, 'ball' + brickIdx);
            }
            brick.setData('idx', brickIdx);
            brick.setData('num', brickIdx);
            brick.setImmovable(true);
            this.bricks.push(brick);
        }

    }

    MoveDownBricks() {
        for (let brick of this.bricks) {
            this.tweens.add({
                targets: brick,
                y: brick.y + this.ballWidth,
                duration: 500,
                ease: 'Bounce.Out',
                yoyo: false,
                loop: 0
            });
        }
    }

    MergeBalls() {
        for(let i=1;i<this.balls.length;i++){
            this.tweens.add({
                targets: this.balls[i],
                x: this.balls[0].x,
                y: this.balls[0].y,
                duration: 500,
                ease: 'Bounce.Out',
                yoyo: false,
                loop: 0
            });
        }
        
    }
}