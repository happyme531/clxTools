//@ts-check
var midiPitch = require("./midiPitch.js");

/**
 * @typedef {[number, number]} pos2d
 * @typedef {[pos2d, pos2d]} pos2dPair
 */

/**
 * @enum {string}
 */
const KeyLayoutTypes = {
    "grid": "grid",   //网格
    "arbitrary": "arbitrary", //任意
    "nshm_professional": "nshm_professional", //逆水寒手游, 所有的专业模式
}

/**
 * @enum {string}
 */
const KeyLocatorTypes = {
    //左上,右下(默认)
    "left_top_right_bottom": "left_top_right_bottom",
    //左下,右上
    "left_bottom_right_top": "left_bottom_right_top",
}

/**
 * @enum {string}
 * @typedef {string} NoteDurationImplementionType
 */
const NoteDurationImplementionTypes = {
    //根本不支持，所有音符都是一样长, 不管按住多久 //最简单
    "none": "none",
    //通过同时按住另外一个键来发出长音, 两种情况差别很大 //TODO:
    "extraLongKey": "extraLongKey",
    //原生支持, 按住多久就发出多长的音 //最难支持 //TODO:
    "native": "native",
}

/**
 * @enum {string}
 */
const FeatureFlags = {
    //是否有全部半音
    "hasAllSemitone": "hasAllSemitone",
}

/**
 * @typedef {Object} NoteKeyMapConfig
 * @property {string} startPitch 起始音高, 如: C3
 * @property {string} endPitch 结束音高, 如: C5(包含C5)
 * @property {boolean} haveSemitone 是否有半音
 */

/**
 * @brief 生成音高到按键的映射
 * @param {NoteKeyMapConfig} config 配置
 * @returns {NoteKeyMap} 音高到按键的映射
 */
function generateNoteKeyMap(config) {
    const noteKeyMap = {};
    let currentPitch = midiPitch.nameToMidiPitch(config.startPitch);
    const endPitch = midiPitch.nameToMidiPitch(config.endPitch);
    let keyNumber = 1;

    while (currentPitch <= endPitch) {
        let pitchName = midiPitch.midiPitchToName(currentPitch);
        noteKeyMap[pitchName] = keyNumber;
        keyNumber++;

        if (config.haveSemitone) {
            currentPitch++;
        } else {
            // 如果没有半音，跳过黑键
            currentPitch += (midiPitch.isHalf(currentPitch + 1) ? 2 : 1);
        }
    }
    //@ts-ignore
    return noteKeyMap;
}


/**
 * @typedef {Object.<string, number>} NoteKeyMap         //音高与按键的映射, 左下角开始, 从左到右, 从下到上

 * @type {Object.<string, NoteKeyMap>}
 */
const noteKeyMaps = {
    "generic_3x7": generateNoteKeyMap({
        startPitch: "C3",
        endPitch: "B5",
        haveSemitone: false,
    }),
    "generic_2x7": generateNoteKeyMap({
        startPitch: "C4",
        endPitch: "B5",
        haveSemitone: false,
    }),
    "sky_3x5": {
        // C3 D3 E3 F3 G3 
        // A3 B3 C4 D4 E4 
        // F4 G4 A4 B4 C5
        "F4": 1,
        "G4": 2,
        "A4": 3,
        "B4": 4,
        "C5": 5,
        "A3": 6,
        "B3": 7,
        "C4": 8,
        "D4": 9,
        "E4": 10,
        "C3": 11,
        "D3": 12,
        "E3": 13,
        "F3": 14,
        "G3": 15,
    },
    "sky_2x4": {
        // A4 E5 G5 A5
        // C6 D6 E6 G6  
        "C6": 1,
        "D6": 2,
        "E6": 3,
        "G6": 4,
        "A4": 5,
        "E5": 6,
        "G5": 7,
        "A5": 8,
    },
    "genshin_oldsq_3x7": {
        // C5 C#5 D#5 F5 G5 G#5 A#5
        // C4 D4 D#4 F4 G4 A4 A#4
        // C3 D3 D#3 F3 G3 A3 A#3
        "C3": 1,
        "D3": 2,
        "D3#": 3,
        "F3": 4,
        "G3": 5,
        "A3": 6,
        "A3#": 7,
        "C4": 8,
        "D4": 9,
        "D4#": 10,
        "F4": 11,
        "G4": 12,
        "A4": 13,
        "A4#": 14,
        "C5": 15,
        "C5#": 16,
        "D5#": 17,
        "F5": 18,
        "G5": 19,
        "G5#": 20,
        "A5#": 21,
    },
    "generic_3x12": generateNoteKeyMap({
        startPitch: "C3",
        endPitch: "B5",
        haveSemitone: true,
    }),
    "mrzh_3x12": {
        //C5 C#5 D5 D#5 E5 NC F5 F#5 G5 G#5 A5 A#5 B5
        //C4 C#4 D4 D#4 E4 NC F4 F#4 G4 G#4 A4 A#4 B4
        //C3 C#3 D3 D#3 E3 NC F3 F#3 G3 G#3 A3 A#3 B3
        "C3": 1,
        "C3#": 2,
        "D3": 3,
        "D3#": 4,
        "E3": 5,
        "F3": 7,
        "F3#": 8,
        "G3": 9,
        "G3#": 10,
        "A3": 11,
        "A3#": 12,
        "B3": 13,
        "C4": 14,
        "C4#": 15,
        "D4": 16,
        "D4#": 17,
        "E4": 18,
        "F4": 20,
        "F4#": 21,
        "G4": 22,
        "G4#": 23,
        "A4": 24,
        "A4#": 25,
        "B4": 26,
        "C5": 27,
        "C5#": 28,
        "D5": 29,
        "D5#": 30,
        "E5": 31,
        "F5": 33,
        "F5#": 34,
        "G5": 35,
        "G5#": 36,
        "A5": 37,
        "A5#": 38,
        "B5": 39,
    },
    "nshm_1x7": generateNoteKeyMap({
        startPitch: "C4",
        endPitch: "B4",
        haveSemitone: false,
    }),
    "nshm_zhuangyuan_noteplacer_4x12": {  //逆水寒宅邸的聆音骨牌
        //C#2 D#2 F#2 G#2 A#2 C2 D2 E2 F2 G2 A2 B2
        //C#5 D#5 F#5 G#5 A#5 C5 D5 E5 F5 G5 A5 B5
        //C#4 D#4 F#4 G#4 A#4 C4 D4 E4 F4 G4 A4 B4
        //C#3 D#3 F#3 G#3 A#3 C3 D3 E3 F3 G3 A3 B3
        "C#3": 1,
        "D#3": 2,
        "F#3": 3,
        "G#3": 4,
        "A#3": 5,
        "C3": 6,
        "D3": 7,
        "E3": 8,
        "F3": 9,
        "G3": 10,
        "A3": 11,
        "B3": 12,
        "C#4": 13,
        "D#4": 14,
        "F#4": 15,
        "G#4": 16,
        "A#4": 17,
        "C4": 18,
        "D4": 19,
        "E4": 20,
        "F4": 21,
        "G4": 22,
        "A4": 23,
        "B4": 24,
        "C#5": 25,
        "D#5": 26,
        "F#5": 27,
        "G#5": 28,
        "A#5": 29,
        "C5": 30,
        "D5": 31,
        "E5": 32,
        "F5": 33,
        "G5": 34,
        "A5": 35,
        "B5": 36,
        "C#2": 37,
        "D#2": 38,
        "F#2": 39,
        "G#2": 40,
        "A#2": 41,
        "C2": 42,
        "D2": 43,
        "E2": 44,
        "F2": 45,
        "G2": 46,
        "A2": 47,
        "B2": 48,
    },
    "dzpd_7_8": generateNoteKeyMap({
        startPitch: "C4",
        endPitch: "C6",
        haveSemitone: false,
    }),
    "abd_7_8_7":{
        //C3 D3 E3 F3 G3 A3 B3
        //C4 D4 E4 F4 G4 A4 B4 C5
        //D5 E5 F5 G5 A5 B5 C6
        "D5": 1,
        "E5": 2,
        "F5": 3,
        "G5": 4,
        "A5": 5,
        "B5": 6,
        "C6": 7,
        "C4": 8,
        "D4": 9,
        "E4": 10,
        "F4": 11,
        "G4": 12,
        "A4": 13,
        "B4": 14,
        "C5": 15,
        "C3": 16,
        "D3": 17,
        "E3": 18,
        "F3": 19,
        "G3": 20,
        "A3": 21,
        "B3": 22,
    },
    "abd_8_7":{
        //C3 D3 E3 F3 G3 A3 B3
        //C4 D4 E4 F4 G4 A4 B4 C5
        "C4": 1,
        "D4": 2,
        "E4": 3,
        "F4": 4,
        "G4": 5,
        "A4": 6,
        "B4": 7,
        "C5": 8,
        "C3": 9,
        "D3": 10,
        "E3": 11,
        "F3": 12,
        "G3": 13,
        "A3": 14,
        "B3": 15,
    },
    "hpma_2x7": generateNoteKeyMap({
        startPitch: "C3",
        endPitch: "B4",
        haveSemitone: false,
    }),
    "generic_3x7_1": generateNoteKeyMap({
        startPitch: "C3",
        endPitch: "C5",
        haveSemitone: false,
    }),
    "generic_3x12_1": generateNoteKeyMap({
        startPitch: "C3",
        endPitch: "C5",
        haveSemitone: true,
    }),
}


/**
 * @typedef {{
 * name: string,
 * displayName: string,
 * type: string,
 * locator: string,
 * row?: number|undefined,
 * column?: number|undefined,
 * relativeKeyPosition?: Array<pos2d>|undefined,
 * noteKeyMap?: NoteKeyMap,
 * }} KeyLayout
 * 
 * @type {Object.<string, KeyLayout>}
 */
const keyLayouts = {
    "generic_3x7": {
        name: "generic_3x7",
        //名称
        displayName: "3x7",
        //类型
        type: KeyLayoutTypes.grid,
        //定位方式
        locator: KeyLocatorTypes.left_top_right_bottom,
        //行数
        row: 3,
        //列数
        column: 7,
        //按键位置(只在定位方式为arbritary时有效), 左上角为(0,0), 左下角为(0,1), 右上角为(1,0), 右下角为(1,1). 顺序与noteKeyMap一致.
        relativeKeyPosition: undefined,
        //音高与按键的映射, 左下角开始, 从左到右, 从下到上
        noteKeyMap: noteKeyMaps.generic_3x7,
    },
    "generic_2x7": {
        name: "generic_2x7",
        displayName: "2x7",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 2,
        column: 7,
        noteKeyMap: noteKeyMaps.generic_2x7,
    },
    "sky_3x5": {   //光遇3x5
        name: "sky_3x5",
        displayName: "3x5",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 3,
        column: 5,
        noteKeyMap: noteKeyMaps.sky_3x5,
    },
    "sky_2x4": { //光遇2x4
        name: "sky_2x4",    
        displayName: "2x4",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 2,
        column: 4,
        noteKeyMap: noteKeyMaps.sky_2x4,
    },
    "generic_3x12": {
        name: "generic_3x12",   
        displayName: "3x12",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 3,
        column: 12,
        noteKeyMap: noteKeyMaps.generic_3x12,
    },
    "nshm_1x7": {  //逆水寒手游1x7
        name: "nshm_1x7",
        displayName: "1x7",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 1,
        column: 7,
        noteKeyMap: noteKeyMaps.nshm_1x7,
    },
    //TODO: 重构?
    "nshm_professional.gu_zheng":{ 
        name: "nshm_professional.gu_zheng",
        displayName: "专业模式(古筝)",
        type: KeyLayoutTypes.nshm_professional,
        locator: KeyLocatorTypes.left_top_right_bottom,
        //具体的键位和映射表会动态生成。
    },
    "nshm_professional.qv_di":{ 
        name: "nshm_professional.qv_di",
        displayName: "专业模式(曲笛)",
        type: KeyLayoutTypes.nshm_professional,
        locator: KeyLocatorTypes.left_top_right_bottom,
    },
    "nshm_professional.pi_pa":{
        name: "nshm_professional.pi_pa",
        displayName: "专业模式(琵琶)",
        type: KeyLayoutTypes.nshm_professional,
        locator: KeyLocatorTypes.left_top_right_bottom,
    },
    "nshm_professional.suo_na":{
        name: "nshm_professional.suo_na",
        displayName: "专业模式(唢呐)",
        type: KeyLayoutTypes.nshm_professional,
        locator: KeyLocatorTypes.left_top_right_bottom,
    },
    "nshm_zhuangyuan_noteplacer_4x12": {  //逆水寒宅邸的聆音骨牌
        name: "nshm_zhuangyuan_noteplacer_4x12",
        displayName: "宅邸聆音骨牌",
        noteKeyMap: noteKeyMaps.nshm_zhuangyuan_noteplacer_4x12,
    },
    "dzpd_interleaved3x7": { //蛋仔派对 交错的3x7
        name: "dzpd_interleaved3x7",
        displayName: "21键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
        x x x x x x x
         x x x x x x x
        x x x x x x x
        */
        relativeKeyPosition: [
            [0, 1], [1 / 6, 1], [2 / 6, 1], [3 / 6, 1], [4 / 6, 1], [5 / 6, 1], [6 / 6, 1],
            [0 + 1 / 12, 1 / 2], [1 / 6 + 1 / 12, 1 / 2], [2 / 6 + 1 / 12, 1 / 2], [3 / 6 + 1 / 12, 1 / 2], [4 / 6 + 1 / 12, 1 / 2], [5 / 6 + 1 / 12, 1 / 2], [6 / 6 + 1 / 12, 1 / 2],
            [0, 0], [1 / 6, 0], [2 / 6, 0], [3 / 6, 0], [4 / 6, 0], [5 / 6, 0], [6 / 6, 0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7,
    },
    "speedmobile_interleaved3x7_1": { //qq飞车 交错的3x7+1
        name: "speedmobile_interleaved3x7_1",
        displayName: "22键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [0, 1], [1 / 6, 1], [2 / 6, 1], [3 / 6, 1], [4 / 6, 1], [5 / 6, 1], [6 / 6, 1],
            [0 + 1 / 12, 1 / 2], [1 / 6 + 1 / 12, 1 / 2], [2 / 6 + 1 / 12, 1 / 2], [3 / 6 + 1 / 12, 1 / 2], [4 / 6 + 1 / 12, 1 / 2], [5 / 6 + 1 / 12, 1 / 2], [6 / 6 + 1 / 12, 1 / 2],
            [0, 0], [1 / 6, 0], [2 / 6, 0], [3 / 6, 0], [4 / 6, 0], [5 / 6, 0], [6 / 6, 0], [7 / 6, 0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7_1,
    },
    "dzpd_7_8": { //蛋仔派对 7+8
        name: "dzpd_7_8",
        displayName: "15键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
        x x x x x x x x
         x x x x x x x 
        */
        relativeKeyPosition: [
            [1/13,1],[3/13,1],[5/13,1],[7/13,1],[9/13,1],[11/13,1],[13/13,1],
            [0,0],[2/13,0],[4/13,0],[6/13,0],[8/13,0],[10/13,0],[12/13,0],[14/13,0],
        ],
        noteKeyMap: noteKeyMaps.dzpd_7_8,
    },
    "xdxz_7_8": { //心动小镇 7+8, 其实和上面那个是一样的
        name: "xdxz_7_8",
        displayName: "7+8",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [1/13,1],[3/13,1],[5/13,1],[7/13,1],[9/13,1],[11/13,1],[13/13,1],
            [0,0],[2/13,0],[4/13,0],[6/13,0],[8/13,0],[10/13,0],[12/13,0],[14/13,0],
        ],
        noteKeyMap: noteKeyMaps.dzpd_7_8,
    },
    "dzpd_yinterleaved36" :{ //蛋仔派对 交错的3x12
        name: "dzpd_yinterleaved36",
        displayName: "36键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
         x x   x x x 
        x x x x x x x
         x x   x x x 
        x x x x x x x
         x x   x x x 
        x x x x x x x
        */
        relativeKeyPosition: [
            [0, 1], [1 / 12, 1 - 0.105], [2 / 12, 1], [3 / 12, 1 - 0.105], [4 / 12, 1], [6 / 12, 1], [7 / 12, 1 - 0.105], [8 / 12, 1], [9 / 12, 1 - 0.105], [10 / 12, 1], [11 / 12, 1 - 0.105], [12 / 12, 1],
            [0, 1 / 2], [1 / 12, 1 / 2 - 0.105], [2 / 12, 1 / 2], [3 / 12, 1 / 2 - 0.105], [4 / 12, 1 / 2], [6 / 12, 1 / 2], [7 / 12, 1 / 2 - 0.105], [8 / 12, 1 / 2], [9 / 12, 1 / 2 - 0.105], [10 / 12, 1 / 2], [11 / 12, 1 / 2 - 0.105], [12 / 12, 1 / 2],
            [0, 0], [1 / 12, -0.105], [2 / 12, 0], [3 / 12, -0.105], [4 / 12, 0], [6 / 12, 0], [7 / 12, -0.105], [8 / 12, 0], [9 / 12, -0.105], [10 / 12, 0], [11 / 12, -0.105], [12 / 12, 0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x12,
    },
    "abd_7_8_7": { //奥比岛 7+8+7
        name: "abd_7_8_7",
        displayName: "22键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
        x x x x x x x
       x x x x x x x x
        x x x x x x x
        */
        relativeKeyPosition: [
            [0, 1], [1 / 6, 1], [2 / 6, 1], [3 / 6, 1], [4 / 6, 1], [5 / 6, 1], [6 / 6, 1],
            [0 - 1 / 12, 1 / 2], [0 + 1 / 12, 1 / 2], [1 / 6 + 1 / 12, 1 / 2], [2 / 6 + 1 / 12, 1 / 2], [3 / 6 + 1 / 12, 1 / 2], [4 / 6 + 1 / 12, 1 / 2], [5 / 6 + 1 / 12, 1 / 2], [6 / 6 + 1 / 12, 1 / 2],
            [0, 0], [1 / 6, 0], [2 / 6, 0], [3 / 6, 0], [4 / 6, 0], [5 / 6, 0], [6 / 6, 0],
        ],
        noteKeyMap: noteKeyMaps.abd_7_8_7,
    },
    "abd_8_7": { //奥比岛 8+7
        name: "abd_8_7",
        displayName: "15键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
         x x x x x x x
        x x x x x x x x
        */
        relativeKeyPosition: [
            [0,1],[2/14,1],[4/14,1],[6/14,1],[8/14,1],[10/14,1],[12/14,1],[14/14,1],
            [1/14,0],[3/14,0],[5/14,0],[7/14,0],[9/14,0],[11/14,0],[13/14,0],
        ],
        noteKeyMap: noteKeyMaps.abd_8_7,
    },
    "hpma_yinterleaved3x12": { //哈利波特魔法觉醒 y交错的3x12 aka专业模式. 比蛋仔派对的那个高
        name: "hpma_yinterleaved3x12",
        displayName: "专业模式",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        /*
         x x   x x x 
        x x x x x x x
         x x   x x x 
        x x x x x x x
         x x   x x x 
        x x x x x x x
        */
        relativeKeyPosition: [
            [-1/10,5/5],[0/10,4/5],[1/10,5/5],[2/10,4/5],[3/10,5/5],[4/10,5/5],[5/10,4/5],[6/10,5/5],[7/10,4/5],[8/10,5/5],[9/10,4/5],[10/10,5/5],
            [-1/10,3/5],[0/10,2/5],[1/10,3/5],[2/10,2/5],[3/10,3/5],[4/10,3/5],[5/10,2/5],[6/10,3/5],[7/10,2/5],[8/10,3/5],[9/10,2/5],[10/10,3/5],
            [-1/10,1/5],[0/10,0/5],[1/10,1/5],[2/10,0/5],[3/10,1/5],[4/10,1/5],[5/10,0/5],[6/10,1/5],[7/10,0/5],[8/10,1/5],[9/10,0/5],[10/10,1/5],
        ],
        noteKeyMap: noteKeyMaps.generic_3x12,
    },
    "hpma_2x7": { //哈利波特魔法觉醒 2x7
        name: "hpma_2x7",
        displayName: "普通模式",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 2,
        column: 7,
        relativeKeyPosition: undefined,
        noteKeyMap: noteKeyMaps.hpma_2x7,
    }, 
    "mrzh_3x12":{
        name: "mrzh_3x12",
        displayName: "传统模式",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 3,
        column: 12,
        noteKeyMap: noteKeyMaps.mrzh_3x12,
    },
    "xdxz_7_7_8":{
        name: "xdxz_7_7_8",
        displayName: "22键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [0.08,1],[0.23,1],[0.39,1],[0.54,1],[0.69,1],[0.84,1],[1,1],
            [0.08,0.5],[0.23,0.5],[0.39,0.5],[0.54,0.5],[0.69,0.5],[0.84,0.5],[1,0.5],
            [0,0],[0.15,0],[0.31,0],[0.46,0],[0.61,0],[0.76,0],[0.91,0],[1.08,0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7_1,
    },
    "xdxz_7_7_8_half": {
        name: "xdxz_7_7_8_half",
        displayName: "22键带半音",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [0.08,1],[0.15,0.90],[0.23,1],[0.31,0.90],[0.39,1],[0.54,1],[0.61,0.90],[0.69,1],[0.76,0.90],[0.84,1],[0.91,0.90],[1,1],
            [0.08,0.5],[0.15,0.4],[0.23,0.5],[0.31,0.4],[0.39,0.5],[0.54,0.5],[0.61,0.4],[0.69,0.5],[0.76,0.4],[0.84,0.5],[0.91,0.4],[1,0.5],
            [0,0],[0.08,-0.1],[0.15,0],[0.22,-0.1],[0.31,0],[0.46,0],[0.54,-0.1],[0.61,0],[0.69,-0.1],[0.76,0],[0.84,-0.1],[0.91,0],[1.08,0],

        ],
        noteKeyMap: noteKeyMaps.generic_3x12_1,
    },
    "speedmobile_interleaved3x12_1": {
        name: "speedmobile_interleaved3x12_1",
        displayName: "37键",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [0,1],[0.08,1],[0.16,1],[0.24,1],[0.33,1],[0.5,1],[0.58,1],[0.66,1],[0.74,1],[0.83,1],[0.91,1],[1,1],
            [0.08,0.5],[0.16,0.5],[0.24,0.5],[0.33,0.5],[0.41,0.5],[0.58,0.5],[0.66,0.5],[0.74,0.5],[0.83,0.5],[0.91,0.5],[1,0.5],[1.08,0.5],
            [0,0],[0.08,0],[0.16,0],[0.24,0],[0.33,0],[0.5,0],[0.58,0],[0.66,0],[0.74,0],[0.83,0],[0.91,0],[1,0],[1.16,0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x12_1,
    },
    "mhls_curved3x7": {  //猫和老鼠
        name: "mhls_curved3x7",
        displayName: "21键(弧形)",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,  //FIXME: 这个没办法简单的确定！
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [-0.29,0.49],[-0.12,1.01],[0.15,1.34],[0.43,1.50],[0.74,1.34],[0.99,1.01],[1.18,0.49],
            [-0.15,0.26],[-0.00,0.64],[0.22,0.91],[0.43,0.99],[0.67,0.91],[0.88,0.64],[1.03,0.26],
            [0,0],[0.11,0.30],[0.28,0.44],[0.43,0.49],[0.6,0.44],[0.77,0.3],[0.89,-0.06],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7,
    },
    "yjwj_curved3x7":{  //永劫无间
        name: "yjwj_curved3x7",
        displayName: "21键(弧形)",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
           [0,1],[0.17,1.04],[0.33,1.08],[0.50,1.09],[0.66,1.08],[0.83,1.04],[1,1],
           [0,0.5],[0.17,0.54],[0.33,0.58],[0.50,0.59],[0.66,0.58],[0.83,0.54],[1,0.5],
           [0,0],[0.17,0.05],[0.33,0.08],[0.50,0.09],[0.66,0.08],[0.83,0.05],[1,0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7,
    },
    "jw3_sloped3x7": {
        name: "jw3_sloped3x7",
        displayName: "21键(倾斜)",
        type: KeyLayoutTypes.arbitrary,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: undefined,
        column: undefined,
        relativeKeyPosition: [
            [0.1,1],[0.24,1],[0.4,1],[0.56,1],[0.70,1],[0.85,1],[1,1],
            [0.05,0.5],[0.20,0.5],[0.35,0.5],[0.50,0.5],[0.65,0.5],[0.80,0.5],[0.95,0.5],
            [0,0],[0.15,0],[0.30,0],[0.45,0],[0.60,0],[0.75,0],[0.90,0],
        ],
        noteKeyMap: noteKeyMaps.generic_3x7,
    },
};

//光遇: 乐曲调式对应的地图所在位置
//https://www.bilibili.com/read/cv15735140/
const skyTuneMapPosition = {
    "C": "遇境/晨岛沙漠地带/预言山谷中间/雨林第三个到第四个门之间（隐藏图入口）左侧有小金人的亭子/雨林四个金人的隐藏图的开头/雨林终点/霞光城/霞光城水底/禁阁地下室？/暴风眼第一阶段",
    "Db": "晨岛终点旁的小岛/云野八人图/雨林第四道门到终点之间小金人的亭子（隐藏图出口）/禁阁三楼",
    "D": "云野初始图后面/云野的中央大图（二图?）/云野右侧隐藏图（两个小破塔的那个）/圣岛/霞谷终点/霞谷迷宫/禁阁二楼/墓土三龙图/墓土终点/禁阁开头没到一楼的位置",
    "Eb": "雨林第三道门到第四道门中间右侧的有小金人的亭子/墓土无龙图/墓土方舟/墓土四龙图/墓土沉船",
    "E": "重生之路的星河",
    "F": "云野三塔的终点大塔/雨林两个金人的隐藏图/霞谷飞行赛道的城堡（中间有个球的那个小破城）/办公室两个入口之间/禁阁一楼",
    "Gb": "雨林第四道门到终点的最后一个塔",
    "G": "雨林初始图/晨岛飞往终点的悬崖",
    "Ab": "晨岛终点祭坛/预言山谷开头/霞谷赛道终点",
    "A": "霞谷开头的溜冰三岔口/禁阁终点祭坛/禁阁四楼小破塔顶",
    "Bb": "云野三塔图的二塔/雨林到霞谷的过渡图",
    "B": "禁阁二楼第一次变调后",
}

/**
 * 变体类型的具体配置
 * 游戏中会有不同的乐器, 它们共享同样的键位, 但音域可能不同. 
 * 因此使用这个类表示不同的变体
 * @typedef {{ 
 * variantType: string; 
 * variantName: string; 
 * availableNoteRange: [string,string] | undefined; 
 * noteDurationImplementionType: string; 
 * sameKeyMinInterval: number | undefined; 
 * noteKeyMap: Object.<string, number>| undefined; 
 * }} VariantConfigJson
 * @param {VariantConfigJson} json
 */
function VariantConfig(json) {
    /**
     * @type {string}
     * 变体类型
     */
    this.variantType = "";
    /**
     * @type {string}
     * 变体名称
     */
    this.variantName = "";
    /**
     * @type {[string,string] | undefined}
     * 可用音符范围[最小值,最大值]
     * @default undefined //表示使用noteKeyMap中的所有音符
     */
    this.availableNoteRange = undefined;
    /**
     * @type {string}
     * 音符时长的实现方式
     * @see NoteDurationImplementionTypes
     * @default "none"
     */
    this.noteDurationImplementionType = NoteDurationImplementionTypes.none;
    /**
     * @type {number | undefined}
     * 相同按键的最小间隔时间 (ms)
     * @default undefined //表示使用GameConfig中的值, 否则使用这个值 | 0表示不限制
     */
    this.sameKeyMinInterval = undefined;
    /**
     * @type {Object.<string, number> | undefined}
     * 音符按键映射表。如果为undefined则使用GameConfig中keyLayout对应noteKeyMap
     */
    this.noteKeyMap = undefined;

    /**
     * @param {VariantConfigJson} json
     */
    this.fromJSON = function (json) {
        this.variantType = json.variantType;
        this.variantName = json.variantName;
        this.availableNoteRange = json.availableNoteRange;
        this.noteDurationImplementionType = json.noteDurationImplementionType;
        this.sameKeyMinInterval = json.sameKeyMinInterval;
        this.noteKeyMap = json.noteKeyMap;
    }

    /**
     * @returns {VariantConfigJson}
     */
    this.toJSON = function () {
        return {
            variantType: this.variantType,
            variantName: this.variantName,
            availableNoteRange: this.availableNoteRange,
            noteDurationImplementionType: this.noteDurationImplementionType,
            sameKeyMinInterval: this.sameKeyMinInterval,
            noteKeyMap: this.noteKeyMap,
        };
    }

    if (json) {
        this.fromJSON(json);
    }
};

function GameConfig(json) {
    /**
     * @type {string}
     * 游戏类型
     * 可以为任意值
     */
    this.gameType = "";

    /**
     * @type {string}
     * 游戏名称
     * 可以为任意值
     */
    this.gameName = "";

    /**
     * @type {Array<KeyLayout>}
     * 可用的键位类型
     */
    this.keyTypes = [];

    /**
     * @type {Array<VariantConfig>}
     * 可用的变体。第一个变体为默认变体，如果只有一个变体，则不会显示变体选择界面
     */
    this.variants = [];

    /**
     * @type {number}
     * 相同按键的最小间隔时间 (ms)
     * @default 0
     */
    this.sameKeyMinInterval = 0;

    /**
     * @type {Array<string>}
     * 包名的一部分
     * @default []
     */
    this.packageNamePart = [];

    /**
     * 
     * @param {{ gameType: string; gameName: string; keyTypes: Array<KeyLayout>; variants: Array<VariantConfig>; sameKeyMinInterval: number; packageNamePart: Array<string>; }} json
     */
    this.fromJSON = function (json) {
        this.gameType = json.gameType;
        this.gameName = json.gameName;
        this.keyTypes = json.keyTypes;
        this.variants = json.variants;
        this.sameKeyMinInterval = json.sameKeyMinInterval;
        this.packageNamePart = json.packageNamePart;
    }

    this.toJSON = function () {
        return {
            gameType: this.gameType,
            gameName: this.gameName,
            keyTypes: this.keyTypes,
            variants: this.variants,
            sameKeyMinInterval: this.sameKeyMinInterval,
            packageNamePart: this.packageNamePart,
        }
    }
    if (json) {
        this.fromJSON(json);
    }
}

let defaultVariantConfig = new VariantConfig({
    variantType: "default",
    variantName: "默认",
    availableNoteRange: undefined,
    noteKeyMap: undefined,
    noteDurationImplementionType: NoteDurationImplementionTypes.none,
    sameKeyMinInterval: undefined,
});

const PreDefinedGameConfigs = [
    new GameConfig({
        gameType: "楚留香",
        gameName: "楚留香",
        keyTypes: [keyLayouts["generic_3x7"]],
        variants: [
            new VariantConfig({ //TODO:
                variantType: "default",
                variantName: "默认",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.extraLongKey,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 200,
        packageNamePart: ["wyclx"],
    }),
    new GameConfig({
        gameType: "天涯明月刀",
        gameName: "天涯明月刀",
        keyTypes: [keyLayouts["generic_3x7"]],
        variants: [
            defaultVariantConfig,
        ],
        sameKeyMinInterval: 100,
        packageNamePart: ["tmgp.wuxia"],
    }),
    new GameConfig({
        gameType: "原神",
        gameName: "原神",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["generic_2x7"]],
        variants: [
            new VariantConfig({
                variantType: "风物之诗琴",
                variantName: "风物之诗琴",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "晚风圆号",
                variantName: "晚风圆号",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.native,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "老旧的诗琴",
                variantName: "老旧的诗琴",
                availableNoteRange: undefined,
                noteKeyMap: noteKeyMaps.genshin_oldsq_3x7,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["genshin", "yuanshen", "ys.x"],
    }),
    new GameConfig({
        gameType: "光遇",
        gameName: "光遇",
        keyTypes: [keyLayouts["sky_3x5"], keyLayouts["sky_2x4"]],
        variants: [
           defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    }),
    new GameConfig({
        gameType: "逆水寒手游",
        gameName: "逆水寒",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["generic_3x12"], keyLayouts["nshm_1x7"], keyLayouts["nshm_professional.gu_zheng"], keyLayouts["nshm_professional.qv_di"], keyLayouts["nshm_professional.pi_pa"], keyLayouts["nshm_professional.suo_na"], keyLayouts["nshm_zhuangyuan_noteplacer_4x12"]],
        variants: [
            defaultVariantConfig,
            new VariantConfig({
                variantType: "古筝",
                variantName: "古筝",
                availableNoteRange: ["C2", "C6#"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "曲笛",
                variantName: "曲笛",
                availableNoteRange: ["G3", "D6"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.native,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "琵琶",
                variantName: "琵琶",
                availableNoteRange: ["A2", "D6"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "唢呐",
                variantName: "唢呐",
                availableNoteRange: ["E3", "B5"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.native,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["nshm"],
    }),
    new GameConfig({
        gameType: "蛋仔派对",
        gameName: "蛋仔派对",
        keyTypes: [keyLayouts["dzpd_interleaved3x7"], keyLayouts["dzpd_yinterleaved36"], keyLayouts["dzpd_7_8"]], //TODO: 架子鼓
        variants: [
            defaultVariantConfig 
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["party"],
    }),
    //永劫无间
    new GameConfig({
        gameType: "永劫无间",
        gameName: "永劫无间",
        keyTypes: [keyLayouts["yjwj_curved3x7"]],
        variants: [
            defaultVariantConfig,
            new VariantConfig({
                variantType: "笛子",
                variantName: "笛子",
                availableNoteRange: ["G3", "B5"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.l22"],
    }),
    new GameConfig({
        gameType: "黎明觉醒",
        gameName: "黎明觉醒",
        keyTypes: [keyLayouts["generic_3x7"]], //TODO: 钢琴
        variants: [
            defaultVariantConfig 
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["toaa"],
    }),
    new GameConfig({
        gameType: "奥比岛",
        gameName: "奥比岛",
        keyTypes: [keyLayouts["abd_7_8_7"], keyLayouts["abd_8_7"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["aobi"],
    }),
    new GameConfig({
        gameType: "哈利波特_魔法觉醒",
        gameName: "哈利波特: 魔法觉醒",
        keyTypes: [keyLayouts["hpma_yinterleaved3x12"], keyLayouts["hpma_2x7"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["harrypotter"],
    }),
    new GameConfig({
        gameType: "第五人格",
        gameName: "第五人格",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["hpma_yinterleaved3x12"]],
        variants: [
            defaultVariantConfig,
            new VariantConfig({
                variantType: "玉箫",
                variantName: "玉箫",
                availableNoteRange: ["C3", "B4"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["dwrg"],
    }),
    new GameConfig({
        gameType: "阴阳师",
        gameName: "阴阳师",
        keyTypes: [keyLayouts["generic_3x7"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["onmyoji"],
    }),
    new GameConfig({
        gameType: "摩尔庄园",
        gameName: "摩尔庄园",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["hpma_yinterleaved3x12"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mole"],
    }),
    new GameConfig({
        gameType: "明日之后",
        gameName: "明日之后",
        keyTypes: [keyLayouts["mrzh_3x12"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mrzh"],
    }),
    new GameConfig({
        gameType: "元梦之星",
        gameName: "元梦之星",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["hpma_yinterleaved36"]],
        variants: [
            defaultVariantConfig,
            new VariantConfig({
                variantType: "唢呐",
                variantName: "唢呐",
                availableNoteRange: ["E3", "B5"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["com.tencent.letsgo"],
    }),
    new GameConfig({
        gameType: "心动小镇",
        gameName: "心动小镇",
        //双排15键, 三排15键, 22键, 22键+半音
        keyTypes: [keyLayouts["xdxz_7_8"], keyLayouts["sky_3x5"], keyLayouts["xdxz_7_7_8"], keyLayouts["xdxz_7_7_8_half"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: [], //TODO:
    }),
    new GameConfig({
        gameType: "射雕英雄传",
        gameName: "射雕英雄传",
        keyTypes: [keyLayouts["generic_3x7"]],
        variants: [  //TODO: 这个游戏应该是有长音按钮的
            defaultVariantConfig,
            new VariantConfig({
                variantType: "竹笛",
                variantName: "竹笛",
                availableNoteRange: ["G3", "A5"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
            new VariantConfig({
                variantType: "洞箫",
                variantName: "洞箫",
                availableNoteRange: ["C3", "B4"],
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sdyxz"], 
    }),
    //qq飞车
    new GameConfig({
        gameType: "qq飞车",
        gameName: "qq飞车",
        keyTypes: [keyLayouts["speedmobile_interleaved3x7_1"], keyLayouts["speedmobile_interleaved3x12_1"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["speedmobile"],
    }),
    //创造与魔法
    new GameConfig({
        gameType: "创造与魔法",
        gameName: "创造与魔法",
        keyTypes: [keyLayouts["sky_3x5"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["hero.sm"],
    }),
    //妄想山海
    new GameConfig({
        gameType: "妄想山海",
        gameName: "妄想山海",
        keyTypes: [keyLayouts["generic_3x7"]],  //TODO: 钢琴
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.djsy"],
    }),
    //我的世界
    new GameConfig({
        gameType: "我的世界",
        gameName: "我的世界",
        keyTypes: [keyLayouts["generic_3x7"]],  //TODO: 钢琴
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.mc","netease.x19"],
    }),
    //迷你世界
    new GameConfig({
        gameType: "迷你世界",
        gameName: "迷你世界",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["dzpd_yinterleaved36"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["miniworld"],
    }),
    //猫和老鼠
    new GameConfig({
        gameType: "猫和老鼠",
        gameName: "猫和老鼠",
        keyTypes: [keyLayouts["mhls_curved3x7"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tom"],
    }),
    //宅时光
    new GameConfig({
        gameType: "宅时光",
        gameName: "宅时光",
        keyTypes: [keyLayouts["hpma_yinterleaved3x12"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["housetime"],
    }),
    //剑网3
    new GameConfig({
        gameType: "剑网3",
        gameName: "剑网3",
        keyTypes: [keyLayouts["mhls_curved3x7"], keyLayouts["jw3_sloped3x7"]],  //这个弧形键位不一定能用，管他呢，有人报bug再说
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.jx3m"],
    }),
    //TODO: 以闪亮之名
    //
    //自定义1
    new GameConfig({
        gameType: "自定义1",
        gameName: "自定义1",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["generic_3x12"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    }),
    new GameConfig({
        gameType: "自定义2",
        gameName: "自定义2",
        keyTypes: [keyLayouts["generic_3x7"], keyLayouts["generic_3x12"]],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    }),
];

/**
 * @constructor
 */
function GameProfile() {

    var preDefinedGameConfigs = PreDefinedGameConfigs;

    /**
     * @type {GameConfig[]}
     */
    var gameConfigs = [];

    /**
     * @type {GameConfig | undefined}
     * 当前生效的游戏配置
     */
    var currentGameConfig = undefined;
    //当前生效的键位布局名
    var currentKeyTypeName = "";
    //当前生效的变体名
    var currentVariantType = "";
    //当前生效的游戏类型-键位布局名, 用于在keyLocators中查找键位配置
    var currentGameTypeKeyTypeName = "";

    /**
     * @type {Map<string,Array<pos2d>>}
     * @description 所有游戏的键位配置(gameType-keyTypeName , pos1, pos2)
     */
    var keyLocators = new Map();


    /**
     * @type {Array<pos2d>?}
     * @description 按键位置数组(从下到上, 从左到右)
     */
    var cachedKeyPos = null;

    /**
     * @type {Map<number,number>?}
     * @description midi音高到按键序号(1开始)的映射
     */
    var cachedPitchKeyMap = null;

    /**
     * @type {[number,number]?}
     * @description midi音高范围. 加快查找速度
     */
    var cachedNoteRange = null;

    /**
     * @brief 将当前生效的游戏配置以指定的默认配置覆盖
     * @param {string} name gameType
     * @returns {boolean} 成功返回true, 否则false
     */
    this.resetConfig = function (name) {
        for (let i = 0; i < preDefinedGameConfigs.length; i++) {
            if (preDefinedGameConfigs[i].gameType == name) {
                currentGameConfig = new GameConfig();
                currentGameConfig.fromJSON(preDefinedGameConfigs[i]);
                return true;
            }
        }

        return false;
    }

    /**
     * @brief 加载配置列表
     * @param {Array<Object>} configs 配置列表
     */
    this.loadGameConfigs = function (configs) {
        for (let i = 0; i < configs.length; i++) {
            gameConfigs.push(new GameConfig());
            gameConfigs[i].fromJSON(configs[i]);
        }
    }

    /**
     * @brief 加载默认配置列表
     */
    this.loadDefaultGameConfigs = function () {
        this.loadGameConfigs(preDefinedGameConfigs);
    }

    /**
     * @brief 更新配置列表(当前配置)
     */
    this.updateGameConfigs = function () {
        //将当前配置保存到gameConfigs中
        if (currentGameConfig == null) {
            return;
        }
        let haveCurrentConfig = false;
        for (let i = 0; i < gameConfigs.length; i++) {
            if (gameConfigs[i].gameType == currentGameConfig.gameType) {
                haveCurrentConfig = true;
                gameConfigs[i] = currentGameConfig;
                break;
            }
        }
        if (!haveCurrentConfig) {
            gameConfigs.push(currentGameConfig);
        }
    }

    /**
     * @brief 获取配置列表
     * @returns {GameConfig[]} 配置列表
     */
    this.getGameConfigs = function () {
        this.updateGameConfigs();
        return gameConfigs;
    }

    /**
     * 根据包名设定当前配置
     * @param {string} packageName 包名
     * @returns {boolean} 是否设置成功
     */
    this.setConfigByPackageName = function (packageName) {
        if(packageName == null || packageName == ""){
            return false;
        }
        //首先检查当前配置是否符合要求
        if (currentGameConfig != null) {
            for (let i = 0; i < currentGameConfig.packageNamePart.length; i++) {
                if (packageName.indexOf(currentGameConfig.packageNamePart[i]) != -1) {
                    return true;
                }
            }
        }
        // 检查配置列表中是否有符合要求的配置
        let config = gameConfigs.find(function (config) {
            return config.packageNamePart.some(function (part) {
                return packageName.indexOf(part) != -1;
            });
        });
        if (config == null) {
            return false;
        }
        currentGameConfig = config;
        return true;
    }

    /**
     * 根据配置名(游戏类型)确定当前配置
     * @param {string} gameType 配置文件名
     * @returns {boolean} 是否设置成功
     */
    this.setConfigByName = function (gameType) {
        let config = gameConfigs.find(function (config) {
            return config.gameType == gameType;
        });
        if (config == null) {
            return false;
        }
        currentGameConfig = config;
        return true;
    }

    /**
     * 获取配置文件名的列表
     * @returns {Array<string>} 配置文件名列表
     */
    this.getConfigNameList = function () {
        return gameConfigs.map(function (config) {
            return config.gameType;
        });
    }

    /**
     * 获取所有键位配置
     * @returns {Map<string,Array<pos2d>>} 键位配置
     */
    this.getKeyLocators = function () {
        return keyLocators;
    }

    /**
     * 设置所有键位配置 
     * @param {Map<string,Array<pos2d>>} keyLocators 键位配置
     */
    this.setKeyLocators = function (keyLocators) {
        this.keyLocators = keyLocators;
    }

    this.getCurrentConfig = function () {
        return currentGameConfig;
    }

    this.getCurrentConfigTypeName = function () {
        if (currentGameConfig == undefined) {
            return
        }
        return currentGameConfig.gameType;
    }

    this.getCurrentConfigDisplayName = function () {
        if (currentGameConfig == undefined) {
            return
        }
        return currentGameConfig.gameName;
    }

    this.setCurrentConfig = function (config) {
        currentGameConfig = config;
    }

    this.getCurrentAvailableVariants = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.variants
    }

    this.getCurrentAvailableKeyLayouts = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.keyTypes;

    }

    this.getAllKeyLayouts = function () {
        return keyLayouts;
    }

    this.setCurrentVariantByTypeName = function (/** @type {string} */ variantType) {
        let variants = this.getCurrentAvailableVariants();
        if (variants == undefined) {
            return false;
        }
        if (variants.find(function (variant) {
            return variant.variantType == variantType;
        }) == undefined) {
            return false;
        }

        currentVariantType = variantType;
    }

    this.getCurrentVariant = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        return currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
    }

    this.getCurrentVariantTypeName = function () {
        return currentVariantType;
    }

    this.getCurrentVariantDisplayName = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        let variant = this.getCurrentVariant();
        if (variant == undefined) {
            return undefined;
        }
        //如果为唯一的配置，则不显示配置名
        if (currentGameConfig.variants.length == 1) {
            return "";
        }
        return variant.variantName;
    }

    this.setCurrentVariantDefault = function () {
        if (currentGameConfig == undefined) {
            return;
        }
        console.log(JSON.stringify(currentGameConfig));
        currentVariantType = currentGameConfig.variants[0].variantType;
    }

    this.setCurrentKeyLayoutByTypeName = function (/** @type {string} */ keyTypeName) {
        if (currentGameConfig == undefined) {
            return;
        }
        let keyTypes = currentGameConfig.keyTypes;
        if (keyTypes == undefined) {
            return false;
        }
        if (keyTypes.find(function (keyType) {
            return keyType.name == keyTypeName;
        }) == undefined) {
            return false;
        }
        currentKeyTypeName = keyTypeName;
        currentGameTypeKeyTypeName = `${currentGameConfig.gameType}-${currentKeyTypeName}`;
    }

    this.getCurrentKeyLayout = function () {
        return keyLayouts[currentKeyTypeName];
    }

    this.setCurrentKeyLayoutDefault = function () {
        if (currentGameConfig == undefined) {
            return;
        }
        currentKeyTypeName = currentGameConfig.keyTypes[0].name;
        currentGameTypeKeyTypeName = `${currentGameConfig.gameType}-${currentKeyTypeName}`;
    }

    this.getCurrentKeyLayoutDisplayName = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        let KeyType = this.getCurrentKeyLayout();
        if (KeyType == undefined) {
            return undefined;
        }
        // //如果为唯一的配置，则不显示配置名
        // if (currentGameConfig.keyTypes.length == 1) {
        //     return "";
        // }
        return KeyType.displayName;
    }

    this.getCurrentKeyLayoutTypeName = function () {
        return currentKeyTypeName;
    }

    this.getProfileIdentifierTriple = function () {
        return `${this.getCurrentConfigTypeName()}-${this.getCurrentKeyLayoutTypeName()}-${this.getCurrentVariantTypeName()}`;
    }

    /**
     * 获取当前按键参数
     * @returns {KeyLayout} 当前按键参数
     */
    this.getKeyLayout = function () {
        return keyLayouts[currentKeyTypeName];
    }

    this.setKeyPosition = function (pos1, pos2) {
        if (currentGameConfig == undefined) {
            return false;
        }
        keyLocators[currentGameTypeKeyTypeName] = [pos1, pos2];
        return true;
    }

    this.checkKeyPosition = function () {
        if (currentGameConfig == undefined) {
            return false;
        }
        if (keyLocators[currentGameTypeKeyTypeName] == undefined) {
            return false;
        }
        let pos = keyLocators[currentGameTypeKeyTypeName];
        if (pos[0][0] == 0 && pos[0][1] == 0 && pos[1][0] == 0 && pos[1][1] == 0) {
            return false;
        }
        return true;
    }

    this.generateKeyPosition = function () {
        if (currentGameConfig == null) {
            return false;
        }
        let currentLayout = keyLayouts[currentKeyTypeName];
        switch (currentLayout.type) {
            case KeyLayoutTypes.grid:{
                let leftTop = 0;
                let rightBottom = 0;
                if (currentLayout.locator == KeyLocatorTypes.left_top_right_bottom) {
                    leftTop = keyLocators[currentGameTypeKeyTypeName][0];
                    rightBottom = keyLocators[currentGameTypeKeyTypeName][1];
                } else {
                    console.log("TODO:unsupported key locator type: " + currentLayout.locator);
                }
                let row = currentLayout.row;
                let col = currentLayout.column;

                let width = rightBottom[0] - leftTop[0];
                let height = rightBottom[1] - leftTop[1];
                //左下角为原点 
                //@ts-ignore
                let keyWidth = width / (col - 1); //@ts-ignore
                let keyHeight = height / (row - 1);
                let keyPos = [];//@ts-ignore
                for (let i = 0; i < row; i++) {//@ts-ignore
                    for (let j = 0; j < col; j++) {
                        let x = leftTop[0] + j * keyWidth;//@ts-ignore
                        let y = leftTop[1] + (row - i - 1) * keyHeight;
                        keyPos.push([Math.round(x), Math.round(y)]);
                    }
                }
                //@ts-ignore
                cachedKeyPos = keyPos;
                console.log("generated key position: " + JSON.stringify(keyPos));
                return true;
            }
            case KeyLayoutTypes.arbitrary: {
                let leftTop = 0;
                let rightBottom = 0;
                if (currentLayout.locator == KeyLocatorTypes.left_top_right_bottom) {
                    leftTop = keyLocators[currentGameTypeKeyTypeName][0];
                    rightBottom = keyLocators[currentGameTypeKeyTypeName][1];
                } else {
                    console.log("TODO:unsupported key locator type: " + currentLayout.locator);
                }

                let width = rightBottom[0] - leftTop[0];
                let height = rightBottom[1] - leftTop[1];
                let keyPos = [];
                if(currentLayout.relativeKeyPosition == undefined){
                    console.error("relativeKeyPosition is undefined");
                    return false;
                }
                for (let i = 0; i < currentLayout.relativeKeyPosition.length; i++) {
                    let x = leftTop[0] + currentLayout.relativeKeyPosition[i][0] * width;
                    let y = leftTop[1] + currentLayout.relativeKeyPosition[i][1] * height;
                    keyPos.push([Math.round(x), Math.round(y)]);
                }
                //@ts-ignore
                cachedKeyPos = keyPos;
                console.log("generated key position: " + JSON.stringify(keyPos));
                return true;
            }
            case KeyLayoutTypes.nshm_professional:{
                //逆水寒手游的"专业"按键布局
                //这个就很麻烦了...

                //类似于这样的布局
                // x x   x x x   x x   x
                //x x x x x x x x x x x x 
                let leftTopRelativePos = /** @type {[number|null,number]} */ ([null, 0]); //x未知，y为0
                let rightBottomRelativePos =  /** @type {[number|null,number]} */ ([null, 1]); //x未知，y为1
                let keyRelativePoss = new Array();
                let currentVariant = currentGameConfig.variants.find(function (variant) {
                    return variant.variantType == currentVariantType;
                });
                if (currentVariant == undefined) {
                    console.error("currentVariant is undefined");
                    return false;
                }
                let pitchRange = currentVariant.availableNoteRange;
                if (pitchRange == undefined) {
                    console.error("pitchRange is undefined");
                    return false;
                }
                let startPitch = midiPitch.nameToMidiPitch(pitchRange[0]);
                let endPitch = midiPitch.nameToMidiPitch(pitchRange[1]);
                console.log("startPitch: " + startPitch + ", endPitch: " + endPitch);
                let curRelativeX = 0;
                for (let i = startPitch; i <= endPitch; i++) {
                    let curKeyRelativePos;
                    if (midiPitch.isHalf(i)) {
                        curKeyRelativePos = [curRelativeX, 0];
                        curRelativeX += 1 / 2;
                    } else if (i % 12 == 4 || i % 12 == 11) {
                        curKeyRelativePos = [curRelativeX, 1];
                        curRelativeX += 1;
                    } else {
                        curKeyRelativePos = [curRelativeX, 1];
                        curRelativeX += 1/2;
                    }

                    if (curKeyRelativePos[1] == 0) { //上一排
                        if (leftTopRelativePos[0] == null) {
                            leftTopRelativePos[0] = curKeyRelativePos[0]; //第一个
                        }
                    } else {
                        rightBottomRelativePos[0] = curKeyRelativePos[0]; //最后一个
                    }
                    keyRelativePoss.push(curKeyRelativePos.slice());
                }
                console.verbose("keyRelativePoss: " + JSON.stringify(keyRelativePoss));
                console.verbose("leftTopRelativePos: " + JSON.stringify(leftTopRelativePos));
                console.verbose("rightBottomRelativePos: " + JSON.stringify(rightBottomRelativePos));
                if(leftTopRelativePos[0] == null || rightBottomRelativePos[0] == null){
                    console.error("leftTopRelativePos[0] == null || rightBottomRelativePos[0] == null (请将此问题反馈给开发者)");
                    return false;
                }
                let leftTopAbsolutePos = [0, 0];
                let rightBottomAbsolutePos = [0, 0];
                if (currentLayout.locator == KeyLocatorTypes.left_top_right_bottom) {
                    leftTopAbsolutePos = keyLocators[currentGameTypeKeyTypeName][0];
                    rightBottomAbsolutePos = keyLocators[currentGameTypeKeyTypeName][1];
                } else {
                    console.log("TODO:unsupported key locator type: " + currentLayout.locator);
                }
                //坐标变换
                let xScale = (rightBottomAbsolutePos[0] - leftTopAbsolutePos[0]) / (rightBottomRelativePos[0] - leftTopRelativePos[0]);
                let yScale = (rightBottomAbsolutePos[1] - leftTopAbsolutePos[1]) / (rightBottomRelativePos[1] - leftTopRelativePos[1]);
                let xTranslate = leftTopAbsolutePos[0] - leftTopRelativePos[0] * xScale;
                let yTranslate = leftTopAbsolutePos[1] - leftTopRelativePos[1] * yScale;
                let keyAbsolutePoss = keyRelativePoss.map(function (keyRelativePos) {
                    return [keyRelativePos[0] * xScale + xTranslate, keyRelativePos[1] * yScale + yTranslate];
                })
                //@ts-ignore
                cachedKeyPos = keyAbsolutePoss;
                console.log("generated key position: " + JSON.stringify(cachedKeyPos));
                return true;
            }
            default:
                console.log("TODO:unknown/unimplemented key layout type: " + currentLayout.type);
                return false;
        }
    }

    /**
     * 获取按键位置
     * @param {number} key 按键序号(从0开始)
     * @returns {[number, number]} 按键位置
     */
    this.getKeyPosition = function (key) {
        if (cachedKeyPos == null) {
            this.generateKeyPosition();
        }
        //@ts-ignore
        return cachedKeyPos[key];
    }

    /**
     * 获取全部按键位置
     * @returns {Array<pos2d>} 按键位置数组
     */
    this.getAllKeyPositions = function () {
        if (cachedKeyPos == null) {
            this.generateKeyPosition();
        }
        //@ts-ignore
        return cachedKeyPos;
    }

    this.generatePitchKeyMap = function () {
        if (currentGameConfig == null) {
            console.log("currentGameConfig is null");
            return new Map();
        }
        let currentVariant = currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
        let pitchKeyMap = new Map();
        let currentKeyLayoutType = keyLayouts[currentKeyTypeName].type;
        if (currentKeyLayoutType == KeyLayoutTypes.arbitrary ||
            currentKeyLayoutType == KeyLayoutTypes.grid) {
            let keyLayoutAssociatedKeyMap = keyLayouts[currentKeyTypeName].noteKeyMap;
            let variantDefinedKeyMap = currentVariant.noteKeyMap;
            //优先使用variant中定义的按键映射
            let keyMap = variantDefinedKeyMap == undefined ? keyLayoutAssociatedKeyMap : variantDefinedKeyMap;
            if (keyMap == undefined) {
                console.log("keyMap is undefined");
                return new Map();
            }

            let availableNoteRange = currentVariant.availableNoteRange;
            let availableNoteRangeStart = 0;
            let availableNoteRangeEnd = 9999;
            if (availableNoteRange != undefined) {
                availableNoteRangeStart = midiPitch.nameToMidiPitch(availableNoteRange[0]);
                availableNoteRangeEnd = midiPitch.nameToMidiPitch(availableNoteRange[1]);
            }

            let pitchStrs = Object.keys(keyMap);
            console.log("pitchStrs: " + JSON.stringify(pitchStrs));
            for (let i = 0; i < pitchStrs.length; i++) {
                let pitchStr = pitchStrs[i];
                let pitch = midiPitch.nameToMidiPitch(pitchStr);
                if (pitch < availableNoteRangeStart || pitch > availableNoteRangeEnd) {
                    console.log("pitch: " + pitch + " is not in available note range for variant: " + currentVariantType);
                    continue;
                }
                console.log("pitch: " + pitch + " pitchStr: " + pitchStr + " key: " + keyMap[pitchStr]);
                pitchKeyMap.set(pitch, keyMap[pitchStr]);
            }
        } else if (currentKeyLayoutType == KeyLayoutTypes.nshm_professional) {
            //生成按键映射
            let pitchRange = currentVariant.availableNoteRange;
            if (pitchRange == undefined) {
                console.error("pitchRange is undefined");
                return false;
            }
            let startPitch = midiPitch.nameToMidiPitch(pitchRange[0]);
            let endPitch = midiPitch.nameToMidiPitch(pitchRange[1]);
            let cnt = 1;
            for (let i = startPitch; i <= endPitch; i++) {
                let key = cnt;
                pitchKeyMap.set(i, key);
                cnt++;
            }
        } else {
            console.log("TODO:unknown/unimplemented key layout type: " + currentKeyLayoutType);
            return new Map();
        }

        // console.log("generated pitch key map: " + JSON.stringify(pitchKeyMap) + " map:" + pitchKeyMap);
        return pitchKeyMap;
    }

    /**
     * 根据 MIDI 音高值获取对应的按键名。
     * @param {number} pitch - MIDI 音高值。
     * @returns {number} MIDI 音高值对应的按键序号，从0开始，如果没有对应的按键则返回-1。
     */
    this.getKeyByPitch = function (pitch) {
        if (cachedPitchKeyMap == null) {
            cachedPitchKeyMap = this.generatePitchKeyMap();
        }
        let res = cachedPitchKeyMap.get(pitch);
        if (res === undefined) {
            return -1;
        }
        return res - 1;
    }

    /**
     * 根据按键序号获取对应的 MIDI 音高值。
     * @param {number} key - 按键序号，从0开始。
     * @returns {number} 按键序号对应的 MIDI 音高值，如果没有对应的 MIDI 音高值则返回-1。
     */
    this.getPitchByKey = function (key) {
        if (cachedPitchKeyMap == null) {
            cachedPitchKeyMap = this.generatePitchKeyMap();
        }
        // Iterate through the map to find the pitch for the given key
        for (let [pitch, mappedKey] of cachedPitchKeyMap) {
            if (mappedKey - 1 === key) {
                return pitch;
            }
        }
        // If no matching pitch is found, return -1
        return -1;
    }
    
    /**
     * 获取按键范围。
     * @returns {[number,number]} 按键范围，第一个元素为最小按键序号，第二个元素为最大按键序号。从1开始。
     */
    this.getKeyRange = function () {
        if (cachedPitchKeyMap == null) {
            cachedPitchKeyMap = this.generatePitchKeyMap();
        }
        let keys = Array.from(cachedPitchKeyMap.values());
        let minKey = 999;
        let maxKey = -1;
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key < minKey) {
                minKey = key;
            }
            if (key > maxKey) {
                maxKey = key;
            }
        }
        return [minKey, maxKey];
    }

    this.getNoteRange = function () {
        if (cachedNoteRange == null) {
            if (cachedPitchKeyMap == null) {
                cachedPitchKeyMap = this.generatePitchKeyMap();
            }
            let pitches = Array.from(cachedPitchKeyMap.keys());
            let minPitch = 999;
            let maxPitch = -1;
            for (let i = 0; i < pitches.length; i++) {
                let pitch = pitches[i];
                if (pitch < minPitch) {
                    minPitch = pitch;
                }
                if (pitch > maxPitch) {
                    maxPitch = pitch;
                }
            }
            cachedNoteRange = [minPitch, maxPitch];
        }
        return cachedNoteRange;
    }

    this.getSameKeyMinInterval = function () {
        if (currentGameConfig == undefined) {
            console.log("currentGameConfig is undefined");
            return undefined;
        }
        let currentVariant = currentGameConfig.variants[currentVariantType];
        if (currentVariant != undefined && currentVariant.sameKeyMinInterval != undefined) {
            return currentVariant.sameKeyMinInterval;
        }
        return currentGameConfig.sameKeyMinInterval;
    }

    /**
     * 获取物理上和指定按键距离靠近的按键
     * @param {number} key 指定按键
     * @returns {Array<[key: number, distance: number]>}  距离指定按键较近的按键序号和距离
     */
    this.getPhysicalClosestKeys = function (key) {
        if (cachedKeyPos == null) {
            this.generateKeyPosition();
        }
        let keyPos = cachedKeyPos[key];
        let closestKeys = [];
        for (let i = 0; i < cachedKeyPos.length; i++) {
            if (i == key) {
                continue;
            }
            let pos = cachedKeyPos[i];
            let distance = Math.sqrt(Math.pow(pos[0] - keyPos[0], 2) + Math.pow(pos[1] - keyPos[1], 2));
            closestKeys.push([i, distance]);
        }
        closestKeys.sort(function (a, b) {
            return a[1] - b[1];
        });
        return closestKeys;
    }

    /**
     * 获取物理上的按键最小距离
     * @returns {number} 物理上的按键最小距离(像素)
     */
    this.getPhysicalMinKeyDistance = function () {
        if (cachedKeyPos == null) {
            this.generateKeyPosition();
        }
        let minDistance = 999999;
        for (let i = 0; i < cachedKeyPos.length; i++) {
            for (let j = i + 1; j < cachedKeyPos.length; j++) {
                let distance = Math.sqrt(Math.pow(cachedKeyPos[i][0] - cachedKeyPos[j][0], 2) + Math.pow(cachedKeyPos[i][1] - cachedKeyPos[j][1], 2));
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }
        return minDistance;
    }

    /**
     * 清除当前配置的缓存
     */
    this.clearCurrentConfigCache = function () {
        cachedKeyPos = null;
        cachedPitchKeyMap = null;
        cachedNoteRange = null;
    }

    /**
     * 获取当前游戏与乐曲调式相关的提示信息
     * @param {string} key 调号
     * @returns {string} 提示信息
     * @see MidiPitch.getTranspositionEstimatedKey
     */
    this.getGameSpecificHintByEstimatedKey = function (key) {
        if (currentGameConfig == undefined) {
            return "";
        }
        if (currentGameConfig.gameType === "光遇") {
            return `光遇: 建议演奏位置: ${skyTuneMapPosition[key]}`;
        }
        if (currentGameConfig.gameType === "逆水寒手游") {
            return `逆水寒手游: 建议选择调式: ${key}`;       
        }
        return "";
    }
}

console.info("GameProfile.js loaded");

module.exports = GameProfile;
