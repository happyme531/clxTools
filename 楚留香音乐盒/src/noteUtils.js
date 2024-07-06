
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
 * @typedef {[pitch: number, startTime: number, attributes: Object.<string,Object>]} Note
 * @typedef {[keyIndex: number, startTime: number, attributes: Object.<string,Object>]} Key // 按键
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
        if (noteData[index][2] == undefined) {
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
        if (noteData[index][2] == undefined) {
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
                if(key[2].lyric != undefined) {
                    attributes[0].lyric = key[2].lyric;
                    // console.verbose("lyric: " + JSON.stringify(attributes));
                    // key[2].lyric = undefined;
                }
            });
            packedNoteData.push([keyArray, time, attributes]);
        }
        //@ts-ignore
        return packedNoteData;
    }

    /**
     * @brief 查找给定时间最接近的一组音符的起始索引
     * @param {Array<NoteLike>} noteData - 音乐数据
     * @param {number} timems - 目标时间（毫秒）
     * @returns {number} - 返回最接近的一组音符的起始索引
     */
    this.findChordStartAtTime = function (noteData, timems) {
        const eps = 1; // 1ms 阈值

        // 二分查找
        let left = 0;
        let right = noteData.length - 1;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            if (noteData[mid][1] === timems) {
                // 找到精确匹配，现在向前查找该组的第一个音符
                while (mid > 0 && Math.abs(noteData[mid][1] - noteData[mid - 1][1]) <= eps) {
                    mid--;
                }
                return mid;
            } else if (noteData[mid][1] < timems) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        // 没有找到精确匹配，left 是插入点
        if (left >= noteData.length) {
            // 如果 timems 大于所有音符的时间，返回最后一组音符的起始索引
            let lastIndex = noteData.length - 1;
            while (lastIndex > 0 && Math.abs(noteData[lastIndex][1] - noteData[lastIndex - 1][1]) <= eps) {
                lastIndex--;
            }
            return lastIndex;
        }

        if (left === 0) {
            // 如果 timems 小于所有音符的时间，返回第一个音符的索引
            return 0;
        }

        // 检查 left-1 和 left 哪个更接近 timems
        if (Math.abs(noteData[left - 1][1] - timems) <= Math.abs(noteData[left][1] - timems)) {
            // left-1 更接近
           left--;
        }

        while (left > 0 && Math.abs(noteData[left][1] - noteData[left - 1][1]) <= eps) {
            left--;
        }
        return left;
    }

    /**
     * @brief 获取"可转移"的属性, 如果原音符被删除, 这些属性应该被转移到新音符上。
     * @param {NoteLike} note - 音符
     * @returns {Object.<string,Object>?} - 返回"可转移"的属性, 如果没有则返回null
     */
    this.getTransferableAttributes = function (note) {
        let transferableAttributes = {};
        for (let key in note[2]) {
            if (key == "lyric") {
                transferableAttributes[key] = note[2][key];
            }
        }
        if (Object.keys(transferableAttributes).length === 0) {
            return null;
        }
        return transferableAttributes;
    }
}

module.exports = new NoteUtils();