// 获取自定义文本中有效消息的数量
// 可以直接在AutoX.js中使用，也可以在NodeJS中使用

const FilePath = "custom.txt"

function run() {
    let isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
    if (isNodeJS) {
        runNodeJS();
    } else {
        runRhinoAutoJS();
    }
}

/**
 * This function counts the number of lines in the given content. 
 * It ignores empty lines and lines that only contain comments.
 * 
 * @param {*} content - the content to count the lines for
 * @returns the number of lines in the content
 */
function countLines(content) {
    let count = 0;
    let lines = content.split("\n");
    for (let line of lines) {
        let trimedLine = line.trim();
        if (trimedLine.length > 0 && !trimedLine.startsWith("//")) {
            count++;
        }
    }
    return count;
}

function runNodeJS() {
    const fs = require("fs");
    if (!fs.existsSync(FilePath)) {
        console.log("文件不存在: " + FilePath);
        return;
    }
    let content = fs.readFileSync(FilePath, "utf-8");
    let count = countLines(content);
    console.log("有效消息数量: " + count + " 条");
}

function runRhinoAutoJS() {
    if(!files.exists(FilePath)){
        toastLog("文件不存在: " + FilePath);
        return;
    }
    let file = open(FilePath);
    let content = file.read();
    file.close();
    let count = countLines(content);
    toastLog("有效消息数量: " + count + " 条");
}

run();