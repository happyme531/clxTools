function getPosInteractive(promptText) {
    let gotPos = false;
    let pos = [];
    let fingerReleased = false;
    let confirmed = false;
    let fullScreenWindowRequestClose = false;
    //提示和确认按钮的框
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn"  style="Widget.AppCompat.Button.Colored" text="确定"  />
                <button id="cancelBtn"  style="Widget.AppCompat.Button.Colored" text="取消" />
            </vertical>
        </frame>
    );
    confirmWindow.setPosition(device.height/3, 0);
    confirmWindow.setTouchable(true);

    let fullScreenWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*"/>);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1,-1);
    fullScreenWindow.canv.setOnTouchListener(function(v, evt){
        if (evt.getAction() == evt.ACTION_DOWN || evt.getAction() == evt.ACTION_MOVE) {
            gotPos = true;
            pos = [parseInt(evt.getRawX().toFixed(0)) , parseInt(evt.getRawY().toFixed(0))];
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
        const centerCircleRadius = 10;
        let paint = new Paint();

        //灰色背景
        canvas.drawColor(Color.parseColor("#3f000000"), PorterDuff.Mode.SRC);
        if (gotPos) {
            //画十字定位线
            paint.setStrokeWidth(2);
            paint.setARGB(255, 255, 255, 255);
            paint.setStyle(Paint.Style.STROKE);
            canvas.drawLine(0, pos[1], w, pos[1], paint);
            canvas.drawLine(pos[0], 0, pos[0], h, paint);
            
            //中心画一个空心圆
            paint.setStyle(Paint.Style.STROKE);
            canvas.drawCircle(pos[0], pos[1], centerCircleRadius, paint);
        }
        if(fullScreenWindowRequestClose)
            sleep(1000);
    });
        

    ui.run(()=>{
        confirmWindow.promptText.setText("请点击" + promptText);
        confirmWindow.confirmBtn.click(()=>{
            confirmed = true;
        });
        confirmWindow.cancelBtn.click(()=>{
            fingerReleased = false;
            gotPos = false;
            fullScreenWindow.setTouchable(true);
        }); 
    });

    while(!confirmed){ 
        sleep(100);
        if(fingerReleased){
            fullScreenWindow.setTouchable(false);
        }

        ui.run(function(){
            if (!gotPos) {
                confirmWindow.promptText.setText("请点击" + promptText);
            }else if(!fingerReleased){
                confirmWindow.promptText.setText("当前坐标:" + pos.toString());
            }else{
                confirmWindow.promptText.setText("当前坐标:" + pos.toString() + ", 点击'确定'结束, 点击'取消'重新获取");
            }
        });
    }

    fullScreenWindowRequestClose = true;
    sleep(100);
    fullScreenWindow.close();
    confirmWindow.close();

    return {
        "x" : pos[0],
        "y" : pos[1]
    }
}

module.exports = getPosInteractive;