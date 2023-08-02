
function Runtimes() {

    /**
     * @brief 脚本的运行环境
     * @enum {Number}
     */
    const Runtime = {
        //未知或不支持的环境
        UNKNOWN_OR_NOT_SUPPORTED: -1,
        // AutoX.js
        AUTOXJS: 0,
        // Auto.js 6
        AUTOJS6: 1,
        // Node.js 
        NODEJS: 2,
    }

    this.Runtime = Runtime;

    /**
     * @brief 检测脚本当前的运行环境
     * @return {Runtime} 运行环境
     */
    this.getCurrentRuntime = function () {
        //Nodejs
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            return Runtime.NODEJS;
            //Autojs6 有"autojs"全局对象
        } else if (typeof autojs !== 'undefined') {
            return Runtime.AUTOJS6;
            //AutoX.js 有"device.cancelVibration" 函数
        } else if (device != undefined && typeof device.cancelVibration !== 'undefined') {
            return Runtime.AUTOXJS;
        } else {
            return Runtime.UNKNOWN_OR_NOT_SUPPORTED;
        }
    }
}

module.exports = new Runtimes();