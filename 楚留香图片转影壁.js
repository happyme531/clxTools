//使用auto.js 4.0.1 beta版本 编写&运行

//输入图片的路径(需要提前缩放到..176x94(在我的手机上))
const img = images.read("/sdcard/test4.png"); 

console.info("请在开始运行之前，切换到画板的\"画刷\"页面，并且调整滑块到最细的一端稍往上一点的位置！");

//////一些预置的分辨率

if (device.height == 3120 && device.width == 1440) {
    //3120x1440(eg.LG G7)
    var pixelWidth = 16;
    var printAreaBegin = [1350, 343];
    var printAreaEnd = [2768, 1138];
    var colorSelecterX = 1150;
    var colorSelecterY = [430, 595, 765, 930, 1090, 720, 880, 1050];

} else if (device.height == 1920 && device.width == 1080) {
    //1920x1080(eg.小米5s)   
    var pixelWidth = 12;
    var printAreaBegin = [769, 258];
    var printAreaEnd = [1831, 853];
    var colorSelecterX = 620;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];

} else if (device.height == 2160 && device.width == 1080) {
    //2160x1080(来自酷安网友)
    var pixelWidth = 12;
    var printAreaBegin = [890, 258];
    var printAreaEnd = [1951, 853];
    var colorSelecterX = 735;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else if (device.height == 2340 && device.width == 1080) {
    //2340x1080(eg.红米k20pro)
    var pixelWidth = 12;
    var printAreaBegin = [980, 258];
    var printAreaEnd = [2040, 853];
    var colorSelecterX = 825;
    var colorSelecterY = [320, 450, 570, 690, 806, 534, 660, 787];
} else {
    //暂时没适配的分辨率，你可以自己更改这个脚本
    toast("暂不支持此分辨率！");
    //toast("你也可以打开脚本自行适配");
    exit();
    var pixelWidth = 16; //用比最小笔刷宽度大一点点的宽度点一个点，这个点的直径
    var printAreaBegin = new Array(1350, 343); //绘图区左上角坐标
    var printAreaEnd= new Array(2768, 1138); //绘图区右下角坐标
    var colorSelecterX = 1150; //选择颜色区的x坐标(正中间)
    var colorSelecterY = new Array(430, 595, 765, 930, 1090, 720, 880, 1050); //选择颜色区各个颜色对应的y坐标，最后3个需要向下翻页到底再获取
};

const pixelGap = pixelWidth / 2;
const maxWidth = (printAreaEnd[0] - printAreaBegin[0] - pixelWidth) / pixelGap;
const maxHeight = (printAreaEnd[1] - printAreaBegin[1] - pixelWidth) / pixelGap;

const colorTable = new Array("#FFFDFFFF", "#FFE7B81A", "#FF1BE6E4", "#FFE71A62", "#FFB51AE6", "#FF1BE675", "#FF010000", "#FF3700A7"); //画板里仅有的几个颜色(差评)

function findNearestColor(col) { //根据图片颜色确定最接近的笔刷颜色(实际上因为可选颜色太少，效果差劲)
    var diff0 = 256;
    var out = 0;
    for (var i = 0; i < colorTable.length; i++) {
        var diff = (Math.abs(colors.red(col) - colors.red(colorTable[i])) * 0.297 + Math.abs(colors.green(col) - colors.green(colorTable[i])) * 0.593 + Math.abs(colors.blue(col) - colors.blue(colorTable[i])) * 0.11)
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
        sleep(50);
    };

    click(colorSelecterX, colorSelecterY[colId]); //点选颜色
};

if (img == null) {
    toast("输入图片错误！请检查图片路径与格式");
    exit();
};

var pixelCountX = img.getWidth();
var pixelCountY = img.getHeight();
if (pixelCountX>maxWidth){
    toast("图片宽度过大！最大为"+maxWidth);
    //exit();
    };
    if (pixelCountY>maxHeight){
    toast("图片高度过大！最大为"+maxHeight);
    //exit();
    };

var prevColId = 0;
for (var i = 1; i <= pixelCountX; i++) {
    for (var j = 1; j <= pixelCountY; j++) {
        var searchx = (i - 1);
        var searchy = (j - 1);
        var colId = findNearestColor(img.pixel(searchx, searchy));
        //if(colId==0)continue;//跳过白色
        if (colId != prevColId) {
            var needSwipe = 0;
            if ((colId <= 4 && colId >= 0 && prevColId <= 4 && prevColId >= 0) || (colId <= 7 && colId >= 5 && prevColId <= 7 && prevColId >= 5)) {} else { //两个颜色不在同一页
                needSwipe = 1;
            };
            prevColId = colId;
            switchColor(colId, needSwipe);
        };
        press(printAreaBegin[0] + i * pixelGap, printAreaBegin[1] + j * pixelGap, 50);
        //sleep(200);
        

    };
    
};

toast("绘画完成");