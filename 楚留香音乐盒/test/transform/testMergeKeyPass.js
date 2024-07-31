const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let { MergeKeyPass } = require("../../src/passes");

describe('MergeKeyPass', () => {
    test('should merge nearby notes correctly', () => {
        const inputNotes = [
            [60, 0, {}],
            [62, 50, {}],
            [64, 75, {}],
            [65, 125, {}],
            [67, 200, {}],
            [60, 210, {}],
        ];
        const expectedOutput = [
            [60, 0, {}],
            [62, 0, {}],
            [64, 0, {}],
            [65, 125, {}],
            [67, 125, {}],
            [60, 125, {}],
        ];
        const pass = new MergeKeyPass({ maxInterval: 100 });
        const result = pass.run(inputNotes);
        assert.deepEqual(result, expectedOutput);
    });

    test('should not merge notes if interval is larger than maxInterval', () => {
        const inputNotes = [
            [60, 0, {}],   // C4 at 0ms
            [62, 101, {}], // D4 at 101ms
            [64, 202, {}], // E4 at 202ms
        ];

        const pass = new MergeKeyPass({ maxInterval: 100 });
        const result = pass.run(inputNotes);
        assert.deepEqual(result, inputNotes);
    });

    test('should drop same notes', () => {
        const inputNotes = [
            [60, 0, {}],
            [60, 50, {}],
            [64, 150, {}],
            [67, 175, {}],
            [64, 200, {}],
        ];

        const pass = new MergeKeyPass({ maxInterval: 100 });
        const result = pass.run(inputNotes);

        const expectedOutput = [
            [60, 0, {}],
            [64, 150, {}],
            [67, 150, {}],
        ];

        assert.deepEqual(result, expectedOutput);
    });
});