class TBCell {
    /** @type{number} 单元格序号*/
    Index = -1;

    constructor(id) {
        this.Index = id;
    }

    Reset() {

    }
}

class TBTable {
    /** @type{number} */
    m_NumCol = 10;
    /** @type {number} */
    m_NumRow = 10;
    /** @type {Array<TBCell>} */
    m_Cells = [];

    constructor(col, row) {
        this.m_NumCol = col;
        this.m_NumRow = row;
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
            if(arguments[0]>=0 && arguments[0]<this.m_NumCol
                && arguments[1]>=0 && arguments[1]<this.m_NumRow){
                    idx = this.GetIndexByColRow(arguments[0], arguments[1]);
            }
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
        if (Array.isArray(box)) {
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
        } else {
            let [x, y] = this.GetColRowByIndex(box);
            return this.GetCellsByRange([x - 1, y - 1, x + 1, y + 1]);
        }
        return [];
    }

    /**
     * 获得临近的单元格
     * @param {number} index 
     */
    GetNearCells(index,step) {
        step = step || 1;
        let arr1 = [];
        let [x, y] = this.GetColRowByIndex(index);
        let c1 = this.At(x - step, y);
        if (c1) {
            arr1.push(c1);
        }

        c1 = this.At(x, y - step);
        if (c1) {
            arr1.push(c1);
        }

        c1 = this.At(x + step, y);
        if (c1) {
            arr1.push(c1);
        }

        c1 = this.At(x, y + step);
        if (c1) {
            arr1.push(c1);
        }

        return arr1;
    }
}

export {
    TBCell,
    TBTable
}