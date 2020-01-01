var screenutil = {};
screenutil.checkColor = function (x, y, col) {
    let img = images.captureScreen();
    if (colors.isSimilar(images.pixel(img, x, y), col, 6, "rgb+")) {
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
module.exports = screenutil;