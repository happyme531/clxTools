
function MidiParser() {
    this.parseFile = function (filePath) {
        let dexPath = files.cwd() + "/src/MidiReader.dex"
        runtime.loadDex(dexPath);

        importPackage(Packages.midireader);
        importPackage(Packages.midireader.midievent);

        let reader = new MidiReader(filePath);
        let midiFileInfo = reader.getMidiFileInfo();
        let usperTick = midiFileInfo.getMicrosecondsPerTick() == 0 ? 5000 : midiFileInfo.getMicrosecondsPerTick();

        var noteData = [];
        let it = reader.iterator();
        while (it.hasNext()) {
            let event = it.next();
            if (event instanceof NoteMidiEvent) {
                if (event.getNoteEventType() == Packages.midireader.midievent.NoteMidiEvent.NoteEventType.NOTE_ON
                    && event.getVelocity() > 1) {
                    let key = event.getNoteNumber();
                    let time = event.getTotalTime() * usperTick / 1000;
                    noteData.push([key, time]);
                }
            }else{
                //console.log("evt:" + event.toString());
            }
        }
        reader.close();
        return noteData;
    }
}

module.exports = MidiParser;