//@ts-check
var midiPitch = require("./midiPitch.js");

/**
 * @typedef {[number, number]} pos2d
 * @typedef {[pos2d, pos2d]} pos2dPair
 */

/**
 * 按键定位类型/需要获取坐标的按键类型
 * @enum {string}
 * @typedef {string} KeyLocatorType
 */
const KeyLocatorTypes = {
    //左上角
    "LOCATOR_LEFT_TOP": "LOCATOR_LEFT_TOP",
    //右下角
    "LOCATOR_RIGHT_BOTTOM": "LOCATOR_RIGHT_BOTTOM",
    //按下长音
    "KEY_LONG": "KEY_LONG",
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
 * @typedef {object} LayoutGeneratorConfig
 * @property {Array<string>} pitchRangeOrList 音高范围或音高列表, 例如["C3", "C5"](包含C5)/["C3", "D3", ...]
 * @property {number} row 行数
 * @property {number} column 列数(包括黑键)
 * @property {Array<[number,number]>} [rowLengthOverride] 覆盖某一行的长度, 默认为空, 使用column (从下往上数)
 * @property {Array<[number,number]>} [insertDummyKeys] 在指定位置插入虚拟按键, 用于调整布局. 从下往上数, 从左往右数, 如[0,1]表示在第一行第2个位置插入一个虚拟按键
 * @property {boolean} haveSemitone 是否有半音
 * @property {number} [semiToneWidth] 半音按键占据的宽度, 为0时则位于两个全音按键之间, 为1时则独立占据一个按键位置, 介于0和1之间时则按比例占据一部分, 默认为0
 * @property {number} [semiToneHeightOffset] 半音按键的高度偏移, 为0时则位于全音按键的中间, 为1时则位于上面那列按键的中间, 介于0和1之间时则按比例调整相对位置, 默认为0.5
 * @property {[[number, number, number],
*             [number, number, number],
*             [number, number, number]]} [transformMatrix] 变换矩阵, 用于对按键位置进行变换. 默认为 I-> 不变换
* @property {number} [centerAngle] 弧形按键对应扇形的中心角度, 默认为0 -> 不变换
* @property {number} [centerRadius] 弧形按键对应扇形的中心半径(设按键布局总高度为1)
*/

/**
* @brief 根据参数生成音高到按键的映射
* @param {LayoutGeneratorConfig} config 
* @returns {Map<string, pos2dPair|undefined>} 音高到按键位置的映射
*/
function generateLayout(config) {
   if(config.semiToneWidth == undefined){
       config.semiToneWidth = 0;
   }
   if(config.semiToneHeightOffset == undefined){
       config.semiToneHeightOffset = 0.5;
   }
   if(config.transformMatrix == undefined){
       config.transformMatrix = [
           [1, 0, 0],
           [0, 1, 0],
           [0, 0, 1],
       ];
   }
   if(config.centerAngle == undefined){
       config.centerAngle = 0;
   }
   if(config.centerRadius == undefined){
       config.centerRadius = 1;
   }
   let rowLengthOverride = new Map();
   if(config.rowLengthOverride){
       for(let i = 0; i < config.rowLengthOverride.length; i++){
           rowLengthOverride[config.rowLengthOverride[i][0]] = config.rowLengthOverride[i][1];
       }
   }
   console.log(rowLengthOverride);

   let rows = [];
   //1. 生成每一行的音高列表, 暂时不管按键位置
   let usePitchRange = config.pitchRangeOrList.length == 2;
   let pitchOrIndex = usePitchRange ? midiPitch.nameToMidiPitch(config.pitchRangeOrList[0]) : 0;
   for (let i = 0; i < config.row; i++) {
       let colLen = rowLengthOverride.get(i) ? rowLengthOverride.get(i) : config.column;
       console.log(colLen);
       let row = [];
       for (let j = 0; j < colLen; j++) {
           let curPitch = usePitchRange ? pitchOrIndex : midiPitch.nameToMidiPitch(config.pitchRangeOrList[pitchOrIndex]);
           row.push([curPitch, [0,0]]);
           if(usePitchRange){
               //如果下一个音符是半音但不使用半音键, 则跳过
               if(!config.haveSemitone && midiPitch.isHalf(curPitch + 1)){
                   pitchOrIndex++;
               }
               pitchOrIndex++;
           }else{
               pitchOrIndex++;
           }
       }
       rows.push(row);
   }

   //2. 插入虚拟列
   if(config.insertDummyKeys){
       //从右往左插入
       for(let i = 0; i < rows.length; i++){
           let insertDummyColumns = config.insertDummyKeys.reduce((acc, cur) => {
               if(cur[0] == i){
                   //@ts-ignore
                   acc.push(cur[1]);
               }
               return acc;
           }, []).sort((a, b) => b - a);
           for(let j = 0; j < insertDummyColumns.length; j++){
               rows[i].splice(insertDummyColumns[j], 0, [-1, [0,0]]);
           }
       }
   }

   //3. 生成基础的坐标
   //假设每一行最左为x=0, 最右为1 / 每一列最下为y=1, 最上为0
   
   let rowDistance = config.row == 1 ? 1 : 1 / (config.row - 1);
   let colDistance = config.column == 1 ? 1 : 1 / (config.column - 1);

   for(let i = 0; i < rows.length; i++){
       let curX = 0
       for(let j = 0; j < rows[i].length; j++){
           //需要考虑config.semiToneWidth
           rows[i][j][1][0] = curX;
           //查看当前或者下一个音符是否是半音, 如果是则需要调整位置
           //@ts-ignore
           if(midiPitch.isHalf(rows[i][j][0]) || (rows[i][j + 1] && midiPitch.isHalf(rows[i][j + 1][0]))){
               curX += colDistance * (1 + config.semiToneWidth);
           }else{
               curX += colDistance * 2;
           }
           rows[i][j][1][1] = 1 - rowDistance * i;
       }

   }
   //归一化X坐标
    {
        let minX = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][0]), 0)), 0);
        let maxX = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][0]), 0)), 0);
        let width = maxX - minX;
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                rows[i][j][1][0] = (rows[i][j][1][0] - minX) / width;
            }
        }
    }   
   //4. 居中对齐
   for(let i = 0; i < rows.length; i++){
       let row = rows[i];
       let rowLen = row[row.length - 1][1][0] - row[0][1][0];
       let centerX = rowLen / 2;
        for(let j = 0; j < row.length; j++){
            row[j][1][0] -= (centerX - 0.5);
        }
   }

   //5. 调整半音按键的y坐标
   for(let i = 0; i < rows.length; i++){
       for(let j = 0; j < rows[i].length; j++){
           //@ts-ignore
           if(midiPitch.isHalf(rows[i][j][0])){
               rows[i][j][1][1] -= rowDistance * config.semiToneHeightOffset;
           }
       }
   }

   //6. 应用变换矩阵
   for(let i = 0; i < rows.length; i++){
       for(let j = 0; j < rows[i].length; j++){
           let pos = rows[i][j][1];
           pos[0] = pos[0] * config.transformMatrix[0][0] + pos[1] * config.transformMatrix[0][1] + config.transformMatrix[0][2];
           pos[1] = pos[0] * config.transformMatrix[1][0] + pos[1] * config.transformMatrix[1][1] + config.transformMatrix[1][2];
       }
   }

    //7. 应用弧形变换
    if (config.centerAngle != 0) {
        let centerX = 0.5;
        let centerY = -config.centerRadius;
        let radius = config.centerRadius;
        let startAngle = Math.PI / 2 - config.centerAngle / 2;
        let endAngle = Math.PI / 2 + config.centerAngle / 2;

        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                let angle = startAngle + (endAngle - startAngle) * pos[0];
                let newX = centerX + (radius + pos[1]) * Math.cos(angle);
                let newY = centerY + (radius + pos[1]) * Math.sin(angle);
                pos[0] = newX;
                pos[1] = newY; // 修正y坐标
            }
        }
        // 归一化x和y到0,1之间
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                if (pos[0] < minX) minX = pos[0];
                if (pos[0] > maxX) maxX = pos[0];
                if (pos[1] < minY) minY = pos[1];
                if (pos[1] > maxY) maxY = pos[1];
            }
        }
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                let pos = rows[i][j][1];
                pos[0] = (pos[0] - minX) / (maxX - minX);
                pos[1] = (pos[1] - minY) / (maxY - minY);
            }
        }
        //左右反转. 不知道为什么需要
        for(let i = 0; i < rows.length; i++){
            let poss = rows[i].map(key => key[1]);
            poss.reverse();
            for(let j = 0; j < poss.length; j++){
                rows[i][j][1] = poss[j];
            }
        }
    }

   //8. 完全归一化
   let minX = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][0]), 0)), 0);
   let maxX = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][0]), 0)), 0);
   let width = maxX - minX;
   for(let i = 0; i < rows.length; i++){
       for(let j = 0; j < rows[i].length; j++){
           rows[i][j][1][0] = (rows[i][j][1][0] - minX) / width;
       }
   }
   let minY = rows.reduce((min, row) => Math.min(min, row.reduce((min, key) => Math.min(min, key[1][1]), 0)), 0);
   let maxY = rows.reduce((max, row) => Math.max(max, row.reduce((max, key) => Math.max(max, key[1][1]), 0)), 0);
   let height = maxY - minY;
   for(let i = 0; i < rows.length; i++){
       for(let j = 0; j < rows[i].length; j++){
           rows[i][j][1][1] = (rows[i][j][1][1] - minY) / height;
       }
   }

   //9. 生成最终结果
   let noteKeyMap = new Map();
   for(let i = 0; i < rows.length; i++){
       for(let j = 0; j < rows[i].length; j++){
           if(rows[i][j][0] != -1){
               //@ts-ignore
               let pitchName = midiPitch.midiPitchToName(rows[i][j][0]);
               noteKeyMap[pitchName] = rows[i][j][1];
           }
       }
   }

   //根据音高从低到高排序
   return noteKeyMap;
}

/**
 * 常用的变换矩阵
 * @type {Object.<string, [[number, number, number],
 *             [number, number, number],
 *             [number, number, number]]>}
 */
const transformMatrices = {
   "centerFlipY": [
       [1, 0, 0],
       [0, -1, 1],
       [0, 0, 1],
   ]
}

/**
 * 常用的键位布局
 * @constant
 * @type {Object.<string, LayoutGeneratorConfig>}
 */
const keyLayoutConfigs = {
    "generic_3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
    },
    "generic_3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        semiToneWidth: 1,
    },
    "generic_2x7": {
        pitchRangeOrList: ["C4", "B5"],
        row: 2,
        column: 7,
        haveSemitone: false,
    },
    "sky_3x5": {
        pitchRangeOrList: ["C3", "C5"],
        row: 3,
        column: 5,
        haveSemitone: false,
        transformMatrix: transformMatrices.centerFlipY,
    },
    "sky_2x4": {
        pitchRangeOrList: ["C6",
            "D6",
            "E6",
            "G6",
            "A4",
            "E5",
            "G5",
            "A5"],
        row: 2,
        column: 4,
        haveSemitone: false,
    },
    "nshm_1x7": {
        pitchRangeOrList: ["C4", "B4"],
        row: 1,
        column: 7,
        haveSemitone: false,
    },
    "nshm_professional_gu_zheng": {
        pitchRangeOrList: ["C2", "C6#"],
        row: 1,
        column: 50,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_qv_di": {
        pitchRangeOrList: ["G3", "D6"],
        row: 1,
        column: 32,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_pi_pa": {
        pitchRangeOrList: ["A2", "D6"],
        row: 1,
        column: 42,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "nshm_professional_suo_na": {
        pitchRangeOrList: ["E3", "B5"],
        row: 1,
        column: 32,
        haveSemitone: true,
        semiToneHeightOffset: 1,
    },
    "dzpd_interleaved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        insertDummyKeys: [[1,0]],
    },    
    "dzpd_7_8": {
        pitchRangeOrList: ["C4", "C6"],
        row: 2,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
    },
    "dzpd_yinterleaved36": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.35,
    },
    "speedmobile_interleaved3x7_1": {
        pitchRangeOrList: ["C3", "C5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[2, 8]],
        insertDummyKeys: [[0,7]],
    },
    "speedmobile_interleaved3x12_1": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        insertDummyKeys: [[0,12]],
    },
    "abd_7_8_7": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
        transformMatrix: transformMatrices.centerFlipY,
    },
    "abd_8_7": {
        pitchRangeOrList: ["C3", "C5"],
        row: 2,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[1, 8]],
        transformMatrix: transformMatrices.centerFlipY,
    },
    "hpma_yinterleaved3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.5,
    },
    "hpma_2x7": {
        pitchRangeOrList: ["C3", "B4"],
        row: 2,
        column: 7,
        haveSemitone: false,
    },
    "mrzh_3x12": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0,
        semiToneWidth: 0,
    },
    "mrzh_piano23": {
        pitchRangeOrList: ["F3#", "E5"],
        row: 1,
        column: 23,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "generic_piano88": {
        pitchRangeOrList: ["A0", "C8"],
        row: 1,
        column: 88,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "xqcq_suona33": {
        pitchRangeOrList: ["C3", "G5"],
        row: 1,
        column: 33,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "xdxz_7_7_8": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 7,
        haveSemitone: false,
        rowLengthOverride: [[2, 8]],
    },
    "xdxz_7_7_8_half": {
        pitchRangeOrList: ["C3", "C6"],
        row: 3,
        column: 12,
        haveSemitone: true,
        semiToneHeightOffset: 0.35,
        semiToneWidth: 0,
        rowLengthOverride: [[2, 13]],
    },
    "mhls_curved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        //坏的, 谁去修一下？
        centerAngle: Math.PI / 1.7,
        centerRadius: 1.55,
        // centerAngle: Math.PI / 4,
        // centerRadius: 10,
    },
    "yjwj_curved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        centerAngle: Math.PI / 40,
        centerRadius: 100,
    },
    "jw3_sloped3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        transformMatrix: [
            [1, 0.11, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]
    },
    "generic_piano36": {
        pitchRangeOrList: ["C3", "B5"],
        row: 1,
        column: 36,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "yslzm_piano20": {
        pitchRangeOrList: ["E4", "B5"],
        row: 1,
        column: 20,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
    "tysc_interleaved3x7": {
        pitchRangeOrList: ["C3", "B5"],
        row: 3,
        column: 7,
        haveSemitone: false,
        insertDummyKeys: [[1,7]],
    },
    "qrsj_piano24": {
        pitchRangeOrList: ["C4", "B5"],
        row: 1,
        column: 24,
        haveSemitone: true,
        semiToneHeightOffset: 1,
        semiToneWidth: 0,
    },
}

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
 * 因此使用这个类型表示不同的变体
 * @typedef {Object} VariantConfig
 * @property {string} variantType - 变体类型
 * @property {string} variantName - 变体名称
 * @property {[string, string]} [availableNoteRange] - 可用音符范围[最小值,最大值]。undefined表示使用noteKeyMap中的所有音符
 * @property {string} noteDurationImplementionType - 音符时长的实现方式。@see NoteDurationImplementionTypes。默认为"none"
 * @property {number} [sameKeyMinInterval] - 相同按键的最小间隔时间 (ms)。undefined表示使用GameConfig中的值, 否则使用这个值 | 0表示不限制
 * @property {Object.<string, string>} [replaceNoteMap] - 替换音符映射表。将原来音符替换为新的音符。例如: {"C3": "C4", "D3": "D4"}表示将C3替换为C4, D3替换为D4
 */

/**
 * 默认变体配置
 * @type {VariantConfig}
 */
const defaultVariantConfig = {
    variantType: "default",
    variantName: "默认",
    noteDurationImplementionType: NoteDurationImplementionTypes.none,
};

/**
 * 键位类型
 * @typedef {Object} KeyType
 * @property {string} name - 键位类型名称
 * @property {string} displayName - 键位类型显示名称
 * @property {LayoutGeneratorConfig} keyLayout - 键位布局生成配置
 */
/**
 * @typedef {Object} GameConfig
 * @property {string} gameType - 游戏类型，可以为任意值
 * @property {string} gameName - 游戏名称，可以为任意值
 * @property {Array<KeyType>} keyTypes - 可用的键位类型
 * @property {Array<VariantConfig>} variants - 可用的变体。第一个变体为默认变体，如果只有一个变体，则不会显示变体选择界面
 * @property {number} sameKeyMinInterval - 相同按键的最小间隔时间 (ms)，默认为0
 * @property {Array<string>} packageNamePart - 包名的一部分，默认为空数组
 */

/**
 * 预定义的游戏配置
 * @type {Array<GameConfig>}
 */
const PreDefinedGameConfigs = [
    {
        gameType: "楚留香",
        gameName: "楚留香",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            { //TODO:
                variantType: "default",
                variantName: "默认",
                noteDurationImplementionType: NoteDurationImplementionTypes.extraLongKey,
            },
        ],
        sameKeyMinInterval: 200,
        packageNamePart: ["wyclx"],
    },{
        gameType: "天涯明月刀",
        gameName: "天涯明月刀",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            defaultVariantConfig,
        ],
        sameKeyMinInterval: 100,
        packageNamePart: ["tmgp.wuxia"],
    },{
        gameType: "原神",
        gameName: "原神",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "generic_2x7",
            displayName: "2x7",
            keyLayout: keyLayoutConfigs.generic_2x7,
        }],
        variants: [
            {
                variantType: "风物之诗琴",
                variantName: "风物之诗琴",
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
            {
                variantType: "晚风圆号",
                variantName: "晚风圆号",
                noteDurationImplementionType: NoteDurationImplementionTypes.native,
            },
            {
                variantType: "老旧的诗琴",
                variantName: "老旧的诗琴",
                replaceNoteMap: {
                    "E3": "D3#",
                    "B3": "A3#",
                    "E4": "D4#",
                    "B4": "A4#",
                    "D5": "C5#",
                    "E5": "D5#",
                    "A5": "G5#",
                    "B5": "A5#",
                },
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["genshin", "yuanshen", "ys.x"],
    },{
        gameType: "光遇",
        gameName: "光遇",
        keyTypes: [{
            name: "sky_3x5",
            displayName: "3x5",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }, {
            name: "sky_2x4",
            displayName: "2x4",
            keyLayout: keyLayoutConfigs.sky_2x4,
        }],
        variants: [
           defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sky"],
    },{
        gameType: "逆水寒手游",
        gameName: "逆水寒",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "generic_3x12",
            displayName: "3x12",
            keyLayout: keyLayoutConfigs.generic_3x12,
        }, {
            name: "nshm_1x7",
            displayName: "1x7",
            keyLayout: keyLayoutConfigs.nshm_1x7,
        },
        {
            name: "nshm_professional_gu_zheng",
            displayName: "专业模式(古筝)",
            keyLayout: keyLayoutConfigs.nshm_professional_gu_zheng,
        },
        {
            name: "nshm_professional_qv_di",
            displayName: "专业模式(葫芦丝)",
            keyLayout: keyLayoutConfigs.nshm_professional_qv_di,
        },
        {
            name: "nshm_professional_pi_pa",
            displayName: "专业模式(琵琶)",
            keyLayout: keyLayoutConfigs.nshm_professional_pi_pa,
        },
        {
            name: "nshm_professional_suo_na",
            displayName: "专业模式(唢呐)",
            keyLayout: keyLayoutConfigs.nshm_professional_suo_na,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["nshm"],
    }, {
        gameType: "蛋仔派对",
        gameName: "蛋仔派对",
        keyTypes: [
            {
                name: "dzpd_7_8",
                displayName: "15键",
                keyLayout: keyLayoutConfigs.dzpd_7_8,
            },{
                name: "dzpd_interleaved3x7",
                displayName: "21键",
                keyLayout: keyLayoutConfigs.dzpd_interleaved3x7,
            }, {
                name: "dzpd_yinterleaved36",
                displayName: "36键",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["party"],
    },
    //永劫无间
    {
        gameType: "永劫无间",
        gameName: "永劫无间",
        keyTypes: [{
            name: "yjwj_curved3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.yjwj_curved3x7,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "笛子",
                variantName: "笛子",
                availableNoteRange: ["G3", "B5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.l22"],
    },{
        gameType: "黎明觉醒",
        gameName: "黎明觉醒",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],  //TODO: 钢琴 + 音域切换按钮
        variants: [
            defaultVariantConfig 
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["toaa"],
    },{
        gameType: "奥比岛",
        gameName: "奥比岛",
        keyTypes: [{
            name: "abd_7_8_7",
            displayName: "22键",
            keyLayout: keyLayoutConfigs.abd_7_8_7,
        }, {
            name: "abd_8_7",
            displayName: "15键",
            keyLayout: keyLayoutConfigs.abd_8_7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["aobi"],
    },{
        gameType: "哈利波特_魔法觉醒",
        gameName: "哈利波特: 魔法觉醒",
        keyTypes: [{
            name: "hpma_yinterleaved3x12",
            displayName: "36键",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }, {
            name: "hpma_2x7",
            displayName: "14键",
            keyLayout: keyLayoutConfigs.hpma_2x7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["harrypotter"],
    },{
        gameType: "第五人格",
        gameName: "第五人格",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21键",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "hpma_yinterleaved3x12",
            displayName: "36键",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "玉箫",
                variantName: "玉箫",
                availableNoteRange: ["C3", "B4"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["dwrg"],
    },{
        gameType: "阴阳师",
        gameName: "阴阳师",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["onmyoji"],
    },{
        gameType: "摩尔庄园",
        gameName: "摩尔庄园",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21键",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }, {
            name: "hpma_yinterleaved3x12",
            displayName: "36键",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mole"],
    },{
        gameType: "明日之后",
        gameName: "明日之后",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "21键",
            keyLayout: keyLayoutConfigs.generic_3x7,
        },
        {
            name: "mrzh_3x12",
            displayName: "36键",
            keyLayout: keyLayoutConfigs.mrzh_3x12,
        },
        {
            name: "generic_piano88",
            displayName: "88键钢琴",
            keyLayout: keyLayoutConfigs.generic_piano88,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["mrzh"],
    },{
        gameType: "元梦之星",
        gameName: "元梦之星",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        },
        {
            name: "hpma_yinterleaved36",
            displayName: "3x12",
            keyLayout: keyLayoutConfigs.hpma_yinterleaved3x12,
        }],
        variants: [
            defaultVariantConfig,
            {
                variantType: "唢呐",
                variantName: "唢呐",
                availableNoteRange: ["E3", "B5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
                sameKeyMinInterval: undefined,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["com.tencent.letsgo"],
    },{
        gameType: "心动小镇",
        gameName: "心动小镇",
        //双排15键, 三排15键, 22键, 22键+半音
        keyTypes: [{
            name: "dzpd_7_8",
            displayName: "双排15键",
            keyLayout: keyLayoutConfigs.dzpd_7_8,
        }, {
            name: "sky_3x5",
            displayName: "三排15键",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }, {
            name: "xdxz_7_7_8",
            displayName: "22键",
            keyLayout: keyLayoutConfigs.xdxz_7_7_8,
        }, {
            name: "xdxz_7_7_8_half",
            displayName: "37键",
            keyLayout: keyLayoutConfigs.xdxz_7_7_8_half,
        }], //TODO： 8键(鼓)
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: [], //TODO:
    },{
        gameType: "射雕英雄传",
        gameName: "射雕英雄传",
        keyTypes: [{
            name: "generic_3x7",
            displayName: "3x7",
            keyLayout: keyLayoutConfigs.generic_3x7,
        }],
        variants: [  //TODO: 这个游戏应该是有长音按钮的
            defaultVariantConfig,
            {
                variantType: "竹笛",
                variantName: "竹笛",
                availableNoteRange: ["G3", "A5"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
            {
                variantType: "洞箫",
                variantName: "洞箫",
                availableNoteRange: ["C3", "B4"],
                noteDurationImplementionType: NoteDurationImplementionTypes.none,
            },
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["sdyxz"], 
    },
    //qq飞车
    {
        gameType: "qq飞车",
        gameName: "qq飞车",
        keyTypes: [{
            name: "speedmobile_interleaved3x7_1",
            displayName: "22键",
            keyLayout: keyLayoutConfigs.speedmobile_interleaved3x7_1,
        }, {
            name: "speedmobile_interleaved3x12_1",
            displayName: "37键",
            keyLayout: keyLayoutConfigs.speedmobile_interleaved3x12_1,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["speedmobile"],
    },
    //创造与魔法
    {
        gameType: "创造与魔法",
        gameName: "创造与魔法",
        keyTypes: [{
            name: "sky_3x5",
            displayName: "3x5",
            keyLayout: keyLayoutConfigs.sky_3x5,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["hero.sm"],
    },
    //妄想山海
    {
        gameType: "妄想山海",
        gameName: "妄想山海",
        keyTypes: [
            {
                name: "generic_piano36",
                displayName: "36键钢琴",
                keyLayout: keyLayoutConfigs.generic_piano36,
            },
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.djsy"],
    },
    {
        gameType: "星球重启",
        gameName: "星球:重启",
        keyTypes: [{
            name: "generic_piano88",
            displayName: "88键钢琴",
            keyLayout: keyLayoutConfigs.generic_piano88,
        },
        {
            name: "xqcq_suona33",
            displayName: "33键唢呐",
            keyLayout: keyLayoutConfigs.xqcq_suona33,
        }],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["hermes"],
    },
    {
        gameType: "荒野行动",
        gameName: "荒野行动",
        keyTypes: [{
            name: "generic_piano88",
            displayName: "88键钢琴",
            keyLayout: keyLayoutConfigs.generic_piano88,
        }],
        variants: [
            defaultVariantConfig,
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.hyxd"],
    },
    //我的世界
    {
        gameType: "我的世界",
        gameName: "我的世界",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_piano36",
                displayName: "36键钢琴",
                keyLayout: keyLayoutConfigs.generic_piano36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["netease.mc","netease.x19"],
    },
    //迷你世界
    {
        gameType: "迷你世界",
        gameName: "迷你世界",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "21键",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "dzpd_yinterleaved36",
                displayName: "36键",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["miniworld"],
    },
    //猫和老鼠
    {
        gameType: "猫和老鼠",
        gameName: "猫和老鼠",
        keyTypes: [
            {
                name: "mhls_curved3x7", 
                displayName: "21键",
                keyLayout: keyLayoutConfigs.mhls_curved3x7, //最逆天的键位
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tom"],
    },
    //宅时光
    {
        gameType: "宅时光",
        gameName: "宅时光",
        keyTypes: [
            {
                name: "dzpd_yinterleaved36",
                displayName: "36键",
                keyLayout: keyLayoutConfigs.dzpd_yinterleaved36,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["housetime"],
    },
    //剑网3
    {
        gameType: "剑网3",
        gameName: "剑网3",
        keyTypes: [
            {
                name: "mhls_curved3x7",
                displayName: "21键(弧形)",
                keyLayout: keyLayoutConfigs.mhls_curved3x7,
            },
            {
                name: "jw3_sloped3x7",
                displayName: "21键(斜线)",
                keyLayout: keyLayoutConfigs.jw3_sloped3x7,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["tmgp.jx3m"],
    },
    {
        gameType: "以闪亮之名",
        gameName: "以闪亮之名",
        keyTypes: [
            {
                name: "yslzm_piano20",
                displayName: "20键钢琴",
                keyLayout: keyLayoutConfigs.yslzm_piano20,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["yslzm"],
    },
    {
        gameType: "桃源深处有人家",
        gameName: "桃源深处有人家",
        keyTypes: [
            {
                name: "tysc_interleaved3x7",
                displayName: "21键",
                keyLayout: keyLayoutConfigs.tysc_interleaved3x7,
            },
            {
                name: "dzpd_7_8",
                displayName: "15键",
                keyLayout: keyLayoutConfigs.dzpd_7_8,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["fiftyone"],
    },
    {
        gameType: "七日世界",
        gameName: "七日世界",
        keyTypes: [
            {
                name: "qrsj_piano24",
                displayName: "24键钢琴",
                keyLayout: keyLayoutConfigs.qrsj_piano24,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 20,
        packageNamePart: ["ohminicgos"],
    },
    //自定义1
    {
        gameType: "自定义1",
        gameName: "自定义1",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_3x12",
                displayName: "3x12",
                keyLayout: keyLayoutConfigs.generic_3x12,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    },{
        gameType: "自定义2",
        gameName: "自定义2",
        keyTypes: [
            {
                name: "generic_3x7",
                displayName: "3x7",
                keyLayout: keyLayoutConfigs.generic_3x7,
            },
            {
                name: "generic_3x12",
                displayName: "3x12",
                keyLayout: keyLayoutConfigs.generic_3x12,
            }
        ],
        variants: [
            defaultVariantConfig
        ],
        sameKeyMinInterval: 0,
        packageNamePart: [],
    },
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
     * @typedef {Object.<KeyLocatorTypes,pos2dPair>} LocatedKeys
     */
    /**
     * @type {Map<string,LocatedKeys>}
     * @description 所有游戏的键位配置(gameType-keyTypeName , pos1, pos2)
     */
    var keyLocators = new Map();

    /**
     * @type {Array<pos2d>?}
     * @description 按键位置数组(音高从低到高)
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
     * @brief 加载配置列表
     * @param {Array<Object>} configs 配置列表
     */
    this.loadGameConfigs = function (configs) {
        for (let i = 0; i < configs.length; i++) {
            gameConfigs = preDefinedGameConfigs;
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
     * @returns {Map<string,LocatedKeys>} 键位配置
     */
    this.getKeyLocators = function () {
        return keyLocators;
    }

    /**
     * 设置所有键位配置 
     * @param {Map<string,LocatedKeys>} l 键位配置
     */
    this.setKeyLocators = function (l) {
        keyLocators = l;
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
     * @returns {KeyType|undefined} 当前键位类型
     */
    this.getCurrentKeyLayout = function () {
        if(currentGameConfig == undefined){
            return undefined;
        }
        return currentGameConfig.keyTypes.find(function (keyType) {
            return keyType.name == currentKeyTypeName;
        });
    }

    /**
     * 设置左上角和右下角定位点的位置
     * @param {pos2dPair} pos1
     * @param {pos2dPair} pos2
     * @returns 
     */
    this.setKeyPosition = function (pos1, pos2) {
        if (currentGameConfig == undefined) {
            return false;
        }
        if(keyLocators[currentGameTypeKeyTypeName] == undefined){
            keyLocators[currentGameTypeKeyTypeName] = {};
        }
        keyLocators[currentGameTypeKeyTypeName][KeyLocatorTypes.LOCATOR_LEFT_TOP] = pos1;
        keyLocators[currentGameTypeKeyTypeName][KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM] = pos2;
        return true;
    }

    /**
     * 检查当前选择的键位的左上角和右下角定位点是否已经设置
     * @returns {boolean} 是否已经设置
     */
    this.checkKeyPosition = function () {
        if (currentGameConfig == undefined) {
            return false;
        }
        if (keyLocators[currentGameTypeKeyTypeName] == undefined) {
            return false;
        }
        let keys = keyLocators[currentGameTypeKeyTypeName];
        if (keys[KeyLocatorTypes.LOCATOR_LEFT_TOP][0] == 0 && 
            keys[KeyLocatorTypes.LOCATOR_LEFT_TOP][1] == 0 && 
            keys[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM][0] == 0 && 
            keys[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM][1] == 0) {
            return false;
        }
        return true;
    }

    /**
     * 加载布局
     * @param {boolean} [normalize] 是否使用归一化的坐标, 默认为false
     */
    this.loadLayout = function (normalize) {
        if(normalize == undefined){
            normalize = false;
        }
        if (currentGameConfig == null) {
            return false;
        }
        let currentLayout = this.getCurrentKeyLayout();
        if (currentLayout == undefined) {
            return false;
        }
        let noteKeyMap = generateLayout(currentLayout.keyLayout);
        let currentVariant = currentGameConfig.variants.find(function (variant) {
            return variant.variantType == currentVariantType;
        });
        if (currentVariant != undefined) {
            let replaceNoteMap = currentVariant.replaceNoteMap;
            if (replaceNoteMap != undefined) {
                //将noteKeyMap中的音高替换为replaceNoteMap中的音高
                for (let [originalNote, newNote] of Object.entries(replaceNoteMap)) {
                    if (noteKeyMap.has(originalNote)) {
                        let position = noteKeyMap.get(originalNote);
                        noteKeyMap.delete(originalNote);
                        noteKeyMap[newNote] = position;
                    }
                }
            }
            let noteRange = currentVariant.availableNoteRange;
            if (noteRange != undefined) {
                //将noteKeyMap中超出noteRange的音高删除
                for (let [note, position] of noteKeyMap) {
                    if (midiPitch.nameToMidiPitch(note) < midiPitch.nameToMidiPitch(noteRange[0]) || midiPitch.nameToMidiPitch(note) > midiPitch.nameToMidiPitch(noteRange[1])) {
                        noteKeyMap.delete(note);
                    }
                }
            }
        }
        let noteKeyMapList = Object.entries(noteKeyMap);
        console.verbose(`noteKeyMapList: ${JSON.stringify(noteKeyMapList)}`);
        //音高从低到高排序
        noteKeyMapList.sort(function (a, b) {
            return midiPitch.nameToMidiPitch(a[0]) - midiPitch.nameToMidiPitch(b[0]);
        });

        cachedKeyPos = new Array();
        for (let i = 0; i < noteKeyMapList.length; i++) {
            cachedKeyPos.push(noteKeyMapList[i][1]);
        }

        //映射到左上-右下
        if (!normalize) {
            if (!this.checkKeyPosition()) {
                return;
            }
            let locator = this.getKeyLocators()[currentGameTypeKeyTypeName];
            let leftTop = locator[KeyLocatorTypes.LOCATOR_LEFT_TOP];
            let rightBottom = locator[KeyLocatorTypes.LOCATOR_RIGHT_BOTTOM];
            for (let i = 0; i < cachedKeyPos.length; i++) {
                let [x, y] = cachedKeyPos[i];
                let newX = leftTop[0] + (rightBottom[0] - leftTop[0]) * x;
                let newY = leftTop[1] + (rightBottom[1] - leftTop[1]) * y;
                cachedKeyPos[i] = [newX, newY];
            }
        }
        cachedPitchKeyMap = new Map();
        for (let i = 0; i < noteKeyMapList.length; i++) {
            cachedPitchKeyMap.set(midiPitch.nameToMidiPitch(noteKeyMapList[i][0]), i + 1);
        }
        console.verbose(`cachedKeyPos: ${JSON.stringify(cachedKeyPos)}`);
        console.verbose(`cachedPitchKeyMap: ${JSON.stringify(Object.fromEntries(cachedPitchKeyMap))}`);
    }

    /**
     * 获取按键位置
     * @param {number} key 按键序号(从0开始, 音高从低到高)
     * @returns {[number, number]} 按键位置
     */
    this.getKeyPosition = function (key) {
        if (cachedKeyPos == null) {
            this.loadLayout();
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
            this.loadLayout();
        }
        //@ts-ignore
        return cachedKeyPos;
    }

    /**
     * 获取归一化的按键位置
     * @returns {Array<pos2d>} 归一化的按键位置数组
     */
    this.getNormalizedKeyPositions = function () {
        this.loadLayout(true);
        //@ts-ignore
        return cachedKeyPos;
    }

    /**
     * 根据 MIDI 音高值获取对应的按键名。
     * @param {number} pitch - MIDI 音高值。
     * @returns {number} MIDI 音高值对应的按键序号，从0开始，如果没有对应的按键则返回-1。
     */
    this.getKeyByPitch = function (pitch) {
        if (cachedPitchKeyMap == null) {
            this.loadLayout();
        }
        //@ts-ignore
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
            this.loadLayout();
        }
        // Iterate through the map to find the pitch for the given key
        //@ts-ignore
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
            this.loadLayout();
        }
        //@ts-ignore
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
                this.loadLayout();
            }
            //@ts-ignore
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
            this.loadLayout();
        }
        if(!cachedKeyPos){
            return [];
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
            this.loadLayout();
        }
        if(!cachedKeyPos){
            return 999999;
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



module.exports = GameProfile;
