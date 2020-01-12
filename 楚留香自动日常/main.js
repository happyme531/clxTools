requestScreenCapture();
var tasks = new Array();
tasks.push(require('./src/modules/钱庄.js'));
tasks.push(require('./src/modules/每日buff.js'));
tasks.push(require('./src/modules/豪杰.js'));
tasks.push(require('./src/modules/门派任务.js'));
//tasks.push(require('./src/modules/论剑.js'));


var statusWindow = floaty.rawWindow(
    <frame gravity="center" bg="#44ffff00">
        <text id="text"></text>
    </frame>
);

function runSingleStep() {
    let taskNames = [];
    for (i in tasks) taskNames.push(tasks[i].name);
    let task = -1;
    dialogs.build({
        title: "选择一个模块..",
        items: taskNames,
        itemsSelectMode: "select",
        negative: "取消",
    }).on("item_select", (index, item, dialog) => {
        task = index;
    }).on("negative", () => {
        toast("你取消了选择，脚本将会退出.."); 
    }).show();
    while(task==-1);
    let stepNames = [];
    for (i in tasks[task].steps) stepNames.push(tasks[task].steps[i].name);
    let step = -1;
    dialogs.build({
        title: "选择一个步骤..",
        items: stepNames,
        itemsSelectMode: "select",
        negative: "取消",
    }).on("item_select", (index, item, dialog) => {
        step = index;
    }).on("negative", () => {
        toast("你取消了选择，脚本将会退出..");
    }).show();
    while(step==-1);
    sleep(5000);
    ui.run(function(){
        statusWindow.text.setText(util.format("当前正在执行:%s,%s",tasks[task].name,tasks[task].steps[step].name));
    });
    tasks[task].steps[step].run();
};


function runFromStep(){
    let taskNames = [];
    for (i in tasks) taskNames.push(tasks[i].name);
    let task = -1;
    dialogs.build({
        title: "选择一个模块..",
        items: taskNames,
        itemsSelectMode: "select",
        negative: "取消",
    }).on("item_select", (index, item, dialog) => {
        task = index;
    }).on("negative", () => {
        toast("你取消了选择，脚本将会退出.."); 
    }).show();
    while(task==-1);
    let stepNames = [];
    for (i in tasks[task].steps) stepNames.push(tasks[task].steps[i].name);
    let step = -1;
    dialogs.build({
        title: "选择一个步骤..",
        items: stepNames,
        itemsSelectMode: "select",
        negative: "取消",
    }).on("item_select", (index, item, dialog) => {
        step = index;
    }).on("negative", () => {
        toast("你取消了选择，脚本将会退出..");
    }).show();
    while(step==-1);

    for (let i = step; i < tasks[task].steps.length; i++) {
        ui.run(function(){
            statusWindow.text.setText(util.format("当前正在执行:%s,%s",tasks[task].name,tasks[task].steps[i].name));
        });
        tasks[task].steps[i].run()        
    };

    for (let i = task+1; i < tasks.length; i++) {
        for (let j = 0; j < tasks[i].steps.length; j++) {
            ui.run(function(){
                statusWindow.text.setText(util.format("当前正在执行:%s,%s",tasks[i].name,tasks[i].steps[j].name));
            });
            tasks[i].steps[j].run()
        }; 
    };
};

function runAll() {
    sleep(5000);
    for (let i = 0; i < tasks.length; i++) {
        for (let j = 0; j < tasks[i].steps.length; j++) {
            ui.run(function(){
                statusWindow.text.setText(util.format("当前正在执行:%s,%s",tasks[i].name,tasks[i].steps[j].name));
            });
            if (!tasks[i].steps[j].run()) {
                toast("脚本出现错误");
            };
            sleep(1000);
        };
    };
};

statusWindow.setPosition(941, 281);
statusWindow.setSize(1029,187);
statusWindow.setTouchable(false);
ui.run(function(){
    statusWindow.text.setText("脚本已经启动..");
});

switch (dialogs.singleChoice("选择一个操作", ["执行全部", "执行单步","从某个步骤继续"], 0)) {
    case 0:
        runAll();
        break;
    case 1:
        runSingleStep();
        break;
    case 2:
        runFromStep();
        break;
    default:
        toast("请选择一个选项");
        break;

};



