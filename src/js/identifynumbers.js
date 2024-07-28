//绘图
import DrawingBoard from "./drawingboard";
import CanvasPixel from "./canvaspixel";
import { GetNumberByPixelData, GetPercentByPixel } from "./canvaspixel";
import pngNumbers from "../assets/numbers.png"

export default class IdentifyNumberUtil {
    /** @type {String} */
    m_CanvasName = "";
    /** @type {DrawingBoard} */
    m_BoardA;
    /** @type {CanvasPixel} */
    m_ImgDataA;
    /** @type {DrawingBoard} */
    m_BoardB;
    /** @type {CanvasPixel} */
    m_ImgDataB;
    /** @type {DrawingBoard} */
    m_BoardC;
    /** @type {CanvasPixel} */
    m_ImgDataC;
    /** @type {Boolean} */
    m_PointerUp = false;

    constructor(name) {
        this.m_CanvasName = name;
    }

    AddCanvas(cb) {
        this.m_BoardA = new DrawingBoard(this.m_CanvasName);
        if (this.m_BoardA.canvasWidth == 0) {
            //不存在时创建
            this.m_BoardA.CreateCanvas(window.innerWidth, window.innerHeight, this.m_CanvasName);
            this.m_BoardA.AddMouseEvent(() => {
                this.OnUiMouseUp(cb);
            });
            document.body.appendChild(this.m_BoardA.ctx.canvas);
        }

        this.m_ImgDataA = new CanvasPixel(this.m_BoardA.ctx);
        //创建临时绘图板
        this.m_BoardB = new DrawingBoard();
        this.m_BoardB.CreateCanvas(28, 28);
        this.m_ImgDataB = new CanvasPixel(this.m_BoardB.ctx);
        //创建数字对照板
        this.m_BoardC = new DrawingBoard();
        this.m_BoardC.LoadImage(pngNumbers, () => {
            this.m_ImgDataC = new CanvasPixel(this.m_BoardC.ctx);
            this.m_ImgDataC.DoneSplitData(28, 28);
        });
    }

    OnUiMouseUp(cb) {
        if (!this.m_PointerUp) {
            this.m_PointerUp = true;
            setTimeout(() => {
                this.ResultNumber(cb);
            }, 1000);
        }
    }

    ResultNumber(cb) {
        this.m_ImgDataA.Reload();
        let rangeA = this.m_ImgDataA.GetImageRange();
        let pixelA = this.m_ImgDataA.GetPixelsByRange(...rangeA);
        let perOfPixelA = GetPercentByPixel(pixelA);
        if (perOfPixelA > 0.7) {
            rangeA[2] = rangeA[3];
        }
        this.m_BoardB.DrawImage(...rangeA, this.m_BoardA.ctx.canvas);
        //计算参数
        this.m_ImgDataB.Reload();
        let number = GetNumberByPixelData(this.m_ImgDataB.data, this.m_ImgDataC.splitDatas);
        number = number % 10;
       
        this.m_BoardA.Clear();
        this.m_BoardB.Clear();
        this.m_PointerUp = false;

        if(typeof cb === "function"){
            cb(number);
        }
    }

}