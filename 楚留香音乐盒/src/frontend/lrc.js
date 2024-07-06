/**
 * @typedef {Object} LyricLine
 * @property {number} time 时间(ms)
 * @property {string} text 歌词
 */


function LrcParser() {
    /**
     * 从LRC歌词文件的字符串中解析出歌词
     * @param {string} lrcString LRC歌词文件的字符串
     * @returns {LyricLine[]} 歌词数组
     */
    this.parseFromString = function (lrcString) {
        const lines = lrcString.split('\n');
        const lyrics = [];
        const timeTagRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

        let currentText = '';

        for (let line of lines) {
            let trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('[ti:') || trimmedLine.startsWith('[ar:') || trimmedLine.startsWith('[al:')) {
                continue; // 跳过空行和元数据标签
            }

            // const matches = [...trimmedLine.matchAll(timeTagRegex)];
            let matches = [];
            let match;
            while ((match = timeTagRegex.exec(trimmedLine)) !== null) {
                matches.push(match);
            }
            if (matches.length === 0) {
                // 如果没有时间标签,将此行添加到当前文本
                currentText += (currentText ? '\n' : '') + trimmedLine;
                continue;
            }

            // 如果有未处理的文本,为最后一个时间标签创建歌词对象
            if (currentText) {
                let lastLyric = lyrics[lyrics.length - 1];
                if (lastLyric) {
                    lastLyric.text = currentText;
                }
                currentText = '';
            }

            let text = trimmedLine.replace(timeTagRegex, '').trim();

            for (let match of matches) {
                let [, minutes, seconds, milliseconds] = match;
                let time = parseInt(minutes) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds.padEnd(3, '0'));

                lyrics.push({ time, text: text || currentText });
            }

            if (text) {
                currentText = text;
            }
        }

        // 处理最后一行歌词
        if (currentText) {
            let lastLyric = lyrics[lyrics.length - 1];
            if (lastLyric) {
                lastLyric.text = currentText;
            }
        }

        return lyrics.sort((a, b) => a.time - b.time);
    }

    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     */
    this.parseFile = function (filePath) {
        try {
            return this.parseFromString(files.read(filePath));
        } catch (err) {
            throw new Error("文件解析失败！请检查格式是否正确, " + err.message);
        };
    }
}

module.exports = LrcParser;