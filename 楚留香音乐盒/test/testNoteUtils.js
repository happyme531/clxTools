const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const NoteUtils = require('../src/noteUtils'); // 假设你的 NoteUtils 类在这个文件中

describe('findChordStartAtTime', () => {
    const noteData = [
        [60, 0, {}],   // 第一组和弦
        [62, 0, {}],
        [64, 0, {}],
        [65, 500, {}], // 第二组和弦
        [67, 500, {}],
        [69, 1000, {}], // 第三组和弦（单音符）
        [71, 1500, {}], // 第四组和弦
        [72, 1500, {}],
        [74, 2000, {}], // 第五组和弦
    ];

    test('match first exact', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 0), 0);
    });

    test('match middle exact', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 500), 3);
    });

    test('match single note exact', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 1000), 5);
    });

    test('match notes near before', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 200), 0);
    });

    test('match notes near after', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 300), 3);
    });

    test('match underflow', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, -100), 0);
    });

    test('match overflow', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 3000), 8);
    });

    test('match similar time', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime(noteData, 1501), 6);
    });

    test('single note input', () => {
        assert.strictEqual(NoteUtils.findChordStartAtTime([[60, 1000, {}]], 500), 0);
    });
});
