//@ts-check

try {
    var getPosInteractive = requireShared("getPosInteractive.js");
    var MusicFormats = require("./src/musicFormats.js");
    var MidiDeviceManager = require("./src/midiDeviceManager.js");
    var GameProfile = require("./src/gameProfile.js");
    var Visualizer = require("./src/visualizer.js");
    var FileChooser = require("./src/fileChooser.js");
    var Players = require("./src/players.js");
    var Configuration = require("./src/configuration.js");
    var PassManager = require("./src/passManager.js");
} catch (e) {
    toast("请不要单独下载/复制这个脚本，需要下载'楚留香音乐盒'中的所有文件!");
    toast("模块加载错误");
    toast(e);
    console.error(e);
}

const musicDir = Configuration.getMusicDir();
const scriptVersion = 12;

//如果遇到奇怪的问题, 可以将下面这行代码前面两个斜杠去掉, 之后再次运行脚本, 即可清除当前的配置文件。
//setGlobalConfig("userGameProfile", null);


//在日志中打印脚本生成的中间结果, 可选项: parse, humanify, key, timing, merge, gestures
const debugDumpPass = "";

//将两个/几个彼此间隔时间小于以下阈值的音符合并, 单位: 秒
//用于自动演奏的合并阈值
const autoPlayMergeThreshold = 0.01;
//用于乐谱导出的合并阈值
const scoreExportMergeThreshold = 0.2;

let musicFormats = new MusicFormats();
let gameProfile = new GameProfile();
let visualizer = new Visualizer();

const setGlobalConfig = Configuration.setGlobalConfig;
const readGlobalConfig = Configuration.readGlobalConfig;
const haveFileConfig = Configuration.haveFileConfig;
const setFileConfig = Configuration.setFileConfig;
const readFileConfig = Configuration.readFileConfig;

//加载配置文件
try {
    //启动无障碍服务
    console.verbose("等待无障碍服务..");
    //toast("请允许本应用的无障碍权限");
    auto.waitFor();
    console.verbose("无障碍服务已启动");
    //TODO: 自定义配置
    let userGameProfile = readGlobalConfig("userGameProfile", null);
    if (userGameProfile != null) {
        gameProfile.loadGameConfigs(userGameProfile);
    } else {
        gameProfile.loadDefaultGameConfigs();
    }
    let lastConfigName = readGlobalConfig("lastConfigName", "");
    //尝试加载用户设置的游戏配置
    let activeConfigName = readGlobalConfig("activeConfigName", null);
    let res = gameProfile.setConfigByName(activeConfigName);
    if (res == false) {
        console.log("尝试加载用户设置的游戏配置...失败!");
    } else {
        console.log("尝试加载用户设置的游戏配置...成功, 当前配置: " + gameProfile.getCurrentConfigTypeName());
    }

    //尝试通过包名加载游戏配置 (加载失败后保留当前配置)
    let currentPackageName = currentPackage();
    console.log("当前包名:" + currentPackageName);
    res = gameProfile.setConfigByPackageName(currentPackageName);
    if (res == false) {
        console.log("尝试通过包名加载游戏配置...失败!");
    } else {
        console.log("尝试通过包名加载游戏配置...成功, 当前配置: " + gameProfile.getCurrentConfigTypeName());
        //保存当前配置
        setGlobalConfig("activeConfigName", gameProfile.getCurrentConfigTypeName());
    }

    if (gameProfile.getCurrentConfig() == null) {
        console.error("未找到合适配置, 已加载默认配置!");
        toast("未找到合适配置, 已加载默认配置!");
        gameProfile.setConfigByName("楚留香");
    }

    if(lastConfigName != gameProfile.getCurrentConfigTypeName()) {
        //如果配置发生了变化, 则清空上次的变体与键位配置
        setGlobalConfig("lastConfigName", gameProfile.getCurrentConfigTypeName());
        setGlobalConfig("lastVariantName", "");
        setGlobalConfig("lastKeyTypeName", "");
    }

    //加载变体配置和键位配置
    let lastVariantName = readGlobalConfig("lastVariantName", "");
    if (lastVariantName != "") {
        let res = gameProfile.setCurrentVariantByTypeName(lastVariantName);
        if (res == false) {
            console.log("尝试加载用户设置的变体配置...失败!");
            gameProfile.setCurrentVariantDefault();
        }else{
            console.log("尝试加载用户设置的变体配置...成功");
        }
    }else{
        gameProfile.setCurrentVariantDefault();
        console.log("游戏配置发生变化, 已加载默认变体配置");
    }
    setGlobalConfig("lastVariantName", gameProfile.getCurrentVariantTypeName());

    let lastKeyTypeName = readGlobalConfig("lastKeyTypeName", "");
    if (lastKeyTypeName != "") {
        let res = gameProfile.setCurrentKeyLayoutByTypeName(lastKeyTypeName);
        if (res == false) {
            console.log("尝试加载用户设置的键位配置...失败!");
            gameProfile.setCurrentKeyLayoutDefault();
        }else{
            console.log("尝试加载用户设置的键位配置...成功");
        }
    }else{
        gameProfile.setCurrentKeyLayoutDefault();
        console.log("游戏配置发生变化, 已加载默认键位配置");
    }
    setGlobalConfig("lastKeyTypeName", gameProfile.getCurrentKeyLayoutTypeName());

} catch (error) {
    toastLog("加载配置文件失败! 已自动加载默认配置!");
    toastLog(error);
    gameProfile.loadDefaultGameConfigs();
    setGlobalConfig("userGameProfile", null);
}


/**
 * 加载共享的js文件, 和require类似，用来解决几个项目共享js文件的问题。
 * 安卓不能软链接，如果把共享的js文件放上一个目录，打包之后就找不到了。
 * @param {string} fileName
 */
function requireShared(fileName) {
    const sharedDirRel = "../shared/";
    const cacheDirRel = "./sharedcache/";
    const alternativeSharedDir = "/sdcard/脚本/shared/";
    let sharedDir = files.path(sharedDirRel);
    let cacheDir = files.path(cacheDirRel);
    //检查是否在/data/user/目录下运行，如果是，则使用备用目录 (调试用)
    console.log(files.cwd());
    if (files.cwd().startsWith("/data/user/")) {
        sharedDir = alternativeSharedDir;
    }
    files.ensureDir(cacheDir);
    let sourceExists = files.exists(sharedDir + fileName);
    let cacheExists = files.exists(cacheDir + fileName);
    if (sourceExists && !cacheExists) {
        console.log("复制共享文件: " + fileName);
        files.copy(sharedDir + fileName, cacheDir + fileName);
        return require(cacheDir + fileName);
    } else if (!sourceExists && cacheExists) {
        //如果共享文件不存在，但是缓存文件存在，则直接加载缓存文件（打包之后，共享文件会丢失）
        console.log("共享文件不存在，加载缓存文件: " + fileName);
        return require(cacheDir + fileName);
    } else if (!sourceExists && !cacheExists) {
        throw new Error("共享文件不存在: " + fileName);
    }

    //都存在，检查是否有更新
    let sourceLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(sharedDir + fileName)).toMillis();
    let cacheLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(cacheDir + fileName)).toMillis();
    if (sourceLastModified > cacheLastModified) {
        console.log("共享文件有更新: " + fileName);
        files.copy(sharedDir + fileName, cacheDir + fileName);
    }
    return require(cacheDir + fileName);
}

function getJsonLength(json) {
    var jsonLength = 0;
    for (var i in json) {
        jsonLength++;
    }
    return jsonLength;
};

function getRawFileNameList() {// let humanifyer = new Humanifyer();
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


function startMidiStream() {
    if (!gameProfile.checkKeyPosition()) {
        dialogs.alert("错误", "坐标未设置，请设置坐标");
        runGlobalSetup();
        reRunSelf();
    }

    let midi = new MidiDeviceManager();
    let devNames = [];
    while (1) {
        devNames = midi.getMidiDeviceNames();
        if (devNames.length == 0) {
            if (!dialogs.confirm("错误", "没有找到MIDI设备, 点击确定重试, 点击取消退出")) {
                exit();
            }
        } else {
            break;
        }
    }
    let deviceIndex = dialogs.select("选择MIDI设备", devNames);
    if (deviceIndex == -1) {
        toast("您取消了选择, 脚本将会退出");
        exit();
    }
    let portNames = midi.getMidiPortNames(deviceIndex);
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
    while (1) {
        let keyList = [];
        while (!midi.dataAvailable()) {
            sleep(20);
        }
        while (midi.dataAvailable()) {
            let data = midi.read();
            let cmd = data[0] & midi.STATUS_COMMAND_MASK;
            //console.log("cmd: " + cmd);
            if (cmd == midi.STATUS_NOTE_ON && data[2] != 0) { // velocity != 0
                let key = gameProfile.getKeyByPitch(data[1]);
                if (key != -1 && keyList.indexOf(key) === -1) keyList.push(key);
                receivedNoteCnt++;
            }
        }
        let gestureList = new Array();
        for (let j = 0; j < keyList.length; j++) { //遍历这个数组
            let key = keyList[j];
            if (key != 0) {
                gestureList.push([0, 5, gameProfile.getKeyPosition(key - 1)]);
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
 * @param {Array<number, number>} noteData 音符数据
 * @param {string} exportType 导出类型, 可选值: "keyboardScore"
 * @brief 导出音符数据
 */
function exportNoteDataInteractive(noteData, exportType) {
    switch (exportType) {
        case "keyboardScore":
            let maxDelayTime = 0;
            let confirmed = false;
            let gapTime = 0;
            while (!confirmed) {
                gapTime = dialogs.input("输入在你打算把两个音符分到两小段的时候,它们间的时间差(单位:毫秒)", maxDelayTime.toString());
                if (gapTime < 10) dialogs.alert("", "输入无效,请重新输入");
                let segmentCnt = 1;
                noteData.forEach(key => {
                    if (key[1] >= gapTime) segmentCnt++;
                });
                confirmed = dialogs.confirm("", "乐谱将分为" + segmentCnt.toString() + "个小段,是否满意?");
            }

            let toneStr;
            switch (dialogs.select("选择导出格式", ["楚留香(键盘)", "原神(键盘)", "_简谱_"])) {
                case 0:
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 1:
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 2:
                    toneStr = "₁₂₃₄₅₆₇1234567¹²³⁴⁵⁶⁷"; //TODO: 这里的简谱格式可能需要调整
            }
            //开始转换
            let outPutStr = "";
            noteData.forEach(key => {
                if (key[0].length > 1) {
                    outPutStr += "(";
                    key[0].forEach(element => {
                        outPutStr += toneStr[element];
                    });
                    outPutStr += ")";
                } else {
                    outPutStr += toneStr[key[0][0]];
                }
                if (key[1] >= gapTime) outPutStr += " ";
            });
            //导出到文件
            let baseName = "乐谱导出";
            let path = musicDir + baseName + ".txt";
            let i = 1;
            while (files.exists(path)) {
                console.log("路径 " + path + " 已存在");
                path = musicDir + baseName + "(" + i.toString() + ")" + ".txt";
                i++;
            }
            files.write(path, outPutStr);
            dialogs.alert("导出成功", "已导出至" + path);
            console.log("导出成功: " + path);
            break;
        default:
            dialogs.alert("导出失败", "未知的导出类型");
    }
}


/**
 * @param {number} timeSec
 */
function sec2timeStr(timeSec) {
    let minuteStr = Math.floor(timeSec / 60).toString();
    let secondStr = Math.floor(timeSec % 60).toString();
    if (minuteStr.length == 1) minuteStr = "0" + minuteStr;
    if (secondStr.length == 1) secondStr = "0" + secondStr;

    return minuteStr + ":" + secondStr;
}


function saveUserGameProfile() {
    let profile = gameProfile.getGameConfigs();
    setGlobalConfig("userGameProfile", profile);
    console.log("保存用户游戏配置成功");
    toast("保存用户游戏配置成功");
};

function debugDump(obj, name) {
    console.log("====================" + name + "====================");
    console.log("Type of " + name + ": " + Object.prototype.toString.call(obj));
    let tmp = JSON.stringify(obj);
    console.log(tmp);
    console.log("====================" + name + "====================");
}

function reRunSelf() {
    engines.execScriptFile(files.cwd() + "/main.js");
    exit();
}

function importFileFromFileChooser() {
    let fileChooser = new FileChooser();
    // let filePath = fileChooser.chooseFileSync();
    // if (filePath == null) {
    //     toast("未选择文件");
    //     console.warn("未选择文件");
    //     return;
    // }
    // let isMusicFile = musicFormats.isMusicFile(filePath);
    // if (!isMusicFile) {
    //     toast("不是音乐文件");
    //     console.warn(filePath + " 不是音乐文件");
    //     return;
    // }
    // //复制文件到音乐目录
    // let res = files.copy(filePath, musicDir + files.getName(filePath));
    // if (res) {
    //     toast("导入成功");
    //     console.log(filePath + " -> " + musicDir + files.getName(filePath));
    // } else {
    //     console.warn("导入失败");
    //     toast("导入失败");
    // }
    fileChooser.chooseFileAndCopyTo(musicDir);
}



var _cachedNoteData = null;
/**
 * @param {string} fileName
 * @param {number} targetMajorPitchOffset
 * @param {number} targetMinorPitchOffset
 * @brief 测试配置效果 
 * @return {{
 * "outRangedNoteWeight": number,
 * "overFlowedNoteCnt": number,
 * "underFlowedNoteCnt": number,
 * "roundedNoteCnt": number,
 * "totalNoteCnt": number,
 * }}
 */
function evalFileConfig(fileName, targetMajorPitchOffset, targetMinorPitchOffset) {
    //丢弃音调高的音符的代价要高于丢弃音调低的音符的代价, 因此权重要高
    const overFlowedNoteWeight = 5;
    const passManager = new PassManager();
    let overFlowedNoteCnt = 0;
    let underFlowedNoteCnt = 0;
    let outRangedNoteWeight = 0;
    let roundedNoteCnt = 0;


    if (_cachedNoteData == null) {
        _cachedNoteData = [];
        let tracksData = passManager.addPass("ParseSourceFilePass").run(musicDir + fileName);
        //合并所有音轨. TODO: 分别计算?
        for (let i = 0; i < tracksData.trackCount; i++) {
            let track = tracksData.tracks[i];
            _cachedNoteData = _cachedNoteData.concat(track.notes);
        }
    }
    passManager.reset();
    passManager.addPass("NoteToKeyPass", {
        majorPitchOffset: targetMajorPitchOffset,
        minorPitchOffset: targetMinorPitchOffset,
        treatHalfAsCeiling: false,
        currentGameProfile: gameProfile,
    }, (progress) => { }, (data, statistics, elapsedTime) => {
        console.log("生成按键耗时" + elapsedTime / 1000 + "秒");
        overFlowedNoteCnt = statistics.overFlowedNoteCnt;
        underFlowedNoteCnt = statistics.underFlowedNoteCnt;
        outRangedNoteWeight = overFlowedNoteCnt * overFlowedNoteWeight + underFlowedNoteCnt;
        roundedNoteCnt = statistics.roundedNoteCnt;
    }).run(_cachedNoteData);

    return {
        "outRangedNoteWeight": outRangedNoteWeight,
        "overFlowedNoteCnt": overFlowedNoteCnt,
        "underFlowedNoteCnt": underFlowedNoteCnt,
        "roundedNoteCnt": roundedNoteCnt,
        "totalNoteCnt": _cachedNoteData.length,
    };
}

function autoTuneFileConfig(fileName) {
    const betterResultThreshold = 0.05; //如果新的结果比旧的结果好超过这个阈值，就认为新的结果更好
    const possibleMajorPitchOffset = [0, -1, 1, -2, 2];
    const possibleMinorPitchOffset = [0, 1, -1, 2, -2, 3, -3, 4, -4];
    let bestMajorPitchOffset = 0;
    let bestMinorPitchOffset = 0;
    let bestResult = { "outRangedNoteWeight": 10000000, "roundedNoteCnt": 10000000 };
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
    for (let i = 0; i < possibleMajorPitchOffset.length; i++) {
        dial.setProgress(i);
        //只考虑超范围的音符
        let result = evalFileConfig(fileName, possibleMajorPitchOffset[i], 0);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.outRangedNoteWeight - result.outRangedNoteWeight > result.outRangedNoteWeight * betterResultThreshold) {
            bestMajorPitchOffset = possibleMajorPitchOffset[i];
            bestResult.outRangedNoteWeight = result.outRangedNoteWeight;
        }
    }
    for (let i = 0; i < possibleMinorPitchOffset.length; i++) {
        dial.setProgress(possibleMajorPitchOffset.length + i);
        //只考虑被四舍五入的音符
        let result = evalFileConfig(fileName, bestMajorPitchOffset, possibleMinorPitchOffset[i]);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.roundedNoteCnt - result.roundedNoteCnt > result.roundedNoteCnt * betterResultThreshold) {
            bestMinorPitchOffset = possibleMinorPitchOffset[i];
            bestOverFlowedNoteCnt = result.overFlowedNoteCnt;
            bestUnderFlowedNoteCnt = result.underFlowedNoteCnt;
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

    setFileConfig("majorPitchOffset", bestMajorPitchOffset, fileName);
    setFileConfig("minorPitchOffset", bestMinorPitchOffset, fileName);
    toast("自动调整完成");
    return 0;
}

function runFileConfigSetup(fullFileName) {
    let fileName = fullFileName;
    let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["一键自动优化", "调整音高", "半音处理方式"])) {
        case -1:
            break;
        case 0:
            autoTuneFileConfig(fileName);
            break;
        case 1:
            let setupFinished = false;
            _cachedNoteData = null;
            while (!setupFinished) {
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
                let res3 = dialogs.confirm("测试设置", "设置已经保存，是否测试一下？");
                if (res3) {
                    currentMajorPitchOffset = readFileConfig("majorPitchOffset", rawFileName);
                    currentMinorPitchOffset = readFileConfig("minorPitchOffset", rawFileName);
                    let result = evalFileConfig(fileName, currentMajorPitchOffset, currentMinorPitchOffset);
                    let totalNoteCnt = result.totalNoteCnt;
                    let realBestOutRangedNoteCnt = result.overFlowedNoteCnt + result.underFlowedNoteCnt;
                    let percentStr1 = (realBestOutRangedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%";
                    let percentStr2 = (result.roundedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%";
                    let resultStr =
                        "超出范围被丢弃的音符数: " + realBestOutRangedNoteCnt + " (+" + result.overFlowedNoteCnt + ", -" + result.underFlowedNoteCnt + ")(" + percentStr1 + ")\n" +
                        "被取整的音符数: " + result.roundedNoteCnt + " (" + percentStr2 + ")\n" +
                        "点击确认退出, 点击取消继续调整";
                    let res4 = dialogs.confirm("测试结果", resultStr);
                    if (res4) {
                        setupFinished = true;
                        _cachedNoteData = null;
                    }
                } else {
                    break;
                }
            }
            break;
        case 2:
            setFileConfig("halfCeiling", dialogs.singleChoice("楚留香的乐器无法弹奏半音，所以对于半音..", ["降低", "升高"], readFileConfig("halfCeiling", rawFileName)), rawFileName);
            break;
    };
}

function runFileListSetup(fileList) {
    let rawFileNameList = fileList.map((fileName) => musicFormats.getFileNameWithoutExtension(fileName));
    let fileIndex = dialogs.select("选择一首乐曲..", rawFileNameList);
    if (fileIndex == -1) {
        return;
    }
    let fileName = fileList[fileIndex];
    runFileConfigSetup(fileName);
};

function runGlobalSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "设置配置类型", "设置坐标", "伪装手弹模式", "乐谱可视化"])) {
        case -1:
            break;
        case 0:
            setGlobalConfig("skipInit", dialogs.select("是否跳过乐曲开始前的空白?", ["否", "是"]));
            break;
        case 1:
            //目标游戏
            let configList = gameProfile.getConfigNameList();
            let sel = dialogs.select("选择目标游戏...", configList);
            if (sel == -1) {
                toastLog("设置没有改变");
                break;
            } 
            let configName = configList[sel];
            setGlobalConfig("activeConfigName", configName);
            setGlobalConfig("lastConfigName", configName);
            gameProfile.setConfigByName(configName);
            console.log("目标游戏已设置为: " + configName);
            //目标乐器
            let instrumentList = gameProfile.getCurrentAvailableVariants();
            if (instrumentList.length == 1) {
                gameProfile.setCurrentVariantDefault();
                setGlobalConfig("lastVariantName", gameProfile.getCurrentVariantTypeName());
            }else{
                let nameList = instrumentList.map((variant) => variant.variantName);
                let sel = dialogs.select("选择目标乐器...", nameList);
                if (sel == -1) {
                    toastLog("设置没有改变");
                    break;
                }
                let typeName = instrumentList[sel].variantType;
                gameProfile.setCurrentVariantByTypeName(typeName);
                setGlobalConfig("lastVariantName", typeName);
                console.log("目标乐器已设置为: " + typeName);
            }
            //目标键位
            let keyLayoutList = gameProfile.getCurrentAvailableKeyLayouts();
            if (keyLayoutList.length == 1) {
                gameProfile.setCurrentKeyLayoutDefault();
                setGlobalConfig("lastKeyTypeName", gameProfile.getCurrentKeyLayoutTypeName());
            }else{
                let allKeyLayoutList = gameProfile.getAllKeyLayouts();
                let nameList = keyLayoutList.map((keyLayout) => allKeyLayoutList[keyLayout].displayName);
                let sel = dialogs.select("选择目标键位...", nameList);
                if (sel == -1) {
                    toastLog("设置没有改变");
                    break;
                }
                let typeName = keyLayoutList[sel];
                gameProfile.setCurrentKeyLayoutByTypeName(typeName);
                setGlobalConfig("lastKeyTypeName", typeName);
                console.log("目标键位已设置为: " + typeName);
            }

            toastLog("设置已保存");
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
        case 4: //乐谱可视化
            let visualizerEnabled = dialogs.confirm("乐谱可视化", "是否要开启乐谱可视化?");
            setGlobalConfig("visualizerEnabled", visualizerEnabled);
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

let configName = gameProfile.getCurrentConfigDisplayName();
let variantName = gameProfile.getCurrentVariantDisplayName();
let keyTypeName = gameProfile.getCurrentKeyLayoutDisplayName();
let currentConfigName = configName + " " + variantName + " " + keyTypeName;
let titleStr = "当前配置: " + currentConfigName;

var index;
var exportScore = false;
switch (dialogs.select(titleStr, ["🎶演奏乐曲", "🛠️更改全局设置", "🛠️更改乐曲设置", "🎼乐谱输出", "📲MIDI串流", "📃查看使用说明", "🚪离开"])) {
    case -1:
        exit();
    case 0:
        let selected = false;
        dialogs.build({
            title: "选择乐曲...",
            items: rawFileNameList,
            itemsSelectMode: "select",
            neutral: "导入文件...",
            negative: "取消",
            cancelable: true,
            canceledOnTouchOutside: true,
        }).on("neutral", () => {
            importFileFromFileChooser(); //非阻塞
            exit();
        }).on("negative", reRunSelf
        ).on("cancel", reRunSelf
        ).on("item_select", (idx, item, dialog) => {
            index = idx;
            selected = true;
        }).show();
        while (!selected) {
            sleep(100);
        }
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

//////////////显示加载进度条
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

let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
let startTime = new Date().getTime();

//////////////加载配置
if (!gameProfile.checkKeyPosition()) {
    dialogs.alert("错误", "坐标未设置，请先设置坐标");
    progressDialog.dismiss();
    runGlobalSetup();
    reRunSelf();
};

//如果是第一次运行，显示设置向导
if (!haveFileConfig(rawFileName)) {
    let res = dialogs.confirm("设置向导", "检测到您是第一次演奏这首乐曲，是否要运行设置?");
    if (res) {
        progressDialog.dismiss();
        runFileConfigSetup(fileName);
    };
};


let humanifyEnabled = readGlobalConfig("humanifyEnabled", false);
let majorPitchOffset = readFileConfig("majorPitchOffset", rawFileName);
let minorPitchOffset = readFileConfig("minorPitchOffset", rawFileName);
let treatHalfAsCeiling = readFileConfig("halfCeiling", rawFileName);
let mergeThreshold = exportScore ? scoreExportMergeThreshold : autoPlayMergeThreshold;
let keyRange = gameProfile.getKeyRange();

console.log("当前乐曲:" + fileName);
console.log("配置信息:");
console.log("majorPitchOffset:" + majorPitchOffset);
console.log("minorPitchOffset:" + minorPitchOffset);
console.log("treatHalfAsCeiling:" + treatHalfAsCeiling);

const passManager = new PassManager();

/////////////解析文件
progressDialog.setContent("正在解析文件...");
let tracksData = passManager.addPass("ParseSourceFilePass", null, null, (data, statistics, elapsedTime) => {
    console.log("解析文件耗时" + elapsedTime / 1000 + "秒");
    if (debugDumpPass.indexOf("parse") != -1) debugDump(data, "parse");
}).run(musicDir + fileName);
passManager.reset();


/////////////选择音轨
progressDialog.setContent("正在解析音轨...");
let noteData = [];
if (tracksData.haveMultipleTrack) {
    //删除没有音符的音轨
    for (let i = tracksData.tracks.length - 1; i >= 0; i--) {
        if (tracksData.tracks[i].noteCount == 0) {
            tracksData.tracks.splice(i, 1);
        }
    }
    let nonEmptyTrackCount = tracksData.tracks.length;

    //上次选择的音轨(包括空音轨)
    let lastSelectedTracksNonEmpty = readFileConfig("lastSelectedTracksNonEmpty", rawFileName);
    if (typeof (lastSelectedTracksNonEmpty) == "undefined" || !lastSelectedTracksNonEmpty.length == nonEmptyTrackCount) {
        lastSelectedTracksNonEmpty = [];
        for (let i = 0; i < nonEmptyTrackCount; i++) {
            lastSelectedTracksNonEmpty.push(i); //默认选择所有音轨
        }
    }
    let trackInfoStrs = [];
    for (let i = 0; i < nonEmptyTrackCount; i++) {
        let track = tracksData.tracks[i];
        let avgPitch = 0;
        for (let j = 0; j < track.notes.length; j++) {
            avgPitch += track.notes[j][0];
        }
        avgPitch /= track.notes.length;
        trackInfoStrs.push(i + ": " + track.name + " (" + track.noteCount + "个音符, 平均音高" + avgPitch.toFixed(1) + ")");
    }
    let selectedTracksNonEmpty = dialogs.multiChoice("选择音轨", trackInfoStrs, lastSelectedTracksNonEmpty);
    if (selectedTracksNonEmpty.length == 0) {
        selectedTracksNonEmpty = lastSelectedTracksNonEmpty;
    }

    //合并
    for (let i = 0; i < selectedTracksNonEmpty.length; i++) {
        let track = tracksData.tracks[selectedTracksNonEmpty[i]];
        noteData = noteData.concat(track.notes);
    }
    //按时间排序
    noteData.sort(function (a, b) {
        return a[1] - b[1];
    });
    //保存选择
    setFileConfig("lastSelectedTracksNonEmpty", selectedTracksNonEmpty, rawFileName);

} else {
    noteData = tracksData.tracks[0].notes;
}

//一些统计信息
let finalNoteCnt = 0, inputNoteCnt = 0, overFlowedNoteCnt = 0, underFlowedNoteCnt = 0, roundedNoteCnt = 0, droppedNoteCnt = 0;
inputNoteCnt = noteData.length;

progressDialog.setContent("正在伪装手弹...");
passManager
    .addPass(humanifyEnabled ? "HumanifyPass" : "NopPass", {
        noteAbsTimeStdDev: readGlobalConfig("humanifyNoteAbsTimeStdDev", 50)
    }, null, () => {
        progressDialog.setContent("正在生成按键...");
    })
    .addPass("NoteToKeyPass", {
        majorPitchOffset: majorPitchOffset,
        minorPitchOffset: minorPitchOffset,
        treatHalfAsCeiling: treatHalfAsCeiling,
        currentGameProfile: gameProfile,
    }, (progress) => {
        progressDialog.setProgress(progress);
    }, (data, statistics, elapsedTime) => {
        console.log("生成按键耗时" + elapsedTime / 1000 + "秒");
        overFlowedNoteCnt = statistics.overFlowedNoteCnt;
        underFlowedNoteCnt = statistics.underFlowedNoteCnt;
        roundedNoteCnt = statistics.roundedNoteCnt;
        progressDialog.setContent("正在优化按键...");
    })
    .addPass("SingleKeyFrequencyLimitPass", {
        minInterval: gameProfile.getSameKeyMinInterval()
    }, null, (data, statistics, elapsedTime) => {
        console.log("单键频率限制耗时" + elapsedTime / 1000 + "秒");
        finalNoteCnt = data.length;
        droppedNoteCnt = statistics.droppedNoteCnt;
        progressDialog.setContent("正在合并按键...");
    })
    .addPass("MergeKeyPass", {
        maxInterval: mergeThreshold * 1000,
    }, null, (data, statistics, elapsedTime) => {
        console.log("合并按键耗时" + elapsedTime / 1000 + "秒");
        visualizer.setKeyLayout(gameProfile.getKeyType().row, gameProfile.getKeyType().column);
        visualizer.loadNoteData(data);
        visualizer.goto(-1);
        progressDialog.setContent("正在生成手势...");
    });

if (exportScore) {
    //如果是导出乐谱,则不需要生成手势
    let data = passManager.run(noteData);
    progressDialog.dismiss();
    exportNoteDataInteractive(data, "keyboardScore");
    exit();
}
passManager.addPass("KeyToGesturePass", {
    currentGameProfile: gameProfile,
}, null, (data, statistics, elapsedTime) => {
    console.log("生成手势耗时" + elapsedTime / 1000 + "秒");
    progressDialog.dismiss();
});

let gestureTimeList = passManager.run(noteData);

//数据汇总
let outRangedNoteCnt = overFlowedNoteCnt + underFlowedNoteCnt;

let statString = "音符总数:" + inputNoteCnt + " -> " + finalNoteCnt +
    "\n超出范围被丢弃的音符数:" + outRangedNoteCnt + "" + " (+" + overFlowedNoteCnt + ", -" + underFlowedNoteCnt + ")(" + (outRangedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
    "\n被取整的音符数:" + roundedNoteCnt + " (" + (roundedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
    "\n过于密集被丢弃的音符数:" + droppedNoteCnt + " (" + (droppedNoteCnt / finalNoteCnt * 100).toFixed(2) + "%)" +
    "\n如果被取整的音符数过多,可以尝试在 调整音高 菜单中升高/降低一个半音";

dialogs.alert("乐曲信息", statString);

//////////////主循环
var currentGestureIndex = 0
const gestureCount = gestureTimeList.length;
let player = new Players.AutoJsGesturePlayer();
player.setGestureTimeList(gestureTimeList);
player.pause();

if (!readGlobalConfig("skipInit", 1)) sleep(noteData[0][1] * 1000);

//显示悬浮窗
let controlWindow = floaty.window(
    <frame gravity="left">
        <horizontal bg="#7fffff7f">
            <text id="timerText" text="00:00/00:00" textSize="14sp" />
            <seekbar id="progressBar" layout_gravity="center_vertical" w='850px' />、
            <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Colored" w="140px" text="⏸" />
            <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="140px" text="⏹" />
        </horizontal>
    </frame>
);

toast("点击时间可调整悬浮窗位置");

let windowPosition = readGlobalConfig("windowPosition", [device.height / 3, 0]);
//避免悬浮窗被屏幕边框挡住
controlWindow.setPosition(windowPosition[0], windowPosition[1]);
//TODO: 这里写死大小可能会有问题, 但是没有足够的测试数据来证明
controlWindow.setSize(900 + 180 + 180 + 180, -2);
//controlWindow.setTouchable(true);

//悬浮窗事件
controlWindow.timerText.on("click", () => {
    let adjEnabled = controlWindow.isAdjustEnabled();
    controlWindow.setAdjustEnabled(!adjEnabled);
    //记忆位置
    if (adjEnabled) {
        setGlobalConfig("windowPosition", [controlWindow.getX(), controlWindow.getY()]);
    }
});


//用来更新悬浮窗的线程
threads.start(function () {
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
            if (player.getState() != player.PlayerStates.PLAYING) {
                player.resume();
                controlWindow.pauseResumeBtn.setText("⏸");
            } else {
                player.pause();
                controlWindow.pauseResumeBtn.setText("▶️");
            }
        });
        controlWindow.stopBtn.click(() => {
            visualizerWindowClose();
            controlWindow.close();
            setTimeout(() => {
                threads.shutDownAll();
                reRunSelf();
            }, 500);

        })
    });
    let totalTimeSec = gestureTimeList[gestureCount - 1][1];
    let totalTimeStr = sec2timeStr(totalTimeSec);

    while (true) {
        //如果进度条被拖动，更新播放进度
        if (progressChanged) {
            progressChanged = false;
            let targetTimeSec = totalTimeSec * progress / 100;
            for (let j = 0; j < gestureTimeList.length; j++) {
                if (gestureTimeList[j][1] > targetTimeSec) {
                    currentGestureIndex = j - 1;
                    break;
                }
            }
            currentGestureIndex = Math.max(0, currentGestureIndex);
            player.seekTo(currentGestureIndex);
            sleep(50);
        } else {
            sleep(300);
        }
        currentGestureIndex = Math.min(currentGestureIndex, gestureCount - 1);
        //计算时间
        let curTimeSec = gestureTimeList[currentGestureIndex][1];
        let curTimeStr = sec2timeStr(curTimeSec);
        let timeStr = curTimeStr + "/" + totalTimeStr;
        //更新窗口
        ui.run(() => {
            controlWindow.progressBar.setProgress(curTimeSec / totalTimeSec * 100);
            controlWindow.timerText.setText(timeStr);
        })
    }
})

//可视化悬浮窗口
let visualizerWindow = floaty.window(
    <canvas id="canv" w="*" h="*" />
);

let visualizerWindowPosition = readGlobalConfig("visualizerWindowPosition", [100, 100]);
visualizerWindow.setPosition(visualizerWindowPosition[0], visualizerWindowPosition[1]);
let visualizerWindowSize = readGlobalConfig("visualizerWindowSize", [device.width / 2, device.height / 2]);
visualizerWindow.setSize(visualizerWindowSize[0], visualizerWindowSize[1]);

let visualizerWindowRequestClose = false;
visualizerWindow.canv.on("draw", function (canvas) {
    visualizer.draw(canvas);
    //如果在绘制时窗口被关闭, app会直接崩溃, 所以这里要等待一下
    if (visualizerWindowRequestClose) {
        sleep(1000);
    }
});

//上一次点击的时间
let visualizerLastClickTime = 0;

//触摸事件(这里on("click",...) 又失灵了, AutoXjs的文档真是够烂的)
visualizerWindow.canv.click(function () {
    let now = new Date().getTime();
    if (now - visualizerLastClickTime < 500) {
        toast("重置悬浮窗大小与位置");
        visualizerWindow.setSize(device.height * 2 / 3, device.width * 2 / 3);
        visualizerWindow.setPosition(100, 100);
    }
    visualizerLastClickTime = now;
    let adjEnabled = visualizerWindow.isAdjustEnabled();
    visualizerWindow.setAdjustEnabled(!adjEnabled);
    if (adjEnabled) {
        //更新大小 (使用窗口上的拖动手柄缩放时, 窗口的大小实际上是不会变的, 所以这里要手动更新)
        visualizerWindow.setSize(visualizerWindow.getWidth(), visualizerWindow.getHeight());
        //保存当前位置与大小
        setGlobalConfig("visualizerWindowPosition", [visualizerWindow.getX(), visualizerWindow.getY()]);
        setGlobalConfig("visualizerWindowSize", [visualizerWindow.getWidth(), visualizerWindow.getHeight()]);
    }
});
//关闭
function visualizerWindowClose() {
    visualizerWindowRequestClose = true;
    setTimeout(() => {
        visualizerWindow.close();
    }, 200);
}
//是否显示可视化窗口
let visualizerEnabled = readGlobalConfig("visualizerEnabled", false);
if (!visualizerEnabled) {
    visualizerWindowClose();
} else {
    toast("单击可视化窗口调整大小与位置, 双击重置");
}

player.setOnPlayNote(function (note) {
    currentGestureIndex = note;
    visualizer.goto(Math.max(0, note - 1));
});

player.start();

while (player.getState() != player.PlayerStates.FINISHED) {
    sleep(500);
}
toast("播放结束");
visualizerWindowClose();
controlWindow.close();
threads.shutDownAll();