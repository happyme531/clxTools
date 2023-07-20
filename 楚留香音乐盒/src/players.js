//@ts-check
//players.js -- 实现播放/演奏功能


/**
 * @typedef {Array<[number,number,...import("./gameProfile").pos2d]>} Gestures
 */

function AutoJsGesturePlayer(){
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

    this.PlayerStates = PlayerStates;

    /**
     * @type {PlayerStates}
     * @description 播放器状态
     * @private
     */
    let playerState = PlayerStates.UNINITIALIZED;

    /**
     * @type {Array<[Gestures, number]>?}
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
     * @brief 设置手势和时间数据
     * @param {Array<[Gestures, number]>} gestureTimeList_ 手势和时间数据
     */
    this.setGestureTimeList = function(gestureTimeList_){
        gestureTimeList = gestureTimeList_;
    }

    /**
     * @brief 启动播放
     * 
     */
    this.start = function(){
        playerState = PlayerStates.UNINITIALIZED;
        position = 0;
        playerThread = threads.start(playerThreadFunc);
    }

    /**
     * @brief 暂停播放
     */
    this.pause = function(){
        playerState = PlayerStates.PAUSED;
    }

    /**
     * @brief 继续播放
     */
    this.resume = function(){
        playerState = PlayerStates.SEEK_END;
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
            return true;
        }
        return false;
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
                    let currentNoteTimeAbs = gestureTimeList[position][1]*1000*(1/playSpeed);
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
                    let currentNoteTimeAbs = gestureTimeList[position][1]*1000*(1/playSpeed);
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
                    //播放
                    gestures.apply(null, currentNote);
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

function Players() {
    this.AutoJsGesturePlayer = AutoJsGesturePlayer;
}

module.exports = new Players();
    