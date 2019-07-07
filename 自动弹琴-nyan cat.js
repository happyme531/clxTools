//全局延迟(ms)
var d = 140;
//声调偏移
var toneoffset = 0;
//注意，这是横屏状态的坐标:左上角(0,0),向右x增，向下y增
//3120x1440分辨率的参数(我的lg g7,2k屏)
var clickx_3120x1440 = [781, 1099, 1418, 1735, 2051, 2369, 2686];
var clicky_3120x1440 = [1271, 1089, 905];
var longclick_3120x1440 = [400, 525]; //x,y
//1920x1080分辨率的参数(现在的大多数手机)
var clickx_1920x1080 = [390, 545, 702, 854, 1010, 1167, 1324]
var clicky_1920x1080 = [997, 910, 820];
var longclick_1920x1080 = [223, 614];

//数据
var data;
var data1 = [[17,1,0],[18,1,0],[19,1,0],[0,1,0],[15,1,0],[18,1,0],[17,1,0],[18,1,0],[19,1,0],[15,1,0],[17,1,0],[18,1,0],[17,1,0],[21,1,0],[15,1,0],[0,1,0],
             [19,1,0],[0,1,0],[17,1,0],[18,1,0],[19,1,0],[0,1,0],[15,2,0],[16,1,0],[21,1,0],[15,1,0],[16,1,0],[18,1,0],[17,1,0],[18,1,0],[16,1,0]]

var data2 = [[19,2,0],[20,2,0],[17,1,0],[17,2,0],[15,1,0],[18,1,0],[16,1,0],[15,2,0],[15,2,0],[16,2,0],[17,2,0],[16,1,0],[15,1,0],[15,1,0],[16,1,0],[17,1,0],[19,1,0],[20,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[15,1,0],
             [17,2,0],[19,2,0],[20,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[15,1,0],[16,1,0],[17,2,0],[15,1,0],[15,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[16,1,0],[15,1,0],[16,2,0],[15,2,0],[16,2,0],
             [19,2,0],[20,2,0],[17,1,0],[17,2,0],[15,1,0],[18,1,0],[16,1,0],[15,2,0],[15,2,0],[16,2,0],[17,2,0],[16,1,0],[15,1,0],[15,1,0],[16,1,0],[17,1,0],[19,1,0],[20,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[15,1,0],
             [17,2,0],[19,2,0],[20,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[17,1,0],[15,1,0],[16,1,0],[15,1,0],[16,1,0],[17,2,0],[15,1,0],[15,1,0],[17,1,0],[19,1,0],[16,1,0],[17,1,0],[16,1,0],[15,1,0],[16,2,0],[15,2,0],[15,2,0],
             [15,2,0],[12,1,0],[13,1,0],[15,2,0],[12,1,0],[13,1,0],[15,1,0],[16,1,0],[17,1,0],[15,1,0],[18,1,0],[17,1,0],[18,1,0],[19,1,0],[15,2,0],[15,2,0],[12,1,0],[13,1,0],[15,1,0],[12,1,0],[18,1,0],[17,1,0],[16,1,0],[15,1,0],[11,1,0],[10,1,0],[11,1,0],[12,1,0],
             [15,2,0],[12,1,0],[13,1,0],[15,2,0],[12,1,0],[13,1,0],[15,1,0],[15,1,0],[16,1,0],[17,1,0],[15,1,0],[12,1,0],[13,1,0],[12,1,0],[15,2,0],[15,1,0],[14,1,0],[15,1,0],[12,1,0],[13,1,0],[15,1,0],[18,1,0],[17,1,0],[18,1,0],[19,1,0],[15,2,0],[14,2,0],
             [15,2,0],[12,1,0],[13,1,0],[15,2,0],[12,1,0],[13,1,0],[15,1,0],[16,1,0],[17,1,0],[15,1,0],[18,1,0],[17,1,0],[18,1,0],[19,1,0],[15,2,0],[15,2,0],[12,1,0],[13,1,0],[15,1,0],[12,1,0],[18,1,0],[17,1,0],[16,1,0],[15,1,0],[11,1,0],[10,1,0],[11,1,0],[12,1,0],
             [15,2,0],[15,1,0],[14,1,0],[15,1,0],[12,1,0],[13,1,0],[15,1,0],[18,1,0],[17,1,0],[18,1,0],[19,1,0],[15,2,0],[16,3,0]]
             
             
//安全点击
function safeclick(x, y, time) {
    press(x + random(-5, 5), y + random(-5, 5) - 10, time);
};

sleep(300);

//检测分辨率
if (device.width == 1080 && device.height == 1920) {
    var clickx_pos = clickx_1920x1080;
    var clicky_pos = clicky_1920x1080;
    var longclick_pos = longclick_1920x1080;
} else if (device.width == 1440 && device.height == 3120) {
    var clickx_pos = clickx_3120x1440;
    var clicky_pos = clicky_3120x1440;
    var longclick_pos = longclick_3120x1440;
}

data=data2;
//主循环
while(1){
var i = 0
while (i < data.length) {
    var tone = data[i][0];
    var delaytime = data[i][1];
    var gestureList = new Array();
    if (tone != 0) {

        var clicky = Math.floor((tone - 1) / 7) + 1; //得到x
        if (tone % 7 == 0) { //得到y
            var clickx = 7;
        } else {
            var clickx = tone % 7;
        };

        if (delaytime < 6) {
            //短音
            safeclick(clickx_pos[clickx - 1], clicky_pos[clicky - 1], 5 + Math.random(10));
            sleep(delaytime * d);
        } else {
            //长音
            gestures([0, delaytime * d / 2, [clickx_pos[clickx - 1], clicky_pos[clicky - 1]]], [0, delaytime * d / 2, longclick_pos]);
            sleep(delaytime * d / 2);
        };



    };
    i++
};
data=data2;
};