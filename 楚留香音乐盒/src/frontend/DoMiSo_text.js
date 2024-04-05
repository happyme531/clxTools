// 格式设计者为 nigh@github.com , 参见 https://github.com/Nigh/DoMiSo-genshin
var MidiPitch = require('../midiPitch.js');

let basePitch = 60; //C5
let defaultBPM = 80;
let BPM = defaultBPM;
let tickTimems = 60 * 1000 / BPM;

/*
控制命令

key control(调性控制)
1=F#
当不加音阶序号时，默认是第5个音阶。即上面的命令等价于：
1=F5#
没有规定调性时，默认1=C

tempo control(速度控制)
bpm=120
有效的bpm范围为1~480，超出此范围的数值视为无效，将会把bpm重置为初始值80。
没有规定速度时，默认bpm=80
*/

function parseCmd(cmdStr){
    let cmd = cmdStr.split('=')[0];
    let param = cmdStr.split('=')[1];
    switch(cmd){
        case '1':
            basePitch = MidiPitch.nameToMidiPitch(param);
            console.log("Set basePitch:", basePitch);
            break;
        case 'bpm':
            let BPM2 = parseInt(param);
            console.log("Set BPM:", BPM2);
            if (BPM2 < 1 || BPM2 > 480) {
                BPM = defaultBPM;
                tickTimems = 60 * 1000 / BPM
            }else {
                BPM = BPM2;
                tickTimems = 60 * 1000 / BPM
            }
            break;
        case 'rollback':
            console.warn("rollback暂未实现");
            break;
        default:
            throw new Error('无效的控制命令');
            break;
    }
};


function parseNote(noteStr){
    //split by the only number in it
    let pitchStr = noteStr.split(/\d/)[0];
    let timingStr = noteStr.split(/\d/)[1];


    let pitch = basePitch;
    
    //pitchStr 只可能是空, 一个或更多加号，或减号
    if(pitchStr.length > 0){
        if(pitchStr[0] === '+'){
            pitch += 12 * pitchStr.length;
        }else if(pitchStr[0] === '-'){
            pitch -= 12 * pitchStr.length;
        }else{
            throw new Error('无效的音阶序号');
        }
    }
    let pitchNum = parseInt(noteStr[pitchStr.length]);
    if (pitchNum < 0 || pitchNum > 8){
        throw new Error('无效的音阶序号');
    } 
    if (pitchNum == 0){
        pitch = -1;
    }else{
        pitch += MidiPitch.octaveArray[pitchNum - 1];
    }

    let tickTime = 0;
    //timingStr 
    if(timingStr.length == 0){
        tickTime = 1;
        //goto
    }else{
        if(timingStr[0] === '#'){
            pitch += 1;
            timingStr = timingStr.substr(1);
        }else if(timingStr[0] === 'b'){
            pitch -= 1;
            timingStr = timingStr.substr(1);
        };
        let tickTimeArr = [];
        tickTimeArr.push(1);
        let timingStrPos = 0;
        let tickTimePos = 0;
        while (timingStrPos < timingStr.length) {
            switch (timingStr[timingStrPos]) {
                case '.':
                    tickTimeArr.push(tickTimeArr[tickTimePos] / 2); // 表示将前面音符的时值延长一半。
                    tickTimePos++;
                    timingStrPos++;
                    continue;
                case '-':
                    tickTimeArr.push(1);//表示一个全音符的时值。意义与普通简谱中一致。且可以与 / 组合使用。
                    tickTimePos++;
                    timingStrPos++;
                    continue;
                case '/':
                    tickTimeArr[tickTimePos] /= 2; // 表示将前面标记的音长减少一半。意义与普通简谱中的下划线一致
                    timingStrPos++;
                    continue;
                default:
                    throw new Error('无效的时值'); 
            }
        }
        tickTimeArr.forEach(function(item){
            tickTime += item;
        });

    }
    //console.log("str:" + noteStr + ";pitch:" + pitch + ";timing:" + tickTime);
    return {
        "pitch" : pitch,
        "tickTime" : tickTime
    }

}

function DoMiSoTextParser(){
    /**
     * @brief 解析一个文件
     * @param {string} filePath 文件路径
     * @returns {import("../musicFormats.js").TracksData} 音乐数据
     */
    this.parseFile = function(filePath,parserConfig){
        let f = open(filePath,"r");
        let lines = f.readlines();
        f.close();
        //查找是否有注释分割线(两个连续等号)
        let commentLine = -1;
        for(let i = 0; i < lines.length; i++){
            if(lines[i].indexOf('==') != -1){
                commentLine = i;
                break;
            }
        }

        let comment = '';
        if(commentLine != -1){
            let commentLines = lines.slice(0,commentLine);
            commentLines.forEach(function(line){
                comment += line;
                comment += '\n';
            });
            lines = lines.slice(commentLine + 1);
        }

        

        //把剩下的行按空格分割
        let strs = [];
        lines.forEach(function(line){
            let ss =line.split(" ");
            ss.forEach(function(s){
                if(s.length > 0)
                    strs.push(s);
            });
        });

        
        let curMsTime = 0;

        let chordPitchArr = [];
        let chordTickTime = 0;
        let inChord = false;
        let ret = [];
        strs.forEach(function(s){
            if(s === '('){
                inChord = true;
                return;
            }
            if(s === ')'){
                inChord = false;
                chordPitchArr.forEach(function(pitch){
                    ret.push([pitch, curMsTime, {}]);
                });
                curMsTime += chordTickTime * tickTimems;
                chordPitchArr = [];
                chordTickTime = 0;
                return;
            }
            // 判断是命令还是音符
            // 有等号的是命令
            if(s.indexOf('=') != -1){
                try{
                    parseCmd(s);
                }catch(e){
                    throw new Error("解析命令" + s + "失败, " + e.message);
                }
            // 有数字的是音符
            }else if(s.indexOf('0') != -1 || s.indexOf('1') != -1 || s.indexOf('2') != -1 || s.indexOf('3') != -1 || s.indexOf('4') != -1 || s.indexOf('5') != -1 || s.indexOf('6') != -1 || s.indexOf('7') != -1){
                let noteData;
                try{
                    noteData = parseNote(s);
                }catch(e){
                    throw new Error("解析音符" + s + "失败, " + e.message);
                }
                if(inChord){
                    chordPitchArr.push(noteData.pitch);
                    chordTickTime = Math.max(chordTickTime, noteData.tickTime);
                }else{
                    if(noteData.pitch != -1) ret.push([noteData.pitch, curMsTime, {}]);
                    curMsTime += noteData.tickTime * tickTimems;
                }
            }
            //其它的全部忽略
        });

        return {
            "haveMultipleTrack": false,
            "trackCount": 1,
            "durationType": "none",
            "tracks": [
                {
                    "name": "",
                    "channel": 0,
                    "instrumentId": 0,
                    "trackIndex": 0,
                    "noteCount": ret.length,
                    "notes": ret
                }
            ],
            "metadata": [{
                "name": "DoMiSo乐曲注释",
                "value": comment
            }]
        }
    }
}

module.exports = DoMiSoTextParser;

if (require.main === module) {
    const assert = require('assert');
    // 测试用例

    //5.. 的音符时值为 1+0.5+0.25 拍
    assert.deepEqual(parseNote('5..'), {
        "pitch": 65,
        "tickTime": 1.75
    });
    console.log('测试用例1通过');

    //++3b// 的音符时值为 0.25 拍
    assert.deepEqual(parseNote('++3b//'), {
        "pitch": 60 + 24 + 3 - 1,
        "tickTime": 0.25
    });
    console.log('测试用例2通过');
    
    //-1#-/- 的音符时值即为 1+0.5+1 拍。
    assert.deepEqual(parseNote('-1#-/-'), {
        "pitch": 60 -12 + 1 + 1,
        "tickTime": 2.5
    });
    console.log('测试用例3通过');

}

