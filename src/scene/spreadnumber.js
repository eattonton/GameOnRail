import Phaser from "phaser";
import TT from "../gameconfig";
import { TBCell, TBTable } from "../js/table";
import { RandomInt, GetRandQueue, SegmentsIntersect } from "../js/math";
import TimerAnimation from "../js/timer";

//单元格
class SNCell extends TBCell {
    /** @type {number} 连接的桥的数量 */
    ShowNum = 0;
    /** @type{Phaser.GameObjects.Sprite} */
    SpriteCell = null;

    constructor(id) {
        super(id);
    }

}

//棋盘对象
class SNTable extends TBTable {

    constructor(col, row) {
        super(col, row);

        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                this.m_Cells.push(new SNCell(index));
            }
        }
    }

    /**
     * 添加两个数字
     */
    AddTwoNumber() {
        let idxArr = GetRandQueue(null, this.GetSize());
        let inum = 0;
        let iFilledNum = 0;
        for (let idx of idxArr) {
            let c1 = this.At(idx);
            if (c1.ShowNum == 0 && inum < 2) {
                c1.ShowNum = RandomInt(2, 9);
                ++inum;
            }
            else if (c1.ShowNum > 0) {
                ++iFilledNum;
            }
        }

        if ((iFilledNum + inum) >= this.GetSize()) {
            //已经被填充满了
            return false;
        }

        if (inum == 2) {
            //成功添加
            return true;
        }

        return false;
    }

    /**
     * 根据路径清除数字
     * @param {*} path 
     */
    ClearByPath(path) {
        let score = 0;
        //清除1
        for (let idx of path) {
            let c1 = this.At(idx);
            if (c1.ShowNum == 1) {
                let idxNears1 = this.GetSameNumberAtNear(c1.ShowNum, [idx]);
                if (idxNears1.length > 0) {
                    for (let idxNear1 of idxNears1) {
                        let cnear = this.At(idxNear1);
                        score += cnear.ShowNum;
                        cnear.ShowNum = 0;
                    }
                    ++score;
                    c1.ShowNum = 0;
                }
            }
        }

        //清除临近的同数值
        let idxE = path[path.length - 1];
        let cEnd = this.At(idxE);
        let idxNears = this.GetSameNumberAtNear(cEnd.ShowNum, path);
        for (let idx of idxNears) {
            let cnear = this.At(idx);
            score += cnear.ShowNum;
            cnear.ShowNum = 0;
        }
        if (cEnd && idxNears.length > 0) {
            score += cEnd.ShowNum;
            cEnd.ShowNum = 0;
        }

        return score;
    }

    /**
     * 获得临近 相同的值的 路径
     */
    GetSameNumberAtNear(num1, path) {
        let resArr = [];
        if (path.length == 0) {
            return resArr;
        }
        let idx = path[path.length - 1];
        let nearArr = this.GetNearCells(idx);
        for (let c2 of nearArr) {
            if (c2.ShowNum == num1 && path.indexOf(c2.Index) == -1) {
                resArr.push(c2.Index);
                let arr2 = this.GetSameNumberAtNear(num1, [].concat(path, resArr));
                if (arr2.length > 0) {
                    resArr.push(...arr2);
                }
            }
        }
        return resArr;
    }

    static CreateTableData(col, row) {
        let tb = new SNTable(col, row);
        //添加两个数字
        tb.AddTwoNumber();
        return tb;
    }
}

//数字消除
export default class SpreadNumbers extends Phaser.Scene {
    constructor() {
        super({
            key: 'SpreadNumbers'
        })
    }

    preload() {
        this.createBtnTexture();
    }

    createBtnTexture() {
        let r = 46;
        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 6 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillCircle(r, r, 0.8 * r);
        g1.strokeCircle(r, r, 0.8 * r);
        g1.generateTexture('btnTextureSN', 2.0 * r, 2.0 * r);
        g1.destroy();
    }
    /** @type{number} */
    m_NumCol = 6;
    /** @type {number} */
    m_NumRow = 6;
    /** @type{number} */
    m_SizeCell = 85;
    /** @type {Phaser.GameObjects.Container} */
    m_ObjContainer;
    /** 图字典 */
    m_DictSprite = {};
    /** @type {SNTable} */
    m_Table;

    /** @type {boolean} */
    m_IsTouchDown = false;
    /** @type {number} 点击数量*/
    m_PointerNumber = 0;

    /** @type {number} */
    m_DownIndex = -1;
    /** @type {number} */
    m_MoveIndex = -1;

    /** @type {number} */
    m_Score = 0;

    /** @type {Array<number>} 选择时的路径*/
    m_SelPath = [];

    /** @type {number} 选择时颜色*/
    m_SelectColor = 0x00ff00;

    /** @type {TimerAnimation} */
    m_Timer;

    /** @type {number} 按下的数字*/
    m_CurrentNumber = 0;

    /** @type {Phaser.GameObjects.Group} */
    m_TextGroup;

    create() {
        let CenterX = this.scale.width / 2.0;
        let CenterY = this.scale.height / 2.0;
        let boardW = (this.m_NumRow + 2) * this.m_SizeCell;
        //this.cameras.main.setZoom(1.0);
        //1.绘制
        this.m_ObjContainer = this.add.container(CenterX - 0.5 * boardW, CenterY - boardW + 200);
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                let boxX = this.m_SizeCell * j;
                let boxY = this.m_SizeCell * i;
                //绘制
                this.m_ObjContainer.add(this.DrawOneBlock(index, boxX, boxY));
            }
        }
        this.m_ObjContainer.setScale(2);

        //3.事件
        this.input.on('pointerup', (pointer) => {
            this.OnMouseUp(this.m_MoveIndex);
        });

        //4.其他信息
        this.CreateButtons(CenterX, CenterY);
        this.CreateTitle(CenterX, CenterY);
        this.CreateOtherInfo(CenterX, CenterY);
        //重置表格
        this.Reset();

    }

    DrawOneBlock(index, posx, posy) {
        let boxA = this.add.container(posx, posy);
        let s1 = this.add.sprite(0, 0, 'btnTextureSN').setOrigin(0);
        s1.setInteractive();
        s1.NNIndex = index;
        this.m_DictSprite[s1.NNIndex] = s1;
        s1.on('pointerdown', (pt, x, y, evt) => {
            this.m_DownIndex = s1.NNIndex;
            this.OnMouseDown(s1);
        });
        s1.on('pointerover', (pt, x, y, evt) => {
            this.OnMouseMove(s1.NNIndex);
        });
        s1.on('pointerup', (pt, x, y, evt) => {
            this.OnMouseUp(s1.NNIndex);
        })
        boxA.add(s1);
        //text
        let text = this.add.text(s1.width * 0.5, s1.height * 0.5, '', { fontFamily: '微软雅黑', fontSize: '42px', fill: '#000' });
        text.setOrigin(0.5);
        //text.setVisible(false);
        text.NNIndex = index;
        s1.NNText = text;
        boxA.add(text);
        boxA.NNIndex = index;
        //boxA.setVisible(false);
        return boxA;
    }

    Reset() {
        this.m_Table = SNTable.CreateTableData(this.m_NumCol, this.m_NumRow);
        for (let k in this.m_DictSprite) {
            let s1 = this.m_DictSprite[k];
            let c1 = this.m_Table.At(s1.NNIndex);
            c1.SpriteCell = s1;
            if (c1.ShowNum > 0) {
                c1.SpriteCell.NNText.setText(`${c1.ShowNum}`);
            }
            else {
                c1.SpriteCell.NNText.setText('');
            }
        }
        //初始值
        this.m_CurrentNumber = 0;
        this.m_DownIndex = -1;
        this.m_MoveIndex = -1;
        this.m_Score = 0;
        //设置分数
        this.SetTextInfo(-1, -1, -1);
    }

    CreateButtons(x, y) {
        //重新开始
        let btnReset = this.add.sprite(x - 250, y + 650, 'imgBtns', 2).setOrigin(0);
        btnReset.setInteractive();
        btnReset.on('pointerdown', () => {
            this.Reset();
        })
        //菜单
        let btnMenu = this.add.sprite(x + 250, y + 650, 'imgBtns', 3).setOrigin(0);
        btnMenu.setInteractive();
        btnMenu.on('pointerdown', () => {
            this.scene.start("Menu", "SpreadNumbers");
        })
    }

    CreateTitle(x, y) {
        let text = this.add.text(x - 60, y - 1150, '二头乌游戏\n 数字消消', { fontFamily: '微软雅黑', fontSize: '100px', fill: '#000' });
    }

    CreateOtherInfo(x, y) {
        this.m_TextGroup = this.add.group(0, 0);
        //当前数字
        let text0 = this.add.text(x + 50, y - 750, '', { fontFamily: '微软雅黑', fontSize: '70px', fill: '#ff0000' });
        this.m_TextGroup.add(text0);

        let text1 = this.add.text(x - 250, y - 780, '分数', { fontFamily: '微软雅黑', fontSize: '70px', fill: '#ff0000' });
        this.m_TextGroup.add(text1);

        let text2 = this.add.text(x + 280, y - 780, '最高分', { fontFamily: '微软雅黑', fontSize: '70px', fill: '#ff0000' });
        this.m_TextGroup.add(text2);
    }

    SetColorByPath() {
        for (let k in this.m_DictSprite) {
            let s1 = this.m_DictSprite[k];
            if (this.m_SelPath.indexOf(s1.NNIndex) >= 0) {
                //路径颜色
                s1.setTint(this.m_SelectColor);
            }
            else {
                s1.setTint(0xffffff);
            }
        }
    }

    SetTextByPath(isOk) {
        let inum = 0;
        //显示路径
        for (let idx of this.m_SelPath) {
            let c1 = this.m_Table.At(idx);
            let nowNum = 1;
            if (inum == this.m_SelPath.length - 1) {
                nowNum = this.m_CurrentNumber - inum;
            }
            c1.SpriteCell.NNText.setText(`${nowNum}`);
            if (isOk) {
                c1.ShowNum = nowNum;
            }
            ++inum;
        }
        //显示其他
        for (let k in this.m_DictSprite) {
            let s1 = this.m_DictSprite[k];
            if (this.m_SelPath.indexOf(s1.NNIndex) >= 0) {
                continue;
            }

            let c1 = this.m_Table.At(s1.NNIndex);
            if (c1.ShowNum > 0) {
                c1.SpriteCell.NNText.setText(`${c1.ShowNum}`);
            }
            else {
                c1.SpriteCell.NNText.setText('');
            }
        }
    }

    SetNearColorByPath() {
        if (this.m_SelPath.length > 1) {
            let num1 = this.m_CurrentNumber - this.m_SelPath.length + 1;
            let cellNear = this.m_Table.GetSameNumberAtNear(num1, this.m_SelPath);
            for (let idxNear of cellNear) {
                let cnear = this.m_Table.At(idxNear);
                if (cnear) {
                    cnear.SpriteCell.setTint(0xf1ff00);
                }
            }
        }
    }

    OnMouseDown(s1) {
        let c1 = this.m_Table.At(this.m_DownIndex);
        if (c1.ShowNum <= 0) return;
        this.m_IsTouchDown = true;
        this.m_SelPath.push(c1.Index);
        this.m_CurrentNumber = c1.ShowNum;
        this.m_MoveIndex = this.m_DownIndex;
        //设置颜色
        s1.setTint(this.m_SelectColor);
    }

    OnMouseMove(idx) {
        if (!this.m_IsTouchDown) return;
        let c1 = this.m_Table.At(idx);
        if (c1.ShowNum > 0 && idx != this.m_DownIndex) {
            //除了本身，带数字的格子 不能占
            return;
        }
        let idxOfPath = this.m_SelPath.indexOf(c1.Index);
        if (idxOfPath >= 0 && this.m_MoveIndex != this.m_DownIndex) {
            //去掉后面的 记录
            this.m_SelPath.splice(idxOfPath);
            if (this.m_SelPath.length > 0) {
                this.m_MoveIndex = this.m_SelPath[this.m_SelPath.length - 1];
            }
        }
        if (this.m_SelPath.length >= this.m_CurrentNumber) return;
        let idx0 = this.m_MoveIndex;
        if (this.m_SelPath.length > 1) {
            idx0 = this.m_SelPath[this.m_SelPath.length - 1];
        }
        let [x, y] = this.m_Table.GetColRowByIndex(idx0);
        let [x2, y2] = this.m_Table.GetColRowByIndex(idx);
        if (this.m_SelPath.length == 0 || this.IsNeighbor(x, y, x2, y2)) {
            this.m_MoveIndex = idx;
            this.m_SelPath.push(c1.Index);
        }
        this.SetColorByPath();
        this.SetTextByPath(false);
        //提示数值
        if (this.m_SelPath.length > 0) {
            let num2 = this.m_CurrentNumber - this.m_SelPath.length + 1;
            this.SetTextInfo(num2);
            //高亮周边
            this.SetNearColorByPath();
        }

    }

    OnMouseUp(x, y) {
        if (!this.m_IsTouchDown) return;
        this.m_IsTouchDown = false;
        //设置路径 并记录
        this.SetTextByPath(true);
        //根据路径 清除 数字 1 和 相邻同数 并记分
        if (this.m_SelPath.length >= 2) {
            this.m_Score += this.m_Table.ClearByPath(this.m_SelPath);
            //添加
            if (!this.m_Table.AddTwoNumber()) {
                //添加失败
                console.log("游戏结束");
                if (this.m_Score > TT.SpreadNumberScore) {
                    TT.SpreadNumberScore = this.m_Score;
                    TT.SaveRecord();
                }
            }
        }
        this.m_SelPath.length = 0;
        this.m_CurrentNumber = 0;
        //设置颜色
        this.SetTextByPath(false);
        this.SetColorByPath();
        //设置信息
        this.SetTextInfo(-1, this.m_Score);
    }

    update() {

    }

    IsNeighbor(x1, y1, x2, y2) {
        if (x1 == x2 && Math.abs(y1 - y2) == 1) {
            return true;
        }
        if (Math.abs(x1 - x2) == 1 && y1 == y2) {
            return true;
        }
        return false;
    }

    SetTextInfo(num0, num1, num2 = -1) {
        if (!this.m_TextGroup || this.m_TextGroup.getChildren().length < 3) return;
        if (num0 > 0) {
            let text0 = this.m_TextGroup.getChildren()[0];
            text0.setText(`${num0}`);
            let s1 = this.m_DictSprite[this.m_MoveIndex];
            if (s1) {
                text0.setOrigin(0.5, 0.5);
                let x0 = s1.parentContainer.x * s1.parentContainer.parentContainer.scale + s1.parentContainer.parentContainer.x;
                let y0 = s1.parentContainer.y * s1.parentContainer.parentContainer.scale + s1.parentContainer.parentContainer.y;
                text0.setPosition(x0, y0);
            }
        } else {
            this.m_TextGroup.getChildren()[0].setText('');
        }

        if (num1 >= 0) {
            this.m_TextGroup.getChildren()[1].setText(`分数\n${num1}`);
        } else if (num1 == -1) {
            this.m_TextGroup.getChildren()[1].setText('分数');
        }
        if (num2 == -1) {
            num2 = TT.SpreadNumberScore;
        }
        if (num2 >= 0) {
            this.m_TextGroup.getChildren()[2].setText(`最高分\n${num2}`);
        }
    }

}