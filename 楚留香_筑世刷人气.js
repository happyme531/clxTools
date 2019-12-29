if (!requestScreenCapture()) {
    toast("请求截图失败");
    exit();
};
console.show();
var count=0;
while (1) {
    count++;
    var entered = 0;
    click(2597,1310);//准备按钮
    sleep(5000);
    
    while (!entered) {
        var img = captureScreen();
        var res=0;
        
        if(img.getWidth()>1500){//竖屏时因为图片方向不对找色会超出范围
        res = images.detectsColor(img, "#ffffff", 2390, 597, 0, "equal");
        };
            
        sleep(300);
        if (res) {
            entered = 1;
          
            toastLog("进入成功，次数="+count);
        };

    };

    var leaved = 0;
    click(2288,407);//离开按钮
    sleep(200);
    click(1986,1033);//确认退出
    sleep(1500);
    while (!leaved) {
      
        var img = captureScreen();
        var res = images.detectsColor(img, "#ffffff", 2726, 38, 0, "equal");
        if (res) {
            toastLog("已离开");
            leaved = 1;
        };
        sleep(300);
    };

};