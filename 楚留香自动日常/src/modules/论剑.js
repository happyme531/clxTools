var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "华山论剑";
task.steps = [];

task.steps.push(new function () {
    this.name = "论剑"
    this.run = function () {
        let playCount = 0;
        while (playCount < 5) {
            if (playCount == 0) {
                //第一次进入，从活动页面开始
                click(pos.unifyx(2278), pos.unifyy(68)); //"活动"
                sleep(700);
                click(pos.unifyx(906), pos.unifyy(1363)); //"纷争"
                sleep(700);
                click(pos.unifyx(629), pos.unifyy(800)); //华山论剑::匹配
                sleep(500);
            } else {
                //之后只需要点击匹配按钮
                click(pos.unifyx(2180), pos.unifyy(1181));
                sleep(500);
            };
            //检测匹配成功
            screenutil.waitUntilColorMatch(pos.unifyx(636), pos.unifyy(76), "#c64946", 3)//(玩家血条)
            playCount++;
            click(pos.unifyx(1561), pos.unifyy(170));//准备

            //现在开始脚本的骚操作
            let end = 0;
            let skillUsed = 0;
            while (!end) {
                //向左前方走动
                let angle = random(45, 135) / 180 * Math.PI;
                let joystickx = pos.unifyx(428);
                let joysticky = pos.unifyy(1038);
                swipe(joystickx, joysticky, joystickx + 80 * Math.cos(angle), joysticky - 80 * Math.sin(angle), random(600, 1200));
                sleep(30);
                //随机走动
                angle = random(0, 360) / 180 * Math.PI;
                swipe(joystickx, joysticky, joystickx + 80 * Math.cos(angle), joysticky - 80 * Math.sin(angle), random(200, 400));
                //检测自己被攻击,之后使用所有技能
                //TODO:搞一个更好的ai...
                if (!screenutil.checkColor(pos.unifyx(641), pos.unifyy(71), "#c64946") && !skillUsed) {//(血条)
                    swipe(pos.unifyx(2628), pos.unifyy(701), pos.unifyx(2111), pos.unifyy(1293), 400);//进入第二页技能
                    click(pos.unifyx(2401), pos.unifyx(1127));//从下到上第二个技能;
                    sleep(800);
                    swipe(pos.unifyx(2628), pos.unifyy(701), pos.unifyx(2111), pos.unifyy(1293), 400);//第一页
                    click(pos.unifyx(2549), pos.unifyy(1312));//第一个技能
                    sleep(4000);
                    press(pos.unifyx(2448), pos.unifyy(884), 2500);//第三个技能
                    sleep(1600);
                    click(pos.unifyx(2647), pos.unifyy(757));//第四个技能
                    sleep(400);
                    swipe(pos.unifyx(2628), pos.unifyy(701), pos.unifyx(2111), pos.unifyy(1293), 400);//第二页
                    click(pos.unifyx(2448), pos.unifyy(884));//第三个技能
                    sleep(1600);
                    swipe(pos.unifyx(2628), pos.unifyy(701), pos.unifyx(2111), pos.unifyy(1293), 400);//第一页
                    click(pos.unifyx(2401), pos.unifyx(1127));//第二个技能;
                    skillUsed = 1;
                };
                if (screenutil.checkColor(pos.unifyx(2130), pos.unifyy(1147), "#b7c3c4")) { //匹配按钮
                    end = 1;
                    sleep(2000);
                };
            };

        };
        click(pos.unifyx(2196), pos.unifyy(1004)); //5次宝箱
        sleep(50);
        click(pos.unifyx(2523), pos.unifyy(131)); //关闭
        sleep(400);
        click(pos.unifyx(2862), pos.unifyy(106)); //关闭
        return 1;

    };
});
module.exports = task;
