
function Visualizer(){

    const mergeThreshold = 0.01; //秒, 和main.js中的值保持一致

    var mergedNoteData = [];
    var row = 0;
    var col = 0;
    var boardRow = 3;
    var boardCol = 5;
    var step = 0;
    var lastStep = -1;
    var lastFirstKeyIndex = -2;

    var keysBitmap = null;
    var backgroundBitmap = null;

    /**
     * 加载乐曲数据
     * @param {Array<[number, number]>} data 乐曲数据[按键编号(从1开始), 所在时间[s]]
     */
    this.loadNoteData = function(data){
        //将相邻时间间隔小于mergeThreshold的按键合并
        let lastTime = 0;
        let lastNotes = new Set();
        for(let i = 0; i < data.length; i++){
            let note = data[i];
            if(note[1] - lastTime < mergeThreshold){
                lastNotes.add(note[0] - 1);
            }else{
                if (lastNotes.size > 0) {
                    mergedNoteData.push([Array.from(lastNotes), lastTime]);
                }
                lastNotes = new Set([note[0] - 1]);
                lastTime = note[1];
            }
        }
        mergedNoteData.push([Array.from(lastNotes), lastTime]);
        //console.log(JSON.stringify(mergedNoteData));
    }


    /**
     * 设置按键排布
     * @param {number} row_ 行数
     * @param {number} col_ 列数
     */
    this.setKeyLayout = function(row_, col_){
        row = row_;
        col = col_;
    }

    /**
     * 下一个按键
     */
    this.next = function(){
        lastStep = step;
        step++;
    }

    /**
     * 切换到指定按键
     * @param {number} step_ 序号
     */
    this.goto = function(step_){
        step = step_;
        lastStep = step - 1;
        lastFirstKeyIndex = -2;
    }


    /**
     * 绘制按键
     * @param {android.graphics.Canvas} canvas 画布
     */
    this.drawKeys = function(canvas){
        let paint = new Paint(); //android.graphics.Paint
        paint.setStyle(Paint.Style.FILL);
        //计算board的大小 //长方形
        let boardWidth = canvas.getWidth() / boardCol;
        let boardHeight = canvas.getHeight() / boardRow;
        // console.log("board size: " + boardWidth + "x" + boardHeight +" row: "+boardRow+" col: "+boardCol);
        //计算按键的大小 //圆, 间距为按键直径1.4 倍
        let keyDiameter = Math.min(boardWidth / ((col + 1) * 1.4), boardHeight / ((row + 1) * 1.4));
        let keyRadius = keyDiameter / 2;
        let keySpacingX = boardWidth / (col + 1);
        let keySpacingY = boardHeight / (row + 1);
        let drawStep = Math.max(0, step);
 
        //第一个board对应那一个按键
        let firstKeyIndex = Math.floor(drawStep / (boardRow * boardCol)) * boardRow * boardCol;
        //逐一绘制画面
        for(let i = 0; i < boardRow; i++){
            for(let j = 0; j < boardCol; j++){
                //计算当前画面的位置
                let x = j * boardWidth;
                let y = i * boardHeight;

                //计算当前画面的按键
                let currentKeyIndex = firstKeyIndex + i * boardCol + j;
                if (currentKeyIndex >= mergedNoteData.length) {
                    break;
                }      
                let currentKeys = mergedNoteData[currentKeyIndex][0];

                //绘制按键
                for (let k = 0; k < row; k++) {
                    for (let l = 0; l < col; l++) {
                        let keyX = x + keySpacingX * (l + 1);
                        let keyY = y + keySpacingY * (row - k);
                        if (currentKeys.includes(k * col + l)) {
                            //按下的按键
                            paint.setARGB(192, 127, 255, 0);
                        } else {
                            //未按下的按键, 灰色
                            paint.setARGB(192, 128, 128, 128);
                        }
                        //圆角矩形
                        canvas.drawRoundRect(keyX - keyRadius, keyY - keyRadius, keyX + keyRadius, keyY + keyRadius, 3, 3, paint);
                    }
                }
                //绘制编号
                paint.setARGB(128, 255, 255, 255);
                paint.setTextSize(20);
                canvas.drawText(i * boardCol + j + firstKeyIndex, x + 10, y + 30, paint);
            }
        }
    }

    /**
     * 绘制背景
     * @param {android.graphics.Canvas} canvas 画布
     */
    this.drawBackground = function(canvas){
        let paint = new Paint(); //android.graphics.Paint
        paint.setStyle(Paint.Style.FILL);
        //计算board的大小 //长方形
        let boardWidth = canvas.getWidth() / boardCol;
        let boardHeight = canvas.getHeight() / boardRow;
        let drawStep = Math.max(0, step);
 
        //第一个board对应那一个按键
        let firstKeyIndex = Math.floor(drawStep / (boardRow * boardCol)) * boardRow * boardCol;
        //逐一绘制画面
        for(let i = 0; i < boardRow; i++){
            for(let j = 0; j < boardCol; j++){
                //计算当前画面的位置
                let x = j * boardWidth;
                let y = i * boardHeight;

                //确定颜色
                if (i * boardCol + j + firstKeyIndex == drawStep) {
                    //"当前"画面, 白色
                    paint.setARGB(80, 255, 255, 255);
                } else {
                    //"非当前"画面, 灰色
                    paint.setARGB(80, 128, 128, 128);
                }

                //绘制画面
                canvas.drawRect(x, y, x + boardWidth, y + boardHeight, paint);
            }
        }
    }

    /**
     * 绘画!
     * @param {android.graphics.Canvas} canvas 画布
     */
    this.draw = function (canvas) {
        let Color = android.graphics.Color;
        let PorterDuff = android.graphics.PorterDuff;
        //创建bitmap
        if(keysBitmap == null || keysBitmap.getWidth() != canvas.getWidth() || keysBitmap.getHeight() != canvas.getHeight()){
            keysBitmap = android.graphics.Bitmap.createBitmap(canvas.getWidth(), canvas.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
            //强制重绘
            lastStep = -2;
            console.log("create keysBitmap: " + keysBitmap.getWidth() + "x" + keysBitmap.getHeight());
        }
        if(backgroundBitmap == null || backgroundBitmap.getWidth() != canvas.getWidth() || backgroundBitmap.getHeight() != canvas.getHeight()){
            backgroundBitmap = android.graphics.Bitmap.createBitmap(canvas.getWidth(), canvas.getHeight(), android.graphics.Bitmap.Config.ARGB_8888);
            //强制重绘
            lastFirstKeyIndex = -2;
            console.log("create backgroundBitmap: " + backgroundBitmap.getWidth() + "x" + backgroundBitmap.getHeight());
        }
        
        if (lastStep != step) {
            //如果step变化了, 则重绘背景
            let backgroundCanvas = new Canvas(backgroundBitmap);
            //清空画布
            backgroundCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
            this.drawBackground(backgroundCanvas);
            lastStep = step;

            let firstKeyIndex = Math.floor(step / (boardRow * boardCol)) * boardRow * boardCol;
            if (firstKeyIndex != lastFirstKeyIndex) {
                //如果第一个按键变化了, 则重绘按键
                let keysCanvas = new Canvas(keysBitmap);
                //清空画布
                keysCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
                this.drawKeys(keysCanvas);
                lastFirstKeyIndex = firstKeyIndex;
            }
        }
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        canvas.drawBitmap(backgroundBitmap, 0, 0, null);
        canvas.drawBitmap(keysBitmap, 0, 0, null);
    }
}


console.log("Visualizer.js loaded");

module.exports = Visualizer;