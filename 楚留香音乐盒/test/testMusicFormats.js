const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const MusicFormats = require('../src/musicFormats'); // 假设你的 NoteUtils 类在这个文件中

describe('getFileNameWithoutExtension', () => {
    const musicFormats = new MusicFormats();
    test('getFileNameWithoutExtension', () => {
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("test.mid"), "test");
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("test.skystudio.txt"), "test");
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("test.json"), "test");
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("test.dms.txt"), "test");

        assert.strictEqual(musicFormats.getFileNameWithoutExtension("1.zip/test.mid"), "test");
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("1.zip/2/test.skystudio.txt"), "test");
        assert.strictEqual(musicFormats.getFileNameWithoutExtension("1.zip/2/test2"), "test2");


    });
});