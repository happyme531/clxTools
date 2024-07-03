const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let { PitchOffsetPass } = require("../../src/passes");


describe('PitchOffsetPass', () => {
    test('offsets pitch', () => {
        const noteData = [
            [48, 0, { "duration": 500 }],
            [60, 50, { "duration": 500 }],
            [50, 100, { "duration": 500 }],
        ];
        const expected = [
            [50, 0, { "duration": 500 }],
            [62, 50, { "duration": 500 }],
            [52, 100, { "duration": 500 }],
        ];
        //@ts-ignore
        const actual = new PitchOffsetPass({ offset: 2 }).run(noteData);
        assert.deepEqual(actual, expected);
    });
});