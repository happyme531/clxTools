const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Import the function to be tested
const LrcParser = require('../../src/frontend/lrc');

describe('parseLrc', () => {
    it('should correctly parse a simple LRC string', () => {
        const lrcString = `
[00:00.00]Test lyrics
[00:05.20]Second line
[00:10.50]Third line
    `.trim();

        const expected = [
            { time: 0, text: 'Test lyrics' },
            { time: 5200, text: 'Second line' },
            { time: 10500, text: 'Third line' }
        ];


        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });

    it('should handle multiple time tags for a single line', () => {
        const lrcString = `
[00:00.00][00:05.00]Repeated line
[00:10.00]Normal line
    `.trim();

        const expected = [
            { time: 0, text: 'Repeated line' },
            { time: 5000, text: 'Repeated line' },
            { time: 10000, text: 'Normal line' }
        ];

        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });

    it('should ignore metadata and empty lines', () => {
        const lrcString = `
[ti:Song Title]
[ar:Artist]

[00:00.00]First line
[00:05.00]Second line
    `.trim();

        const expected = [
            { time: 0, text: 'First line' },
            { time: 5000, text: 'Second line' }
        ];

        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });

    it('should handle milliseconds with 2 or 3 digits', () => {
        const lrcString = `
[00:00.00]Zero milliseconds
[00:05.20]20 milliseconds
[00:10.500]500 milliseconds
    `.trim();

        const expected = [
            { time: 0, text: 'Zero milliseconds' },
            { time: 5200, text: '20 milliseconds' },
            { time: 10500, text: '500 milliseconds' }
        ];

        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });

    it('should handle empty line', () => {
        const lrcString = `
[00:00.00]0
[00:00.20]
[00:00.40]1
    `.trim();

        const expected = [
            { time: 0, text: '0' },
            { time: 200, text: '' },
            { time: 400, text: '1' }
        ];

        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });
    it('should handle multi line', () => {
        const lrcString = `
[00:00.00]l0
[00:00.20]l1
l2
l3
[00:00.40]l4
    `.trim();

        const expected = [
            { time: 0, text: 'l0' },
            { time: 200, text: 'l1\nl2\nl3' },
            { time: 400, text: 'l4' }
        ];

        const result = new LrcParser().parseFromString(lrcString);

        assert.deepStrictEqual(result, expected);
    });
});
