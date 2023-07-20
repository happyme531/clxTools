//@ts-check

toast("等待完善中, 目前不好用");
exit();

//输入文件路径
const inputPath = "/sdcard/Download/dump.json";
//开始时间
const startTimeSec = 127;
//最长摆放距离(单位:大格子)
const maxDistanceGrid = 150;
//点击时间
const clickDurationSec = 0.25;
const delayAfterClickSec = 0.5;
const swapDurationSec = 0.8;

//常量
//每一格需要的时间
//跑步 = 3.34/20
//走路 = 10.5/20
const travelTimePerGridSec = 3.34 / 20;
//每四分之一格需要的时间
const travelTimePerQuarterGridSec = travelTimePerGridSec / 4;


//设备相关的常量 - 屏幕坐标
const categorySelectors = [ //玩趣->聆音骨牌->[低音,常规,高音] 
    [525,84],
    [525,216],
    [525,357],
]

const blockSelectorsL = [ //0-4
    [527,280],
    [527,560],
    [527,820],
    [527,1070],
    [527,1330],
]

const blockSelectorsHPerCategory = [ //5-6
    [[527,788],[527,1045]],
    [[527,915],[527,1172]],
    [[527,1067],[527,1315]],
]

const placeButton = [895,679];
const enableMovementButton = [2553,1319];
const granularityToggleButton = [2100,231];
const rightMoveButton = [2790,1116];
const confirmPlaceButton = [2841,900];
const cancelPlaceButton = [2832,673];

const blockSelectorsUpperBound = categorySelectors[2];
const blockSelectorsLowerBound = blockSelectorsHPerCategory[2][1];


function clickPoint(point) {
    press(point[0], point[1],clickDurationSec*1000);
    sleep(delayAfterClickSec*1000);
}

function clickPointFast(point){
    press(point[0], point[1],clickDurationSec*1000 /2);
    sleep(delayAfterClickSec*1000 /3);
}

function shortSleep(){
    sleep(delayAfterClickSec/2);
}

const DirectionUp = 0;
const DirectionDown = 1;

function blockSelectorsSwipe(direction){
    let startPoint = direction === DirectionUp ? blockSelectorsLowerBound : blockSelectorsUpperBound;
    let endPoint = direction === DirectionUp ? blockSelectorsUpperBound : blockSelectorsLowerBound;
    swipe(startPoint[0], startPoint[1], endPoint[0], endPoint[1], swapDurationSec*1000);
    sleep(delayAfterClickSec*1000);
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

    //设置精度
    const gridCount = Math.floor(distanceQuarterGrid / 4);
    const quarterGridCount = distanceQuarterGrid % 4;
    setGranularity(GranularityGrid);
    for (let i = 0; i < gridCount; i++) {
        clickPointFast(rightMoveButton);
    }
    setGranularity(GranularityQuarterGrid);
    for (let i = 0; i < quarterGridCount; i++) {
        clickPointFast(rightMoveButton);
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
        let duration = element[1];
        duration -= startTimeSec;
        console.log("Note: " + element + "/+" + duration + "s");
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
sleep(3000);
main();