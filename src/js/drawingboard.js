export default class DrawingBoard {
    //下面是手写画板的事件绑定
    startPainting = false;
    lastMousePosition = { offsetX: 0, offsetY: 0 }
    canvasWidth = 0;
    canvasHeight = 0;
    ctx;

    constructor(name) {
        if (!name || name == "") return;
        const canvas = document.getElementById(name);
        if(canvas){
            this.canvasWidth = canvas.width;
            this.canvasHeight = canvas.height;
            this.ctx = canvas.getContext('2d');
        }
    }

    CreateCanvas(w, h, id) {
        const canvas = document.createElement('canvas');
        if(id) canvas.id = id;
        canvas.width = w;
        canvas.height = h;

        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.ctx = canvas.getContext('2d');
    }

    AddMouseEvent(cbDown, cbUp) {
        this.ctx.lineWidth = 20;
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = false;

        const canvas = this.ctx.canvas;
        canvas.onmousedown = (e) => { 
            this.OnMouseDown(e); 
            if(typeof cbDown === "function"){ cbDown(); }
        }
        canvas.onmousemove = (e) => { 
            this.OnMouseMove(e); 
        }
        canvas.onmouseup = (e) => { 
            this.OnMouseUp(e); 
            if(typeof cbUp === "function"){ cbUp(); }
        }

        canvas.ontouchstart = (e) => {
            let pos = { offsetX: e.touches[0].pageX - canvas.offsetLeft, offsetY: e.touches[0].pageY - canvas.offsetTop }
            this.OnMouseDown(pos);
            if(typeof cbDown === "function"){ cbDown(); }
        }
        canvas.ontouchmove = (e) => {
            let pos = { offsetX: e.touches[0].pageX - canvas.offsetLeft, offsetY: e.touches[0].pageY - canvas.offsetTop }
            this.OnMouseMove(pos);
            e.preventDefault();
        }
        canvas.ontouchend = (e) => {
            this.OnMouseUp(null);
            if(typeof cbUp === "function"){ cbUp(); }
        }
    }

    OnMouseDown(e) {
        const { offsetX, offsetY } = e;
        this.ctx.beginPath();
        this.ctx.moveTo(offsetX, offsetY);
        this.startPainting = true;
    }

    OnMouseMove(e) {
        const { offsetX, offsetY } = e;
        if (this.startPainting) {
            const { offsetX: lastX, offsetY: lastY } = this.lastMousePosition;
            if (lastX + lastY) {
                this.ctx.moveTo(lastX, lastY);
            }
            this.lastMousePosition = { offsetX, offsetY }
            this.ctx.lineTo(offsetX, offsetY);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    OnMouseUp(e) {
        this.startPainting = false
        this.lastMousePosition = { offsetX: 0, offsetY: 0 }
    }

    Clear() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    DrawPoint(x, y) {
        this.ctx.fillStyle = "#000000"; // 设置填充颜色为红色  
        this.ctx.fillRect(x, y, 1, 1); // 绘制一个点
    }

    DrawPoints(x, y, w, h) {
        for (let j = y; j <= (y + h); j++) {
            for (let i = x; i <= (x + w); i++) {
                this.DrawPoint(i, j);
            }
        }
    }

    DrawImage(x, y, w, h, canvas) {
        //把大画布上的图片缩放之后复制到小画布上
        this.ctx.drawImage(canvas, x, y, w, h, 0, 0, this.canvasWidth, this.canvasHeight);

    }

    DrawData(x, y, w, h, data) {
        if (!data) return;
        // 创建一个ImageData对象 
        let imgData = this.ctx.createImageData(w, h);
        for (var i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i] = data[i]; // 红色  
            imgData.data[i + 1] = data[i + 1]; // 绿色  
            imgData.data[i + 2] = data[i + 2]; // 蓝色  
            imgData.data[i + 3] = data[i + 3]; // 透明度  
        }
        // 使用putImageData将ImageData绘制到画布上  
        this.ctx.putImageData(imgData, x, y, 0, 0, w, h);
    }

    LoadImage(imgSrc,cb) {
        let img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            //创建一个
            this.CreateCanvas(img.width, img.height);
            //绘制原图
            this.ctx.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight, 0, 0, this.canvasWidth, this.canvasHeight);

            if(typeof cb === "function"){
                cb();
            }
        };
    }
}