// Description: 配置系统

let MusicFormats = require("./musicFormats");

function Configuration() {
    const globalConfig = storages.create("hallo1_clxmidiplayer_config");
    const musicDir = "/sdcard/楚留香音乐盒数据目录/";
    const musicFormats = new MusicFormats();
    
    /**
     * 初始化指定文件的配置
     * @param {string} filepath - 配置文件的路径
     */
    function initFileConfig(filepath) {
        console.info("初始化文件:" + filepath);
        files.create(filepath);
        let cfg = {};
        cfg.majorPitchOffset = 0;
        cfg.minorPitchOffset = 0;
        cfg.semiToneRoundingMode = 0;
        files.write(filepath, JSON.stringify(cfg));
    };

    /**
     * 获取音乐文件夹的路径
     * @returns {string} - 返回音乐文件夹的路径
     */
    this.getMusicDir = function () {
        return musicDir;
    }

    /**
     * 设置全局配置项
     * @param {string} key - 配置项的键名
     * @param {*} val - 配置项的值
     * @returns {number} - 返回0表示设置成功(总是成功?)
     */
    this.setGlobalConfig = function (key, val) {
        globalConfig.put(key, val);
        console.log("设置全局配置成功: " + key + " = " + val);
        return 0;
    };

    /**
     * 读取全局配置项
     * @param {string} key - 配置项的键名
     * @param {*} defaultValue - 配置项的默认值
     * @returns {*} - 返回配置项的值，如果不存在则返回默认值
     */
    this.readGlobalConfig = function (key, defaultValue) {
        let res = globalConfig.get(key, defaultValue);
        if (res == null) {
            return defaultValue;
        } else {
            return res;
        }
    };

    /**
     * 判断指定文件是否存在对应的配置文件
     * @param {*} filename - 文件名
     * @returns {boolean} - 返回true表示存在对应的配置文件，否则返回false
     */
    this.haveFileConfig = function (filename) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        filename += ".json.cfg";
        let filepath = musicDir + filename;
        return files.exists(filepath);
    }

    /**
     * 设置指定文件的配置项
     * @param {string} key - 配置项的键名
     * @param {*} val - 配置项的值
     * @param {string} filename - 文件名
     * @returns {number} - 返回0表示设置成功
     */
    this.setFileConfig = function (key, val, filename) {
        console.verbose("设置文件配置: " + key + " = " + val + " for " + filename);
        filename = musicFormats.getFileNameWithoutExtension(filename);
        filename += ".json.cfg";
        let filepath = musicDir + filename;
        if (!files.exists(filepath)) {
            initFileConfig(filepath);
        };
        let tmp = files.read(filepath);
        tmp = JSON.parse(tmp);

        tmp[key] = val;
        files.write(filepath, JSON.stringify(tmp));
        console.verbose("写入文件" + filepath + "成功");
        return 0;
    };

    /**
     * 读取指定文件的配置项
     * @param {string} key - 配置项的键名
     * @param {string} filename - 文件名
     * @param {*} [defaultValue] - 配置项的默认值
     * @returns {*} - 返回配置项的值，如果不存在则返回默认值
     */
    this.readFileConfig = function (key, filename, defaultValue) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        filename += ".json.cfg";
        let filepath = musicDir + filename;
        if (!files.exists(filepath)) {
            initFileConfig(filepath);
        };
        let tmp = files.read(filepath);
        tmp = JSON.parse(tmp);

        //迁移: halfCeiling -> semiToneRoundingMode
        if (key == "semiToneRoundingMode") {
            if (tmp["halfCeiling"] != null) {
                this.setFileConfig(
                    "semiToneRoundingMode",
                    tmp["halfCeiling"] ? 1 : 0,
                    filename
                );
                return tmp["halfCeiling"] ? 1 : 0;
            }
        }

        if (tmp[key] == null) {
            console.verbose(`返回默认值:${key} = ${JSON.stringify(defaultValue)}`);
            return defaultValue;
        } else {
            console.verbose(`读取配置:${key} = ${JSON.stringify(tmp[key])}`);
            return tmp[key];
        }
    };

    /**
     * 设置指定文件在指定目标(游戏-键位-乐器)的配置项
     * @param {string} key - 配置项的键名
     * @param {*} val - 配置项的值
     * @param {string} filename - 文件名
     * @param {import("./gameProfile")} gameProfile - 游戏配置
     * @returns {number} - 返回0表示设置成功
     */
    this.setFileConfigForTarget = function (key, val, filename, gameProfile) {
        const newKey = `${gameProfile.getProfileIdentifierTriple()}.${key}`;
        return this.setFileConfig(newKey, val, filename);
    }

    /**
     * 读取指定文件在指定目标(游戏-键位-乐器)的配置项, 如果不存在则返回公共配置, 如果公共配置也不存在则返回默认值
     * @param {string} key - 配置项的键名
     * @param {string} filename - 文件名
     * @param {import("./gameProfile")} gameProfile - 游戏配置
     * @param {*} [defaultValue] - 配置项的默认值
     * @returns {*} - 返回配置项的值，如果不存在则返回默认值
     */
    this.readFileConfigForTarget = function (key, filename, gameProfile, defaultValue) {
        const newKey = `${gameProfile.getProfileIdentifierTriple()}.${key}`;
        const res1 = this.readFileConfig(newKey, filename, undefined);
        if (res1 != undefined) {
            return res1;
        }
        const res2 = this.readFileConfig(key, filename, undefined);
        if (res2 != undefined) {
            return res2;
        }
        return defaultValue;
    }

    /**
     * 清除指定文件的配置
     * @param {string} filename - 文件名
     * @returns {number} - 返回0表示清除成功
     */
    this.clearFileConfig = function (filename) {
        filename = musicFormats.getFileNameWithoutExtension(filename);
        filename += ".json.cfg";
        let filepath = musicDir + filename;
        initFileConfig(filepath);
        return 0;
    }
}

module.exports = new Configuration();