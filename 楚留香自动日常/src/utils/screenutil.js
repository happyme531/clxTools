var screenutil = {};
screenutil.checkColor = function (x, y, col,threshold) {
    let img = images.captureScreen();
    if (colors.isSimilar(images.pixel(img, x, y), col, threshold||6, "rgb+")) {
        console.verbose("颜色检测成功:图片%s,目标%s", colors.toString(images.pixel(img, x, y)), col)
        return 1;
    } else {
        console.verbose("颜色检测失败:图片%s,目标%s", colors.toString(images.pixel(img, x, y)), col)
        return 0;
    };

};
screenutil.waitUntilColorMatch = function (x, y, col, minTry) {
    minTry = minTry || 5;
    let findingEnd = 0;
    while (findingEnd < minTry) {
        sleep(800);
        if (screenutil.checkColor(x, y, col)) {
            findingEnd++;
            console.verbose("颜色对应成功:第%d次", findingEnd);
        } else {
            findingEnd = 0;
        }
    };

};

screenutil.isMainScreen=function(){  //检测当前是否在游戏内部的主界面
    if (this.checkColor(168,715,"#d2dbdb",3) ||this.checkColor(168,715,"#abb0b0")){//检测任务/队伍菜单收起按钮箭头图案的左侧白色区域 d2dbdb是展开状态 另外一个是收起状态
        return 1;
    }else {
        return 0;
    };
};
module.exports = screenutil;