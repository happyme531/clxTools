const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
let {EstimateNoteDurationPass} = require("../../src/passes");


describe('EstimateNoteDurationPass', () => {
    test('estimates note duration', () => {
        let notes = [
            [60, 0, {}],
            [60, 100, {}],
            [60, 200, {}],
            [60, 300, {}],
            [60, 400, {}],
            [60, 500, {}],
        ]
        let expected = [
            [60, 0, {"duration": 75}],
            [60, 100, {"duration": 75}],
            [60, 200, {"duration": 75}],
            [60, 300, {"duration": 75}],
            [60, 400, {"duration": 75}],
            [60, 500, {}],
        ]
        let actual = new EstimateNoteDurationPass({}).run(notes);
        assert.deepEqual(actual, expected);
    });

    test('does not estimate duration if it is already set', () => {
        let notes = [
            [60, 0, {}],
            [60, 100, {}],
            [61, 100, {}],
            [60, 300, {"duration": 100}],
            [60, 400, {}],
            [60, 500, {}],
        ]
        let expected = [
            [60, 0, {"duration": 75}],
            [60, 100, {"duration": 150}],
            [61, 100, {"duration": 150}],
            [60, 300, {"duration": 100}],
            [60, 400, {"duration": 75}],
            [60, 500,{}],
        ]
        let actual = new EstimateNoteDurationPass({}).run(notes);
        assert.deepEqual(actual, expected);
    });
});
