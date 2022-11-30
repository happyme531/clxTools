//@ts-check
const midiPitch = require("./midiPitch.js");

const keyTypes = {
    "generic_3x7": {
        //名称
        name: "通用3x7",
        //行数
        row: 3,
        //列数
        column: 7,
        //音高与按键的映射, 左下角开始, 从左到右, 从下到上
        note_to_key_map: {
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
    },
    "sky_3x5": {
        name: "光遇3x5",
        row: 3,
        column: 5,
        // C3 D3 E3 F3 G3 
        // A3 B3 C4 D4 E4 
        // F4 G4 A4 B4 C5
        note_to_key_map: {
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
        }
    },
    "sky_2x4": {
        name: "光遇2x4",
        row: 2,
        column: 4,
        // A4 E5 G5 A5
        // C6 D6 E6 G6  
        note_to_key_map: {
            "C6": 1,
            "D6": 2,
            "E6": 3,
            "G6": 4,
            "A4": 5,
            "E5": 6,
            "G5": 7,
            "A5": 8,
        },
    },
    "genshin_oldsq_3x7":{
        name: "原神 老旧的诗琴 3x7",
        row: 3,
        column: 7,
        // C5 C#5 D#5 F5 G5 G#5 A#5
        // C4 D4 D#4 F4 G4 A4 A#4
        // C3 D3 D#3 F3 G3 A3 A#3
        note_to_key_map: {
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
    }
}


function GameConfig() {
    /**
     * @type {string}
     * 游戏类型
     * 可以为任意值
     */
    this.gameType = "";

    /**
     * @type {string}
     * 键位类型
     * 可选值："generic_3x7","sky_3x5","sky_2x4"
     * @default "generic_3x7"
     * 
     */
    this.keyType = "common_3x7";

    /**
     * @type {[number,number]}
     * 左上角的坐标 [x,y]
     * @default [0,0]
     */
    this.leftTop = [0, 0];

    /**
     * @type {[number,number]}
     * 右下角的坐标 [x,y]
     * @default [0,0]
     */
    this.rightBottom = [0, 0];

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
     * @param {{ gameType: string; keyType: any; leftTop: any; rightBottom: any; sameKeyMinInterval: any; packageNamePart: any; }} json 
     */
    this.fromJSON = function ( json) {
        this.gameType = json.gameType;
        this.keyType = json.keyType;
        this.leftTop = json.leftTop;
        this.rightBottom = json.rightBottom;
        this.sameKeyMinInterval = json.sameKeyMinInterval;
        this.packageNamePart = json.packageNamePart;
    }

    this.toJSON = function () {
        return {
            gameType: this.gameType,
            keyType: this.keyType,
            leftTop: this.leftTop,
            rightBottom: this.rightBottom,
            sameKeyMinInterval: this.sameKeyMinInterval,
            packageNamePart: this.packageNamePart,
        }
    }
}

const preDefinedGameConfigs = [
    {
        gameType: "楚留香",
        keyType: "generic_3x7",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 200,
        packageNamePart: ["wyclx"],
    },
    {
        gameType: "天涯明月刀",
        keyType: "generic_3x7",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 100,
        packageNamePart: ["tmgp.wuxia"],
    },
    {
        gameType: "原神",
        keyType: "generic_3x7",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 20,
        packageNamePart: ["genshin", "yuanshen","ys.x"],
    },
    {
        gameType: "原神(老旧的诗琴)",
        keyType: "genshin_oldsq_3x7",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 20,
        packageNamePart: ["genshin", "yuanshen","ys.x"],
    },
    {
        gameType: "光遇",
        keyType: "sky_3x5",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    },
    {
        gameType: "光遇_2x4",
        keyType: "sky_2x4",
        leftTop: [0, 0],
        rightBottom: [0, 0],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    },
]


function GameProfile() {

    var preDefinedGameConfigsJSON = preDefinedGameConfigs;

    var gameConfigs = [];

    var currentGameConfig = null;

    var cachedKeyPos = null;
    var cachedPitchKeyMap = null;
    var cachedNoteRange = null;

    /**
     * @brief 重置指定的配置
     * @param {string} name 配置名
     * @returns {boolean} 成功返回true, 否则false
     */
    this.resetConfig = function(name) {
        for (let i = 0; i < preDefinedGameConfigsJSON.length; i++) {
            if (preDefinedGameConfigsJSON[i].gameType == name) {
                currentGameConfig = new GameConfig();
                currentGameConfig.fromJSON(preDefinedGameConfigsJSON[i]);
                return true;
            }
        }

        return false;
    }

    /**
     * @brief 加载配置列表
     * @param {Array<Object>} configs 配置列表
     */
    this.loadGameConfigs = function(configs) {
        for (let i = 0; i < configs.length; i++) {
            gameConfigs.push(new GameConfig());
            gameConfigs[i].fromJSON(configs[i]);
        }
    }
    
    /**
     * @brief 加载默认配置列表
     */
    this.loadDefaultGameConfigs = function() {
        this.loadGameConfigs(preDefinedGameConfigsJSON);
    }

    /**
     * @brief 更新配置列表(当前配置)
     */
    this.updateGameConfigs = function(){
        //将当前配置保存到gameConfigs中
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
    this.getGameConfigs = function() {
        this.updateGameConfigs();
        return gameConfigs;
    }

    /**
     * 根据包名设定当前配置
     * @param {string} packageName 包名
     * @returns {boolean} 是否设置成功
     */
    this.setConfigByPackageName = function(packageName) {
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
    this.setConfigByName = function(gameType) {
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
    this.getConfigNameList = function() {
        return gameConfigs.map(function (config) {
            return config.gameType;
        });
    }

    this.getCurrentConfig = function() {
        return currentGameConfig;
    }

    this.getCurrentConfigName = function() {
        return currentGameConfig.gameType;
    }

    this.setCurrentConfig = function(config) {
        currentGameConfig = config;
    }

    /**
     * 获取当前按键参数
     * @returns {Object} 按键参数
     */
    this.getKeyType = function() {
        return keyTypes[currentGameConfig.keyType];
    }

    this.setKeyPosition = function(leftTop, rightBottom) {
        currentGameConfig.leftTop = leftTop;
        currentGameConfig.rightBottom = rightBottom;
    }

    this.checkKeyPosition = function() {
        if (currentGameConfig.leftTop[0] == 0 && currentGameConfig.leftTop[1] == 0 && currentGameConfig.rightBottom[0] == 0 && currentGameConfig.rightBottom[1] == 0) {
            return false;
        }
        return true;
    }

    this.generateKeyPosition = function() {
        if(currentGameConfig == null) {
            return false;
        }
        let leftTop = currentGameConfig.leftTop;
        let rightBottom = currentGameConfig.rightBottom;
        let row = keyTypes[currentGameConfig.keyType].row;
        let col = keyTypes[currentGameConfig.keyType].column;

        let width = rightBottom[0] - leftTop[0];
        let height = rightBottom[1] - leftTop[1];
        //左下角为原点
        let keyWidth = width / (col - 1);
        let keyHeight = height / (row - 1);
        let keyPos = [];
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                let x = leftTop[0] + j * keyWidth;
                let y = leftTop[1] + (row - i - 1) * keyHeight;
                keyPos.push([Math.round(x), Math.round(y)]);
            }
        }
        cachedKeyPos = keyPos;
        console.log("generated key position: " + JSON.stringify(keyPos));
        return true;
    }
    /**
     * 获取按键位置
     * @param {number} key 按键序号(从0开始)
     * @returns {[number, number]} 按键位置
     */
    this.getKeyPosition = function(key) {
        if (cachedKeyPos == null) {
            this.generateKeyPosition();
        }
        return cachedKeyPos[key];
    }

    this.generatePitchKeyMap = function(){
        if(currentGameConfig == null){
            return new Map();
        }
        let keyType = currentGameConfig.keyType;
        let keyMap = keyTypes[keyType].note_to_key_map;
        let pitchKeyMap = new Map();
        let pitchStrs = Object.keys(keyMap);
        console.log("pitchStrs: " + JSON.stringify(pitchStrs));
        for(let i = 0; i < pitchStrs.length; i++){
            let pitchStr = pitchStrs[i];
            let pitch = midiPitch.nameToMidiPitch(pitchStr);
            console.log("pitch: " + pitch + " pitchStr: " + pitchStr + " key: " + keyMap[pitchStr]);
            pitchKeyMap.set(pitch, keyMap[pitchStr]);
        }
        // console.log("generated pitch key map: " + JSON.stringify(pitchKeyMap) + " map:" + pitchKeyMap);
        return pitchKeyMap;
    }

    this.getKeyByPitch = function(pitch){
        if(cachedPitchKeyMap == null){
            cachedPitchKeyMap = this.generatePitchKeyMap();
        }
        let res = cachedPitchKeyMap.get(pitch);
        if(res === undefined){
            return -1;
        }
        return res;
    }

    this.getKeyRange = function(){
        let keyType = currentGameConfig.keyType;
        let keyMap = keyTypes[keyType].note_to_key_map;
        let keys = Object.values(keyMap);
        let minKey = 999;
        let maxKey = -1;
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            if(key < minKey){
                minKey = key;
            }
            if(key > maxKey){
                maxKey = key;
            }
        }
        return [minKey, maxKey];
    }

    this.getNoteRange = function(){
        if(cachedNoteRange == null){
            if(cachedPitchKeyMap == null){
                cachedPitchKeyMap = this.generatePitchKeyMap();
            }
            let pitches = Array.from(cachedPitchKeyMap.keys());
            let minPitch = 999;
            let maxPitch = -1;
            for(let i = 0; i < pitches.length; i++){
                let pitch = pitches[i];
                if(pitch < minPitch){
                    minPitch = pitch;
                }
                if(pitch > maxPitch){
                    maxPitch = pitch;
                }
            }
            cachedNoteRange = [minPitch, maxPitch];
        }
        return cachedNoteRange;
    }

    this.getSameKeyMinInterval = function(){
        return currentGameConfig.sameKeyMinInterval;
    }

}

console.info("GameProfile.js loaded");

module.exports = GameProfile;
