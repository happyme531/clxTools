var configuration = require('./configuration');
let MusicFormats = require("./musicFormats");
let ChimomoApi = require("./cloud/chimomoApi");

function FileProvider() {
    const musicDir = configuration.getMusicDir();
    const tmpSubDir = "tmp/";
    const musicFormats = new MusicFormats();
    const userMusicListsKey = "config_userMusicLists";

    const chimomoApi = new ChimomoApi();
    const chimomoApiMusicListKey = "config_chimomoapi_musicList";
    const chimomoApiFileEntryPrefix = "cloud:chimomoapi";

    const cloudCacheTTLMs = 1000 * 60 * 60 * 24; // 24 hours

    /**
     * @typedef {Object} UserMusicList
     * @property {string} name - 歌单名
     * @property {Array<string>} musicFiles - 歌单内的音乐文件列表
     */

    let userMusicLists = /** @type {Array<UserMusicList>} */ (configuration.getJsonFromFile("config_userMusicLists"));
    if (!userMusicLists) {
        userMusicLists = [
            {
                name: "收藏",
                musicFiles: []
            },
        ];
    }
    configuration.setJsonToFile(userMusicListsKey, userMusicLists);

    this.userMusicLists = userMusicLists;

    function listMusicFilesInsideZip(zipPath) {
        let fileList = [];
        const zip = new java.util.zip.ZipFile(zipPath);
        const entries = zip.entries();
        while (entries.hasMoreElements()) {
            let entry = entries.nextElement();
            let entryName = String(entry.getName());
            if (!entry.isDirectory() && musicFormats.isMusicFile(entryName)) {
                fileList.push(entryName);
            }
        }
        zip.close();
        return fileList;
    }

    /**
     * 从 zip 文件中提取音乐文件到临时目录
     * @param {string} zipName - zip 文件名
     * @param {string} musicName - 音乐文件名
     * @returns {string?} - 返回音乐文件相对于音乐目录的路径(如"tmp/xxx.mid"), 如果提取失败则返回null
     */
    this.extractMusicFromZip = function (zipName, musicName) {
        const zipPath = musicDir + zipName;
        const tmpPath = musicDir + tmpSubDir + musicName;
        files.ensureDir(tmpPath);
        const zip = new java.util.zip.ZipFile(zipPath);
        const entries = zip.entries();
        while (entries.hasMoreElements()) {
            let entry = entries.nextElement();
            let entryName = String(entry.getName());
            if (entryName === musicName) {
                let inputStream = zip.getInputStream(entry);
                let outputStream = new java.io.FileOutputStream(tmpPath);
                let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
                let count;
                while ((count = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, count);
                }
                inputStream.close();
                outputStream.close();
                zip.close();
                return tmpSubDir + musicName;
            }
        }
        zip.close();
        return null;
    }

    /**
     * 读取所有直接存放在音乐文件夹下的音乐文件的列表
     * @returns {Array<string>} - 返回音乐文件列表, 如["music1.mid", "music2.mid"]
     */
    this.listDiscreteMusicFiles = function () {
        return files.listDir(musicDir, function (name) {
            return files.isFile(files.join(musicDir, name)) && musicFormats.isMusicFile(name);
        });
    }

    /**
     * 读取所有 zip 文件中的音乐文件的列表
     * @returns {Array<string>} - 返回音乐文件列表, 如["1.zip/music1.mid", "2.zip/music2.mid"]
     */
    this.listAllZippedMusicFiles = function () {
        return files.listDir(musicDir, function (name) {
            return files.isFile(files.join(musicDir, name)) && name.endsWith(".zip");
        }).map(function (name) {
            return listMusicFilesInsideZip(musicDir + name).map(function (musicName) {
                return name + "/" + musicName;
            });
        }).reduce(function (acc, val) {
            return acc.concat(val);
        }, []);
    }

    /**
     * 读取所有云端音乐文件的列表
     * @returns {Array<string>} - 返回音乐文件列表, 如["cloud:chimomoapi/1.json", "cloud:chimomoapi/2.json"]
     */
    this.listAllCloudMusicFiles = function () {
        const cloudMusicList = configuration.getJsonFromFile(chimomoApiMusicListKey) || [];
        return cloudMusicList.map(function (entry) {
            return chimomoApiFileEntryPrefix + "/" + entry.name + ".json";
        });
    };

    /**
     * 加载云端音乐文件, 提取到临时目录
     * @param {string} musicName - 音乐文件名
     * @param {(err: Error?, succeeded: boolean) => void} callback - 回调函数
     */
    this.loadCloudMusicFile = function (musicName, callback) {
        const nameParts = musicName.split("/");
        if (nameParts[0] === chimomoApiFileEntryPrefix) {
            /**
             * @type {import('./cloud/chimomoApi').ChimomoApiFileEntry[]}
             */
            const json = configuration.getJsonFromFile(chimomoApiMusicListKey);
            const musicEntry = json.find(entry => entry.name + ".json" === nameParts[1]);
            const tmpPath = musicDir + tmpSubDir + musicEntry.name + ".json";
            if (musicEntry) {
                const id = musicEntry.id;
                console.log(`Start fetching cloud music file(chimomoapi): name=${musicEntry.name}, id=${id}`);
                chimomoApi.fetchMusicFileById(id, (err, data) => {
                    if (err) {
                        console.error("Failed to fetch cloud music file(chimomoapi): " + err);
                        if (callback) {
                            callback(err, false);
                        }
                        return;
                    }
                    console.log("Fetched cloud music file(chimomoapi): " + musicEntry.name);
                    files.write(tmpPath, JSON.stringify(data));
                    if (callback) {
                        callback(null, true);
                    }
                });
            }
        }
    }

    /**
     * 从临时目录加载云端音乐文件
     * @param {string} musicName - 音乐文件名
     * @returns {string?} - 返回音乐文件路径, 如果加载失败则返回null
     * //TODO: 缓存过期/刷新机制?
     */
    this.loadCloudMusicFileFromTmp = function (musicName) {
        const nameParts = musicName.split("/");
        const tmpPath = musicDir + tmpSubDir + nameParts[1];
        if (files.exists(tmpPath)) {
            return tmpSubDir + nameParts[1];
        }
        return null;
    }

    /**
     * 读取所有音乐文件的列表
     * @returns {Array<string>} - 返回音乐文件列表, 如["music1.mid", "music2.mid", "1.zip/music1.mid", "2.zip/music2.mid", "cloud:chimomoapi/1.json", "cloud:chimomoapi/2.json"]
     */
    this.listAllMusicFiles = function () {
        return this.listDiscreteMusicFiles()
            .concat(this.listAllZippedMusicFiles())
            .concat(this.listAllCloudMusicFiles());
    }

    /**
     * 更新云端音乐列表
     * @param {boolean} [force] - 是否强制刷新(忽略缓存)
     */
    this.updateCloudMusicList = function (force) {
        let chimomoApiLastUpdate = configuration.getJsonFileLastModifiedTime(chimomoApiMusicListKey);
        if (force || chimomoApiLastUpdate === null || Date.now() - chimomoApiLastUpdate > cloudCacheTTLMs) {
            console.log("Start fetching cloud music list (chimpomoapi)");
            chimomoApi.fetchMusicList(0, 10000, null, (err, data) => {
                if (err) {
                    console.error("Failed to fetch cloud music list(chimomoapi): " + err);
                    return;
                }
                console.log("Fetched cloud music list(chimomoapi):");
                configuration.setJsonToFile(chimomoApiMusicListKey, data);
            });
        } else {
            console.log("Skip fetching cloud music list(chimomoapi)");
        }
    }

    /**
     * 加载音乐文件. 如果文件在zip文件内, 则提取到临时目录, 否则直接返回文件路径
     * @param {string} musicName - 音乐文件名
     * @returns {string?} - 返回音乐文件路径, 如果加载失败则返回null
     * @example 
     * // 加载 disk.mid
     * fileProvider.loadMusicFile("disk.mid") -> "disk.mid"
     * // 加载 1.zip/disk.mid
     * fileProvider.loadMusicFile("1.zip/disk.mid") -> "tmp/disk.mid"
     * @note 对于云端的音乐文件, 需要先调用 loadCloudMusicFile 将文件下载到本地!
     */
    this.loadMusicFile = function (musicName) {
        const nameParts = musicName.split("/");
        if (nameParts[0].endsWith(".zip")) {
            return this.extractMusicFromZip(nameParts[0], nameParts.slice(1).join("/"));
        } else if (nameParts[0].startsWith(chimomoApiFileEntryPrefix)) {
            return this.loadCloudMusicFileFromTmp(musicName);
        } else {
            return musicName;
        }
    }

    /**
     * 保存歌单数据到配置文件
     * @private
     */
    function saveUserMusicLists() {
        configuration.setJsonToFile(userMusicListsKey, userMusicLists);
    }

    /**
     * 创建新歌单
     * @param {string} name - 歌单名称
     * @returns {boolean} - 创建成功返回true,否则返回false
     */
    this.createMusicList = function (name) {
        if (userMusicLists.some(list => list.name === name)) {
            return false;
        }
        userMusicLists.push({ name: name, musicFiles: [] });
        saveUserMusicLists();
        return true;
    }

    /**
     * 删除歌单
     * @param {string} name - 歌单名称
     * @returns {boolean} - 删除成功返回true,否则返回false
     */
    this.deleteMusicList = function (name) {
        const initialLength = userMusicLists.length;
        userMusicLists = userMusicLists.filter(list => list.name !== name);
        if (userMusicLists.length < initialLength) {
            saveUserMusicLists();
            return true;
        }
        return false;
    }

    /**
     * 重命名歌单
     * @param {string} oldName - 原歌单名称
     * @param {string} newName - 新歌单名称
     * @returns {boolean} - 重命名成功返回true,否则返回false
     */
    this.renameMusicList = function (oldName, newName) {
        if (userMusicLists.some(list => list.name === newName)) {
            return false;
        }
        const list = userMusicLists.find(list => list.name === oldName);
        if (list) {
            list.name = newName;
            saveUserMusicLists();
            return true;
        }
        return false;
    }

    /**
     * 添加歌曲到歌单
     * @param {string} listName - 歌单名称
     * @param {string} musicFile - 歌曲文件名
     * @returns {boolean} - 添加成功返回true,否则返回false
     */
    this.addMusicToList = function (listName, musicFile) {
        const list = userMusicLists.find(list => list.name === listName);
        if (list && !list.musicFiles.includes(musicFile)) {
            list.musicFiles.push(musicFile);
            saveUserMusicLists();
            return true;
        }
        return false;
    }

    /**
     * 从歌单删除歌曲
     * @param {string} listName - 歌单名称
     * @param {string} musicFile - 歌曲文件名
     * @returns {boolean} - 删除成功返回true,否则返回false
     */
    this.removeMusicFromList = function (listName, musicFile) {
        const list = userMusicLists.find(list => list.name === listName);
        if (list) {
            const initialLength = list.musicFiles.length;
            list.musicFiles = list.musicFiles.filter(file => file !== musicFile);
            if (list.musicFiles.length < initialLength) {
                saveUserMusicLists();
                return true;
            }
        }
        return false;
    }

    /**
     * 列出歌单中的歌曲
     * @param {string} listName - 歌单名称
     * @returns {Array<string>|null} - 返回歌曲列表,如果歌单不存在则返回null
     */
    this.listMusicInList = function (listName) {
        const list = userMusicLists.find(list => list.name === listName);
        return list ? list.musicFiles : null;
    }

    /**
     * 列出所有歌单
     * @returns {Array<string>} - 返回所有歌单名称的数组
     */
    this.listAllMusicLists = function () {
        return userMusicLists.map(list => list.name);
    }

    /**
     * 获取歌单
     * @param {string} listName - 歌单名称
     * @returns {UserMusicList|null} - 返回歌单对象,如果不存在则返回null
     */
    this.getMusicList = function (listName) {
        return userMusicLists.find(list => list.name === listName) || null;
    }
}

module.exports = FileProvider;