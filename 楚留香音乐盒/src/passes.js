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
     * @param {function(number):void} [progressCallback] - 进度回调函数, 参数为进度(0-100)
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
     * @param {function(number):void} [progressCallback] - 进度回调函数, 参数为进度(0-100)
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
     * @param {function(number):void} [progressCallback] - 进度回调函数, 参数为进度(0-100)
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
 * @enum {number}
 * @constant
 */
var SemiToneRoundingMode = {
    //取较低的音符
    floor: 0,
    //取较高的音符
    ceil: 1,
    //删除音符
    drop: 2,
    //同时取较低和较高的音符
    both: 3
}

/**
 * @brief 将音符数组转换为对应游戏的按键数组
 * @typedef {Object} NoteToKeyPassConfig
 * @property {number} majorPitchOffset - 音符的八度偏移量
 * @property {number} minorPitchOffset - 音符的半音偏移量
 * @property {SemiToneRoundingMode} semiToneRoundingMode - 半音处理方式
 * @property {GameProfile} currentGameProfile - 当前游戏配置
 * @param {NoteToKeyPassConfig} config
 */
function NoteToKeyPass(config) {
    this.name = "NoteToKeyPass";
    this.description = "将音符转换为按键";

    let majorPitchOffset = 0;
    let minorPitchOffset = 0;
    let semiToneRoundingMode = SemiToneRoundingMode.floor;
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
    if (config.semiToneRoundingMode == null) {
        throw new Error("semiToneRoundingMode is null");
    }
    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    majorPitchOffset = config.majorPitchOffset;
    minorPitchOffset = config.minorPitchOffset;
    semiToneRoundingMode = config.semiToneRoundingMode;
    currentGameProfile = config.currentGameProfile;

    /**
     * @param {Number} midiPitch
     * @abstract 将midi音高转换为按键编号(从1开始)
     * @return {[Number, Number]} 按键序号(从1开始)或-1
     */
    function midiPitch2key(midiPitch) {
        midiPitch += majorPitchOffset * 12;
        midiPitch += minorPitchOffset;
        let key = currentGameProfile.getKeyByPitch(midiPitch);
        let key2 = -1;
        if (key == -1) {
            let noteRange = currentGameProfile.getNoteRange();
            if (midiPitch < noteRange[0]) {
                underFlowedNoteCnt++;
                return [-1, -1];
            }
            if (midiPitch > noteRange[1]) {
                overFlowedNoteCnt++;
                return [-1, -1];
            }
            switch (semiToneRoundingMode) {
                case SemiToneRoundingMode.ceil:
                    key = currentGameProfile.getKeyByPitch(midiPitch + 1);
                    break;
                case SemiToneRoundingMode.floor:
                    key = currentGameProfile.getKeyByPitch(midiPitch - 1);
                    break;
                case SemiToneRoundingMode.drop:
                default:
                    key = -1;
                    break;
                case SemiToneRoundingMode.both:
                    key = currentGameProfile.getKeyByPitch(midiPitch - 1);
                    if(key == -1) //保证第一个按键不为空
                        key = currentGameProfile.getKeyByPitch(midiPitch + 1);
                    else
                        key2 = currentGameProfile.getKeyByPitch(midiPitch + 1);
                    break;
            }
            if (key == -1) {
                return [-1, -1];
            }
            roundedNoteCnt++;
        }
        return [key, key2];
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
            let [key, optionalKey] = midiPitch2key(noteList[i][0]);
            if (key == -1) {
                continue;
            }
            keyList.push([key, noteList[i][1], noteList[i][2]]);
            if (optionalKey != -1) {
                //TODO: 复制了一份属性，未来可能会有问题
                keyList.push([optionalKey, noteList[i][1], noteList[i][2]]);
            }
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
 * @property {GameProfile.NoteDurationImplementionType} [durationMode] - 按键时长模式, 默认为"none"
 * @property {number} [pressDuration] - 默认的按键持续时间(毫秒), 仅在durationMode为"none"时有效, 默认为5
 * @property {number} [maxGestureDuration] - 最大手势持续时间(毫秒)
 * @property {number} [maxGestureSize] - 最大手势长度
 * @property {number} [marginDuration] - 手势间隔时间(毫秒), 仅在durationMode为"native"时有效, 默认为100
 * @property {GameProfile} currentGameProfile - 当前游戏配置
 * @param {KeyToGesturePassConfig} config
 */
function KeyToGesturePass(config) {
    this.name = "KeyToGesturePass";
    this.description = "将按键列表转换为手势列表";

    let pressDuration = 5; // 毫秒
    let durationMode = "none";
    let maxGestureDuration = 10000; // 毫秒
    let maxGestureSize = 19;
    let marginDuration = 100; // 毫秒
    let currentGameProfile = null;


    if (config.currentGameProfile == null) {
        throw new Error("currentGameProfile is null");
    }
    
    currentGameProfile = config.currentGameProfile;
    if (config.pressDuration != null)
        pressDuration = config.pressDuration;
    if (config.durationMode != null)
        durationMode = config.durationMode;
    if (config.maxGestureDuration != null)
        maxGestureDuration = config.maxGestureDuration;
    if (config.maxGestureSize != null)
        maxGestureSize = config.maxGestureSize;
    if (config.marginDuration != null)
        marginDuration = config.marginDuration;

    //统计数据
    let directlyTruncatedNoteCnt = 0;
    let groupTruncatedNoteCnt = 0;
    let sameKeyTruncatedNoteCnt = 0;
    let removedShortNoteCnt = 0;


    /**
     * 运行此pass
     * @param {noteUtils.Key[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {import("./players.js").Gestures} - 返回解析后的数据
     */
    this.run = function (noteData, progressCallback) {
        let haveDurationProperty = noteData[0][2] != null && noteData[0][2]["duration"] != null;
        let gestureTimeList = new Array();
        console.log(`durationMode: ${durationMode}`);
        if (durationMode == "none" || !haveDurationProperty) {
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
                if(gestureArray.length > 0)
                 gestureTimeList.push([gestureArray, time]);
            };
        } else if (durationMode == "native") {
            // 这组按键的结束时间
            let currentGroupEndTime = 0;
            // 这组按键的开始时间
            let currentGroupStartTime = 0;

            // 这组按键的按键列表
            /** @type {Array<[keyIndex:number, startTime:number, endTime:number]>} */
            let currentGroupKeys = new Array();
            // 组列表
            let groupList = new Array();
            for (let key of noteData) {
                // console.log(`key: ${JSON.stringify(key)}`);
                let thisStartTime = key[1];
                //@ts-ignore
                let thisDuration = key[2]["duration"];
                let thisEndTime = thisStartTime + thisDuration;
                //截断超过最大手势长度的部分
                if (thisEndTime - currentGroupStartTime > maxGestureDuration) {
                    thisEndTime = currentGroupStartTime + maxGestureDuration;
                    directlyTruncatedNoteCnt++;
                }
                //这是这组按键的第一个按键
                if (currentGroupKeys.length == 0) {
                    currentGroupStartTime = thisStartTime;
                    currentGroupEndTime = thisEndTime;
                    currentGroupKeys.push([key[0], thisStartTime, thisEndTime]);
                    continue;
                }
                //检查是否要开始新的一组
                //这个按键的开始时间大于这组按键的结束时间, 或当前组按键数量已经达到最大值
                //则开始新的一组
                 if (thisStartTime > currentGroupEndTime ||
                    currentGroupKeys.length >= maxGestureSize) {
                    // console.log(`start: ${currentGroupStartTime}ms, end: ${currentGroupEndTime}ms, current: ${thisStartTime}ms, duration: ${currentGroupEndTime - currentGroupStartTime}ms`);
                    //截断所有的音符结束时间到当前音符开始时间 TODO: 这不是最优解
                    for (let i = 0; i < currentGroupKeys.length; i++) {
                        let key = currentGroupKeys[i];
                        if(key[2] > thisStartTime){
                            groupTruncatedNoteCnt++;
                            key[2] = thisStartTime;
                        }
                    }
                    //避免首尾相连
                    for (let i = 0; i < currentGroupKeys.length; i++) {
                        let key = currentGroupKeys[i];
                        if (Math.abs(key[2] - thisStartTime) < marginDuration) {
                            key[2] = thisStartTime - marginDuration;
                        }
                    }
                    groupList.push(currentGroupKeys);
                    currentGroupKeys = new Array();
                }
                //这是这组按键的第一个按键
                if (currentGroupKeys.length == 0) {
                    currentGroupStartTime = thisStartTime;
                    currentGroupEndTime = thisEndTime;
                    currentGroupKeys.push([key[0], thisStartTime, thisEndTime]);
                    continue;
                }
                //检查是否与相同的按键重叠
                let overlappedSamekeyIndex = currentGroupKeys.findIndex((e) => {
                    return e[0] == key[0] && e[2] > thisStartTime;
                });
                if (overlappedSamekeyIndex != -1) {
                    //把重叠的按键截断
                    let overlappedSamekey = currentGroupKeys[overlappedSamekeyIndex];
                    overlappedSamekey[2] = thisStartTime - marginDuration;
                    sameKeyTruncatedNoteCnt++;
                }
                //检测是否存在头尾相连的问题(一个按键的尾部正好与另一个按键的头部相连, 会导致systemUi崩溃!)
                for (let i = 0; i < currentGroupKeys.length; i++) {
                    let key = currentGroupKeys[i];
                    if (Math.abs(key[2] - thisStartTime) < marginDuration) {
                        key[2] = thisStartTime - marginDuration;
                    }
                }
                //添加这个按键
                currentGroupKeys.push([key[0], thisStartTime, thisEndTime]);
            }
            if(currentGroupKeys.length > 0) groupList.push(currentGroupKeys);
            //转换为手势
            for (let group of groupList) {
                /** @type {Array <[delay: number, duration: number, pos: [x: number,y: number]]>} */
                let gestureArray = new Array();
                let groupStartTime = group[0][1];
                for (let key of group) {
                    let delay = key[1] - groupStartTime;
                    let duration = key[2] - key[1];
                    if (duration < pressDuration) {
                        removedShortNoteCnt++;
                        continue; //忽略持续时间过短的按键
                    }
                    let clickPos = currentGameProfile.getKeyPosition(key[0]);
                    if (clickPos == null) {
                        console.log(`按键 ${key[0]} 超出范围，被丢弃`);
                        continue;
                    }
                    gestureArray.push([delay, duration, clickPos.slice()]);
                }
                if (gestureArray.length > 0)
                    gestureTimeList.push([gestureArray, groupStartTime]);
            }
        }
        return gestureTimeList;
    }

    this.getStatistics = function () {
        return {
            "directlyTruncatedNoteCnt": directlyTruncatedNoteCnt,
            "groupTruncatedNoteCnt": groupTruncatedNoteCnt,
            "sameKeyTruncatedNoteCnt": sameKeyTruncatedNoteCnt,
            "removedShortNoteCnt": removedShortNoteCnt
        };
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
     * @param {function(number):void} [progressCallback] - 进度回调函数, 参数为进度(0-100)
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

/**
 * @brief 将连续出现的同一音符合并为一个长音符
 * @typedef {Object} FoldFrequentSameNotePassConfig
 * @property {number} [maxInterval] - 最大间隔(毫秒), 默认为150
 * @param {FoldFrequentSameNotePassConfig} config
 */
function FoldFrequentSameNotePass(config) {
    this.name = "FoldFrequentSameNotePass";
    this.description = "将连续出现的同一音符合并为一个长音符";

    let maxInterval = 150; // 毫秒

    if (config.maxInterval != null) {
        maxInterval = config.maxInterval;
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 迦度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回处理后的数据
     */
    this.run = function (noteData, progressCallback) {
        let i = 0;
        while (i < noteData.length - 1) {
            let targetNoteIndexList = new Array();
            targetNoteIndexList.push(i);
            let lastNoteStartTime = noteData[i][1];
            let j = i + 1;
            while (j < noteData.length && noteData[j][1] - lastNoteStartTime < maxInterval) {
                if (noteData[j][0] === noteData[i][0]) {
                    targetNoteIndexList.push(j);
                    lastNoteStartTime = noteData[j][1];
                }
                j++;
            }
            if (targetNoteIndexList.length > 1) {
                let startTime = noteData[targetNoteIndexList[0]][1];
                let endTime = noteData[targetNoteIndexList[targetNoteIndexList.length - 1]][1];
                let key = noteData[targetNoteIndexList[0]][0];
                let attrs0 = Object.assign({}, noteData[targetNoteIndexList[0]][2]);
                for (let i of targetNoteIndexList) {
                    noteUtils.softDeleteNoteAt(noteData, i);
                }
                let newNote = [key, startTime,attrs0];
                newNote[2]["duration"] = endTime - startTime;
                noteUtils.applyChanges(noteData);
                //@ts-ignore
                noteData.splice(targetNoteIndexList[0], 0, newNote);
            }
            i++;
        }
        return noteData;
    }

    this.getStatistics = function () {};
}

/**
 * @brief 将长音符拆分为多个短音符
 * @typedef {Object} SplitLongNotePassConfig
 * @property {number} [minDuration] - 视为长音符的最小持续时间(毫秒), 默认为500
 * @property {number} [splitDuration] - 拆分后音符的持续时间(毫秒), 默认为100 //即拆分为多个100ms的音符
 * @param {SplitLongNotePassConfig} config
 */
function SplitLongNotePass(config) {
    this.name = "SplitLongNotePass";
    this.description = "将长音符拆分为多个短音符";

    let minDuration = 500; // 毫秒
    let splitDuration = 100; // 毫秒

    if (config.minDuration != null) {
        minDuration = config.minDuration;
    }
    if (config.splitDuration != null) {
        splitDuration = config.splitDuration;
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData - 音乐数据
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回处理后的数据
     */
    this.run = function (noteData, progressCallback) {
        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            if (note[2] != null && note[2]["duration"] != null && note[2]["duration"] >= minDuration) {
                let startTime = note[1];
                let endTime = startTime + note[2]["duration"];
                let key = note[0];
                for (let t = startTime + splitDuration; t < endTime; t += splitDuration) {
                    let newNote = [key, t, {}];
                    newNote[2]["duration"] = splitDuration;
                    //@ts-ignore
                    noteData.splice(i + 1, 0, newNote);
                }
                note[2]["duration"] = splitDuration;
            }
        }
        noteData.sort((a, b) => a[1] - b[1]);
        return noteData;
    }
}

/**
 * @brief 估计音符的持续时间, 目前是简单地取音符之间的间隔作为持续时间
 * @typedef {Object} EstimateNoteDurationPassConfig
 * @property {number} [multiplier] - 时间倍率, 默认为0.75, 即这个音符的持续时间为到下一个音符的时间间隔的0.75倍
 * @param {EstimateNoteDurationPassConfig} config
 */
function EstimateNoteDurationPass(config) {
    this.name = "EstimateNoteDurationPass";
    this.description = "估计音符的持续时间";

    let multiplier = 0.75;

    if (config.multiplier != null) {
        multiplier = config.multiplier;
    }

    /**
     * 运行此pass
     * @param {noteUtils.NoteLike[]} noteData
     * @param {function(number):void} [progressCallback] - 进度回调函数, 参数为进度(0-100)
     * @returns {noteUtils.NoteLike[]} - 返回处理后的数据
     */
    this.run = function (noteData, progressCallback) {
        let i = 0;
        while (true) {
            let ni = noteUtils.nextChordStart(noteData, i);
            if (ni == noteData.length) break;
            //@ts-ignore
            let chord = noteData.subarray(i, ni - 1);
            let deltaTime = noteData[ni][1] - noteData[i][1];
            for (let note of chord) {
                if (note[2]["duration"] == undefined) {
                    note[2]["duration"] = deltaTime * multiplier;
                }
            }
            i = ni;
        }
        return noteData;
    }

    this.getStatistics = function () {
        return {};
    }
}



// /**
//  * @brief 随机添加漏音/按错按键/不小心碰到别的按键的情况, 伪装手工输入
//  * @typedef {Object} RandomErrorPassConfig
//  * @property {number} [missRate] - 漏音概率(0-1), 默认为0
//  * @property {number} [wrongRate] - 按错概率(0-1), 默认为0
//  * @property {number} [extraRate] - 多按概率(0-1), 默认为0 //即随机插入额外的按键
//  * @property {number} [rollBackMs] - 回滚长度(毫秒), 默认为0 //发生错误时退回到之前一段时间重新弹
//  * @property {number} [rollBackProb] - 回滚概率(0-1), 默认为0.8 
//  * @property {number} [randomSeed] - 随机种子, 默认为74751
//  * @property {boolean} [freqAware] - 是否根据音符频率调整错误率(即弹得越快越容易出错), 默认为true
//  * @property {GameProfile} gameProfile - 游戏配置
//  * @param {RandomErrorPassConfig} config
//  */
// function RandomErrorPass(config) {
//     this.name = "RandomErrorPass";
//     this.description = "随机添加漏音/按错按键/不小心碰到别的按键的情况, 伪装手工输入";

//     const maxWeight = 10; // 单个音符的最大权重限制
//     const nullKey = -1; // 空按键

//     let missRate = 0;
//     let wrongRate = 0;
//     let extraRate = 0;
//     let rollBackMs = 0;
//     let rollBackProb = 0.8;
//     let randomSeed = 74751;
//     let freqAware = true;
//     /** @type {GameProfile| null} */
//     let gameProfile = null;

//     if (config.missRate != null) missRate = config.missRate;
//     if (config.wrongRate != null) wrongRate = config.wrongRate;
//     if (config.extraRate != null) extraRate = config.extraRate;
//     if (config.rollBackMs != null) rollBackMs = config.rollBackMs;
//     if (config.rollBackProb != null) rollBackProb = config.rollBackProb;
//     if (config.randomSeed != null) randomSeed = config.randomSeed;
//     if (config.freqAware != null) freqAware = config.freqAware;
//     if (config.gameProfile == null) throw new Error("gameProfile is null");
//     gameProfile = config.gameProfile;

//     /**
//      * @brief 回滚的实现
//      * @param {Array<[key: number[], time: number]>} noteData - 音乐数据
//      */


//     /**
//      * 运行此pass
//      * @param {Array<[key: number[], time: number]>} noteData - 音乐数据
//      * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100)
//      * @returns {Array<[keys: number[], time: number]>} - 返回解析后的数据
//      * @throws {Error} - 如果解析失败则抛出异常
//      */
//     function run(noteData, progressCallback) {
//     }
// }




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
    this.passes.push(FoldFrequentSameNotePass);
    this.passes.push(SplitLongNotePass);
    this.passes.push(EstimateNoteDurationPass);

    this.getPassByName = function (name) {
        for (let i = 0; i < this.passes.length; i++) {
            if (this.passes[i].name === name) {
                return this.passes[i];
            }
        }
        return null;
    }
}

module.exports = {
    NopPass,
    ParseSourceFilePass,
    MergeTracksPass,
    HumanifyPass,
    NoteToKeyPass,
    SingleKeyFrequencyLimitPass,
    MergeKeyPass,
    KeyToGesturePass,
    LimitBlankDurationPass,
    SkipIntroPass,
    NoteFrequencySoftLimitPass,
    SpeedChangePass,
    ChordNoteCountLimitPass,
    FoldFrequentSameNotePass,
    SplitLongNotePass,
    EstimateNoteDurationPass,

    SemiToneRoundingMode,
    
    Passes
}

