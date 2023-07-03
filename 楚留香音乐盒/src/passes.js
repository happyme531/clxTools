//@ts-check
// passes.js 

var MusicFormats = require("./musicFormats.js");
var Humanifyer = require("./humanify.js");

function NopPass(config) {
    this.name = "NopPass";
    this.description = "空操作";
    this.run = function (input, progressCallback) {
        return input;
    }
    this.getStatistics = function () {
        return {};
    }
}


function ParseSourceFilePass(config) {
    this.name = "ParseSourceFilePass";
    this.description = "解析源文件";

    /**
     * 运行此pass
     * @param {string} sourceFilePath - 源文件路径
     * @param {function(number):void} progressCallback - 进度回调函数, 参数为进度(0-100
     * @returns {{
     * "haveMultipleTrack": boolean,
     * "trackCount": number,
     * "tracks": [
     * {
     * "name": string,
     * "noteCount": number,
     * "notes": [[number,number,Object]]
     * }]}} - 返回解析后的数据
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

function MergeTracksPass(config) {
    this.name = "MergeTracksPass";
    this.description = "合并音轨";

    let selectedTracks = [];

    if (config.selectedTracks == null) {
        throw new Error("selectedTracks is null");
    }
    selectedTracks = config.selectedTracks;

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

function HumanifyPass(config) {
    this.name = "HumanifyPass";
    this.description = "伪装手工输入";

    let noteAbsTimeStdDev = 0;

    if (config.noteAbsTimeStdDev == null) {
        throw new Error("noteAbsTimeStdDev is null");
    }
    noteAbsTimeStdDev = config.noteAbsTimeStdDev;

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
     * @param {Array<[Number, Number]>} noteList [midi音高, 开始时间(毫秒)]
     * @param {function(Number):void} progressCallback 进度回调(百分比)
     * @abstract 将音符列表转换为按键列表
     * @return {Array<[Number, Number]>} 按键列表: [按键序号(从1开始), 开始时间(毫秒)]
     */
    this.run = function (noteList, progressCallback) {
        let keyList = [];
        for (let i = 0; i < noteList.length; i++) {
            let key = midiPitch2key(noteList[i][0]);
            if (key == -1) {
                continue;
            }
            keyList.push([key, noteList[i][1]]);
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

function SingleKeyFrequencyLimitPass(config) {
    this.name = "SingleKeyFrequencyLimitPass";
    this.description = "限制单个按键频率";

    let minInterval = 0; // 毫秒

    let droppedNoteCnt = 0;

    if (config.minInterval == null) {
        throw new Error("minInterval is null");
    }
    minInterval = config.minInterval;
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

    this.run = function (noteData, progressCallback) {
        let mergedNoteData = new Array();
        let lastTime = 0;
        let lastNotes = new Set();
        for (let i = 0; i < noteData.length; i++) {
            let note = noteData[i];
            if (note[1] - lastTime < maxInterval && lastNotes.size < maxBatchSize) {
                lastNotes.add(note[0] - 1);
            } else {
                if (lastNotes.size > 0) {
                    mergedNoteData.push([Array.from(lastNotes), lastTime]);
                }
                lastNotes = new Set([note[0] - 1]);
                lastTime = note[1];
            }
        }
        if (lastNotes.size > 0)
            mergedNoteData.push([Array.from(lastNotes), lastTime]);
        return mergedNoteData;
    }

    this.getStatistics = function () {
        return {};
    }
}

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

    this.run = function (noteData, progressCallback) {
        let gestureTimeList = new Array();
        noteData.forEach((note) => {
            let time = note[1];
            let gestureArray = new Array();
            note[0].forEach((key) => {
                let clickPos = currentGameProfile.getKeyPosition(key);
                if (clickPos == null) {
                    console.log("音符超出范围，被丢弃");
                    console.log("key:" + key);
                    return;
                }
                gestureArray.push([0, pressDuration, clickPos]);
            });
            gestureTimeList.push([gestureArray, time/1000]);
        });
        return gestureTimeList;
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

