//@ts-check
//players.js -- 实现播放/演奏功能

var { SimpleInstructPlayerImpl, SkyCotlLikeInstructPlayerImpl } = require("./instruct.js");

function NormalDistributionRandomizer(mean, stddev) {
    this.mean = mean;
    this.stddev = stddev;

    this.next = function () {
        var u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        var num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num * this.stddev + this.mean;
        return num;
    }
}

/**
 * @enum {string}
 * @readonly
 */
var PlayerType = {
    None: "None",
    AutoJsGesturePlayer: "AutoJsGesturePlayer",
    SimpleInstructPlayer: "SimpleInstructPlayer",
    SkyCotlLikeInstructPlayer: "SkyCotlLikeInstructPlayer"
}

/**
 * @constructor
 */
function AutoJsGesturePlayerImpl() {
    /**
    * @brief 执行一组操作
    * @param {Gestures} _gestures 手势
    */
    this.exec = function (_gestures) {
        gestures.apply(null, _gestures);
    }

    this.getType = function () {
        return PlayerType.AutoJsGesturePlayer;
    }

    this.doTransform = true;
}

/**
 * @enum {number}
 */
const PlayerStates = {
    PLAYING: 0,
    PAUSED: 1,
    SEEKING: 2,
    SEEK_END: 3,
    UNINITIALIZED: 4,
    FINISHED: 5,
}

/**
 * @typedef {[delay: number,duration: number, points: ...import("./gameProfile").pos2d[]]} Gesture
 * @typedef {Array<Gesture>} Gestures
 * @typedef {object} PlayerImpl
 * @property {boolean} doTransform 是否要使用transformGesture函数处理手势
 * @property {(function(Gestures):void)|(function(import('./noteUtils').PackedKey):void)} exec 执行一组操作
 * @property {function(): PlayerType} getType 获取播放器类型
 * @property {function(object):void} [setGestureTimeList] 设置手势和时间数据
 * @property {function(number):void} [seekTo] 设置播放位置
 * @property {function():void} [next] 播放下一个音符
 * @property {function(PlayerStates):void} [setState] 设置播放状态
 */

/**
 * 播放器. 可能有不同的实现
 * @param {PlayerImpl} playerImpl 
 */
function Player(playerImpl){

    this.PlayerStates = PlayerStates;

    /**
     * @type {PlayerStates}
     * @description 播放器状态
     * @private
     */
    let playerState = PlayerStates.UNINITIALIZED;

    /**
     * @type {Array<[Gestures, number]>|Array<import('./noteUtils').PackedKey>?}
     * @description 手势和时间数据
     */
    let gestureTimeList = null;

    /**
     * @type {function(number):void}
     * @description 每播放一个音符的回调函数
     */
    let onPlayNote = function(/** @type {number} */ position){};

        /**
     * @type {function(number):void}
     * @description 状态切换回调函数
     */
    let onStateChange = function(/** @type {number} */ newState){};

    /**
     * @type Thread
     * @description 播放线程
     * @private
     */
    let playerThread = null;

    /**
     * @type number
     * @description 播放位置(音符序号)
     * @private
     */
    let position = 0;

    /**
     * @type number
     * @description 播放速度(倍数, <1减速, >1加速)
     * @private
     * @default 1
     */
    let playSpeed = 1;

    /**
     * @type number
     * @description 点击位置的平均偏差(像素)
     * @private
     * @default 0
     */
    let clickPositionDeviationPx = 0;

    /**
     * @type {NormalDistributionRandomizer|null}
     */
    let clickPositionDeviationRandomizer = null;

    let implSync = function(){
        if (playerImpl.setState != null) playerImpl.setState(playerState);
        if (playerImpl.seekTo != null) playerImpl.seekTo(position);
    }

    this.getType = function(){
        return playerImpl.getType();
    }

    this.getImplementationInstance = function(){
        return playerImpl;
    }

    /**
     * @brief 设置手势和时间数据
     * @param {Array<[Gestures, number]>|Array<import('./noteUtils').PackedKey>} gestureTimeList_ 手势和时间数据
     */
    this.setGestureTimeList = function(gestureTimeList_){
        gestureTimeList = gestureTimeList_;
        if(playerImpl.setGestureTimeList != null){
            playerImpl.setGestureTimeList(gestureTimeList_);
        }
    }

    /**
     * @brief 设置点击位置的平均偏差(像素)
     * @param {number} clickPositionDeviationPx_ 点击位置的平均偏差(像素)
     */
    this.setClickPositionDeviationPx = function(clickPositionDeviationPx_){
        clickPositionDeviationPx = clickPositionDeviationPx_;
        clickPositionDeviationRandomizer = new NormalDistributionRandomizer(0, clickPositionDeviationPx);
    }

    /**
     * @brief 启动播放
     * 
     */
    this.start = function(){
        playerState = PlayerStates.UNINITIALIZED;
        position = 0;
        implSync();
        let func = playerThreadFunc.bind(this);
        playerThread = threads.start(func);
    }

    /**
     * @brief 暂停播放
     */
    this.pause = function(){
        playerState = PlayerStates.PAUSED;
        implSync();
    }

    /**
     * @brief 继续播放
     */
    this.resume = function(){
        playerState = PlayerStates.SEEK_END;
        implSync();
    }

    /**
     * @brief 设置播放位置
     * @param {number} position_ 播放位置(音符序号)
     * @note TODO: 线程安全?
     */
    this.seekTo = function(position_){
        if (playerState == PlayerStates.PLAYING || playerState == PlayerStates.SEEK_END)
            playerState = PlayerStates.SEEKING;
        position = position_;
        implSync();
    }

    /**
     * @brief 获取播放位置
     * @returns {number} 播放位置(音符序号)
     */
    this.getCurrentPosition = function(){
        return position;
    }

    /**
     * @brief 获取播放状态
     * @returns {number} 播放状态
     */
    this.getState = function(){
        return playerState;
    }

    /**
     * @brief 获取播放速度
     * @returns {number} 播放速度(倍数, <1减速, >1加速)
     */
    this.getPlaySpeed = function(){
        return playSpeed;
    }

    /**
     * @brief 设置播放速度
     * @param {number} playSpeed_ 播放速度(倍数, <1减速, >1加速)
     */
    this.setPlaySpeed = function(playSpeed_){
        playSpeed = playSpeed_;
    }
    /**
     * @brief 设置回调函数
     * @param {function(number):void} onPlayNote_ 每播放一个音符的回调函数
     */
    this.setOnPlayNote = function(onPlayNote_){
        onPlayNote = onPlayNote_;
    }

    /**
     * @brief 状态切换回调函数
     * @param {function(number):void} onStateChange_ 每次状态切换时的回调函数
     */
    this.setOnStateChange = function(onStateChange_){
        onStateChange = onStateChange_;
    }

    /**
     * @brief 停止播放并释放资源
     * @returns {boolean} 是否成功停止
     */
    this.stop = function(){
        if(playerThread != null){
            playerThread.interrupt();
            playerThread.join();
            playerThread = null;
            playerState = PlayerStates.FINISHED;
            onStateChange(playerState);
            position = 0;
            implSync();
            return true;
        }
        return false;
    }

    /**
     * @brief 执行一组操作
     * @param {Gestures} _gestures 手势
     */
    this.exec = function (_gestures) {
        if (playerImpl.doTransform)
            playerImpl.exec(transformGesture(_gestures));
        else
            playerImpl.exec(_gestures);
    }

    /**
     * @brief 对这组手势做处理
     * @param {Gestures} gestures 手势
     * @returns {Gestures} 处理后的手势
     */
    function transformGesture(gestures){
        //随机偏移
        if (clickPositionDeviationPx > 0) {
            gestures.forEach(gesture => {
                let deviation, angle;
                do {
                    deviation = clickPositionDeviationRandomizer.next();
                } while (Math.abs(deviation) > 2 * clickPositionDeviationPx); 
                angle = Math.random() * 2 * Math.PI;
                gesture[2][0] += deviation * Math.cos(angle);
                gesture[2][1] += deviation * Math.sin(angle);
            });
        }
        return gestures;
    }

    /**
     * @brief 播放线程函数
     * @private
     */
    function playerThreadFunc(){
        if(gestureTimeList == null){
            console.error("gestureTimeList is null");
            return;
        }
        let oldState = playerState;
        let startTimeAbs = new Date().getTime() + 100;
        console.info("PlayerThread started");
        while (1) {
            if (oldState != playerState) {
                console.info("PlayerState: %s -> %s", oldState, playerState);
                oldState = playerState;
                onStateChange(playerState);
            }
            implSync();
            switch (playerState) {
                case PlayerStates.FINISHED:
                case PlayerStates.UNINITIALIZED:
                case PlayerStates.PAUSED: //(->SEEK_END)
                    sleep(500); //循环等待状态变更 
                    break;
                case PlayerStates.SEEKING: //(->SEEK_END)
                    playerState = PlayerStates.SEEK_END;
                    sleep(500); //在这500ms内, 状态可能会变回SEEKING. 继续循环
                    break;
                case PlayerStates.SEEK_END:{ //(->PLAYING)
                    playerState = PlayerStates.PLAYING;
                    if(position == 0){
                        startTimeAbs = new Date().getTime() + 100; //第一次播放, 从100ms前开始
                        break;
                    }
                    //设置播放起始时间
                    let currentNoteTimeAbs = gestureTimeList[position][1]*(1/playSpeed);
                    startTimeAbs = new Date().getTime() - currentNoteTimeAbs;
                    onPlayNote(position);
                    break;
                }
                case PlayerStates.PLAYING:{ //(->PAUSED/FINISHED/SEEKING)
                    if (position >= gestureTimeList.length) {
                        playerState = PlayerStates.FINISHED;
                        break;
                    }
                    let currentNote = gestureTimeList[position][0];
                    let currentNoteTimeAbs = gestureTimeList[position][1]*(1/playSpeed);
                    let elapsedTimeAbs = new Date().getTime() - startTimeAbs;
                    let delayTime = currentNoteTimeAbs - elapsedTimeAbs - 7; //7ms是手势执行时间
                    if (delayTime > 0) {
                        while (delayTime > 0) {
                            sleep(Math.min(delayTime, 467));
                            delayTime -= 467;
                            if (playerState != PlayerStates.PLAYING) {
                                break;
                            }
                        }
                    }else{
                        //直接跳过
                        position++;
                        break;
                    }
                    this.exec(currentNote);
                    position++;
                    onPlayNote(position);
                    break;
                }
                default:
                    break;
            }
        }
    }
}

/**
 * @typedef {Player} PlayerBase
 */


module.exports = {
    "PlayerType": PlayerType,
    "AutoJsGesturePlayer": Player.bind(null, new AutoJsGesturePlayerImpl()),
    "SimpleInstructPlayer": Player.bind(null, new SimpleInstructPlayerImpl()),
    "SkyCotlLikeInstructPlayer":  Player.bind(null, new SkyCotlLikeInstructPlayerImpl()),
}
    