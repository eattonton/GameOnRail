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
    }

    CenterX(){
        return this.game.width * 0.5;
    }

    CenterY(){
        return this.game.height * 0.5;
    }

    SaveRecord(){
        let data = {numMax:this.NumMax, numRecordMax:this.NumRecordMax};
        localStorage.setItem("data",JSON.stringify(data));
    }

    RestoreRecord(){
        let data=JSON.parse(localStorage.getItem("data"));
        if(data){
            this.NumMax = data["numMax"] || 5;
            this.NumRecordMax = data["numRecordMax"] || 0;
        }
    }

    ClearRecord(){
        localStorage.removeItem("data");
        this.NumMax = 5;
        this.NumRecordMax = 0;
    }

}
 
const instance = new TTGameConfig();
 
export default instance;