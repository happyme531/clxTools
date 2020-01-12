var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "2020春节活动";
task.steps = [];

task.steps.push(new function () {
    this.name = "打开GUI";
    this.run = function () {
        click(pos.unifyx(2581), pos.unifyy(221));//进入图标
        return 1;
    };
})
task.steps.push(new function () {
    this.name = "七星报喜寻路";
    this.run = function () {
        console.info("2020春节:七星报喜:正在接取任务");
        click(pos.unifyx(1048), pos.unifyy(1074));//"七星报喜"
        sleep(500);
        click(pos.unifyx(2020), pos.unifyy(1283)); //"接取任务"
        sleep(1000);
        click(pos.unifyx(1475), pos.unifyy(774)); //点一下屏幕跳过剧情
        sleep(1000);
        while (1) {
            sleep(1000);
            click(pos.unifyx(324), pos.unifyy(337)); //每隔一秒点击一次任务，这个做法十分低效，必须确保这个任务在第一位！
            if (screenutil.checkColor(pos.unifyx(2905), pos.unifyy(60), "#fdfffd")) break;//检测右上角x号
        }
    };
})

task.steps.push(new function () {
    this.name = "七星报喜:完成任务";
    this.run = function () {
        console.info("2020春节:七星报喜:已进入对话");
        while (1) {
            sleep(1500);
            let img = images.captureScreen();
            if (images.findImage(img, images.read("./src/assets/icon_share.png"))){
                click(pos.unifyx(1475), pos.unifyy(774));  //过剧情
            } else {
                break;
            };
        };
        sleep(1500);
        click(pos.unifyx(324), pos.unifyy(337)); //重新进入对话
        sleep(1500);
        click(pos.unifyx(2134), pos.unifyy(962)); //挑选对联
        sleep(500);
        click(pos.unifyx(2134), pos.unifyy(962)); //"嗯嗯！"
        sleep(1000);
        click(pos.unifyx(324), pos.unifyy(337)); //重新进入对话

        while (1) {
            sleep(1500);
            let img = images.captureScreen();
            if (images.findImage(img, images.read("./src/assets/icon_share.png"))){
                click(pos.unifyx(1475), pos.unifyy(774));  //过剧情
            } else {
                break;
            };

        };
        return 1;
    };
})

task.steps.push(new function () {
    this.name = "入梦来:发送密令";
    this.run = function () {

        click(pos.unifyx(2581), pos.unifyy(221));//打开活动主页
        sleep(2000);
        click(pos.unifyx(2518), pos.unifyy(330)); //打开江湖入梦来
        sleep(1500);
        click(pos.unifyx(1416), pos.unifyy(1343)); //"在"
        sleep(1000);
        click(pos.unifyx(1914), pos.unifyy(1035)); //发送图标
        sleep(20000); //这个页面加载相当慢！
        click(pos.unifyx(2207),pos.unifyy(1179)); //发送
        sleep(3000);
        click(pos.unifyx(2527), pos.unifyy(128)); //叉号
        return 1;
    };
})

task.steps.push(new function() {
    this.name ="入梦来:破解密令";
    this.run = function() {
        

    };
})




module.exports = task;