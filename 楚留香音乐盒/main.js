//@ts-check

try {
    //Rhino的const是全局作用域, 会报错!
    var { requireShared } = require("./src/requireShared.js");
    /**
     * @type {import("../shared/runtimes.js")}
     */
    var runtimes = requireShared("runtimes.js");
    /**
     * @type {import("../shared/getPosInteractive.js")}
     */
    var getPosInteractive = requireShared("getPosInteractive.js");
    var MusicFormats = require("./src/musicFormats.js");
    var MidiDeviceManager = require("./src/midiDeviceManager.js");
    var GameProfile = require("./src/gameProfile.js");
    var Visualizer = require("./src/visualizer.js");
    var FileChooser = require("./src/fileChooser.js");
    var { PlayerType, AutoJsGesturePlayer, SimpleInstructPlayer } = require("./src/players.js");
    var configuration = require("./src/configuration.js");
    var PassManager = require("./src/passManager.js");
    var midiPitch = require("./src/midiPitch.js");
    var noteUtils = require("./src/noteUtils.js");
    var { ConfigurationUi, ConfigurationFlags } = require("./src/ui/config_ui.js");
    /**
     * @type {import("../shared/FloatButton/FloatButton.js")}
     */
    var FloatButton = requireShared("FloatButton/FloatButton.js");
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
 * @enum {string}
 */
const ScriptOperationMode = {
    NotRunning: "NotRunning",
    FilePlayer: "FilePlayer",
    MIDIInputStreaming: "MIDIInputStreaming",
};

/**
 * @enum {string}
 */
const MusicLoaderDataType = {
    GestureSequence: "GestureSequence",
    KeySequence: "KeySequence",
    KeySequenceHumanFriendly: "KeySequenceHumanFriendly",
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
        } else {
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


function getFileList() {
    return files.listDir(musicDir, function (name) {
        return files.isFile(files.join(musicDir, name)) && musicFormats.isMusicFile(name);
    });
}

/**
 * 启动midi串流
 * @returns {{
 *  onDataReceived: (callback: (data: Array<Uint8Array>) => void) => void,
 *  close: () => void,
 * } | null}
 */
function setupMidiStream() {
    const midiEvt = events.emitter(threads.currentThread());
    /** @type {MidiDeviceManager} */
    //@ts-ignore
    let midi = null;
    const midiThread = threads.start(function () {
        setInterval(function () {}, 1000);
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
                return null;
            }
        } else {
            break;
        }
    }
    let deviceIndex = dialogs.select("选择MIDI设备", devNames);
    if (deviceIndex == -1) {
        toast("您取消了选择");
        return null;
    }
    let portNames = midi.getMidiPortNames(deviceIndex);
    if (portNames.length == 0) {
        dialogs.alert("错误", "此MIDI设备没有可用的端口");
        return null;
    }
    let portIndex = 0;
    if (portNames.length > 1) {  // 不太可能出现
        portIndex = /** @type {Number} */ (dialogs.select("选择MIDI端口", portNames));
        if (portIndex == -1) {
            toast("您取消了选择");
            return null;
        }
    }
    midiThread.setImmediate(() => {
        midi.openDevicePort(deviceIndex, portIndex);
        midi.setDataReceivedCallback(() => {
            midiEvt.emit("dataReceived");
        });
    });

    let _onDataReceived = (data) => { };

    midiEvt.on("dataReceived", () => {
        let keyList = [];
        if (!midi.dataAvailable()) {
            return;
        }
        while (midi.dataAvailable()) {
            _onDataReceived(midi.readAll());
        }
    });

    return {
        onDataReceived: (callback) => {
            _onDataReceived = callback;
        },
        close: () => {
            midi.close();
            midiThread.interrupt();
        }
    }
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
    if (auto.service == null) {
        toastLog(`请打开应用 "${appName}" 的无障碍权限!`);
        auto.waitFor();
        toastLog(`无障碍权限已开启!, 请回到游戏重新点击播放`);
        return false;
    }
    console.verbose("无障碍服务已启动");
    return true;
}

/**
 * @param {noteUtils.PackedNoteLike[]} noteData 音符数据
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
                confirmed = /** @type {Boolean} */ (dialogs.confirm("", "乐谱将分为" + segmentCnt.toString() + "个小段,是否满意?"));
            }

            let toneStr = null;
            switch (dialogs.select("选择导出格式", ["楚留香(键盘)", "原神(键盘)", "_简谱_"])) {
                case 0:
                    if (gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7") {
                        dialogs.alert("错误", "当前选择的游戏键位和导出格式不匹配, 请选择3x7键位");
                        return;
                    }
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 1:
                    if (gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7") {
                        dialogs.alert("错误", "当前选择的游戏键位和导出格式不匹配, 请选择3x7键位");
                        return;
                    }
                    toneStr = "ZXCVBNMASDFGHJQWERTYU";
                    break;
                case 2:
                    if (gameProfile.getCurrentKeyLayoutTypeName() !== "generic_3x7") {
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

    if (typeof (lastSelectedTracksNonEmpty) == "undefined" || lastSelectedTracksNonEmpty.length === 0) {
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
    let selectedTracksNonEmpty = /** @type {Number[]} */ (dialogs.multiChoice("选择音轨", trackInfoStrs, lastSelectedTracksNonEmpty));
    if (selectedTracksNonEmpty.length == 0) { //取消选择, 保持原样
        selectedTracksNonEmpty = lastSelectedTracksNonEmpty;
    }
    return selectedTracksNonEmpty;
}

/**
 * @param {noteUtils.Note[]} noteData
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
function autoTuneFileConfig(fileName, trackDisableThreshold) {
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
 * @param {string} fullFileName
 * @param {(isAnythingChanged:boolean)=>void} onFinish
 */
function runFileConfigSetup(fullFileName, onFinish) {
    let fileName = fullFileName;
    let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
    let format = musicFormats.getFileFormat(fileName);
    /**
     * @type {Dialogs.JsDialog?}
     */
    let dialog = null;
    let flags = [];
    if (format.haveDurationInfo) {
        flags.push(ConfigurationFlags.MUSIC_HAS_DURATION_INFO);
    }
    if (format.haveTracks) {
        flags.push(ConfigurationFlags.MUSIC_HAS_TRACKS);
    }

    function showConfigDialog() {
        function refreshConfigUi() {
            if (dialog != null) {
                dialog.dismiss();
                dialog = null;
            }
            showConfigDialog();
        }
        let configUi = new ConfigurationUi(rawFileName, gameProfile, flags, (cmd, arg) => {
            console.info(`${cmd} : ${JSON.stringify(arg)}`);
            switch (cmd) {
                case "refreshConfigurationUi":
                    refreshConfigUi();
                    break;
                case "runAutoTune":
                    autoTuneFileConfig(fileName, arg.trackDisableThreshold);
                    refreshConfigUi();
                    break;
                case "selectTracks":
                    //这是主线程, 可以阻塞
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
                    break;
            }
        });
        let view = configUi.getView();
        dialog = dialogs.build({
            customView: view,
            title: "配置...",
            neutral: "完成",
        }).on("show", (dialog) => {
        }).on("neutral", (dialog) => {
            dialog.dismiss();
            onFinish(configUi.isAnythingChanged());
        }).show();
    }
    showConfigDialog();

    return;
}

/**
 * @brief 显示文件选择器
 * @param {Array<string>} fileNames 文件名列表
 * @param {(rawFileName:number)=>void} callback 回调函数，参数为选择的文件序号
 */
function runFileSelector(fileNames, callback) {
    const EditorInfo = android.view.inputmethod.EditorInfo;
    /**
     * @type {any}
     */
    const selectorWindow = floaty.rawWindow(
        <frame id="board" w="*" h="*" gravity="center">
            <vertical w="{{ device.width / 2 }}px" height="{{ device.height - 160 }}px" bg="#ffffffff">
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
            let sel = /** @type {Number} */ (dialogs.select("选择目标游戏...", configList));
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
            if (instrumentList == null || instrumentList.length == 0) {
                throw new Error("当前游戏没有可用的乐器!");
            } else if (instrumentList.length == 1) {
                gameProfile.setCurrentVariantDefault();
                setGlobalConfig("lastVariantName", gameProfile.getCurrentVariantTypeName());
            } else {
                let nameList = instrumentList.map((variant) => variant.variantName);
                let sel = /** @type {Number} */ (dialogs.select("选择目标乐器...", nameList));
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
            if (keyLayoutList == null || keyLayoutList.length == 0) {
                throw new Error("当前游戏没有可用的键位!");
            } else if (keyLayoutList.length == 1) {
                gameProfile.setCurrentKeyLayoutDefault();
                setGlobalConfig("lastKeyTypeName", gameProfile.getCurrentKeyLayoutTypeName());
            } else {
                let allKeyLayoutList = gameProfile.getAllKeyLayouts();
                let nameList = keyLayoutList.map((keyLayout) => allKeyLayoutList[keyLayout].displayName);
                let sel = /** @type {Number} */ (dialogs.select("选择目标键位...", nameList));
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
    let operationMode = ScriptOperationMode.NotRunning;
    let midiInputStreamingNoteCount = 0;
    let selectedPlayerTypes = [PlayerType.SimpleInstructPlayer];
    /**
     * @type {Array<import("./src/players").PlayerBase>}
     */
    let selectedPlayers = [new AutoJsGesturePlayer()];
    let instructWindow = null;

    //显示悬浮窗
    /**
     * @type {any}
     */
    let controlWindow = floaty.window(
        <frame gravity="left|top" w="*" h="auto" margin="0dp" id="controlWindowFrame" visibility="gone">
            <vertical bg="#8fffffff" w="*" h="auto" margin="0dp">
                <horizontal w="*" h="auto" margin="0dp">
                    <text id="musicTitleText" bg="#9ff0f0f4" text="(未选择乐曲...)" ellipsize="marquee" singleLine="true" layout_gravity="left" textSize="14sp" margin="0 0 3 0" layout_weight="1" />
                    <text id="timerText" bg="#9ffce38a" text="00:00/00:00" layout_gravity="right" textSize="14sp" margin="3 0 3 0" layout_weight="0" layout_width="78sp" layout_height="match_parent" />
                    <button id="hideBtn" style="Widget.AppCompat.Button.Borderless" w="20dp" layout_height='20dp' text="➖" textSize="14sp" margin="0dp" padding="0dp" />
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
    let controlWindowVisible = false;
    /**
     * @param {boolean} visible
     */
    function controlWindowSetVisibility(visible) {
        ui.run(() => {
            if (visible) {
                controlWindow.controlWindowFrame.setVisibility(android.view.View.VISIBLE);
            } else {
                controlWindow.controlWindowFrame.setVisibility(android.view.View.GONE);
            }
        });
    }

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
    controlWindow.hideBtn.click(() => {
        evt.emit("hideBtnClick");
    });
    controlWindow.miscInfoBtn.click(() => { evt.emit("miscInfoBtnClick"); });
    controlWindow.pauseResumeBtn.setOnLongClickListener(() => {
        evt.emit("pauseResumeBtnLongClick");
        return true;
    });

    toast("点击时间可调整悬浮窗位置");

    //悬浮窗位置/大小调节
    let controlWindowPosition = readGlobalConfig("controlWindowPosition", [device.width / 3, 0]);
    //避免悬浮窗被屏幕边框挡住
    controlWindow.setPosition(controlWindowPosition[0], controlWindowPosition[1]);
    let controlWindowSize = readGlobalConfig("controlWindowSize", [Math.max(device.width, device.height) * 2 / 5, -2]);
    controlWindow.setSize(controlWindowSize[0], controlWindowSize[1]);
    //controlWindow.setTouchable(true);

    let controlWindowLastClickTime = 0;
    //悬浮窗事件
    controlWindow.timerText.on("click", () => {
        let now = new Date().getTime();
        if (now - controlWindowLastClickTime < 500) {
            toast("重置悬浮窗大小与位置");
            controlWindow.setSize(device.width / 2, -2);
            controlWindow.setPosition(device.width / 3, 40);
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
                visualizerWindow.setSize(device.width * 2 / 3, device.height * 2 / 3);
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
        if(instructWindow != null) instructWindow.close();
        controlWindow.close();
        threads.shutDownAll();
        exit();
    }

    //主函数, 处理事件和进度更新
    evt.on("pauseResumeBtnClick", () => {
        for (let player of selectedPlayers) {
            if (player.getState() == player.PlayerStates.PAUSED) {
                if (player.getType() === PlayerType.AutoJsGesturePlayer && !checkEnableAccessbility()) return;
                player.resume();
            } else if (player.getState() == player.PlayerStates.PLAYING) {
                player.pause();
            } else if (player.getState() == player.PlayerStates.FINISHED) {
                if (player.getType() === PlayerType.AutoJsGesturePlayer && !checkEnableAccessbility()) return;
                player.seekTo(0);
                player.resume();
            }
        }
    });

    evt.on("fileSelect", () => {
        for (let player of selectedPlayers) {
            player.stop();
        }
        if (visualizerWindow != null) {
            visualizerWindowClose();
            visualizerWindow = null;
        }
        let fileName = totalFiles[lastSelectedFileIndex];
        gameProfile.clearCurrentConfigCache();
        let data = null;
        try {
            //选择播放器
            selectedPlayerTypes = readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
            
            switch (selectedPlayerTypes[0]) { //FIXME: 目前只支持单一播放器
                case PlayerType.AutoJsGesturePlayer:
                    data = loadMusicFile(fileName, MusicLoaderDataType.GestureSequence);
                    break;
                case PlayerType.SimpleInstructPlayer:
                    data = loadMusicFile(fileName, MusicLoaderDataType.KeySequence);
                    break;
                default:
                    throw new Error("未知的播放器类型: " + selectedPlayerTypes);
                    break;
            }
        } catch (e) {
            console.error(`加载乐曲文件失败: ${e}`);
            let res = dialogs.confirm("加载失败!", `加载乐曲文件失败, 这可能是因为文件已损坏, 配置错误或脚本的bug.\n点击"确定"将重置此乐曲的配置, 这有时可以解决问题.\n也可以将以下的错误信息反馈给开发者(截图最靠上部分即可):\n\n${e}\n${e.stack}`);
            if (res) {
                configuration.clearFileConfig(fileName);
            }
            return;
        }
        if (data == null) {
            console.error("加载乐曲文件失败, data == null");
            return;
        }
        totalTimeSec = data[data.length - 1][1] / 1000;
        totalTimeStr = sec2timeStr(totalTimeSec);
        musicFileData = data;
        progress = 0;
        progressChanged = true;
        currentGestureIndex = null;
        evt.emit("fileLoaded");
    });
    evt.on("currentFileConfigBtnClick", () => {
        if (lastSelectedFileIndex == null){
            toast("请先选择乐曲");
            return;
        }
        for (let player of selectedPlayers)
            player.pause();
        let fileName = totalFiles[lastSelectedFileIndex];
        runFileConfigSetup(fileName, (res) => {
            if (res) { //设置改变了
                evt.emit("fileSelect");
            }
        });
    });
    evt.on("globalConfigBtnClick", () => {
        for (let player of selectedPlayers)
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
        for (let player of selectedPlayers)
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
                visualizerWindowClose();
                evt.emit("midiStreamStart");
                //exitApp();
                break;
            case 2: //导出当前乐曲
                if (lastSelectedFileIndex == null) break;
                let fileName = totalFiles[lastSelectedFileIndex];
                gameProfile.clearCurrentConfigCache();
                let sel = dialogs.select("导出当前乐曲...", ["导出为txt键盘谱", "导出为JSON按键序列数据"]);
                let exportType = ScoreExportType.none;
                let loadDataType = MusicLoaderDataType.KeySequence;
                switch (sel) {
                    case -1: break;
                    case 0: //txt键盘谱
                        exportType = ScoreExportType.keyboardScore;
                        loadDataType = MusicLoaderDataType.KeySequenceHumanFriendly;
                        break;
                    case 1:
                        exportType = ScoreExportType.keySequenceJSON;
                        loadDataType = MusicLoaderDataType.KeySequence;
                        break;
                }
                let data = loadMusicFile(fileName, loadDataType);
                if (data == null) {
                    break;
                }
                exportNoteDataInteractive(data, exportType);
        }
    });
    evt.on("midiStreamStart", () => {
        const stream = setupMidiStream();
        if (stream == null) {
            toast("MIDI串流启动失败");
            return;
        }
        toast("MIDI串流已启动");
        operationMode = ScriptOperationMode.MIDIInputStreaming;
        ui.run(() => {
            controlWindow.musicTitleText.setText("MIDI串流中...");
        });
        midiInputStreamingNoteCount = 0;
        stream.onDataReceived(function (datas) {
            const STATUS_COMMAND_MASK = 0xF0;
            const STATUS_CHANNEL_MASK = 0x0F;
            const STATUS_NOTE_OFF = 0x80;
            const STATUS_NOTE_ON = 0x90;
            let keyList = new Array();
            for (let data of datas) {
                let cmd = data[0] & STATUS_COMMAND_MASK;
                //console.log("cmd: " + cmd);
                if (cmd == STATUS_NOTE_ON && data[2] != 0) { // velocity != 0
                    let key = gameProfile.getKeyByPitch(data[1]);
                    if (key != -1 && keyList.indexOf(key) === -1) keyList.push(key);
                    midiInputStreamingNoteCount++;
                }
            }
            let gestureList = new Array();
            for (let j = 0; j < keyList.length; j++) { //遍历这个数组
                let key = keyList[j];
                if (key != 0) {
                    gestureList.push([0, 5, gameProfile.getKeyPosition(key)]);
                };
            };
            if (gestureList.length > 10) gestureList.splice(9, gestureList.length - 10); //手势最多同时只能执行10个

            if (gestureList.length != 0) {
                for (let player of selectedPlayers)
                    player.exec(gestureList);
            };
        });
        evt.on("hideBtnClick", () => {
            stream.close();
            controlWindowVisible = false;
            controlWindowSetVisibility(false);
        });
    });
    evt.on("pauseResumeBtnLongClick", () => {
        //隐藏悬浮窗播放
        toast("8秒后播放...");
        visualizerWindowClose();
        controlWindow.close();
        controlWindow = null;
        selectedPlayers[0].setOnStateChange(function (newState) {
            if (newState == selectedPlayers[0].PlayerStates.FINISHED) {
                exitApp();
            }
            console.warn("Unexpected state:" + newState);
        });
        setTimeout(() => {
            for (let player of selectedPlayers)
                player.resume();
        }, 8000);
    });
    evt.on("hideBtnClick", () => {
        controlWindowVisible = false;
        controlWindowSetVisibility(false);
    });
    evt.on("exitApp", () => {
        exitApp();
    });
    evt.on("fileLoaded", () => {
        operationMode = ScriptOperationMode.FilePlayer;
        if (instructWindow != null) {
            instructWindow.close();
            instructWindow = null;
        }
        selectedPlayers = [];
        switch (selectedPlayerTypes[0]) { //FIXME:
            case PlayerType.AutoJsGesturePlayer:
                selectedPlayers.push(new AutoJsGesturePlayer());
                console.log("new AutoJsGesturePlayer");
                break;
            case PlayerType.SimpleInstructPlayer:
                selectedPlayers.push(new SimpleInstructPlayer());
                let impl = /** @type {import("./src/instruct.js").SimpleInstructPlayerImpl} */ ((selectedPlayers[0].getImplementationInstance())) ;
                impl.setKeyPositions(gameProfile.getAllKeyPositions());
                impl.setKeyRadius(gameProfile.getPhysicalMinKeyDistance() * 0.3 * configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1));
                //创建全屏悬浮窗. 也许不需要全屏?
                instructWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
                instructWindow.setTouchable(false);
                instructWindow.setSize(-1, -1);
                //打开硬件加速
                instructWindow.canv.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
                instructWindow.canv.on("draw", function (canvas) {
                    impl.draw(canvas);
                });
                console.log("new SimpleInstructPlayer");
                break;
            default:
                throw new Error("未知的播放器类型: " + selectedPlayerTypes);
                break;
        }
        selectedPlayers[0].setOnStateChange(function (newState) {
            if (newState == selectedPlayers[0].PlayerStates.PAUSED ||
                newState == selectedPlayers[0].PlayerStates.FINISHED) {
                controlWindow.pauseResumeBtn.setText("▶️");
            } else if (newState == selectedPlayers[0].PlayerStates.PLAYING) {
                controlWindow.pauseResumeBtn.setText("⏸");
            }
        });
        selectedPlayers[0].setOnPlayNote(function (note) {
            currentGestureIndex = note;
            visualizer.goto(Math.max(0, note - 1));
        });
        ui.run(() => {
            controlWindow.musicTitleText.setText(
                musicFormats.getFileNameWithoutExtension(totalFiles[lastSelectedFileIndex]));
        });
        for (let player of selectedPlayers)
            player.setGestureTimeList(musicFileData);
        //设置点击位置偏移
        const clickPositionDeviationMm = readGlobalConfig("clickPositionDeviationMm", 1);
        const displayMetrics = context.getResources().getDisplayMetrics();
        const TypedValue = android.util.TypedValue;
        const clickPositionDeviationPx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_MM, clickPositionDeviationMm, displayMetrics);
        console.verbose(`点击位置偏移: ${clickPositionDeviationPx} px`);
        for (let player of selectedPlayers)
            player.setClickPositionDeviationPx(clickPositionDeviationPx);
        //是否显示可视化窗口
        let visualizerEnabled = readGlobalConfig("visualizerEnabled", false);
        if (visualizerEnabled && gameProfile.getKeyLayout().type === "grid") { //TODO: 其它类型的键位布局也可以显示可视化窗口
            visualizerWindow = createVisualizerWindow();
            toast("单击可视化窗口调整大小与位置, 双击重置");
        };
        for (let player of selectedPlayers) {
            player.start();
            player.pause();
        }
    });

    function controlWindowUpdateLoop() {
        if (controlWindow == null) {
            return;
        }
        switch (operationMode) {
            case ScriptOperationMode.NotRunning:
                break;
            case ScriptOperationMode.FilePlayer: {
                if (musicFileData == null || totalTimeSec == null || currentGestureIndex == null) break;
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
                    for (let player of selectedPlayers)
                        player.seekTo(currentGestureIndex);
                    console.log("seekTo:" + currentGestureIndex);
                    setImmediate(controlWindowUpdateLoop);
                }
                currentGestureIndex = Math.min(currentGestureIndex, musicFileData.length - 1);
                //计算时间
                let curTimeSec = musicFileData[currentGestureIndex][1] / 1000;
                let curTimeStr = sec2timeStr(curTimeSec);
                let timeStr = curTimeStr + "/" + totalTimeStr;
                //更新窗口
                ui.run(() => {
                    controlWindow.progressBar.setProgress(curTimeSec / totalTimeSec * 100);
                    controlWindow.timerText.setText(timeStr);
                });
            }
                break;
            case ScriptOperationMode.MIDIInputStreaming:
                ui.run(() => {
                    controlWindow.timerText.setText(`音符数: ${midiInputStreamingNoteCount}`);
                });
                break;
        }
    }
    setInterval(controlWindowUpdateLoop, 200);

    //悬浮按钮
    let fb = new FloatButton();
    fb.setIcon('@drawable/ic_library_music_black_48dp');
    fb.setTint('#ffff00');
    fb.setColor('#019581');
    fb.addItem('隐藏/显示主悬浮窗')
        .setIcon('@drawable/ic_visibility_black_48dp')
        .setTint('#FFFFFF')
        .setColor('#019581')
        .onClick((view, name) => {
            controlWindowSetVisibility(!controlWindowVisible);
            controlWindowVisible = !controlWindowVisible;
            //返回 true:保持菜单开启 false:关闭菜单
            return false;
        });
    fb.addItem('退出脚本')
        .setIcon('@drawable/ic_exit_to_app_black_48dp')
        .setTint('#FFFFFF')
        .setColor('#019581')
        .onClick((view, name) => {
            fb.close();
            evt.emit("exitApp");
            return false;
        });
    fb.show();
}


/**
 * @brief 解析并加载乐曲文件, 使用文件设置
 * @param {string} fileName
 * @param {MusicLoaderDataType} loadType
 */
function loadMusicFile(fileName, loadType) {
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
            runFileConfigSetup(fileName, (anythingChanged) => {
                toast("设置已保存, 请重新选择乐曲...");
            });
        };
        return null;
    };


    let humanifyNoteAbsTimeStdDev = readGlobalConfig("humanifyNoteAbsTimeStdDev", 0)
    let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
    let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
    let treatHalfAsCeiling = readFileConfig("halfCeiling", rawFileName, false);
    let limitClickSpeedHz = readFileConfig("limitClickSpeedHz", rawFileName, 0);
    let speedMultiplier = readFileConfig("speedMultiplier", rawFileName, 1);
    let noteDurationOutputMode = configuration.readFileConfigForTarget("noteDurationOutputMode", rawFileName, gameProfile, "none");
    let maxGestureDuration = readGlobalConfig("maxGestureDuration", 8000);
    let marginDuration = readGlobalConfig("marginDuration", 100);
    let defaultClickDuration = readGlobalConfig("defaultClickDuration", 5);
    let chordLimitEnabled = readFileConfig("chordLimitEnabled", rawFileName, false);
    let maxSimultaneousNoteCount = readFileConfig("maxSimultaneousNoteCount", rawFileName, 2);
    let noteCountLimitMode = readFileConfig("noteCountLimitMode", rawFileName, "split");
    let noteCountLimitSplitDelay = readFileConfig("noteCountLimitSplitDelay", rawFileName, 75);
    let chordSelectMode = readFileConfig("chordSelectMode", rawFileName, "high");
    let mergeThreshold = (loadType == MusicLoaderDataType.KeySequenceHumanFriendly ? scoreExportMergeThreshold : autoPlayMergeThreshold);
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
            if (selectedTracksNonEmpty[i] >= nonEmptyTrackCount) continue;
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
            progressDialog.setContent("正在生成手势...");
        });
    }

    if (loadType != MusicLoaderDataType.GestureSequence) {
        //如果是导出乐谱,则不需要生成手势
        let data = passManager.run(noteData);
        progressDialog.dismiss();
        return noteUtils.packNotes(data);
    }

    //加载可视化窗口
    passManager.addPass("NopPass", null, null, (data, statistics, elapsedTime) => {
        let layout = gameProfile.getKeyLayout()
        if(layout.row == null || layout.column == null) return;
        visualizer.setKeyLayout(layout.row, layout.column);
        visualizer.loadNoteData(noteUtils.packNotes(data));
        visualizer.goto(-1);
    });

    //生成手势
    passManager.addPass("KeyToGesturePass", {
        currentGameProfile: gameProfile,
        durationMode: noteDurationOutputMode,
        maxGestureDuration: maxGestureDuration,
        marginDuration: marginDuration,
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
        "\n(如果被取整的音符数过多, 请在菜单中选择自动调整)";
    const estimatedKey = midiPitch.getTranspositionEstimatedKey(minorPitchOffset);
    const hintString = `估计乐曲调号: ${estimatedKey}\n` + gameProfile.getGameSpecificHintByEstimatedKey(estimatedKey);

    dialogs.alert("乐曲信息", statString + "\n\n" + hintString);

    return gestureTimeList;
}

function start() {
    /**
     * see: https://github.com/kkevsekk1/AutoX/issues/672
     */
    if (runtimes.getCurrentRuntime() == runtimes.Runtime.AUTOXJS) {
        try {
            // console.log("宽度: " + device.width);
            //Java, 启动!!!
            let deviceClass = device.getClass();
            let widthField = deviceClass.getDeclaredField("width");
            let heightField = deviceClass.getDeclaredField("height");
            widthField.setAccessible(true);
            heightField.setAccessible(true);
            widthField.setInt(device, context.getResources().getDisplayMetrics().widthPixels);
            heightField.setInt(device, context.getResources().getDisplayMetrics().heightPixels);
            let rotationListener = new JavaAdapter(android.view.OrientationEventListener, {
                onOrientationChanged: function (orientation) {
                    widthField.setInt(device, context.getResources().getDisplayMetrics().widthPixels);
                    heightField.setInt(device, context.getResources().getDisplayMetrics().heightPixels);
                }
            }, context);
            rotationListener.enable();
        } catch (e) {
            console.warn("Workaround failed");
            console.error(e);
        }
    }

    //获取真实的应用名称
    const packageManager = context.getPackageManager();
    appName = packageManager.getApplicationLabel(context.getApplicationInfo()).toString();
    initialize();
    loadConfiguration();
    main();
    console.info("启动完成");
}

start();