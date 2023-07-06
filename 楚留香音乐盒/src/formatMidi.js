
function MidiParser() {
    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     * @returns {import("./musicFormats").TracksData} 音乐数据
     */
    this.parseFile = function (filePath) {
        let dexPath = files.cwd() + "/src/MidiReader.dex"
        runtime.loadDex(dexPath);

        importPackage(Packages.midireader);
        importPackage(Packages.midireader.midievent);

        let reader = new MidiReader(filePath);
        let midiFileInfo = reader.getMidiFileInfo();
        let usperTick = midiFileInfo.getMicrosecondsPerTick() == 0 ? 5000 : midiFileInfo.getMicrosecondsPerTick();
        let trackInfos = midiFileInfo.getTrackInfos();
        let tracksData = [];
        let it = trackInfos.iterator();
        while (it.hasNext()) {
            let trackInfo = it.next();
            tracksData.push({
                "name": trackInfo.getTrackName(),
                "noteCount": 0,
                "notes": []
            });
        }

        it = reader.iterator();
        while (it.hasNext()) {
            let event = it.next();
            if (event instanceof NoteMidiEvent) {
                if (event.getNoteEventType() == NoteMidiEvent.NoteEventType.NOTE_ON
                    && event.getVelocity() > 1) {
                    let key = event.getNoteNumber();
                    let time = event.getTotalTime() * usperTick / 1000;
                    let trackIndex = event.getChannel().getTrackNumber();
                    tracksData[trackIndex].notes.push([key, time]);
                    tracksData[trackIndex].noteCount++;
                }
            }else if(event instanceof MetaMidiEvent){
                switch (event.getMetaEventType()){
                    case MetaMidiEvent.MetaEventType.SET_TEMPO:{
                        let content = nextMetaMidiEvent.getContent();
                        console.log("SET_TEMPO content:" + content);
                        break;
                    }
                    case MetaMidiEvent.MetaEventType.TIME_SIGNATURE:{
                        let content = nextMetaMidiEvent.getContent();
                        console.log("TIME_SIGNATURE content:" + content);
                        break;
                    }
                }
            }
        }
        reader.close();
        return {
            "haveMultipleTrack": true,
            "trackCount": tracksData.length,
            "tracks": tracksData
        }
    }
}

module.exports = MidiParser;