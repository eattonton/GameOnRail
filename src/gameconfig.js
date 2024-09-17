import Phaser from "phaser";

class TTGameConfig {
    constructor() {
        this.game = {};
        this.eventsCenter = new Phaser.Events.EventEmitter();
        /**@type {boolean} 是否开始*/
        this.IsStart = false;
        /** @type {number} */
        this.width = 0;
        /** @type {number} */
        this.height = 0;
        /** @type {boolean} */
        this.IsLandscape = false;

        /** @type {number} 数字消消分数*/
        this.SpreadNumberScore = 0;

        /** @type {number} 打砖块分数*/
        this.BreakoutScore = 0;
        /** @type {number} 弹珠分数*/
        this.MarbleScore = 0;
    }

    CenterX(){
        return this.game.width * 0.5;
    }

    CenterY(){
        return this.game.height * 0.5;
    }

    SaveRecord(){
        let data = {SpreadNumberScore:this.SpreadNumberScore, BreakoutScore:this.BreakoutScore};
        localStorage.setItem("data",JSON.stringify(data));
    }

    RestoreRecord(){
        let data=JSON.parse(localStorage.getItem("data"));

        if(data){
            this.SpreadNumberScore = data["SpreadNumberScore"] || 0;
            this.BreakoutScore = data["BreakoutScore"] || 0;
            this.MarbleScore = data["MarbleScore"] || 0;
        }
    }

    ClearRecord(){
        localStorage.removeItem("data");
        this.SpreadNumberScore = 0;
    }

}
 
const instance = new TTGameConfig();
 
export default instance;