function ToneJsJSONParser() {
    /**
     * @brief 从JSON对象中解析音乐数据
     * @param {object} jsonData JSON数据
     */
    this.parseFromJSON = function (jsonData) {
        let trackCount = jsonData.tracks.length;
        let tracksData = [];
        // Tone.js会把同一个音轨, 不同Channel的音符分开
        for (let i = 0; i < trackCount; i++) {
            let track = jsonData.tracks[i];
            /** @type {import("../noteUtils").Note[]} */
            let notes = [];
            for (let j = 0; j < track.notes.length; j++) {
                let note = track.notes[j];
                notes.push([note.midi, note.time * 1000, {
                    "duration": note.duration * 1000,
                    "velocity": note.velocity
                }]);
            }
            tracksData.push({
                "name": track.name,
                "channel": track.channel,
                "instrumentId": track.instrument.number,
                "trackIndex": i,
                "noteCount": notes.length,
                "notes": notes
            });
        }
        // console.log(JSON.stringify(tracksData));

        return {
            "haveMultipleTrack": true,
            "durationType": "native",
            "trackCount": trackCount,
            "tracks": tracksData
        }
    }

    /**
     * @brief 从字符串中解析音乐数据
     */
    this.parseFromString = function (/** @type {string} */ musicData) {
        let jsonData;
        try {
            jsonData = JSON.parse(musicData);
            return this.parseFromJSON(jsonData);
        } catch (err) {
            toast("文件解析失败！请检查格式是否正确");
            toast(err);
            console.error("文件解析失败:" + err + ",数据文件可能缺失或不完整！");
        };
    }

    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     * @returns {import("../musicFormats").TracksData} 音乐数据
     */
    this.parseFile = function (filePath) {
        try {
            return this.parseFromString(files.read(filePath));
        } catch (err) {
            throw new Error("文件解析失败！请检查格式是否正确, " + err.message);
        };
    };
}

module.exports = ToneJsJSONParser;