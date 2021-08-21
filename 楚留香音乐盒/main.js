//@ts-check
var globalConfig = storages.create("hallo1_clxmidiplayer_config");
try{
var preDefinedRes = require("predefinedres.js");
}catch(e){
    toast("请不要单独下载/复制这个脚本，需要下载'楚留香音乐盒'中的所有文件!");
}

const musicDir = "/sdcard/楚留香音乐盒数据目录/"
const scriptVersion = 9;


function getPosInteractive(promptText) {
    let gotPos = false;
    let pos = [];
    let fingerReleased = false;
    let confirmed = false;
    //提示和确认按钮的框
    let confirmWindow = floaty.rawWindow(
        <frame gravity="left|top">
            <vertical bg="#7fffff7f">
                <text id="promptText" text="" textSize="14sp" />
                <button id="confirmBtn"  style="Widget.AppCompat.Button.Colored" text="确定"  />
                <button id="cancelBtn"  style="Widget.AppCompat.Button.Colored" text="取消" />
            </vertical>
        </frame>
    );
    confirmWindow.setTouchable(true);

    let fullScreenWindow = floaty.rawWindow(<frame id="fullScreen" bg="#00000000" />);
    fullScreenWindow.setTouchable(true);
    fullScreenWindow.setSize(-1,-1);
    fullScreenWindow.fullScreen.setOnTouchListener(function(v, evt){
        if (evt.getAction() == evt.ACTION_DOWN || evt.getAction() == evt.ACTION_MOVE) {
            gotPos = true;
            pos = [evt.getRawX().toFixed(0) , evt.getRawY().toFixed(0)];
        }    
        if (evt.getAction() == evt.ACTION_UP) {
            fingerReleased = true;
        }
        return true;
    });

    ui.run(()=>{
        confirmWindow.promptText.setText("请点击" + promptText);
        confirmWindow.confirmBtn.click(()=>{
            confirmed = true;
        });
        confirmWindow.cancelBtn.click(()=>{
            fingerReleased = false;
            gotPos = false;
            fullScreenWindow.setTouchable(true);
        }); 
    });

    while(!confirmed){ 
        sleep(100);
        if(fingerReleased){
            fullScreenWindow.setTouchable(false);
        }

        ui.run(function(){
            if (!gotPos) {
                confirmWindow.promptText.setText("请点击" + promptText);
            }else if(!fingerReleased){
                confirmWindow.promptText.setText("当前坐标:" + pos.toString());
            }else{
                confirmWindow.promptText.setText("当前坐标:" + pos.toString() + ", 点击'确定'结束, 点击'取消'重新获取");
            }
        });
    }

    fullScreenWindow.close();
    confirmWindow.close();

    return {
        "x" : pos[0],
        "y" : pos[1]
    }
}

function getJsonLength(json) {
    var jsonLength = 0;
    for (var i in json) {
        jsonLength++;
    }
    return jsonLength;
};

function getFileList() {
    //遍历synth文件夹中所有文件，获得标题信息
    let totalFiles = files.listDir(musicDir, function (name) {
        return (name.endsWith(".json") || name.endsWith(".mid")) && files.isFile(files.join(musicDir, name));
    });
    let titles = new Array(totalFiles.length);
    //log(totalFiles);
    for (let file in totalFiles) {
        //log(musicDir + totalFiles[file]);
        //读取json文件速度太慢

        //let tmp = files.read(musicDir + totalFiles[file]);
        //tmp = JSON.parse(tmp);
        //if (tmp.header.name != "") {
        //    titles[file] = tmp.header.name;
        //} else {

        //直接读取文件名
        titles[file] = totalFiles[file].replace(".json", "").replace(".mid", "");

    };
    return titles;
};

let majorPitchOffset;
let minorPitchOffset;
let treatHalfAsCeiling;
//将类似"C3"这样的音符名转换为音高
/**
 * @param {string} name
 */
function name2pitch(name) {
    const toneNames = ["C", "D", "E", "F", "G", "A", "B"];
    let pitch = -1;
    let m = -majorPitchOffset + 3;
    if (name.endsWith((m++).toString())) pitch += 0 + 1;
    if (name.endsWith((m++).toString())) pitch += 7 + 1;
    if (name.endsWith((m++).toString())) pitch += 14 + 1;
    if (pitch == -1) { //结尾不是3,4,5
        return 0;
    };
    m = minorPitchOffset;
    for (let i in toneNames) {
        if (name.charAt(0) === toneNames[i]) {
            pitch += parseInt(i) + 1 + minorPitchOffset;
            break;
        };
    };
    if (treatHalfAsCeiling){
        if (name.charAt(1)==="#") pitch++;
    };
    if (pitch > 21 || pitch < 1) return 0;
    return pitch;
};
//低效率的转换！
/**
 * @param {Number} midiPitch
 */
function midiPitch2pitch(midiPitch){
    function midiToPitchClass(midi){
        const scaleIndexToNote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const note = midi % 12;
        return scaleIndexToNote[note];
    }
    function midiToPitch(midi) {
        const octave = Math.floor(midi / 12) - 1;
        return midiToPitchClass(midi) + octave.toString();
    }
    return name2pitch(midiToPitch(midiPitch));
}

/**
 * @param {string} jsonFilePath
 */
function parseTonejsJSON(jsonFilePath){
    let jsonData;
    try {
        jsonData = JSON.parse(files.read(jsonFilePath));
    } catch (err) {
        toast("文件解析失败！请检查格式是否正确");
        console.error("文件解析失败:" + err + ",数据文件可能缺失或不完整！");
    };
    
    //读取音轨列表
    var tracks = new Array();
    var noteCounts = new Array();
    for (let i in jsonData.tracks) {
        let noteCount = getJsonLength(jsonData.tracks[i].notes);
        noteCounts.push(noteCount);
        // if(noteCount == 0) continue;
        
        if (jsonData.tracks[i].name != "") {
            tracks.push(i + ":" + jsonData.tracks[i].name + ":" + noteCount + "个音符");
        } else {
            tracks.push(i + ":" + "未命名" + ":" + noteCount + "个音符");
        };
    };
    
     majorPitchOffset = readFileConfig("majorPitchOffset", fileName);
     minorPitchOffset = readFileConfig("minorPitchOffset", fileName);
     treatHalfAsCeiling = readFileConfig("halfCeiling",fileName);
    
    const selectedTracks = dialogs.multiChoice("选择你想播放的音轨(可以多选)..", tracks);
    console.assert(!cmp(selectedTracks,[]), "错误:请选择一个选项");
    
    //处理音符数据
    var noteData = [];  //[按键，时间]
    
    var tracksIdx = new Array(selectedTracks.length);
    for (let i = 0; i < selectedTracks.length; i++) {
        tracksIdx[i] = 0;
    }
    
    let curTime = 0;
    
    while (true) {
        let minNextTime = 999999999;
        let minNextTimeTrack = 0;   //下一个音符所在的音轨
        let selectedI = 0;          //下一个音符所在的音轨在所有选中的音轨列表中的位置
        for (let i = 0; i < selectedTracks.length; i++) { //选出下一个音符
            curTrack = selectedTracks[i];
            curNoteIdx = tracksIdx[i];
            if (curNoteIdx == noteCounts[curTrack]) continue;
            let curTimeTmp = jsonData.tracks[curTrack].notes[curNoteIdx].time;
            if (curTimeTmp <= minNextTime) { 
                minNextTime = curTimeTmp;
                minNextTimeTrack = curTrack;
                selectedI = i
            }
        }
        if(minNextTime==999999999) break;
        // console.log("ffsel track %d, note %d",minNextTimeTrack,tracksIdx[selectedI]);
        
    
        let key = name2pitch(jsonData.tracks[minNextTimeTrack].notes[tracksIdx[selectedI]].name);
        tracksIdx[selectedI]++;
        if(key != 0){   //丢弃无法弹奏的音符
            noteData.push([key,minNextTime]);
        }
    }
    return noteData;
}

/**
 * @param {string} midiFilePath
 */
function parseMIDI(midiFilePath){
    let dexPath = files.cwd() + "/MidiReader.dex"
    runtime.loadDex(dexPath);
    
    importPackage(Packages.midireader);

    let reader = new MidiReader(midiFilePath);
    let midiFileInfo = reader.getMidiFileInfo();
    let usperTick = midiFileInfo.getMicrosecondsPerTick() == 0 ? 1000 : midiFileInfo.getMicrosecondsPerTick();
    //console.log(midiFileInfo);
    // let trackCnt = midiFileInfo.getNumberOfTracks();
    // let tracks = new Array();

    // for (let i = 0; i < trackCnt; i++) {
    //     let trackInfo = midiFileInfo.getTrackInfo(i);

    //     if (trackInfo.getTrackName() != "") {
    //         tracks.push(i + ":" + trackInfo.getTrackName() );
    //     } else {
    //         tracks.push(i + ":" + "未命名");
    //     };
    // };
    
     majorPitchOffset = readFileConfig("majorPitchOffset", fileName);
     minorPitchOffset = readFileConfig("minorPitchOffset", fileName);
     treatHalfAsCeiling = readFileConfig("halfCeiling",fileName);
    
    // const selectedTracks = dialogs.multiChoice("选择你想播放的音轨(可以多选)..", tracks);
    // console.assert(!cmp(selectedTracks,[]), "错误:请选择一个选项");
    var noteData = [];
    let it = reader.iterator();
    while (it.hasNext()) {
        let event = it.next();
        if (event instanceof Packages.midireader.midievent.NoteMidiEvent) {
            if (event.getNoteEventType() == Packages.midireader.midievent.NoteMidiEvent.NoteEventType.NOTE_ON
                && event.getVelocity()>1) {
                let key = midiPitch2pitch(event.getNoteNumber());
                let time = event.getTotalTime() * usperTick/1000/1000;
                noteData.push([key,time]);
            }
        }

        // if(event.getMetaEventType()==MetaEventType.LYRIC){
        //     console.log(event.getContentAsString())
        // }
    };
    reader.close();
    return noteData;
}

/**
 * @param {string} filepath
 */
function initFileConfig(filepath) {
    console.info("初始化文件:" + filepath);
    files.create(filepath);
    let cfg = {};
    cfg.majorPitchOffset = 0;
    cfg.minorPitchOffset = 0;
    files.write(filepath, JSON.stringify(cfg));
};

/**
 * @param {number} timeSec
 */
function sec2timeStr(timeSec){
    return (Math.floor(timeSec/60)).toString() + ":" + (Math.floor(timeSec%60)).toString();
}

let cmp = (x, y) => {
    // If both x and y are null or undefined and exactly the same
    if (x === y) {
        return true;
    }

    // If they are not strictly equal, they both need to be Objects
    if (!(x instanceof Object) || !(y instanceof Object)) {
        return false;
    }

    //They must have the exact same prototype chain,the closest we can do is
    //test the constructor.
    if (x.constructor !== y.constructor) {
        return false;
    }
    for (var p in x) {
        //Inherited properties were tested using x.constructor === y.constructor
        if (x.hasOwnProperty(p)) {
            // Allows comparing x[ p ] and y[ p ] when set to undefined
            if (!y.hasOwnProperty(p)) {
                return false;
            }
            // If they have the same strict value or identity then they are equal
            if (x[p] === y[p]) {
                continue;
            }
            // Numbers, Strings, Functions, Booleans must be strictly equal
            if (typeof(x[p]) !== "object") {
                return false;
            }
            // Objects and Arrays must be tested recursively
            if (!Object.equals(x[p], y[p])) {
                return false;
            }
        }
    }

    for (p in y) {
        // allows x[ p ] to be set to undefined
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
            return false;
        }
    }
    return true;
};

function setGlobalConfig(key, val) {
    globalConfig.put(key, val);
    let tmp = globalConfig.get(key);
    if (cmp(tmp, val)) {
        toast("设置保存成功");
        return 1;
    } else {
        toast("设置保存失败！");
        return 0;
    };

};

function readGlobalConfig(key, defaultValue) {
    return globalConfig.get(key, defaultValue);
};

function setFileConfig(key, val, filename) {

    filename = filename.replace(".json", ""); //如果原先有.json后缀，删除它
    filename += ".json.cfg";
    let filepath = musicDir + filename;
    if (!files.exists(filepath)) {
        initFileConfig(filepath);
    };
    let tmp = files.read(filepath);
    tmp = JSON.parse(tmp);

    tmp[key] = val;
    files.write(filepath, JSON.stringify(tmp));
    toast("设置保存成功");
    return 0;

};

function readFileConfig(key, filename) {
    filename = filename.replace(".json", ""); //如果原先有.json后缀，删除它
    filename += ".json.cfg";
    let filepath = musicDir + filename;
    if (!files.exists(filepath)) {
        initFileConfig(filepath);
    };
    let tmp = files.read(filepath);
    tmp = JSON.parse(tmp);
    return tmp[key];
};


function reRunSelf(){
    engines.execScriptFile(files.cwd() + "/main.js");
    exit();
}



function runFileSetup(fileList) {
    let fileName = dialogs.singleChoice("选择一首乐曲..", fileList);
    fileName = fileList[fileName];
    switch (dialogs.singleChoice("请选择一个设置，所有设置都会自动保存", ["调整音高", "半音处理方式"])) {
        case 0:
            setFileConfig("majorPitchOffset", dialogs.singleChoice("调整音高1", ["降低一个八度", "默认", "升高一个八度"], readFileConfig("majorPitchOffset", fileName) + 1) - 1, fileName);
            setFileConfig("minorPitchOffset", dialogs.singleChoice("调整音高2", ["降低2个音阶", "降低1个音阶", "默认", "升高1个音阶", "升高2个音阶"], readFileConfig("minorPitchOffset", fileName) + 2) - 2, fileName);
            break;
        case 1:
            setFileConfig("halfCeiling", dialogs.singleChoice("楚留香的乐器无法弹奏半音，所以对于半音..", ["降低", "升高"], readFileConfig("halfCeiling", fileName)), fileName);

    };
};

function runGlobalSetup() {
    switch (dialogs.select("请选择一个设置，所有设置都会自动保存", ["跳过空白部分", "设置游戏类型","使用自定义坐标","设置自定义坐标"])) {
        case 0:
            setGlobalConfig("skipInit", dialogs.select("是否跳过乐曲开始前的空白?", ["否", "是"]));
            break;
        case 1:
            let sel = dialogs.select("选择此脚本的目标游戏(此选项只会影响预设的坐标)", ["楚留香(一梦江湖)", "天涯明月刀", "原神", "摩尔庄园"]);
            switch (sel) {
                case 0:
                    setGlobalConfig("gameType", "楚留香");
                    break;
                case 1:
                    setGlobalConfig("gameType", "天涯明月刀");
                    break;
                case 2:
                    setGlobalConfig("gameType", "原神");
                    break;
                case 3:
                    setGlobalConfig("gameType", "摩尔庄园");
                    break;
            };
            break;
        case 2:
            if (!dialogs.confirm("", "总是使用自定义坐标吗")) {
                setGlobalConfig("alwaysUseCustomPos", false);
            } else {
                if (readGlobalConfig("customPosX", 0) === 0) {    //无效的配置
                    dialogs.alert("", "你还没有设置自定义坐标!");
                } else {
                    setGlobalConfig("alwaysUseCustomPos", true);
                }
            }
            break;
        case 3: //设置自定义坐标
            let clickx_pos = [];
            let clicky_pos = [];
            let pos1 = getPosInteractive("最左上角的音符按键中心");
            let pos2 = getPosInteractive("最右下角的音符按键中心");
            //等距分布
            for (let i = 0; i < 7; i++) {
                clickx_pos.push(pos1.x + (pos2.x - pos1.x) * i / 6);
            }
            for (let i = 2; i >= 0; i--) {
                clicky_pos.push(pos1.y + (pos2.y - pos1.y) * i / 2);    //从下到上(y高->y低)
            }
            setGlobalConfig("customPosX", clickx_pos);
            setGlobalConfig("customPosY", clicky_pos);
            dialogs.alert("", "设置完成");
            break;
    };
};

//toast(name2pitch("B6"));
//exit();


/////////
//主程序//
/////////
files.ensureDir(musicDir);
//globalConfig.put("inited", 0);
if (readGlobalConfig("lastVersion", 0) != scriptVersion) {
    //第一次启动，初始化设置
    toast("初始化设置..");

    if (readGlobalConfig("skipInit", -1) == -1) setGlobalConfig("skipInit", 1);
    if (readGlobalConfig("waitForGame", -1) == -1) setGlobalConfig("waitForGame", 1);

    let files_ = files.listDir("./exampleTracks");
    for (let i in files_) {
        toast("copy:" + files_[i])
        files.copy("./exampleTracks/" + files_[i], musicDir + files_[i]);
    };
    setGlobalConfig("lastVersion", scriptVersion);

};

console.info("\
1.为了点击屏幕，本程序需要辅助功能权限，这是必须的，剩下的权限拒绝就行\n\
2.使用方法:在游戏中切换到演奏界面，打开这个脚本，点击播放按钮即可开始\n\
3.你可以随时按音量上键结束运行\n\
4.如果脚本输出一些文字就没反应了，请允许脚本的悬浮窗权限！！(坑爹的小米手机)\n\
5.脚本制作:声声慢:心慕流霞 李芒果，也强烈感谢auto.js作者提供的框架\n\
");

console.verbose("等待无障碍服务..");
//toast("请允许本应用的无障碍权限");
auto.waitFor();
const fileList = getFileList();


//解析信息

var index;
var exportScore = false;
switch (dialogs.select("选择一项操作..", ["🎶演奏乐曲", "🛠️更改全局设置", "🛠️更改乐曲设置", "🎼乐谱输出", "📃查看使用说明","🚪离开"])) {

    case 0:
        index = dialogs.select("选择一首乐曲..", fileList);
        break;
    case 1:
        runGlobalSetup();
        exit();
        break;
    case 2:
        runFileSetup(fileList);
        exit();
        break;
    case 3:
        index = dialogs.select("选择一首乐曲..", fileList);
        exportScore = true;
        break;
    case 4:
        app.viewFile(musicDir + "使用帮助.txt");
        exit();
        break;
    case 5:
        exit();
        break;
};

const totalFiles = files.listDir(musicDir, function (name) {
    return (name.endsWith(".json") || name.endsWith(".mid")) && files.isFile(files.join(musicDir, name));
});

var fileName = totalFiles[index];

let noteData;
if (fileName == undefined) {
    toast("脚本已退出");
    exit();
}
if (fileName.endsWith(".json")) {
    noteData = parseTonejsJSON(musicDir + fileName);
}else if(fileName.endsWith(".mid")){
    noteData = parseMIDI(musicDir + fileName);
}

jsonData = null;
console.log("音符总数:%d",noteData.length);

//////////////////////////乐谱导出功能开始
if(exportScore){
    let keySeq = [];
    let noteList =[];
    let noteCount = noteData.length;
    let i = 0;
    let maxDelayTime = 0;
    while (i < noteCount) {
        delaytime0 = noteData[i][1]; //这个音符的时间，单位:秒
        if (i != (noteCount - 1)) {
            delaytime1 = noteData[i+1][1];
        } else {
            delaytime1 = delaytime0 + 0.1;
        };
        if (Math.abs(delaytime0 - delaytime1) < 0.01) { //如果两个音符时间相等，把这个音和后面的一起加入数组
            noteList.push(noteData[i][0]);
        } else {
            noteList.push(noteData[i][0]);
            let delaytime = (delaytime1 - delaytime0) * 1000;
            if(delaytime > maxDelayTime) maxDelayTime = delaytime;
            keySeq.push([noteList,delaytime]);
            noteList = [];
            gestureList = [];
        };
        i++;
    };
    let confirmed = false;
    let gapTime = 0;
    while (!confirmed) {
        gapTime = dialogs.input("输入在你打算把两个音符分到两小段的时候,它们间的时间差(单位:毫秒)", maxDelayTime.toString());
        if(gapTime < 10) dialogs.alert("","输入无效,请重新输入");
        let segmentCnt = 1;
        keySeq.forEach(key => {
            if(key[1] >= gapTime) segmentCnt++;
        }); 
        confirmed = dialogs.confirm("","乐谱将分为" + segmentCnt.toString() + "个小段,是否满意?");
    }

   
    let toneStr;
    switch (dialogs.select("选择导出格式", ["楚留香(键盘)", "原神(键盘)"])) {
        case 0:
            toneStr = "ZXCVBNMASDFGHJQWERTYU";
            break;
        case 1:
            toneStr = "ZXCVBNMASDFGHJQWERTYU";
            break;
    }
    //开始转换
    let outPutStr = "";
    keySeq.forEach(key => {
        if(key[0].length > 1){
            outPutStr += "(";
            key[0].forEach(element => {
                outPutStr += toneStr[element-1];
            });
            outPutStr += ")";
        }else{
            outPutStr += toneStr[key[0][0]-1];
        }
        if(key[1] >= gapTime) outPutStr += " ";
    }); 
    //导出到文件
    let path = musicDir + "乐谱导出.txt";
    files.write(path, outPutStr);
    dialogs.alert("导出成功","已导出至" + path);
    exit();
}

//////////////////////////乐谱导出功能结束

//exit();

//注意，这是横屏状态的坐标:左上角(0,0),向右x增，向下y增
//检测分辨率
console.info("你的屏幕分辨率是:%dx%d", device.height, device.width);

let useCustomPos = readGlobalConfig("alwaysUseCustomPos", false);
if (!useCustomPos) {
    console.log("正在使用内置坐标");
    let screenWidth = device.width;
    let screenHeight = device.height;
    let gameType = readGlobalConfig("gameType", "楚留香");
    let keyPos;
    let res = new preDefinedRes();
    try {
        keyPos = res.getKeyPosition(screenHeight, screenWidth, gameType);
    }catch (e) {
        console.error(e);
        setGlobalConfig("alwaysUseCustomPos", true);
        dialogs.alert("错误", "没有找到合适的内置坐标，请设置自定义坐标");
        exit();
    };
    var clickx_pos = keyPos.clickx_pos;
    var clicky_pos = keyPos.clicky_pos;
} else {
    console.log("正在使用自定义坐标");
    var clickx_pos = readGlobalConfig("customPosX", 0);
    var clicky_pos = readGlobalConfig("customPosY", 0);
    if(clickx_pos == 0 || clicky_pos == 0){
        dialogs.alert("错误", "自定义坐标未设置");
        exit();
    }
    console.log(clicky_pos);
}

//media.playMusic("/sdcard/test.mp3", 1);
//sleep(200);


dialogs.alert("","音符总数:" + noteData.length);
console.verbose("无障碍服务启动成功");


//主循环
var noteList = new Array();
var i = 0
const noteCount = noteData.length;
var delaytime0, delaytime1;

if (!readGlobalConfig("skipInit", 1)) sleep(noteData[0][1] * 1000);

//显示悬浮窗
let controlWindow = floaty.rawWindow(
    <frame gravity="left">
        <horizontal bg="#7fffff7f">
            <text id="timerText" text="00:00/00:00" textSize="14sp"  />
            <seekbar id="progressBar" layout_gravity="center_vertical" w='900px' />、
            <button id="pauseResumeBtn" style="Widget.AppCompat.Button.Colored" w="180px" text="⏸" />
            <button id="stopBtn" style="Widget.AppCompat.Button.Colored" w="180px" text="⏹" />
        </horizontal>
    </frame>
);

controlWindow.setPosition(1, 0);
controlWindow.setTouchable(true);  

let paused = true;  //手动启动播放
//用来更新悬浮窗的线程
threads.start(function(){
    let progress = 0;
    let progressChanged = false;
    ui.run(function () {
        controlWindow.progressBar.setOnSeekBarChangeListener({ 
            onProgressChanged: function (seekBar, progress0, fromUser) {  
                if (fromUser) {
                    progress = progress0;
                    progressChanged = true;
                };
            }
        });
        controlWindow.pauseResumeBtn.setText("▶️");
        controlWindow.pauseResumeBtn.click(() => {
            if (paused) {
                paused = false; //只需要设置变量即可，主线程会自动处理
                controlWindow.pauseResumeBtn.setText("⏸");
            } else {
                paused = true;
                controlWindow.pauseResumeBtn.setText("▶️");
            }
        });
        controlWindow.stopBtn.click(()=>{
           threads.shutDownAll();
           reRunSelf();
        })
    });
    let totalTimeSec = noteData[noteData.length -1][1];
    let totalTimeStr = sec2timeStr(totalTimeSec);

    while (true) {
        //如果进度条被拖动，更新播放进度
        if(progressChanged){
            progressChanged = false;
            let targetTimeSec = totalTimeSec * progress / 100;
            for (let j = 0; j < noteData.length; j++) {
                if (noteData[j][1] > targetTimeSec) {
                    i = j - 1;
                    break;
                }
            }
        }
        //计算时间
        let curTimeSec = noteData[i][1];
        let curTimeStr = sec2timeStr(curTimeSec);
        let timeStr = curTimeStr + "/" + totalTimeStr;
        //更新窗口
        ui.run(()=>{
            controlWindow.progressBar.setProgress(curTimeSec/totalTimeSec * 100);
            controlWindow.timerText.setText(timeStr); 
        })
        sleep(500);
    }
})
while (paused) {
    sleep(500);
}
while (i < noteCount) {
    delaytime0 = noteData[i][1]; //这个音符的时间，单位:秒
    if (i != (noteCount - 1)) {
        delaytime1 = noteData[i+1][1];
    } else {
        delaytime1 = delaytime0 + 0.1;
    };
    if (Math.abs(delaytime0 - delaytime1) < 0.01) { //如果两个音符时间相等，把这个音和后面的一起加入数组
        noteList.push(noteData[i][0]);
    } else {
        noteList.push(noteData[i][0]);
        let delaytime = delaytime1 - delaytime0;
        //console.log(noteList);
        var gestureList = new Array();
        for (var j = 0; j < noteList.length; j++) { //遍历这个数组
            tone = noteList[j];
            if (tone != 0) {
                var clicky = Math.floor((tone - 1) / 7) + 1; //得到x
                if (tone % 7 == 0) { //得到y
                    var clickx = 7;
                } else {
                    var clickx = tone % 7;
                };
                gestureList[gestureList.length] = [0, 5, [clickx_pos[clickx - 1], clicky_pos[clicky - 1]]];
            };
        };
        if (delaytime >= 6) {
            //长音
            //gestureList[gestureList.length] = [0, delaytime * 1000 / 2, longclick_pos];
        };
        //执行手势
        //console.log(gestureList);

        if (gestureList.length > 10) gestureList.splice(9, gestureList.length - 10); //手势最多同时只能执行10个

        if (gestureList.length != 0) {
            gestures.apply(null, gestureList);
        };
        sleep(delaytime * 1000 - 8);
        while (paused) {
            sleep(1000);
        }
        noteList = [];
        gestureList = [];
    };
    i++
};
toast("播放结束");
threads.shutDownAll();
