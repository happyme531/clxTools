const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const ChimomoApi = require('../../src/cloud/chimomoApi');

describe('ChimomoApi', () => {
    const api = new ChimomoApi();

    test('fetchMusicList', (t, done) => {
        api.fetchMusicList(1, 10, null, (err, data) => {
            assert.strictEqual(err, null);
            assert.notStrictEqual(data, undefined);
            assert.ok(Array.isArray(data.data));
            done();
        });
    });

    test('fetchMusicFileById', (t, done) => {
        api.fetchMusicFileById('58a38ed3-f8b1-4a6b-a69a-1ca9048ed3d8', (err, data) => {
            assert.strictEqual(err, null);
            assert.notStrictEqual(data, undefined);
            assert.ok(typeof data === 'object');
            done();
        });
    });
});