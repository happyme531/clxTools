function ToneJsJSONParser() {
    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     * @returns {import("./musicFormats").TracksData} 音乐数据
     */
    this.parseFile = function (filePath) {
        let jsonData;
        try {
            jsonData = JSON.parse(files.read(filePath));
        } catch (err) {
            toast("文件解析失败！请检查格式是否正确");
            toast(err);
            console.error("文件解析失败:" + err + ",数据文件可能缺失或不完整！");
        };

        let trackCount = jsonData.tracks.length;
        let tracksData = [];
        for (let i = 0; i < trackCount; i++) {
            let track = jsonData.tracks[i];
            /** @type {import("./musicFormats").Note[]} */
            let notes = [];
            for (let j = 0; j < track.notes.length; j++) {
                let note = track.notes[j];
                notes.push([note.midi, note.time * 1000, undefined]);
            }
            tracksData.push({
                "name": track.name,
                "noteCount": notes.length,
                "notes": notes
            });
        }

        return {
            "haveMultipleTrack": true,
            "trackCount": trackCount,
            "tracks": tracksData
        }
    };
}

module.exports = ToneJsJSONParser;