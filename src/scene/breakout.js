import Phaser from "phaser"
import { CreateNumberBalls } from "../js/textures";
import SceneInit from "../js/sceneinit";
import GuideLineHelper from "../js/guideline";
import TT from "../gameconfig"

const textStyle = {
    font: 'bold 28px Arial',
    fill: '#ff0000'
}

//打数字砖块
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
    ballScale = 0.6;
    /** @type {Phaser.GameObjects.Line} */
    guideLines = [];
    bricks = [];
    /** @type{Array<Phaser.Types.Physics.Arcade.ImageWithDynamicBody>} */
    balls = [];
    numSmallBall = 0; //拾取的小球数量
    isOnGround = true;  //判断球是不是 都在 地上
    isMoveDown = false;  //是否往下移动
    isMerge = false;     //是否合并
    fireCount = 0;   //发射的次数
    create() {
        this.SCInfo = new SceneInit(this);
        this.SCInfo.Init(400, 670, 2);

        this.paddle = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 333, 'imgPaddle').setImmovable();
        this.paddle.setOrigin(0.5, 0);
        this.paddle.setScale(10, 5);
        this.paddle.setDepth(100);
        this.paddle.setInteractive();

        let ball = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 390, 'imgBalls', 0);
        ball.setScale(this.ballScale);
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        //ball.setInteractive();
        ball.setData("id", 1);
        ball.setData("ground", true);
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

        this.scoreText = this.add.text(this.SCInfo.CX - 200, this.SCInfo.CY - 420, "Score:0", textStyle);
        this.bestText = this.add.text(this.SCInfo.CX + 180, this.SCInfo.CY - 420, "Best:0", textStyle).setOrigin(1,0);
        TT.RestoreRecord();
        this.bestText.setText(`Best:${TT.BreakoutScore}`);
        //add collision 
        this.physics.add.collider(this.balls, this.bricks, this.brickHit, null, this);
        this.physics.add.collider(this.balls, this.paddle, this.paddleHit, null, this);
        this.physics.add.overlap(this.bricks, this.paddle, ()=>{
            //游戏结束
            if(this.score > TT.BreakoutScore){
                TT.BreakoutScore = this.score;
                this.bestText.setText(`Best:${TT.BreakoutScore}`);
                TT.SaveRecord();
            }
            this.reset();
        }, null, this);
        //indicate path
        let gWall = this.add.graphics({ lineStyle: { width: 5, color: 0xaa00aa }});
        let wall = new Phaser.Geom.Rectangle(this.SCInfo.X,this.SCInfo.Y,this.SCInfo.VW,this.SCInfo.VH);
        gWall.strokeRectShape(wall);
        //4.其他信息
        this.CreateTitle();
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
        ++this.fireCount;  //记录发射次数
        let vec = this.guideLineHelper.GetStartVector();
        if (vec.length() > 0 && vec.y < -10) {
            //发射球
            vec.normalize();
            vec.setLength(800);
            this.balls[0].setVelocity(vec.x, vec.y);
            this.balls[0].setData("ground", false);
            let idx = 1;
            let fire = setInterval(() => {
                if (idx >= this.balls.length) {
                    clearInterval(fire);
                    return;
                }
                let ball2 = this.balls[idx++];
                ball2.setVelocity(vec.x, vec.y);
                ball2.body.checkCollision.none = false;
                ball2.setData("ground", false);
            }, 50);
        }
        //清除引导线
        this.guideLineHelper.Clear();
        setTimeout(()=>{
            this.isMoveDown = true;
            this.isMerge = true;
        },40);
    }

    brickHit(ball, brick) {
        if(this.balls.indexOf(ball) >= 0
         && this.balls.indexOf(brick) >= 0){
            return;
         }
        if(ball.getData("ground")){
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
        if (brick.getData('idx') == 0) {
            brick.setData('idx',-1);
            //增加小球
            ++this.numSmallBall;
        }
        this.tweens.add({
            targets: brick,
            ease: 'Power1',
            scaleX: 0,
            scaleY: 0,
            angle: 180,
            duration: 400,
            onComplete: () => {
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
        ball.setData('ground', true);
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
        if(this.y1 > this.y0)
        {   
            this.guideLineHelper.DrawGuideLine(this.x0, this.y0, this.x1, this.y1, boxs);
        }
    }

    CreateBall() {
        if(this.balls.length > 5){
            return;
        }
        let ball2 = this.physics.add.image(this.balls[0].x, this.balls[0].y, 'imgBalls', 1);
        ball2.setScale(this.ballScale);
        ball2.setCollideWorldBounds(true);
        ball2.setBounce(1);
        //ball2.body.checkCollision.none = true;
        ball2.setDepth(-1);
        ball2.setData("id", this.balls.length + 1);
        ball2.setData("ground", true);
        this.balls.push(ball2);
    }

    CreateBricks(x, y) {
        let lucky = 1;
        let numRow = 8;
        if(this.score >= 10){
            if(this.fireCount%5 == 0) lucky = 0;
            numRow = 6;
        }
        if(this.score > 400){
            numRow = 4;
        }
        let hard = 2;
        if(this.balls.length > 2 && this.balls.length <= 4){
            hard = 9;
        }else if(this.balls.length > 4){
            lucky = 4;
            hard = 9;
        }
        for(let j=0;j<10;j++){
            let numNew = 0;
            for (let i = 0; i < 6; i++) {
                if (Phaser.Math.Between(1, 10) <= numRow) continue;
                ++numNew;
                let brickIdx = Phaser.Math.Between(lucky, hard);
                let x2 = x + this.ballWidth * (i - 3) + this.ballWidth * 0.5;
                let y2 = y - this.SCInfo.VH * 0.5 + this.ballWidth * 0.5;
                let brick;
                if (brickIdx == 0) {
                    brick = this.physics.add.image(x2, y2, 'imgBalls', 2);
                    brick.setScale(this.ballScale);
                    lucky = 1;  //每行小球只有一个
                } else {
                    brick = this.physics.add.image(x2, y2, 'ball' + brickIdx);
                }
                brick.setData('idx', brickIdx);
                brick.setData('num', brickIdx);
                brick.setImmovable(true);
                this.bricks.push(brick);
            }

            if(numNew > 0){
                break;
            }
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

    CreateTitle() {
        let text = this.add.text(this.SCInfo.CX, this.SCInfo.CY - 500, '二头乌游戏\n 打数字块', { fontFamily: '微软雅黑', fontSize: '45px', fill: '#000' });
        text.setOrigin(0.5);
    }
}