var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "门派任务";
task.steps = [];

task.steps.push(new function () {
    this.name = "寻路到npc";
    this.run = function () {
        console.info("门派任务：正在打开菜单..");
        click(pos.unifyx(2278), pos.unifyy(68)); //"活动"
        sleep(700);
        click(pos.unifyx(318), pos.unifyy(1361));//"江湖"
        sleep(700);
        click(pos.unifyx(574), pos.unifyy(533));//"前往"
        sleep(500);
        click(pos.unifyx(838), pos.unifyy(1009));//"课业::前往"
        sleep(2000);
        //完成上述步骤后应该已经返回了主界面。所以..
        if (!screenutil.isMainScreen()) throw new Error("门派任务:开始寻路失败");
        console.info("门派任务：开始寻路");
        let findingEnd = 0;
        let totalFindCount = 0;
        while (findingEnd < 8) {//检测右上角叉号,8次
            totalFindCount++;
            if (screenutil.checkColor(pos.unifyx(2904), pos.unifyy(58), "#fefffd")) {
                findingEnd++;
                console.info("门派任务:检测成功,第%d次", findingEnd);
            } else {
                findingEnd = 0;
                console.info("门派任务:未检测到对话框")
            };
            sleep(800);
            if (totalFindCount > 150) {
                throw new Error("门派任务:寻路到NPC失败");
            };
        };
        return 1;
    }
})

task.steps.push(new function () {
    this.name = "领取任务";
    this.run = function () {
        click(pos.unifyx(2630), pos.unifyy(913));  //"课业"
        sleep(500);
        console.info("门派任务:开始选择课业..")
        switch (random(1, 3)) { //选择一个课业
            case 1:
                click(pos.unifyx(985), pos.unifyy(684));
                break;
            case 2:
                click(pos.unifyx(1553), pos.unifyy(694));
                break;
            case 3:
                click(pos.unifyx(2131), pos.unifyy(704));
                break;
        };
        sleep(700);
        click(pos.unifyx(1419), pos.unifyy(694)); //(跳过对话)
        return 1;

    };

})

task.steps.push(new function () {
    this.name = "完成任务1~4";
    this.run = function () {
        let finishTask4 = false;
        console.info("门派任务:开始完成前四个任务..")
        while (!finishTask4) {
            //处理前四个任务

            //其它任务都可以自动完成

            //处理回答问题类任务:实际上只要点叉号就可以完成
            //但是拜访类任务同样有叉号
            //所以可以先点几次屏幕中央，排除这类问题

            let findingEnd1 = 0;
            while (1) {//检测右上角叉号,3次(这个叉号位置和一般对话框不一样，有些偏移)
                sleep(800);
                if (screenutil.checkColor(pos.unifyx(2900), pos.unifyy(77), "#fefffd")) {
                    findingEnd1++;
                    console.info("门派任务:检测到问题中的叉号,第%d次", findingEnd);
                } else {
                    findingEnd1 = 0;
                    //console.info("门派任务:未检测到叉号" )
                    break;
                }

                if (findingEnd1 > 3) {
                    for (let i = 0; i < 4; i++) {
                        click(pos.unifyx(1419), pos.unifyy(694));
                        sleep(500);
                    };
                    //点击叉号
                    click(pos.unifyx(2900), pos.unifyy(77));
                    sleep(500);
                };
            };

            //快速通过剧情
            let img=images.captureScreen();
            if(images.findImage(img,images.read("./src/assets/icon_share.png"))) click(pos.unifyx(1475),pos.unifyy(774));
            
            //检测是否进入到了第五个任务
            //其实有个问题，如果第一次需求的物品玩家拥有，那么就检测不到..
            let findingEnd2 = 0;
            while (1) {//检测商品购买界面叉号,3次
                sleep(800);
                if (screenutil.checkColor(pos.unifyx(2278), pos.unifyy(207), "#fdfffd")) {
                    findingEnd2++;
                    console.info("门派任务:检测到商品购买界面叉号,第%d次", findingEnd2);
                } else {
                    findingEnd2 = 0;
                    //console.info("门派任务:未检测到叉号" )
                    break;
                }

                if (findingEnd2 > 3) {
                    finishTask4 = true;
                    break;
                };
            };
        };
        return 1;
    }
}
)
task.steps.push(new function () {
    this.name = "完成任务5";
    this.run = function () {
        console.info("门派任务:开始处理第五个任务");
        //处理第五个任务
        //由于我们有行当，身上是有需要提交的物品的
        //所以只要不停刷新直到不弹出购买框即可
        let itemRefreshCount = 0;
        while (screenutil.checkColor(pos.unifyx(2278), pos.unifyy(207), "#fffffd")) {
            click(pos.unifyx(2275), pos.unifyy(207))//购买界面叉号
            sleep(500);
            click(pos.unifyx(2525), pos.unifyy(137))//珍宝阁叉号
            sleep(500);
            //在没有刷新过物品时，现在应该没有菜单打开,所以需要打开任务界面
            if (itemRefreshCount == 0) {
                click(pos.unifyx(170), pos.unifyy(328)); //任务界面
                sleep(600);
            };
            click(pos.unifyx(781), pos.unifyy(356)); //折叠任务菜单
            sleep(500);
            click(pos.unifyx(779), pos.unifyy(516)); //打开江湖菜单
            sleep(500);
            click(pos.unifyx(1246), pos.unifyy(1173));//放弃
            sleep(500);
            click(pos.unifyx(1994), pos.unifyy(1025));//确认
            sleep(2500);
            itemRefreshCount++;
        };
        //检测提交按钮
        screenutil.waitUntilColorMatch(pos.unifyx(2482), pos.unifyy(825), "#bbc6c6");
        click(pos.unifyx(2481), pos.unifyy(822));
        sleep(1000);
        //辛苦了::确定
        click(pos.unifyx(1992), pos.unifyy(1019));
        sleep(1000);
        //在这之后关闭任务界面
        click(pos.unifyx(2523), pos.unifyy(140));
        return 1;

    }

})

module.exports = task;