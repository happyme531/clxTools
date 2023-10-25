// instruct.js -- 教学/跟弹模式

var noteUtils = require('./noteUtils.js');

/**
 * 简单的跟弹模式. 在按键位置显示圆点, 按键时圆点变亮, 之后逐渐变暗最终消失.
 * @constructor
 */
function SimpleInstructPlayerImpl(){
    /**
     * @enum {number}
     */
    const PlayerStates = {
        PLAYING: 0,
        PAUSED: 1,
        SEEKING: 2,
        SEEK_END: 3,
        UNINITIALIZED: 4,
        FINISHED: 5,
    }

    const Paint = android.graphics.Paint;
    const Color = android.graphics.Color;
    const PorterDuff = android.graphics.PorterDuff;

    let internalState = PlayerStates.UNINITIALIZED;
    let paint = new Paint();
    paint.setARGB(255,255,255,0);

    /**
     * @type {Array<import('./gameProfile.js').pos2d>?}
     */
    let keyPositions = null;
    /**
     * 按键的亮度(0~1)
     * @type {Array<number>}
     */
    let keyBrightnesss = [];
    /**
     * 按键大小(半径,像素)
     * @type {number}
     */
    let keyRadius = 20;
    /**
     * 衰减速度(比例/毫秒)
     * @type {number}
     */
    let decaySpeed = 0.005;

    const brightLowerBound = 0.1;

    let lastDrawTime = new Date().getTime();

    this.doTransform = false;

    this.getType = function(){
        return "SimpleInstructPlayer";
    }
    /**
     * @param {PlayerStates} state
     */
    this.setState = function(state){
        internalState = state;
    }
    /**
     * @param {Array<import('./gameProfile.js').pos2d>} positions 
     */
    this.setKeyPositions = function(positions){
        keyPositions = positions;
        keyBrightnesss = new Array(positions.length);
        keyBrightnesss.fill(0);
    }
    /**
     * @param {number} radius 
     */
    this.setKeyRadius = function(radius){
        keyRadius = radius;
    }

    /**
     * @param {number[]} keys
     */
    this.exec = function(keys){
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            keyBrightnesss[key] = 1;
        }
    }

    /**
     * 
     * @param {android.graphics.Canvas} canvas 
     */
    this.draw = function(canvas){
        if(keyPositions == null){
            return;
        }
        //清空
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        let now = new Date().getTime();

        for(let i = 0; i < keyPositions.length; i++){
            let pos = keyPositions[i];
            let brightness = keyBrightnesss[i];
            if(brightness < brightLowerBound){
                continue;
            }
            paint.setAlpha(Math.floor(brightness * 255));
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
            keyBrightnesss[i] *= Math.pow(1 - decaySpeed, now - lastDrawTime);
            if(keyBrightnesss[i] < brightLowerBound){
                keyBrightnesss[i] = 0;
            }
        }
        lastDrawTime = now;
    }
}

/**
 * 类似光遇的跟弹模式:
 * - 在下一个按键内部显示逐渐扩大的圆圈, 按键时圆圈正好填满按键, 之后消失
 * - 显示上一个按键的位置, 并使用贝塞尔曲线连接下一个按键和上一个按键
 * - 在曲线上画一个五角星, 五角星在曲线上的位置对应自上一个按键按下后的时间与两个按键之间的时间差的比值(即一个进度条)
 * - 如果两次按键是同一个按键, 则不画曲线, 在按键内画五角星
 */

module.exports = {
    "SimpleInstructPlayerImpl": SimpleInstructPlayerImpl,
}