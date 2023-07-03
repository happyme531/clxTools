//@ts-check
const midiPitch = require("./midiPitch.js");


const KeyLayoutTypes = {
    "grid": "grid",   //网格
    "arbitrary": "arbitrary", //任意
    //"nshm_professional": "nshm_professional", //TODO:逆水寒手游专业版
}

const KeyLocatorTypes = {
    //左上,右下(默认)
    "left_top_right_bottom": "left_top_right_bottom",
    //左下,右上
    "left_bottom_right_top": "left_bottom_right_top",
}

const NoteDurationImplementionTypes = {
    //根本不支持，所有音符都是一样长的
    "none": "none",
    //通过同时按住另外一个键来发出长音，但也只有两种长度
    "extraLongKey": "extraLongKey",
    //原生支持
    "native": "native",
}

const FeatureFlags = {
    //是否有全部半音
    "hasAllSemitone": "hasAllSemitone",
}

/**
 * @typedef {{
 * displayName: string,
 * type: string,
 * locator: string,
 * row: number|undefined,
 * column: number|undefined,
 * }} keyLayout
 * 
 * @type {Object.<string, keyLayout>}
 */
const keyLayouts = {
    "generic_3x7": {
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
    },
    "sky_3x5": {
        displayName: "3x5",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 3,
        column: 5,
    },
    "sky_2x4": {
        displayName: "2x4",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 2,
        column: 4,
    },
    "generic_3x12": {
        displayName: "3x12",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 3,
        column: 12,
    },
    "nshm_1x7": {
        displayName: "1x7",
        type: KeyLayoutTypes.grid,
        locator: KeyLocatorTypes.left_top_right_bottom,
        row: 1,
        column: 7,
    },
    // "nshm_professional":{ //TODO:
    //     displayName: "专业",
    //     type: keyLayoutTypes.nshm_professional,
    //     locator: keyLocatorTypes.left_top_right_bottom,
    //     //具体的键位由Variant决定
    // }
}

const noteKeyMaps = {
    "generic_3x7": {
        //音高与按键的映射, 左下角开始, 从左到右, 从下到上
        "C3": 1,
        "D3": 2,
        "E3": 3,
        "F3": 4,
        "G3": 5,
        "A3": 6,
        "B3": 7,
        "C4": 8,
        "D4": 9,
        "E4": 10,
        "F4": 11,
        "G4": 12,
        "A4": 13,
        "B4": 14,
        "C5": 15,
        "D5": 16,
        "E5": 17,
        "F5": 18,
        "G5": 19,
        "A5": 20,
        "B5": 21,
    },
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
    "generic_3x12": {
        //C5 C#5 D5 D#5 E5 F5 F#5 G5 G#5 A5 A#5 B5
        //C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4
        //C3 C#3 D3 D#3 E3 F3 F#3 G3 G#3 A3 A#3 B3
        "C3": 1,
        "C3#": 2,
        "D3": 3,
        "D3#": 4,
        "E3": 5,
        "F3": 6,
        "F3#": 7,
        "G3": 8,
        "G3#": 9,
        "A3": 10,
        "A3#": 11,
        "B3": 12,
        "C4": 13,
        "C4#": 14,
        "D4": 15,
        "D4#": 16,
        "E4": 17,
        "F4": 18,
        "F4#": 19,
        "G4": 20,
        "G4#": 21,
        "A4": 22,
        "A4#": 23,
        "B4": 24,
        "C5": 25,
        "C5#": 26,
        "D5": 27,
        "D5#": 28,
        "E5": 29,
        "F5": 30,
        "F5#": 31,
        "G5": 32,
        "G5#": 33,
        "A5": 34,
        "A5#": 35,
        "B5": 36,
    },
    "nshm_1x7": {
        //C4 D4 E4 F4 G4 A4 B4
        "C4": 1,
        "D4": 2,
        "E4": 3,
        "F4": 4,
        "G4": 5,
        "A4": 6,
        "B4": 7,
    },
}

/**
 * 变体类型的具体配置
 * 游戏中会有不同的乐器, 它们共享同样的键位, 但音域可能不同. 
 * 因此使用这个类表示不同的变体
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
     * @param {{ variantType: string; variantName: string; availableNoteRange: [string,string] | undefined; noteDurationImplementionType: string; sameKeyMinInterval: number | undefined; noteKeyMap: Object.<string, number>| undefined; }} json
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
     * @returns {{ variantType: string; variantName: string; availableNoteRange: [string,string]| undefined; noteDurationImplementionType: string; sameKeyMinInterval: number | undefined; noteKeyMap: Object.<string, number>| undefined; }}
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
     * @type {Array<string>}
     * 可用的键位类型
     */
    this.keyTypes = [];

    /**
     * @type {Map<string,[[number,number],[number,number]]>}
     * 键位类型对应的定位点坐标
     * @default new Map()
     */
    this.keyLocators = new Map();

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
     * @param {{ gameType: string; gameName: string; keyTypes: Array<string>; keyLocators: Map<string,[[number,number],[number,number]]>; variants: Array<VariantConfig>; sameKeyMinInterval: number; packageNamePart: Array<string>; }} json
     */
    this.fromJSON = function (json) {
        this.gameType = json.gameType;
        this.gameName = json.gameName;
        this.keyTypes = json.keyTypes;
        this.keyLocators = json.keyLocators;
        this.variants = json.variants;
        this.sameKeyMinInterval = json.sameKeyMinInterval;
        this.packageNamePart = json.packageNamePart;
    }

    this.toJSON = function () {
        return {
            gameType: this.gameType,
            gameName: this.gameName,
            keyTypes: this.keyTypes,
            keyLocators: this.keyLocators,
            variants: this.variants,
            sameKeyMinInterval: this.sameKeyMinInterval,
            packageNamePart: this.packageNamePart,
        }
    }
    if (json) {
        this.fromJSON(json);
    }
}

const PreDefinedGameConfigs = [
    new GameConfig({
        gameType: "楚留香",
        gameName: "楚留香",
        keyTypes: ["generic_3x7"],
        keyLocators: new Map([
            ["generic_3x7", [[0, 0], [0, 0]]],
        ]),
        variants: [
            new VariantConfig({
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
        keyTypes: ["generic_3x7"],
        keyLocators: new Map([
            ["generic_3x7", [[0, 0], [0, 0]]],
        ]),
        variants: [
            new VariantConfig({
                variantType: "default",
                variantName: "默认",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 100,
        packageNamePart: ["tmgp.wuxia"],
    }),
    new GameConfig({
        gameType: "原神",
        gameName: "原神",
        keyTypes: ["generic_3x7"],
        keyLocators: new Map([
            ["generic_3x7", [[0, 0], [0, 0]]],
        ]),
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
        keyTypes: ["sky_3x5", "sky_2x4"],
        keyLocators: new Map([
            ["sky_3x5", [[0, 0], [0, 0]]],
            ["sky_2x4", [[0, 0], [0, 0]]],
        ]),
        variants: [
            new VariantConfig({
                variantType: "default",
                variantName: "默认",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    }),
    new GameConfig({
        gameType: "逆水寒手游",
        gameName: "逆水寒",
        keyTypes: ["generic_3x7", "generic_3x12", "nshm_1x7"],
        keyLocators: new Map([
            ["generic_3x7", [[0, 0], [0, 0]]],
            ["generic_3x12", [[0, 0], [0, 0]]],
            ["nshm_1x7", [[0, 0], [0, 0]]],
        ]),
        variants: [
            new VariantConfig({
                variantType: "default",
                variantName: "默认",
                availableNoteRange: undefined,
                noteKeyMap: undefined,
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            }),
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["nshm"],
    }),
];


function GameProfile() {

    var preDefinedGameConfigs = PreDefinedGameConfigs;

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


    var cachedKeyPos = null;
    /**
     * @type {Map<number,number>?}
     * @description midi音高到按键序号(1开始)的映射
     */
    var cachedPitchKeyMap = null;
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
     * @returns 
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
            return keyType == keyTypeName;
        }) == undefined) {
            return false;
        }
        currentKeyTypeName = keyTypeName;
    }
    this.getCurrentKeyLayout = function () {
        return keyLayouts[currentKeyTypeName];
    }

    this.setCurrentKeyLayoutDefault = function () {
        if (currentGameConfig == undefined) {
            return;
        }
        currentKeyTypeName = currentGameConfig.keyTypes[0];
    }

    this.getCurrentKeyLayoutDisplayName = function () {
        if (currentGameConfig == undefined) {
            return undefined;
        }
        let KeyType = this.getCurrentKeyLayout();
        if (KeyType == undefined) {
            return undefined;
        }
        //如果为唯一的配置，则不显示配置名
        if (currentGameConfig.keyTypes.length == 1) {
            return "";
        }
        return KeyType.displayName;
    }
    this.getCurrentKeyLayoutTypeName = function () {
        return currentKeyTypeName;
    }

    /**
     * 获取当前按键参数
     * @returns {Object} 按键参数
     */
    this.getKeyType = function () {
        return keyLayouts[currentKeyTypeName];
    }

    this.setKeyPosition = function (pos1, pos2) {
        if (currentGameConfig == undefined) {
            return false;
        }
        currentGameConfig.keyLocators[currentKeyTypeName] = [pos1, pos2];
        return true;
    }

    this.checkKeyPosition = function () {
        if (currentGameConfig == undefined) {
            return false;
        }
        if (currentGameConfig.keyLocators[currentKeyTypeName] == undefined) {
            return false;
        }
        let pos = currentGameConfig.keyLocators[currentKeyTypeName];
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
            case KeyLayoutTypes.grid:
                let leftTop = 0;
                let rightBottom = 0;
                if (currentLayout.locator == KeyLocatorTypes.left_top_right_bottom) {
                    leftTop = currentGameConfig.keyLocators[currentKeyTypeName][0];
                    rightBottom = currentGameConfig.keyLocators[currentKeyTypeName][1];
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
                cachedKeyPos = keyPos;
                console.log("generated key position: " + JSON.stringify(keyPos));
                return true;
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
        return cachedKeyPos[key];
    }

    this.generatePitchKeyMap = function () {
        if (currentGameConfig == null) {
            console.log("currentGameConfig is null");
            return new Map();
        }
        let currentVariant = currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
        let keyLayoutAssociatedKeyMap = noteKeyMaps[currentKeyTypeName];
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

        let pitchKeyMap = new Map();
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
        // console.log("generated pitch key map: " + JSON.stringify(pitchKeyMap) + " map:" + pitchKeyMap);
        return pitchKeyMap;
    }

    /**
     * 根据 MIDI 音高值获取对应的按键名。
     * @param {number} pitch - MIDI 音高值。
     * @returns {number} MIDI 音高值对应的按键序号，从1开始，如果没有对应的按键则返回-1。
     */
    this.getKeyByPitch = function (pitch) {
        if (cachedPitchKeyMap == null) {
            cachedPitchKeyMap = this.generatePitchKeyMap();
        }
        let res = cachedPitchKeyMap.get(pitch);
        if (res === undefined) {
            return -1;
        }
        return res;
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

}

console.info("GameProfile.js loaded");

module.exports = GameProfile;
