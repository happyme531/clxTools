var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "每日buff";
task.steps = [];

task.steps.push(new function () {
    this.name = "自动寻路到npc";
    this.run = function () {
        click(pos.unifyx(2280), pos.unifyy(68));//"活动"
        sleep(600);
        click(pos.unifyx(1813), pos.unifyy(1368));//"游历"
        sleep(600);
        click(pos.unifyx(1937), pos.unifyy(1069));//"每日一卦::前往"
        console.info("每日buff:开始寻路")
        let findingEnd = 0;
        while (findingEnd < 8) {//检测右上角叉号,8次
            if (screenutil.checkColor(pos.unifyx(2904), pos.unifyy(58), "#fefffd")) {
                findingEnd++;
                console.info("每日buff:检测成功,第%d次", findingEnd);
            } else {
                findingEnd = 0;
                console.info("每日buff:未检测到对话框")
            };

            sleep(800);
        };
        return 1;
    }

})
task.steps.push(new function () {
    this.name = "进入并完成";
    this.run = function () {
        console.info("")
        click(pos.unifyx(2664), pos.unifyy(932)); //"算命占卜";
        sleep(400);
        click(pos.unifyx(1553), pos.unifyy(377)); //"随缘";
        sleep(400);
        //随机画一点东西
        for (let i = 0; i < 10; i++) {
            swipe(random(pos.unifyx(932), pos.unifyx(2218)),
                random(pos.unifyy(370), pos.unifyy(1060)),
                random(pos.unifyx(932), pos.unifyx(2218)),
                random(pos.unifyy(370), pos.unifyy(1060))
                , 700)
            sleep(50);
        };
        sleep(200);

        click(pos.unifyx(2400), pos.unifyy(1086));//"落笔"
        sleep(800);
        click(pos.unifyx(2489), pos.unifyy(894));//"接受"
        sleep(800);
        click(pos.unifyx(1998), pos.unifyy(1011));//"确定"
        sleep(500);
        click(pos.unifyx(1529), pos.unifyy(692)); //点一下屏幕退出对话

        return 1;
    }
})
module.exports = task;