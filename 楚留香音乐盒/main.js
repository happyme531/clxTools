//@ts-nocheck

var globalConfig = storages.create("hallo1_clxmidiplayer_config");

try{
  var preDefinedRes = require("./src/predefinedres.js");
  var MusicFormats = require("./src/musicFormats.js");
  var MidiDeviceManager = require("./src/midiDeviceManager.js");
}catch(e){
    toast("请不要单独下载/复制这个脚本，需要下载'楚留香音乐盒'中的所有文件!");
    toast(e);
}

const musicDir = "/sdcard/楚留香音乐盒数据目录/"
const scriptVersion = 11;

let musicFormats = new MusicFormats();


function getPosInteractive(promptText) {
    let gotPos = false;
    let pos = [];
    let fingerReleased = false;
    let confirmed = false;
    //提示和确认按钮的框
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn"  style="Widget.AppCompat.Button.Colored" text="确定"  />
                <button id="cancelBtn"  style="Widget.AppCompat.Button.Colored" text="取消" />
            </vertical>
        </frame>
    );
    confirmWindow.setPosition(device.height/3, 0);
    confirmWindow.setTouchable(true);

    let fullScreenWindow = floaty.rawWindow(<frame id="fullScreen" bg="#00000000" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1,-1);
    fullScreenWindow.fullScreen.setOnTouchListener(function(v, evt){
        if (evt.getAction() == evt.ACTION_DOWN || evt.getAction() == evt.ACTION_MOVE) {
            gotPos = true;
            pos = [parseInt(evt.getRawX().toFixed(0)) , parseInt(evt.getRawY().toFixed(0))];
        }    
        if (evt.getAction() == evt.ACTION_UP) {
            fingerReleased = true;
        }
        return true;
    });

    ui.run(()=>{
        confirmWindow.promptText.setText("请点击" + promptText);
        confirmWindow.confirmBtn.click(()=>{
            confirmed = true;
        });
        confirmWindow.cancelBtn.click(()=>{
            fingerReleased = false;
            gotPos = false;
            fullScreenWindow.setTouchable(true);
        }); 
    });

    while(!confirmed){ 
        sleep(100);
        if(fingerReleased){
            fullScreenWindow.setTouchable(false);
        }

        ui.run(function(){
            if (!gotPos) {
                confirmWindow.promptText.setText("请点击" + promptText);
            }else if(!fingerReleased){
                confirmWindow.promptText.setText("当前坐标:" + pos.toString());
            }else{
                confirmWindow.promptText.setText("当前坐标:" + pos.toString() + ", 点击'确定'结束, 点击'取消'重新获取");
            }
        });
    }

    fullScreenWindow.close();
    confirmWindow.close();

    return {
        "x" : pos[0],
        "y" : pos[1]
    }
}

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
        return (musicFormats.isMusicFile(name)) && files.isFile(files.join(musicDir, name));
    });
    let titles = new Array(totalFiles.length);
    //log(totalFiles);
    for (let file in totalFiles) {
        //直接读取文件名
        titles[file] = totalFiles[file].replace(".json", "").replace(".mid", "");

    };
    return titles;
};

let majorPitchOffset = 0;
let minorPitchOffset = 0;
let treatHalfAsCeiling = 0;

let outRangedNoteCnt = 0;
let roundedNoteCnt = 0;
let timingDroppedNoteCnt = 0;

//对半音取整
//C -> 1, C# -> 2, D -> 3, D# -> 4, E -> 5, F -> 6, F# -> 7, G -> 8, G# -> 9, A -> 10, A# -> 11, B -> 12
function roundPitch(pitch) {
    let newPitch = 0;
    if(!treatHalfAsCeiling){
        switch (pitch) {
            case 1:
            case 2:
                newPitch = 1;
                break;
            case 3:
            case 4:
                newPitch = 3;
                break;
            case 5:
                newPitch = 5;
                break;
            case 6:
            case 7:
                newPitch = 6;
                break;
            case 8:
            case 9:
                newPitch = 8;
                break;
            case 10:
            case 11:
                newPitch = 10;
                break;
            case 12:
                newPitch = 12;
                break;
            default:
                break;
        }
    }else{
        switch (pitch) {
            case 1:
                newPitch = 1;
                break;
            case 2:
            case 3:
                newPitch = 3;
                break;
            case 4:
            case 5:
                newPitch = 5;
                break;
            case 6:
                newPitch = 6;
                break;
            case 7:
            case 8:
                newPitch = 8;
                break;
            case 9:
            case 10:
                newPitch = 10;
                break;
            case 11:
            case 12:
                newPitch = 12;
                break;
            default:
                break;
        }
    }
    if (newPitch == 0) {
        throw "无效的音高: " + pitch;
    }
    if (newPitch != pitch) {
        roundedNoteCnt++;
    }
        
    return newPitch;
}

/**
 * @param {string} name
 * @abstract 将类似"C3"这样的音符名转换为按键
 * @return 按键序号(从1开始)或-1
 */
function name2key(name) {
    const toneNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let key = 0;
    //C3 -> 第1个按键
    let m = -majorPitchOffset + 3;
    let low = m;
    let mid = m + 1;
    let high = m + 2;
    switch (parseInt(name.charAt(name.length - 1))) {
        case low:
            key += 0;
            break;
        case mid:
            key += 7;
            break;
        case high:
            key += 14;
            break
        default:
            outRangedNoteCnt++;
            return -1;
    }


    let pitch = 0;
    for (let i = 0; i < toneNames.length; i++) {
        if (name.startsWith(toneNames[i])) {
            pitch = i + 1;
        }
    }
    if (pitch == 0) {
        throw "无法识别的音符名:" + name;
        return -1;
    }

    //移调的处理(模12)
    pitch--;
    pitch += minorPitchOffset;
    if (pitch < 0) {
        pitch += 12;
        key -= 7;
    }else if(pitch >= 12){
        pitch -= 12;
        key += 7;
    }   
    pitch++;

    pitch = roundPitch(pitch);

    switch (pitch) {
        case 1:
            key += 1;
            break;
        case 3:
            key += 2;
            break;
        case 5:
            key += 3;
            break;
        case 6:
            key += 4;
            break;
        case 8:
            key += 5;
            break;
        case 10:
            key += 6;
            break;
        case 12:
            key += 7;
            break;
        default:
            throw "无效的音高" + pitch;
    }

    if (key > 21 || key < 1) {
        outRangedNoteCnt++;
        return -1;
    }
    return key;
};
//低效率的转换！
/**
 * @param {Number} midiPitch
 */
function midiPitch2key(midiPitch){
    function midiToPitchClass(midi){
        const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const note = midi % 12;
        return scaleIndexToNote[note];
    }
    function midiToPitch(midi) {
        const octave = Math.floor(midi / 12) - 1;
        return midiToPitchClass(midi) + octave.toString();
    }
    return name2key(midiToPitch(midiPitch));
}
/**
 * @param {Array<[Number, Number]>} noteData
 * @abstract 时间优化--删除过于密集的音符
 * @return {Array<[Number, Number]>} 
 */
 function timingRefine(noteData) {
    const sameNoteGapMin = 0.12;
    //const diffNoteGapMin = 0.05;

    for (let i = 0; i < noteData.length; i++) {
        let note = noteData[i];
        let j = i + 1;
        while (j < noteData.length) {
            let nextNote = noteData[j];
            if(note[0] === -1){
                j++;
                continue;
            }
            if (note[0] === nextNote[0]) {
                if (nextNote[1] - note[1] < sameNoteGapMin) {
                    noteData.splice(j, 1);
                    timingDroppedNoteCnt++;
                }
            }
            if (nextNote[1] - note[1] > sameNoteGapMin) {
                break;
            }
            j++;
        }
    }
    return noteData;
}

/**
 * @param {string} filepath
 */
function initFileConfig(filepath) {
    console.info("初始化文件:" + filepath);
    files.create(filepath);
    let cfg = {};
    cfg.majorPitchOffset = 0;
    cfg.minorPitchOffset = 0;
    cfg.halfCeiling = false;
    files.write(filepath, JSON.stringify(cfg));
};

function getPosConfig() {
    //注意，这是横屏状态的坐标:左上角(0,0),向右x增，向下y增
    //检测分辨率
    console.info("你的屏幕分辨率是:%dx%d", device.height, device.width);
    let clickx_pos = [];
    let clicky_pos = [];
    let useCustomPos = readGlobalConfig("alwaysUseCustomPos", false);
    if (!useCustomPos) {
        console.log("正在使用内置坐标");
        let screenWidth = device.width;
        let screenHeight = device.height;
        let gameType = readGlobalConfig("gameType", "楚留香");
        let keyPos;
        let res = new preDefinedRes();
        try {
            keyPos = res.getKeyPosition(screenHeight, screenWidth, gameType);
        } catch (e) {
            console.error(e);
            setGlobalConfig("alwaysUseCustomPos", true);
            dialogs.alert("错误", "没有找到合适的内置坐标，请进入全局设置, 修改自定义坐标");
            exit();
        };
        clickx_pos = keyPos.clickx_pos;
        clicky_pos = keyPos.clicky_pos;
    } else {
        console.log("正在使用自定义坐标");
        clickx_pos = readGlobalConfig("customPosX", 0);
        clicky_pos = readGlobalConfig("customPosY", 0);
        if (clickx_pos === 0 || clicky_pos === 0) {
            dialogs.alert("错误", "自定义坐标未设置");
            exit();
        }
        console.log(clickx_pos.toString());
        console.log(clicky_pos.toString());
    }
    return {
        "x" : clickx_pos,
        "y" : clicky_pos
    };
}

function startMidiStream() {
    let pos = getPosConfig();
    let clickx_pos = pos.x;
    let clicky_pos = pos.y;
    let midi = new MidiDeviceManager();
    let devNames = [];
    while (1) {
        devNames = midi.getMidiDeviceNames();
        if (devNames.length == 0) {
            if (!dialogs.confirm("错误", "没有找到MIDI设备, 点击确定重试, 点击取消退出")) {
                exit();
            }
        }else{
            break;
        }
    }
    let deviceIndex = dialogs.select("选择MIDI设备", devNames);
    if (deviceIndex == -1) {
        toast("您取消了选择, 脚本将会退出");
        exit();
    }
    portNames = midi.getMidiPortNames(deviceIndex);
    if (portNames.length == 0) {
        dialogs.alert("错误", "此MIDI设备没有可用的端口, 脚本将会退出");
        exit();
    }
    let portIndex = 0;
    if (portNames.length > 1) {  // 不太可能出现
        portIndex = dialogs.select("选择MIDI端口", portNames);
        if (portIndex == -1) {
            toast("您取消了选择, 脚本将会退出");
            exit();
        }
    }
    midi.openDevicePort(deviceIndex, portIndex);
    let receivedNoteCnt = 0;
    //悬浮窗

    //显示悬浮窗
    let controlWindow = floaty.rawWindow(
        <frame gravity="left">
            <horizontal bg="#7fffff7f">
                <text id="txt" text="串流已就绪" textSize="14sp" />
                <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="180px" text="退出⏹" />
            </horizontal>
        </frame>
    );

    //避免悬浮窗被屏幕边框挡住
    controlWindow.setPosition(device.height / 5, 0);
    // //TODO: 这里写死大小可能会有问题, 但是没有足够的测试数据来证明
    // controlWindow.setSize(900 + 180 + 180 + 180, -2);   
    controlWindow.setTouchable(true);

    //用来更新悬浮窗的线程
    threads.start(function () {
        ui.run(function () {
            controlWindow.stopBtn.click(() => {
                midi.close();
                threads.shutDownAll();
                exit();
            });
        });
        while (true) {
            sleep(300);
            ui.run(function () {
                controlWindow.txt.setText("正在串流中, 音符数量:" + receivedNoteCnt);
            });
        }
    });
    while(1){
        let noteList = [];
        while(!midi.dataAvailable()){
            sleep(100);
        }
        while(midi.dataAvailable()){
            let data = midi.read();
            let cmd = data[0] & midi.STATUS_COMMAND_MASK;
            //console.log("cmd: " + cmd);
            if (cmd == midi.STATUS_NOTE_ON && data[2] != 0) { // velocity != 0
                let key = midiPitch2key(data[1]);
                if (key != -1 &&  noteList.indexOf(key) === -1) noteList.push(key);
                receivedNoteCnt++;
            }
        }
        let gestureList = new Array();
        for (let j = 0; j < noteList.length; j++) { //遍历这个数组
            tone = noteList[j];
            if (tone != 0) {
                let clicky = Math.floor((tone - 1) / 7) + 1; //得到x
                let clickx = (tone - 1) % 7 + 1; //得到y
                gestureList.push([0, 5, [clickx_pos[clickx - 1], clicky_pos[clicky - 1]]]);
            };
        };
        if (gestureList.length > 10) gestureList.splice(9, gestureList.length - 10); //手势最多同时只能执行10个

        if (gestureList.length != 0) {
            gestures.apply(null, gestureList);
        };
        gestureList = [];
    }
}

/**
 * @param {number} timeSec
 */
function sec2timeStr(timeSec){
    return (Math.floor(timeSec/60)).toString() + ":" + (Math.floor(timeSec%60)).toString();
}

let cmp = (x, y) => {
    // If both x and y are null or undefined and exactly the same
    if (x === y) {
        return true;
    }

    // If they are not strictly equal, they both need to be Objects
    if (!(x instanceof Object) || !(y instanceof Object)) {
        return false;
    }

    //They must have the exact same prototype chain,the closest we can do is
    //test the constructor.
    if (x.constructor !== y.constructor) {
        return false;
    }
    for (var p in x) {
        //Inherited properties were tested using x.constructor === y.constructor
        if (x.hasOwnProperty(p)) {
            // Allows comparing x[ p ] and y[ p ] when set to undefined
            if (!y.hasOwnProperty(p)) {
                return false;
            }
            // If they have the same strict value or identity then they are equal
            if (x[p] === y[p]) {
                continue;
            }
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if (typeof(x[p]) !== "object") {
                return false;
            }
            // Objects and Arrays must be tested recursively
            if (!Object.equals(x[p], y[p])) {
                return false;
            }
        }
    }

    for (p in y) {
        // allows x[ p ] to be set to undefined
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
            return false;
        }
    }
    return true;
};

function setGlobalConfig(key, val) {
    globalConfig.put(key, val);
    let tmp = globalConfig.get(key);
    if (cmp(tmp, val)) {
        toast("设置保存成功");
        return 1;
    } else {
        toast("设置保存失败！");
        return 0;
    };

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
    console.log("写入文件" + filepath + "成功");
    console.verbose("配置信息: " + JSON.stringify(tmp));
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
    console.log("读取文件:" + filepath);
    console.verbose("读取配置信息: " + JSON.stringify(tmp));
    return tmp[key];
};


function reRunSelf(){
    engines.execScriptFile(files.cwd() + "/main.js");
    exit();
}



function runFileSetup(fileList) {
    let fileName = dialogs.singleChoice("选择一首乐曲..", fileList);
    fileName = fileList[fileName];
    //清除后缀
    fileName = fileName.split(".")[0];
    switch (dialogs.singleChoice("请选择一个设置，所有设置都会自动保存", ["调整音高", "半音处理方式"])) {
        case 0:
            setFileConfig("majorPitchOffset", dialogs.singleChoice("调整音高1", ["降低一个八度", "默认", "升高一个八度"], readFileConfig("majorPitchOffset", fileName) + 1) - 1, fileName);
            setFileConfig("minorPitchOffset", dialogs.singleChoice("调整音高2", ["降低1个音阶", "降低1个半音", "默认", "升高1个半音", "升高1个音阶"], readFileConfig("minorPitchOffset", fileName) + 2) - 2, fileName);
            break;
        case 1:
            setFileConfig("halfCeiling", dialogs.singleChoice("楚留香的乐器无法弹奏半音，所以对于半音..", ["降低", "升高"], readFileConfig("halfCeiling", fileName)), fileName);

    };
};

function runGlobalSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "设置游戏类型","启用自定义坐标","设置自定义坐标"])) {
        case 0:
            setGlobalConfig("skipInit", dialogs.select("是否跳过乐曲开始前的空白?", ["否", "是"]));
            break;
        case 1:
            let sel = dialogs.select("选择此脚本的目标游戏(此选项只会影响预设的坐标)", ["楚留香(一梦江湖)", "天涯明月刀", "原神", "摩尔庄园"]);
            switch (sel) {
                case 0:
                    setGlobalConfig("gameType", "楚留香");
                    break;
                case 1:
                    setGlobalConfig("gameType", "天涯明月刀");
                    break;
                case 2:
                    setGlobalConfig("gameType", "原神");
                    break;
                case 3:
                    setGlobalConfig("gameType", "摩尔庄园");
                    break;
            };
            break;
        case 2:
            if (!dialogs.confirm("", "总是使用自定义坐标吗")) {
                setGlobalConfig("alwaysUseCustomPos", false);
            } else {
                if (readGlobalConfig("customPosX", 0) === 0) {    //无效的配置
                    dialogs.alert("", "你还没有设置自定义坐标!");
                } else {
                    setGlobalConfig("alwaysUseCustomPos", true);
                }
            }
            break;
        case 3: //设置自定义坐标
            let clickx_pos = [];
            let clicky_pos = [];
            let pos1 = getPosInteractive("最左上角的音符按键中心");
            let pos2 = getPosInteractive("最右下角的音符按键中心");
            //等距分布
            for (let i = 0; i < 7; i++) {
                clickx_pos.push(pos1.x + (pos2.x - pos1.x) * i / 6);
            }
            for (let i = 2; i >= 0; i--) {
                clicky_pos.push(pos1.y + (pos2.y - pos1.y) * i / 2);    //从下到上(y高->y低)
            }
            
            setGlobalConfig("customPosX", clickx_pos);
            setGlobalConfig("customPosY", clicky_pos);
            setGlobalConfig("alwaysUseCustomPos", true);
            dialogs.alert("", "设置完成, 自定义坐标已启用");
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
        console.log("copy:" + files_[i]);
        files.copy("./exampleTracks/" + files_[i], musicDir + files_[i]);
    };
    setGlobalConfig("lastVersion", scriptVersion);

};

console.info("\
1.为了点击屏幕，本程序需要辅助功能权限，这是必须的，剩下的权限拒绝就行\n\
2.使用方法:在游戏中切换到演奏界面，打开这个脚本，点击播放按钮即可开始\n\
3.你可以随时按音量上键结束运行\n\
4.如果脚本输出一些文字就没反应了，请允许脚本的悬浮窗权限！！(坑爹的小米手机)\n\
5.脚本制作:声声慢:心慕流霞 李芒果，也强烈感谢auto.js作者提供的框架\n\
");

console.verbose("等待无障碍服务..");
//toast("请允许本应用的无障碍权限");
auto.waitFor();
const fileList = getFileList();
if (!floaty.checkPermission()) {
    // 没有悬浮窗权限，提示用户并跳转请求
    toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
    floaty.requestPermission();
    exit();
}

//解析信息

var index;
var exportScore = false;
switch (dialogs.select("选择一项操作..", ["🎶演奏乐曲", "🛠️更改全局设置", "🛠️更改乐曲设置", "🎼乐谱输出", "📲MIDI串流", "📃查看使用说明","🚪离开"])) {

    case 0:
        index = dialogs.select("选择一首乐曲..", fileList);
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
        index = dialogs.select("选择一首乐曲..", fileList);
        exportScore = true;
        break;
    case 4:
        startMidiStream();
        exit();
        break;
    case 5:
        app.viewFile(musicDir + "使用帮助.txt");
        exit();
        break;
    case 6:
        exit();
        break;
};

const totalFiles = files.listDir(musicDir, function (name) {
    return (musicFormats.isMusicFile(name) ) && files.isFile(files.join(musicDir, name));
});

var fileName = totalFiles[index];

if (fileName == undefined) {
    toast("脚本已退出");
    exit();
}
// if (fileName.endsWith(".json")) {
//     noteData = parseTonejsJSON(musicDir + fileName);
// }else if(fileName.endsWith(".mid")){
//     noteData = parseMIDI(musicDir + fileName);
// }

let rawFileName = fileName.split(".")[0];

let noteData = musicFormats.parseFile(musicDir + fileName);
majorPitchOffset = readFileConfig("majorPitchOffset", rawFileName);
minorPitchOffset = readFileConfig("minorPitchOffset", rawFileName);
treatHalfAsCeiling = readFileConfig("halfCeiling",rawFileName);
//print the first 10 elements of the noteData
// for (let i = 0; i < 10; i++) {
//     console.info(noteData[i]);
// };

console.log("当前乐曲:" + fileName);
console.log("配置信息:");
console.log("majorPitchOffset:" + majorPitchOffset);
console.log("minorPitchOffset:" + minorPitchOffset);
console.log("treatHalfAsCeiling:" + treatHalfAsCeiling);



for(let i=0;i<noteData.length;i++){
    noteData[i][0] = midiPitch2key(noteData[i][0]);
    noteData[i][1] /= 1000;
}
totalNoteCnt = noteData.length;
noteData = timingRefine(noteData);


jsonData = null;
console.log("音符总数:%d",totalNoteCnt);

//////////////////////////乐谱导出功能开始
if(exportScore){
    let keySeq = [];
    let noteList =[];
    let noteCount = noteData.length;
    let i = 0;
    let maxDelayTime = 0;
    while (i < noteCount) {
        delaytime0 = noteData[i][1]; //这个音符的时间，单位:秒
        if (i != (noteCount - 1)) {
            delaytime1 = noteData[i+1][1];
        } else {
            delaytime1 = delaytime0 + 0.1;
        };
        if (Math.abs(delaytime0 - delaytime1) < 0.01) { //如果两个音符时间相等，把这个音和后面的一起加入数组
            if (noteData[i][0] != -1) {
                keySeq.push(noteData[i][0]);
            }
        } else {
            if (noteData[i][0] != -1) {
                noteList.push(noteData[i][0]);
                let delaytime = (delaytime1 - delaytime0) * 1000;
                if (delaytime > maxDelayTime) maxDelayTime = delaytime;
                keySeq.push([noteList, delaytime]);
                noteList = [];
                gestureList = [];
            }
        };
        i++;
    };
    let confirmed = false;
    let gapTime = 0;
    while (!confirmed) {
        gapTime = dialogs.input("输入在你打算把两个音符分到两小段的时候,它们间的时间差(单位:毫秒)", maxDelayTime.toString());
        if(gapTime < 10) dialogs.alert("","输入无效,请重新输入");
        let segmentCnt = 1;
        keySeq.forEach(key => {
            if(key[1] >= gapTime) segmentCnt++;
        }); 
        confirmed = dialogs.confirm("","乐谱将分为" + segmentCnt.toString() + "个小段,是否满意?");
    }

   
    let toneStr;
    switch (dialogs.select("选择导出格式", ["楚留香(键盘)", "原神(键盘)"])) {
        case 0:
            toneStr = "ZXCVBNMASDFGHJQWERTYU";
            break;
        case 1:
            toneStr = "ZXCVBNMASDFGHJQWERTYU";
            break;
    }
    //开始转换
    let outPutStr = "";
    keySeq.forEach(key => {
        if(key[0].length > 1){
            outPutStr += "(";
            key[0].forEach(element => {
                outPutStr += toneStr[element-1];
            });
            outPutStr += ")";
        }else{
            outPutStr += toneStr[key[0][0]-1];
        }
        if(key[1] >= gapTime) outPutStr += " ";
    }); 
    //导出到文件
    let path = musicDir + "乐谱导出.txt";
    files.write(path, outPutStr);
    dialogs.alert("导出成功","已导出至" + path);
    exit();
}

//////////////////////////乐谱导出功能结束

let pos = getPosConfig();

let clickx_pos = pos.x;
let clicky_pos = pos.y;

let statString = "音符总数:" + totalNoteCnt + 
                 "\n超出范围被丢弃的音符数:" + outRangedNoteCnt + "(" + (outRangedNoteCnt / noteData.length * 100).toFixed(2) + "%)" +
                 "\n被取整的音符数:" + roundedNoteCnt + "(" + (roundedNoteCnt / noteData.length * 100).toFixed(2) + "%)" + 
                 "\n过于密集被丢弃的音符数:" + timingDroppedNoteCnt + "(" + (timingDroppedNoteCnt / noteData.length * 100).toFixed(2) + "%)" +
                 "\n如果被取整的音符数过多,可以尝试在 调整音高 菜单中升高/降低一个半音";

dialogs.alert("乐曲信息",statString);
console.verbose("无障碍服务启动成功");


//主循环
var noteList = new Array();
var i = 0
const noteCount = noteData.length;
var delaytime0, delaytime1;

if (!readGlobalConfig("skipInit", 1)) sleep(noteData[0][1] * 1000);

//显示悬浮窗
let controlWindow = floaty.rawWindow(
    <frame gravity="left">
        <horizontal bg="#7fffff7f">
            <text id="timerText" text="00:00/00:00" textSize="14sp"  />
            <seekbar id="progressBar" layout_gravity="center_vertical" w='900px' />、
            <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Colored" w="180px" text="⏸" />
            <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="180px" text="⏹" />
        </horizontal>
    </frame>
);

//避免悬浮窗被屏幕边框挡住
controlWindow.setPosition(device.height/3, 0);
//TODO: 这里写死大小可能会有问题, 但是没有足够的测试数据来证明
controlWindow.setSize(900 + 180 + 180 + 180, -2);   
controlWindow.setTouchable(true);

let paused = true;  //手动启动播放
//用来更新悬浮窗的线程
threads.start(function(){
    let progress = 0;
    let progressChanged = false;
    ui.run(function () {
        controlWindow.progressBar.setOnSeekBarChangeListener({ 
            onProgressChanged: function (seekBar, progress0, fromUser) {  
                if (fromUser) {
                    progress = progress0;
                    progressChanged = true;
                };
            }
        });
        controlWindow.pauseResumeBtn.setText("▶️");
        controlWindow.pauseResumeBtn.click(() => {
            if (paused) {
                paused = false; //只需要设置变量即可，主线程会自动处理
                controlWindow.pauseResumeBtn.setText("⏸");
            } else {
                paused = true;
                controlWindow.pauseResumeBtn.setText("▶️");
            }
        });
        controlWindow.stopBtn.click(()=>{
           threads.shutDownAll();
           reRunSelf();
        })
    });
    let totalTimeSec = noteData[noteData.length -1][1];
    let totalTimeStr = sec2timeStr(totalTimeSec);

    while (true) {
        //如果进度条被拖动，更新播放进度
        if(progressChanged){
            progressChanged = false;
            let targetTimeSec = totalTimeSec * progress / 100;
            for (let j = 0; j < noteData.length; j++) {
                if (noteData[j][1] > targetTimeSec) {
                    i = j - 1;
                    break;
                }
            }
        }
        if(i < 0) i = 0;
        //计算时间
        let curTimeSec = noteData[i][1];
        let curTimeStr = sec2timeStr(curTimeSec);
        let timeStr = curTimeStr + "/" + totalTimeStr;
        //更新窗口
        ui.run(()=>{
            controlWindow.progressBar.setProgress(curTimeSec/totalTimeSec * 100);
            controlWindow.timerText.setText(timeStr); 
        })
        sleep(500);
    }
})
while (paused) {
    sleep(500);
}
while (i < noteCount) {
    delaytime0 = noteData[i][1]; //这个音符的时间，单位:秒
    if (i != (noteCount - 1)) {
        delaytime1 = noteData[i+1][1];
    } else {
        delaytime1 = delaytime0 + 0.1;
    };
    if (Math.abs(delaytime0 - delaytime1) < 0.01) { //如果两个音符时间相等，把这个音和后面的一起加入数组
        noteList.push(noteData[i][0]);
    } else {
        noteList.push(noteData[i][0]);
        let delaytime = delaytime1 - delaytime0;
        //console.log(noteList);
        var gestureList = new Array();
        for (var j = 0; j < noteList.length; j++) { //遍历这个数组
            tone = noteList[j];
            if (tone != -1) {
                var clicky = Math.floor((tone - 1) / 7) + 1; //得到x
                if (tone % 7 == 0) { //得到y
                    var clickx = 7;
                } else {
                    var clickx = tone % 7;
                };
                gestureList.push([0, 5, [clickx_pos[clickx - 1], clicky_pos[clicky - 1]]]);
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
        sleep(delaytime * 1000 - 8);
        while (paused) {
            sleep(1000);
        }
        noteList = [];
        gestureList = [];
    };
    i++
};
toast("播放结束");
threads.shutDownAll();