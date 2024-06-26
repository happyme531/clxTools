
function SkyStudioJSONParser(){
    //左上角为key0,右下角为key15,音高从C4到C6
    this.skyKey2Midi =[
        48, 50, 52, 53, 55,
        57, 59, 60, 62, 64,
        65, 67, 69, 71, 72,
    ];

    /**
     * @brief 从字符串中解析音乐数据
     * @param {string} musicData 音乐数据
     * @returns {import("../musicFormats.js").TracksData}
     */
    this.parseFromString =  function(musicData){
        let jsonData = JSON.parse(musicData);
        jsonData = jsonData[0];
        if(jsonData.isEncrypted){
            throw new Error("文件已加密，无法解析！");
        }

        let name = jsonData.name;
        let author = jsonData.author;
        let transcribedBy = jsonData.transcribedBy;
        let isComposed = jsonData.isComposed;
        let bpm = jsonData.bpm;
        let metaDataText = "乐曲名称: " + name + "\n" + "作者: " + author + "\n" + "转谱人: " + transcribedBy + "\n" + "isComposed: " + isComposed + "\n" + "BPM: " + bpm;
        let notes = jsonData.songNotes;
        /** @type {import("../noteUtils").Note[]} */
        let ret =[];
        for(let i = 0; i < notes.length; i++){
            let n = notes[i];
            let key = parseInt(n.key.split("y")[1]); //"key"
            let pitch = this.skyKey2Midi[key];
            ret.push([pitch, n.time, {}]);
        }
        return {
            "haveMultipleTrack": false,
            "trackCount": 1,
            "durationType": "none",
            "tracks": [
                {
                    "name": name,
                    "channel": 0,
                    "instrumentId": 0,
                    "trackIndex": 0,
                    "noteCount": ret.length,
                    "notes": ret
                }
            ],
            "metadata": [
                {
                    "name": "SkyStudio乐曲信息",
                    "value": metaDataText
                }
            ]
        }
    }

    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     * @returns {import("../musicFormats").TracksData} 音乐数据
     */
    this.parseFile = function (filePath) {
        console.log("parseFile:" + filePath);
        let jsonData;
        try {
            try {
                return this.parseFromString(files.read(filePath));
            } catch (e) {
                return this.parseFromString(files.read(filePath, "utf-16"));
                console.log("文件编码为utf-16");
            }
        } catch (err) {
            throw new Error("文件解析失败！请检查格式是否正确, " + err.message);
        };

    }
}
module.exports = SkyStudioJSONParser;