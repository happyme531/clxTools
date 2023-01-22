
function FileChooser() {
    importClass(android.content.Intent);
    importClass(android.provider.MediaStore);

    const FileChooserPathEvent = "FileChooserPathEvent";

    /**
     * @brief 调用系统文件选择器选择文件
     * @param {function<string>} callback 回调函数, 参数为选择的文件路径, 选择取消时为null
     */
    this.chooseFile = function (callback) {
        throw "Not implemented"; // TODO: 未实现
        let exec = engines.execScriptFile("src/fileChooserActivity.js");
        let engine = exec.getEngine();
        events.broadcast.on(FileChooserPathEvent, (path) => {
            console.log("FileChooserPathEvent: " + path);
            events.broadcast.removeAllListeners(FileChooserPathEvent);
            engine.forceStop();
            callback(path);
        });
    }

    /**
     * @brief 调用系统文件选择器选择文件(阻塞的)
     * @return {string} 选择的文件路径, 选择取消时为null
     */
    this.chooseFileSync = function() {
        let result = 0;
        this.chooseFile(function(path) {
            result = path;
        });
        while (result === 0) {
            sleep(100);
        }
        return result;
    }

    /**
     * @brief 调用系统文件选择器选择文件并复制到指定目录
     * @param {string} destDir 目标目录
     */
    this.chooseFileAndCopyTo = function(destDir) {
        if(!destDir.endsWith("/")) {
            destDir += "/";
        }
        let exec = engines.execScriptFile("src/fileChooserActivity.js", {
            arguments: ["copyTo", destDir]
        });
    }
    
}

module.exports = FileChooser;