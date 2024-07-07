import Phaser from "phaser";
import TT from "../gameconfig";
import { TBCell, TBTable } from "../js/table";
import { RandomInt, GetRandQueue, SegmentsIntersect } from "../js/math";
import TimerAnimation from "../js/timer";

//HS路径
class HSPath {

}

//单元格
class HSCell extends TBCell {
    /** @type {number} 桥编号 */
    BridgeId = -1;
    /** @type {number} 连接的桥的数量 */
    BridgeNum = 0;
    /** @type{Phaser.GameObjects.Sprite} */
    SpriteCell = null;

    IsBridgeNum = false;

    constructor(id) {
        super(id);
    }

    CheckBridgeNum(userNum) {
        if (this.BridgeId < 0) {
            return true;
        }
        this.IsBridgeNum = false;
        if (this.BridgeNum == userNum) {
            this.IsBridgeNum = true;
        }
        return this.IsBridgeNum;
    }
}

//棋盘对象
class HSTable extends TBTable {
    /** @type{Array<Array<number>>} 存储的路径*/
    m_Paths = [];

    constructor(col, row) {
        super(col, row);

        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                this.m_Cells.push(new HSCell(index));
            }
        }
    }

    /**
     * 创建第一条路径
     */
    CreatePaths() {
        //创建主路径
        let iStart = RandomInt(0, this.GetSize() - 1);
        this.m_Paths = [];
        this.m_Paths.push([iStart]);
        //开始计算下一步
        this.NextStep(this.m_Paths[0][0], RandomInt(7, 10));
        //创建分支
        let idxArr = GetRandQueue(null, this.m_Paths[0].length - 2);
        for (let idx of idxArr) {
            if (RandomInt(0, 2) != 0) {
                continue;
            }
            this.BranchPath(idx);
            if (this.m_Paths[this.m_Paths.length - 1].length <= 1) {
                this.m_Paths.pop();
            }
        }

    }

    NextStep(idx0, num) {
        let idx2 = this.FindNext(idx0);
        if (idx2 >= 0) {
            this.m_Paths[this.m_Paths.length - 1].push(idx2);
            if (this.m_Paths[this.m_Paths.length - 1].length >= num) return;
            this.NextStep(idx2, num);
        }
    }

    BranchPath(idx) {
        //主路径上的一个位置
        let iStart = this.m_Paths[0][idx];
        this.m_Paths.push([iStart]);
        this.NextStep(this.m_Paths[this.m_Paths.length - 1][0], RandomInt(2, 4));
    }
    /**
     * 是不是已经在路径上
     * @param {*} index 
     * @returns 
     */
    CheckInPath(index) {
        for (let pt of this.m_Paths) {
            if (pt.indexOf(index) >= 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 是不是在路径中间
     * @param {*} index 
     */
    CheckOnPaths(index) {
        let [posX, posY] = this.GetColRowByIndex(index);
        let lastPts = this.m_Paths[this.m_Paths.length - 1];
        let [posX2, posY2] = this.GetColRowByIndex(lastPts[lastPts.length - 1]);
        for (let pt of this.m_Paths) {
            for (let i = 1; i < pt.length; i++) {
                let [staX, staY] = this.GetColRowByIndex(pt[i - 1]);
                let [endX, endY] = this.GetColRowByIndex(pt[i]);
                if (SegmentsIntersect([posX, posY], [posX2, posY2], [staX, staY], [endX, endY])) {
                    return true;
                } else {
                    //判断是不是共线 相交
                    if ((posX2 - staX) * (posX - staX) < 0
                        || (posX2 - endX) * (posX - endX) < 0
                        || (posX - staX) * (posX - endX) < 0) {
                        return true;
                    }
                    if ((posY2 - staY) * (posY - staY) < 0
                        || (posY2 - endY) * (posY - endY) < 0
                        || (posY - staY) * (posY - endY) < 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 查找下一步
     * @param {*} idx0 
     * @returns 
     */
    FindNext(idx0) {
        let arrStep = GetRandQueue(null, 3);
        for (let iStep of arrStep) {
            let arrNearCells = this.GetNearCells(idx0, iStep + 2);
            let arrIdx = GetRandQueue(null, arrNearCells.length);
            for (let idx2 of arrIdx) {
                let c1 = arrNearCells[idx2];
                //判断有效性
                if (!this.CheckInPath(c1.Index)
                    && !this.CheckOnPaths(c1.Index)) {
                    return c1.Index;
                }
            }

        }

        return -1;
    }

    /**
     * 点击位置 选择的路径
     * @param {number} idx0 
     * @returns 
     */
    GetCrossRange(idx0) {
        if (this.CheckInPath(idx0)) {
            return [[], []];
        }
        let that = this;
        function goToNext(x1, y1, arrT) {
            let c1 = that.At(x1, y1);
            if (c1 == null) { arrT.length = 0; return -1; }
            let idx1 = that.GetIndexByColRow(x1, y1);
            arrT.push(idx1);
            if (that.CheckInPath(idx1)) { return -1; }
            return idx1;
        }

        let [x0, y0] = this.GetColRowByIndex(idx0);
        let arrX = [];
        for (let i = 0; i < this.m_NumCol; i++) {
            //往左找
            if (goToNext(x0 - i, y0, arrX) == -1) {
                break;
            }
        }
        if (arrX.length > 0) {
            for (let i = 1; i < this.m_NumCol; i++) {
                //往右找
                if (goToNext(x0 + i, y0, arrX) == -1) {
                    break;
                }
            }
        }
        let arrY = [];
        for (let i = 0; i < this.m_NumRow; i++) {
            //往左找
            if (goToNext(x0, y0 - i, arrY) == -1) {
                break;
            }
        }
        if (arrY.length > 0) {
            for (let i = 1; i < this.m_NumRow; i++) {
                //往右找
                if (goToNext(x0, y0 + i, arrY) == -1) {
                    break;
                }
            }
        }
        return [arrX, arrY];
    }

    IsSuccess(numPath) {
        //1.数量是否正确
        let isOk = true;
        for (let c1 of this.m_Cells) {
            if (c1.BridgeId >= 0 && !c1.IsBridgeNum) {
                isOk = false;
                break;
            }
        }
        //2.桥数量
        let num0 = 0;
        for (let pt of this.m_Paths) {
            num0 += pt.length - 1;
        }
        if (numPath != num0) {
            isOk = false;
        }
        return isOk;
    }

    static CreateTableData(col, row) {
        let tb = new HSTable(col, row);
        do{
            tb.CreatePaths();
        }while(tb.m_Paths.length <=1)
        let bridgeId = 0;
        for (let pt of tb.m_Paths) {
            for (let i = 0; i < pt.length; i++) {
                let c1 = tb.At(pt[i]);
                if (i < pt.length - 1) {
                    let c2 = tb.At(pt[i + 1]);
                    let num1 = RandomInt(1, 2);
                    c1.BridgeNum += num1;
                    c2.BridgeNum += num1;
                }

                if (c1.BridgeId < 0) {
                    c1.BridgeId = bridgeId++;
                }

            }
        }

        return tb;
    }

}

//数桥
export default class HaShi extends Phaser.Scene {
    constructor() {
        super({
            key: 'HaShi'
        })
    }

    preload() {
        this.createBtnTexture();
    }

    createBtnTexture() {
        let r = 42.5;
        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 6 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillCircle(r, r, 0.8 * r);
        g1.strokeCircle(r, r, 0.8 * r);
        g1.generateTexture('btnTextureHS', 2.0 * r, 2.0 * r);
        g1.destroy();
    }
    /** @type{number} */
    m_NumCol = 10;
    /** @type {number} */
    m_NumRow = 10;
    /** @type{number} */
    m_SizeCell = 85;
    /** @type {Phaser.GameObjects.Container} */
    m_ObjContainer;
    /** @type {HSTable} */
    m_Table;
    /** @type {object} 记录路径的值*/
    m_BridgeOfPath = {};
    /** 图字典 */
    m_DictSprite = {};
    /** @type {TimerAnimation} */
    m_Timer;

    create() {
        let CenterX = this.scale.width / 2.0;
        let CenterY = this.scale.height / 2.0;
        this.cameras.main.setZoom(1.3);
        //1.绘制
        this.m_ObjContainer = this.add.container(CenterX - 300, CenterY - 500);
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                let boxX = this.m_SizeCell * j;
                let boxY = this.m_SizeCell * i;
                //绘制
                this.m_ObjContainer.add(this.DrawBridgeByRow(index, boxX, boxY));
                this.m_ObjContainer.add(this.DrawBridgeByCol(index, boxX, boxY));
                this.m_ObjContainer.add(this.DrawOneBlock(index, boxX, boxY));
            }
        }
        //2.生成数据
        this.Reset();
        //3.辅助功能
        this.CreatTimeCard(CenterX, CenterY);
        this.CreateButtons(CenterX, CenterY);
        //4.其他信息
        this.CreateTitle(CenterX, CenterY);
    }

    DrawOneBlock(index, posx, posy) {
        let boxA = this.add.container(posx, posy);
        let s1 = this.add.sprite(0, 0, 'btnTextureHS').setOrigin(0);
        s1.setInteractive();
        s1.NNIndex = index;
        this.m_DictSprite[s1.NNIndex] = s1;
        boxA.add(s1);
        //text
        let text = this.add.text(s1.width * 0.5, s1.height * 0.5, '', { fontFamily: '微软雅黑', fontSize: '42px', fill: '#000' });
        text.setOrigin(0.5);
        //text.setVisible(false);
        text.NNIndex = index;
        boxA.add(text);
        boxA.NNIndex = index;
        boxA.setVisible(false);
        return boxA;
    }

    DrawBridgeByRow(index, posx, posy) {
        let s1 = this.add.sprite(posx, posy + 50, 'imgBridges', 0).setOrigin(0, 1);
        s1.setInteractive();
        s1.NNIndex = 1000 + index;
        this.m_DictSprite[s1.NNIndex] = s1;
        s1.on('pointerdown', (pt, x, y, evt) => {
            this.OnMouseDown(s1);
        });
        return s1;
    }

    DrawBridgeByCol(index, posx, posy) {
        let s1 = this.add.sprite(posx + 50, posy, 'imgBridges', 0).setOrigin(0);
        s1.setAngle(90);
        s1.setInteractive();
        s1.NNIndex = 2000 + index;
        this.m_DictSprite[s1.NNIndex] = s1;
        s1.on('pointerdown', (pt, x, y, evt) => {
            this.OnMouseDown(s1);
        });
        return s1;
    }

    /**
     * 
     * @param {Phaser.GameObjects.Sprite} s1 
     */
    OnMouseDown(s1) {
        //1.获得十字范围
        let [arrX, arrY] = this.m_Table.GetCrossRange(s1.NNIndex % 1000);
        if (arrX.length > 0) {
            arrX.sort((a, b) => a - b);
            arrX.forEach((value, index, array) => {
                array[index] = value + 1000;
            });
            this.SetPaths(arrX);
            this.CheckAllBridgeNum();
            return;
        }

        if (arrY.length > 0) {
            arrY.sort((a, b) => a - b);
            arrY.forEach((value, index, array) => {
                array[index] = value + 2000;
            });
            this.SetPaths(arrY);
            this.CheckAllBridgeNum();
            return;
        }
    }

    /**
     * 设置路径
     * @param {Array<number>} arrT 
     * @returns 
     */
    SetPaths(arrT) {
        let bridgeNum = 0;
        for (let i = 1; i < arrT.length - 1; i++) {
            let idx = arrT[i];
            this.m_DictSprite[idx].setFrame((this.m_DictSprite[idx].frame.name + 1) % 3);
            bridgeNum = this.m_DictSprite[idx].frame.name;
        }

        //进行记录
        let k = (arrT[0] % 1000) + "," + (arrT[arrT.length - 1] % 1000);
        this.m_BridgeOfPath[k] = bridgeNum;
    }

    CheckAllBridgeNum() {
        let numOfBridge = {};
        let numOfPath = 0;
        for (let k in this.m_BridgeOfPath) {
            let [idx1, idx2] = k.split(",");
            [idx1, idx2] = [parseInt(idx1), parseInt(idx2)];
            if (!numOfBridge.hasOwnProperty(idx1)) {
                numOfBridge[idx1] = 0;
            }
            if (!numOfBridge.hasOwnProperty(idx2)) {
                numOfBridge[idx2] = 0;
            }
            numOfBridge[idx1] += this.m_BridgeOfPath[k];
            numOfBridge[idx2] += this.m_BridgeOfPath[k];
            if (this.m_BridgeOfPath[k] > 0) {
                ++numOfPath;
            }
        }
        for (let k in numOfBridge) {
            //如果数量相等
            let c1 = this.m_Table.At(k);
            c1.SpriteCell.setTint(0xffffff);
            if (c1.CheckBridgeNum(numOfBridge[k])) {
                c1.SpriteCell.setTint(0x00ffee);
            }
        }

        if (this.m_Table.IsSuccess(numOfPath)) {
            console.log("Success_1");
            for (let k in numOfBridge) {
                //如果数量相等
                let c1 = this.m_Table.At(k);
                c1.SpriteCell.setTint(0x00ff00);
            }
        }
    }

    Reset() {
        if(this.m_Timer) this.m_Timer.Reset();
        this.m_Table = HSTable.CreateTableData(this.m_NumCol, this.m_NumRow);
        //格式化棋盘
        this.m_ObjContainer.each((child) => {
            if (child instanceof Phaser.GameObjects.Container) {
                let c1 = this.m_Table.At(child.NNIndex);
                child.setVisible(false);
                if (c1.BridgeNum > 0) {
                    child.setVisible(true);
                }
                child.each((item) => {
                    if (item instanceof Phaser.GameObjects.Sprite) {
                        c1.SpriteCell = item;
                        c1.SpriteCell.setTint(0xffffff);
                    } else if (item instanceof Phaser.GameObjects.Text) {
                        item.setText(`${c1.BridgeNum}`);
                    }
                })
            }
        })
        //重置路径
        for(let k in this.m_DictSprite){
            if(k >= 1000){
                this.m_DictSprite[k].setFrame(0);
            } 
        }
        this.m_BridgeOfPath = {};
        //还原颜色
        //this.m_Table.ResetSpriteColor();
    }

    CreatTimeCard(x, y) {
        this.m_Timer = new TimerAnimation();
        this.m_Timer.CreatTimeCard(this, x, y - 720);
    }

    CreateButtons(x, y) {
        //重新开始
        let btnReset = this.add.sprite(x - 200, y + 600, 'imgBtns', 2).setOrigin(0);
        btnReset.setInteractive();
        btnReset.on('pointerdown', () => {
            this.Reset();
        })
        //菜单
        // let btnMenu = this.add.sprite(x + 200, y + 600, 'imgBtns', 3).setOrigin(0);
        // btnMenu.setInteractive();
        // btnMenu.on('pointerdown', () => {
        //     this.scene.start("Menu");
        // })
    }

    CreateTitle(x,y){
        let text = this.add.text(x-250,y-900, '《二头乌游戏--数桥》', { fontFamily: '微软雅黑', fontSize: '82px', fill: '#000' });
    }

}