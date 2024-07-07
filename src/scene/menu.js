import Phaser from "phaser";
import pngCells from "../assets/cells.png"
import pngBtns from "../assets/btns.png"
import pngBridges from "../assets/bridges.png"

export default class Menu extends Phaser.Scene {
    constructor() {
        super({
            key: "Menu",
            active: true
        });
    }

    preload() {
        if(document.getElementById("homeload")) document.getElementById("homeload").remove();
        this.load.spritesheet('imgCells', pngCells, { frameWidth: 85, frameHeight: 85 });
        this.load.spritesheet('imgBtns', pngBtns, {frameWidth:150, frameHeight:150});
        this.load.spritesheet('imgBridges', pngBridges, { frameWidth: 85, frameHeight: 19 });
    }

    create() {
        let CenterX = this.scale.width / 2;
        let CenterY = this.scale.height / 2;

        this.CreateButton(CenterX - 250, CenterY - 580, "二头乌游戏", null);
        this.CreateButton(CenterX - 250, CenterY - 400, "数  织", () => {
            this.scene.start('Nonograms');
        });
        this.CreateButton(CenterX - 250, CenterY - 220, "数  方", ()=>{
            this.scene.start('ShiKaKu');
        });
        this.CreateButton(CenterX - 250, CenterY - 40, "数  桥", ()=>{
            this.scene.start('HaShi');
        });
    }

    CreateButton(x, y, content, cb) {
        let w = 750;
        let h = 150;
        let r = 30;
        let gr = this.add.container(x, y);
        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 6 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillRoundedRect(0, 0, w, h, r);
        g1.strokeRoundedRect(0, 0, w, h, r);
        g1.generateTexture('btnTexture', w, h);
        g1.destroy();
        let sp1 = this.add.sprite(0, 0, 'btnTexture').setOrigin(0); // 注意：这可能需要一些调整或替代方案  
        sp1.setInteractive();
        gr.add(sp1)

        let text = this.add.text(0.5 * w, 0.5 * h, content, { fontFamily: '微软雅黑', fontSize: '75px', fill: '#000' });
        text.setOrigin(0.5);
        gr.add(text);
 
        sp1.setInteractive();
        sp1.on('pointerdown', () => {
            if (typeof cb === "function") {
                cb();
            }
        })

        return gr;
    }
}