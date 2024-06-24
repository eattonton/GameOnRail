import Phaser from "phaser";
import TT from "../gameconfig"
import pngCells from "../assets/cells.png"
import pngBtns from "../assets/btns.png"

/**
 * 单元格对象
 */
class NNCell {
    /** @type{number} 序号*/
    Index = -1;
    /** @type{number} 显示的精灵序号*/
    ShowIndex = 0;
    /** @type{number} 正确的精灵序号*/
    RealIndex = 0;
    /** @type {boolean} 是否正确 */
    IsRight = false;

    /** @type {Phaser.GameObjects.Sprite} */
    SpriteCell = null;

    constructor(idx, sIdx, rIdx) {
        this.Index = idx;
        this.ShowIndex = sIdx;
        this.RealIndex = rIdx;
    }

    CheckRight() {
        if (this.RealIndex == 1) {
            return this.IsRight;
        }
        return true;
    }

    Reset(){
        this.ShowIndex = 0;
        this.RealIndex = Phaser.Math.Between(1,2);
        this.IsRight = false;
    }
}

export default class Nonograms extends Phaser.Scene {
    constructor() {
        super({
            key: "Nonograms",
            active: true
        });
    }

    preload() {
        document.getElementById("homeload").remove();
        this.load.spritesheet('imgCells', pngCells, { frameWidth: 85, frameHeight: 85 });
        this.load.spritesheet('imgBtns', pngBtns, {frameWidth:150, frameHeight:150});
    }
    /** @type{number} */
    m_NumCol = 10;
    /** @type {number} */
    m_NumRow = 10;
    /** @type {Array<NNCell>} */
    m_TbCells = [];

    /** @type{number} */
    m_SizeCell = 85;

    /** @type {Phaser.GameObjects.Container} */
    m_ObjContainer;

    /** @type {boolean} */
    m_IsTouchDown = false;

    /** @type {Phaser.GameObjects.text} */
    m_TimerCard = null;
    /** @type {number} */
    m_TimerSeconds = 0;

    /** @type {number} */
    m_PointerRow = -1;
    /** @type {number} */
    m_PointerCol = -1;

    /** @type {number} 选择模式 */
    m_SelectedMode = 1;

    create() {
        let CenterX = this.scale.width / 2;
        let CenterY = this.scale.height / 2;
        //1.生成表格
        this.CreateTableData();
        //2.绘制
        this.m_ObjContainer = this.add.container(750, CenterY - 500);
        let that = this;
        for (let i = 0; i < this.m_NumRow; i++) {
            this.m_ObjContainer.add(this.DrawRow(i));
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                let c1 = this.add.sprite(this.m_SizeCell * i, this.m_SizeCell * j, 'imgCells', this.m_TbCells[index].ShowIndex).setOrigin(0);
                c1.setInteractive();
                c1.NNIndex = index;
                c1.NNCell = this.m_TbCells[index];
                this.m_TbCells[index].SpriteCell = c1;
                c1.on('pointerdown', (pt, x, y, evt)=> {
                    this.m_IsTouchDown = true;
                    [this.m_PointerRow, this.m_PointerCol] = this.GetRowColByIndex(c1.NNIndex);
                    this.OnBtnDown(c1);
                });
                c1.on('pointerover', (pt, x, y, evt)=> {  
                    let [iR, iC] = this.GetRowColByIndex(c1.NNIndex);
                    if(this.m_IsTouchDown == true && (
                        this.m_PointerRow == iR || this.m_PointerCol == iC)){
                        this.OnBtnDown(c1);
                    }
                });  
                this.m_ObjContainer.add(c1);
                if (i == 0) {
                    this.m_ObjContainer.add(this.DrawColumn(j));
                }
            }
        }
        //加分割线
        let MaxWidth = this.m_SizeCell*this.m_NumCol;
        let MaxHeight = this.m_SizeCell*this.m_NumRow;
        let lineH = this.add.line(0, 0, 0, MaxHeight*0.5, MaxWidth, MaxHeight*0.5, 0x000).setOrigin(0);
        lineH.setLineWidth(10);
        let lineV = this.add.line(0, 0, MaxWidth*0.5, 0, MaxWidth*0.5, MaxHeight, 0x000).setOrigin(0);
        lineV.setLineWidth(10);
        this.m_ObjContainer.add(lineH);
        this.m_ObjContainer.add(lineV);
        //3.添加事件
        this.input.on('pointerdown', (pointer) => {
        });

        this.input.on('pointerup', (pointer) => {
            this.m_IsTouchDown = false;
        });

        //4.辅助功能
        this.CreatTimeCard(CenterX,CenterY);
        this.CreateButtons(CenterX, CenterY);
    }

    update(){
    }

    OnBtnDown(c1) {
        let cell = this.m_TbCells[c1.NNIndex];
        if(cell.ShowIndex > 0){return;} 
        cell.SpriteCell.setFrame(cell.RealIndex);
        if (cell.RealIndex == 1) {
            cell.IsRight = true;
        }
        else if (cell.RealIndex == 2) {
        }
        
        if(this.m_SelectedMode == cell.RealIndex){
            //检查是否正确
            this.CheckByCell(cell.Index);
        }
        if(this.m_SelectedMode != cell.RealIndex){
            //点击错误
            cell.SpriteCell.setTint(0xff0000);
        } 
        cell.ShowIndex = cell.RealIndex;
    }

    RemoveRightColor(index){
        this.m_ObjContainer.each((child)=>{
            if(child["NNIndex"] && child["NNIndex"] == index){
                child.destroy();
            }
        })
    }

    DrawRow(index, isRight = false) {
        let x = -200;
        let y = index * this.m_SizeCell;
        let gr = this.add.container(x, y);
        if (isRight) {
            this.RemoveRightColor(30000+index);
            //置灰
            let g2 = this.add.graphics({ lineStyle: { color: 0x000000, width: 3 }, fillStyle: { color: 0x00ff00, alpha: 0.3 } });
            g2.fillRoundedRect(0, 0, 190, 80, 10);
            gr.add(g2);
            gr.NNIndex = 30000+index;
            return gr;
        }

        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 3 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillRoundedRect(0, 0, 190, 80, 10);
        g1.strokeRoundedRect(0, 0, 190, 80, 10);
        gr.NNIndex = 10000 + index;
        gr.add(g1);
        let strIdxs = this.GetBlockIndexsByCol(index);
        let strTmp = "";
        for (let i = 0; i < strIdxs.length; i++) {
            let text = this.add.text(25 * strTmp.length + 10, 20, `${strIdxs[i]}`, { fontFamily: '微软雅黑', fontSize: '35px', fill: '#000' });
            text.setOrigin(0);
            strTmp += text.text + " ";
            gr.add(text);
        }
        return gr;
    }

    DrawColumn(index, isRight = false) {
        let x = index * this.m_SizeCell;
        let y = -200;
        let gr = this.add.container(x, y);
        if (isRight) {
            this.RemoveRightColor(40000+index);
            //置灰
            let g2 = this.add.graphics({ lineStyle: { color: 0x000000, width: 3 }, fillStyle: { color: 0x00ff00, alpha: 0.3 } });
            g2.fillRoundedRect(0, 0, 80, 190, 10);
            gr.add(g2);
            gr.NNIndex = 40000+index;
            return gr;
        }
        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 3 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillRoundedRect(0, 0, 80, 190, 10);
        g1.strokeRoundedRect(0, 0, 80, 190, 10);
        gr.NNIndex = 20000 + index;
        gr.add(g1);
        let strIdxs = this.GetBlockIndexsByRow(index);
        for (let i = 0; i < strIdxs.length; i++) {
            let text = this.add.text(20, 140 - 45 * i, `${strIdxs[strIdxs.length - i - 1]}`, { fontFamily: '微软雅黑', fontSize: '35px', fill: '#000' });
            text.setOrigin(0);
            gr.add(text);
        }
        return gr;
    }

    GetBlockIndexsByRow(index) {
        let arr1 = [];
        for (let j = 0; j < this.m_NumCol; j++) {
            let idx = index * this.m_NumCol + j;
            arr1.push(this.m_TbCells[idx]);
        }

        return this.GetBlockIndexsByArr(arr1);
    }

    GetBlockIndexsByCol(index) {
        let arr1 = [];
        for (let i = 0; i < this.m_NumRow; i++) {
            let idx = i * this.m_NumCol + index;
            arr1.push(this.m_TbCells[idx]);
        }

        return this.GetBlockIndexsByArr(arr1);
    }

    GetBlockIndexsByArr(arr) {
        let arrIdx = [];
        let num = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].RealIndex == 1) {
                //为Block
                num++;
            } else {
                if (num != 0) {
                    arrIdx.push(num);
                    num = 0;
                }
            }
        }

        if (num != 0) {
            arrIdx.push(num);
        }

        return arrIdx;
    }

    GetRowColByIndex(index){
        let iR = parseInt(index / this.m_NumCol);
        let iC = index % this.m_NumCol;
        return [iR, iC];
    }

    CheckByCell(index) {
        let [iR,iC] = this.GetRowColByIndex(index);
        this.CheckByRow(iR);
        this.CheckByCol(iC);
    }

    CheckByRow(index) {
        let isRight = true;
        for (let j = 0; j < this.m_NumCol; j++) {
            let idx = index * this.m_NumCol + j;
            if (!this.m_TbCells[idx].CheckRight()) {
                isRight = false;
                break;
            }
        }

        if (isRight) {
            //如果正确 所有的 X 都显示 ，并序号 显示灰色
            for (let j = 0; j < this.m_NumCol; j++) {
                let idx = index * this.m_NumCol + j;
                if (this.m_TbCells[idx].RealIndex == 2) {
                    this.m_TbCells[idx].ShowIndex = this.m_TbCells[idx].RealIndex;
                    this.m_TbCells[idx].SpriteCell.setFrame(this.m_TbCells[idx].RealIndex);
                }
            }
            //置灰
            this.m_ObjContainer.add(this.DrawColumn(index, true));
        }
    }

    CheckByCol(index) {
        let isRight = true;
        for (let i = 0; i < this.m_NumRow; i++) {
            let idx = i * this.m_NumCol + index;
            if (!this.m_TbCells[idx].CheckRight()) {
                isRight = false;
                break;
            }
        }

        if (isRight) {
            //如果正确 所有的 X 都显示 ，并序号 显示灰色
            for (let i = 0; i < this.m_NumRow; i++) {
                let idx = i * this.m_NumCol + index;
                if (this.m_TbCells[idx].RealIndex == 2) {
                    this.m_TbCells[idx].ShowIndex = this.m_TbCells[idx].RealIndex;
                    this.m_TbCells[idx].SpriteCell.setFrame(this.m_TbCells[idx].RealIndex);
                }
            }
            //置灰
            this.m_ObjContainer.add(this.DrawRow(index, true));
        }
    }

    CreatTimeCard(x,y){
        //计时
        this.m_TimerCard = this.add.text(x, y-1000, '00:00', { fontSize: '120px', fill: '#000' });  
        this.m_TimerCard.setOrigin(0);

        // 创建一个计时器事件，每秒触发一次  
        this.time.addEvent({  
            delay: 1000,  
            callback: ()=>{
                this.m_TimerSeconds++;  
                let s = this.m_TimerSeconds % 60;
                let m = parseInt(this.m_TimerSeconds / 60);
                let ss = s.toString().padStart(2,'0');
                let mm = m.toString().padStart(2,'0');
                this.m_TimerCard.setText(`${mm}:${ss}`);  
            },
            callbackScope: this,  
            loop: true  
        });  

        
    }

    CreateButtons(x,y){
        //重新开始
        let btnReset = this.add.sprite(x-200,y+600,'imgBtns',2).setOrigin(0);
        btnReset.setInteractive();
        btnReset.on('pointerdown',()=>{
            this.Reset();
        })
        //选择X
        let btnCross = this.add.sprite(x, y+600, 'imgBtns',0).setOrigin(0);
        btnCross.setInteractive();
        btnCross.on('pointerdown',()=>{
            btnBlock.setTint(0xffffff);
            btnCross.setTint(0x00ff00);
            this.m_SelectedMode = 2;
        })
        //选择方块
        let btnBlock = this.add.sprite(x+170, y+600, 'imgBtns',1).setOrigin(0);
        btnBlock.setInteractive();
        btnBlock.setTint(0x00ff00);
        btnBlock.on('pointerdown',()=>{
            btnCross.setTint(0xffffff);
            btnBlock.setTint(0x00ff00);
            this.m_SelectedMode = 1;
        })
    }

    Reset(){
        this.m_ObjContainer.each((child)=>{
            if(child["NNIndex"] && child["NNIndex"] > 10000){
                child.destroy();
            }
        })
        this.m_TimerCard.setText("00:00");
        this.m_TimerSeconds = 0;
        //重新生成数据
        this.CreateTableData();
        //格式化棋盘
        for (let i = 0; i < this.m_NumRow; i++) {
            for (let j = 0; j < this.m_NumCol; j++) {
                let index = i * this.m_NumCol + j;
                this.m_TbCells[index].SpriteCell.setFrame(this.m_TbCells[index].ShowIndex);
                this.m_TbCells[index].SpriteCell.setTint(0xffffff);
            }
        }

        for(let i=0;i<this.m_NumRow;i++){
            this.m_ObjContainer.add(this.DrawRow(i));
        }

        for (let j = 0; j < this.m_NumCol; j++) {
            this.m_ObjContainer.add(this.DrawColumn(j));
        }
    }

    CreateTableData(){
        do{
            for (let i = 0; i < this.m_NumRow; i++) {
                for (let j = 0; j < this.m_NumCol; j++) {
                    let index = i * this.m_NumCol + j;
                    if(index >= this.m_TbCells.length){
                        this.m_TbCells.push(new NNCell(index, 0, 0));
                    }
                    this.m_TbCells[index].Reset();
                }
            }
        }while(!this.CheckTableData())
    }

    CheckTableData(){
        for(let i=0;i<this.m_NumRow;i++){
            let strIdxs = this.GetBlockIndexsByCol(i);
            if(strIdxs.length == 0 || strIdxs.length > 4){
                return false;
            }
        }

        for(let i=0;i<this.m_NumCol;i++){
            let strIdxs = this.GetBlockIndexsByRow(i);
            if(strIdxs.length == 0 || strIdxs.length > 4){
                return false;
            }
        }

        return true;
    }


}