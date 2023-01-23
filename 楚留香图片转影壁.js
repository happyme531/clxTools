//使用auto.js 4.0.1 beta版本 编写&运行
var config = storages.create("hallo1_clximgplotter_config");
var getPosInteractive = requireShared("getPosInteractive.js");
console.show(true);
const colorTableMaxAllowedDiff = 10; //获取颜色表时允许的最大颜色差异

let cmp = (x, y) => {
    // If both x and y are null or undefined and exactly the same
    if (x === y) {
        return true;
    }

    // If they are not strictly equal, they both need to be Objects
    if (!(x instanceof Object) || !(y instanceof Object)) {
        return false;
    }

    //They must have the exact same prototype chain,the closest we can do is
    //test the constructor.
    if (x.constructor !== y.constructor) {
        return false;
    }
    for (var p in x) {
        //Inherited properties were tested using x.constructor === y.constructor
        if (x.hasOwnProperty(p)) {
            // Allows comparing x[ p ] and y[ p ] when set to undefined
            if (!y.hasOwnProperty(p)) {
                return false;
            }
            // If they have the same strict value or identity then they are equal
            if (x[p] === y[p]) {
                continue;
            }
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if (typeof(x[p]) !== "object") {
                return false;
            }
            // Objects and Arrays must be tested recursively
            if (!Object.equals(x[p], y[p])) {
                return false;
            }
        }
    }

    for (p in y) {
        // allows x[ p ] to be set to undefined
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
            return false;
        }
    }
    return true;
};

function setConfigSafe(key, val) {
    config.put(key, val);
    let tmp = config.get(key);
    if (cmp(tmp, val)) {
        toast("设置保存成功");
    } else {
        toast("设置保存失败！");
    };
};

//用户设置
function runSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["查看当前设置", "更改默认图片路径","使用自定义坐标","设置自定义坐标"])) {
        case 0: //查看当前设置
            dialogs.alert("暂时还没做好");
            break;
        case 1: //更改默认图片路径
            setConfigSafe("defaultImgPath", dialogs.rawInput("选择默认的图片路径", "/sdcard/test.jpg"));
            break;
        case 2:
            if(!dialogs.confirm("","总是使用自定义坐标吗")){
                setConfigSafe("alwaysUseCustomPos", false);
            } else {
                if (config.get("colorSelecterX", 0) === 0) {    //无效的配置
                    dialogs.alert("", "你还没有设置自定义坐标!");
                } else {
                    setConfigSafe("alwaysUseCustomPos", true);
                }
            }
            break;
        case 3: //设置自定义坐标
            let colorSelecterX = 0;
            let colorSelecterY = [];
            let pos = getPosInteractive("颜色选择器中从上往下第一个颜色的按钮中心");
            colorSelecterX = pos.x;
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("从上往下第二个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("从上往下第三个颜色的按钮中心");
            colorSelecterY.push(pos.y); 
            pos = getPosInteractive("从上往下第四个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            dialogs.alert("","现在把颜色选择器翻到最下方！");
            pos = getPosInteractive("从上往下第五个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("从上往下第六个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("从上往下第七个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("从上往下第八个颜色的按钮中心");
            colorSelecterY.push(pos.y);
            pos = getPosInteractive("画布左上角");
            let printAreaBegin = [pos.x,pos.y];
            pos = getPosInteractive("画布右下角");
            let printAreaEnd = [pos.x,pos.y];
            let pixelWidth = 12;
            setConfigSafe("colorSelecterX",colorSelecterX);
            setConfigSafe("colorSelecterY",colorSelecterY);
            setConfigSafe("printAreaBegin",printAreaBegin);
            setConfigSafe("printAreaEnd",printAreaEnd);
            setConfigSafe("pixelWidth",pixelWidth);   
            dialogs.alert("","设置完成");
            break;
        };
};

// let pos = getPosInteractive("test");
// console.log(JSON.stringify(pos));
// exit();
//主函数
if (dialogs.select("君欲何为？", ["开始绘画", "更改设置"])) { //进入设置
    let endSetup = 0;
    while (!endSetup) {
        runSetup();
        endSetup = dialogs.select("继续设置吗？", ["继续设置", "退出，开始绘画"]);
    };
};

dialogs.alert("","请在开始运行之前，切换到画板的\"画刷\"页面，并且调整滑块到最细的一端稍往上一点的位置！");

let imgPath = dialogs.rawInput("选择图片的路径", config.get("defaultImgPath","/sdcard/test.jpg"));
if(!files.exists(imgPath)){
    dialogs.alert("","图片不存在！");
    exit();
}
setConfigSafe("defaultImgPath", imgPath);
let gcodeMode = false;
let gcodeStr = "";
let img = null;
let algo = null;
if (imgPath.endsWith(".gcode") || imgPath.endsWith(".gc") || imgPath.endsWith(".ngc")) {
    gcodeStr = files.read(imgPath);
    gcodeMode = true;
} else {
    img = images.read(imgPath);
    algo = dialogs.select("请选择绘图算法", ["算法0:速度很慢，效果较好", "算法1: 速度较快，效果较差"]);
}

let useCustomPos = config.get("alwaysUseCustomPos", false);


//////一些预置的分辨率
if(!useCustomPos){
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
    } else {
        //暂时没适配的分辨率，你可以自己更改这个脚本
        dialogs.alert("暂不支持此分辨率", "请在设置中设置你的坐标");
        setConfigSafe("alwaysUseCustomPos",true);
        //toast("你也可以打开脚本自行适配");
        
        //请在修改结束后删掉这个 'exit();'
        exit();
        var pixelWidth = 16; //用比最小笔刷宽度大一点点的宽度点一个点，这个点的直径
        var printAreaBegin = new Array(1350, 343); //绘图区左上角坐标
        var printAreaEnd = new Array(2768, 1138); //绘图区右下角坐标
        var colorSelecterX = 1150; //选择颜色区的x坐标(正中间)
        var colorSelecterY = new Array(430, 595, 765, 930, 1090, 720, 880, 1050); //选择颜色区各个颜色对应的y坐标，最后3个需要向下翻页到底再获取
    };
}else{
    console.log("正在使用自定义坐标")
    var pixelWidth = config.get("pixelWidth");
    var printAreaBegin = config.get("printAreaBegin");
    var printAreaEnd = config.get("printAreaEnd");
    var colorSelecterX = config.get("colorSelecterX");
    var colorSelecterY = config.get("colorSelecterY");
}
console.log("绘图区域尺寸为"+(printAreaEnd[0]-printAreaBegin[0])+"x"+(printAreaEnd[1]-printAreaBegin[1]));

if (gcodeMode){
    drawGcode(gcodeStr);
}
const pixelGap = pixelWidth / 2;
const maxWidth = (printAreaEnd[0] - printAreaBegin[0] - pixelWidth) / pixelGap;
const maxHeight = (printAreaEnd[1] - printAreaBegin[1] - pixelWidth) / pixelGap;
console.log("图片最大尺寸为" + maxWidth + "x" + maxHeight);

const knownColors = new Array("#FFFDFFFF", "#FFE7B81A", "#FF1BE6E4", "#FFE71A62", "#FFB51AE6", "#FF1BE675", "#FF010000", "#FF3700A7"); //画板里仅有的几个颜色
var colorTable = new Array();
//const hsvColorTable = [[180, 1, 1], [46, 0.89, 0.91], [179, 0.88, 0.90], [339, 0.89, 0.91], [286, 0.89, 0.90], [147, 0.88, 0.90], [0, 1, 0], [260, 1, 0.65]];
//现在颜色顺序会变化了！所以自动检测顺序
function buildColorTable() {
    if(!requestScreenCapture()){
        dialogs.alert("","脚本需要截图来获取颜色顺序，请允许这项权限！");
        exit();
    };
    let buildComplete = false;
    while (!buildComplete) {
        swipe(colorSelecterX, colorSelecterY[0], colorSelecterX, device.width, 600); //滑到第一页
        sleep(650);
        let img = images.captureScreen();
        for (let i = 0; i < 5; i++) {
            colorTable.push(img.pixel(colorSelecterX, colorSelecterY[i]));  //获取第一页中的颜色
        };
        swipe(colorSelecterX, colorSelecterY[4], colorSelecterX, 0, 600); //滑到第二页
        sleep(600);
        img = images.captureScreen();
        for (let i = 5; i < colorSelecterY.length; i++) {
            colorTable.push(img.pixel(colorSelecterX, colorSelecterY[i])); //获取第二页中的颜色
        };
        sleep(600);
        swipe(colorSelecterX, colorSelecterY[0], colorSelecterX, device.width, 600); //滑到第一页
        console.log("获得的颜色为" + JSON.stringify(colorTable));
        //和已知颜色对比, 判断是否有漏掉的颜色, 使用colors.isSimilar()函数
        buildComplete = true;
        let colorTableCopy = colorTable.slice(0);
        for (let i = 0; i < knownColors.length; i++) {
            let haveSimilarColor = false;
            let knownColor = colors.parseColor(knownColors[i]);
            for (let j = 0; j < colorTableCopy.length; j++) {
                if (colors.isSimilar(knownColor, colorTableCopy[j], colorTableMaxAllowedDiff, "rgb+")) {
                    haveSimilarColor = true;
                    break;
                };
            };
            if (!haveSimilarColor) {
                buildComplete = false;
                console.log("颜色 %s 没有找到, 重新获取", knownColors[i]);
                colorTable = new Array();
                break;
            }
        }
    };
    console.log("获取完成, 颜色顺序为" + JSON.stringify(colorTable));
}


/**
 * 判断是否滑动到位 (也不知道是bug还是为了反制这个脚本, 现在滑动颜色选择器会有一定概率会在半途卡住)
 * @param {boolean} isUp 是否向上滑动(滑动到底部)
 * @returns  {boolean} 是否滑动到位
 */
function isScrollComplete(isUp) {
    let img = images.captureScreen();
    if (isUp) {
        let actrualColor = img.pixel(colorSelecterX, colorSelecterY[colorSelecterY.length - 1]);
        let expectedColor = colorTable[colorTable.length - 1];
        return colors.isSimilar(actrualColor, expectedColor, colorTableMaxAllowedDiff, "rgb+");
    }else{
        let actrualColor = img.pixel(colorSelecterX, colorSelecterY[0]);
        let expectedColor = colorTable[0];
        return colors.isSimilar(actrualColor, expectedColor, colorTableMaxAllowedDiff, "rgb+");
    }
}

function compareRGB(r1, g1, b1, r2, g2, b2) {
    let rmean = (r1 + r2) / 2;
    let dr = r1 - r2;
    let dg = g1 - g2;
    let db = b1 - b2;
    //lab deltaE颜色相似度
    return ((2 + rmean / 256) * (dr * dr) + 4 * (dg * dg) + (2 + (255 - rmean) / 256) * (db * db));

};

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
 
    let diff0 = +Infinity;
    let out = 0;
    for (let i = 0; i < colorTable.length; i++) {
        //let diff = compareHSV(H, S, V, hsvColorTable[i][0], hsvColorTable[i][1], hsvColorTable[i][2]);
        let diff = compareRGB(colors.red(col), colors.green(col), colors.blue(col), colors.red(colorTable[i]), colors.green(colorTable[i]), colors.blue(colorTable[i]))
        if (diff < diff0) {
            diff0 = diff;
            out = i;
        };

    };


    return out;
};

function switchColor(colId, needSwipe) { //更换当前笔刷颜色
    if (needSwipe) {
        let swipeSuccess = false;
        while (!swipeSuccess) {
            swipe(colorSelecterX, colorSelecterY[0], colorSelecterX, device.width, 600); //滑到第一页
            sleep(50);
            swipeSuccess = isScrollComplete(false);
            if(!swipeSuccess){
                console.log("滑动到第一页失败, 重试");
                swipe(colorSelecterX, colorSelecterY[4], colorSelecterX, 0, 600); //滑回第二页
            }
        }
        swipeSuccess = false;
        if (colId >= 5) {
            while (!swipeSuccess) {
                swipe(colorSelecterX, colorSelecterY[4], colorSelecterX, 0, 600); //滑到第二页
                sleep(50);
                swipeSuccess = isScrollComplete(true);
                if(!swipeSuccess){
                    console.log("滑动到第二页失败, 重试");
                    swipe(colorSelecterX, colorSelecterY[0], colorSelecterX, device.width, 600); //滑到第一页
                }
            }
        };
    } else {
        //sleep(10);
    };

    press(colorSelecterX, colorSelecterY[colId], 20); //点选颜色
};

/**
 * Algo0 -  最原始的算法，逐个像素进行绘画，效果尚可，但是需要很长的时间
 */
function execAlgo0(){
    var prevColId = 0;
    var prevCol = "#FFFFFFFF";
    buildColorTable();
    sleep(600);
    //把初始颜色设置为白色, 否则会出现直到遇到第一个颜色为非白色的点前，笔刷颜色可能会变成错误的颜色的问题
    let defaultColId = findNearestColor("#FFFFFFFF", "#00000000", 0);
    switchColor(defaultColId, true);
    sleep(600);
    for (var i = 1; i <= pixelCountX; i++) {
        for (var j = 1; j <= pixelCountY; j++) {
            let searchx = (i - 1);
            let searchy = (j - 1);
    
            let colId = findNearestColor(img.pixel(searchx, searchy), prevCol, prevColId);
            prevCol = img.pixel(searchx, searchy);
            //if(colId==0)continue;//跳过白色
            if (colId != prevColId) {
                var needSwipe = 0;
                if ((colId <= 4 && colId >= 0 && prevColId <= 4 && prevColId >= 0) || (colId <= 7 && colId >= 5 && prevColId <= 7 && prevColId >= 5)) {} else { //两个颜色不在同一页
                    needSwipe = 1;
                };
                prevColId = colId;
                switchColor(colId, needSwipe);
            };
            press(printAreaBegin[0] + i * pixelGap, printAreaBegin[1] + j * pixelGap, 30);
            //sleep(200);
    
    
        };
        toast(i + "/" + pixelCountX + "完成");
        console.log(i + "/" + pixelCountX + "完成");
    };
    
    toast("绘画完成");
}

/**
 * Algo1 - 逐个颜色进行绘画，效果稍差，但是速度快
 */
function execAlgo1(){
    buildColorTable();
    sleep(600);
    let prevColId = 0;
    let prevCol = "#FFFFFFFF"
    //把初始颜色设置为白色, 否则会出现直到遇到第一个颜色为非白色的点前，笔刷颜色可能会变成错误的颜色的问题
    let defaultColId = findNearestColor("#FFFFFFFF", "#00000000", 0);
    switchColor(defaultColId, true);
    sleep(600);
    // a matrix of the same size as the image, filled with desired color
    toast("正在计算颜色");
    let m = new Array(pixelCountX);
    for (let i = 0; i < pixelCountX; i++) {
        m[i] = new Array(pixelCountY);
        for (let j = 0; j < pixelCountY; j++) {
            m[i][j] = findNearestColor(img.pixel(i, j), prevCol, prevColId);
            prevCol = img.pixel(i, j);
            prevColId = m[i][j];
        }
    }
    //for each color in the matrix, draw it on the screen
    //don't draw the white color
    for(let colId = 0; colId < colorTable.length; colId++){
        // if the current color is similar to white, skip it 
        let curCol = colorTable[colId];
        let distance = compareRGB(colors.red(curCol), colors.green(curCol), colors.blue(curCol), 255, 255, 255);
        if(distance < 100){ 
            continue;
        }


        switchColor(colId, true);   //在这种算法中，滑动带来的时间消耗少，所以默认不滑动
        for(let i = 0; i < pixelCountX; i++){
            for(let j = 0; j < pixelCountY; j++){
                if(m[i][j]==colId){
                    //楚留香中绘图只支持单点触控，所以这里只能用单点触控。
                    press(printAreaBegin[0] + i * pixelGap, printAreaBegin[1] + j * pixelGap, 1);
                }
            }
        }
    }
    toast("绘画完成");
}

if (img == null) {
    toast("输入图片错误！请检查图片路径与格式");
    exit();
};

let optimalSize = true;
var pixelCountX = img.getWidth();
var pixelCountY = img.getHeight();
if (pixelCountX > maxWidth) {
    toast("图片宽度过大！建议的图片最大宽度为" + maxWidth);
    optimalSize = false
    //exit();
};
if (pixelCountY > maxHeight) {
    toast("图片高度过大！建议的图片最大高度为" + maxHeight);
    optimalSize = false;
    //exit();
};
if(!optimalSize){
    img = images.scale(img, maxWidth/pixelCountX, maxHeight/pixelCountY);
    img = images.clip(img, 0,0, maxWidth,maxHeight);
    pixelCountX = img.getWidth();
    pixelCountY = img.getHeight();
    toast("图片已被缩放来满足比例");
}

switch (algo) {
    case 0:
        execAlgo0();
        break;
    case 1:
        execAlgo1();
        break;
    case 2:
        break;
    default:
        toast("算法错误！请检查算法参数"); //不会执行
        exit();
        break;
};

///////////GCode处理部分///////////

function GCodeGestureGenerator(){

    const arcSegLength = 4; //弧线的每段长度

    //GCode坐标系, 左下角为原点, x轴向右, y轴向上
    var absPos = [0, 0]; //绝对坐标

    //G90/G91
    var isRelative = false; //是否使用相对坐标

    //进给速度, 像素/分钟
    var feedRate = 0;

    //是否使用笔刷
    var isPenDown = false;

    //屏幕坐标系, 左上角为原点, x轴向右, y轴向下
    var drawingAreaTopLeft = [0,0];
    var drawingAreaBottomRight = [0,0];

    //手势列表
    var gestures = [];

    //缩放
    var scale = 1;

    //速度缩放
    var speedScale = 4;

    //是否允许合并路径
    var allowMergePath = true;

    //一条路径的最大长度
    var maxPathLength = 10;

    //合并路径时两点之间的最大距离
    var maxMergeDistance = 2;

    var lastPosList = [];
    var lastDuration = 0;

    /**
     * 设置绘图区域
     * @param {[number, number]} topLeft 左上角坐标
     * @param {[number, number]} bottomRight 右下角坐标
     */
    this.setDrawingArea = function(topLeft, bottomRight){
        drawingAreaTopLeft = topLeft;
        drawingAreaBottomRight = bottomRight;
    }

    /**
     * GCode坐标系转换为屏幕坐标系
     * @param {[number, number]} absPos_ 绝对坐标
     * @returns {[number, number]} 屏幕坐标系坐标
     */
    this.GCode2Screen = function(absPos_){
        absPos_ = absPos_.map(x => x * scale);
        let pos =  [drawingAreaTopLeft[0] + absPos_[0], drawingAreaBottomRight[1] - absPos_[1]];
        let origPos = pos.slice();
        let outRange = false;
        if(pos[0] < drawingAreaTopLeft[0]){
            pos[0] = drawingAreaTopLeft[0];
            outRange = true;
        }
        if(pos[0] > drawingAreaBottomRight[0]){
            pos[0] = drawingAreaBottomRight[0];
            outRange = true;
        }
        if(pos[1] < drawingAreaTopLeft[1]){
           pos[1] = drawingAreaTopLeft[1];
              outRange = true;
        }
        if(pos[1] > drawingAreaBottomRight[1]){
            pos[1] = drawingAreaBottomRight[1];
            outRange = true;
        }
        if(outRange){
            console.warn("坐标超出绘图区域！" + origPos + " -> " + pos);
        }
        return pos;

    }

    /**
     * 更新坐标, 考虑当前的坐标模式
     * @param {[number, number]} newPos 新的坐标
     */
    this.updatePos = function (newPos) {
        if (isRelative) {
            if (newPos[0] != null) {
                absPos[0] += newPos[0];
            }
            if (newPos[1] != null) {let lastPos = lastPosList[lastPosList.length - 1];
                let firstPos = posList_[0];
                let distance = Math.sqrt(Math.pow(lastPos[0] - firstPos[0], 2) + Math.pow(lastPos[1] - firstPos[1], 2));
                if(distance < maxMergeDistance){
                    posList_ = lastPosList.concat(posList_);
                }
            }
        } else {
            if (newPos[0] != null) {
                absPos[0] = newPos[0];
            }
            if (newPos[1] != null) {
                absPos[1] = newPos[1];
            }
        }
    }
            
    /**
     * 添加手势
     * @param {Array<[number,number]>} posList 经过的点的坐标列表(GCode坐标系, 绝对坐标)
     * @param {number} duration 持续时间(毫秒)
     */
    this.addGesture = function(posList, duration){
        if(duration == 0 || posList == null || posList.length == 0){
            return;
        }
        if(duration < 1) duration = 1;


        //转换为屏幕坐标系
        var posList_ = [];
        for(let i = 0; i < posList.length; i++){
            posList_.push(this.GCode2Screen(posList[i]));
        }

        //合并路径
        if(allowMergePath){
            let mergedLength = lastPosList.length + posList_.length;
            if (mergedLength <= maxPathLength) {
                let firstPos = posList_[0];
                let distance = 0;
                if (lastPosList.length > 0) {
                    let lastPos = lastPosList[lastPosList.length - 1];
                    distance = this.distance(lastPos, firstPos);
                }
                if (distance <= maxMergeDistance) { //可以合并
                    lastPosList = lastPosList.concat(posList_);
                    lastDuration += duration;
                } else { //不能合并
                    if (lastPosList.length > 0) {
                        gestures.push([lastDuration].concat(lastPosList));
                    }
                    lastPosList = posList_;
                    lastDuration = duration;
                }
            }else{
                if(lastPosList.length > 0){
                    gestures.push([lastDuration].concat(lastPosList));
                }
                lastPosList = posList_;
                lastDuration = duration;
            }
        } else {
            if (posList_.length > 0) {
                gestures.push([duration].concat(posList_));
            }
        }
    }

    /** 
     * 计算两点之间的直线距离
     * @param {[number, number]} pos1 点1
     * @param {[number, number]} pos2 点2
     * @returns {number} 两点之间的直线距离
    */
    this.distance = function(pos1, pos2){
        return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2));
    }

    /**
     * 计算移动需要的时间
     * @param {number} distance 移动距离
     * @returns {number} 移动需要的时间(毫秒)
     */
    this.calcDuration = function(distance){
        return distance / feedRate * 60 * 1000 / speedScale;
    }

    /**
     * G0/G1
     * @param {number|null} x x坐标
     * @param {number|null} y y坐标
     * @param {number|null} z z坐标, 用来控制笔刷
     * @param {number|null} f 进给速度
     */
    this.G0G1 = function(x, y, z, f){
        if(x == null && y == null && z == null && f == null){
            return;
        }
        if(f != null){
            feedRate = f;
        }
        if (z > 0)  isPenDown = false;
        if (z < 0)  isPenDown = true;
            
        let lastPos = absPos.slice();
        this.updatePos([x, y]);
        
        if(feedRate == 0){
            return;
        }
        if(isPenDown){
            let duration = this.calcDuration(this.distance(lastPos, absPos));
            this.addGesture([lastPos, absPos], duration);
        }
    }

    /**
     * G2/G3
     * @param {number|null} x x坐标
     * @param {number|null} y y坐标
     * @param {number|null} z z坐标, 用来控制笔刷
     * @param {number|null} i x轴圆心偏移量
     * @param {number|null} j y轴圆心偏移量
     * @param {number|null} f 进给速度
     * @param {boolean} isClockwise 是否顺时针
     */
    this.G2G3 = function(x, y, z, i, j, f, isClockwise){
        if(f != null){
            feedRate = f;
        }
        if (z > 0)  isPenDown = false;
        if (z < 0)  isPenDown = true;
        let lastPos = absPos.slice();
        this.updatePos([x, y]);
        let centerPos = [lastPos[0] + i, lastPos[1] + j];
        let radius = this.distance(centerPos, lastPos);
        let startAngle = Math.atan2(lastPos[1] - centerPos[1], lastPos[0] - centerPos[0]);
        let endAngle = Math.atan2(absPos[1] - centerPos[1], absPos[0] - centerPos[0]);
        if(isClockwise){
            if(endAngle > startAngle){
                endAngle -= 2 * Math.PI;
            }
        }else{
            if(endAngle < startAngle){
                endAngle += 2 * Math.PI;
            }
        }
        let angle = endAngle - startAngle;
        let distance = radius * angle;
        let duration = this.calcDuration(distance);
        let segmentCount = Math.ceil(distance / arcSegLength);
        let posList = [];
        for(let i = 0; i <= segmentCount; i++){
            let angle_ = startAngle + angle * i / segmentCount;
            let pos = [centerPos[0] + radius * Math.cos(angle_), centerPos[1] + radius * Math.sin(angle_)];
            posList.push(pos);
        }
        this.addGesture(posList, duration);
    }

    /**
     * 解析GCode
     * @param {string} gcode GCode
     */
    this.parseGCodeLine = function(gcode){
        let gcode_ = gcode.trim();
        //删除括号内的内容
        gcode_ = gcode_.replace(/\(.*?\)/g, "");
        //删除注释
        gcode_ = gcode_.replace(/;.*/g, "");
        //删除多余空格
        gcode_ = gcode_.replace(/\s+/g, " ");

        //是否是空行
        if(gcode_ == ""){
            return;
        }

        //分割
        let gcodeList = gcode_.split(" ");
        let cmd = gcodeList[0];
        let params = {};
        for(let i = 1; i < gcodeList.length; i++){
            let param = gcodeList[i];
            let key = param[0];
            let value = parseFloat(param.substr(1));
            params[key] = value;
        }
        switch(cmd){
            case "G00":
            case "G01":
                this.G0G1(params["X"], params["Y"], params["Z"], params["F"]);
                break;
            case "G02":
                this.G2G3(params["X"], params["Y"], params["Z"], params["I"], params["J"], params["F"], true);
                break;
            case "G03":
                this.G2G3(params["X"], params["Y"], params["Z"], params["I"], params["J"], params["F"], false);
                break;
            case "G90":
                isRelative = false;
                break;
            case "G91":
                isRelative = true;
                break;
            case "M03":
            case "M3":
                isPenDown = true;
                break;
            case "M05":
            case "M5":
                isPenDown = false;
                break;
            case "M2":
            case "M30":
                console.log("GCode解析完成");
            default:
                console.warn("未实现的GCode指令: " + gcode);
                break;
        }
    }
    
    /**
     * 解析GCode
     * @param {string} gcode GCode
     */
    this.parseGCode = function(gcode){
        let gcodeList = gcode.split("\n");

        for(let i = 0; i < gcodeList.length; i++){
            this.parseGCodeLine(gcodeList[i]);
            if(i % 500 == 0){
                console.log(i + "/" + gcodeList.length);
            }
        }
        return gestures;
    }
}

function drawGcode(gcode){
    let gCodeGestureGenerator = new GCodeGestureGenerator();
    gCodeGestureGenerator.setDrawingArea(printAreaBegin, printAreaEnd);
    let gestureList = gCodeGestureGenerator.parseGCode(gcode);
    for(let i = 0; i < gestureList.length; i++){
        try{
          gesture.apply(null, gestureList[i]);
        }catch(e){
            console.log(e);
            console.log("gestureList[i]: " + JSON.stringify(gestureList[i]));
        }
        //sleep(gestureList[i][0]);
        console.log("进度: " + (i + 1) + "/" + gestureList.length + " (" + ((i + 1) / gestureList.length * 100).toFixed(2) + "%)");
    }
}