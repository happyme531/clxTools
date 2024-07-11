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
    var { PlayerType, AutoJsGesturePlayer, SimpleInstructPlayer, SkyCotlLikeInstructPlayer } = require("./src/players.js");
    var configuration = require("./src/configuration.js");
    var passes = require("./src/passes.js");
    var midiPitch = require("./src/midiPitch.js");
    var noteUtils = require("./src/noteUtils.js");
    var LrcParser = require("./src/frontend/lrc.js")
    var { ConfigurationUi, ConfigurationFlags } = require("./src/ui/config_ui.js");
    var FileProvider = require("./src/fileProvider.js");
    var FileSelector = require("./src/ui/fileSelector.js");
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
let fileProvider = new FileProvider();

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
            if (!dialogs.confirm(
                "错误", 
                "没有找到MIDI设备, 点击确定重试, 点击取消退出\n" + 
                "提示: 如果想使用蓝牙MIDI设备, 请根据使用说明中相关教程安装插件进行连接" 
                )) {
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
        let str = track.name + " (" + track.noteCount + "个音符, 平均音高" + avgPitch.toFixed(1);
        if (track.notes[i][2].velocity != null) {
            let avgVelocity = 0;
            for (let j = 0; j < track.notes.length; j++) {
                avgVelocity += track.notes[j][2].velocity;
            }
            avgVelocity /= track.notes.length;
            avgVelocity *= 100;
            str += ", 力度" + avgVelocity.toFixed(0) + "%";
        }
        str += ")";
        trackInfoStrs.push(str);

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
 * @param {GameProfile} gameProfile
 * @brief 测试配置效果 
 * @return {{
* "outRangedNoteWeight": number,
* "overFlowedNoteCnt": number,
* "underFlowedNoteCnt": number,
* "roundedNoteCnt": number,
* "totalNoteCnt": number,
* }}
*/
function evalFileConfig(noteData, targetMajorPitchOffset, targetMinorPitchOffset, gameProfile) {
    //丢弃音调高的音符的代价要高于丢弃音调低的音符的代价, 因此权重要高
    const overFlowedNoteWeight = 5;

    const pass = new passes.SequentialPass({
        passes: [
            new passes.PitchOffsetPass({
                offset: targetMajorPitchOffset * 12 + targetMinorPitchOffset
            }),
            new passes.LegalizeTargetNoteRangePass({
                currentGameProfile: gameProfile,
                semiToneRoundingMode: passes.SemiToneRoundingMode.floor
            })
        ]
    });
    let data = JSON.parse(JSON.stringify(noteData));
    pass.run(data, (progress) => {});
    const stats = pass.getStatistics();

    return {
        "outRangedNoteWeight": stats.LegalizeTargetNoteRangePass.overFlowedNoteCnt * overFlowedNoteWeight + stats.LegalizeTargetNoteRangePass.underFlowedNoteCnt,
        "overFlowedNoteCnt": stats.LegalizeTargetNoteRangePass.overFlowedNoteCnt,
        "underFlowedNoteCnt": stats.LegalizeTargetNoteRangePass.underFlowedNoteCnt,
        "roundedNoteCnt": stats.LegalizeTargetNoteRangePass.roundedNoteCnt,
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
    //悬浮窗提示
    let dial = dialogs.build({
        title: "调整中...",
        content: "正在调整音高偏移量，请稍候...",
        progress: {
            max: 100,
            showMinMax: true
        },
    });
    dial.show();

    const tracksData = new passes.SequentialPass({
        passes: [
            new passes.ParseSourceFilePass({}),
            new passes.RemoveEmptyTracksPass({}),
        ]
    }).run(musicDir + fileProvider.loadMusicFile(fileName));
    
    const noteData = new passes.MergeTracksPass({}).run(tracksData);
    const inferBestPitchOffsetPass = new passes.InferBestPitchOffsetPass({
        gameProfile: gameProfile
    });
    inferBestPitchOffsetPass.run(noteData, (progress) => dial.setProgress(progress));
    const stats = inferBestPitchOffsetPass.getStatistics();

    console.info("最佳八度偏移: " + stats.bestOctaveOffset);
    console.info("最佳半音偏移: " + stats.bestSemiToneOffset);

    //禁用无效音符过多的音轨
    let selectedTracksNonEmpty = new Array();
    if (tracksData.haveMultipleTrack) {
        let trackPlayableNoteRatio = new Array();
        for (let i = 0; i < tracksData.trackCount; i++) {
            let track = tracksData.tracks[i];
            let playableNoteCnt = 0;
            let result = evalFileConfig(track.notes, stats.bestOctaveOffset, stats.bestSemiToneOffset, gameProfile);
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
    let realBestOutRangedNoteCnt = stats.bestOverFlowedNoteCnt + stats.bestUnderFlowedNoteCnt;
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
    let percentStr2 = (stats.bestRoundedNoteCnt / totalNoteCnt * 100).toFixed(2) + "%";
    let resultStr = "最佳结果: \n" +
        "超出范围被丢弃的音符数: " + realBestOutRangedNoteCnt + " (+" + stats.bestOverFlowedNoteCnt + ", -" + stats.bestUnderFlowedNoteCnt + ")(" + percentStr1 + ")\n" +
        "被取整的音符数: " + stats.bestRoundedNoteCnt + " (" + percentStr2 + ")\n" +
        "最佳八度偏移: " + stats.bestOctaveOffset + "\n" +
        "最佳半音偏移: " + stats.bestSemiToneOffset;
    if (tracksData.haveMultipleTrack)
        resultStr += "\n选择的音轨: " + JSON.stringify(selectedTracksNonEmpty);

    dialogs.alert("调整结果", resultStr);

    configuration.setFileConfigForTarget("majorPitchOffset", stats.bestOctaveOffset, fileName, gameProfile);
    configuration.setFileConfigForTarget("minorPitchOffset", stats.bestSemiToneOffset, fileName, gameProfile);
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
 * @param {string | null} fullFileName
 * @param {(isAnythingChanged:boolean)=>void} onFinish
 * @param {Array<ConfigurationFlags>} [extFlags]
 */
function runFileConfigSetup(fullFileName, onFinish, extFlags){
    /**
     * @type {Dialogs.JsDialog?}
     */
    let dialog = null;
    let flags = [];
    if (extFlags != null) {
        flags = flags.concat(extFlags);
    }
    let fileName = null,rawFileName = null;
    if (fullFileName != null) {
        fileName = fullFileName;
        rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
        let format = musicFormats.getFileFormat(fileName);

        if (format.haveDurationInfo) {
            flags.push(ConfigurationFlags.MUSIC_HAS_DURATION_INFO);
        }
        if (format.haveTracks) {
            flags.push(ConfigurationFlags.MUSIC_HAS_TRACKS);
        }
    }

    if (!flags.includes(ConfigurationFlags.WORKMODE_MIDI_INPUT_STREAMING)) {
        let playerSelection = configuration.readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
        if (playerSelection.includes("AutoJsGesturePlayer")) {
            flags.push(ConfigurationFlags.WORKMODE_GESTURE_PLAYER);
        }
        if (playerSelection.includes("SimpleInstructPlayer") || playerSelection.includes("SkyCotlLikeInstructPlayer")) {
            flags.push(ConfigurationFlags.WORKMODE_INSTRUCT);
        }
    }

    function showConfigDialog() {
        function refreshConfigUi() {
            if (dialog != null) {
                dialog.dismiss();
                dialog = null;
            }
            onFinish(configUi.isAnythingChanged());
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
                    let dialog = dialogs.build({
                        title: "加载中...",
                        content: "正在加载数据...",
                    }).show();
                    let tracksData = new passes.ParseSourceFilePass({})
                        .run(musicDir + fileProvider.loadMusicFile(fileName));
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
 * @param {FileProvider} fileProvider
 * @param {(selectedMusic: string?, selectedPlaylist: string?) => void} callback 回调函数，参数为选择的文件名与歌单名
 */
function runFileSelector(fileProvider, callback) {
    let fileSelector = new FileSelector(fileProvider);
    fileSelector.setOnItemSelected(callback);
    fileSelector.show();
    return;
}


function getTargetTriple() {
    let configName = gameProfile.getCurrentConfigDisplayName();
    let variantName = gameProfile.getCurrentVariantDisplayName();
    let keyTypeName = gameProfile.getCurrentKeyLayoutDisplayName();
    return configName + " " + variantName + " " + keyTypeName;
}

/**
 * @brief 校准全屏画布的偏移量
 * @param {string} [prompt] 提示文本, 默认: "点击任意位置继续..."
 * @returns {[number, number]} 返回偏移量
 */
function calibrateFullScreenCanvasOffset(prompt){
    let promptText = "点击任意位置继续...";
    if (prompt != null) {
        promptText = prompt;
    }
    let finish = false;
    let offset = [0,0];
    const fullScreenWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1, -1);
    fullScreenWindow.canv.setOnTouchListener(function (v, evt) {
        if (evt.getAction() == evt.ACTION_DOWN) {
            finish = true;
            const screenPos = [parseInt(evt.getRawX().toFixed(0)), parseInt(evt.getRawY().toFixed(0))];
            const windowPos = [parseInt(evt.getX().toFixed(0)), parseInt(evt.getY().toFixed(0))];
            offset = [screenPos[0] - windowPos[0], screenPos[1] - windowPos[1]];
        }
        return true;
    });
    fullScreenWindow.canv.on("draw", function (canvas) {
        while(finish) sleep(50);
        const Color = android.graphics.Color;
        const PorterDuff = android.graphics.PorterDuff;
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        //绘制灰色背景
        canvas.drawARGB(80, 0, 0, 0);
        //在正中央绘制提示
        const paint = new Paint();
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setARGB(255, 255, 255, 255);
        paint.setTextSize(50);
        canvas.drawText(promptText, canvas.getWidth() / 2, canvas.getHeight() / 2, paint);
    });
    while (!finish) {
        sleep(100);
    }
    sleep(100);
    fullScreenWindow.close();
    console.log("偏移量: " + offset);
    //@ts-ignore
    return offset;
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
    /**
     * @type {String[]}
     */
    let totalFiles = [];
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

    //输入给播放器的音乐数据。可能是按键列表，也可能是手势列表
    let musicFileData = null;
    /**
     * @type {Number?}
     */
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
    let midiInputStreamReloadSettings = false;
    /**
     * 按键列表
     * @type {import("./src/noteUtils.js").PackedKey[]?}
     */
    let packedKeyListData = null;
    /**
     * @type {string?}
     */
    let currentLyricLine = null;
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
        <card elevation="0dp" cornerRadius="12dp" margin="4dp" cardBackgroundColor="#CCFFFFFF" id="controlWindowFrame" visibility="gone">
            <frame background="#00FFFFFF" w="*" h="*">
                <vertical padding="8dp">
                    <horizontal marginBottom="4dp">                        
                        <text id="musicTitleText" text="未选择乐曲..." textColor="#333333" textSize="14sp" maxLines="1" ellipsize="end" layout_weight="1" />
                        <text id="timerText" text="00:00/00:00" textColor="#666666" textSize="12sp" marginLeft="4dp" />
                        <button id="hideBtn" style="Widget.AppCompat.Button.Borderless" w="20dp" h='20dp' text="—" textSize="14sp" margin="0dp" padding="0dp" />
                    </horizontal>
                    
                    <seekbar id="progressBar" style="@style/Widget.AppCompat.SeekBar" layout_width="match_parent" layout_height="wrap_content" progressTint="#4CAF50" thumbTint="#4CAF50" />
                    
                    <horizontal gravity="center" marginTop="4dp">
                        <button id="fileSelectionMenuBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="📁" textSize="18sp" margin="0dp" padding="0dp" />
                        <button id="currentFileConfigBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="🎹" textSize="18sp" margin="0dp" padding="0dp" />
                        <button id="prevBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="⏮" textSize="18sp" margin="0dp" padding="0dp" />
                        <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="▶️" textSize="18sp" margin="0dp" padding="0dp" />
                        <button id="nextBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="⏭" textSize="18sp" margin="0dp" padding="0dp" />
                        <button id="globalConfigBtn" style="Widget.AppCompat.Button.Borderless" w="28dp" h='28dp' text="⚙" textSize="18sp" margin="0dp" padding="0dp" />
                    </horizontal>
                </vertical>
            </frame>
        </card>
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
    controlWindow.pauseResumeBtn.setOnLongClickListener(() => {
        evt.emit("pauseResumeBtnLongClick");
        return true;
    });
    controlWindow.musicTitleText.click(() => {
        evt.emit("musicTitleTextClick");
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
        //如果是第一次运行，显示设置向导
        if (!haveFileConfig(musicFormats.getFileNameWithoutExtension(fileName))) {
            let res = dialogs.confirm("设置向导", "检测到您是第一次演奏这首乐曲，是否要运行设置?");
            if (res) {
                runFileConfigSetup(fileName, (anythingChanged) => {
                    evt.emit("fileSelect");
                });
                return null;
            };
        };
        let data = null;
        try {
            //选择播放器
            selectedPlayerTypes = readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);

            switch (selectedPlayerTypes[0]) { //FIXME: 目前只支持单一播放器
                case PlayerType.AutoJsGesturePlayer:
                    data = loadMusicFile(fileName, MusicLoaderDataType.GestureSequence);
                    break;
                case PlayerType.SimpleInstructPlayer:
                case PlayerType.SkyCotlLikeInstructPlayer:
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
        //加载可视化窗口
        const layout = gameProfile.getKeyLayout()
        if(layout.row == null || layout.column == null) return;
        visualizer.setKeyLayout(layout.row, layout.column);
        visualizer.loadNoteData(data.packedKeyList);
        visualizer.goto(-1);

        musicFileData = data.gestureList != null ? data.gestureList : data.packedKeyList;
        packedKeyListData = data.packedKeyList;
        totalTimeSec = musicFileData[musicFileData.length - 1][1] / 1000;
        totalTimeStr = sec2timeStr(totalTimeSec);
        progress = 0;
        progressChanged = true;
        currentGestureIndex = null;
        evt.emit("fileLoaded");
    });
    evt.on("currentFileConfigBtnClick", () => {
        if (lastSelectedFileIndex == null && operationMode != ScriptOperationMode.MIDIInputStreaming) {
            toast("请先选择乐曲或开始MIDI串流");
            return;
        }
        for (let player of selectedPlayers)
            player.pause();

        if (operationMode == ScriptOperationMode.MIDIInputStreaming) {
            runFileConfigSetup(null, (res) => {
                if (res) {
                    midiInputStreamReloadSettings = true;
                }
            }, [ConfigurationFlags.WORKMODE_MIDI_INPUT_STREAMING]);
            return;
        } else {
            let fileName = totalFiles[lastSelectedFileIndex];
            runFileConfigSetup(fileName, (res) => {
                if (res) { //设置改变了
                    evt.emit("fileSelect");
                }
            });
        }
    });
    evt.on("globalConfigBtnClick", () => {
        for (let player of selectedPlayers)
            player.pause();
        switch (dialogs.select("其它选项...",
            ["🎮选择游戏/乐器",
                "📍设置坐标",
                "📃 查看使用帮助",
                "📲 MIDI串流演奏",
                "🎼 导出当前乐曲",])) {
            case -1:
                break;
            case 0:
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
            case 1: //设置坐标
                runClickPosSetup();
                break;
            case 2: //查看使用帮助
                app.viewFile(musicDir + "使用帮助.pdf");
                exitApp();
                break;
            case 3: //MIDI串流
                visualizerWindowClose();
                evt.emit("midiStreamStart");
                //exitApp();
                break;
            case 4: //导出当前乐曲
                if (lastSelectedFileIndex == null) break;
                let fileName = totalFiles[lastSelectedFileIndex];
                gameProfile.clearCurrentConfigCache();
                let sel2 = dialogs.select("导出当前乐曲...", ["导出为txt键盘谱", "导出为JSON按键序列数据"]);
                let exportType = ScoreExportType.none;
                let loadDataType = MusicLoaderDataType.KeySequence;
                switch (sel2) {
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
                exportNoteDataInteractive(data.packedKeyList, exportType);
        };
        titleStr = "当前配置: " + getTargetTriple();
        ui.run(() => {
            controlWindow.musicTitleText.setText(titleStr);
        });
    });
    evt.on("fileSelectionMenuBtnClick", () =>
        runFileSelector(fileProvider, (music, playlist) => {
            if (playlist == null) {
                totalFiles = fileProvider.listAllMusicFiles();
            } else {
                let res = fileProvider.listMusicInList(playlist);
                if (res == null || res.length == 0) {
                    totalFiles = [];
                    return;
                }
                totalFiles = res;
            }
            if(music == null){
                lastSelectedFileIndex = null;
                return;
            }
            lastSelectedFileIndex = totalFiles.indexOf(music);
            evt.emit("fileSelect");
        })
    );
    evt.on("midiStreamStart", () => {
        if(!checkEnableAccessbility()) return;
        const stream = setupMidiStream();
        if (stream == null) {
            toast("MIDI串流启动失败");
            return;
        }
        toast("MIDI串流已启动");
        selectedPlayers = [];
        selectedPlayers.push(new AutoJsGesturePlayer());
        operationMode = ScriptOperationMode.MIDIInputStreaming;
        ui.run(() => {
            controlWindow.musicTitleText.setText("MIDI串流中...");
        });
        midiInputStreamingNoteCount = 0;
        midiInputStreamReloadSettings = true;
        let octaveOffset = 0;
        let semiToneOffset = 0;
        //"伪延音", 用于在串流时模拟延音效果
        let fakeSustainInterval = 0;
        let pressedKeysList = new java.util.concurrent.CopyOnWriteArrayList(); //线程安全
        const keyCount = gameProfile.getAllKeyPositions().length;
        for (let i = 0; i < keyCount; i++) {
            pressedKeysList.add(false);
        }
        const fakeSustainThread = threads.start(function () {
            while (true) {
                while(fakeSustainInterval == 0) sleep(500);
                let gestureList = new Array();
                for (let j = 0; j < keyCount; j++) { 
                    if(pressedKeysList.get(j).booleanValue()){  //坑哦, Java那边的Boolean没办法直接用
                        gestureList.push([0, 5, gameProfile.getKeyPosition(j)]);
                    }
                };
                if (gestureList.length > 10) gestureList.splice(9, gestureList.length - 10); //手势最多同时只能执行10个
                if (gestureList.length != 0) {
                    for (let player of selectedPlayers)
                        player.exec(gestureList);
                };
                sleep(fakeSustainInterval * 0.8 + Math.random() * fakeSustainInterval * 0.4); //改成正态分布?
            }
        });

        stream.onDataReceived(function (datas) {
            const STATUS_COMMAND_MASK = 0xF0;
            const STATUS_CHANNEL_MASK = 0x0F;
            const STATUS_NOTE_OFF = 0x80;
            const STATUS_NOTE_ON = 0x90;

            if(midiInputStreamReloadSettings){
                midiInputStreamReloadSettings = false;
                octaveOffset = configuration.readGlobalConfig("MIDIInputStreaming_majorPitchOffset", 0);
                semiToneOffset = configuration.readGlobalConfig("MIDIInputStreaming_minorPitchOffset", 0);
                fakeSustainInterval = configuration.readGlobalConfig("MIDIInputStreaming_fakeSustainInterval", 0);
            }

            let keyList = new Array();
            for (let data of datas) {
                let cmd = data[0] & STATUS_COMMAND_MASK;
                if (cmd == STATUS_NOTE_ON && data[2] != 0) { // velocity != 0
                    let key = gameProfile.getKeyByPitch(data[1] + semiToneOffset + octaveOffset * 12);
                    if (key != -1 && keyList.indexOf(key) === -1){
                        keyList.push(key);
                        pressedKeysList.set(key, true);
                    }
                    midiInputStreamingNoteCount++;
                }else if (cmd == STATUS_NOTE_OFF || data[2] == 0) {
                    let key = gameProfile.getKeyByPitch(data[1] + semiToneOffset + octaveOffset * 12);
                    if (key != -1){
                        pressedKeysList.set(key, false);
                    }
                }
            }
            let gestureList = new Array();
            for (let j = 0; j < keyList.length; j++) { //遍历这个数组
                let key = keyList[j];
                gestureList.push([0, 5, gameProfile.getKeyPosition(key)]);
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
            fakeSustainThread.interrupt();
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
        let autoStartPlaying = false;
        switch (selectedPlayerTypes[0]) { //FIXME:
            case PlayerType.AutoJsGesturePlayer:
                selectedPlayers.push(new AutoJsGesturePlayer());
                console.log("new AutoJsGesturePlayer");
                break;
            case PlayerType.SimpleInstructPlayer:
            case PlayerType.SkyCotlLikeInstructPlayer:
                let impl = null;
                if (selectedPlayerTypes[0] == PlayerType.SkyCotlLikeInstructPlayer) {
                    selectedPlayers.push(new SkyCotlLikeInstructPlayer());
                    //@ts-ignore
                    impl = /** @type {import("./src/instruct.js").SkyCotlLikeInstructPlayerImpl} */ (selectedPlayers[0].getImplementationInstance());
                    impl.setDrawLineToEachNextKeys(
                        configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys", false)
                    );
                    impl.setDrawLineToNextNextKey(
                        configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToNextNextKey", true)
                    );
                    let keyRange = gameProfile.getKeyRange();
                    keyRange = [keyRange[0] - 1, keyRange[1] - 1]; //从0开始
                    let keyOrderMap = new Map();
                    for (let i = keyRange[0]; i <= keyRange[1]; i++) {
                        keyOrderMap.set(i, gameProfile.getPitchByKey(i));
                    }
                    impl.setKeyOrder(keyOrderMap);

                    console.log("new SkyCotlLikeInstructPlayer");
                }else if (selectedPlayerTypes[0] == PlayerType.SimpleInstructPlayer) {
                    selectedPlayers.push(new SimpleInstructPlayer());
                    impl = /** @type {import("./src/instruct.js").SimpleInstructPlayerImpl} */ (selectedPlayers[0].getImplementationInstance());
                    console.log("new SimpleInstructPlayer");
                }else{
                    throw new Error("未知的播放器类型: " + selectedPlayerTypes);
                }
                autoStartPlaying = true;
                const offset = calibrateFullScreenCanvasOffset();
                let keyPositions = JSON.parse(JSON.stringify(gameProfile.getAllKeyPositions()));
                for (let keyPos of keyPositions) {
                    keyPos[0] -= offset[0];
                    keyPos[1] -= offset[1];
                }
                impl.setKeyPositions(keyPositions);
                impl.setKeyRadius(gameProfile.getPhysicalMinKeyDistance() * 0.3 * configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1));
                //创建全屏悬浮窗. 也许不需要全屏?
                instructWindow = floaty.rawWindow(<canvas id="canv" w="*" h="*" />);
                instructWindow.setTouchable(false);
                instructWindow.setSize(-1, -1);
                //打开硬件加速
                instructWindow.canv.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
                let targetFps = context.getSystemService(Context.WINDOW_SERVICE).getDefaultDisplay().getRefreshRate();
                console.log(`目标FPS: ${targetFps} fps`);
                // instructWindow.canv.setMaxFps(fps);  //坏的
                let canvasClass = instructWindow.canv.getClass();
                let mTimePerDrawField = canvasClass.getDeclaredField("mTimePerDraw");
                mTimePerDrawField.setAccessible(true);
                mTimePerDrawField.set(instructWindow.canv, org.mozilla.javascript.Context.jsToJava(1000 / targetFps, java.lang.Long.TYPE));
                instructWindow.canv.on("draw", function (canvas) {
                    impl.draw(canvas);
                });
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
            note = Math.max(0, note - 1)
            visualizer.goto(note);
            if (packedKeyListData[note][2][0].lyric != null) {
                currentLyricLine = packedKeyListData[note][2][0].lyric;
            }
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
        let visualizationEnabled = readGlobalConfig("visualizationEnabled", false);
        if (visualizationEnabled && gameProfile.getKeyLayout().type === "grid") { //TODO: 其它类型的键位布局也可以显示可视化窗口
            visualizerWindow = createVisualizerWindow();
            toast("单击可视化窗口调整大小与位置, 双击重置");
        };
        for (let player of selectedPlayers) {
            player.start();
            player.pause();
            if(autoStartPlaying)
                player.resume();
            currentGestureIndex = 0;
        }
    });

    evt.on("musicTitleTextClick", () => {
        if (packedKeyListData == null) return;
        let lyricLines = new Array();
        let indexes = new Array();
        for (let i = 0; i < packedKeyListData.length; i++) {
            //@ts-ignore
            let lyric = packedKeyListData[i][2][0].lyric;
            if (lyric != null) {
                lyricLines.push(lyric);
                indexes.push(i);
            }
        }
        if (lyricLines.length == 0) {
            toast("没有找到歌词");
            return;
        }
        for (let player of selectedPlayers)
            player.pause();
        let sel = dialogs.select("跳转到歌词...", lyricLines);
        if (sel == -1) return;
        currentGestureIndex = indexes[sel];
        for (let player of selectedPlayers){
            player.seekTo(currentGestureIndex);
            player.resume();
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
                        if (musicFileData[j][1] > targetTimeSec * 1000) {
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
                    if(currentLyricLine != null){
                        controlWindow.musicTitleText.setText(currentLyricLine);
                        currentLyricLine = null;
                    }
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
            //fb.close();
            evt.emit("exitApp");
            return true;
        });
    fb.show();
    
    // controlWindowSetVisibility(true)  //方便调试
}


/**
 * @brief 解析并加载乐曲文件, 使用文件设置
 * @param {string} fileName
 * @param {MusicLoaderDataType} loadType
 * 
 * @typedef {Object} loadedMusicData
 * @property {import("./src/noteUtils.js").PackedNoteLike[]} packedKeyList
 * @property {import("./src/players.js").Gestures} [gestureList]
 * @property {string} summary
 * @returns {loadedMusicData?}
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
    fileName = fileProvider.loadMusicFile(fileName);
    console.info("加载乐曲文件: " + fileName);
    let rawFileName = musicFormats.getFileNameWithoutExtension(fileName);
    let startTime = new Date().getTime();

    //////////////加载配置
    if (!gameProfile.checkKeyPosition()) {
        dialogs.alert("错误", "坐标未设置，请先设置坐标");
        progressDialog.dismiss();
        runClickPosSetup();
        return null;
    };

    let humanifyNoteAbsTimeStdDev = readGlobalConfig("humanifyNoteAbsTimeStdDev", 0)
    let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
    let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
    let semiToneRoundingMode = readFileConfig("semiToneRoundingMode", rawFileName, 0);
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
    let lastSelectedTracksNonEmpty = configuration.readFileConfigForTarget("lastSelectedTracksNonEmpty", rawFileName, gameProfile);
    let keyRange = gameProfile.getKeyRange();

    console.log("当前乐曲:" + fileName);
    console.log("配置信息:");
    console.log("majorPitchOffset:" + majorPitchOffset);
    console.log("minorPitchOffset:" + minorPitchOffset);
    console.log("semiToneRoundingMode:" + semiToneRoundingMode);

    /**
     * @type {Array<passes.Pass>}
     */
    let pipeline = [];

    //解析文件
    progressDialog.setContent("解析文件...");
    // console.log("解析文件耗时" + elapsedTime / 1000 + "秒");
    pipeline.push(new passes.ParseSourceFilePass({}));
    //选择音轨
    pipeline.push(new passes.RemoveEmptyTracksPass({}));
    pipeline.push(new passes.MergeTracksPass({
        selectedTracks: lastSelectedTracksNonEmpty,
        skipPercussion: true,
    }));
    pipeline.push(new passes.StoreCurrentNoteTimePass());

    //伪装手弹
    if (humanifyNoteAbsTimeStdDev > 0) {
        pipeline.push(new passes.HumanifyPass({
            noteAbsTimeStdDev: humanifyNoteAbsTimeStdDev
        }));
    }
    //转换成目标游戏的音域
    pipeline.push(new passes.PitchOffsetPass({
        offset: majorPitchOffset * 12 + minorPitchOffset
    }));
    pipeline.push(new passes.LegalizeTargetNoteRangePass({
        semiToneRoundingMode: semiToneRoundingMode,
        currentGameProfile: gameProfile,
    }));
    //单个按键频率限制
    pipeline.push(new passes.SingleKeyFrequencyLimitPass({
        minInterval: gameProfile.getSameKeyMinInterval()
    }));

    //跳过前奏
    if (readGlobalConfig("skipInit", true)) {
        pipeline.push(new passes.SkipIntroPass({}));
    }
    //跳过中间的空白
    if (readGlobalConfig("skipBlank5s", true)) {
        pipeline.push(new passes.LimitBlankDurationPass({})); //默认5秒
    }
    //变速
    if (speedMultiplier != 1) {
        pipeline.push(new passes.SpeedChangePass({
            speed: speedMultiplier
        }));
    }
    //合并按键
    pipeline.push(new passes.MergeKeyPass({
        maxInterval: mergeThreshold * 1000,
    }));
    //限制按键频率
    if (limitClickSpeedHz != 0) {
        pipeline.push(new passes.NoteFrequencySoftLimitPass({
            minInterval: 1000 / limitClickSpeedHz
        }));
    }
    //限制同时按键个数
    if (chordLimitEnabled) {
        pipeline.push(new passes.ChordNoteCountLimitPass({
            maxNoteCount: maxSimultaneousNoteCount,
            limitMode: noteCountLimitMode,
            splitDelay: noteCountLimitSplitDelay,
            selectMode: chordSelectMode,
        }));
    }
    //添加歌词
    const lrcPath = musicDir + rawFileName + ".lrc";
    if (files.exists(lrcPath)) {
        const lrcStr = files.read(lrcPath);
        const lrc = new LrcParser().parseFromString(lrcStr);
        console.log("加载了" + lrc.length + "行歌词");
        pipeline.push(new passes.BindLyricsPass({
            lyrics: lrc,
            useStoredOriginalTime: true
        }));
    }
    //转换为按键
    pipeline.push(new passes.NoteToKeyPass({
        currentGameProfile: gameProfile
    }));

    const sequential = new passes.SequentialPass({
        passes: pipeline
    });

    const data = sequential.run(musicDir + fileName, (progress, desc) => {
        progressDialog.setProgress(progress);
        progressDialog.setContent(desc + "...");
    });

    const stats = sequential.getStatistics();
    console.log(JSON.stringify(stats));
    const packedKeyList = noteUtils.packNotes(data)

    if (loadType != MusicLoaderDataType.GestureSequence) {
        //如果是导出乐谱,则不需要生成手势
        progressDialog.dismiss();
        return {
            packedKeyList: packedKeyList,
            summary: ""
        }
    }

    const finalNoteCnt = data.length;
    //生成手势
    progressDialog.setContent("生成手势...");
    const gestureTimeList = new passes.KeyToGesturePass({
        currentGameProfile: gameProfile,
        durationMode: noteDurationOutputMode,
        maxGestureDuration: maxGestureDuration,
        marginDuration: marginDuration,
        pressDuration: defaultClickDuration,
    }).run(data);
    progressDialog.dismiss();

    //数据汇总
    const inputNoteCnt = stats.ParseSourceFilePass.totalNoteCnt;
    const overFlowedNoteCnt = stats.LegalizeTargetNoteRangePass.overFlowedNoteCnt;
    const underFlowedNoteCnt = stats.LegalizeTargetNoteRangePass.underFlowedNoteCnt;
    const roundedNoteCnt = stats.LegalizeTargetNoteRangePass.roundedNoteCnt;
    const droppedNoteCnt = stats.SingleKeyFrequencyLimitPass.droppedNoteCnt;
    const outRangedNoteCnt = overFlowedNoteCnt + underFlowedNoteCnt;

    const statString = "音符总数:" + inputNoteCnt + " -> " + finalNoteCnt +
        "\n超出范围被丢弃的音符数:" + outRangedNoteCnt + "" + " (+" + overFlowedNoteCnt + ", -" + underFlowedNoteCnt + ")(" + (outRangedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
        "\n被取整的音符数:" + roundedNoteCnt + " (" + (roundedNoteCnt / inputNoteCnt * 100).toFixed(2) + "%)" +
        "\n过于密集被丢弃的音符数:" + droppedNoteCnt + " (" + (droppedNoteCnt / finalNoteCnt * 100).toFixed(2) + "%)" +
        "\n(如果被取整的音符数过多, 请在菜单中选择自动调整)";
    const estimatedKey = midiPitch.getTranspositionEstimatedKey(minorPitchOffset);
    const hintString = `估计乐曲调号: ${estimatedKey}\n` + gameProfile.getGameSpecificHintByEstimatedKey(estimatedKey);

    dialogs.alert("乐曲信息", statString + "\n\n" + hintString);
    return {
        packedKeyList: packedKeyList,
        gestureList: gestureTimeList,
        summary: statString
    }
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