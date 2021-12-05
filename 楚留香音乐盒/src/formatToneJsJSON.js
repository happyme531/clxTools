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

        //读取音轨列表
        var tracks = new Array();
        var noteCounts = new Array();
        for (let i in jsonData.tracks) {
            let noteCount = getJsonLength(jsonData.tracks[i].notes);
            noteCounts.push(noteCount);
            // if(noteCount == 0) continue;

            if (jsonData.tracks[i].name != "") {
                tracks.push(i + ":" + jsonData.tracks[i].name + ":" + noteCount + "个音符");
            } else {
                tracks.push(i + ":" + "未命名" + ":" + noteCount + "个音符");
            };
        };

        const selectedTracks = dialogs.multiChoice("选择你想播放的音轨(可以多选)..", tracks);
        console.assert(!(selectedTracks.length === 0), "错误:请选择一个选项");

        //处理音符数据
        var noteData = [];  //[按键，时间]

        var tracksIdx = new Array(selectedTracks.length);
        for (let i = 0; i < selectedTracks.length; i++) {
            tracksIdx[i] = 0;
        }

        let curTime = 0;

        while (true) {
            let minNextTime = 999999999;
            let minNextTimeTrack = 0;   //下一个音符所在的音轨
            let selectedI = 0;          //下一个音符所在的音轨在所有选中的音轨列表中的位置
            for (let i = 0; i < selectedTracks.length; i++) { //选出下一个音符
                curTrack = selectedTracks[i];
                curNoteIdx = tracksIdx[i];
                if (curNoteIdx == noteCounts[curTrack]) continue;
                let curTimeTmp = jsonData.tracks[curTrack].notes[curNoteIdx].time;
                if (curTimeTmp <= minNextTime) {
                    minNextTime = curTimeTmp;
                    minNextTimeTrack = curTrack;
                    selectedI = i
                }
            }
            if (minNextTime == 999999999) break;
            // console.log("ffsel track %d, note %d",minNextTimeTrack,tracksIdx[selectedI]);


            let key = jsonData.tracks[minNextTimeTrack].notes[tracksIdx[selectedI]].midi;
            tracksIdx[selectedI]++;
            if (key != 0) {   //丢弃无法弹奏的音符
                noteData.push([key, minNextTime*1000]);
            }
        }
        return noteData;
    };
}

module.exports = ToneJsJSONParser;