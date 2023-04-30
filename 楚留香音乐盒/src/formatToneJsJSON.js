const MidiPitch = require('./midiPitch.js');

function getJsonLength(json) {
    var jsonLength = 0;
    for (var i in json) {
        jsonLength++;
    }
    return jsonLength;
};

function ToneJsJSONParser() {
    this.parseFile = function (filePath) {
        let jsonData;
        try {
            jsonData = JSON.parse(files.read(filePath));
        } catch (err) {
            toast("文件解析失败！请检查格式是否正确");
            toast(err);
            console.error("文件解析失败:" + err + ",数据文件可能缺失或不完整！");
        };

        let trackCount = getJsonLength(jsonData.tracks);
        let tracksData = [];
        for (let i = 0; i < trackCount; i++) {
            let track = jsonData.tracks[i];
            let notes = [];
            for (let j = 0; j < track.notes.length; j++) {
                let note = track.notes[j];
                notes.push([note.midi, note.time*1000]);
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