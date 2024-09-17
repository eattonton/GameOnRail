import Phaser from "phaser"
import { CreateNumberBalls } from "../js/textures";
import SceneInit from "../js/sceneinit";
import GuideLineHelper from "../js/guideline";
import TT from "../gameconfig"

const textStyle = {
    font: 'bold 28px Arial',
    fill: '#ff0000'
}
//数字弹珠
export default class Marbles extends Phaser.Scene {
    constructor() {
        super({
            key: "Marbles"
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
    /** @type{Array<Phaser.Types.Physics.Arcade.ImageWithDynamicBody>} */
    balls = [];
    fireCount = 0;   //发射的次数
    canCreateBall = false;  //是否能创建球
    create() {
        this.SCInfo = new SceneInit(this);
        this.SCInfo.Init(400, 670, 2);

        this.paddle = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 333, 'imgPaddle').setImmovable();
        this.paddle.setOrigin(0.5, 0);
        this.paddle.setScale(10, 5);
        this.paddle.setDepth(100);
        this.paddle.setInteractive();

        //生成砖块
        this.CreateBricks();
        //创建始发球
        this.CreateBall();
       
        this.paddle.on('pointerdown', (pointer) => {
            if(!this.CheckBallStatic()) return;
            this.x0 = this.balls[this.balls.length-1].x;
            this.y0 = this.balls[this.balls.length-1].y;
            this.isPointerDown = true;
        })
       
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
        
        this.scoreText = this.add.text(this.SCInfo.CX - 200, this.SCInfo.CY - 420, "Score:0", textStyle);
        this.bestText = this.add.text(this.SCInfo.CX + 180, this.SCInfo.CY - 420, "Best:0", textStyle).setOrigin(1,0);
        TT.RestoreRecord();
        this.bestText.setText(`Best:${TT.MarbleScore}`);
        //add collision 
        this.physics.add.collider(this.balls, this.balls, this.brickHit, null, this);
        //indicate path
        let gWall = this.add.graphics({ lineStyle: { width: 5, color: 0xaa00aa }});
        let wall = new Phaser.Geom.Rectangle(this.SCInfo.X,this.SCInfo.Y,this.SCInfo.VW,this.SCInfo.VH);
        gWall.strokeRectShape(wall);
        //4.其他信息
        this.CreateTitle();
    }
    
    update() {
        if(this.canCreateBall && this.CheckBallStatic()){
            //都静止的情况 创建一个球
            this.canCreateBall = false;
            this.CreateBall();
        }
    }
 
    reset(){
        for(let i=1;i<this.balls.length;i++){
            this.balls[i].destroy();
        }
        //只保留第一个
        this.balls.length = 1;
        this.score = 0;
        this.scoreText.setText(`Score: ${0}`);
        //创建下一组
        this.CreateBricks();
    }

    startGame() {
        if(!this.guideLineHelper) return;
        ++this.fireCount;  //记录发射次数
        let vec = this.guideLineHelper.GetStartVector();
        if (vec.length() > 0 && vec.y < -10) {
            //发射球
            vec.normalize();
            vec.setLength(800);
            this.balls[this.balls.length-1].setVelocity(vec.x, vec.y);
        }
        //清除引导线
        this.guideLineHelper.Clear();
        setTimeout(()=>{
            this.canCreateBall = true;
        },40);
    }

    brickHit(ball, brick) {
        let runBall = ball;
        let staticBall = brick;
        if(brick.body.velocity.length() > 0){
            runBall = brick;
            staticBall = ball;
        }
        let id1 = runBall.getData('id');
        let id2 = staticBall.getData('id');
        if(id1 != id2){
            return;
        }
        runBall.setVelocity(0);
        staticBall.setVelocity(0);
        //碰撞的时候 球合并
        staticBall.setData('id',2*id1);
        runBall.body.checkCollision.none = true;
        if(2*id1 > 9){
            //删除
            setTimeout(()=>{
                this.tweens.add({
                    targets: [runBall,staticBall],
                    ease: 'Power1',
                    scaleX: 0,
                    scaleY: 0,
                    angle: 180,
                    duration: 200,
                    onComplete: () => {
                        runBall.destroy();
                        staticBall.destroy();
                        this.score += 2*id1;
                        this.scoreText.setText(`Score: ${this.score}`);
                    }
                })
            }, 100);
            return;
        }
        staticBall.setTexture('ball'+(2*id1));
        setTimeout(()=>{
            this.tweens.add({
                targets: runBall,
                ease: 'Bounce.Out',
                x: staticBall.x,
                y: staticBall.y,
                duration: 200,
                onComplete: () => {
                    runBall.destroy();
                }
            })
        }, 100);
        
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

        for(let i=0;i<this.balls.length-1;i++){
            let brick = this.balls[i];
            if (!brick || !brick.active) continue;
            //绘制体的边框
            const rect = new Phaser.Geom.Rectangle(brick.x - 0.5 * brick.width, brick.y - 0.5 * brick.height, brick.width, brick.height);
            boxs.push(rect);
        }

        //引导线
        if (!this.guideLineHelper) {
            this.glineGraphics = this.add.graphics({ lineStyle: { width: 1, color: 0x0000aa }, fillStyle: { color: 0x0000aa } });
            this.guideLineHelper = new GuideLineHelper(this.glineGraphics, 1);
        }
        if(this.y1 > this.y0)
        {   
            this.guideLineHelper.DrawGuideLine(this.x0, this.y0, this.x1, this.y1, boxs);
        }
    }

    CreateBall() {
        let idx = Phaser.Math.Between(1, 5);
        //创建一个始发球
        let ball = this.physics.add.image(this.SCInfo.CX, this.SCInfo.CY + 390, 'ball'+idx);
        ball.setCircle(30);
        ball.setCollideWorldBounds(true);
        ball.setBounce(0.8);
        //ball.setInteractive();
        ball.body.setDrag(100);
        ball.setData("id", idx);
        //添加到队列中
        this.balls.push(ball);
    }

    CreateBricks() {
        for(let j=0;j<10;j++){
            let numBrick = 0;
            for (let i = 0; i < 2; i++) {
                let idx = Phaser.Math.Between(1, 5);
                let x2 = this.SCInfo.CX + 200*Phaser.Math.Between(0, 100)/100;
                let y2 = this.SCInfo.CY + 300*Phaser.Math.Between(-100, 50)/100;
                if(this.CheckBallCollision(x2,y2)) continue;
                let brick = this.physics.add.image(x2, y2, 'ball' + idx);
                brick.setCircle(30);
                brick.setBounce(0.8);
                brick.setDrag(1000);
                brick.setCollideWorldBounds(true);
                brick.setData('id', idx);
               // brick.setImmovable(true);
                this.balls.push(brick);
                ++numBrick;
            }
            if(numBrick>0){
                break;
            }
        }
        
    }
  
    CheckBallStatic(){
        //判断球是否静止了
        for(let b of this.balls){
            if(b.active && b.body.velocity.length() > 0){
                return false;
            }
        }
        return true;
    }

    CreateTitle() {
        let text = this.add.text(this.SCInfo.CX, this.SCInfo.CY - 500, '二头乌游戏\n 数字弹珠', { fontFamily: '微软雅黑', fontSize: '45px', fill: '#000' });
        text.setOrigin(0.5);
    }

    CheckBallCollision(x,y){
        //判断球与当前列表中的球是否有碰靠
        for(let b of this.balls){
            let dist = Phaser.Math.Distance.Between(x, y, b.x, b.y);
            if(dist < 60){
                return true;
            }
        }
        return false;
    }
}