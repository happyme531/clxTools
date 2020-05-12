var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "帮派任务";
task.steps = [];



task.steps.push(new function () {
    this.name = "接取任务";
    this.run = function () {
        click(pos.unifyx(2283), pos.unifyy(78)); //"活动"
        sleep(700);
        click(pos.unifyx(616), pos.unifyy(1365)); //"帮派"
        sleep(700);
        click(pos.unifyx(620), pos.unifyy(646)); //前往
        sleep(5000);
        console.info("已开始自动寻路");
        screenutil.waitUntilColorMatch(pos.unifyx(2903), pos.unifyy(59), "#fefffd");
        click(pos.unifyx(2633), pos.unifyy(925)); //"帮派任务"
        sleep(500);
        click(pos.unifyx(2655), pos.unifyy(943)); //确定
        return 1;
    };

})


task.steps.push(new function () {
    this.name = "完成任务";
    this.run = function () {
        let finished=0;
        while (!finished) {
            console.info("帮派任务:开始完成任务")

            //快速通过剧情
            let img = images.captureScreen();
            if (images.findImage(img, images.read("./src/assets/icon_share.png"))) click(pos.unifyx(1475), pos.unifyy(774));
            //检测购买商品
            let findingEnd = 0;

             while (!finished) {//检测商品购买界面叉号,3次
                sleep(800);
                if (screenutil.checkColor(pos.unifyx(2525), pos.unifyy(135), "#fdfffd")) {
                    findingEnd++;
                    console.info("帮派任务:检测到商品购买界面叉号,第%d次", findingEnd);
                } else {
                    findingEnd = 0;
                    break;
                }
                if (findingEnd > 3) {
                    console.info("帮派任务:开始购买商品..");
                    click(pos.unifyx(2019), pos.unifyy(1195));//购买
                    sleep(10000);
                    screenutil.waitUntilColorMatch(pos.unifyx(2482), pos.unifyy(825), "#bbc6c6");//"一键提交"
                    console.info("帮派任务:正在提交");
                    click(pos.unifyx(2481), pos.unifyy(822));
                    sleep(10000);
                    while (!finished) {
                        let img = images.captureScreen();
                        if (images.findImage(img, images.read("./src/assets/icon_share.png"))) {
                            click(pos.unifyx(1475), pos.unifyy(774));  //这个对话框不会自动消失，需要检测并点击
                            sleep(500);
                            finished=1;
                        };
                    };

                };
            };
        };
        return 1;
    };
}
)

module.exports = task;