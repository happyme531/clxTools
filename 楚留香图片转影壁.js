//使用auto.js 4.0.1 beta版本 编写&运行
var config = storages.create("hallo1_clximgplotter_config");

function getPosInteractive(promptText) {
    let confirmed = false;
    //提示和确认按钮的框
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                {/* <button id= "up" style="Widget.AppCompat.Button.Colored" text="↑"/>
            <button id= "down" style="Widget.AppCompat.Button.Colored" text="↓"/>
            <button id= "left" style="Widget.AppCompat.Button.Colored" text="←"/>
            <button id= "right" style="Widget.AppCompat.Button.Colored" text="→"/> */}
                <button id="confirmBtn" style="Widget.AppCompat.Button.Colored" text="确定" />
            </vertical>
        </frame>
    );
    confirmWindow.setTouchable(true);
    ui.run(function(){
        confirmWindow.promptText.setText("请将另一个悬浮窗口左上端移到" + promptText + "，之后点击确认来获取坐标");
        confirmWindow.confirmBtn.click(()=>{
            confirmed = true;
        });
    });

    //只有一个箭头的框，用来获取坐标
    let selectorWindow = floaty.window(
        <frame gravity="left|top">
            <img src="data:image/jpg;base64,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"/>
        </frame>);
        selectorWindow.setAdjustEnabled(true);
        while(!confirmed) sleep(50);
        confirmWindow.close();
        selectorWindow.close();
        return {
            "x": selectorWindow.getX(),
            "y": selectorWindow.getY()
        };
}

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
const img = images.read(imgPath);

let algo = dialogs.select("请选择绘图算法", ["算法0:速度很慢，效果较好", "算法1: 速度较快，效果较差"]);

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
const pixelGap = pixelWidth / 2;
const maxWidth = (printAreaEnd[0] - printAreaBegin[0] - pixelWidth) / pixelGap;
const maxHeight = (printAreaEnd[1] - printAreaBegin[1] - pixelWidth) / pixelGap;

//const colorTable = new Array("#FFFDFFFF", "#FFE7B81A", "#FF1BE6E4", "#FFE71A62", "#FFB51AE6", "#FF1BE675", "#FF010000", "#FF3700A7"); //画板里仅有的几个颜色(差评)
var colorTable = new Array();
//const hsvColorTable = [[180, 1, 1], [46, 0.89, 0.91], [179, 0.88, 0.90], [339, 0.89, 0.91], [286, 0.89, 0.90], [147, 0.88, 0.90], [0, 1, 0], [260, 1, 0.65]];
//现在颜色顺序会变化了！所以自动检测顺序
function buildColorTable() {
    if(!requestScreenCapture()){
        dialogs.alert("","脚本需要截图来获取颜色顺序，请允许这项权限！");
        exit();
    };
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
    //toast((JSON.stringify(colorTable)));
};

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

/**
 * Algo0 -  最原始的算法，逐个像素进行绘画，效果尚可，但是需要很长的时间
 */
function execAlgo0(){
    var prevColId = 0;
    var prevCol = "#FFFFFFFF";
    buildColorTable();
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
    toast("图片已被缩放来满足比例");
}

switch (algo) {
    case 0:
        execAlgo0();
        break;
    case 1:
        execAlgo1();
        break;
    default:
        toast("算法错误！请检查算法参数"); //不会执行
        exit();
        break;
};