const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');
const { MusicReader } = require("../../src/nodejs/MusicReader")

describe('FileParsing', () => {
    const expected_1 = {
        "haveMultipleTrack": true,
        "durationType": "native",
        "trackCount": 1,
        "tracks": [
            {
                "name": "New Instrument",
                "channel": 0,
                "instrumentId": 0,
                "trackIndex": 0,
                "noteCount": 42,
                "notes": [
                    [
                        48,
                        0,
                        {
                            "duration": 385.41666666666663,
                            "velocity": 0.7874015748031497,
                        }
                    ],
                    [
                        48,
                        0,
                        {
                            "duration": 385.41666666666663,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        49,
                        385.41666666666663,
                        {
                            "duration": 500.0000000000001,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        49,
                        385.41666666666663,
                        {
                            "duration": 500.0000000000001,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        50,
                        885.4166666666667,
                        {
                            "duration": 499.9999999999998,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        50,
                        885.4166666666667,
                        {
                            "duration": 499.9999999999998,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        51,
                        1364.5833333333333,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        52,
                        1885.4166666666665,
                        {
                            "duration": 479.16666666666697,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        53,
                        2364.5833333333335,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        54,
                        2864.5833333333335,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        55,
                        3364.5833333333335,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        56,
                        3864.5833333333335,
                        {
                            "duration": 499.99999999999955,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        57,
                        4369.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        58,
                        4869.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        59,
                        5369.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        60,
                        5869.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        61,
                        6369.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        62,
                        6869.791666666666,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        63,
                        7375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        64,
                        7875,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        65,
                        8375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        66,
                        8875,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        67,
                        9375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        68,
                        9875,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        69,
                        10375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        70,
                        10875,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        71,
                        11375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        72,
                        11880.208333333334,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        72,
                        11880.208333333334,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        73,
                        12380.208333333334,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        73,
                        12380.208333333334,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        74,
                        12880.208333333334,
                        {
                            "duration": 505.20833333333394,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        74,
                        12880.208333333334,
                        {
                            "duration": 505.20833333333394,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        75,
                        13359.375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        76,
                        13885.416666666668,
                        {
                            "duration": 473.9583333333321,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        77,
                        14359.375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        78,
                        14859.375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        79,
                        15359.375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        80,
                        15859.375,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        81,
                        16364.583333333336,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        82,
                        16864.583333333336,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ],
                    [
                        83,
                        17364.583333333336,
                        {
                            "duration": 500,
                            "velocity": 0.7874015748031497
                        }
                    ]
                ]
            }
        ]
    }


    const expected_2 = {
        "haveMultipleTrack": false,
        "trackCount": 1,
        "durationType": "none",
        "tracks": [
            {
                "name": "",
                "channel": 0,
                "instrumentId": 0,
                "trackIndex": 0,
                "noteCount": 21,
                "notes": [
                    [
                        48,
                        500,
                        {}
                    ],
                    [
                        50,
                        1000,
                        {}
                    ],
                    [
                        52,
                        1500,
                        {}
                    ],
                    [
                        53,
                        2000,
                        {}
                    ],
                    [
                        55,
                        2500,
                        {}
                    ],
                    [
                        57,
                        3000,
                        {}
                    ],
                    [
                        59,
                        3500,
                        {}
                    ],
                    [
                        60,
                        4000,
                        {}
                    ],
                    [
                        62,
                        4500,
                        {}
                    ],
                    [
                        64,
                        5000,
                        {}
                    ],
                    [
                        65,
                        5500,
                        {}
                    ],
                    [
                        67,
                        6000,
                        {}
                    ],
                    [
                        69,
                        6500,
                        {}
                    ],
                    [
                        71,
                        7000,
                        {}
                    ],
                    [
                        72,
                        7500,
                        {}
                    ],
                    [
                        74,
                        8000,
                        {}
                    ],
                    [
                        76,
                        8500,
                        {}
                    ],
                    [
                        77,
                        9000,
                        {}
                    ],
                    [
                        79,
                        9500,
                        {}
                    ],
                    [
                        81,
                        10000,
                        {}
                    ],
                    [
                        83,
                        10500,
                        {}
                    ]
                ]
            }
        ],
        "metadata": [
            {
                "name": "DoMiSo乐曲注释",
                "value": "testtesttest hallo1"
            }
        ]
    }

    const expected_3 = {
        "haveMultipleTrack": false,
        "trackCount": 1,
        "durationType": "none",
        "tracks": [
            {
                "name": "testtest",
                "channel": 0,
                "instrumentId": 0,
                "trackIndex": 0,
                "noteCount": 15,
                "notes": [
                    [
                        48,
                        0,
                        {}
                    ],
                    [
                        50,
                        250,
                        {}
                    ],
                    [
                        52,
                        500,
                        {}
                    ],
                    [
                        53,
                        750,
                        {}
                    ],
                    [
                        55,
                        1000,
                        {}
                    ],
                    [
                        57,
                        1250,
                        {}
                    ],
                    [
                        59,
                        1500,
                        {}
                    ],
                    [
                        60,
                        1750,
                        {}
                    ],
                    [
                        62,
                        2000,
                        {}
                    ],
                    [
                        64,
                        2250,
                        {}
                    ],
                    [
                        65,
                        2500,
                        {}
                    ],
                    [
                        67,
                        2750,
                        {}
                    ],
                    [
                        69,
                        3000,
                        {}
                    ],
                    [
                        71,
                        3250,
                        {}
                    ],
                    [
                        72,
                        3500,
                        {}
                    ]
                ]
            }
        ],
        "metadata": [
            {
                "name": "SkyStudio乐曲信息",
                "value": "乐曲名称: testtest\n作者: hallo1\n转谱人: Unknown\nisComposed: true\nBPM: 240"
            }
        ]
    }

    test('parse MIDI file', () => {
        let musicReader = new MusicReader();
        let res = musicReader.parseFile(path.resolve(__dirname, "音阶测试_C3B6.mid"), "midi");
        assert.deepEqual(res, expected_1);
    });

    test('parse ToneJsJSON file', () => {
        let musicReader = new MusicReader();
        let res = musicReader.parseFile(path.resolve(__dirname, "音阶测试_C3B6.json"), "tonejsjson");
        assert.deepEqual(res, expected_1);
    });

    test('parse Domiso file', () => {
        let musicReader = new MusicReader();
        let res = musicReader.parseFile(path.resolve(__dirname, "test_domiso.dms.txt"), "domiso");
        assert.deepEqual(res, expected_2);
    });

    test('parse SkyStudioJSON file', () => {
        let musicReader = new MusicReader();
        let res = musicReader.parseFile(path.resolve(__dirname, "test_skystudio.skystudio.txt"), "skystudiojson");
        assert.deepEqual(res, expected_3);
    });
})