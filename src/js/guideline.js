import Phaser from "phaser";

export default class GuideLineHelper{
    constructor(g){
        this.g = g;
        this.lines = [];
    }

    Clear(){
        this.g.clear();
        this.lines = [];
    }

    GetStartVector(){
        if(this.lines.length > 0){
            //发射球
            let vec =new Phaser.Math.Vector2();
            vec.x = this.lines[0].x2 - this.lines[0].x1;
            vec.y = this.lines[0].y2 - this.lines[0].y1;
            //vec.normalize();
            return vec;
        }  

        return new Phaser.Math.Vector2(0,0);
    }
    
    /**
     * 
     * @param {number} x0 线段起始位置
     * @param {number} y0 
     * @param {number} x1 线段切线位置
     * @param {number} y1 
     * @param {Array<Phaser.GameObjects.Rectangle>} boxs 
     */
    DrawGuideLine(x0,y0,x1,y1,boxs) {
        this.boxs = boxs;
        //清空画的引导线
        this.g.clear();
        let vtangent = new Phaser.Math.Vector2(x0 - x1, y0 - y1);
        vtangent.normalize();
        let valLength = 10000;
        vtangent.x *= valLength;
        vtangent.y *= valLength;
        let l1 = new Phaser.Geom.Line(x0, y0, x0 + vtangent.x, y0 + vtangent.y);
        //反射1
        let l2 = this.ReflectOnBricks(l1);
        //let l3 = this.ReflectOnBricks(l2);
        //绘制
        this.lines = [];
        this.lines.push(l1);
        if (l2) {
            this.lines.push(l2);
        }
        // if (l3) {
        //     this.lines.push(l3);
        // }
        //最后一个线段 长度设置成 100
        if(this.lines.length > 1){
            let ll = this.lines[this.lines.length-1];
            if(Phaser.Geom.Line.Length(ll) > 100){
                Phaser.Geom.Line.SetToAngle(ll, ll.x1, ll.y1, Phaser.Geom.Line.Angle(ll), 100);
                //判断l1的结束点是不是在包围盒内
                if (!Phaser.Geom.Rectangle.Contains(boxs[0], ll.x2, ll.y2)) {
                    this.lines.length = 1;
                }
            }
        }
        for(let ll of this.lines){
            this.g.strokeLineShape(ll);
        }
        
        return this.lines;
    }

    
    /**
     * 
     * @param {Phaser.GameObjects.Line} l 
     * @returns 
     */
    ReflectOnBricks(l) {
        if(!this.boxs || this.boxs.length == 0) return null;
        //找到最近的box
        let bNear = this.GetNearBoxByLine(l, this.boxs);
        if (!bNear) return null;

        return this.ReflectOnBound(l, bNear);
    }


    /**
     * 
     * @param {Phaser.GameObjects.Line} l 
     * @param {Phaser.GameObjects.Rectangle} b 
     * @returns 
     */
    ReflectOnBound(l, b) {
        //计算直线与盒的交点
        let ptInter = this.GetNearPointByLineAndRect(l, b);
        if (!ptInter) return null;
        //更新line的结束点
        l.x2 = ptInter.x;
        l.y2 = ptInter.y;
        //获得矩形上的镜像线段
        let lineMirror = this.GetMirrorLineByBox(b, ptInter);
        const reflectAngle = Phaser.Geom.Line.ReflectAngle(l, lineMirror);
        let l2 = new Phaser.Geom.Line(0, 0, 0, 0);
        //const length = Phaser.Geom.Line.Length(l);
        Phaser.Geom.Line.SetToAngle(l2, ptInter.x, ptInter.y, reflectAngle, 10000);
        return l2;
    }

    /**
     * 通过点 获得 矩形上的 最近线段
     * @param {Phaser.GameObjects.Rectangle} box 
     * @param {*} refPt 
     * @returns 
     */
    GetMirrorLineByBox(box, refPt) {
        let arrLine = [[box.x, box.y, box.x + box.width, box.y],
        [box.x + box.width, box.y, box.x + box.width, box.y + box.height],
        [box.x, box.y + box.height, box.x + box.width, box.y + box.height],
        [box.x, box.y, box.x, box.y + box.height]]
        let dist = 1000;
        let idx = -1;
        for (let i in arrLine) {
            let item = arrLine[i];
            let dist1 = Phaser.Math.Distance.Between(item[0], item[1], item[2], item[3]);
            let dist2 = Phaser.Math.Distance.Between(item[0], item[1], refPt.x, refPt.y);
            let dist3 = Phaser.Math.Distance.Between(item[2], item[3], refPt.x, refPt.y);

            let distTmp = Math.abs(dist1 - (dist2 + dist3));
            //找到点在的直线
            if (distTmp < dist) {
                dist = distTmp;
                idx = i;
            }
        }
        let item = arrLine[idx];
        return new Phaser.Geom.Line(item[0], item[1], item[2], item[3]);
    }

    /**
     * 获得最近的相交Box
     * @param {Phaser.GameObjects.Line} l 
     * @param {Array<Phaser.GameObjects.Rectangle>} bArr 
     */
    GetNearBoxByLine(l, bArr) {
        let dist = 99999;
        let bRes = null;

        for (let b of bArr) {
            let pt = this.GetNearPointByLineAndRect(l, b);
            if (pt) {
                if (pt.dist > 0 && pt.dist < dist) {
                    bRes = b;
                    dist = pt.dist;
                }
            }
        }
        return bRes;
    }

    /**
    * 直线与方盒的交点
    * @param {Phaser.GameObjects.Line} l 
    * @param {Phaser.GameObjects.Rectangle} b 
    */
    GetNearPointByLineAndRect(l, b) {
        if (!l || !b) return null;
        let res = Phaser.Geom.Intersects.GetLineToRectangle(l, b);
        if (!res || res.length == 0) return null;

        if (res.length == 1) {
            res[0].dist = Phaser.Math.Distance.Between(l.x1, l.y1, res[0].x, res[0].y);
            return res[0];
        }
        let resPt;
        let distNear = 999999;
        for (let ptTmp of res) {
            ptTmp.dist = Phaser.Math.Distance.Between(l.x1, l.y1, ptTmp.x, ptTmp.y);
            if (ptTmp.dist > 0 && ptTmp.dist < distNear) {
                distNear = ptTmp.dist;
                resPt = ptTmp;
            }
        }

        return resPt;
    }

}