"ui";

var { requireShared } = require("./src/requireShared.js");

var runtimes = requireShared("runtimes.js");

const 说明文字 = "\
1. 为了点击屏幕与显示播放进度条, 此脚本需要悬浮窗,后台弹出界面与无障碍权限. 其它权限均不需要. 脚本无需联网, 不会收集任何数据.\n\
2. 使用方法: 点击右下角按钮打开悬浮窗, 切回游戏, 点击悬浮窗即可使用. 长按悬浮窗退出.\n\
3. 你可以随时按音量上键结束运行.\n\
4. 脚本制作: 楚留香(一梦江湖)::声声慢::心慕流霞::李芒果. \n\
5. 此脚本是开源项目, 欢迎fork, star, issue, pr. \n\
6. 感谢autoX.js作者提供的框架\n\
\n\
当前版本支持的游戏: \n\
- 楚留香(一梦江湖) \n\
- 天涯明月刀手游 \n\
- 原神(风物之诗琴/老旧的诗琴) \n\
- 光遇(3x5/2x4键位) \n\
- 逆水寒手游(3x7/3x12/1x7键位/专业模式) \n\
- 蛋仔派对(21/15键) \n\
- 黎明觉醒 \n\
- 奥比岛(22/15键) \n\
- 哈利波特: 魔法觉醒(专业/普通模式) \n\
- 第五人格 \n\
- 阴阳师 \n\
- 摩尔庄园 \n\
- 明日之后(传统模式) \n\
- 元梦之星 \n\
- 其它通过触摸屏幕演奏乐曲，且音符为矩阵分布的游戏\n\
\n\
当前版本支持的音乐格式: \n\
MIDI(.mid), ToneJS(.json), DoMiSo(.dms.txt), SkyStudio(.skystudio.txt)\n\
\n\
当前版本支持的分辨率: 任意分辨率 \n\
\n\
音乐存储位置: /sdcard/楚留香音乐盒数据目录 \n\
"

const 说明文字行数 = 说明文字.split("\n").length;

const projectUrl = "https://github.com/happyme531/clxTools";
const anotherProjectUrl = "https://github.com/happyme531/GenshinImpactPianoExtract";

var isDarkMode = false;
try {
    isDarkMode = (context.getResources().getConfiguration().uiMode & context.getResources().getConfiguration().UI_MODE_NIGHT_MASK) == context.getResources().getConfiguration().UI_MODE_NIGHT_YES;
    console.log("isDarkMode: " + isDarkMode);
} catch (e) {
    console.log(e);
}

function startFloatWindow(size) {
    var path = "main.js";
    if (!files.exists(path)) {
        toastLog("脚本文件不存在: " + path);
        exit();
    }

    const packageManager = context.getPackageManager();
    const appName = packageManager.getApplicationLabel(context.getApplicationInfo()).toString();

    const haveFloatyPermission = runtimes.getCurrentRuntime() === runtimes.Runtime.AUTOXJS ?
        floaty.checkPermission() :
        floaty.hasPermission();
        
    if (!haveFloatyPermission) {
        // 没有悬浮窗权限，提示用户并跳转请求
        toastLog(`请打开应用 "${appName}" 的悬浮窗权限!`);
        floaty.requestPermission();
        while (!floaty.checkPermission()) sleep(100);
        toastLog('悬浮窗权限已开启');
    }


    var window = floaty.window(
        <frame>
            <img id="action" src="@drawable/ic_library_music_black_48dp" w={size} h={size} bg="#20000000" tint="#ffff00" />
        </frame>
    );

    setInterval(() => {
        
    }, 1000);

    var execution = null;

    //记录按键被按下时的触摸坐标
    var x = 0, y = 0;
    //记录按键被按下时的悬浮窗位置
    var windowX, windowY;
    //记录按键被按下的时间以便判断长按等动作
    var downTime;

    window.action.setOnTouchListener(function (view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = window.getX();
                windowY = window.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                //移动手指时调整悬浮窗位置
                window.setPosition(windowX + (event.getRawX() - x),
                    windowY + (event.getRawY() - y));
                //如果按下的时间超过1秒判断为长按，退出脚本
                if (new Date().getTime() - downTime > 1000) {
                    toastLog("悬浮窗已退出");
                    exit();
                }
                return true;
            case event.ACTION_UP:
                //手指弹起时如果偏移很小则判断为点击
                if (Math.abs(event.getRawY() - y) < 5 && Math.abs(event.getRawX() - x) < 5) {
                    onClick();
                }
                return true;
        }
        return true;
    });

    let execution = null;
    function onClick() {
        if (execution === null || (execution !== null && execution.getEngine().isDestroyed())) {
            execution = engines.execScriptFile(path);
        }
    }

}

ui.layout(
    <frame bg={isDarkMode ? "#000000" : "#ffffff"}>
        <vertical>
            {/* 标题栏 */}
            <appbar>
                <toolbar id="toolbar" title="楚留香音乐盒" />
            </appbar>
            {/* 滚动文字说明 */}
            <ScrollView layout_weight="1" fadeScrollbars="false">
                <text id="text" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text={说明文字} line={说明文字行数} />
            </ScrollView>

            {/* 拖动条 */}
            <text id="barDesc" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text="悬浮窗大小调节: 36" />
            <seekbar id="seekbar" max="100" progress="36" />

            {/* 底栏按钮 */}
            <horizontal>
                <button id="projectLinkBtn" text="打开项目主页" />
            </horizontal>

            <text id="anotherProjectLinkText" textSize="16dp" textColor={isDarkMode ? "#ffffff" : "#000000"} text="有兴趣了解一下另一个项目吗?" />
            <horizontal>
                <button id="anotherProjectLinkBtn" text="打开自动扒谱项目主页" />
            </horizontal>

        </vertical>
        {/* 右下角启动按钮 */}
        <fab id="launchBtn" w="auto" h="auto" src="@drawable/ic_launch_black_48dp" margin="16" layout_gravity="bottom|right" tint="#ffffff" />
    </frame>
)

ui.text.setText(说明文字);
let floatWindowSize = 36;
ui.seekbar.setOnSeekBarChangeListener({
    onProgressChanged: function (seekBar, progress, fromUser) {
        floatWindowSize = progress;
        ui.barDesc.setText("悬浮窗大小调节: " + progress);
    }
});

let floatWindowStarted = false;
ui.launchBtn.on("click", () => {
    if (!floatWindowStarted) {
        console.log("launch!");
        threads.start(() => {
            startFloatWindow(floatWindowSize);
        });
        floatWindowStarted = true;
    }
    if (auto.service != null) {
        home();
    }
});

ui.projectLinkBtn.on("click", () => {
    app.openUrl(projectUrl);
});

ui.anotherProjectLinkBtn.on("click", () => {
    app.openUrl(anotherProjectUrl);
});

let canExit = false;
let canExitTimeout = null;
ui.emitter.on("back_pressed", (e) => {
    if (!canExit) {
        toast("再按一次关闭悬浮窗并退出脚本");
        canExit = true;
        canExitTimeout = setTimeout(() => {
            canExit = false;
        }, 2000);
        e.consumed = true;
    } else {
        clearTimeout(canExitTimeout);
        e.consumed = false;
    };
})