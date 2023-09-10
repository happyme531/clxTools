
/** @type {{subarray: (i: number, j: number) => any[]}} */
Array.prototype;

/**
 * @brief 获取数组的子数组(引用)
 */
Object.defineProperty(Array.prototype, 'subarray', {
    value: function (/** @type {number} */ i, /** @type {number} */ j) {
        var self = this, arr = [];
        for (var n = 0; i <= j; i++, n++) {
            (function (i) {
                Object.defineProperty(arr, n, {       //Array is an Object
                    get: function () {
                        return self[i];
                    },
                    set: function (value) {
                        self[i] = value;
                        return value;
                    }
                });
            })(i);
        }
        return arr;
    },
    writable: true,
    configurable: true
});

/** 
 * @typedef {[pitch: number, startTime: number, attributes: Object.<string,Object>|undefined]} Note
 * @typedef {[keyIndex: number, startTime: number, attributes: Object.<string,Object>|undefined]} Key // 按键
 * @typedef {Note|Key} NoteLike
 * @typedef {[pitches: number[], startTime: number, attributes: Object.<string,Object>|undefined]} PackedNote
 * @typedef {[keyIndexes: number[], startTime: number, attributes: Object.<string,Object>|undefined]} PackedKey // 按键
 * @typedef {PackedNote|PackedKey} PackedNoteLike
 */

function NoteUtils() {
    /**
     * @brief 将绝对时间的音符数据转换为相对时间的音符数据(每个音符的时间代表与上一个音符的时间差)
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @returns {Array<NoteLike>} - 返回相对时间的音符数据
     */
    this.toRelativeTime = function (noteData) {
        let lastTime = 0;
        for (let i = 0; i < noteData.length; i++) {
            let newTime = noteData[i][1] - lastTime;
            lastTime = noteData[i][1];
            noteData[i][1] = newTime;
        }
        return noteData;
    }

    /**
     * @brief 将相对时间的音符数据转换为绝对时间的音符数据
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @returns {Array<NoteLike>} - 返回绝对时间的音符数据
     */
    this.toAbsoluteTime = function (noteData) {
        let curTime = 0;
        for (let i = 0; i < noteData.length; i++) {
            let newTime = noteData[i][1] + curTime;
            curTime = newTime;
            noteData[i][1] = newTime;
        }
        return noteData;
    }

    /**
     * @brief 删除指定位置的音符
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @param {number} index - 要删除的音符的位置
     * @returns {Array<NoteLike>} - 返回删除后的音符数据
     */
    this.deleteNoteAt = function (noteData, index) {
        noteData.splice(index, 1);
        return noteData;
    }

    /**
     * @brief "软"删除指定位置的音符, 不改变数组长度
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @param {number} index - 要删除的音符的位置
     * @returns {Array<NoteLike>} - 返回删除后的音符数据
     */
    this.softDeleteNoteAt = function (noteData, index) {
        if(noteData[index][2] == undefined){
            noteData[index][2] = {};
        }
        //@ts-ignore
        noteData[index][2]["deleted"] = true;
        return noteData;
    }

    /**
     * @brief "软"删除指定音符
     * @param {NoteLike} note - 要删除的音符
     */
    this.softDeleteNote = function (note) {
        if (note[2] == undefined) {
            note[2] = {};
        }
        //@ts-ignore
        note[2]["deleted"] = true;
    }

    /**
     * @brief "软"更改指定位置的音符的时间
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @param {number} index - 要更改的音符的位置
     * @param {number} time - 新的时间
     * @returns {Array<NoteLike>} - 返回更改后的音符数据
     */
    this.softChangeNoteTimeAt = function (noteData, index, time) {
        if(noteData[index][2] == undefined){
            noteData[index][2] = {};
        }
        //@ts-ignore
        noteData[index][2]["newTime"] = time;
        return noteData;
    }

    /**
     * @brief "软"更改指定音符的时间
     * @param {NoteLike} note - 要更改的音符
     * @param {number} time - 新的时间
     */
    this.softChangeNoteTime = function (note, time) {
        if (note[2] == undefined) {
            note[2] = {};
        }
        //@ts-ignore
        note[2]["newTime"] = time;
    }

    /**
     * @brief 使更改生效
     * @param {Array<NoteLike>} noteData - 音乐数据(会被修改)
     * @returns {Array<NoteLike>} - 返回删除后的音符数据
     */
    this.applyChanges = function (noteData) {
        for (let i = 0; i < noteData.length; i++) {
            //@ts-ignore
            if (noteData[i][2]["deleted"] == true) {
                noteData.splice(i, 1);
                i--;
            }
            //@ts-ignore
            else if (noteData[i][2]["newTime"] != undefined) {
                //@ts-ignore
                noteData[i][1] = noteData[i][2]["newTime"];
                //@ts-ignore
                delete noteData[i][2]["newTime"];
            }
        }
        noteData.sort((a, b) => {
            return a[1] - b[1];
        });
        return noteData;
    }

    /**
     * @brief 获取下一组音符的开始位置
     * @param {Array<NoteLike>} noteData - 音乐数据
     * @param {number} index - 当前音符的位置
     * @returns {number} - 返回下一组音符的开始位置
     */
    this.nextChordStart = function (noteData, index) {
        const eps = 1; // 1ms
        let curTime = noteData[index][1];
        let nextTime = curTime + eps;
        while (index < noteData.length && noteData[index][1] < nextTime) {
            index++;
        }
        return index;
    }

    /**
     * @brief 音符组迭代器
     * @param {Array<NoteLike>} noteData - 音乐数据
     * @returns {IterableIterator<Array<NoteLike>>} - 返回音符组迭代器
     */
    this.chordIterator = function* (noteData) {
        let index = 0;
        while (index < noteData.length) {
            let nextIndex = this.nextChordStart(noteData, index);
            yield noteData.subarray(index, nextIndex - 1);
            index = nextIndex;
        }
    }

    /**
     * @brief 将分散的音符组合并为连续的音符
     * @param {Array<NoteLike>} noteData - 音乐数据
     * @returns {Array<PackedNoteLike>} - 返回合并后的音符数据
     */
    this.packNotes = function (noteData) {
        let packedNoteData = [];
        let it = this.chordIterator(noteData);
        for (let keys of it) {
            let time = keys[0][1];
            let keyArray = new Array();
            let attributes = new Array();
            keys.forEach((key) => {
                keyArray.push(key[0]);
                attributes.push(key[2]);
            });
            packedNoteData.push([keyArray, time, attributes]);
        }
        //@ts-ignore
        return packedNoteData;
    }
}

module.exports = new NoteUtils();