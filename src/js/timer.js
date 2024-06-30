import Phaser from "phaser";

export default class TimerAnimation {
    /** @type {Phaser.GameObjects.text} */
    m_TimerCard = null;
    /** @type {number} */
    m_TimerSeconds = 0;

    constructor() {

    }

    CreatTimeCard(scene, x, y) {
        //计时
        this.m_TimerCard = scene.add.text(x, y, '00:00', { fontSize: '120px', fill: '#000' });
        this.m_TimerCard.setOrigin(0);

        // 创建一个计时器事件，每秒触发一次  
        scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.m_TimerSeconds++;
                let s = this.m_TimerSeconds % 60;
                let m = parseInt(this.m_TimerSeconds / 60);
                let ss = s.toString().padStart(2, '0');
                let mm = m.toString().padStart(2, '0');
                this.m_TimerCard.setText(`${mm}:${ss}`);
            },
            callbackScope: this,
            loop: true
        });
    }

    Reset(){
        this.m_TimerCard.setText("00:00");
        this.m_TimerSeconds = 0;
    }


}