
function MidiPitch() {
    this.octaveArray = [
        0,2,4,5,7,9,11
    ];
    this.nameToMidiPitch = function (name) {
        name = name.toUpperCase();
        var pitch = {
            'C': 0,
            'D': 2,
            'E': 4,
            'F': 5,
            'G': 7,
            'A': 9,
            'B': 11
        };
        var note = name[0];
        switch (name.length) {
            case 1: // eg. C
                return pitch[note] + 12 * 5;
            case 2: // eg. C5 | C# (alias for C5#)
                if(name[1] === '#') {
                    return pitch[note] + 12 * 5 + 1;
                } else {
                    return pitch[note] + 12 * 5 + 12 * (parseInt(name[1]) - 4);
                }
            case 3: // eg. C5#
                return pitch[note] + 12 * (name[1] - '0') + 1;
        }
    }
    
}

module.exports = new MidiPitch();

