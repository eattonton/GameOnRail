import Phaser from "phaser";
import TT from "../gameconfig"
import SceneInit from "../js/sceneinit";

export default class Menu extends Phaser.Scene {
    constructor() {
        super({
            key: "Menu"
        });
    }

    preload() {
        
    }

    create() {
        //恢复记录数据
        TT.RestoreRecord();
        this.SCInfo = new SceneInit(this);
        this.SCInfo.Init(400, 800, 1);

        let CenterX = this.SCInfo.CX;
        let CenterY = this.SCInfo.CY;
        let PosY =  CenterY - 700;
        this.CreateButton(CenterX, PosY, "二头乌游戏", null);
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "数  织", () => {
            this.scene.start('Nonograms');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "数  方", ()=>{
            this.scene.start('ShiKaKu');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "数  桥", ()=>{
            this.scene.start('HaShi');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "数字消消", ()=>{
            this.scene.start('SpreadNumbers');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "填填数字", ()=>{
            this.scene.start('FloodFill');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "打数字块", ()=>{
            this.scene.start('Breakout');
        });
        PosY = PosY+180;
        this.CreateButton(CenterX, PosY, "数字弹珠", ()=>{
            this.scene.start('Marbles');
        });
    }

    CreateButton(x, y, content, cb) {
        
        let w = 750;
        let h = 150;
        let r = 30;
        let gr = this.add.container(x, y);
        let g1 = this.add.graphics({ lineStyle: { color: 0x000000, width: 6 }, fillStyle: { color: 0xffffff, alpha: 1.0 } });
        g1.fillRoundedRect(0, 0, w, h, r);
        g1.strokeRoundedRect(0, 0, w, h, r);
        g1.generateTexture('btnTexture', w, h);
        g1.destroy();
        let sp1 = this.add.sprite(0, 0, 'btnTexture').setOrigin(0.5); // 注意：这可能需要一些调整或替代方案  
        sp1.setInteractive();
        gr.add(sp1)

        let text = this.add.text(0, 0, content, { fontFamily: '微软雅黑', fontSize: '75px', fill: '#000' });
        text.setOrigin(0.5);
        gr.add(text);
        if(cb){
            sp1.setTint(0xe1e5f1);
        }
        sp1.setInteractive();
        sp1.on('pointerdown', () => {
            if (typeof cb === "function") {
                this.scene.sleep("BackGroundA");
                cb();
            }
        })

        return gr;
    }
}