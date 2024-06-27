// instruct.js -- 教学/跟弹模式

var noteUtils = require('./noteUtils.js');

/**
 * 简单的跟弹模式. 在按键位置显示圆点, 按键时圆点变亮, 之后逐渐变暗最终消失.
 * @constructor
 */
function SimpleInstructPlayerImpl() {
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
    paint.setARGB(255, 255, 255, 0);

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

    this.getType = function () {
        return "SimpleInstructPlayer";
    }
    /**
     * @param {PlayerStates} state
     */
    this.setState = function (state) {
        internalState = state;
    }
    /**
     * @param {Array<import('./gameProfile.js').pos2d>} positions 
     */
    this.setKeyPositions = function (positions) {
        keyPositions = positions;
        keyBrightnesss = new Array(positions.length);
        keyBrightnesss.fill(0);
    }
    /**
     * @param {number} radius 
     */
    this.setKeyRadius = function (radius) {
        keyRadius = radius;
    }

    /**
     * @param {number[]} keys
     */
    this.exec = function (keys) {
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            keyBrightnesss[key] = 1;
        }
    }

    /**
     * @param {android.graphics.Canvas} canvas 
     */
    this.draw = function (canvas) {
        if (keyPositions == null) {
            return;
        }
        //清空
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        let now = new Date().getTime();

        for (let i = 0; i < keyPositions.length; i++) {
            let pos = keyPositions[i];
            let brightness = keyBrightnesss[i];
            if (brightness < brightLowerBound) {
                continue;
            }
            paint.setAlpha(Math.floor(brightness * 255));
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
            keyBrightnesss[i] *= Math.pow(1 - decaySpeed, now - lastDrawTime);
            if (keyBrightnesss[i] < brightLowerBound) {
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
function SkyCotlLikeInstructPlayerImpl() {
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
    const Path = android.graphics.Path;
    const PathEffect = android.graphics.PathEffect;
    const DashPathEffect = android.graphics.DashPathEffect;

    let internalState = PlayerStates.UNINITIALIZED;
    let paint = new Paint();
    paint.setARGB(255, 255, 255, 0);
    let lookAheadTime = 1000;  // ms
    let maxLookAheadKeyGroup = 5;

    this.getType = function () {
        return "SkyCotlLikeInstructPlayer";
    }
    /**
     * @type {Array<import('./noteUtils').PackedKey>}
     */
    let keyTimeList = [];

    this.setGestureTimeList = function (gestureTimeList_) {
        keyTimeList = gestureTimeList_;
    }

    let position = 0;

    this.seekTo = function (pos) {
        position = pos;
    }
    /**
     * @param {number[]} keys
     */
    this.exec = function (keys) {
        lastKeysTime = new Date().getTime();
        lastKeys = keyTimeList[position];
        position++;
    }

    /**
     * @param {PlayerStates} state
     */
    this.setState = function (state) {
        internalState = state;
    }
    /**
    * @type {Array<import('./gameProfile.js').pos2d>?}
    */
    let keyPositions = null;
    /**
     * @param {Array<import('./gameProfile.js').pos2d>} positions 
     */
    this.setKeyPositions = function (positions) {
        keyPositions = positions;
    }

    /**
     * 按键大小(半径,像素)
     * @type {number}
     */
    let keyRadius = 20;
    /**
     * @param {number} radius 
     */
    this.setKeyRadius = function (radius) {
        keyRadius = radius;
    }

    /**
     * @brief 在指定位置画一个实心三角形
     * @param {android.graphics.Canvas} canvas
     * @param {Paint} paint
     * @param {[number, number]} pos
     * @param {number} radius
     */
    function drawFilledTriangle(canvas, paint, pos, radius) {
        const x = pos[0];
        const y = pos[1];

        // 计算等边三角形的三个顶点
        const topX = x;
        const topY = y - radius;
        const leftX = x - radius * Math.sin(Math.PI / 3);  // sin(60°)
        const leftY = y + radius * Math.cos(Math.PI / 3);  // cos(60°)
        const rightX = x + radius * Math.sin(Math.PI / 3);
        const rightY = y + radius * Math.cos(Math.PI / 3);

        // 创建路径
        const path = new android.graphics.Path();

        // 移动到顶点
        path.moveTo(topX, topY);

        // 连接其他两个顶点
        path.lineTo(leftX, leftY);
        path.lineTo(rightX, rightY);

        // 闭合路径
        path.close();

        // 绘制填充的三角形
        canvas.drawPath(path, paint);
    }
    /**
     * @brief 画一条上凸的平滑曲线连接两个点
     * @param {android.graphics.Canvas} canvas
     * @param {Paint} paint
     * @param {[number, number]} start
     * @param {[number, number]} end
     * @param {number} factor 控制曲线的弯曲程度(0-1)
     */
    function drawCurveLine(canvas, paint, start, end, factor) {
        // 确保factor在0-1之间
        factor = Math.max(0, Math.min(1, factor));

        // 计算起点和终点的中点
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // 计算垂直于起点终点连线的单位向量
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitPerpX = -dy / length;
        const unitPerpY = dx / length;

        // 计算控制点
        // 使用factor和线段长度来决定控制点距离中点的距离
        const controlDistance = length * factor * 0.5;
        const controlX = midX + unitPerpX * controlDistance;
        const controlY = midY + unitPerpY * controlDistance;

        // 创建路径
        const path = new android.graphics.Path();
        path.moveTo(start[0], start[1]);
        path.quadTo(controlX, controlY, end[0], end[1]);

        // 在画布上绘制路径
        canvas.drawPath(path, paint);
    }

    /**
     * @brief 对于上述平滑曲线，给定从起点算起的整条曲线的长度比例，计算曲线上该点所在位置
     * @param {[number, number]} start
     * @param {[number, number]} end
     * @param {number} progress 从起点算起的整条曲线的长度比例 (0-> 起点, 1-> 终点)
     * @param {number} factor 控制曲线的弯曲程度
     * @returns {[number, number]} 曲线上该点所在位置
     */
    function getPointOnCurve(start, end, progress, factor) {
        // 确保progress和factor在0-1之间
        progress = Math.max(0, Math.min(1, progress));
        factor = Math.max(0, Math.min(1, factor));

        // 计算起点和终点的中点
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // 计算垂直于起点终点连线的单位向量
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitPerpX = -dy / length;
        const unitPerpY = dx / length;

        // 计算控制点
        const controlDistance = length * factor * 0.5;
        const controlX = midX + unitPerpX * controlDistance;
        const controlY = midY + unitPerpY * controlDistance;

        // 使用progress作为t的近似值
        const t = progress;

        // 计算贝塞尔曲线上的点
        const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlX + t * t * end[0];
        const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlY + t * t * end[1];

        return [x, y];
    }
    /**
     * @type {import('./noteUtils').PackedKey}
     */
    let lastKeys = [[-1], 0, {}];
    let lastKeysTime = 0;

    /**
     * @param {android.graphics.Canvas} canvas 
     */
    this.draw = function (canvas) {
        if (internalState != PlayerStates.PLAYING) return; // FIXME: 偷懒的办法, 造成闪烁
        if (keyPositions == null) {
            return;
        }
        //清空
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        let now = new Date().getTime();

        //1. 确定要处理的按键
        let activeKeys = [];
        let nextTime = now - lastKeysTime + lastKeys[1] + lookAheadTime;
        for (let i = position; i < keyTimeList.length; i++) {
            let keys = keyTimeList[i];
            //@ts-ignore
            if (keys[1] > nextTime) {
                break;
            }
            activeKeys.push(keys);
        }

        //2. 给所有的按键画灰色实心圆, 作为背景
        for (let i = 0; i < keyPositions.length; i++) {
            let pos = keyPositions[i];
            paint.setARGB(48, 0, 0, 0);
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(pos[0], pos[1], keyRadius, paint);
        }

        //3. 给要处理的按键画空心圆. 下一组按键用白色，其他用灰色
        for (let i = 0; i < activeKeys.length; i++) {
            let keys = activeKeys[i];
            let deltaTime = keys[1] - lastKeys[1];
            let radiusFactor = 1 - (lastKeysTime + deltaTime - now) / lookAheadTime;
            if (radiusFactor > 1) radiusFactor = 1;
            if (radiusFactor < 0) radiusFactor = 0;
            for (let j = 0; j < keys[0].length; j++) {
                let pos = keyPositions[keys[0][j]];
                if (i == 0) {
                    paint.setARGB(255, 255, 255, 255);
                } else {
                    paint.setARGB(255, 220, 220, 220);
                }
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(4);
                canvas.drawCircle(pos[0], pos[1], keyRadius * radiusFactor, paint);
            }
        }

        //4. 给之前和之后这两组按键之间画曲线
        let fromKey = lastKeys[0].reduce((a, b) => Math.max(a, b));
        if (activeKeys.length > 0 && fromKey != -1) {
            let toKey = activeKeys[0][0].reduce((a, b) => Math.max(a, b));
            if (toKey != -1) {
                let fromPos = keyPositions[fromKey];
                let toPos = keyPositions[toKey];
                paint.setARGB(255, 255, 255, 255);
                drawCurveLine(canvas, paint, fromPos, toPos, 0.5);
                let deltaTime = activeKeys[0][1] - lastKeys[1];
                let progress = (now - lastKeysTime) / deltaTime;
                if (progress > 1) progress = 1;
                if (progress < 0) progress = 0;
                let starPos = getPointOnCurve(fromPos, toPos, progress, 0.5);
                paint.setStyle(Paint.Style.FILL);
                drawFilledTriangle(canvas, paint, starPos, keyRadius / 4);
            }
        }
    }
}
module.exports = {
    SimpleInstructPlayerImpl,
    SkyCotlLikeInstructPlayerImpl
}