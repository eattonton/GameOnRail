import Phaser from "phaser";
import TT from "../gameconfig"
import { GetRandQueue } from "../js/math";
import { TBCell, TBTable } from "../js/table";
import IdentifyNumberUtil from "../js/identifynumbers"

//单元格对象
class FFCell extends TBCell {
    /** @type{number} Block序号*/
    ShowIndex = -1;

    /** @type{Phaser.GameObjects.Sprite} */
    SpriteCell = null;
    /** @type{Phaser.GameObjects.Text} */
    TextCell = null;
    /** @type{number} 颜色 */
    CellColor = 0xffffff;
    /** @type{Boolean} */
    IsFilled = false;

    constructor(id) {
        super(id);
    }

    Reset() {
        this.ShowIndex = -1;
        this.CellColor = 0xffffff;
        if (this.SpriteCell) {
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

    SetCellNumber(number, color) {
        this.IsFilled = true;
        this.ShowIndex = number;
        this.TextCell.setText(number + '');
        this.SetColor(color);
    }
}

//表格对象
class FFTable extends TBTable {

    constructor(col, row) {
        super(col, row);
        let index = 0;
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                this.m_Cells.push(new FFCell(index++));
            }
        }
    }

    ResetSpriteColor() {
        for (let c1 of this.m_Cells) {
            c1.SetColor();
        }
    }

    SetColor(cells, value) {
        if (cells) {

        } else {
            for (let c1 of this.m_Cells) {
                c1.SetColor(value);
            }
        }
    }

    Reset() {
        for (let c1 of this.m_Cells) {
            c1.Reset();
        }
    }

    SetNumber(number, color) {
        if (number == 0) {
            //初始化
            this.At(0).SetColor(color);
        } else {
            this.At(0).SetCellNumber(number, color);
            this.ToNextCell(0, number, color);
        }
    }

    IsSuccess() {
        for (let c1 of this.m_Cells) {
            if (!c1.IsFilled) {
                return false;
            }
        }
        return true;
    }

    ToNextCell(idx, number, color) {
        let nearCells = this.GetNearCells(idx);
        for (let cell of nearCells) {
            if (cell.ShowIndex == number && !cell.IsFilled) {
                cell.SetCellNumber(number, color);
                this.ToNextCell(cell.Index, number, color);
            } else if (cell.IsFilled && cell.ShowIndex != number) {
                cell.SetCellNumber(number, color);
                this.ToNextCell(cell.Index, number, color);
            }
        }
    }

    static CreateFFTableObject(col, row) {
        let aTable = new FFTable(col, row);
        let numTime = aTable.GetSize() / 6;
        let idx = 0;
        for (let i = 0; i < numTime; i++) {
            let randIdxs = GetRandQueue(null, 6);
            for (let ridx of randIdxs) {
                if (idx >= aTable.GetSize()) break;
                aTable.At(idx++).ShowIndex = ridx + 1;
            }
        }

        return aTable;
    }
}

export default class FloodFill extends Phaser.Scene {
    constructor() {
        super({
            key: "FloodFill"
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
    /** @type {FFTable} */
    m_Table;
    /** @type {IdentifyNumberUtil} */
    m_InputNumber;

    /** @type {Phaser.GameObjects.Text} */
    m_TextNumber;
    /** @type {Phaser.GameObjects.Text} */
    m_TextStep; 
    /** @type {number} */
    m_Step = 0;

    /** @type {number} 选择时颜色*/
    m_SelectColor = 0xffff00;

    create() {
        let CenterX = this.scale.width / 2.0;
        let CenterY = this.scale.height / 2.0;
        this.cameras.main.setZoom(1.2);
        //1.绘制
        this.m_ObjContainer = this.add.container(CenterX - 260, CenterY - 500);
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                this.m_ObjContainer.add(this.DrawOneBlock(index, this.m_SizeCell * j, this.m_SizeCell * i));
            }
        }
        this.Reset();

        //4.辅助功能
        this.m_InputNumber = new IdentifyNumberUtil("ffcanvas");
        this.m_InputNumber.AddCanvas((number) => {
            if (number >= 1 && number <= 6) {
                this.GoToNext(number);
            }
        });
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

        boxA.add(s1);
        //text
        let text = this.add.text(s1.width * 0.5, s1.height * 0.5, '', { fontFamily: '微软雅黑', fontSize: '42px', fill: '#000' });
        text.setOrigin(0.5);
        //text.setVisible(false);
        text.NNIndex = index;
        boxA.add(text);
        boxA.NNIndex = index;
        return boxA;
    }

    CreateButtons(x, y) {
        //重新开始
        let btnReset = this.add.sprite(x - 200, y + 500, 'imgBtns', 2).setOrigin(0);
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

    CreateTitle(x, y) {
        let text = this.add.text(x - 250, y - 900, '二头乌游戏\n填填数字', { fontFamily: '微软雅黑', fontSize: '82px', fill: '#000' });
        this.m_TextNumber = this.add.text(x - 250, y - 600, '0', { fontFamily: '微软雅黑', fontSize: '72px', fill: '#000' });
        this.m_TextStep = this.add.text(x + 250, y - 600, '步数:0', { fontFamily: '微软雅黑', fontSize: '72px', fill: '#000' });
    }

    Reset() {
        this.m_Step = -1;
        //重新生成数据
        this.m_Table = FFTable.CreateFFTableObject(this.m_NumCol, this.m_NumRow);

        //格式化棋盘
        this.m_ObjContainer.each((child) => {
            if (child instanceof Phaser.GameObjects.Container) {
                let c1 = this.m_Table.At(child.NNIndex);
                child.each((item) => {
                    if (item instanceof Phaser.GameObjects.Sprite) {
                        c1.SpriteCell = item;
                    } else if (item instanceof Phaser.GameObjects.Text) {
                        item.setText(`${c1.ShowIndex}`);
                        c1.TextCell = item;
                    }
                })
            }
        })
        //还原颜色
        this.m_Table.ResetSpriteColor();
        //设置第一个颜色
        //this.m_Table.SetNumber(0, this.m_SelectColor);
        this.GoToNext(0);
    }

    GoToNext(number) {
        //提示数字
        if(this.m_TextNumber) this.m_TextNumber.setText(number + '');
        //当前的变数字 和 颜色 
        this.m_Table.SetNumber(number, this.m_SelectColor);
        //增加步数
        if(this.m_TextStep) this.m_TextStep.setText(`步数:${++this.m_Step}`);
        if (this.m_Table.IsSuccess()) {
            //成功设置颜色
            this.m_Table.SetColor(null, 0x00ff00);
        }

    }
}