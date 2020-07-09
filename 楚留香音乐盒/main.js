var globalConfig = storages.create("hallo1_clxmidiplayer_config");
const musicDir = "/sdcard/楚留香音乐盒数据目录/"
const scriptVersion = 9;


function getJsonLength(json) {
    var jsonLength = 0;
    for (var i in json) {
        jsonLength++;
    }
    return jsonLength;
};

function getFileList() {
    //遍历synth文件夹中所有文件，获得标题信息
    let totalFiles = files.listDir(musicDir, function (name) {
        return name.endsWith(".json") && files.isFile(files.join(musicDir, name));
    });
    let titles = new Array(totalFiles.length);
    //log(totalFiles);
    for (let file in totalFiles) {
        log(musicDir + totalFiles[file]);
        //读取json文件速度太慢

        //let tmp = files.read(musicDir + totalFiles[file]);
        //tmp = JSON.parse(tmp);
        //if (tmp.header.name != "") {
        //    titles[file] = tmp.header.name;
        //} else {

        //直接读取文件名
        titles[file] = totalFiles[file].replace(".json", "");
    };
    return titles;
};

//将类似"C3"这样的音符名转换为音高
function name2pitch(name) {
    const toneNames = ["C", "D", "E", "F", "G", "A", "B"];
    let pitch = -1;
    let m = -majorPitchOffset + 3;
    if (name.endsWith((m++).toString())) pitch += 0 + 1;
    if (name.endsWith((m++).toString())) pitch += 7 + 1;
    if (name.endsWith((m++).toString())) pitch += 14 + 1;
    if (pitch == -1) { //结尾不是3,4,5
        return 0;
    };
    m = minorPitchOffset;
    for (let i in toneNames) {
        if (name.charAt(0) === toneNames[i]) {
            pitch += parseInt(i) + 1 + minorPitchOffset;
            break;
        };
    };
    if (treatHalfAsCeiling){
        if (name.charAt(1)==="#") pitch++;
    };
    if (pitch > 21 || pitch < 1) return 0;
    return pitch;
};

function initFileConfig(filepath) {
    console.info("初始化文件:" + filepath);
    files.create(filepath);
    let cfg = {};
    cfg.majorPitchOffset = 0;
    cfg.minorPitchOffset = 0;
    files.write(filepath, JSON.stringify(cfg));

};

function setGlobalConfig(key, val) {
    globalConfig.put(key, val);
    if (globalConfig.get(key) == val) {
        toast("设置保存成功");
        return 1;
    } else {
        toast("设置保存失败");
        return 0;
    }

};

function readGlobalConfig(key, defaultValue) {
    return globalConfig.get(key, defaultValue);
};
function setFileConfig(key, val, filename) {

    filename = filename.replace(".json", ""); //如果原先有.json后缀，删除它
    filename += ".json.cfg";
    let filepath = musicDir + filename;
    if (!files.exists(filepath)) {
        initFileConfig(filepath);
    };
    let tmp = files.read(filepath);
    tmp = JSON.parse(tmp);

    tmp[key] = val;
    files.write(filepath, JSON.stringify(tmp));
    toast("设置保存成功");
    return 0;

};

function readFileConfig(key, filename) {
    filename = filename.replace(".json", ""); //如果原先有.json后缀，删除它
    filename += ".json.cfg";
    let filepath = musicDir + filename;
    if (!files.exists(filepath)) {
        initFileConfig(filepath);
    };
    let tmp = files.read(filepath);
    tmp = JSON.parse(tmp);
    return tmp[key];
};




function runFileSetup(fileList) {
    let fileName = dialogs.singleChoice("选择一首乐曲..", fileList);
    fileName = fileList[fileName];
    switch (dialogs.singleChoice("请选择一个设置，所有设置都会自动保存", ["调整音高", "半音处理方式"])) {
        case 0:
            setFileConfig("majorPitchOffset", dialogs.singleChoice("调整音高1", ["降低一个八度", "默认", "升高一个八度"], readFileConfig("majorPitchOffset", fileName) + 1) - 1, fileName);
            setFileConfig("minorPitchOffset", dialogs.singleChoice("调整音高2", ["降低2个音阶", "降低1个音阶", "默认", "升高1个音阶", "升高2个音阶"], readFileConfig("minorPitchOffset", fileName) + 2) - 2, fileName);
            break;
        case 1:
            setFileConfig("halfCeiling", dialogs.singleChoice("楚留香的乐器无法弹奏半音，所以对于半音..", ["降低", "升高"], readFileConfig("halfCeiling", fileName)), fileName);

    };
};

function runGlobalSetup() {
    switch (dialogs.singleChoice("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "检测进入游戏"])) {
        case 0:
            setGlobalConfig("skipInit", dialogs.singleChoice("是否跳过乐曲开始前的空白?", ["否", "是"]));
            break;
        case 1:
            setGlobalConfig("waitForGame", dialogs.singleChoice("是否等待进入游戏后再开始弹奏?", ["否", "是"]));
            break;
    };
};

//toast(name2pitch("B6"));
//exit();


/////////
//主程序//
/////////
files.ensureDir(musicDir);
//globalConfig.put("inited", 0);
if (readGlobalConfig("lastVersion", 0) != scriptVersion) {
    //第一次启动，初始化设置
    toast("初始化设置..");

    if (readGlobalConfig("skipInit", -1) == -1) setGlobalConfig("skipInit", 1);
    if (readGlobalConfig("waitForGame", -1) == -1) setGlobalConfig("waitForGame", 1);

    let files_ = files.listDir("./exampleTracks");
    for (let i in files_) {
        toast("copy:" + files_[i])
        files.copy("./exampleTracks/" + files_[i], musicDir + files_[i]);
    };
    setGlobalConfig("lastVersion", scriptVersion);

};

console.info("\
1.为了点击屏幕，本程序需要辅助功能权限，这是必须的，剩下的权限拒绝就行\n\
2.使用方法:在游戏中切换到演奏界面，打开这个脚本，之后切回游戏，脚本将会在3秒后开始运行\n\
3.你可以随时按音量上键结束运行\n\
4.如果脚本输出一些文字就没反应了，请允许脚本的悬浮窗权限！！(坑爹的小米手机)\n\
5.脚本制作:声声慢:心慕流霞 李芒果，也强烈感谢auto.js作者提供的框架\n\
");

console.verbose("等待无障碍服务..");
//toast("请允许本应用的无障碍权限");
auto.waitFor();
const fileList = getFileList();


//解析信息

var index;
switch (dialogs.singleChoice("选择一项操作..", ["演奏乐曲", "更改全局设置", "更改乐曲设置", "查看使用说明"])) {

    case 0:
        index = dialogs.singleChoice("选择一首乐曲..", fileList);
        break;
    case 1:
        runGlobalSetup();
        exit();
        break;
    case 2:
        runFileSetup(fileList);
        exit();
        break;
    case 3:
        app.viewFile(musicDir + "使用帮助.txt");
        exit();
        break;
};

const totalFiles = files.listDir(musicDir, function (name) {
    return name.endsWith(".json") && files.isFile(files.join(musicDir, name));
});
var fileName = totalFiles[index];


try {
    const jsonData = JSON.parse(files.read(musicDir + fileName));
} catch (err) {
    toast("文件解析失败！请检查格式是否正确");
    console.error("文件解析失败:" + err + ",数据文件可能缺失或不完整！");
};

//读取音轨列表
var tracks = new Array();
for (let i in jsonData.tracks) {
    let noteCount = getJsonLength(jsonData.tracks[i].notes);
    if (jsonData.tracks[i].name != "") {
        tracks.push(i + ":" + jsonData.tracks[i].name + ":" + noteCount + "个音符");
    } else {
        tracks.push(i + ":" + "未命名" + ":" + noteCount + "个音符");
    };
};

const majorPitchOffset = readFileConfig("majorPitchOffset", fileName);
const minorPitchOffset = readFileConfig("minorPitchOffset", fileName);
const treatHalfAsCeiling = readFileConfig("halfCeiling",fileName);
const track = dialogs.singleChoice("选择一个音轨..", tracks);
console.assert(track != -1, "错误:请选择一个选项");

//exit();

dialogs.alert("", "切回游戏，脚本会自动开始")
console.verbose("无障碍服务启动成功");
if (readGlobalConfig("waitForGame", 1)) waitForPackage("com.netease.wyclx");

toast("即将在5秒钟内开始...");
sleep(5000);

//注意，这是横屏状态的坐标:左上角(0,0),向右x增，向下y增
//检测分辨率
console.info("你的屏幕分辨率是:%dx%d", device.height, device.width);

if (device.width == 1080 && device.height == 1920) {
    //1920x1080分辨率的参数(现在的大多数手机)
    var clickx_pos = [340, 580, 819, 1055, 1291, 1531, 1768];
    var clicky_pos = [956, 816, 680];
    var longclick_pos = [78, 367];
} else if (device.width == 1440 && device.height == 3120) {
    //3120x1440分辨率的参数(我的lg g7,2k屏)
    var clickx_pos = [781, 1099, 1418, 1735, 2051, 2369, 2686];
    var clicky_pos = [1271, 1089, 905];
    var longclick_pos = [400, 525]; //x,y
} else if (device.width == 1080 && device.height == 2160) {
    //2160x1080带鱼屏的分辨率
    var clickx_pos = [460, 697, 940, 1176, 1414, 1652, 1862];
    var clicky_pos = [955, 818, 679];
    var longclick_pos = [204, 359];
} else if (device.width == 1080 && device.height == 2340) {
    //eg.红米k20 pro
    var clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
    var clicky_pos = [955, 818, 680];
    var longclick_pos = [204, 359];
} else if (device.width == 720 && device.height == 1520) {
    //1520x720(很奇怪啊)
    var clickx_pos = [348, 506, 665, 824, 982, 1141, 1300];
    var clicky_pos = [637, 547, 454];
    var longclick_pos = [175, 240];
} else if (device.width == 1080 && device.height == 2248) {
    //2188x1080(也很奇怪)
    var clickx_pos = [507, 746, 983, 1220, 1458, 1696, 1934];
    var clicky_pos = [956, 818, 681];
    var longclick_pos = [388, 420];
}else if (device.width == 1176 && device.height == 2400) {
    var clickx_pos=[553,801,1055,1300,1551,1800,2052];
    var clicky_pos=[997,857,715];
    var longclick_pos=[455,442];
} else {
    console.warn("不支持此分辨率，尝试兼容设置...");
    setScreenMetrics(1920, 1080);
    var clickx_pos = [340, 580, 819, 1055, 1291, 1531, 1768];
    var clicky_pos = [956, 816, 680];
    var longclick_pos = [78, 367];

};


//media.playMusic("/sdcard/test.mp3", 1);
//sleep(200);

//主循环
var noteList = new Array();
var i = 0
const noteCount = getJsonLength(jsonData.tracks[track].notes);
var delaytime0, delaytime1;

if (!readGlobalConfig("skipInit", 1)) sleep(jsonData.tracks[track].notes[0].time * 1000);

while (i < noteCount) {
    var tone = name2pitch(jsonData.tracks[track].notes[i].name);

    if (tone == 0) {
        i++;
        continue;
    };
    delaytime0 = jsonData.tracks[track].notes[i].time; //这个音符的时间，单位:秒
    if (i != (noteCount - 1)) {
        delaytime1 = jsonData.tracks[track].notes[i + 1].time;
    } else {
        delaytime1 = delaytime0 + 0.1;
    };
    if (delaytime0 == delaytime1) { //如果两个音符时间相等，把这个音和后面的一起加入数组
        noteList[noteList.length] = tone;
    } else {
        noteList[noteList.length] = tone;
        let delaytime = delaytime1 - delaytime0;
        //console.log(noteList);
        var gestureList = new Array();
        for (var j = 0; j < noteList.length; j++) { //遍历这个数组
            tone = noteList[j];
            if (tone != 0) {
                var clicky = Math.floor((tone - 1) / 7) + 1; //得到x
                if (tone % 7 == 0) { //得到y
                    var clickx = 7;
                } else {
                    var clickx = tone % 7;
                };
                gestureList[gestureList.length] = [0, 20, [clickx_pos[clickx - 1], clicky_pos[clicky - 1]]];
            };
        };
        if (delaytime >= 6) {
            //长音
            //gestureList[gestureList.length] = [0, delaytime * 1000 / 2, longclick_pos];
        };
        //执行手势
        //console.log(gestureList);

        if (gestureList.length > 10) gestureList.splice(9, gestureList.length - 10); //手势最多同时只能执行10个

        if (gestureList.length != 0) {
            gestures.apply(null, gestureList);
        };
        sleep(delaytime * 1000 - 20);
        noteList = [];
        gestureList = [];
    };
    i++
};
toast("播放结束");
