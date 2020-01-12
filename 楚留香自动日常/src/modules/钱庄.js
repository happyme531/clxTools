
var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};

task.name = "钱庄";
task.steps = new Array();

task.steps.push(new function () {
    this.name = "打开GUI";
    this.run = function () {

        click(pos.unifyx(2724), pos.unifyy(404));//"包裹" 按钮
        sleep(1000);
        click(pos.unifyx(2731), pos.unifyy(855));//"钱庄" 按钮
        sleep(1000);
        if (screenutil.checkColor(pos.unifyx(1690), pos.unifyy(243), "#ccd5d4")) { //"钱庄"文字背景
            console.info("钱庄:进入gui成功");
            return 1;

        } else {
            console.warn("钱庄:进入gui失败");
            return 0;
        };
    };
})
task.steps.push(new function () {
    this.name = "领取钱庄收入";
    this.run = function () {
        click(pos.unifyx(2482), pos.unifyy(882)); //"领取"按钮
        console.info("钱庄:领取钱庄完成");
        return 1;
    }

}
)
task.steps.push(new function () {
    this.name = "领取侠缘金库";
    this.run = function() {
        click(pos.unifyx(2166),pos.unifyy(219)); //"侠缘金库" 按钮
        sleep(500);
        click(pos.unifyx(2472), pos.unifyy(877));//"领取"按钮
        return 1;
    };
    
})
task.steps.push(new function() {
    this.name = "退出GUI";
    this.run = function() {
        click(pos.unifyx(2722),pos.unifyy(34));
        return 1;
    };
})
module.exports = task;