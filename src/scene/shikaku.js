import Phaser from "phaser";
import TT from "../gameconfig"
import { GetRandQueue } from "../js/math";
import { GetColorByIndex } from "../js/color";
import TimerAnimation from "../js/timer";

//方块的对象
class SKKBlock {
    /** @type{number} 编号 */
    ID = -1;
    /** @type{number} 开始位置X*/
    StartX = 0;
    /** @type{number} 开始位置Y*/
    StartY = 0;
    /** @tyoe{number} 方块数据[[x,y]] */
    Data = [];

    constructor(id, data) {
        this.ID = id;
        this.Data = data;
    }

    SetStart(x, y) {
        this.StartX = x;
        this.StartY = y;
    }

    GetSize() {
        return this.Data.length;
    }

    GetRange(x, y) {
        let x1 = this.Data[0][0] + x;
        let y1 = this.Data[0][1] + y;
        let x2 = this.Data[this.GetSize() - 1][0] + x;
        let y2 = this.Data[this.GetSize() - 1][1] + y;
        return [x1, y1, x2, y2];
    }

    /**
     * 最大长度
     * @param {number} theMaxLen 
     */
    static CreateBlocks(theMaxLen) {
        let arr1 = [];
        arr1.push(new SKKBlock(0, [[0, 0], [0, 1], [1, 0], [1, 1]]));  //方形
        //横向
        for (let i = 2; i <= theMaxLen; i++) {
            let arr2 = [];
            for (let j = 0; j < i; j++) {
                arr2.push([j, 0]);
            }
            arr1.push(new SKKBlock(arr1.length, arr2));
        }
        //竖向
        for (let i = 2; i <= theMaxLen; i++) {
            let arr2 = [];
            for (let j = 0; j < i; j++) {
                arr2.push([0, j]);
            }
            arr1.push(new SKKBlock(arr1.length, arr2));
        }
        return arr1;
    }
}

//单元格对象
class SKKCell {
    /** @type{number} 单元格序号*/
    Index = -1;
    /** @type{number} Block序号*/
    ShowIndex = -1;
    /** @type{number} 表格中的区域序号*/
    RealIndex = -1;
    /** @type{number} 点击序号*/
    PointerIndex = -1;
    /** @type{Phaser.GameObjects.Sprite} */
    SpriteCell = null;
    /** @type{number} 颜色 */
    CellColor = 0xffffff;
    /** @type{number} Block大小 */
    BlockSize = 0;

    constructor() {

    }

    Reset() {
        this.ShowIndex = -1;
        this.RealIndex = -1;
        this.PointerIndex = -1;
        this.CellColor = 0xffffff;
        this.BlockSize = -1;
        if(this.SpriteCell){
            this.SpriteCell.setTint(this.CellColor);
        }
    }

    SetColor(value) {
        if (value) {
            this.CellColor = value;
            this.SpriteCell.setTint(value);
        } else {
            this.SpriteCell.setTint(this.CellColor);
        }
    }
}

//表格对象
class SKKTable {
    /** @type{number} */
    m_NumCol = 10;
    /** @type {number} */
    m_NumRow = 10;
    /** @type {Array<SKKCell>} */
    m_Cells = [];

    constructor(col, row) {
        this.m_NumCol = col;
        this.m_NumRow = row;

        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                this.m_Cells.push(new SKKCell());
            }
        }
    }

    GetColRowByIndex(index) {
        let iC = index % this.m_NumCol;
        let iR = parseInt(index / this.m_NumCol);
        return [iC, iR];
    }

    GetIndexByColRow(c, r) {
        return r * this.m_NumCol + c;
    }

    GetSize() {
        return this.m_NumCol * this.m_NumRow;
    }

    At() {
        let idx = -1;
        if (arguments.length == 1) {
            idx = arguments[0];
        } else if (arguments.length == 2) {
            idx = this.GetIndexByColRow(arguments[0], arguments[1]);
        }

        if (idx >= 0 && idx < this.m_Cells.length) {
            return this.m_Cells[idx];
        }
        return null;
    }

    /**
     * 通过范围获得 当前单元格
     * @param {Array<number>} box 
     * @returns 
     */
    GetCellsByRange(box) {
        let arr1 = [];
        let minx = box[0] < box[2] ? box[0] : box[2];
        let miny = box[1] < box[3] ? box[1] : box[3];
        let maxx = box[0] > box[2] ? box[0] : box[2];
        let maxy = box[1] > box[3] ? box[1] : box[3];
        for (let i = miny; i <= maxy; i++) {
            for (let j = minx; j <= maxx; j++) {
                if (i >= 0 && i < this.m_NumRow && j >= 0 && j < this.m_NumCol) {
                    let c1 = this.At(j, i);   //col,row
                    if (c1) {
                        arr1.push(c1);
                    }
                }
            }
        }
        return arr1;
    }

    /**
     * 是否已经填充
    */
    CheckIsFill(cell) {
        if (Array.isArray(cell)) {
            for (let value of cell) {
                if (this.CheckIsFill(value)) {
                    return true;
                }
            }
            return false;
        }
        if (cell.RealIndex >= 0) {
            //已经有值 被填充
            return true;
        }
        return false;
    }

    IsFullFilled() {
        for (let c1 of this.m_Cells) {
            if (c1.RealIndex < 0) {
                return false;
            }
        }

        return true;
    }

    FillCells(cell, id) {
        if (Array.isArray(cell)) {
            cell.forEach((value) => {
                this.FillCells(value, id);
            })
            return;
        }

        cell.RealIndex = id;
    }

    ResetCells(cell, id) {
        if (Array.isArray(cell)) {
            cell.forEach((value) => {
                this.ResetCells(value, id);
            })
            return;
        }
        if (id >= 0) {
            if (cell.RealIndex == id) {
                cell.Reset();
            }
        } else {
            cell.Reset();
        }
    }

    SetValueCellsByBlock(cell, block) {
        if (Array.isArray(cell)) {
            cell.forEach((value) => {
                this.SetValueCellsByBlock(value, block);
            })
            let bloTextIdx = Phaser.Math.Between(0, block.GetSize() - 1);
            for (let i = 0; i < cell.length; i++) {
                if (i != bloTextIdx) {
                    cell[i].BlockSize = 0;
                }
            }
            return;
        }

        cell.ShowIndex = block.ID;
        cell.BlockSize = block.GetSize();
    }

    /**
     * 添加方块
     * @param {SKKBlock} theBlock 
     */
    AddOneBlock(theBlock, id) {
        //依次遍历当前的单元格
        for (let i = 0; i < this.GetSize(); i++) {
            let c1 = this.At(i);
            if (this.CheckIsFill(c1)) continue;
            let [x, y] = this.GetColRowByIndex(i);
            let box = theBlock.GetRange(x, y);
            //获得范围内的单元格
            let cells = this.GetCellsByRange(box);
            //判断
            if (cells.length == theBlock.GetSize() && !this.CheckIsFill(cells)) {
                //可以填充
                this.FillCells(cells, id);
                //设置值
                this.SetValueCellsByBlock(cells, theBlock);
                return true;
            }
            //所有都要填充
            break;
        }
        return false;
    }

    /**
     * 回退最后一次填充
     */
    RoolbackLastFill() {
        let c1 = this.m_Cells.reduce((a, b) => {
            if (a.RealIndex > b.RealIndex) return a;
            return b;
        })
        let blockIndex = c1.ShowIndex;
        this.ResetCells(this.m_Cells, c1.RealIndex);
        return blockIndex;
    }

    SetSprite(index, s1) {
        this.m_Cells[index].SpriteCell = s1;
    }

    SetSpriteColor(index, value) {
        this.m_Cells[index].SetColor(value);
    }

    ResetSpriteColor() {
        for (let c1 of this.m_Cells) {
            c1.SetColor();
        }
    }
    GetCellsByPointer(index) {
        let arr1 = [];
        for (let c1 of this.m_Cells) {
            if (c1.PointerIndex == index) {
                arr1.push(c1);
            }
        }
        return arr1;
    }

    SetColor(cells, value) {
        if (cells) {

        } else {
            for (let c1 of this.m_Cells) {
                c1.SetColor(value);
            }
        }
    }
    /**
     * 判断是否完成
     */
    IsFinished() {
        //1.检查是否都被 pointerdown
        let arrWithSize = {};
        for (let c1 of this.m_Cells) {
            if (c1.PointerIndex <= 0) {
                return false;
            }
            if (c1.BlockSize > 0) {
                arrWithSize[c1.PointerIndex] = c1;
            }
        }
        //2.检查被按下的数量是否 符合 BlockSize 属性
        let pointerTotalNum = 0;
        for (let key in arrWithSize) {
            let c1 = arrWithSize[key];
            let arr2 = this.GetCellsByPointer(c1.PointerIndex);
            if (arr2.length != c1.BlockSize) {
                //数量与所占用的方格数量不符
                return false;
            }
            pointerTotalNum += arr2.length;
        }

        if (pointerTotalNum != this.GetSize()) {
            //被按下数量 与总数不同
            return false;
        }
        return true;
    }

    Reset(){
        for(let c1 of this.m_Cells){
            c1.Reset();
        }
    }

    static CreateSKKTableObject(col, row, dataBlocks) {
        let aTable = new SKKTable(col, row);
        let id = 1;
        let lastBloId = -1;
        for (let i = 0; i <= 1000; i++) {
            let arrBlockIdx = GetRandQueue(null, dataBlocks.length);
            let flagFill = false;
            for (let j of arrBlockIdx) {
                if (lastBloId >= 0 && lastBloId == dataBlocks[j].ShowIndex) {
                    //如果是回退的 以前用过的 就不用了
                    continue;
                }
                flagFill = aTable.AddOneBlock(dataBlocks[j], id);
                if (flagFill) {
                    ++id;
                    lastBloId = -1;
                    break;
                }
            }

            if (aTable.IsFullFilled()) {
                break;
            }

            if (!flagFill) {
                //没填充成功 回退一步
                lastBloId = aTable.RoolbackLastFill();
            }
        }

        return aTable;
    }
}

//数方
export default class ShiKaKu extends Phaser.Scene {
    constructor() {
        super({
            key: "ShiKaKu"
        });
    }

    preload() {

    }
    /** @type{number} */
    m_NumCol = 10;
    /** @type {number} */
    m_NumRow = 10;
    /** @type{number} */
    m_SizeCell = 85;
    /** @type {Phaser.GameObjects.Container} */
    m_ObjContainer;
    /** @type {SKKTable} */
    m_Table;

    /** @type {boolean} */
    m_IsTouchDown = false;
    /** @type {number} 点击数量*/
    m_PointerNumber = 0;

    /** @type {number} */
    m_PointerRow = -1;
    /** @type {number} */
    m_PointerCol = -1;
    /** @type {number} */
    m_PointerRow2 = -1;
    /** @type {number} */
    m_PointerCol2 = -1;

    /** @type {number} 选择时颜色*/
    m_SelectColor = 0xdfdfdf;

    /** @type {Array<SKKBlock>} */
    m_DataBlocks = [];

    /** @type {TimerAnimation} */
    m_Timer;

    create() {
        let CenterX = this.scale.width / 2.0;
        let CenterY = this.scale.height / 2.0;
        this.cameras.main.setZoom(1.2);
        //1.生成表格数据
        this.m_DataBlocks = SKKBlock.CreateBlocks(this.m_NumCol);
        //2.绘制
        this.m_ObjContainer = this.add.container(CenterX - 260, CenterY - 500);
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                this.m_ObjContainer.add(this.DrawOneBlock(index, this.m_SizeCell * j, this.m_SizeCell * i));
            }
        }
        this.Reset();
        //加分割线
        let MaxWidth = this.m_SizeCell * this.m_NumCol;
        let MaxHeight = this.m_SizeCell * this.m_NumRow;
        let lineH = this.add.line(0, 0, 0, MaxHeight * 0.5, MaxWidth, MaxHeight * 0.5, 0x000).setOrigin(0);
        lineH.setLineWidth(10);
        let lineV = this.add.line(0, 0, MaxWidth * 0.5, 0, MaxWidth * 0.5, MaxHeight, 0x000).setOrigin(0);
        lineV.setLineWidth(10);
        this.m_ObjContainer.add(lineH);
        this.m_ObjContainer.add(lineV);
        //3.事件
        this.input.on('pointerup', (pointer) => {
            this.OnMouseUp(this.m_PointerCol2, this.m_PointerRow2);
        });
        //4.辅助功能
        this.CreatTimeCard(CenterX, CenterY);
        this.CreateButtons(CenterX, CenterY);
        //5.其他信息
        this.CreateTitle(CenterX, CenterY);
    }

    DrawOneBlock(index, posx, posy) {
        let boxA = this.add.container(posx, posy);
        //sprite
        let s1 = this.add.sprite(0, 0, 'imgCells', 0).setOrigin(0);
        s1.setInteractive();
        s1.NNIndex = index;
        s1.on('pointerdown', (pt, x, y, evt) => {
            [this.m_PointerCol, this.m_PointerRow] = this.m_Table.GetColRowByIndex(s1.NNIndex);
            this.OnMouseDown(s1);
        });
        s1.on('pointerover', (pt, x, y, evt) => {
            let [iC, iR] = this.m_Table.GetColRowByIndex(s1.NNIndex);
            this.OnMouseMove(iC, iR);
        });
        s1.on('pointerup', (pt, x, y, evt) => {
            let [iC, iR] = this.m_Table.GetColRowByIndex(s1.NNIndex);
            this.OnMouseUp(iC, iR);
        })
        boxA.add(s1);
        //text
        let text = this.add.text(s1.width * 0.5, s1.height * 0.5, '', { fontFamily: '微软雅黑', fontSize: '42px', fill: '#000' });
        text.setOrigin(0.5);
        text.setVisible(false);
        text.NNIndex = index;
        boxA.add(text);
        boxA.NNIndex = index;
        return boxA;
    }

    OnMouseDown(s1) {
        this.m_IsTouchDown = true;
        s1.setTint(this.m_SelectColor);
    }

    OnMouseMove(x, y) {
        if (!this.m_IsTouchDown) return;
        //还原颜色
        this.m_Table.ResetSpriteColor();
        let cells = this.m_Table.GetCellsByRange([this.m_PointerCol, this.m_PointerRow, x, y]);
        for (let c1 of cells) {
            c1.SpriteCell.setTint(this.m_SelectColor);
        }
        this.m_PointerCol2 = x;
        this.m_PointerRow2 = y;
    }

    OnMouseUp(x, y) {
        if (!this.m_IsTouchDown) return;
        this.m_IsTouchDown = false;
        //还原颜色
        this.m_Table.ResetSpriteColor();
        let cells = this.m_Table.GetCellsByRange([this.m_PointerCol, this.m_PointerRow, x, y]);
        if (cells.length <= 1) return;
        ++this.m_PointerNumber;
        let aColor = GetColorByIndex(this.m_PointerNumber);
        for (let c1 of cells) {
            c1.SetColor(aColor);
            c1.PointerIndex = this.m_PointerNumber;
        }
        if (this.m_Table.IsFinished()) {
            console.log("Successed");
            this.m_Table.SetColor(null, 0x00ff00);
        }
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
        let text = this.add.text(x-250,y-900, '《二头乌游戏--数方》', { fontFamily: '微软雅黑', fontSize: '82px', fill: '#000' });
    }

    Reset() {
        if(this.m_Timer) this.m_Timer.Reset();
        //重新生成数据
        do {
            this.m_Table = SKKTable.CreateSKKTableObject(this.m_NumCol, this.m_NumRow, this.m_DataBlocks);
        } while (!this.m_Table.IsFullFilled())
        //格式化棋盘
        this.m_ObjContainer.each((child)=>{
            if(child instanceof Phaser.GameObjects.Container){
                let c1 = this.m_Table.At(child.NNIndex);
                child.each((item)=>{
                    if(item instanceof Phaser.GameObjects.Sprite){
                        c1.SpriteCell = item;
                    }else if(item instanceof Phaser.GameObjects.Text){
                        if (c1.BlockSize > 0) {
                            item.setText(`${c1.BlockSize}`);
                            item.setVisible(true);
                        }else{
                            item.setText('');
                            item.setVisible(false);
                        }
                    }
                })
            }
        })
        //还原颜色
        this.m_Table.ResetSpriteColor();
    }
}
