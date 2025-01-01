/**
 * 校准布局
 * @param {string} promptText 提示文本
 * @param {import("../gameProfile").pos2d[]} normalizedPos 归一化后的参考坐标
 * @param {import("../gameProfile").KeyLocatorType} [type] 按键定位类型, 目前只实现了左上右下, 默认左上右下
 * @returns {import("../gameProfile").pos2dPair[] | null} 得到的定位点坐标, 如果终止操作则返回null
 */
function calibrateLayout(promptText, normalizedPos, type) {
    if (type == null) {
        type = "LOCATOR_LEFT_TOP";
    }
    if (type != "LOCATOR_LEFT_TOP") {
        throw new Error("不支持的定位类型: " + type);
    }
    let deviceWidth = context.getResources().getDisplayMetrics().widthPixels;
    let deviceHeight = context.getResources().getDisplayMetrics().heightPixels;

    // 初始位置在屏幕1/4和3/4处
    let pos1 = [deviceWidth / 4, deviceHeight / 4];  // 左上
    let pos2 = [deviceWidth * 3/4, deviceHeight * 3/4];  // 右下
    
    let dragging1 = false;
    let dragging2 = false;
    let confirmed = false;
    let aborted = false;  // 添加终止标志

    // 全屏绘图窗口
    let fullScreenWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1, -1);

    // 触摸事件处理
    fullScreenWindow.canv.setOnTouchListener(function (v, evt) {
        let x = parseInt(evt.getRawX());
        let y = parseInt(evt.getRawY());

        if (evt.getAction() == evt.ACTION_DOWN) {
            // 检查是否点击了定位点
            if (distance([x,y], pos1) < 50) {
                dragging1 = true;
            } else if (distance([x,y], pos2) < 50) {
                dragging2 = true;
            }
        } else if (evt.getAction() == evt.ACTION_MOVE) {
            // 更新被拖动的点的位置,同时确保pos2在pos1的右下方
            if (dragging1) {
                // pos1不能移到pos2的右下方
                x = Math.min(x, pos2[0]);
                y = Math.min(y, pos2[1]);
                pos1 = [x, y];
            } else if (dragging2) {
                // pos2不能移到pos1的左上方
                x = Math.max(x, pos1[0]);
                y = Math.max(y, pos1[1]);
                pos2 = [x, y];
            }
        } else if (evt.getAction() == evt.ACTION_UP) {
            dragging1 = false;
            dragging2 = false;
        }
        return true;
    });

    // 绘制函数
    fullScreenWindow.canv.on("draw", function (canvas) {
        const Paint = android.graphics.Paint;
        const Color = android.graphics.Color;
        const PorterDuff = android.graphics.PorterDuff;
        
        let paint = new Paint();
        canvas.drawColor(Color.parseColor("#3f000000"), PorterDuff.Mode.SRC);

        // 如果已终止则不绘制
        if (aborted) {
            return;
        }

        // 画矩形框
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2);
        paint.setARGB(255, 255, 255, 255);
        canvas.drawRect(
            Math.min(pos1[0], pos2[0]),
            Math.min(pos1[1], pos2[1]),
            Math.max(pos1[0], pos2[0]),
            Math.max(pos1[1], pos2[1]),
            paint
        );

        // 画两个定位点
        let drawLocatorPoint = function(x, y, text) {
            // 黑色外圈
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawCircle(x, y, 32, paint);
            
            // 黄色中圈
            paint.setStrokeWidth(3);
            paint.setARGB(255, 255, 255, 0);
            canvas.drawCircle(x, y, 30, paint);
            
            // 黑色内圈
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawCircle(x, y, 22, paint);
            
            // 黄色填充
            paint.setARGB(180, 255, 255, 0);
            canvas.drawCircle(x, y, 20, paint);

            // 文字黑色描边
            paint.setTextSize(30);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawText(text, x - 40, y - 40, paint);
            
            // 文字白色填充
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawText(text, x - 40, y - 40, paint);
        };

        drawLocatorPoint(pos1[0], pos1[1], "左上");
        drawLocatorPoint(pos2[0], pos2[1], "右下");

        // 画参考点
        let drawReferencePoint = function(x, y, index) {
            // 白色外圈十字
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            paint.setARGB(255, 255, 255, 255);
            let size = 15;
            canvas.drawLine(x - size - 2, y, x + size + 2, y, paint);
            canvas.drawLine(x, y - size - 2, x, y + size + 2, paint);
            
            // 蓝色内圈十字
            paint.setStrokeWidth(3);
            paint.setARGB(255, 50, 50, 255);
            canvas.drawLine(x - size, y, x + size, y, paint);
            canvas.drawLine(x, y - size, x, y + size, paint);
            
            // 白色外圈
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(3);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawCircle(x, y, 7, paint);
            
            // 蓝色填充
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 50, 50, 255);
            canvas.drawCircle(x, y, 5, paint);
            
            // 序号黑色描边
            paint.setTextSize(25);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(4);
            paint.setARGB(255, 0, 0, 0);
            canvas.drawText((index + 1).toString(), x + 15, y + 15, paint);
            
            // 序号白色填充
            paint.setStyle(Paint.Style.FILL);
            paint.setARGB(255, 255, 255, 255);
            canvas.drawText((index + 1).toString(), x + 15, y + 15, paint);
        };

        for (let i = 0; i < normalizedPos.length; i++) {
            let realPos = normalizedToReal(normalizedPos[i], pos1, pos2);
            drawReferencePoint(realPos[0], realPos[1], i);
        }
    });

    // 提示和确认按钮窗口
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn" style="Widget.AppCompat.Button.Colored" text="确定" />
                <button id="resetBtn" style="Widget.AppCompat.Button.Colored" text="复原" />
                <button id="abortBtn" style="Widget.AppCompat.Button.Colored" text="终止" />
            </vertical>
        </frame>
    );
    confirmWindow.setPosition(deviceWidth / 3, 0);
    confirmWindow.setTouchable(true);

    // 按钮事件
    ui.run(() => {
        confirmWindow.promptText.setText(promptText);
        confirmWindow.confirmBtn.click(() => {
            confirmed = true;
        });
        confirmWindow.resetBtn.click(() => {
            // 重置位置
            pos1 = [deviceWidth / 4, deviceHeight / 4];
            pos2 = [deviceWidth * 3/4, deviceHeight * 3/4];
        });
        confirmWindow.abortBtn.click(() => {
            // 终止校准
            aborted = true;  // 先设置终止标志
            confirmed = true;
        });
    });

    // 等待确认
    while (!confirmed) {
        sleep(100);
    }

    fullScreenWindow.close();
    confirmWindow.close();

    // 如果是终止操作,返回null
    if (aborted) {
        return null;
    }

    return [pos1, pos2];
}

// 计算两点距离
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

// 将归一化坐标转换为实际坐标
function normalizedToReal(nPos, pos1, pos2) {
    let x = pos1[0] + (pos2[0] - pos1[0]) * nPos[0];
    let y = pos1[1] + (pos2[1] - pos1[1]) * nPos[1];
    return [x, y];
}

module.exports = calibrateLayout;
    