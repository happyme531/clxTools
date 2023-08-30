//@ts-check

/* 
欢迎!
此脚本用于在逆水寒手游的庄园中自动摆放聆音骨牌, 跑过去就能播放音乐!
效果展示: https://www.bilibili.com/video/BV11j411o7Az

操作步骤:
1. 运行楚留香音乐盒, 将游戏设置为"逆水寒手游 默认 3x7", 之后选择一首乐曲.
2. 可能需要调整一些配置让效果满意. 你可以在游戏中的乐器上测试效果.
3. 使用"导出为JSON按键序列数据"功能, 将数据导出
4. 将导出的数据的路径填写到下面的inputPath变量中
5. 进入庄园, 打开建造菜单
6. 切换到玩趣->聆音骨牌, 将下拉框全部缩回
7. 更多->自由, 开启自由模式(否则会冲突)
8. 确保为"网格"模式!
9. 通过AutoXjs的悬浮窗运行此脚本, 10秒内把出现的悬浮窗拖到不遮挡按钮的地方
10. 等着就行了, 脚本会自动摆放聆音骨牌, 摆放完一行后会自动停止. 感受科技的力量吧!
11. 向前走几步, 修改下面的startTimeSec和reverse变量, 重复步骤6-10摆放下一行.
12. 重复步骤11直到摆放完所有行.

注意事项:
1. 目前只能东西方向摆放, 不能南北方向摆放.
2. 默认一行是150小格(50大格)宽, 且以你一开始所在的位置为中心. 注意可用的范围.
*/

//输入文件路径
const inputPath = "/sdcard/楚留香音乐盒数据目录/dump(2).json";
//当前行第一个音符在乐曲中的开始时间(单位:秒). 
//如果你不改动下面的maxDistanceGrid, 那么每一行的播放时间为25秒.
//这种情况下如果你想完整摆放一首乐曲, 那么第一行的startTimeSec应该为0, 第二行应该为25, 第三行应该为50...
const startTimeSec = 0;
//摆放方向. true表示从右往左摆放, false表示从左往右摆放.
//如果你希望走s型路线, 那么第一行从左往右摆放, 第二行从右往左摆放, 第三行从左往右摆放...
const reverse = false; 

/*
长度单位说明:
在逆水寒手游的庄园中打开编辑器, 且启用更多->网格显示时, 会显示网格, 看起来是一大格包含3x3小格.
在移动模式为"网格"时, 打开右下角"微调", 会发现移动一次的距离为1小格.
在移动模式为"像素"时, 打开右下角"微调", 会发现移动一次的距离为1/4小格.
*/
//最长摆放距离,即每一行的宽度(单位:小格).  默认150其实非常宽, 如果不想摆放那么长, 可以改小一点.
const maxDistanceGrid = 150;

//时间配置. 如果手机性能较差, 点击过快可能会导致操作错误, 可以适当增加这些时间, 尤其是点击后的延迟.
//强烈建议游戏使用最低画质+高帧率运行.
const clickDurationSec = 0.05; //点击时间
const delayAfterClickSec = 0.2; //点击后的延迟
const swapDurationSec = 0.3; //滑动时间

//点击位置的标准差, 用于模拟人类的点击误差. 0表示不使用. 单位: 像素
const clickPositionStdDev = 7;
//点击时间的标准差, 用于模拟人类的点击误差. 0表示不使用. 单位: 毫秒
const clickDurationStdDev = 10;

//设备相关的常量 - 屏幕坐标
//以下坐标是在2340x1080的屏幕上设置的, Autojs有坐标缩放功能, 理论上不修改也能在其他分辨率的屏幕上运行.
//但如果你发现点击位置不对, 就需要手动修改以下所有坐标.
//当然也可以想办法(去百度找)如何修改分辨率, 使得脚本能够在你的设备上运行.
//基准分辨率: 2340x1080
setScreenMetrics(1080, 2340);

//打开建造菜单, 切换到玩趣->聆音骨牌, 将下拉框全部缩回, 之后获取坐标:
const categorySelectors = [
    [300,60],  //"聆音.低音" 下拉框中心坐标
    [300,176], //"聆音.常规" 下拉框中心坐标
    [300,252], //"聆音.高音" 下拉框中心坐标
]

const blockSelectorsL = [ //0-4
    [300,217], //展开任意一个下拉框后, 第一个材料选择框的中心坐标
    [300,426], //第二个材料选择框的中心坐标
    [300,638], //第三个材料选择框的中心坐标
    [300,806], //第四个材料选择框的中心坐标
    [300,1006],//第五个材料选择框的中心坐标
]

const blockSelectorsHPerCategory = [ 
    [[300,601],[300,796]], //只展开第一个下拉框后滑动到最下面, 倒数第二和倒数第一个材料选择框的中心坐标
    [[300,697],[300,897]], //只展开第二个下拉框后滑动到最下面, 倒数第二和倒数第一个材料选择框的中心坐标
    [[300,794],[300,1000]],//只展开第三个下拉框后滑动到最下面, 倒数第二和倒数第一个材料选择框的中心坐标
]

const placeButton = [569,460];//点击选择任意一个材料选择框后, 弹出菜单中"摆放"按钮的中心坐标
const enableMovementButton = [2050,990];//点击摆放后, 右下角"微调"按钮的中心坐标
const granularityToggleButton = [1734,155];//右侧上方"网格"按钮的中心坐标
const rightMoveButton = [2251,866];//打开微调菜单后, 右移按钮的中心坐标
const leftMoveButton = [2109,836];//打开微调菜单后, 左移按钮的中心坐标
const confirmPlaceButton = [2277,668];//右侧对钩按钮的中心坐标
const cancelPlaceButton = [2266,504];//右侧叉叉按钮的中心坐标

const blockSelectorsUpperBound = categorySelectors[2];
const blockSelectorsLowerBound = blockSelectorsHPerCategory[2][1];

//常量
//每一格需要的时间
//跑步 = 3.34/20
//走路 = 10.5/20
const travelTimePerGridSec = 3.34 / 20;
//每四分之一格需要的时间
const travelTimePerQuarterGridSec = travelTimePerGridSec / 4;

function NormalDistributionRandomizer(mean, stddev) {
    this.mean = mean;
    this.stddev = stddev;

    this.next = function () {
        var u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        var num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num * this.stddev + this.mean;
        return num;
    }
}

const clickPositionRandomizer = new NormalDistributionRandomizer(0, clickPositionStdDev);
const clickDurationRandomizer = new NormalDistributionRandomizer(0, clickDurationStdDev);

function randomizeClickPosition(point) {
    // @ts-ignore
    if (clickPositionStdDev === 0) {
        return point;
    }
    let deviation = 0;
    do {
        deviation = clickPositionRandomizer.next();
    } while (Math.abs(deviation) > 2 * clickPositionStdDev); 
    let angle = Math.random() * 2 * Math.PI;
    return [point[0] + deviation * Math.cos(angle), point[1] + deviation * Math.sin(angle)];
}

function randomizeClickDuration(duration) {
    // @ts-ignore
    if (clickDurationStdDev === 0) {
        return duration;
    }
    let deviation = 0;
    do {
        deviation = clickDurationRandomizer.next();
    } while (Math.abs(deviation) > 2 * clickDurationStdDev);
    duration = Math.max(4, duration + deviation);
    return duration;
}

function clickPoint(point) {
    let point2 = randomizeClickPosition(point);
    press(point2[0], point2[1], randomizeClickDuration(clickDurationSec * 1000));
    sleep(randomizeClickDuration(delayAfterClickSec * 1000));
}

function clickPointFast(point) {
    let point2 = randomizeClickPosition(point);
    press(point2[0], point2[1], randomizeClickDuration(clickDurationSec * 1000 / 2));
    sleep(randomizeClickDuration(delayAfterClickSec * 1000 / 3));
}

function shortSleep() {
    sleep(delayAfterClickSec / 2);
}

const DirectionUp = 0;
const DirectionDown = 1;

const DirectionLeft = 2;
const DirectionRight = 3;

function blockSelectorsSwipe(direction) {
    let startPoint = direction === DirectionUp ? blockSelectorsLowerBound : blockSelectorsUpperBound;
    startPoint = randomizeClickPosition(startPoint);
    let endPoint = direction === DirectionUp ? blockSelectorsUpperBound : blockSelectorsLowerBound;
    endPoint = randomizeClickPosition(endPoint);
    swipe(startPoint[0], startPoint[1], endPoint[0], endPoint[1], randomizeClickDuration(swapDurationSec * 1000));
    sleep(randomizeClickDuration(delayAfterClickSec * 1000));
}

const GranularityGrid = 0;
const GranularityQuarterGrid = 1;

let currentGranularity = GranularityGrid;

function setGranularity(granularity){
    if (currentGranularity === granularity) {
        return;
    }
    clickPointFast(granularityToggleButton);
    currentGranularity = granularity;
}


/**
 * @param {number} index
 */
function placeBlock(index, distanceQuarterGrid) {
    let category = Math.floor(index / 7);
    let block = index % 7;
    let isHigh = block >= 5;
    //选择类别/展开类别菜单(较慢)
    clickPoint(categorySelectors[category]);
    //选择方块(较慢)
    if (!isHigh) {
        clickPoint(blockSelectorsL[block]);
    }else{
        blockSelectorsSwipe(DirectionUp);
        clickPoint(blockSelectorsHPerCategory[category][block-5]);
    }
    //点击放置
    clickPoint(placeButton);
    //点击启用移动
    clickPointFast(enableMovementButton);

    const centerDistanceGrid = maxDistanceGrid /2;
    const centerDistanceQuarterGrid = centerDistanceGrid * 4;
    let direction = distanceQuarterGrid > centerDistanceQuarterGrid ? DirectionRight : DirectionLeft;
    if(reverse){
        direction = (direction === DirectionLeft ? DirectionRight : DirectionLeft);
    }
    distanceQuarterGrid = Math.abs(distanceQuarterGrid - centerDistanceQuarterGrid);

    //设置精度
    const gridCount = Math.floor(distanceQuarterGrid / 4);
    const quarterGridCount = distanceQuarterGrid % 4;
    setGranularity(GranularityGrid);
    for (let i = 0; i < gridCount; i++) {
        clickPointFast(direction === DirectionLeft ? leftMoveButton : rightMoveButton);
    }
    setGranularity(GranularityQuarterGrid);
    for (let i = 0; i < quarterGridCount; i++) {
        clickPointFast(direction === DirectionLeft ? leftMoveButton : rightMoveButton);
    }

    //点击确认放置
    clickPoint(confirmPlaceButton);
    clickPointFast(cancelPlaceButton);

    //菜单收起
    blockSelectorsSwipe(DirectionDown);
    clickPoint(categorySelectors[category]);

}


function main(){
    let json = files.read(inputPath);
    let data = JSON.parse(json);
    /**
     * JSON是从楚留香音乐盒/main.js 中merge pass的输出
     * 格式:
     * notes: Array<number> //midi音高
     * duration: number //时长,单位秒
     * 
     * JSON: Array<[Array<number>,  number]> //[notes, duration]
     */
    //Debug输出
    let countOfIntervalLessThanOneGrid = 0;

    let lastDistanceQuarterGrid = 0;
    for (let i = 0; i < data.length; i++) {
        let element = data[i];
        let notes = element[0];
        let duration = element[1] / 1000;
        console.log("序号: %s, 时间: %ss, 音符:%s", i, duration.toFixed(2),JSON.stringify(notes));
        duration -= startTimeSec;
        if (duration < 0) {
            continue;
        }
        let distanceQuarterGrid = duration / travelTimePerQuarterGridSec;
        distanceQuarterGrid = Math.round(distanceQuarterGrid);
        if (distanceQuarterGrid > maxDistanceGrid*4) {
            console.log("达到最大距离,停止");
            break;
        }
        if (distanceQuarterGrid - lastDistanceQuarterGrid < 1 && distanceQuarterGrid - lastDistanceQuarterGrid > 0) {
            countOfIntervalLessThanOneGrid++;
        }
        lastDistanceQuarterGrid = distanceQuarterGrid;
        for (let j = 0; j < notes.length; j++) {
            let note = notes[j];
            console.log("Place block: " + note + ":" + distanceQuarterGrid);
            placeBlock(note, distanceQuarterGrid);
        }
    }
}

console.show();
console.log("10秒钟后启动");
sleep(10000);
main();