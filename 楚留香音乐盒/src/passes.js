//@ts-check
// passes.js 

var MusicFormats = require("./musicFormats.js");
var Humanifyer = require("./humanify.js");
var GameProfile = require("./gameProfile.js");
var Algorithms = require("./algorithms.js");

var noteUtils = require("./noteUtils.js");

/**
 * @brief 什么都不做的pass, 把输入原样输出, 也不会产生任何统计数据
 * @param {Object} config
 */
function NopPass(config) {
    this.name = "NopPass";
    this.description = "空操作";
    /**
     * 运行此pass
     * @template T
     * @param {T} input - 输入数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {T} - 返回原样的输入数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (input, progressCallback) {
        return input;
    }
    this.getStatistics = function () {
        return {};
    }
}


/**
 * @brief 根据源文件路径解析音乐文件, 输出音乐数据
 * @param {Object} config
 */
function ParseSourceFilePass(config) {
    this.name = "ParseSourceFilePass";
    this.description = "解析源文件";

    /**
     * 运行此pass
     * @param {string} sourceFilePath - 源文件路径
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {MusicFormats.TracksData} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (sourceFilePath, progressCallback) {
        let musicFormats = new MusicFormats();
        let tracksData = musicFormats.parseFile(sourceFilePath);
        return tracksData;
    }

    this.getStatistics = function () {
        return {};
    }

}

/**
 * @brief 合并指定的音轨中所有音符到一个音符数组中
 * @typedef {Object} MergeTracksPassConfig
 * @property {number[]} selectedTracks - 要合并的音轨序号数组
 * @param {MergeTracksPassConfig} config
 */
function MergeTracksPass(config) {
    this.name = "MergeTracksPass";
    this.description = "合并音轨";

    let selectedTracks = [];

    if (config.selectedTracks == null) {
        throw new Error("selectedTracks is null");
    }
    selectedTracks = config.selectedTracks;

    /**
     * 运行此pass
     * @param {MusicFormats.TracksData} tracksData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.Note[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (tracksData, progressCallback) {
        let noteData = [];
        for (let i = 0; i < selectedTracks.length; i++) {
            let sel = selectedTracks[i];
            let track = tracksData[sel];
            noteData = noteData.concat(track.notes);
        }
        noteData.sort(function (a, b) {
            return a[1] - b[1];
        });
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 将输入的音符数据的时间添加一个随机偏移, 以模拟手工输入
 * @typedef {Object} HumanifyPassConfig
 * @property {number} noteAbsTimeStdDev - 音符时间的标准差(毫秒)
 * @param {HumanifyPassConfig} config
 */
function HumanifyPass(config) {
    this.name = "HumanifyPass";
    this.description = "伪装手工输入";

    let noteAbsTimeStdDev = 0;

    if (config.noteAbsTimeStdDev == null) {
        throw new Error("noteAbsTimeStdDev is null");
    }
    noteAbsTimeStdDev = config.noteAbsTimeStdDev;
    /**
     * 运行此pass
     * @param {noteUtils.Note[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.Note[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        let humanifyer = new Humanifyer();
        humanifyer.setNoteAbsTimeStdDev(noteAbsTimeStdDev);
        noteData = humanifyer.humanify(noteData);
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 将音符数组转换为对应游戏的按键数组
 * @typedef {Object} NoteToKeyPassConfig
 * @property {number} majorPitchOffset - 音符的八度偏移量
 * @property {number} minorPitchOffset - 音符的半音偏移量
 * @property {boolean} treatHalfAsCeiling - 是否将半音视为最接近的全音中更高的那个, 如果为false则视为更低的那个
 * @property {GameProfile} currentGameProfile - 当前游戏配置
 * @param {NoteToKeyPassConfig} config
 */
function NoteToKeyPass(config) {
    this.name = "NoteToKeyPass";
    this.description = "将音符转换为按键";

    let majorPitchOffset = 0;
    let minorPitchOffset = 0;
    let treatHalfAsCeiling = false;
    let currentGameProfile = null;

    let underFlowedNoteCnt = 0;
    let overFlowedNoteCnt = 0;
    let roundedNoteCnt = 0;
    let middleFailedNoteCnt = 0;


    if (config.majorPitchOffset == null) {
        throw new Error("majorPitchOffset is null");
    }
    if (config.minorPitchOffset == null) {
        throw new Error("minorPitchOffset is null");
    }
    if (config.treatHalfAsCeiling == null) {
        throw new Error("treatHalfAsCeiling is null");
    }
    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    majorPitchOffset = config.majorPitchOffset;
    minorPitchOffset = config.minorPitchOffset;
    treatHalfAsCeiling = config.treatHalfAsCeiling;
    currentGameProfile = config.currentGameProfile;

    /**
     * @param {Number} midiPitch
     * @abstract 将midi音高转换为按键编号(从1开始)
     * @return {Number} 按键序号(从1开始)或-1
     */
    function midiPitch2key(midiPitch) {
        midiPitch += majorPitchOffset * 12;
        midiPitch += minorPitchOffset;
        let key = currentGameProfile.getKeyByPitch(midiPitch);
        if (key == -1) {
            let noteRange = currentGameProfile.getNoteRange();
            if (midiPitch < noteRange[0]) {
                underFlowedNoteCnt++;
                return -1;
            }
            if (midiPitch > noteRange[1]) {
                overFlowedNoteCnt++;
                return -1;
            }
            if (treatHalfAsCeiling) {
                key = currentGameProfile.getKeyByPitch(midiPitch + 1);
            } else {
                key = currentGameProfile.getKeyByPitch(midiPitch - 1);
            }
            if (key == -1) {
                return -1;
            }
            roundedNoteCnt++;
        }
        return key;
    };

    /**
     * 运行此pass
     * @param {noteUtils.Note[]} noteList - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.Key[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteList, progressCallback) {
        let keyList = [];
        for (let i = 0; i < noteList.length; i++) {
            let key = midiPitch2key(noteList[i][0]);
            if (key == -1) {
                continue;
            }
            keyList.push([key, noteList[i][1],noteList[i][2]]);
            if (progressCallback != null && i % 10 == 0) {
                progressCallback(100 * i / noteList.length);
            }
        }
        // @ts-ignore
        return keyList;
    }
    this.getStatistics = function () {
        return {
            "underFlowedNoteCnt": underFlowedNoteCnt,
            "overFlowedNoteCnt": overFlowedNoteCnt,
            "roundedNoteCnt": roundedNoteCnt,
            "middleFailedNoteCnt": middleFailedNoteCnt
        };
    }
}

/**
 * @brief 限制同一按键的最高频率, 删除超过频率的音符
 * @typedef {Object} SingleKeyFrequencyLimitPassConfig
 * @property {number} minInterval - 最小间隔(毫秒)
 * @param {SingleKeyFrequencyLimitPassConfig} config
 */
function SingleKeyFrequencyLimitPass(config) {
    this.name = "SingleKeyFrequencyLimitPass";
    this.description = "限制单个按键频率";

    let minInterval = 0; // 毫秒

    let droppedNoteCnt = 0;

    if (config.minInterval == null) {
        throw new Error("minInterval is null");
    }
    minInterval = config.minInterval;
    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        const sameNoteGapMin = minInterval;
        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            let j = i + 1;
            while (j < noteData.length) {
                let nextNote = noteData[j];
                if (note[0] === -1) {
                    j++;
                    continue;
                }
                if (note[0] === nextNote[0]) {
                    if (nextNote[1] - note[1] < sameNoteGapMin) {
                        noteData.splice(j, 1);
                        //console.log("删除过于密集的音符:" + nextNote[0] + "(diff:" + (nextNote[1] - note[1]) + ")");
                        droppedNoteCnt++;
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
    this.getStatistics = function () {
        return {
            "droppedNoteCnt": droppedNoteCnt
        };
    }
}


/**
 * @brief 合并相同时间按下的按键
 * @typedef {Object} MergeKeyPassConfig
 * @property {number} maxInterval - 最大间隔(毫秒)
 * @property {number} [maxBatchSize] - 最大合并数量, 默认为10
 * @param {MergeKeyPassConfig} config
 */
function MergeKeyPass(config) {
    this.name = "MergeKeyPass";
    this.description = "合并相邻的按键";

    let maxInterval = 0; // 毫秒
    let maxBatchSize = 10; // 最大合并数量

    if (config.maxInterval == null) {
        throw new Error("maxInterval is null");
    }
    maxInterval = config.maxInterval;
    if (config.maxBatchSize != null) {
        maxBatchSize = config.maxBatchSize;
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        let lastTime = noteData[0][1];
        let lastSize = 0;
        let lastNotes = new Array(maxBatchSize);
        for (let i = 1; i < noteData.length; i++) {
            let note = noteData[i];
            if (note[1] - lastTime < maxInterval && lastSize < maxBatchSize) {
                note[1] = lastTime;
                //检查重复
                if(lastNotes.indexOf(note[0]) != -1){
                    noteUtils.softDeleteNoteAt(noteData,i);
                    continue;
                }
                lastNotes.push(note[0]);
                lastSize++;
            } else {
                lastNotes = new Array(maxBatchSize);
                lastSize = 0;
                lastTime = note[1];
            }
        }
        noteUtils.applyChanges(noteData);
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 将按键列表转换为手势列表
 * @typedef {Object} KeyToGesturePassConfig
 * @property {number} [pressDuration] - 按键持续时间(毫秒)
 * @property {GameProfile} currentGameProfile - 当前游戏配置
 * @param {KeyToGesturePassConfig} config
 */
function KeyToGesturePass(config) {
    this.name = "KeyToGesturePass";
    this.description = "将按键列表转换为手势列表";

    let pressDuration = 5; // 毫秒
    let currentGameProfile = null;


    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    currentGameProfile = config.currentGameProfile;
    if (config.pressDuration != null) {
        pressDuration = config.pressDuration;
    }
    /**
     * 运行此pass
     * @param {noteUtils.Key[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {import("./players.js").Gestures} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        let gestureTimeList = new Array();
        let it = noteUtils.chordIterator(noteData);
        for (let keys of it) {
            let time = keys[0][1];
            let gestureArray = new Array();
            keys.forEach((key) => {
                const keyIndex = key[0]
                const clickPos = currentGameProfile.getKeyPosition(keyIndex);
                if (clickPos == null) {
                    console.log(`按键 ${keyIndex} 超出范围，被丢弃`);
                    return;
                }
                gestureArray.push([0, pressDuration, clickPos.slice()]);
            });
            gestureTimeList.push([gestureArray, time / 1000]);
        };
        return gestureTimeList;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 限制过长的空白部分的长度，删除过长的空白部分
 * @typedef {Object} LimitBlankDurationPassConfig
 * @property {number} [maxBlankDuration] - 最大空白时间(毫秒), 默认为5000
 * @param {LimitBlankDurationPassConfig} config
 */
function LimitBlankDurationPass(config) {
    this.name = "LimitBlankDurationPass";
    this.description = "限制过长的空白部分的长度";

    let maxBlankDuration = 5000; // 毫秒

    if (config.maxBlankDuration != null) {
        maxBlankDuration = config.maxBlankDuration;
    }
    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        noteData = noteUtils.toRelativeTime(noteData);
        for (let i = 0; i < noteData.length; i++) {
            if (noteData[i][1] > maxBlankDuration) 
                noteData[i][1] = maxBlankDuration;
        }
        noteData = noteUtils.toAbsoluteTime(noteData);
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 跳过前奏的空白部分
 * @typedef {Object} SkipIntroPassConfig
 * @param {SkipIntroPassConfig} config
 */
function SkipIntroPass(config) {
    this.name = "SkipIntroPass";
    this.description = "跳过前奏的空白部分";

    const maxIntroTime = 2000; // 毫秒

    /**
     * 运行此pass
     * @template T
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        let introTime = noteData[0][1];
        if (introTime < maxIntroTime) return noteData;
        let deltaTime = introTime - maxIntroTime;
        for (let i = 0; i < noteData.length; i++) {
            noteData[i][1] -= deltaTime;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 限制音符频率，延迟过快的音符
 * @typedef {Object} NoteFrequencySoftLimitPassConfig
 * @property {number} [minInterval] - 最小间隔(毫秒), 默认为150
 * @param {NoteFrequencySoftLimitPassConfig} config
 */
function NoteFrequencySoftLimitPass(config) {
    this.name = "NoteFrequencySoftLimitPass";
    this.description = "限制音符频率";

    let minInterval = 150; // 毫秒

    if (config.minInterval != null) {
        minInterval = config.minInterval;
    }

    function saturationMap(freq) {
        return (1000 / minInterval) * Math.tanh(freq / (1000 / minInterval));
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回解析后的数据
     * @throws {Error} - 如果解析失败则抛出异常
     */
    this.run = function (noteData, progressCallback) {
        let freqs = new Array();
        for (let i = 0; i < noteData.length - 1; i++) {
            let deltaTime = noteData[i + 1][1] - noteData[i][1];
            freqs.push(1000 / deltaTime);
        }
        for (let i = 0; i < freqs.length; i++) {
            freqs[i] = saturationMap(freqs[i]);
        }
        for (let i = 0; i < noteData.length - 1; i++) {
            let deltaTime = 1000 / freqs[i];
            noteData[i + 1][1] = noteData[i][1] + deltaTime;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 变速
 * @typedef {Object} SpeedChangePassConfig
 * @property {number} speed - 变速倍率
 * @param {SpeedChangePassConfig} config
 */
function SpeedChangePass(config) {
    this.name = "SpeedChangePass";
    this.description = "变速";

    let speed = 1;

    if (config.speed == null) {
        throw new Error("speed is null");
    }
    speed = config.speed;

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回处理后的数据
     */
    this.run = function (noteData, progressCallback) {
        for (let i = 0; i < noteData.length; i++) {
            noteData[i][1] /= speed;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

/**
 * @brief 限制同一时刻按下的按键数量
 * @typedef {Object} ChordNoteCountLimitPassConfig
 * @property {number} [maxNoteCount] - 最大音符个数, 默认为9
 * @property {string} [limitMode] - 限制模式, 可选值为"delete"(删除多余的音符)或"split"(拆分成多组), 默认为"delete"
 * @property {number} [splitDelay] - 拆分后音符的延迟(毫秒), 仅在limitMode为"split"时有效, 默认为5
 * @property {string} [selectMode] - 选择保留哪些音符, 可选值为"high"(音高最高的)/"low"(音高最低的)/"random"(随机选择), 默认为“high"
 * @property {number} [randomSeed] - 随机种子, 默认为74751
 * @param {ChordNoteCountLimitPassConfig} config
 */
function ChordNoteCountLimitPass(config) {
    this.name = "ChordNoteCountLimitPass";
    this.description = "限制同一时刻按下的按键数量";

    let maxNoteCount = 9;
    let limitMode = "delete";
    let splitDelay = 5;
    let selectMode = "high";
    let randomSeed = 74751;

    if (config.maxNoteCount != null) {
        maxNoteCount = config.maxNoteCount;
    }
    if (config.limitMode != null) {
        limitMode = config.limitMode;
    }
    if (config.splitDelay != null) {
        splitDelay = config.splitDelay;
    }
    if (config.selectMode != null) {
        selectMode = config.selectMode;
    }
    if (config.randomSeed != null) {
        randomSeed = config.randomSeed;
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回处理后的数据
     */
    this.run = function (noteData, progressCallback) {
        const algorithms = new Algorithms();
        const prng = algorithms.PRNG(randomSeed);
        const totalLength = noteData.length;
        let i = 0;
        while(true){
            let ni = noteUtils.nextChordStart(noteData,i);
            if(ni == noteData.length) break;
            let chord = noteData.subarray(i, ni - 1);
            if (chord.length > maxNoteCount) {
                switch (selectMode) {
                    case "high": //从高到低排序
                        chord.sort((a, b) => b[0] - a[0]);
                        break;
                    case "low": //
                        chord.sort((a, b) => a[0] - b[0]);
                        break;
                    case "random":
                        chord = algorithms.shuffle(chord, prng);
                        break;
                }

                for (let j = maxNoteCount; j < chord.length; j++) {
                    if (limitMode == "delete") {
                        noteUtils.softDeleteNoteAt(noteData, i + j);
                    } else if (limitMode == "split") {
                        noteUtils.softChangeNoteTime(chord[j], chord[j][1] + splitDelay * (j - maxNoteCount + 1));
                    }
                }
            }
            i = ni;
        }
        noteUtils.applyChanges(noteData);
        noteData.sort((a, b) => a[1] - b[1]);
        return noteData;
    }
    this.getStatistics = function () {
        return {};
    }
}

function Passes() {
    this.passes = new Array();
    this.passes.push(NopPass);
    this.passes.push(ParseSourceFilePass);
    this.passes.push(MergeTracksPass);
    this.passes.push(HumanifyPass);
    this.passes.push(NoteToKeyPass);
    this.passes.push(SingleKeyFrequencyLimitPass);
    this.passes.push(MergeKeyPass);
    this.passes.push(KeyToGesturePass);
    this.passes.push(LimitBlankDurationPass);
    this.passes.push(SkipIntroPass);
    this.passes.push(NoteFrequencySoftLimitPass);
    this.passes.push(SpeedChangePass);
    this.passes.push(ChordNoteCountLimitPass);

    this.getPassByName = function (name) {
        for (let i = 0; i < this.passes.length; i++) {
            if (this.passes[i].name === name) {
                return this.passes[i];
            }
        }
        return null;
    }
}

module.exports = Passes;

