//@ts-check

try {
    var getPosInteractive = requireShared("getPosInteractive.js");
    var MusicFormats = require("./src/musicFormats.js");
    var MidiDeviceManager = require("./src/midiDeviceManager.js");
    var GameProfile = require("./src/gameProfile.js");
    var Visualizer = require("./src/visualizer.js");
    var FileChooser = require("./src/fileChooser.js");
    var Players = require("./src/players.js");
    var configuration = require("./src/configuration.js");
    var PassManager = require("./src/passManager.js");
    var runtimes = require("./src/runtimes.js");
    var midiPitch = require("./src/midiPitch.js");
} catch (e) {
    toast("请不要单独下载/复制这个脚本，需要下载'楚留香音乐盒'中的所有文件!");
    toast("模块加载错误");
    toast(e);
    console.error(e);
}

const musicDir = configuration.getMusicDir();
const scriptVersion = 25;

//如果遇到奇怪的问题, 可以将下面这行代码前面两个斜杠去掉, 之后再次运行脚本, 即可清除当前的配置文件。
//setGlobalConfig("userGameProfile", null);


//在日志中打印脚本生成的中间结果, 可选项: parse, humanify, key, timing, merge, gestures
const debugDumpPass = "";

//将两个/几个彼此间隔时间小于以下阈值的音符合并, 单位: 秒
//用于自动演奏的合并阈值
const autoPlayMergeThreshold = 0.01;
//用于乐谱导出的合并阈值
const scoreExportMergeThreshold = 0.2;

//应用名称, 稍后会被初始化
let appName = undefined;

let musicFormats = new MusicFormats();
let gameProfile = new GameProfile();
let visualizer = new Visualizer();

const setGlobalConfig = configuration.setGlobalConfig;
const readGlobalConfig = configuration.readGlobalConfig;
const haveFileConfig = configuration.haveFileConfig;
const setFileConfig = configuration.setFileConfig;
const readFileConfig = configuration.readFileConfig;

/**
 * @brief 导出数据的格式类型
 * @enum {string}
 */
const ScoreExportType = {
    none: "none",
    keyboardScore: "keyboardScore",
    keySequenceJSON: "keySequenceJSON",
};


/**
 * @brief 加载配置文件
 */
function loadConfiguration() {
    try {
        // TODO: 自定义配置
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
        if (auto.service != null) {
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
        }else{
            console.log("未启用无障碍服务, 跳过尝试通过包名加载游戏配置");
        }

        if (gameProfile.getCurrentConfig() == null) {
            console.error("未找到合适配置, 已加载默认配置!");
            toast("未找到合适配置, 已加载默认配置!");
            gameProfile.setConfigByName("楚留香");
        }

        if (lastConfigName != gameProfile.getCurrentConfigTypeName()) {
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
            } else {
                console.log("尝试加载用户设置的变体配置...成功");
            }
        } else {
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
            } else {
                console.log("尝试加载用户设置的键位配置...成功");
            }
        } else {
            gameProfile.setCurrentKeyLayoutDefault();
            console.log("游戏配置发生变化, 已加载默认键位配置");
        }
        setGlobalConfig("lastKeyTypeName", gameProfile.getCurrentKeyLayoutTypeName());

    } catch (error) {
        toastLog("加载配置文件失败! 已自动加载默认配置!");
        console.warn(error);
        gameProfile.loadDefaultGameConfigs();
        setGlobalConfig("userGameProfile", null);
    }
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

function getFileList() {
    return files.listDir(musicDir, function (name) {
        return files.isFile(files.join(musicDir, name)) && musicFormats.isMusicFile(name);
    });
}


function startMidiStream() {
    if (!gameProfile.checkKeyPosition()) {
        dialogs.alert("错误", "坐标未设置，请设置坐标");
        runGlobalSetup();
        return;
    }
    const midiEvt = events.emitter(threads.currentThread());
    let midi = null;
    const midiThread = threads.start(function () {
        setInterval(function(){}, 1000);
        midi = new MidiDeviceManager();
    });
    midiThread.waitFor();
    while (midi == null) {
        sleep(100);
    }
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
    midiThread.setImmediate(() => {
        midi.openDevicePort(deviceIndex, portIndex);
        midi.setDataReceivedCallback(() => {
            midiEvt.emit("dataReceived");
        });
    });
    //申请无障碍权限
    checkEnableAccessbility();
    let receivedNoteCnt = 0;
    //悬浮窗

    //显示悬浮窗
    let controlWindow = floaty.rawWindow(
        <frame gravity="left">
            <horizontal bg="#7fffff7f">
                <text id="txt" text="串流已就绪" textSize="14sp" />
                <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="180sp" text="退出⏹" />
            </horizontal>
        </frame>
    );

    //避免悬浮窗被屏幕边框挡住
    controlWindow.setPosition(device.height / 5, 0);
    // //TODO: 这里写死大小可能会有问题, 但是没有足够的测试数据来证明
    // controlWindow.setSize(900 + 180 + 180 + 180, -2);   
    controlWindow.setTouchable(true);

    //更新悬浮窗
    ui.run(function () {
        controlWindow.stopBtn.click(() => {
            midi.close();
            threads.shutDownAll();
            exit();
        });
    });

    function controlWindowUpdate() {
        ui.run(function () {
            controlWindow.txt.setText("正在串流中, 音符数量:" + receivedNoteCnt);
        });
    }
    setInterval(controlWindowUpdate, 200);

    midiEvt.on("dataReceived", () => {
        console.log("ToDo:receive data");

        let keyList = [];
        if (!midi.dataAvailable()) {
            return;
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
    });
}
/**
 * @brief 移除空的音轨
 * @param {MusicFormats.TracksData} tracksData 
 * @return {MusicFormats.TracksData} 移除空的音轨后的音轨数据
 */
function removeEmptyTracks(tracksData) {
    if (!tracksData.haveMultipleTrack) return tracksData;
    for (let i = tracksData.tracks.length - 1; i >= 0; i--) {
        if (tracksData.tracks[i].noteCount == 0) {
            tracksData.tracks.splice(i, 1);
        }
    }
    tracksData.trackCount = tracksData.tracks.length;
    if (tracksData.trackCount == 1) tracksData.haveMultipleTrack = false;
    return tracksData;
}

function checkEnableAccessbility() {
    //启动无障碍服务
    console.verbose("等待无障碍服务..");
    //toast("请允许本应用的无障碍权限");
    if(auto.service == null){
        toastLog(`请打开应用 "${appName}" 的无障碍权限!`);
        auto.waitFor();
        toastLog(`无障碍权限已开启!, 请回到游戏重新点击播放`);
        return false;
    }
    console.verbose("无障碍服务已启动");
    return true;
}

/**
 * @param {import("./src/musicFormats.js").Chord[]} noteData 音符数据
 * @param {ScoreExportType} exportType 导出类型
 * @brief 导出音符数据
 */
function exportNoteDataInteractive(noteData, exportType) {
    switch (exportType) {
        case ScoreExportType.keyboardScore:
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

            let toneStr = null;
            switch (dialogs.select("选择导出格式", ["楚留香(键盘)", "原神(键盘)", "_简谱_"])) {
                case 0:
                    if(gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7"){
                        dialogs.alert("错误", "当前选择的游戏键位和导出格式不匹配, 请选择3x7键位");
                        return;
                    }
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 1:
                    if(gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7"){
                        dialogs.alert("错误", "当前选择的游戏键位和导出格式不匹配, 请选择3x7键位");
                        return;
                    }
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 2:
                    if(gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7"){
                        dialogs.alert("错误", "当前选择的游戏键位和导出格式不匹配, 请选择3x7键位");
                        return;
                    }
                    toneStr = "₁₂₃₄₅₆₇1234567¹²³⁴⁵⁶⁷"; //TODO: 这里的简谱格式可能需要调整
            }
            //开始转换
            let outPutStr = "";
            noteData.forEach(key => {
                if (key[0].length > 1) {
                    //从高音到低音排序
                    key[0].sort((a, b) => {
                        return b - a;
                    });
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
        case ScoreExportType.keySequenceJSON:
            let baseName2 = "dump";
            let path2 = musicDir + baseName2 + ".json";
            let i2 = 1;
            while (files.exists(path2)) {
                console.log("路径 " + path2 + " 已存在");
                path2 = musicDir + baseName2 + "(" + i2.toString() + ")" + ".json";
                i2++;
            }
            files.write(path2, JSON.stringify(noteData));
            dialogs.alert("导出成功", "已导出至" + path2);
            console.log("导出成功: " + path2);
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

function selectTracksInteractive(tracksData, lastSelectedTracksNonEmpty) {
    //删除没有音符的音轨
    for (let i = tracksData.tracks.length - 1; i >= 0; i--) {
        if (tracksData.tracks[i].noteCount == 0) {
            tracksData.tracks.splice(i, 1);
        }
    }
    let nonEmptyTrackCount = tracksData.tracks.length;
    if (nonEmptyTrackCount === 1) {
        dialogs.alert("提示", "只有一条音轨,无需选择");
        return [0];
    }

    if (typeof (lastSelectedTracksNonEmpty) == "undefined" || lastSelectedTracksNonEmpty.length === 0){
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
        trackInfoStrs.push(track.name + " (" + track.noteCount + "个音符, 平均音高" + avgPitch.toFixed(1) + ")");
    }
    let selectedTracksNonEmpty = dialogs.multiChoice("选择音轨", trackInfoStrs, lastSelectedTracksNonEmpty);
    if (selectedTracksNonEmpty.length == 0) { //取消选择, 保持原样
        selectedTracksNonEmpty = lastSelectedTracksNonEmpty;
    }
    return selectedTracksNonEmpty;
}

/**
 * @param {MusicFormats.Note[]} noteData
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
function evalFileConfig(noteData, targetMajorPitchOffset, targetMinorPitchOffset) {
    //丢弃音调高的音符的代价要高于丢弃音调低的音符的代价, 因此权重要高
    const overFlowedNoteWeight = 5;
    const passManager = new PassManager();
    let overFlowedNoteCnt = 0;
    let underFlowedNoteCnt = 0;
    let outRangedNoteWeight = 0;
    let roundedNoteCnt = 0;

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
    }).run(noteData);

    return {
        "outRangedNoteWeight": outRangedNoteWeight,
        "overFlowedNoteCnt": overFlowedNoteCnt,
        "underFlowedNoteCnt": underFlowedNoteCnt,
        "roundedNoteCnt": roundedNoteCnt,
        "totalNoteCnt": noteData.length,
    };
}

/**
 * @brief 自动调整文件配置, 包括移调和音轨选择
 * @param {string} fileName 
 * @param {number} trackDisableThreshold 如果一个音轨中超过这个比例的音符被丢弃, 就不选择这个音轨
 * @returns 
 */
function autoTuneFileConfig(fileName,trackDisableThreshold) {
    const betterResultThreshold = 0.05; //如果新的结果比旧的结果好超过这个阈值，就认为新的结果更好
    const possibleMajorPitchOffset = [0, -1, 1, -2, 2];
    const possibleMinorPitchOffset = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, 6, 7];
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

    const passManager = new PassManager();
    let tracksData = /** @type {MusicFormats.TracksData} */ (passManager.addPass("ParseSourceFilePass").run(musicDir + fileName));
    let noteData = new Array();

    //合并所有音轨. 
    for (let i = 0; i < tracksData.trackCount; i++) {
        let track = tracksData.tracks[i];
        noteData = noteData.concat(track.notes);
    }

    for (let i = 0; i < possibleMajorPitchOffset.length; i++) {
        dial.setProgress(i);
        //只考虑超范围的音符
        let result = evalFileConfig(noteData, possibleMajorPitchOffset[i], 0);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.outRangedNoteWeight - result.outRangedNoteWeight > result.outRangedNoteWeight * betterResultThreshold) {
            bestMajorPitchOffset = possibleMajorPitchOffset[i];
            bestResult.outRangedNoteWeight = result.outRangedNoteWeight;
        }
    }
    for (let i = 0; i < possibleMinorPitchOffset.length; i++) {
        dial.setProgress(possibleMajorPitchOffset.length + i);
        //只考虑被四舍五入的音符
        let result = evalFileConfig(noteData, bestMajorPitchOffset, possibleMinorPitchOffset[i]);
        console.log("Pass " + i + " 结果: " + JSON.stringify(result));
        if (bestResult.roundedNoteCnt - result.roundedNoteCnt > result.roundedNoteCnt * betterResultThreshold) {
            bestMinorPitchOffset = possibleMinorPitchOffset[i];
            bestOverFlowedNoteCnt = result.overFlowedNoteCnt;
            bestUnderFlowedNoteCnt = result.underFlowedNoteCnt;
            bestResult = result;
        }
    }
    console.info("最佳结果: " + JSON.stringify(bestResult));
    console.info("最佳八度偏移: " + bestMajorPitchOffset);
    console.info("最佳半音偏移: " + bestMinorPitchOffset);

    //禁用无效音符过多的音轨
    tracksData = removeEmptyTracks(tracksData);
    let selectedTracksNonEmpty = new Array();
    if (tracksData.haveMultipleTrack) {
        let trackPlayableNoteRatio = new Array();
        for (let i = 0; i < tracksData.trackCount; i++) {
            let track = tracksData.tracks[i];
            let playableNoteCnt = 0;
            let result = evalFileConfig(track.notes, bestMajorPitchOffset, bestMinorPitchOffset);
            playableNoteCnt = track.notes.length - result.overFlowedNoteCnt - result.underFlowedNoteCnt;
            trackPlayableNoteRatio.push([i, playableNoteCnt / track.notes.length]);
        }
        trackPlayableNoteRatio.sort((a, b) => {
            return b[1] - a[1]; //从大到小排序
        });
        console.log("音轨可用音符比例: " + JSON.stringify(trackPlayableNoteRatio));
        selectedTracksNonEmpty = new Array();
        selectedTracksNonEmpty.push(trackPlayableNoteRatio[0][0]);
        trackPlayableNoteRatio.shift();
        for (let i = 0; i < trackPlayableNoteRatio.length; i++) {
            let obj = trackPlayableNoteRatio[i];
            if (obj[1] > trackDisableThreshold) {
                selectedTracksNonEmpty.push(obj[0]);
            }
        }
        console.info("选择的音轨: " + JSON.stringify(selectedTracksNonEmpty));
    }
    dial.dismiss();
    let realBestOutRangedNoteCnt = bestOverFlowedNoteCnt + bestUnderFlowedNoteCnt;
    let totalNoteCnt = noteData.length;
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
    if (tracksData.haveMultipleTrack)
        resultStr += "\n选择的音轨: " + JSON.stringify(selectedTracksNonEmpty);

    dialogs.alert("调整结果", resultStr);
    
    configuration.setFileConfigForTarget("majorPitchOffset", bestMajorPitchOffset, fileName, gameProfile);
    configuration.setFileConfigForTarget("minorPitchOffset", bestMinorPitchOffset, fileName, gameProfile);
    configuration.setFileConfigForTarget("lastSelectedTracksNonEmpty", selectedTracksNonEmpty, fileName, gameProfile);
    toast("自动调整完成");
    return 0;
}

function runClickPosSetup() {
    let pos1 = getPosInteractive("最上面那行按键中最左侧的按键中心");
    let pos2 = getPosInteractive("最下面那行按键中最右侧的按键中心");

    console.log("自定义坐标:左上[" + pos1.x + "," + pos1.y + "],右下[" + pos2.x + "," + pos2.y + "]");

    gameProfile.setKeyPosition([pos1.x, pos1.y], [pos2.x, pos2.y]);
    saveUserGameProfile();
}

/**
 * @brief 将一个数值转换到0-1000的另一个区间, 给进度条用
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function numberMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

/**
 * @brief numberMap的对数版本
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return Math.log(value - min + 1) / Math.log(max - min + 1) * (newMax - newMin) + newMin;
}

/**
 * @brief numberMap的反函数
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberRevMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return (value - newMin) / (newMax - newMin) * (max - min) + min;
}

/**
 * @brief numberMapLog的反函数
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMapLog
 */
function numberRevMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return min + (Math.exp((value - newMin) / (newMax - newMin) * Math.log(max - min + 1)) - 1);
}

function runFileConfigSetup(fullFileName) {
    let fileName = fullFileName;
    let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
    let configChanged = false;
    const maxClickSpeedHz = 20;
    const view = ui.inflate(
        <ScrollView margin="0dp" padding="0dp">
            <vertical margin="0dp" padding="0dp">
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                    <vertical>
                        <text text="速度控制:" textColor="red" />
                        <horizontal>
                            {/* 33~300%, 对数, 默认1->不使用 */}
                            <text text="变速:" />
                            <checkbox id="speedMultiplier" />
                            <text text="default%" id="speedMultiplierValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="speedMultiplierSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal w="*">
                            {/* 1~20hz, 对数 , 默认0->不使用*/}
                            <text text="限制点击速度(在变速后应用):" />
                            <checkbox id="limitClickSpeedCheckbox" />
                            <text text="default次/秒" id="limitClickSpeedValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="limitClickSpeedSeekbar" w="*" max="1000" layout_gravity="center" />
                    </vertical>
                </card>
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                    <vertical>
                        <text text="时长控制(输出):" textColor="red" />
                        <horizontal w="*">
                            <text text="默认点击时长: " />
                            {/* <radiogroup id="defaultClickDurationMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                 固定的值, 1~500ms, 对数, 默认5ms 
                                <radio id="defaultClickDurationMode_fixed" text="固定值" textSize="12sp" margin="0dp" selected="true" />
                                音符间隔的比例, 例如0.5代表点击时长为到下一个音符的间隔的一半. 0.05~0.98, 线性, 默认0.5
                                <radio id="defaultClickDurationMode_intervalRatio" text="音符间隔比例" textSize="12sp" margin="0dp" />
                            </radiogroup> */}
                            <text text="defaultms" id="defaultClickDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="defaultClickDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                    </vertical>
                </card>
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                    <vertical>
                        <text text="音域优化:" textColor="red" />
                        {/* <ImageView w="*" h="1dp" bg="#a0a0a0" /> */}
                        <horizontal>
                            {/* 默认向下取整 */}
                            <text text="半音处理方法:" layout_gravity="center_vertical" />
                            <radiogroup id="halfCeilingSetting" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="halfCeilingSetting_roundDown" text="向下取整" textSize="12sp" margin="0dp" />
                                <radio id="halfCeilingSetting_roundUp" text="向上取整" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                        <horizontal>
                            {/* 1~99%, 线性, 默认50% */}
                            <text text="自动调整: 禁用音轨阈值(越高->越简单):" />
                            <text text="default%" id="trackDisableThresholdValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="trackDisableThresholdSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal>
                            <button id="autoTuneButton" text="自动优化以下设置(重要!)" />
                        </horizontal>
                        <horizontal>
                            {/* -2~2 */}
                            <text text="升/降八度:" />
                            <text text="default" id="majorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="majorPitchOffsetSeekbar" w="*" max="4" layout_gravity="center" />
                        <horizontal>
                            {/* -4~7 */}
                            <text text="升/降半音(移调):" />
                            <text text="default" id="minorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="minorPitchOffsetSeekbar" w="*" max="11" layout_gravity="center" />
                        <horizontal>
                            <text text="音轨选择:" />
                            <button id="selectTracksButton" text="选择..." padding="0dp" />
                        </horizontal>
                    </vertical>
                </card>
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                    <vertical>
                        <horizontal w="*">
                            <text text="和弦优化:" textColor="red" />
                            <checkbox id="chordLimitCheckbox" />
                        </horizontal>
                        <horizontal w="*">
                            <text text="最多同时按键数量: " />
                            {/* 1-9个, 默认2 */}
                            <text text="default个" id="maxSimultaneousNoteCountValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="maxSimultaneousNoteCountSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal>
                            {/* 默认向下取整 */}
                            <text text="按键数量限制方法: " layout_gravity="center_vertical" />
                            <radiogroup id="noteCountLimitMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="noteCountLimitMode_delete" text="删除超出的" textSize="12sp" margin="0dp" />
                                <radio id="noteCountLimitMode_split" text="拆分成多组" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                        <horizontal w="*">
                            <text text="拆分成多组时组间间隔: " />
                            {/* 5-500ms, 对数, 默认75ms */}
                            <text text="defaultms" id="noteCountLimitSplitDelayValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="noteCountLimitSplitDelaySeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal w="*">
                            <text text="选择方式: " />
                            <radiogroup id="chordSelectMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="chordSelectMode_high" text="优先高音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_low" text="优先低音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_random" text="随机" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                    </vertical>
                </card>
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                    <vertical>
                        <text text="伪装手弹(全局):" textColor="red" />
                        <horizontal w="*">
                            {/* 5~150ms, 线性, 默认0->不使用*/}
                            <text text="音符时间偏差: " />
                            <checkbox id="noteTimeDeviationCheckbox" />
                            <text text="defaultms" id="noteTimeDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="noteTimeDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal w="*">
                            {/* 0~6mm, 线性, 默认1*/}
                            <text text="点击位置偏差: " />
                            <text text="defaultmm" id="clickPositionDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="clickPositionDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                    </vertical>
                </card>
            </vertical>
        </ScrollView>
    );
    //回调函数们
    view.limitClickSpeedSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMapLog(progress, 1, maxClickSpeedHz);
        view.limitClickSpeedValueText.setText(value.toFixed(2) + "次/秒");
        return true;
    });
    view.speedMultiplierSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMapLog(progress, 0.33, 3);
        view.speedMultiplierValueText.setText((value * 100).toFixed(2) + "%");
        return true;
    });
    view.defaultClickDurationSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMapLog(progress, 1, 500);
        view.defaultClickDurationValueText.setText(value.toFixed(2) + "ms");
        return true;
    });
    view.trackDisableThresholdSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMap(progress, 1, 99);
        view.trackDisableThresholdValueText.setText(value.toFixed(2) + "%");
        return true;
    });
    view.noteTimeDeviationSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMap(progress, 5, 150);
        view.noteTimeDeviationValueText.setText(value.toFixed(2) + "ms");
        return true;
    });
    view.clickPositionDeviationSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMap(progress, 0, 6);
        view.clickPositionDeviationValueText.setText(value.toFixed(2) + "mm");
        return true;
    });
    view.autoTuneButton.click(() => {
        let trackDisableThreshold = numberRevMap(view.trackDisableThresholdSeekbar.getProgress(), 1, 99) / 100;
        threads.start(function () { //TODO: 重构?
            autoTuneFileConfig(fileName, trackDisableThreshold);
            ui.run(() => {
                let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
                view.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
                view.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
                let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
                view.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionName(minorPitchOffset)})`);
                view.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);
            });
        });
    });
    view.majorPitchOffsetSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = progress - 2;
        view.majorPitchOffsetValueText.setText(value.toFixed(0));
        return true;
    });
    view.minorPitchOffsetSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = progress - 4;
        view.minorPitchOffsetValueText.setText(`${value.toFixed(0)} (${midiPitch.getTranspositionName(value)})`);
        return true;
    });
    view.selectTracksButton.click(() => {
        threads.start(function () {
            const passManager = new PassManager();
            let dialog = dialogs.build({
                title: "加载中...",
                content: "正在加载数据...",
            }).show();
            let tracksData = passManager.addPass("ParseSourceFilePass").run(musicDir + fileName);
            dialog.dismiss();
            let lastSelectedTracksNonEmpty = configuration.readFileConfigForTarget("lastSelectedTracksNonEmpty", rawFileName, gameProfile);
            let result = selectTracksInteractive(tracksData, lastSelectedTracksNonEmpty);
            configuration.setFileConfigForTarget("lastSelectedTracksNonEmpty", result, rawFileName, gameProfile);
        });
    });
    view.maxSimultaneousNoteCountSeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMap(progress, 1, 9);
        view.maxSimultaneousNoteCountValueText.setText(value.toFixed(0));
        return true;
    });
    view.noteCountLimitSplitDelaySeekbar.setOnSeekBarChangeListener((seekBar, progress, fromUser) => {
        if (progress == undefined) return;
        let value = numberRevMapLog(progress, 5, 500);
        view.noteCountLimitSplitDelayValueText.setText(value.toFixed(0) + "ms");
        return true;
    });
    let finished = false;
    dialogs.build({
        customView: view,
        title: "乐曲配置",
        positive: "确定",
        negative: "取消"
    }).on("show", (dialog) => {
        ///速度控制
        let limitClickSpeedHz = readFileConfig("limitClickSpeedHz", rawFileName, 0);
        let speedMultiplier = readFileConfig("speedMultiplier", rawFileName, 1);
        view.limitClickSpeedCheckbox.setChecked(limitClickSpeedHz != 0);
        view.limitClickSpeedValueText.setText(limitClickSpeedHz.toFixed(2) + "次/秒");
        view.limitClickSpeedSeekbar.setProgress(numberMapLog(limitClickSpeedHz, 1, maxClickSpeedHz));
        view.speedMultiplier.setChecked(speedMultiplier != 1);
        view.speedMultiplierValueText.setText((speedMultiplier * 100).toFixed(2) + "%");
        view.speedMultiplierSeekbar.setProgress(numberMapLog(speedMultiplier, 0.33, 3));
        //时长控制
        let defaultClickDuration = readGlobalConfig("defaultClickDuration", 5);
        view.defaultClickDurationValueText.setText(defaultClickDuration.toFixed(2) + "ms");
        view.defaultClickDurationSeekbar.setProgress(numberMapLog(defaultClickDuration, 1, 500));
        //音域优化
        let halfCeiling = readFileConfig("halfCeiling", rawFileName, false);
        switch (halfCeiling) {
            case false:
                view.halfCeilingSetting_roundDown.setChecked(true);
                break;
            case true:
                view.halfCeilingSetting_roundUp.setChecked(true);
                break;
        }
        let trackDisableThreshold = 0.5; //不会保存
        view.trackDisableThresholdValueText.setText((trackDisableThreshold * 100).toFixed(2) + "%");
        view.trackDisableThresholdSeekbar.setProgress(numberMap(trackDisableThreshold * 100, 1, 99));
        let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
        view.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
        view.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
        let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
        view.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionName(minorPitchOffset)})`);
        view.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);
        //和弦优化
        let chordLimitEnabled = readFileConfig("chordLimitEnabled", rawFileName, false);
        view.chordLimitCheckbox.setChecked(chordLimitEnabled);
        let maxSimultaneousNoteCount = readFileConfig("maxSimultaneousNoteCount", rawFileName, 2);
        view.maxSimultaneousNoteCountValueText.setText(maxSimultaneousNoteCount.toFixed(0));
        view.maxSimultaneousNoteCountSeekbar.setProgress(numberMap(maxSimultaneousNoteCount, 1, 9));
        let noteCountLimitMode = readFileConfig("noteCountLimitMode", rawFileName, "split");
        switch (noteCountLimitMode) {
            case "split":
                view.noteCountLimitMode_split.setChecked(true);
                break;
            case "delete":
                view.noteCountLimitMode_delete.setChecked(true);
                break;
        }
        let noteCountLimitSplitDelay = readFileConfig("noteCountLimitSplitDelay", rawFileName, 75);
        view.noteCountLimitSplitDelayValueText.setText(noteCountLimitSplitDelay.toFixed(0) + "ms");
        view.noteCountLimitSplitDelaySeekbar.setProgress(numberMapLog(noteCountLimitSplitDelay, 5, 500));
        let chordSelectMode = readFileConfig("chordSelectMode", rawFileName, "high");
        switch (chordSelectMode) {
            case "high":
                view.chordSelectMode_high.setChecked(true);
                break;
            case "low":
                view.chordSelectMode_low.setChecked(true);
                break;
                case "random":
                view.chordSelectMode_random.setChecked(true);
                break;
        }

        //伪装手弹
        let noteTimeDeviation = readGlobalConfig("humanifyNoteAbsTimeStdDev", 0);
        view.noteTimeDeviationValueText.setText(noteTimeDeviation.toFixed(2) + "ms");
        view.noteTimeDeviationCheckbox.setChecked(noteTimeDeviation != 0);
        view.noteTimeDeviationSeekbar.setProgress(numberMap(noteTimeDeviation, 5, 150));
        let clickPositionDeviation = readGlobalConfig("clickPositionDeviationMm", 1);
        view.clickPositionDeviationValueText.setText(clickPositionDeviation.toFixed(2) + "mm");
        view.clickPositionDeviationSeekbar.setProgress(numberMap(clickPositionDeviation, 0, 6));

    }).on("positive", (dialog) => {
        let limitClickSpeedHz = view.limitClickSpeedCheckbox.isChecked() ?
            numberRevMapLog(view.limitClickSpeedSeekbar.getProgress(), 1, maxClickSpeedHz) : 0;
        let speedMultiplier = view.speedMultiplier.isChecked() ?
            numberRevMapLog(view.speedMultiplierSeekbar.getProgress(), 0.33, 3) : 1;
        let defaultClickDuration = numberRevMapLog(view.defaultClickDurationSeekbar.getProgress(), 1, 500);
        let halfCeiling = view.halfCeilingSetting_roundUp.isChecked();
        let majorPitchOffset = view.majorPitchOffsetSeekbar.getProgress() - 2;
        let minorPitchOffset = view.minorPitchOffsetSeekbar.getProgress() - 4;
        let chordLimitEnabled = view.chordLimitCheckbox.isChecked();
        let maxSimultaneousNoteCount = numberRevMap(view.maxSimultaneousNoteCountSeekbar.getProgress(), 1, 9);
        let noteCountLimitMode = view.noteCountLimitMode_split.isChecked() ? "split" : "delete";
        let noteCountLimitSplitDelay = numberRevMapLog(view.noteCountLimitSplitDelaySeekbar.getProgress(), 5, 500);
        let chordSelectMode = view.chordSelectMode_high.isChecked() ? "high" : view.chordSelectMode_low.isChecked() ? "low" : "random";
        let noteTimeDeviation = view.noteTimeDeviationCheckbox.isChecked() ?
            numberRevMap(view.noteTimeDeviationSeekbar.getProgress(), 5, 150) : 0;
        let clickPositionDeviation = numberRevMap(view.clickPositionDeviationSeekbar.getProgress(), 0, 6);
        setFileConfig("limitClickSpeedHz", limitClickSpeedHz, rawFileName);
        setFileConfig("speedMultiplier", speedMultiplier, rawFileName);
        setFileConfig("halfCeiling", halfCeiling, rawFileName);
        configuration.setFileConfigForTarget("majorPitchOffset", majorPitchOffset, rawFileName, gameProfile);
        configuration.setFileConfigForTarget("minorPitchOffset", minorPitchOffset, rawFileName, gameProfile);
        setFileConfig("chordLimitEnabled", chordLimitEnabled, rawFileName);
        setFileConfig("maxSimultaneousNoteCount", maxSimultaneousNoteCount, rawFileName);
        setFileConfig("noteCountLimitMode", noteCountLimitMode, rawFileName);
        setFileConfig("noteCountLimitSplitDelay", noteCountLimitSplitDelay, rawFileName);
        setFileConfig("chordSelectMode", chordSelectMode, rawFileName);
        setGlobalConfig("defaultClickDuration", defaultClickDuration);
        setGlobalConfig("humanifyNoteAbsTimeStdDev", noteTimeDeviation);
        setGlobalConfig("clickPositionDeviationMm", clickPositionDeviation);
        
        dialog.dismiss();
        finished = true;
        configChanged = true;
    }).on("negative", (dialog) => {
        toast("取消")
        dialog.dismiss();
        finished = true;
    }).show();
    while (!finished) {
        sleep(100);
    }

    return configChanged;
}

/**
 * @brief 显示文件选择器
 * @param {Array<string>} fileNames 文件名列表
 * @param {(rawFileName:number)=>void} callback 回调函数，参数为选择的文件序号
 */
function runFileSelector(fileNames, callback) {
    const EditorInfo = android.view.inputmethod.EditorInfo;
    const selectorWindow = floaty.rawWindow(
        <frame id="board" w="*" h="*" gravity="center">
            <vertical w="{{ device.height / 2 }}px" height="{{ device.width - 160 }}px" bg="#ffffffff">
                <horizontal id="search" w="*" bg="#ffefefef">
                    {/* <text id="btnSearch" padding="15" textSize="15dp" textColor="#ff0f9086">搜索</text> */}
                    <input id="input" inputType="text" layout_weight="1" hint="输入关键词" textColorHint="#ffbbbbbb" imeOptions="actionDone" singleLine="true" focusable="true" focusableInTouchMode="true"></input>
                    <text id="btnClear" padding="15" textSize="15dp" textColor="#ff0f9086">清除</text>
                    <text id="btnClose" padding="15" textSize="15dp" textColor="#ff0f9086">关闭</text>
                </horizontal>
                <list id="list" w="*" divider="#ff0000ff" dividerHeight="1px">
                    <vertical w="*" h="wrap_content">
                        <text textSize="15dp" textColor="#ff888888" text="{{this.name}}" w="*" padding="5" />
                        <ImageView w="*" h="1dp" bg="#a0a0a0" />
                    </vertical>
                </list>
            </vertical>
        </frame>
    );
    ui.run(() => {
        selectorWindow.setSize(-1, -1);
        // selectorWindow.board.setVisibility(8);
        selectorWindow.setTouchable(true);
        selectorWindow.board.on('touch_down', () => {
            selectorWindow.input.clearFocus();
            selectorWindow.disableFocus();
            // selectorWindow.board.setVisibility(8);
            selectorWindow.setTouchable(true);
        });
        selectorWindow.input.setOnEditorActionListener(new android.widget.TextView.OnEditorActionListener((view, i, event) => {
            switch (i) {
                case EditorInfo.IME_ACTION_DONE:
                    let keyword = selectorWindow.input.getText().toString().trim();
                    selectorWindow.list.setDataSource(fileNames.filter(v => {
                        if (!keyword) {
                            return true;
                        }
                        return v.indexOf(keyword) > -1;
                    }).map(v => ({ name: v })));
                    selectorWindow.input.clearFocus();
                    selectorWindow.disableFocus();
                    return false;
                default:
                    return true;
            }
        }));
        selectorWindow.input.on("touch_down", () => {
            selectorWindow.requestFocus();
            selectorWindow.input.requestFocus();
        });
        // selectorWindow.btnSearch.click(function () {
        //     let keyword = selectorWindow.input.getText().toString().trim();
        //     selectorWindow.list.setDataSource(fileNames.filter(v => {
        //         if (!keyword) {
        //             return true;
        //         }
        //         return v.indexOf(keyword) > -1;
        //     }).map(v => ({ name: v })));
        //     selectorWindow.input.clearFocus();
        //     selectorWindow.disableFocus();
        // });
        selectorWindow.btnClear.click(function () {
            if (!selectorWindow.input.getText().toString()) { return; }
            selectorWindow.input.setText('');
            selectorWindow.list.setDataSource(fileNames.map(v => ({ name: v })));
        });
        selectorWindow.btnClose.click(function () {
            selectorWindow.close();
        });
        selectorWindow.list.on("item_click", function (item, index, itemView, listView) {
            const name = item.name;
            const absIndex = fileNames.indexOf(name);
            callback(absIndex);
            selectorWindow.close();
        });
        selectorWindow.list.setDataSource(fileNames.map(v => ({ name: v })));
    });
}

function runGlobalSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "选择游戏/乐器", "设置坐标", "乐谱可视化"])) {
        case -1:
            break;
        case 0:
            setGlobalConfig("skipInit", dialogs.select("是否跳过乐曲开始前的空白?", ["否", "是"]));
            setGlobalConfig("skipBlank5s", dialogs.select("是否跳过乐曲中间超过5秒的空白?", ["否", "是"]));
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
            } else {
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
            } else {
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
            runClickPosSetup();

            break;
        case 3: //乐谱可视化
            let visualizerEnabled = dialogs.confirm("乐谱可视化", "是否要开启乐谱可视化?");
            setGlobalConfig("visualizerEnabled", visualizerEnabled);
            break;
    };
};

function getTargetTriple() {
    let configName = gameProfile.getCurrentConfigDisplayName();
    let variantName = gameProfile.getCurrentVariantDisplayName();
    let keyTypeName = gameProfile.getCurrentKeyLayoutDisplayName();
    return configName + " " + variantName + " " + keyTypeName;
}


/////////
//主程序//
/////////
function initialize() {
    files.ensureDir(musicDir);
    //globalConfig.put("inited", 0);
    let currentRuntime = runtimes.getCurrentRuntime();
    switch (currentRuntime) {
        case runtimes.Runtime.AUTOJS6:
            console.info("当前运行环境: AutoJs6");
            break;
        case runtimes.Runtime.AUTOXJS:
            console.info("当前运行环境: AutoX.js");
            break;
        default:
            console.warn("当前运行环境: 不支持或未知!");
            break;
    }
    if (readGlobalConfig("lastVersion", 0) != scriptVersion) {
        //第一次启动，初始化设置
        toast("初始化设置..");

        if (readGlobalConfig("skipInit", -1) == -1) setGlobalConfig("skipInit", true);
        if (readGlobalConfig("skipBlank5s", -1) == -1) setGlobalConfig("skipBlank5s", false);
        if (readGlobalConfig("waitForGame", -1) == -1) setGlobalConfig("waitForGame", true);
        setGlobalConfig("userGameProfile", null);

        let files_ = files.listDir("./exampleTracks");
        for (let i in files_) {
            console.log("copy:" + files_[i]);
            files.copy("./exampleTracks/" + files_[i], musicDir + files_[i]);
        };
        setGlobalConfig("lastVersion", scriptVersion);
    };
}

function main() {
    let evt = events.emitter(threads.currentThread());

    const totalFiles = getFileList();
    const haveFloatyPermission = runtimes.getCurrentRuntime() === runtimes.Runtime.AUTOXJS ?
        floaty.checkPermission() :
        floaty.hasPermission();
    if (!haveFloatyPermission) {
        // 没有悬浮窗权限，提示用户并跳转请求
        toastLog(`请打开应用 "${appName}" 的悬浮窗权限!`);
        floaty.requestPermission();
        while (!floaty.checkPermission());
        toastLog('悬浮窗权限已开启');
    }

    let titleStr = "当前配置: " + getTargetTriple();
    console.info(titleStr);
    let musicFileData = null;
    let lastSelectedFileIndex = null;
    let progress = 0;
    let progressChanged = false;
    let totalTimeSec = null;
    let totalTimeStr = null;
    let currentGestureIndex = null;
    let visualizerWindow = null;

    const player = new Players.AutoJsGesturePlayer();

    //显示悬浮窗
    let controlWindow = floaty.window(
        <frame gravity="left|top" w="*" h="auto" margin="0dp">
            <vertical bg="#8fffffff" w="*" h="auto" margin="0dp">
                <horizontal w="*" h="auto" margin="0dp">
                    <text id="musicTitleText" bg="#9ff0f0f4" text="(未选择乐曲...)" ellipsize="marquee" singleLine="true" layout_gravity="left" textSize="14sp" margin="0 0 3 0" layout_weight="1" />
                    <text id="timerText" bg="#9ffce38a" text="00:00/00:00" layout_gravity="right" textSize="14sp" margin="3 0 3 0" layout_weight="0" layout_width="78sp" layout_height="match_parent" />
                    <button id="stopBtn" style="Widget.AppCompat.Button.Borderless" w="20dp" layout_height='20dp' text="❌" textSize="14sp" margin="0dp" padding="0dp" />
                </horizontal>
                <horizontal w="*" h="auto" margin="0dp">
                    <seekbar id="progressBar" layout_gravity="center_vertical" layout_weight="1" w='0dp' h='auto' margin="3dp 0dp" padding="5dp" />
                </horizontal>
                <horizontal bg="#fce38a" w="*" h="auto" margin="0dp" gravity="center">
                    <button id="fileSelectionMenuBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="📁" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="currentFileConfigBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="🎹" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="prevBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="⏮" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="▶️" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="nextBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="⏭" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="globalConfigBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="⚙" textSize="20sp" margin="0dp" padding="0dp" />
                    <button id="miscInfoBtn" style="Widget.AppCompat.Button.Borderless" w="30dp" h='30dp' text="📶" textSize="20sp" margin="0dp" padding="0dp" />
                </horizontal>
            </vertical>
        </frame>
    );
    ui.run(() => {
        controlWindow.musicTitleText.setText(titleStr);
        controlWindow.musicTitleText.setSelected(true);
    });

    controlWindow.fileSelectionMenuBtn.click(() => {
        evt.emit("fileSelectionMenuBtnClick");
    });
    controlWindow.currentFileConfigBtn.click(() => {
        evt.emit("currentFileConfigBtnClick");
    });
    controlWindow.prevBtn.click(() => {
        if (lastSelectedFileIndex == null) return;
        if (lastSelectedFileIndex > 0) lastSelectedFileIndex--;
        evt.emit("fileSelect");
    });
    controlWindow.nextBtn.click(() => {
        if (lastSelectedFileIndex == null) return;
        if (lastSelectedFileIndex < totalFiles.length - 1) lastSelectedFileIndex++;
        evt.emit("fileSelect");
    });

    controlWindow.pauseResumeBtn.click(() => {
        evt.emit("pauseResumeBtnClick");
    });

    controlWindow.progressBar.setOnSeekBarChangeListener({
        onProgressChanged: function (seekBar, progress0, fromUser) {
            if (fromUser) {
                progress = progress0;
                progressChanged = true;
            };
        }
    });
    controlWindow.globalConfigBtn.click(() => { evt.emit("globalConfigBtnClick"); });
    controlWindow.stopBtn.click(() => {
        evt.emit("stopBtnClick");
    });
    controlWindow.miscInfoBtn.click(() => { evt.emit("miscInfoBtnClick"); });
    controlWindow.pauseResumeBtn.setOnLongClickListener(() => {
        evt.emit("pauseResumeBtnLongClick");
        return true;
    });

    player.setOnStateChange(function (newState) {
        if (newState == player.PlayerStates.PAUSED ||
            newState == player.PlayerStates.FINISHED) {
            controlWindow.pauseResumeBtn.setText("▶️");
        } else if (newState == player.PlayerStates.PLAYING) {
            controlWindow.pauseResumeBtn.setText("⏸");
        }
    });

    //
    toast("点击时间可调整悬浮窗位置");

    //悬浮窗位置/大小调节
    let controlWindowPosition = readGlobalConfig("controlWindowPosition", [device.height / 3, 0]);
    //避免悬浮窗被屏幕边框挡住
    controlWindow.setPosition(controlWindowPosition[0], controlWindowPosition[1]);
    let controlWindowSize = readGlobalConfig("controlWindowSize", [device.height / 4, -2]);
    controlWindow.setSize(controlWindowSize[0], controlWindowSize[1]);
    //controlWindow.setTouchable(true);

    let controlWindowLastClickTime = 0;
    //悬浮窗事件
    controlWindow.timerText.on("click", () => {
        let now = new Date().getTime();
        if (now - controlWindowLastClickTime < 500) {
            toast("重置悬浮窗大小与位置");
            controlWindow.setSize(device.height / 2, -2);
            controlWindow.setPosition(device.height / 3, 40);
        }
        controlWindowLastClickTime = now;

        let adjEnabled = controlWindow.isAdjustEnabled();
        controlWindow.setAdjustEnabled(!adjEnabled);

        //记忆位置
        if (adjEnabled) {
            controlWindow.setSize(controlWindow.getWidth(), controlWindow.getHeight());
            setGlobalConfig("controlWindowPosition", [controlWindow.getX(), controlWindow.getY()]);
            setGlobalConfig("controlWindowSize", [controlWindow.getWidth(), -2]);
        }
    });

    let visualizerWindowRequestClose = false;

    //可视化悬浮窗口
    const createVisualizerWindow = function () {
        let visualizerWindow = floaty.window(
            <canvas id="canv" w="*" h="*" />
        );
        let visualizerWindowPosition = readGlobalConfig("visualizerWindowPosition", [100, 100]);
        visualizerWindow.setPosition(visualizerWindowPosition[0], visualizerWindowPosition[1]);
        let visualizerWindowSize = readGlobalConfig("visualizerWindowSize", [device.width / 2, device.height / 2]);
        visualizerWindow.setSize(visualizerWindowSize[0], visualizerWindowSize[1]);
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
        return visualizerWindow;
    }

    function visualizerWindowClose() {
        if (visualizerWindow == null) return;
        visualizerWindowRequestClose = true;
        sleep(200);
        visualizerWindow.close();
        visualizerWindowRequestClose = false;
    }

    function exitApp() {
        visualizerWindowClose();
        threads.shutDownAll();
        exit();
    }

    player.setOnPlayNote(function (note) {
        currentGestureIndex = note;
        visualizer.goto(Math.max(0, note - 1));
    });

    //主函数, 处理事件和进度更新
    evt.on("pauseResumeBtnClick", () => {
        if (player.getState() == player.PlayerStates.PAUSED) {
            if(!checkEnableAccessbility()) return;
            player.resume();
        } else if (player.getState() == player.PlayerStates.PLAYING) {
            player.pause();
        } else if (player.getState() == player.PlayerStates.FINISHED) {
            if(!checkEnableAccessbility()) return;
            player.seekTo(0);
            player.resume();
        }
    });

    evt.on("fileSelect", () => {
        player.stop();
        if (visualizerWindow != null) {
            visualizerWindowClose();
            visualizerWindow = null;
        }
        let fileName = totalFiles[lastSelectedFileIndex];
        gameProfile.clearCurrentConfigCache();
        let data = loadMusicFile(fileName, ScoreExportType.none);
        if (data == null) {
            return;
        }
        totalTimeSec = data[data.length - 1][1];
        totalTimeStr = sec2timeStr(totalTimeSec);
        musicFileData = data;
        progress = 0;
        progressChanged = true;
        currentGestureIndex = null;
        evt.emit("fileLoaded");
    });
    evt.on("currentFileConfigBtnClick", () => {
        if (lastSelectedFileIndex == null) return;
        player.pause();
        let fileName = totalFiles[lastSelectedFileIndex];
        let res = runFileConfigSetup(fileName);
        if (res) { //设置改变了
            evt.emit("fileSelect");
        }
    });
    evt.on("globalConfigBtnClick", () => {
        player.pause();
        runGlobalSetup();
        titleStr = "当前配置: " + getTargetTriple();
        ui.run(() => {
            controlWindow.musicTitleText.setText(titleStr);
        });
    });
    evt.on("fileSelectionMenuBtnClick", () => {
        const rawFileNameList = totalFiles.map((item) => {
            return musicFormats.getFileNameWithoutExtension(item);
        });
        runFileSelector(rawFileNameList, (fileIndex) => {
            lastSelectedFileIndex = fileIndex;
            evt.emit("fileSelect");
        });
    });
    evt.on("miscInfoBtnClick", () => {
        player.pause();
        let option = dialogs.select(
            "其它功能...",
            [
                "📃 查看使用帮助",
                "📲 MIDI串流",
                "🎼 导出当前乐曲",
            ]
        );
        switch (option) {
            case -1: break; //取消
            case 0: //查看使用帮助
                app.viewFile(musicDir + "使用帮助.pdf");
                exitApp();
                break;
            case 1: //MIDI串流
                controlWindow.close();
                visualizerWindowClose();
                startMidiStream();
                //exitApp();
                break;
            case 2: //导出当前乐曲
                if (lastSelectedFileIndex == null) break;
                let fileName = totalFiles[lastSelectedFileIndex];
                gameProfile.clearCurrentConfigCache();
                let sel = dialogs.select("导出当前乐曲...", ["导出为txt键盘谱","导出为JSON按键序列数据"]);
                let exportType = ScoreExportType.none;
                switch(sel){
                    case -1: break;
                    case 0: exportType = ScoreExportType.keyboardScore; break;
                    case 1: exportType = ScoreExportType.keySequenceJSON; break;
                }
                let data = loadMusicFile(fileName, exportType);
                if (data == null) {
                    break;
                }
                exportNoteDataInteractive(data, exportType);
        }
    });
    evt.on("pauseResumeBtnLongClick", () => {
        //隐藏悬浮窗播放
        toast("8秒后播放...");
        visualizerWindowClose();
        controlWindow.close();
        controlWindow = null;
        player.setOnStateChange(function (newState) {
            if (newState == player.PlayerStates.FINISHED) {
                exitApp();
            }
            console.warn("Unexpected state:" + newState);
        });
        setTimeout(() => {
            player.resume();
        }, 8000);
    });
    evt.on("stopBtnClick", () => {
        exitApp();
    });
    evt.on("fileLoaded", () => {
        ui.run(() => {
            controlWindow.musicTitleText.setText(
                musicFormats.getFileNameWithoutExtension(totalFiles[lastSelectedFileIndex]));
        });
        player.setGestureTimeList(musicFileData);
        //设置点击位置偏移
        const clickPositionDeviationMm = readGlobalConfig("clickPositionDeviationMm", 1); 
        const displayMetrics = context.getResources().getDisplayMetrics();
        const TypedValue = android.util.TypedValue;
        const clickPositionDeviationPx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_MM, clickPositionDeviationMm, displayMetrics);
        console.verbose(`点击位置偏移: ${clickPositionDeviationPx} px`);
        player.setClickPositionDeviationPx(clickPositionDeviationPx);
        //是否显示可视化窗口
        let visualizerEnabled = readGlobalConfig("visualizerEnabled", false);
        if (visualizerEnabled && gameProfile.getKeyLayout().type === "grid") { //TODO: 其它类型的键位布局也可以显示可视化窗口
            visualizerWindow = createVisualizerWindow();
            toast("单击可视化窗口调整大小与位置, 双击重置");
        };
        player.start();
        player.pause();
    });

    function controlWindowUpdateLoop() {
        if (musicFileData == null || totalTimeSec == null || currentGestureIndex == null || controlWindow == null) {
            return;
        }
        //如果进度条被拖动，更新播放进度
        if (progressChanged) {
            progressChanged = false;
            let targetTimeSec = totalTimeSec * progress / 100;
            for (let j = 0; j < musicFileData.length; j++) {
                if (musicFileData[j][1] > targetTimeSec) {
                    currentGestureIndex = j - 1;
                    break;
                }
            }
            currentGestureIndex = Math.max(0, currentGestureIndex);
            player.seekTo(currentGestureIndex);
            console.log("seekTo:" + currentGestureIndex);
            setImmediate(controlWindowUpdateLoop);
        }
        currentGestureIndex = Math.min(currentGestureIndex, musicFileData.length - 1);
        //计算时间
        let curTimeSec = musicFileData[currentGestureIndex][1];
        let curTimeStr = sec2timeStr(curTimeSec);
        let timeStr = curTimeStr + "/" + totalTimeStr;
        //更新窗口
        ui.run(() => {
            controlWindow.progressBar.setProgress(curTimeSec / totalTimeSec * 100);
            controlWindow.timerText.setText(timeStr);
        });
    }

    setInterval(controlWindowUpdateLoop, 200);
}


/**
 * @brief 解析并加载乐曲文件, 使用文件设置
 * @param {string} fileName
 * @param {ScoreExportType} exportScore
 */
function loadMusicFile(fileName, exportScore) {
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
        return;
    }).show();

    let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
    let startTime = new Date().getTime();

    //////////////加载配置
    if (!gameProfile.checkKeyPosition()) {
        dialogs.alert("错误", "坐标未设置，请先设置坐标");
        progressDialog.dismiss();
        runClickPosSetup();
        return null;
    };

    //如果是第一次运行，显示设置向导
    if (!haveFileConfig(rawFileName)) {
        let res = dialogs.confirm("设置向导", "检测到您是第一次演奏这首乐曲，是否要运行设置?");
        if (res) {
            progressDialog.dismiss();
            runFileConfigSetup(fileName);
        };
    };


    let humanifyNoteAbsTimeStdDev = readGlobalConfig("humanifyNoteAbsTimeStdDev", 0)
    let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
    let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
    let treatHalfAsCeiling = readFileConfig("halfCeiling", rawFileName, false);
    let limitClickSpeedHz = readFileConfig("limitClickSpeedHz", rawFileName, 0);
    let speedMultiplier = readFileConfig("speedMultiplier", rawFileName, 1);
    let defaultClickDuration = readGlobalConfig("defaultClickDuration", 5);
    let chordLimitEnabled = readFileConfig("chordLimitEnabled", rawFileName, false);
    let maxSimultaneousNoteCount = readFileConfig("maxSimultaneousNoteCount", rawFileName, 2);
    let noteCountLimitMode = readFileConfig("noteCountLimitMode", rawFileName, "split");
    let noteCountLimitSplitDelay = readFileConfig("noteCountLimitSplitDelay", rawFileName, 75);
    let chordSelectMode = readFileConfig("chordSelectMode", rawFileName, "high");
    let mergeThreshold = (exportScore == ScoreExportType.keyboardScore ? scoreExportMergeThreshold : autoPlayMergeThreshold);
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
        tracksData = removeEmptyTracks(tracksData);
        let nonEmptyTrackCount = tracksData.tracks.length;

        //上次选择的音轨(包括空音轨)
        let lastSelectedTracksNonEmpty = configuration.readFileConfigForTarget("lastSelectedTracksNonEmpty", rawFileName, gameProfile);
        if (typeof (lastSelectedTracksNonEmpty) == "undefined" || lastSelectedTracksNonEmpty.length == 0) {
            console.log("音轨选择未设置，使用默认值");
            lastSelectedTracksNonEmpty = [];
            for (let i = 0; i < nonEmptyTrackCount; i++) {
                lastSelectedTracksNonEmpty.push(i); //默认选择所有音轨
            }
            configuration.setFileConfigForTarget("lastSelectedTracksNonEmpty", lastSelectedTracksNonEmpty, rawFileName, gameProfile);
        }
        let selectedTracksNonEmpty = lastSelectedTracksNonEmpty;
        console.log("选择的音轨:" + JSON.stringify(selectedTracksNonEmpty));
        //合并
        for (let i = 0; i < selectedTracksNonEmpty.length; i++) {
            if(selectedTracksNonEmpty[i] >= nonEmptyTrackCount) continue; 
            let track = tracksData.tracks[selectedTracksNonEmpty[i]];
            //通道10(打击乐) 永远不会被合并
            if (track.channel === 9) continue;
            noteData = noteData.concat(track.notes);
        }
        //按时间排序
        noteData.sort(function (a, b) {
            return a[1] - b[1];
        });

    } else {
        noteData = tracksData.tracks[0].notes;
    }

    //一些统计信息
    let finalNoteCnt = 0, inputNoteCnt = 0, overFlowedNoteCnt = 0, underFlowedNoteCnt = 0, roundedNoteCnt = 0, droppedNoteCnt = 0;
    inputNoteCnt = noteData.length;

    progressDialog.setContent("正在伪装手弹...");
    //伪装手弹
    if (humanifyNoteAbsTimeStdDev > 0) {
        passManager.addPass("HumanifyPass", {
            noteAbsTimeStdDev: humanifyNoteAbsTimeStdDev
        }, null, () => {
            progressDialog.setContent("正在生成按键...");
        });
    }
    //生成按键
    passManager.addPass("NoteToKeyPass", {
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
    });
    //单个按键频率限制
    passManager.addPass("SingleKeyFrequencyLimitPass", {
        minInterval: gameProfile.getSameKeyMinInterval()
    }, null, (data, statistics, elapsedTime) => {
        console.log("单键频率限制耗时" + elapsedTime / 1000 + "秒");
        finalNoteCnt = data.length;
        droppedNoteCnt = statistics.droppedNoteCnt;
        progressDialog.setContent("正在合并按键...");
    });
    //跳过前奏
    if (readGlobalConfig("skipInit", true)) {
        passManager.addPass("SkipIntroPass");
    }
    //跳过中间的空白
    if (readGlobalConfig("skipBlank5s", true)) {
        passManager.addPass("LimitBlankDurationPass"); //默认5秒
    }
    //变速
    if (speedMultiplier != 1) {
        passManager.addPass("SpeedChangePass", {
            speed: speedMultiplier
        });
    }
    //合并按键
    passManager.addPass("MergeKeyPass", {
        maxInterval: mergeThreshold * 1000,
    }, null, (data, statistics, elapsedTime) => {
        console.log("合并按键耗时" + elapsedTime / 1000 + "秒");
        if (!chordLimitEnabled) {
            visualizer.setKeyLayout(gameProfile.getKeyLayout().row, gameProfile.getKeyLayout().column);
            visualizer.loadNoteData(data);
            visualizer.goto(-1);
        }
        progressDialog.setContent("正在生成手势...");
    });
    //限制按键频率
    if (limitClickSpeedHz != 0) {
        passManager.addPass("NoteFrequencySoftLimitPass", {
            minInterval: 1000 / limitClickSpeedHz
        });
    }
    //限制同时按键个数
    if (chordLimitEnabled) {
        passManager.addPass("ChordNoteCountLimitPass", {
            maxNoteCount: maxSimultaneousNoteCount,
            limitMode: noteCountLimitMode,
            splitDelay: noteCountLimitSplitDelay,
            selectMode: chordSelectMode,
        }, null, (data, statistics, elapsedTime) => {
            console.log("限制同时按键个数: 耗时" + elapsedTime / 1000 + "秒");
            visualizer.setKeyLayout(gameProfile.getKeyLayout().row, gameProfile.getKeyLayout().column);
            visualizer.loadNoteData(data);
            visualizer.goto(-1);
            progressDialog.setContent("正在生成手势...");
        });
    }
    if (exportScore != ScoreExportType.none) {
        //如果是导出乐谱,则不需要生成手势
        let data = passManager.run(noteData);
        progressDialog.dismiss();
        return data;
    }
    //生成手势
    passManager.addPass("KeyToGesturePass", {
        currentGameProfile: gameProfile,
        pressDuration: defaultClickDuration,
    }, null, (data, statistics, elapsedTime) => {
        console.log("生成手势耗时" + elapsedTime / 1000 + "秒");
        progressDialog.dismiss();
    });

    let gestureTimeList = passManager.run(noteData);

    //数据汇总
    let outRangedNoteCnt = overFlowedNoteCnt + underFlowedNoteCnt;

    const statString = "音符总数:" + inputNoteCnt + " -> " + finalNoteCnt +
        "\n超出范围被丢弃的音符数:" + outRangedNoteCnt + "" + " (+" + overFlowedNoteCnt + ", -" + underFlowedNoteCnt + ")(" + (outRangedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
        "\n被取整的音符数:" + roundedNoteCnt + " (" + (roundedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
        "\n过于密集被丢弃的音符数:" + droppedNoteCnt + " (" + (droppedNoteCnt / finalNoteCnt * 100).toFixed(2) + "%)" +
        "\n如果被取整的音符数过多, 请在菜单中选择自动调整";
    dialogs.alert("乐曲信息", statString);

    return gestureTimeList;
}

function start() {
    //获取真实的应用名称
    const packageManager = context.getPackageManager();
    appName = packageManager.getApplicationLabel(context.getApplicationInfo()).toString();
    initialize();
    loadConfiguration();
    main();
    console.info("启动完成");
}

start();