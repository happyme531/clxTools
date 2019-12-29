requestScreenCapture();
var tasks=new Array();
tasks.push(require('./src/modules/钱庄.js'));
tasks.push(require('./src/modules/每日buff.js'));
tasks.push(require('./src/modules/豪杰.js'));
tasks.push(require('./src/modules/门派任务.js'));
tasks.push(require('./src/modules/论剑.js'));
console.show();
console.setSize(600, 400);
console.setPosition(600,400 )
sleep((5000));



tasks[4].steps[0].run()
exit();
let i=2;
for (let j = 0; j < tasks[i].steps.length; j++) {
    !tasks[i].steps[j].run()?exit():0;
    sleep(1000);
}


for (let i = 0; i < tasks.length; i++) {
    for (let j = 0; j < tasks[i].steps.length; j++) {
        tasks[0].steps[j].run();
        sleep(1000);
    }
}


