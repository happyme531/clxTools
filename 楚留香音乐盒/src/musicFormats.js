//@ts-check
/* 
 * musicFormats.js -- 关于音乐盒支持的音乐格式
 *
 *  Copyright (C) 2021 hallo1 
 * 
 */

/*
 1. Tone.js JSON 格式:
    扩展名为.json的音乐文件将被解析为 Tone.js JSON 格式
    目前, 此脚本对该格式的支持很好, 一般都可以正常解析
    更多详情请参考: https://tonejs.github.io/

 2. 标准 MIDI 格式:
    扩展名为.mid的音乐文件将被解析为标准 MIDI 格式
    目前, 此脚本对该格式的支持并不是很好, 某些情况下可能无法正常解析
    如果发现无法正常解析, 可以在https://tonejs.github.io/Midi/ 将此音乐文件转换为 Tone.js JSON 格式

 3. 变奏的梦想格式:
    网易云音乐作者 变奏的梦想 发布的音乐的歌词的音乐格式
    请参考 https://music.163.com/#/artist?id=1085053
    将歌词全部内容粘贴到文本文件中, 并保存为.txt格式, 即可正常解析

 4. DoMiSo格式
    格式设计者为 nigh@github.com , 参见 https://github.com/Nigh/DoMiSo-genshin
    只支持解析.txt(文本)格式的音乐文件

*/


/**
 * 一些类型定义
 * @typedef {[pitch: number, startTime: number, attributes: Object|undefined]} Note
 * @typedef {[pitches: number[], startTime: number]} Chord
 * @typedef {{name: string, noteCount: number, notes: Note[]}} Track
 * @typedef {{haveMultipleTrack: boolean, trackCount: number, tracks: Track[]}} TracksData
 */

const ToneJsJSONParser = require('./formatToneJsJSON.js');
const MidiParser = require('./formatMidi.js');
const DoMiSoTextParser = require('./formatDoMiSo_text.js');
const SkyStudioJSONParser = require('./formatSkyStudioJSON.js');

function MusicFormats() {
    /**
     * @typedef {{
     * "name": string,
     * "friendlyName": string,
     * "fileExtension": string
     * }} MusicFormat
     * 
     * @type {MusicFormat[]}
     */
    const formats =
        [{
            "name": "tonejsjson",
            "friendlyName": "Tone.js JSON 格式",
            "fileExtension": ".json"
        },
        {
            "name": "midi",
            "friendlyName": "MIDI 格式",
            "fileExtension": ".mid"
        },
        {
            "name": "domiso",
            "friendlyName": "DoMiSo格式",
            "fileExtension": ".dms.txt"
        },
        {
            "name": "skystudiojson",
            "friendlyName": "SkyStudio JSON 格式",
            "fileExtension": ".skystudio.txt"
        }];
    
    /**
     * @brief 获取文件的音乐格式
     * @param {string} fullFileName 文件名(包含扩展名)
     * @returns {MusicFormat} 音乐格式
     */
    this.getFileFormat = function(fullFileName) {
        for (let format of formats) {
            if (fullFileName.endsWith(format.fileExtension))
                return format;
        }
        throw new Error("不支持的文件格式");
    }

    /**
     * @brief 判断文件是否为音乐文件
     * @param {string} fullFileName 文件名(包含扩展名)
     * @returns {boolean} 是否为音乐文件
     */
    this.isMusicFile = function(fullFileName) {
        for (let format of formats) {
            if (fullFileName.endsWith(format.fileExtension))
                return true;
        }
        return false;
    }

    /**
     * @brief 获取不包含扩展名的文件名(针对音乐文件)
     * @param {string} fullFileName 文件名(包含扩展名)
     * @returns {string} 不包含扩展名的文件名
     */
    this.getFileNameWithoutExtension = function(fullFileName) {
        if (this.isMusicFile(fullFileName)) {
            let fileFormat = this.getFileFormat(fullFileName);
            return fullFileName.substring(0, fullFileName.length - fileFormat.fileExtension.length);
        }
        return fullFileName;
    }


    /**
     * 解析音乐文件
     * @param {string} filePath 
     * @returns {TracksData} 音乐数据
     */
    this.parseFile = function(filePath) {
        let fileFormat = this.getFileFormat(filePath);
        switch (fileFormat.name) {
            case "tonejsjson":
                return new ToneJsJSONParser().parseFile(filePath);
            case "midi":
                return new MidiParser().parseFile(filePath);
            case "domiso":
                return new DoMiSoTextParser().parseFile(filePath,undefined);
            case "skystudiojson":
                return new SkyStudioJSONParser().parseFile(filePath);
            default:
                throw new Error("不支持的文件格式");
        }
    }
}

module.exports = MusicFormats;