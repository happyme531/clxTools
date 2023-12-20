
function MidiPitch() {
    this.octaveArray = [
        0, 2, 4, 5, 7, 9, 11
    ];

    /**
     * 将音符名称转换为对应的 MIDI 音高值。
     * @param {string} name - 要转换的音符名称，例如 C4、C4#、C#、C 等。
     * @returns {number} 音符的 MIDI 音高值。
     */
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
                if (name[1] === '#') {
                    return pitch[note] + 12 * 5 + 1;
                } else {
                    return pitch[note] + 12 * 5 + 12 * (parseInt(name[1]) - 4);
                }
            case 3: // eg. C5#
                return pitch[note] + 12 * 5 + 1 + 12 * (parseInt(name[1]) - 4);
            default:
                throw new Error('Invalid note name: ' + name);
        }
    }

    /**
     * 返回MIDI音高值是否是半音 (实际上, 黑键?)
     * @param {number} pitch - MIDI音高值。
     * @returns {boolean} 如果是半音则返回true，否则返回false。
     */
    this.isHalf = function (pitch) {
        return pitch % 12 === 1 || pitch % 12 === 3 || pitch % 12 === 6 || pitch % 12 === 8 || pitch % 12 === 10;
    }

    /**
     * 移调: 获取移调值对应的调号(0 -> 'C')
     * @param {number} offset - 移调值。
     * @returns {string} 移调值对应的调号。
     */
    this.getTranspositionEstimatedKey = function (offset) {
        const transpositionName = [
            'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G'
        ];
        return transpositionName[(-offset + 4 + 12) % 12]; //反向...
    };
}

module.exports = new MidiPitch();

