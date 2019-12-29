var pos = require('../utils/pos.js');
var screenutil = require('../utils/screenutil.js');
var task = {};
task.name = "威名豪杰";
task.steps = [];

task.steps.push(new function () {
    this.name="打开GUI";
    this.run = function() {
        click(pos.unifyx(2873),pos.unifyy(401)); //展开菜单
        sleep(500);
        click(pos.unifyx(2876), pos.unifyy(1148));//命格
        sleep(700);
        click(pos.unifyx(2729), pos.unifyy(1038)); //威名
        sleep(800);
        if(!screenutil.checkColor(pos.unifyx(2646),pos.unifyy(1004),"#ccd6d5")){//威名按钮的背景
            console.warn("威名:进入GUI失败" );
            return 0;
        };
        return 1;
    };
})
task.steps.push(new function() {
    this.name ="寻踪索迹"
    this.run = function() {
        for (let i = 0; i < 2; i++) {
        click(pos.unifyx(1573),pos.unifyy(1347)); //搜索(雾)按钮
        sleep(500);
        click(pos.unifyx(1998), pos.unifyy(1014)); //确定
        sleep(500);
        click(pos.unifyx(1968), pos.unifyy(1014)); //进行..
        sleep(3500);
        //TODO:对每一个豪杰拜见请教
        };
        return 1;

    }
});
module.exports = task;