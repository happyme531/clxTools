const MusicFormats = require("../musicFormats");
const { Midi } = require('@tonejs/midi')
const fs = require('fs');
const ToneJsJSONParser = require('../frontend/ToneJsJSON');

function MusicReader() {
    let musicFormats = new MusicFormats();
    /**
     * @brief 解析文件
     * @param {string} filePath 文件路径
     * @param {string?} forcedFormatName 强制指定格式
     * @returns {import("../musicFormats").TracksData}
     */
    this.parseFile = function (filePath, forcedFormatName) {
        let fileFormat = forcedFormatName ? forcedFormatName : musicFormats.getFileFormat(filePath).name;
        switch (fileFormat) {
            case "tonejsjson":
            case "domiso":
            case "skystudiojson":
                try {
                    let str = fs.readFileSync(filePath, 'utf8');
                    return musicFormats.parseFromString(str, fileFormat);
                } catch {
                    let str = fs.readFileSync(filePath, 'utf-16le').trim();
                    return musicFormats.parseFromString(str, fileFormat);
                }
            case "midi":
                const midi = new Midi(fs.readFileSync(filePath));
                return new ToneJsJSONParser().parseFromJSON(midi.toJSON());
            default:
                throw new Error("不支持的文件格式");
        }
    }
}

module.exports= {
    MusicReader
}