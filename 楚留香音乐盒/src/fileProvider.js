var configuration = require('./configuration');
let MusicFormats = require("./musicFormats");


function FileProvider() {
    const musicDir = configuration.getMusicDir();
    const tmpSubDir = "tmp/";
    const musicFormats = new MusicFormats();
    const userMusicListsKey = "config_userMusicLists";

    /**
     * @typedef {Object} UserMusicList
     * @property {string} name - 歌单名
     * @property {Array<string>} musicFiles - 歌单内的音乐文件列表
     */

    let userMusicLists = /** @type {Array<UserMusicList>} */ (configuration.getJsonFromFile("config_userMusicLists"));

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
     * 读取所有音乐文件的列表
     * @returns {Array<string>} - 返回音乐文件列表, 如["music1.mid", "music2.mid", "1.zip/music1.mid", "2.zip/music2.mid"]
     */
    this.listAllMusicFiles = function () {
        return this.listDiscreteMusicFiles().concat(this.listAllZippedMusicFiles());
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
     */
    this.loadMusicFile = function (musicName) {
        const nameParts = musicName.split("/");
        if (nameParts[0].endsWith(".zip")) {
            return this.extractMusicFromZip(nameParts[0], nameParts.slice(1).join("/"));
        } else{
            return musicName;
        }
    }
}

module.exports = FileProvider;