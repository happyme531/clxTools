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

const ToneJsJSONParser = require('./formatToneJsJSON.js');
const MidiParser = require('./formatMidi.js');
const DoMiSoTextParser = require('./formatDoMiSo_text.js');
const SkyStudioJSONParser = require('./formatSkyStudioJSON.js');

function MusicFormats() {
    this.formats = {
        "tonejsjson" : {
            "friendlyName" : "Tone.js JSON 格式",
        },
        "midi" : {
            "friendlyName" : "MIDI 格式",
        },
        "bzdmx" : {
            "friendlyName" : "网易云音乐 @变奏的梦想 的格式",
        },
        "domiso" : {
            "friendlyName" : "DoMiSo格式",
        },
        "skystudiojson" : {
            "friendlyName" : "SkyStudio JSON 格式",
        }
    }
    this.getFileFormat = function(fullFileName) {
        let fileName = fullFileName.split(".")[0];
        let ext = fullFileName.split(".")[1];
        if (ext == "json") {
            return this.formats["tonejsjson"];
        } else if (ext == "mid") {
            return this.formats["midi"];
        } else if (ext == "dms") { //.dms.txt
            return this.formats["domiso"];
        } else if (ext == "skystudio") { //.skystudio.txt
            return this.formats["skystudiojson"];
        } else if (ext == "txt") {
            //TODO:手动选择格式
        }
        throw new Error("不支持的文件格式");
    }
    this.isMusicFile = function(fullFileName) {
        if(fullFileName.endsWith(".json") || fullFileName.endsWith(".mid") || fullFileName.endsWith(".dms.txt") ||
           fullFileName.endsWith(".skystudio.txt")){
            return true;
        }
        return false;
    }
    this.parseFile = function(filePath) {
        let fileFormat = this.getFileFormat(filePath);
        if (fileFormat == this.formats["tonejsjson"]) {
            return new ToneJsJSONParser().parseFile(filePath);
        }else if (fileFormat == this.formats["midi"]) {
            return new MidiParser().parseFile(filePath);
        }else if (fileFormat == this.formats["domiso"]) {
            return new DoMiSoTextParser().parseFile(filePath);
        }else if (fileFormat == this.formats["skystudiojson"]) {
            return new SkyStudioJSONParser().parseFile(filePath);
        }
        return null;
    }
}

module.exports = MusicFormats;