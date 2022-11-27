//@ts-nocheck

var globalConfig = storages.create("hallo1_clxmidiplayer_config");

try {
    var preDefinedRes = require("./src/predefinedres.js");
    var MusicFormats = require("./src/musicFormats.js");
    var MidiDeviceManager = require("./src/midiDeviceManager.js");
    var Humanifyer = require("./src/humanify.js");
    var GameProfile = require("./src/gameProfile.js");
} catch (e) {
    toast("请不要单独下载/复制这个脚本，需要下载'楚留香音乐盒'中的所有文件!");
    toast(e);
    console.error(e);
}

const musicDir = "/sdcard/楚留香音乐盒数据目录/"
const scriptVersion = 11;

//在日志中打印脚本生成的中间结果, 可选项: parse, humanify, key, timing, gestures
const debugDumpPass = "";


let musicFormats = new MusicFormats();
let humanifyer = new Humanifyer();
let gameProfile = new GameProfile();
//setGlobalConfig("userGameProfile", null);
//加载配置文件
try {
    //启动无障碍服务
    console.verbose("等待无障碍服务..");
    //toast("请允许本应用的无障碍权限");
    auto.waitFor();
    console.verbose("无障碍服务已启动");
    let userGameProfile = readGlobalConfig("userGameProfile", null);
    if (userGameProfile != null) {
        gameProfile.loadGameConfigs(userGameProfile);
    } else {
        gameProfile.loadDefaultGameConfigs();
    }
    //尝试加载用户设置的游戏配置
    let activeConfigName = readGlobalConfig("activeConfigName", null);
    let res = gameProfile.setConfigByName(activeConfigName);
    if (res == false) {
        console.log("尝试加载用户设置的游戏配置...失败!");
    }else{
        console.log("尝试加载用户设置的游戏配置...成功, 当前配置: " + gameProfile.getCurrentConfigName());
    }

    //尝试通过包名加载游戏配置 (加载失败后保留当前配置)
    let currentPackageName = currentPackage();
    console.log("当前包名:" + currentPackageName);
    res = gameProfile.setConfigByPackageName(currentPackageName);
    if (res == false){
        console.log("尝试通过包名加载游戏配置...失败!");
    }else{
        console.log("尝试通过包名加载游戏配置...成功, 当前配置: " + gameProfile.getCurrentConfigName());
    }

    if (gameProfile.getCurrentConfig() == null){
        console.error("未找到合适配置, 已加载默认配置!");
        toast("未找到合适配置, 已加载默认配置!");
        gameProfile.setConfigByName("楚留香");
    }
    
} catch (error) {
    toastLog("加载配置文件失败! 已自动加载默认配置!");
    toastLog(error);
    gameProfile.loadDefaultGameConfigs();
    setGlobalConfig("userGameProfile", null);
}

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

function getRawFileNameList() {
    //遍历synth文件夹中所有文件，获得标题信息
    let totalFiles = files.listDir(musicDir, function (name) {
        return files.isFile(files.join(musicDir, name)) && musicFormats.isMusicFile(name);
    });
    let titles = new Array(totalFiles.length);
    //log(totalFiles);
    for (let file in totalFiles) {
        //直接读取文件名
        titles[file] = totalFiles[file].replace(".json", "").replace(".mid", "");

    };
    return titles;
};

function getFileList() {
    return files.listDir(musicDir, function (name) {
        return files.isFile(files.join(musicDir, name)) && musicFormats.isMusicFile(name);
    });
}
let majorPitchOffset = 0;
let minorPitchOffset = 0;
let treatHalfAsCeiling = 0;

let overFlowedNoteCnt = 0;
let underFlowedNoteCnt = 0;
let roundedNoteCnt = 0;
let timingDroppedNoteCnt = 0;

/**
 * @param {Number} midiPitch
 * @abstract 将midi音高转换为按键编号(从1开始)
 * @return 按键序号(从1开始)或-1
 */
function midiPitch2key(midiPitch) {
    midiPitch += majorPitchOffset * 12;
    midiPitch += minorPitchOffset;
    let key = gameProfile.getKeyByPitch(midiPitch);
    if (key == -1) {
        let noteRange = gameProfile.getNoteRange();
        if (midiPitch < noteRange[0]) {
            underFlowedNoteCnt++;
            return -1;
        }
        if (midiPitch > noteRange[1]) {
            overFlowedNoteCnt++;
            return -1;
        }
        if(treatHalfAsCeiling){
            key = gameProfile.getKeyByPitch(midiPitch + 1);
        }else{
            key = gameProfile.getKeyByPitch(midiPitch - 1);
        }
        if (key == -1) {
            return -1;
        }
        roundedNoteCnt++;
    }
    return key;
};


/**
 * @param {Array<[Number, Number]>} noteList [midi音高, 开始时间(毫秒)]
 * @param {function(Number):void} progressCallback 进度回调(百分比)
 * @abstract 将音符列表转换为按键列表
 * @return {Array<[Number, Number]>} 按键列表: [按键序号(从1开始), 开始时间(秒)]
 */
function noteListConvert(noteList, progressCallback) {
    let keyList = [];
    for (let i = 0; i < noteList.length; i++) {
        let key = midiPitch2key(noteList[i][0]);
        if (key == -1) {
            continue;
        }
        keyList.push([key, noteList[i][1] / 1000]);
        if (progressCallback != null && i % 10 == 0) {
            progressCallback(100 * i / noteList.length);
        }
    }
    return keyList;
}

/**
 * @param {Array<[Number, Number]>} noteData
 * @abstract 时间优化--删除过于密集的音符
 * @return {Array<[Number, Number]>} 
 */
function timingRefine(noteData, progressCallback){
    const sameNoteGapMin = gameProfile.getSameKeyMinInterval() / 1000;
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
                    //console.log("删除过于密集的音符:" + nextNote[0] + "(diff:" + (nextNote[1] - note[1]) + ")");
                    timingDroppedNoteCnt++;
                }
            }
            if (nextNote[1] - note[1] > sameNoteGapMin) {
                break;
            }
            j++;
        }
        if (progressCallback != null && i % 10 == 0) {
            progressCallback(100 * i / noteData.length);
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
            reRunSelf();
        };
        clickx_pos = keyPos.clickx_pos;
        clicky_pos = keyPos.clicky_pos;
    } else {
        console.log("正在使用自定义坐标");
        clickx_pos = readGlobalConfig("customPosX", 0);
        clicky_pos = readGlobalConfig("customPosY", 0);
        if (clickx_pos === 0 || clicky_pos === 0) {
            dialogs.alert("错误", "自定义坐标未设置，请进入全局设置, 修改自定义坐标");
            reRunSelf();
        }
        console.log("自定义坐标X:%s", JSON.stringify(clickx_pos));
        console.log("自定义坐标Y:%s", JSON.stringify(clicky_pos));
    }
    return {
        "x" : clickx_pos,
        "y" : clicky_pos
    };
}

function startMidiStream() {
    if(!gameProfile.checkKeyPosition()){
        dialogs.alert("错误", "坐标未设置，请设置坐标");
        runGlobalSetup();
        reRunSelf();
    }
    majorPitchOffset = 0;
    minorPitchOffset = 0;
    halfCeiling = false;
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
            sleep(20);
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
                gestureList.push([0, 5, gameProfile.getKeyPosition(tone - 1)]);
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
    let minuteStr = Math.floor(timeSec / 60).toString();
    let secondStr = Math.floor(timeSec % 60).toString();
    if (minuteStr.length == 1) minuteStr = "0" + minuteStr;
    if (secondStr.length == 1) secondStr = "0" + secondStr;
    
    return minuteStr + ":" + secondStr;
}


function setGlobalConfig(key, val) {
    globalConfig.put(key, val);
    console.log("设置全局配置成功: " + key + " = " + val);
    toast("设置保存成功");
    return 1;
};

function readGlobalConfig(key, defaultValue) {
    let res = globalConfig.get(key, defaultValue);
    if (res == null) {
        return defaultValue;
    } else {
        return res;
    }
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

function saveUserGameProfile() {
    let profile = gameProfile.getGameConfigs();
    setGlobalConfig("userGameProfile", profile);
    console.log("保存用户游戏配置成功");
    toast("保存用户游戏配置成功");
};

function debugDump(obj, name) {
    console.log("====================" + name + "====================");
    console.log("Type: " + typeof (obj));
    let tmp = JSON.stringify(obj);
    console.log(tmp);
    console.log("====================" + name + "====================");
}

function reRunSelf(){
    engines.execScriptFile(files.cwd() + "/main.js");
    exit();
}

var _cachedNoteData = null;
/**
 * @param {string} fileName
 * @param {number} targetMajorPitchOffset
 * @param {number} targetMinorPitchOffset
 * @brief 测试配置效果 
 * @return {Object} {outRangedNoteCnt, roundedNoteCnt} 
 */
function evalFileConfig(fileName, targetMajorPitchOffset, targetMinorPitchOffset){
    //丢弃音调高的音符的代价要高于丢弃音调低的音符的代价, 因此权重要高
    const overFlowedNoteWeight = 10

    majorPitchOffset = targetMajorPitchOffset;
    minorPitchOffset = targetMinorPitchOffset;
    //重置计数器
    overFlowedNoteCnt = 0;
    underFlowedNoteCnt = 0;
    roundedNoteCnt = 0;
    //运行
    if (_cachedNoteData == null){
        _cachedNoteData = musicFormats.parseFile(musicDir + fileName);
    }
    let keyList = noteListConvert(_cachedNoteData);
    keyList = null;
    //计算结果
    outRangedNoteWeight = overFlowedNoteWeight * overFlowedNoteCnt + underFlowedNoteCnt;

    return {"outRangedNoteCnt": outRangedNoteWeight, "roundedNoteCnt": roundedNoteCnt};
}

function autoTuneFileConfig(fileName){
    const betterResultThreshold = 0.05; //如果新的结果比旧的结果好超过这个阈值，就认为新的结果更好
    const possibleMajorPitchOffset = [0, -1, 1, -2, 2];
    const possibleMinorPitchOffset = [0, 1, -1, 2, -2, 3, -3, 4, -4];
    let bestMajorPitchOffset = 0;
    let bestMinorPitchOffset = 0;
    let bestResult = {"outRangedNoteCnt": 100000, "roundedNoteCnt": 100000};
    let bestOverFlowedNoteCnt = 0;
    let bestUnderFlowedNoteCnt = 0;

    //悬浮窗提示
    let dial = dialogs.build({
        title: "调整中...",
        content: "正在调整音高偏移量，请稍候...",
        progress: {
            max: possibleMajorPitchOffset.length + possibleMinorPitchOffset.length,
            showMinMax: true
        },
    });
    dial.show();
    for (let i = 0; i < possibleMajorPitchOffset.length; i++){
        dial.setProgress(i);
        //只考虑超范围的音符
        let result = evalFileConfig(fileName, possibleMajorPitchOffset[i], 0);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.outRangedNoteCnt - result.outRangedNoteCnt  > result.outRangedNoteCnt * betterResultThreshold){ 
            bestMajorPitchOffset = possibleMajorPitchOffset[i];
            bestResult.outRangedNoteCnt = result.outRangedNoteCnt;
        }
    }
    for (let i = 0; i < possibleMinorPitchOffset.length; i++){
        dial.setProgress(possibleMajorPitchOffset.length + i);
        //只考虑被四舍五入的音符
        let result = evalFileConfig(fileName, bestMajorPitchOffset, possibleMinorPitchOffset[i]);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.roundedNoteCnt - result.roundedNoteCnt  > result.roundedNoteCnt * betterResultThreshold){
            bestMinorPitchOffset = possibleMinorPitchOffset[i];
            bestOverFlowedNoteCnt = overFlowedNoteCnt;
            bestUnderFlowedNoteCnt = underFlowedNoteCnt;
            bestResult = result;
        }
    }
    console.log("最佳结果: " + JSON.stringify(bestResult));
    console.log("最佳八度偏移: " + bestMajorPitchOffset);
    console.log("最佳半音偏移: " + bestMinorPitchOffset);
    dial.dismiss();
    let realBestOutRangedNoteCnt = bestOverFlowedNoteCnt + bestUnderFlowedNoteCnt;
    let totalNoteCnt = _cachedNoteData.length;
    /**
     * example: 
     * 最佳结果:
     * 超出范围被丢弃的音符数: 123 (+10, -113)(12.34%)
     * 被取整的音符数: 456 (56.78%)
     * 最佳八度偏移: 0
     * 最佳半音偏移: 0
     */
    let percentStr1 = (realBestOutRangedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%";
    let percentStr2 = (bestResult.roundedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%";
    let resultStr = "最佳结果: \n" +
                    "超出范围被丢弃的音符数: " + realBestOutRangedNoteCnt + " (+" + bestOverFlowedNoteCnt + ", -" + bestUnderFlowedNoteCnt + ")(" + percentStr1 + ")\n" +
                    "被取整的音符数: " + bestResult.roundedNoteCnt + " (" + percentStr2 + ")\n" +
                    "最佳八度偏移: " + bestMajorPitchOffset + "\n" +
                    "最佳半音偏移: " + bestMinorPitchOffset;
                
    dialogs.alert("调整结果", resultStr);

    _cachedNoteData = null;

    let rawFileName = fileName.split(".")[0];

    setFileConfig("majorPitchOffset", bestMajorPitchOffset, rawFileName);
    setFileConfig("minorPitchOffset", bestMinorPitchOffset, rawFileName);
    toast("自动调整完成");
    return 0;
}

function runFileListSetup(fileList) {
    let fileName = dialogs.select("选择一首乐曲..", fileList);
    if (fileName == -1) {
        return;
    }
    fileName = fileList[fileName];
    //清除后缀
    rawFileName = fileName.split(".")[0];
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", [ "自动调整音高", "调整音高", "半音处理方式"])) {
        case -1:
            break;
        case 0:
            autoTuneFileConfig(fileName);
            break;
        case 1:
            let majorPitchOffsetStr = ["降低2个八度", "降低1个八度", "默认", "升高1个八度", "升高2个八度"];
            let minorPitchOffsetStr = ["降低4个半音", "降低3个半音", "降低2个半音", "降低1个半音", "默认", "升高1个半音", "升高2个半音", "升高3个半音", "升高4个半音"];
            let currentMajorPitchOffset = readFileConfig("majorPitchOffset", rawFileName);
            let currentMinorPitchOffset = readFileConfig("minorPitchOffset", rawFileName);

            let res1 = dialogs.singleChoice("调整音高1", majorPitchOffsetStr, currentMajorPitchOffset + 2);
            if (res1 == -1) {
                toastLog("设置没有改变");
            } else {
                setFileConfig("majorPitchOffset", res1 - 2, rawFileName);
            }

            let res2 = dialogs.singleChoice("调整音高2", minorPitchOffsetStr, currentMinorPitchOffset + 4);
            if (res2 == -1) {
                toastLog("设置没有改变");
            } else {
                setFileConfig("minorPitchOffset", res2 - 4, rawFileName);
            }
            break;
        case 2:
            setFileConfig("halfCeiling", dialogs.singleChoice("楚留香的乐器无法弹奏半音，所以对于半音..", ["降低", "升高"], readFileConfig("halfCeiling", rawFileName)), rawFileName);
            break;

    };
};

function runGlobalSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "设置配置类型","设置坐标", "伪装手弹模式"])) {
        case -1:
            break;
        case 0:
            setGlobalConfig("skipInit", dialogs.select("是否跳过乐曲开始前的空白?", ["否", "是"]));
            break;
        case 1:
            let configList = gameProfile.getConfigNameList();
            let sel = dialogs.select("选择此脚本的目标配置", configList);
            if (sel == -1) {
                toastLog("设置没有改变");
            } else {
                let configName = configList[sel];
                setGlobalConfig("activeConfigName", configName);
                gameProfile.setConfigByName(configName);
                toastLog("设置已保存");
            }
            break;
        case 2: //设置自定义坐标
            let clickx_pos = [];
            let clicky_pos = [];
            let pos1 = getPosInteractive("最左上角的音符按键中心");
            let pos2 = getPosInteractive("最右下角的音符按键中心");

            console.log("自定义坐标:左上[" + pos1.x + "," + pos1.y + "],右下[" + pos2.x + "," + pos2.y + "]");
            
            gameProfile.setKeyPosition([pos1.x, pos1.y], [pos2.x, pos2.y]);
            saveUserGameProfile();

            break;
        
        case 3: //伪装手弹模式
            let humanifyEnabled = readGlobalConfig("humanifyEnabled", false);
            let setupFinished = false;
            let enterDetailedSetup = false;
            let dial = dialogs.build({
                title: "伪装手弹模式",
                content: "要开启假装手弹模式吗？",
                positive: "开启",
                negative: "关闭",
                neutral: "更改设置...",
                cancelable: true,
                canceledOnTouchOutside: false,
            }).on("positive", () => {
                setGlobalConfig("humanifyEnabled", true);
                setupFinished = true;
                dial.dismiss();
            }).on("negative", () => {
                setGlobalConfig("humanifyEnabled", false);
                setupFinished = true;
                dial.dismiss();
            }).on("neutral", () => {
                enterDetailedSetup = true;
                setupFinished = true;
            }).show();
            while (!setupFinished) {
                sleep(100);
            }
            if (enterDetailedSetup) {
                let humanifyNoteAbsTimeStdDev = readGlobalConfig("humanifyNoteAbsTimeStdDev", 50);

                let res = dialogs.rawInput("设置平均偏差时间(毫秒), 越高->偏差越大", humanifyNoteAbsTimeStdDev.toString());
                if (res === null) {
                    toastLog("设置没有改变");
                } else {
                    try {
                        setGlobalConfig("humanifyNoteAbsTimeStdDev", parseInt(res));
                    } catch (error) {
                        toastLog("输入无效, 设置没有改变");
                        console.error(error);
                    }
                }
            }
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

const rawFileNameList = getRawFileNameList();
const totalFiles = getFileList();
if (!floaty.checkPermission()) {
    // 没有悬浮窗权限，提示用户并跳转请求
    toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
    floaty.requestPermission();
    exit();
}

let currentConfigName = gameProfile.getCurrentConfigName();
let titleStr = "当前配置: " + currentConfigName;

var index;
var exportScore = false;
switch (dialogs.select(titleStr, ["🎶演奏乐曲", "🛠️更改全局设置", "🛠️更改乐曲设置", "🎼乐谱输出", "📲MIDI串流", "📃查看使用说明","🚪离开"])) {
    case -1:
        exit();
    case 0:
        index = dialogs.select("选择一首乐曲..", rawFileNameList);
        if (index < 0) reRunSelf();
        break;
    case 1:
        runGlobalSetup();
        reRunSelf();
        break;
    case 2:
        runFileListSetup(totalFiles);
        reRunSelf();
        break;
    case 3:
        index = dialogs.select("选择一首乐曲..", rawFileNameList);
        exportScore = true;
        break;
    case 4:
        startMidiStream();
        reRunSelf();
        break;
    case 5:
        app.viewFile(musicDir + "使用帮助.txt");
        exit();
        break;
    case 6:
        exit();
        break;
};


var fileName = totalFiles[index];

if (fileName == undefined) {
    reRunSelf();
}
// if (fileName.endsWith(".json")) {
//     noteData = parseTonejsJSON(musicDir + fileName);
// }else if(fileName.endsWith(".mid")){
//     noteData = parseMIDI(musicDir + fileName);
// }

// 加载进度条
let progressDialog = dialogs.build({
    title: "加载中",
    content: "正在解析文件...",
    negative: "取消",
    progress: {
        max: 100,
        showMinMax: false
    },
    cancelable: true,
    canceledOnTouchOutside: false
}).on("negative", () => {
    reRunSelf();
}).show();

let rawFileName = fileName.split(".")[0];
let startTime = new Date().getTime();

//加载配置
if(gameProfile.getCurrentConfig().leftTop[0] == 0){
    dialogs.alert("错误", "坐标未设置，请先设置坐标");
    progressDialog.dismiss();
    runGlobalSetup();
    reRunSelf();
}else{
    leftTop = gameProfile.getCurrentConfig().leftTop;
    rightBottom = gameProfile.getCurrentConfig().rightBottom;
    leftTop = JSON.stringify(leftTop);
    rightBottom = JSON.stringify(rightBottom);
    console.log("当前坐标:左上角" + leftTop + "右下角" + rightBottom);
}

keyRange = gameProfile.getKeyRange();


//解析文件
let noteData = musicFormats.parseFile(musicDir + fileName);
let durationSecond = (new Date().getTime() - startTime) / 1000;
let nps = (noteData.length / durationSecond).toFixed(0);
console.log("解析文件耗时" + durationSecond + "秒(" + nps + "nps)");
if(debugDumpPass.indexOf("parse") != -1) debugDump(noteData, "parse");

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

//伪装

let humanifyEnabled = readGlobalConfig("humanifyEnabled", false);

if (humanifyEnabled) {
    let noteAbsTimeStdDev = readGlobalConfig("humanifyNoteAbsTimeStdDev", 50);
    progressDialog.setContent("正在伪装音符...");
    console.log("正在伪装音符...");
    progressDialog.setMaxProgress(100);
    humanifyer.setNoteAbsTimeStdDev(noteAbsTimeStdDev);
    noteData = humanifyer.humanify(noteData);
   if(debugDumpPass.indexOf("humanify") != -1) debugDump(noteData, "humanify");

}

//生成音符
startTime = new Date().getTime();
progressDialog.setContent("正在生成音符...");
progressDialog.setMaxProgress(100);
let totalNoteCnt = noteData.length;

noteData = noteListConvert(noteData,(percentage)=>{
    progressDialog.setProgress(percentage);
});

durationSecond = (new Date().getTime() - startTime) / 1000;
nps = (noteData.length / durationSecond).toFixed(0);
console.log("生成音符耗时" + durationSecond + "秒(" + nps + "nps)");
if(debugDumpPass.indexOf("key") != -1) debugDump(noteData, "key");
// 优化音符
progressDialog.setContent("正在优化音符...");
progressDialog.setMaxProgress(100);
progressDialog.setProgress(0);
startTime = new Date().getTime();
noteData = timingRefine(noteData, (percentage) => {
    progressDialog.setProgress(percentage);
});

durationSecond = (new Date().getTime() - startTime) / 1000;
nps = (noteData.length / durationSecond).toFixed(0);
console.log("优化音符耗时" + durationSecond + "秒(" + nps + "nps)");

progressDialog.dismiss();

if(debugDumpPass.indexOf("timing") != -1) debugDump(noteData, "timing");

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

//生成点击坐标序列

const pressDuration = 5; //按压时间，单位:毫秒
const mergeThreshold = 0.01; //合并时间阈值，单位:秒
let gestureTimeList = new Array();
let lastGestures = new Set();
let lastGesturesTime = -1; //秒
noteData.forEach(note => {
    let key = note[0];
    let time = note[1];
    let clickPos = gameProfile.getKeyPosition(key - 1);
    let gesture = [0, pressDuration, clickPos];
    if (time - lastGesturesTime < mergeThreshold && lastGestures.size < 10) { //一次最多10个手势
        lastGestures.add(gesture);
    } else {
        let lastGesturesArray = Array.from(lastGestures);
        if (lastGesturesArray.length > 0) {
            gestureTimeList.push([lastGesturesArray, lastGesturesTime]);
        }
        lastGestures = new Set();
        lastGestures.add(gesture);
        lastGesturesTime = time;
    }
});
let lastGesturesArray = Array.from(lastGestures);
if (lastGesturesArray.length > 0) {
    gestureTimeList.push([lastGesturesArray, lastGesturesTime]);
}

if(debugDumpPass.indexOf("gesture") != -1) debugDump(gestureTimeList, "gesture");


let outRangedNoteCnt = overFlowedNoteCnt + underFlowedNoteCnt;

let statString = "音符总数:" + totalNoteCnt +
    "\n超出范围被丢弃的音符数:" + outRangedNoteCnt + "" + " (+" + overFlowedNoteCnt + ", -" + underFlowedNoteCnt + ")(" + (outRangedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%)" +
    "\n被取整的音符数:" + roundedNoteCnt + " (" + (roundedNoteCnt / noteData.length * 100).toFixed(2) + "%)" +
    "\n过于密集被丢弃的音符数:" + timingDroppedNoteCnt + " (" + (timingDroppedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%)" +
    "\n如果被取整的音符数过多,可以尝试在 调整音高 菜单中升高/降低一个半音";

dialogs.alert("乐曲信息",statString);
console.verbose("无障碍服务启动成功");


//主循环
var currentGestureIndex = 0
const gestureCount = gestureTimeList.length;
var progressBarDragged = false;

if (!readGlobalConfig("skipInit", 1)) sleep(noteData[0][1] * 1000);

//显示悬浮窗
let controlWindow = floaty.window(
    <frame gravity="left">
        <horizontal bg="#7fffff7f">
            <text id="timerText" text="00:00/00:00" textSize="14sp"  />
            <seekbar id="progressBar" layout_gravity="center_vertical" w='850px' />、
            <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Colored" w="140px" text="⏸" />
            <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="140px" text="⏹" />
        </horizontal>
    </frame>
);

toast("点击时间可调整悬浮窗位置");

let windowPosition = readGlobalConfig("windowPosition", [device.height/3, 0]);
//避免悬浮窗被屏幕边框挡住
controlWindow.setPosition(windowPosition[0], windowPosition[1]);
//TODO: 这里写死大小可能会有问题, 但是没有足够的测试数据来证明
controlWindow.setSize(900 + 180 + 180 + 180, -2);   
//controlWindow.setTouchable(true);

//悬浮窗事件
controlWindow.timerText.on("click", () => {
    controlWindow.setAdjustEnabled(!controlWindow.isAdjustEnabled());
    //记忆位置
    if (!controlWindow.isAdjustEnabled()) {
        setGlobalConfig("windowPosition", [controlWindow.getX(), controlWindow.getY()]);
    }
});


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
    let totalTimeSec = gestureTimeList[gestureCount - 1][1];
    let totalTimeStr = sec2timeStr(totalTimeSec);

    while (true) {
        //如果进度条被拖动，更新播放进度
        if(progressChanged){
            progressChanged = false;
            progressBarDragged = true;
            let targetTimeSec = totalTimeSec * progress / 100;
            for (let j = 0; j < gestureTimeList.length; j++) {
                if (gestureTimeList[j][1] > targetTimeSec) {
                    currentGestureIndex = j - 1;
                    break;
                }
            }
        }
        if(currentGestureIndex < 0) currentGestureIndex = 0;
        //计算时间
        let curTimeSec = gestureTimeList[currentGestureIndex][1];
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

let lastTime = 0;
while (currentGestureIndex < gestureCount) {
    let gesturesList = gestureTimeList[currentGestureIndex][0];
    let time = gestureTimeList[currentGestureIndex][1];

    let delay = time - lastTime - pressDuration / 1000;
    lastTime = time;
    if (delay > 0){
        sleep(delay * 1000);
    }
    

    gestures.apply(null, gesturesList);

    currentGestureIndex++;


    while (paused) {
        sleep(500);
    }
    while (progressBarDragged) {
        progressBarDragged = false;
        lastTime = 999999999;
        sleep(500);
    }
};
toast("播放结束");
threads.shutDownAll();