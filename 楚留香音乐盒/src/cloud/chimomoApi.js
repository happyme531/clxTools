/**
 * @type {import('axios').AxiosStatic}
 */
//@ts-ignore
let axios = require('axios');

/**
 * @typedef {Object} ChimomoApiFileEntry
 * @property {number} id - 文件的唯一标识符
 * @property {string} name - MIDI文件的名称
 * @property {string} url - MIDI文件的下载链接
 * @property {string} createdAt - 文件创建的日期和时间，格式为 'YYYY-MM-DD HH:mm:ss'
 * @property {string} uploader - 上传者的名称
 */

/**
 * @typedef {Object} ChimomoApiMusicList
 * @property {number} pageNo - 当前页码
 * @property {number} pageSize - 每页显示的项目数
 * @property {number} pageCount - 总页数
 * @property {number} total - 总项目数
 * @property {ChimomoApiFileEntry[]} data - MIDI文件数据的数组
 */

function ChimomoApi() {
    const apiBase = "http://autoplay.chimomo.cn/api/v1/"


    /**
     * @brief 获取音乐列表
     * @param {number} pageNo 页码
     * @param {number} pageSize 每页数量
     * @param {string?} keyword 关键字
     * @param {(err: Error?, data: ChimomoApiMusicList?) => void} callback 回调函数
     */
    this.fetchMusicList = function (pageNo, pageSize, keyword, callback) {
        const url = `${apiBase}midi/list`;
        const params = {
            pageNo,
            pageSize,
            keyword
        };

        axios.get(url, { 
            params,
            timeout: 5000
         })
            .then(response => {
                if (response.data.code === 200) {
                    callback(null, response.data.data);
                } else {
                    callback(new Error(response.data.msg), null);
                }
            })
            .catch(error => {
                callback(error, null);
            });
    }

    /**
     * @brief 获取音乐文件
     * @param {number} musicId 音乐ID
     * @param {(err: Error?, data: import('@tonejs/midi').MidiJSON?) => void} callback 回调函数
     */
    this.fetchMusicFileById = function (musicId, callback) {
        const url = `${apiBase}midi/${musicId}`;
        let config = {
            timeout: 5000
        };
        axios.get(url, config)
            .then(response => {
                if (response.data.code === 200) {
                    callback(null, response.data.data);
                } else {
                    callback(new Error(response.data.msg), null);
                }
            })
            .catch(error => {
                callback(error, null);
            });
    }
}

module.exports = ChimomoApi;