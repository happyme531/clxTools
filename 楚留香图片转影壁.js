//使用auto.js 4.0.1 beta版本 编写&运行

//在下面输入图片的路径(需要提前缩放到合适大小)
const img = images.read("/sdcard/test3.jpg");

console.info("请在开始运行之前，切换到画板的\"画刷\"页面，并且调整滑块到最细的一端稍往上一点的位置！");

//////一些预置的分辨率

if (device.height == 3120 && device.width == 1440) {
    //3120x1440(eg.LG G7)(图片尺寸为180×97)
    var pixelWidth = 16;
    var printAreaBegin = [1304, 345];
    var printAreaEnd = [2760, 1138];
    var colorSelecterX = 1150;
    var colorSelecterY = [430, 595, 765, 930, 1090, 720, 880, 1050];

} else if (device.height == 1920 && device.width == 1080) {
    //1920x1080(eg.小米5s)(图片尺寸为175×97)   
    var pixelWidth = 12;
    var printAreaBegin = [769, 257];
    var printAreaEnd = [1831, 853];
    var colorSelecterX = 620;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];

} else if (device.height == 2160 && device.width == 1080) {
    //2160x1080(来自酷安网友)(图片尺寸为174×97)
    var pixelWidth = 12;
    var printAreaBegin = [890, 257];
    var printAreaEnd = [1951, 853];
    var colorSelecterX = 735;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 2340 && device.width == 1080) {
    //2340x1080(eg.红米k20pro)(图片尺寸为174×97)
    var pixelWidth = 12;
    var printAreaBegin = [980, 257];
    var printAreaEnd = [2040, 853];
    var colorSelecterX = 825;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 2280 && device.width == 1080) {
    //2280x1080(图片尺寸为175×97)
    var pixelWidth = 12;
    var printAreaBegin = [948, 257];
    var printAreaEnd = [2011, 854];
    var colorSelecterX = 799;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 2400 && device.width == 1080) {
    //2400x1080(图片尺寸为175×97)
    var pixelWidth = 12;
    var printAreaBegin = [1007, 257];
    var printAreaEnd = [2070, 854];
    var colorSelecterX = 860;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 2312 && device.width == 1080) {
    //2312x1080(图片尺寸为175×97)
    var pixelWidth = 12;
    var printAreaBegin = [965, 257];
    var printAreaEnd = [2027, 854];
    var colorSelecterX = 770;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 1520 && device.width == 720) {
    //1520x720(图片尺寸为139×77)
    var pixelWidth = 10;
    var printAreaBegin = [660, 170];
    var printAreaEnd = [1368, 569];
    var colorSelecterX = 560;
    var colorSelecterY = [215, 305, 380, 465, 540, 360, 440, 525];
} else if (device.height == 2220 && device.width == 1080) {
    //2220x1080(图片尺寸为175×97)
    var pixelWidth = 12;
    var printAreaBegin = [918, 257];
    var printAreaEnd = [1981, 854];
    var colorSelecterX = 768;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
}else {
    //暂时没适配的分辨率，你可以自己更改这个脚本
    toast("暂不支持此分辨率！");
    //toast("你也可以打开脚本自行适配");
    
    //请在修改结束后删掉这个 'exit();'
    exit();
    var pixelWidth = 16; //用比最小笔刷宽度大一点点的宽度点一个点，这个点的直径
    var printAreaBegin = new Array(1350, 343); //绘图区左上角坐标
    var printAreaEnd = new Array(2768, 1138); //绘图区右下角坐标
    var colorSelecterX = 1150; //选择颜色区的x坐标(正中间)
    var colorSelecterY = new Array(430, 595, 765, 930, 1090, 720, 880, 1050); //选择颜色区各个颜色对应的y坐标，最后3个需要向下翻页到底再获取
};

const pixelGap = pixelWidth / 2;
const maxWidth = (printAreaEnd[0] - printAreaBegin[0] - pixelWidth) / pixelGap;
const maxHeight = (printAreaEnd[1] - printAreaBegin[1] - pixelWidth) / pixelGap;

const colorTable = new Array("#FFFDFFFF", "#FFE7B81A", "#FF1BE6E4", "#FFE71A62", "#FFB51AE6", "#FF1BE675", "#FF010000", "#FF3700A7"); //画板里仅有的几个颜色(差评)
//const hsvColorTable = [[180, 1, 1], [46, 0.89, 0.91], [179, 0.88, 0.90], [339, 0.89, 0.91], [286, 0.89, 0.90], [147, 0.88, 0.90], [0, 1, 0], [260, 1, 0.65]];
function findNearestColor(col, prevCol, prevColId) { //根据图片颜色确定最接近的笔刷颜色(实际上因为可选颜色太少，效果差劲)
    if (Math.abs(colors.red(col) - colors.red(prevCol)) * 0.297 + Math.abs(colors.green(col) - colors.green(prevCol)) * 0.593 + Math.abs(colors.blue(col) - colors.blue(prevCol)) * 0.11 < 2) {
        return prevColId;
    };
    /*
    function compareHSV(h1, s1, v1, h2, s2, v2) {
        const R = 100;
        const angle = 30;
        const h = R * Math.cos(angle / 180 * Math.PI);
        const r = R * Math.sin(angle / 180 * Math.PI);

        let x1 = r * v1 * s1 * Math.cos(h1 / 180 * Math.PI);
        let y1 = r * v1 * s1 * Math.sin(h1 / 180 * Math.PI);
        let z1 = h * (1 - v1);
        let x2 = r * v2 * s2 * Math.cos(h2 / 180 * Math.PI);
        let y2 = r * v2 * s2 * Math.sin(h2 / 180 * Math.PI);
        let z2 = h * (1 - v2);
        let dx = x1 - x2;
        let dy = y1 - y2;
        let dz = z1 - z2;
        return Math.sqrt((dx * dx + dy * dy + dz * dz));


    };
    //如果两个颜色相距很小，直接返回前一个颜色
   
    //转换为hsv颜色
    let R = colors.red(col) / 255, G = colors.green(col) / 255, B = colors.blue(col) / 255;
    let maxc = Math.max(R, G, B);
    let minc = Math.min(R, G, B);
    let H = 0;
    if (R = maxc) H = (G - B) / (maxc - minc);
    if (G = maxc) H = 2 + (B - R) / (maxc - minc);
    if (B = maxc) H = 4 + (R - G) / (maxc - minc);
    H = H * 60;
    if (H < 0) H = H + 360;
    let V = Math.max(R, G, B);
    let S = (V == 0 ? 0 : (maxc - minc) / (maxc));
    */
    function compareRGB(r1,g1,b1,r2,g2,b2){
        let rmean=(r1+r2)/2;
        let dr=r1-r2;
        let dg=g1-g2;
        let db=b1-b2;
        //lab deltaE颜色相似度
        return ((2+rmean/256)*(dr*dr)+4*(dg*dg)+(2+(255-rmean)/256)*(db*db));
   
    }; 
    let diff0 = +Infinity;
    let out = 0;
    for (let i = 0; i < colorTable.length; i++) {
        //let diff = compareHSV(H, S, V, hsvColorTable[i][0], hsvColorTable[i][1], hsvColorTable[i][2]);
        let diff=compareRGB(colors.red(col),colors.green(col),colors.blue(col),colors.red(colorTable[i]),colors.green(colorTable[i]),colors.blue(colorTable[i]))
        if (diff < diff0) {
            diff0 = diff;
            out = i;
        };

    };


    return out;
};

function switchColor(colId, needSwipe) { //更换当前笔刷颜色
    if (needSwipe) {
        swipe(colorSelecterX, colorSelecterY[0], colorSelecterX, device.width, 600); //滑到第一页
        sleep(50);
        if (colId >= 5) {
            swipe(colorSelecterX, colorSelecterY[4], colorSelecterX, 0, 600); //滑到第二页
        };
    } else {
        //sleep(10);
    };

    press(colorSelecterX, colorSelecterY[colId], 20); //点选颜色
};

if (img == null) {
    toast("输入图片错误！请检查图片路径与格式");
    exit();
};

var pixelCountX = img.getWidth();
var pixelCountY = img.getHeight();
if (pixelCountX > maxWidth) {
    toast("图片宽度过大！最大为" + maxWidth);
    //exit();
};
if (pixelCountY > maxHeight) {
    toast("图片高度过大！最大为" + maxHeight);
    //exit();
};

var prevColId = 0;
var prevCol = "#FFFFFFFF";

for (var i = 1; i <= pixelCountX; i++) {
    for (var j = 1; j <= pixelCountY; j++) {
        let searchx = (i - 1);
        let searchy = (j - 1);

        let colId = findNearestColor(img.pixel(searchx, searchy), prevCol, prevColId);
        prevCol = img.pixel(searchx, searchy);
        //if(colId==0)continue;//跳过白色
        if (colId != prevColId) {
            var needSwipe = 0;
            if ((colId <= 4 && colId >= 0 && prevColId <= 4 && prevColId >= 0) || (colId <= 7 && colId >= 5 && prevColId <= 7 && prevColId >= 5)) { } else { //两个颜色不在同一页
                needSwipe = 1;
            };
            prevColId = colId;
            switchColor(colId, needSwipe);
        };
        press(printAreaBegin[0] + i * pixelGap, printAreaBegin[1] + j * pixelGap, 30);
        //sleep(200);


    };
    toast(i + "/" + pixelCountX + "完成");

};

toast("绘画完成");