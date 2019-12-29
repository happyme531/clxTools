requestScreenCapture();
var tasks=new Array();
tasks.push(require('./src/modules/钱庄.js'));
tasks.push(require('./src/modules/每日buff.js'));
tasks.push(require('./src/modules/豪杰.js'));
console.show();

let i=2;
for (let j = 0; j < tasks[i].steps.length; j++) {
    !tasks[i].steps[j].run()?exit():0;
    sleep(1000);
}
exit();

for (let i = 0; i < tasks.length; i++) {
    for (let j = 0; j < tasks[i].steps.length; j++) {
        tasks[0].steps[j].run();
        sleep(1000);
    }
}


