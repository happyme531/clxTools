// 测试校准布局功能
const calibrateLayout = require("../src/ui/calibrateLayout.js");

// 测试用的归一化坐标点
const testPoints = [
    [0.5, 0.5],    // 中心点
    [0, 0],        // 左上角
    [1, 0],        // 右上角
    [0, 1],        // 左下角
    [1, 1],        // 右下角
    [0.25, 0.25],  // 左上1/4
    [0.75, 0.75]   // 右下3/4
];

// 运行测试
function runTest() {
    console.log("开始测试 calibrateLayout");
    console.log("测试点:", testPoints);
    
    // 调用校准函数
    let result = calibrateLayout(
        "请调整定位点位置\n参考点包括: 中心点、四个角和两个1/4点", 
        testPoints
    );
    
    // 显示结果
    console.log("校准结果:");
    console.log("左上点:", result.pos1);
    console.log("右下点:", result.pos2);
}

// 执行测试
runTest();
