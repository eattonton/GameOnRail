import Phaser from "phaser";

export default class SceneInit{
    constructor(scene){
        /** @type {Phaser.Scene} */
        this.scene = scene;
    }

    Init(w,h,scale){
        this.CX = this.scene.scale.width/2;
        this.CY = this.scene.scale.height/2;
        this.Scale = scale || 2;
        this.VW = w || 400;
        this.VH = h || 800;
        
        this.scene.cameras.main.centerOn(this.CX-this.scene.scale.displaySize.width/(this.Scale*4), this.CY);
        this.scene.cameras.main.setZoom(this.Scale);

        this.X = this.CX - this.VW * 0.5;
        this.Y = this.CY - this.VH * 0.5;
        this.scene.physics.world.setBounds(this.X, this.Y, this.VW, this.VH);

        
    }
}