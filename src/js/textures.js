import Phaser from "phaser";

/**
 * 创建带数字球 作为资源
 * @param {Phaser.Scene} scene 
 */
function CreateNumberBalls(scene) {
    const textStyle = {
        font: 'bold 18px Arial',
        fill: '#000000'
    }
    let r = 33;
    //生成带数字的球
    for (let i = 0; i < 10; i++) {
        let g1 = scene.add.graphics({ lineStyle: { color: 0x000000, width: 6 }, fillStyle: { color: 0xe1e5f1, alpha: 1.0 } });
        g1.fillCircle(r, r, 0.8 * r);
        g1.strokeCircle(r, r, 0.8 * r);
        let rt = scene.add.renderTexture(0, 0, 2 * r, 2 * r).setOrigin(0.5);
        rt.clear();
        rt.draw(g1);
        let text = scene.add.text(0, 0, '' + i, textStyle).setFontSize(r+2);
        text.setVisible(false);
        rt.draw(text, 23, r*0.5-1);
        rt.saveTexture('ball' + i);
        g1.destroy();
    }
}

export {
    CreateNumberBalls
}