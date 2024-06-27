const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let {SplitLongNotePass} = require("../../src/passes");


describe('SplitLongNotePass', () => {
    test('splits long notes', () => {
        let notes = [
            [60, 0, {"duration": 600}],
        ]
        let expected = [
            [60, 0, {"duration": 100}],
            [60, 100, {"duration": 100}],
            [60, 200, {"duration": 100}],
            [60, 300, {"duration": 100}],
            [60, 400, {"duration": 100}],
            [60, 500, {"duration": 100}],
        ]
        let actual = new SplitLongNotePass({}).run(notes);
        assert.deepEqual(actual, expected);
    });

    test('does not split short notes', () => {
        let notes = [
            [60, 0, {"duration": 600}],
            [61, 180, {"duration": 300}],
        ]
        let expected = [
            [60, 0, {"duration": 100}],
            [60, 100, {"duration": 100}],
            [61, 180, {"duration": 300}],
            [60, 200, {"duration": 100}],
            [60, 300, {"duration": 100}],
            [60, 400, {"duration": 100}],
            [60, 500, {"duration": 100}],
        ]
        let actual = new SplitLongNotePass({}).run(notes);
        assert.deepEqual(actual, expected);
    });

});