/**
 * 根据传入的像素点 判断 有颜色的点的 开始位置，数量，以及结束
 * @param {Array} datas 
 */
function ReadRowDataByColor(datas) {
    let startIdx = -1;
    let endIdx = -1;
    let numColor = 0;
    let isStart = false;
    //从开始找
    for (let i = 0; i < datas.length; i += 4) {
        if (datas[i + 3] == 0) {
            //透明
            continue;
        }
        //有值
        if (!isStart) {
            startIdx = i/4;
            isStart = true;
        }
        ++numColor;
    }
    //从后找
    for (let i = datas.length - 1; i >= 0; i -= 4) {
        if (datas[i] == 0) {
            //透明
            continue;
        }
        //有值
        endIdx = (i+1)/4-1;
        break;
    }
    let isBlank = true;
    if ((endIdx - startIdx) >= 0 && startIdx >= 0) {
        isBlank = false;
    }

    return { "isBlank": isBlank, "start": startIdx, "end": endIdx, "count": numColor };
}

export default class CanvasPixel {
    /** @type {CanvasRenderingContext2D} */
    ctx = null;
    /** @type {Array<number>} */
    data = [];
    /** @type {number} */
    width = 0;
    /** @type {number} */
    height = 0;
    /** @type {Array<Array<number>>} */
    splitDatas = [];

    constructor(ctx) {
        this.ctx = ctx;
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.data = this.ctx.getImageData(0, 0, this.width, this.height).data;
    }

    /**
     * 分割图片
     * @param {*} frameW 
     * @param {*} frameH 
     */
    DoneSplitData(frameW, frameH) {
        for (let j = 0; j < this.height; j += frameH) {
            for (let i = 0; i < this.width; i += frameW) {
                let dataTmp = this.GetPixelsByRange(i,j,frameW, frameH);
                if(dataTmp.length > 0){
                    this.splitDatas.push(dataTmp);
                }
            }
        }
    }

    Reload() {
        //重新加载数据
        this.data = this.ctx.getImageData(0, 0, this.width, this.height).data;
    }

    GetPixelsByRange(x, y, w, h) {
        let data2 = [];
        for (let j = y; j < (y + h); j++) {
            for (let i = x; i < (x + w); i++) {
                data2.push(...this.GetPixelByPt(i, j));
            }
        }
        return data2;
    }

    GetPixelByPt() {
        if (arguments.length == 2) {
            return this.GetPixelByPt(arguments[1] * this.width + arguments[0]);
        }
        let index = arguments[0] * 4;
        if (index >= this.data.length || (index + 3) >= this.data.length) {
            return [];
        }
        let r = this.data[index];
        let g = this.data[index + 1];
        let b = this.data[index + 2];
        let a = this.data[index + 3];
        return [r, g, b, a];
    }

    /**
     * 获得图像数据所在的范围
     */
    GetImageRange() {
        let x = -1;
        let y = -1;
        let xend = -1;
        let yend = -1;

        for (let i = 0; i < this.width; i++) {
            //按列 获得 y 方向的范围
            let data2 = this.GetPixelsByRange(i, 0, 1, this.height);
            let rowInfo2 = ReadRowDataByColor(data2);

            if (!rowInfo2["isBlank"]) {
                if (y == -1) {
                    y = rowInfo2["start"];
                    yend = rowInfo2["end"];
                    continue;
                }
                if (rowInfo2["start"] < y) y = rowInfo2["start"];
                if (rowInfo2["end"] > yend) yend = rowInfo2["end"];
            }
        }

        for (let i = 0; i < this.height; i++) {
            //按列 获得 x 方向的范围
            let data2 = this.GetPixelsByRange(0, i, this.width, 1);
            let rowInfo2 = ReadRowDataByColor(data2);

            if (!rowInfo2["isBlank"]) {
                if (x == -1) {
                    x = rowInfo2["start"];
                    xend = rowInfo2["end"];
                    continue;
                }
                if (rowInfo2["start"] < x) x = rowInfo2["start"];
                if (rowInfo2["end"] > xend) xend = rowInfo2["end"];
            }
        }
        return [x, y, xend - x + 1, yend - y + 1];
    }

    //出现的次数
    GetColorNumberByRowCol() {
        let numsX = [];
        let numsY = [];
        for (let i = 0; i < this.width; i++) {
            //按列 获得 y 方向的范围
            let data2 = this.GetPixelsByRange(i, 0, 1, this.height);
            let rowInfo2 = ReadRowDataByColor(data2);

            if (!rowInfo2["isBlank"]) {
                numsX.push(rowInfo2["count"]);
            }
        }

        for (let i = 0; i < this.height; i++) {
            //按列 获得 x 方向的范围
            let data2 = this.GetPixelsByRange(0, i, this.width, 1);
            let rowInfo2 = ReadRowDataByColor(data2);

            if (!rowInfo2["isBlank"]) {
                numsY.push(rowInfo2["count"]);
            }
        }

        return { "columns": numsX, "rows": numsY };
    }

}

const m_DictNumbers = {};

function InitDictNumbers() {
    if (Object.keys(m_DictNumbers).length > 0) return;
    m_DictNumbers[0] = { "x": [], "y": [] };
    m_DictNumbers[0]["x"].push([0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0]);
    m_DictNumbers[0]["y"].push([0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0]);
 
    m_DictNumbers[1] = { "x": [], "y": [] };
    m_DictNumbers[1]["x"].push([0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
    m_DictNumbers[1]["y"].push([0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0]);
 
    m_DictNumbers[2] = { "x": [], "y": [] };
    m_DictNumbers[2]["x"].push([0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    m_DictNumbers[2]["y"].push([1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3]);
 
    m_DictNumbers[3] = { "x": [], "y": [] };
    m_DictNumbers[3]["x"].push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0]);
    m_DictNumbers[3]["y"].push([1, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
 
    m_DictNumbers[4] = { "x": [], "y": [] };
    m_DictNumbers[4]["x"].push([0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    m_DictNumbers[4]["y"].push([0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 2, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    m_DictNumbers[5] = { "x": [], "y": [] };
    m_DictNumbers[5]["x"].push([0, 0, 0, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    m_DictNumbers[5]["y"].push([0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1]);

    m_DictNumbers[6] = { "x": [], "y": [] };
    m_DictNumbers[6]["x"].push([0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0]);
    m_DictNumbers[6]["y"].push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1]);

    m_DictNumbers[7] = { "x": [], "y": [] };
    m_DictNumbers[7]["x"].push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]);
    m_DictNumbers[7]["y"].push([2, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    m_DictNumbers[8] = { "x": [], "y": [] };
    m_DictNumbers[8]["x"].push([0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]);
    m_DictNumbers[8]["y"].push([0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0]);

    m_DictNumbers[9] = { "x": [], "y": [] };
    m_DictNumbers[9]["x"].push([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0]);
    m_DictNumbers[9]["y"].push([1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function DistanceTwoArr(arr1, arr2) {

}

function DotTwoArr(arr1, arr2) {
    let val = 0;

    let count = arr1.length > arr2.length ? arr1.length : arr2.length;
    for (let i = 0; i < count; i++) {
        let v1 = arr1[i] || 0;
        let v2 = arr2[i] || 0;
        val += v1 * v2;
    }

    return val;
}

function GetNumberByPixel(arrX, arrY) {
    let maxVal = 0;
    let maxKey = 0;
    InitDictNumbers();
    for (let key in m_DictNumbers) {
        for (let idx in m_DictNumbers[key]["x"]) {
            let valTmpX = DotTwoArr(arrX, m_DictNumbers[key]["x"][idx]);
            let valTmpY = DotTwoArr(arrY, m_DictNumbers[key]["y"][idx]);

            if ((valTmpX + valTmpY) > maxVal) {
                maxVal = valTmpX + valTmpY;
                maxKey = key;
            }
        }

    }

    return maxKey;
}

/**
 * 两个像素之间的距离
 * @param {Array<number>} dataA 
 * @param {Array<number>} dataB 
 */
function DistanceTwoPixelData(dataA, dataB) {
    let dist = 0;

    for (let i = 0; i < dataA.length; i += 4) {
        let alphaA = dataA[i + 3] || 0;
        let alphaB = dataB[i + 3] || 0;
        if (alphaA > 0 && alphaB > 0) {
            dist += 3;
        }else if (alphaA > 0 && alphaB == 0) {
            dist -= 1;
        }else if (alphaA == 0 && alphaB > 0) {
            dist -= 1;
        } 
    }

    return dist;
}

/**
 * 
 * @param {Array<number>} dataA 
 * @param {Array<Array<number>>} datasB 
 */
function GetNumberByPixelData(dataA, datasB) {
    let maxDist = 0;
    let idx = 0;

    for (let i = 0; i < datasB.length; i++) {
        let dist = DistanceTwoPixelData(dataA, datasB[i]);
        if (dist > maxDist) {
            maxDist = dist;
            idx = i;
        }
    }
    //console.log(maxDist);
    return idx;
}

/**
 * 获得颜色的比例
 * @param {Array<number>} data
 */
function GetPercentByPixel(data){
    if(data.length == 0) return 0;
    let numOfColor = 0;
    for (let i = 0; i < data.length; i += 4) {
        if(data[i + 3] > 0){
            ++numOfColor;
        }
    }

    return numOfColor/(data.length/4);
}

export {
    ReadRowDataByColor,
    GetNumberByPixel,
    GetNumberByPixelData,
    GetPercentByPixel
}
