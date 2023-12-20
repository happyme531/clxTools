function getPosInteractive(promptText) {
    let gotPos = false;
    //pos[0] 宽, pos[1] 高
    let pos = [];
    let fingerReleased = false;
    let confirmed = false;
    let fullScreenWindowRequestClose = false;
    let canvasDebugCounter = 0;
    let deviceWidth = context.getResources().getDisplayMetrics().widthPixels;
    let deviceHeight = context.getResources().getDisplayMetrics().heightPixels;

    console.log("getPosInteractive(): " + promptText);
    //提示和确认按钮的框
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn" style="Widget.AppCompat.Button.Colored" text="确定" />
                <button id="cancelBtn" style="Widget.AppCompat.Button.Colored" text="取消" />
            </vertical>
        </frame>
    );
    confirmWindow.setPosition(deviceWidth / 3, 0);
    confirmWindow.setTouchable(true);

    let fullScreenWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1, -1);
    fullScreenWindow.canv.setOnTouchListener(function (v, evt) {
        if (evt.getAction() == evt.ACTION_DOWN || evt.getAction() == evt.ACTION_MOVE) {
            gotPos = true;
            pos = [parseInt(evt.getRawX().toFixed(0)), parseInt(evt.getRawY().toFixed(0))];
        }
        if (evt.getAction() == evt.ACTION_UP) {
            fingerReleased = true;
        }
        return true;
    });
    fullScreenWindow.canv.on("draw", function (canvas) {
        const Color = android.graphics.Color;
        const Paint = android.graphics.Paint;
        const PorterDuff = android.graphics.PorterDuff;
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const woffset = deviceWidth - w; //长边的偏移量
        const hoffset = deviceHeight - h; //短边的偏移量
        const centerCircleRadius = 10;
        let paint = new Paint();
        if (canvasDebugCounter != -1 && canvasDebugCounter < 60) {
            canvasDebugCounter++;
        } else if (canvasDebugCounter == 60) {
            console.log("canvas [长,短] = [" + w + "," + h + "]");
            console.log("device [长,短] = [" + deviceWidth + "," + deviceHeight + "]");
            console.log("offset [长,短] = [" + woffset + "," + hoffset + "]");
            canvasDebugCounter = -1;
        }

        //灰色背景
        canvas.drawColor(Color.parseColor("#3f000000"), PorterDuff.Mode.SRC);
        if (gotPos) {
            //画十字定位线
            paint.setStrokeWidth(2);
            paint.setARGB(255, 255, 255, 255);
            paint.setStyle(Paint.Style.STROKE);
            canvas.drawLine(0, pos[1] - hoffset, w, pos[1] - hoffset, paint);
            canvas.drawLine(pos[0] - woffset, 0, pos[0] - woffset, h, paint);

            //中心画一个空心圆
            paint.setStyle(Paint.Style.STROKE);
            canvas.drawCircle(pos[0] - woffset, pos[1] - hoffset, centerCircleRadius, paint);
        }
        if (fullScreenWindowRequestClose)
            sleep(1000);
    });


    ui.run(() => {
        confirmWindow.promptText.setText("请点击" + promptText);
        confirmWindow.confirmBtn.click(() => {
            confirmed = true;
        });
        confirmWindow.cancelBtn.click(() => {
            fingerReleased = false;
            gotPos = false;
            fullScreenWindow.setTouchable(true);
        });
    });

    while (!confirmed) {
        sleep(100);
        if (fingerReleased) {
            fullScreenWindow.setTouchable(false);
        }

        ui.run(function () {
            if (!gotPos) {
                confirmWindow.promptText.setText("请点击" + promptText);
            } else if (!fingerReleased) {
                confirmWindow.promptText.setText("当前坐标:" + pos.toString());
            } else {
                confirmWindow.promptText.setText("当前坐标:" + pos.toString() + ", 点击'确定'结束, 点击'取消'重新获取(坐标不准? 把手机转180度再试)");  //TODO: 修这个bug
            }
        });
    }

    fullScreenWindowRequestClose = true;
    sleep(100);
    fullScreenWindow.close();
    confirmWindow.close();

    console.log("End getPosInteractive(): " + pos.toString());

    return {
        "x": pos[0],
        "y": pos[1]
    }
}

module.exports = getPosInteractive;
