const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let Passes = require("../../src/passes");


describe('FoldFrequentSameNotePass', () => {
    test('folds frequent same notes', () => {
        let notes = [
            [60, 0, {}],
            [60, 90, {}],
            [60, 180, {}],
        ]
        let expected = [
            [60, 0, {"duration": 180}],
        ]
        let pass = new Passes().getPassByName("FoldFrequentSameNotePass");
        let actual = new pass({}).run(notes);
        assert.deepEqual(actual, expected);
    });

    test('folding different notes', () => {
        let notes = [
            [60, 0, {}],
            [61, 70, {}],
            [60, 100, {}],
            [62, 110, {}],
            [61, 140, {}],
            [60, 200, {}],
        ]
        let expected = [
            [60, 0, {"duration": 200}],
            [61, 70, {"duration": 70}],
            [62, 110, {}],
        ]
        let pass = new Passes().getPassByName("FoldFrequentSameNotePass");
        let actual = new pass({}).run(notes);
        assert.deepEqual(actual, expected);
    });
});
    