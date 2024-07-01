var GameProfile = require("../gameProfile.js");
var midiPitch = require("../midiPitch.js");


/**
 * @brief 将一个数值转换到0-1000的另一个区间, 给进度条用
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function numberMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

/**
 * @brief numberMap的对数版本
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    if (value < min) value = min;
    if (value > max) value = max;
    return Math.log(value - min + 1) / Math.log(max - min + 1) * (newMax - newMin) + newMin;
}

/**
 * @brief numberMap的反函数
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMap
 */
function numberRevMap(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return (value - newMin) / (newMax - newMin) * (max - min) + min;
}

/**
 * @brief numberMapLog的反函数
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @see numberMapLog
 */
function numberRevMapLog(value, min, max) {
    const newMin = 0;
    const newMax = 1000;
    return min + (Math.exp((value - newMin) / (newMax - newMin) * Math.log(max - min + 1)) - 1);
}

/**
 * @brief 浮点数比较
 */
function floatEqual(a, b) {
    return Math.abs(a - b) < 0.000001;
}

/**
 * @enum {string}
 * @readonly
 */
var ConfigurationFlags = {
    //设置的详细程度
    LEVEL_SIMPLE: "LEVEL_SIMPLE",
    LEVEL_ADVANCED: "LEVEL_ADVANCED",
    LEVEL_EXPERT: "LEVEL_EXPERT",
    //乐曲是否有时长信息
    MUSIC_HAS_DURATION_INFO: "MUSIC_HAS_DURATION_INFO",
    //乐曲是否有音轨
    MUSIC_HAS_TRACKS: "MUSIC_HAS_TRACKS",
    //工作模式
    WORKMODE_GESTURE_PLAYER: "WORKMODE_GESTURE_PLAYER",
    WORKMODE_INSTRUCT: "WORKMODE_INSTRUCT",
    WORKMODE_MIDI_INPUT_STREAMING: "WORKMODE_MIDI_INPUT_STREAMING",
    //游戏是否支持时长信息
    GAME_HAS_DURATION_INFO: "GAME_HAS_DURATION_INFO",
    //游戏是否有所有半音
    GAME_HAS_ALL_SEMITONES: "GAME_HAS_ALL_SEMITONES",
}

/**
 * @enum {string}
 */
const ConfigurationCallbacks = {
    //刷新设置界面
    refreshConfigurationUi: "refreshConfigurationUi",
    //运行自动优化
    runAutoTune: "runAutoTune",
    //选择音轨
    selectTracks: "selectTracks",
}


/**
 *
 * @param {string} rawFileName
 * @param {GameProfile} gameProfile
 * @param {Array<ConfigurationFlags>} flags
 * @param {function(ConfigurationCallbacks, Object):void} callback
 */
function ConfigurationUi(rawFileName, gameProfile, flags, callback) {
    const View = android.view.View;
    let evt = events.emitter(threads.currentThread());

    let configuration = require("../configuration.js");

    /**
     * @type {Array<ConfigurationFlags>}
     */
    this.flags = flags;

    /**
     * @typedef {Object} ConfigurationUiFragment
     * @property {string} name - 名称
     * @property {View} view - 界面
     */

    /**
     * @type {Array<ConfigurationUiFragment>}
     * @brief 设置界面的各个子界面
     */
    this.fragments = [];

    let anythingChanged = false;



    evt.on("callback", function (callbackName, data) {
        callback(callbackName, data);
    });

    /**
     * 
     * @param {ConfigurationCallbacks} callbackName 
     * @param {Object} data 
     */
    function runCallback(callbackName, data) {
        //不能在ui线程直接调用callback, 否则会导致ui线程阻塞
        //使用事件机制
        evt.emit("callback", callbackName, data);
    }

    let triggerUiRefresh = function () {
        runCallback(ConfigurationCallbacks.refreshConfigurationUi, {});
    }

    //构造函数开始

    //文件播放模式的配置
    if (this.flags.includes(ConfigurationFlags.WORKMODE_GESTURE_PLAYER) ||
        this.flags.includes(ConfigurationFlags.WORKMODE_INSTRUCT)) {

        //设置等级
        let view_configurationLevel = ui.inflate(
            <vertical>
                <text text="设置等级:" textColor="red" />
                <radiogroup id="levelSelection" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                    <radio id="levelSelection_simple" text="简单" textSize="12sp" margin="0dp" />
                    <radio id="levelSelection_advanced" text="高级" textSize="12sp" margin="0dp" />
                    <radio id="levelSelection_expert" text="专家" textSize="12sp" margin="0dp" visibility="gone" />{/* TODO: */}
                </radiogroup>
            </vertical>
        );
        let configurationLevel = configuration.readGlobalConfig("configurationLevel", ConfigurationFlags.LEVEL_ADVANCED);
        this.flags.push(configurationLevel);
        switch (configurationLevel) {
            case ConfigurationFlags.LEVEL_SIMPLE:
                view_configurationLevel.levelSelection_simple.setChecked(true);
                break;
            case ConfigurationFlags.LEVEL_ADVANCED:
                view_configurationLevel.levelSelection_advanced.setChecked(true);
                break;
            case ConfigurationFlags.LEVEL_EXPERT:
                view_configurationLevel.levelSelection_expert.setChecked(true);
                break;
        }
        view_configurationLevel.levelSelection.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let configurationLevel = "";
            switch (checkedId) {
                case view_configurationLevel.levelSelection_simple.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_SIMPLE;
                    break;
                case view_configurationLevel.levelSelection_advanced.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_ADVANCED;
                    break;
                case view_configurationLevel.levelSelection_expert.getId():
                    configurationLevel = ConfigurationFlags.LEVEL_EXPERT;
                    break;
            }
            configuration.setGlobalConfig("configurationLevel", configurationLevel);
            triggerUiRefresh();
        });

        this.fragments.push({
            name: "configurationLevel",
            view: view_configurationLevel
        });

        //运行模式
        let view_runMode = ui.inflate(
            <vertical>
                <text text="运行模式:" />
                <radiogroup id="playerSelection" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                    <radio id="playerSelection_AutoJsGesturePlayer" text="自动弹奏" textSize="12sp" margin="0dp" />
                    <radio id="playerSelection_SimpleInstructPlayer" text="跟弹模式(简易)" textSize="12sp" margin="0dp" />
                    <radio id="playerSelection_SkyCotlLikeInstructPlayer" text="跟弹模式(类光遇)" textSize="12sp" margin="0dp" />
                </radiogroup>
            </vertical>
        )

        let playerSelection = configuration.readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
        if (playerSelection.includes("AutoJsGesturePlayer")) {
            view_runMode.playerSelection_AutoJsGesturePlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_GESTURE_PLAYER);
        }
        if (playerSelection.includes("SimpleInstructPlayer")) {
            view_runMode.playerSelection_SimpleInstructPlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_INSTRUCT);
        }

        if (playerSelection.includes("SkyCotlLikeInstructPlayer")) {
            view_runMode.playerSelection_SkyCotlLikeInstructPlayer.setChecked(true);
            this.flags.push(ConfigurationFlags.WORKMODE_INSTRUCT);
        }

        view_runMode.playerSelection.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let playerSelection = [];
            if (checkedId == view_runMode.playerSelection_AutoJsGesturePlayer.getId()) {
                playerSelection.push("AutoJsGesturePlayer");
            }
            if (checkedId == view_runMode.playerSelection_SimpleInstructPlayer.getId()) {
                playerSelection.push("SimpleInstructPlayer");
            }
            if (checkedId == view_runMode.playerSelection_SkyCotlLikeInstructPlayer.getId()) {
                playerSelection.push("SkyCotlLikeInstructPlayer");
            }
            configuration.setGlobalConfig("playerSelection", playerSelection);
        });

        this.fragments.push({
            name: "runMode",
            view: view_runMode
        });

        //乐谱可视化
        let view_visualization = ui.inflate(
            <vertical>
                <text text="乐谱可视化:" />
                <horizontal>
                    <text text="使用乐谱可视化:" />
                    <checkbox id="visualizationEnabledCheckbox" />
                </horizontal>
            </vertical>
        );

        let visualizationEnabled = configuration.readGlobalConfig("visualizationEnabled", true);
        view_visualization.visualizationEnabledCheckbox.setChecked(visualizationEnabled);
        view_visualization.visualizationEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("visualizationEnabled", checked);
        });
        this.fragments.push({
            name: "visualization",
            view: view_visualization
        });

        //速度设置
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_speed = ui.inflate(
                <vertical>
                    <text text="速度控制:" textColor="red" />
                    <horizontal>
                        {/* 5~1500%, 对数, 默认1->不使用 */}
                        <text text="变速:" />
                        <checkbox id="speedMultiplier" />
                        <text text="default%" id="speedMultiplierValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="speedMultiplierSeekbar" w="*" max="1000" layout_gravity="center" />
                    <horizontal w="*">
                        {/* 1~20hz, 对数 , 默认0->不使用*/}
                        <text text="限制点击速度(在变速后应用):" />
                        <checkbox id="limitClickSpeedCheckbox" />
                        <text text="default次/秒" id="limitClickSpeedValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="limitClickSpeedSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>);
            let limitClickSpeedHz = configuration.readFileConfig("limitClickSpeedHz", rawFileName, 0);
            let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
            view_speed.limitClickSpeedCheckbox.setChecked(limitClickSpeedHz != 0);
            view_speed.limitClickSpeedValueText.setText(limitClickSpeedHz.toFixed(2) + "次/秒");
            view_speed.limitClickSpeedSeekbar.setProgress(numberMapLog(limitClickSpeedHz, 1, 20));
            view_speed.speedMultiplier.setChecked(speedMultiplier != 1);
            view_speed.speedMultiplierValueText.setText((speedMultiplier * 100).toFixed(2) + "%");
            view_speed.speedMultiplierSeekbar.setProgress(numberMapLog(speedMultiplier, 0.05, 15));
            view_speed.limitClickSpeedCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                if (checked) {
                    let limitClickSpeedHz = numberRevMapLog(view_speed.limitClickSpeedSeekbar.getProgress(), 1, 20);
                    configuration.setFileConfig("limitClickSpeedHz", limitClickSpeedHz, rawFileName);
                } else {
                    configuration.setFileConfig("limitClickSpeedHz", 0, rawFileName);
                }
            });
            view_speed.speedMultiplier.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                if (checked) {
                    let speedMultiplier = numberRevMapLog(view_speed.speedMultiplierSeekbar.getProgress(), 0.05, 15);
                    configuration.setFileConfig("speedMultiplier", speedMultiplier, rawFileName);
                } else {
                    configuration.setFileConfig("speedMultiplier", 1, rawFileName);
                }
            });
            view_speed.limitClickSpeedSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 1, 20);
                    view_speed.limitClickSpeedValueText.setText(value.toFixed(2) + "次/秒");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_speed.limitClickSpeedCheckbox.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 1, 20);
                    configuration.setFileConfig("limitClickSpeedHz", value, rawFileName);
                }
            });
            view_speed.speedMultiplierSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 0.05, 15);
                    view_speed.speedMultiplierValueText.setText((value * 100).toFixed(2) + "%");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_speed.speedMultiplier.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 0.05, 15);
                    configuration.setFileConfig("speedMultiplier", value, rawFileName);
                }
            });
            this.fragments.push({
                name: "speed",
                view: view_speed
            });
        } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            let view_speed = ui.inflate(
                <vertical>
                    {/* 这里连个ConstraintLayout都没有,啊啊啊啊 */}
                    <text text="变速:" />
                    <horizontal>
                        {/* 恢复, -0.25, -0.1, <当前速度>, +0.1, +0.25 */}
                        <button id="speedMultiplierReset" text="恢复" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierMinus025" text="-0.25" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierMinus01" text="-0.1" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        {/* 加粗字体 */}
                        <text id="speedMultiplierValueText" textStyle="bold" textSize="20sp" gravity="center_vertical" layout_gravity="center_vertical" layout_weight="2" />
                        <button id="speedMultiplierPlus01" text="+0.1" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                        <button id="speedMultiplierPlus025" text="+0.25" margin="0dp" padding="0dp" width="40dp" layout_weight="1" />
                    </horizontal>
                </vertical>);
            let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
            view_speed.speedMultiplierValueText.setText((speedMultiplier).toFixed(2) + "x");
            let alterSpeedMultiplier = function (delta) {
                let speedMultiplier = configuration.readFileConfig("speedMultiplier", rawFileName, 1);
                speedMultiplier += delta;
                if (speedMultiplier < 0.05) speedMultiplier = 0.05;
                if (speedMultiplier > 15) speedMultiplier = 15;
                anythingChanged = true;
                configuration.setFileConfig("speedMultiplier", speedMultiplier, rawFileName);
                view_speed.speedMultiplierValueText.setText((speedMultiplier).toFixed(2) + "x");
            }
            view_speed.speedMultiplierReset.click(function () {
                anythingChanged = true;
                configuration.setFileConfig("speedMultiplier", 1, rawFileName);
                view_speed.speedMultiplierValueText.setText("1.00x");
            });
            view_speed.speedMultiplierMinus025.click(function () {
                alterSpeedMultiplier(-0.25);
            });
            view_speed.speedMultiplierMinus01.click(function () {
                alterSpeedMultiplier(-0.1);
            });
            view_speed.speedMultiplierPlus01.click(function () {
                alterSpeedMultiplier(0.1);
            });
            view_speed.speedMultiplierPlus025.click(function () {
                alterSpeedMultiplier(0.25);
            });
            this.fragments.push({
                name: "speed",
                view: view_speed
            });
        }

        //时长控制
        let view_duration = ui.inflate(
            <vertical>
                <text text="时长控制(输出):" textColor="red" />
                {/* 音符时长输出模式 */}
                <vertical id="noteDurationOutputModeContainer">
                    <horizontal>
                        <text text="时长输出模式:" />
                        <radiogroup id="noteDurationOutputMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                            <radio id="noteDurationOutputMode_none" text="固定值" textSize="12sp" margin="0dp" />
                            <radio id="noteDurationOutputMode_native" text="真实时长(实验性)" textSize="12sp" margin="0dp" />
                            {/* <radio id="noteDurationOutputMode_extraLongKey" text="额外长音按钮" textSize="12sp" margin="0dp" /> */}
                        </radiogroup>
                    </horizontal>
                </vertical>
                <text id="noteDurationOutputModeContainerFallbackText" text="音乐文件没有时长信息, 真实时长模式不可用" textColor="red" visibility="gone" />
                {/* 默认点击时长 */}
                <vertical id="defaultClickDurationContainer">
                    <horizontal w="*">
                        <text text="默认点击时长: " />
                        {/* <radiogroup id="defaultClickDurationMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                 固定的值, 1~500ms, 对数, 默认5ms 
                                <radio id="defaultClickDurationMode_fixed" text="固定值" textSize="12sp" margin="0dp" selected="true" />
                                音符间隔的比例, 例如0.5代表点击时长为到下一个音符的间隔的一半. 0.05~0.98, 线性, 默认0.5
                                <radio id="defaultClickDurationMode_intervalRatio" text="音符间隔比例" textSize="12sp" margin="0dp" />
                            </radiogroup> */}
                        <text text="defaultms" id="defaultClickDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="defaultClickDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                {/* 最长手势持续时间: 100~30000ms, 对数, 默认8000ms */}
                <vertical id="maxGestureDurationContainer">
                    <horizontal w="*">
                        <text text="最长手势持续时间: " />
                        <text text="defaultms" id="maxGestureDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="maxGestureDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                {/* 按键间留空时间: 1~600ms, 对数, 默认100ms */}
                <vertical id="marginDurationContainer">
                    <horizontal w="*">
                        <text text="按键间留空时间: " />
                        <text text="defaultms" id="marginDurationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="marginDurationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
            </vertical>
        )
        let noteDurationOutputMode = configuration.readFileConfigForTarget("noteDurationOutputMode", rawFileName, gameProfile, "none");
        switch (noteDurationOutputMode) {
            case "none":
                view_duration.noteDurationOutputMode_none.setChecked(true);
                break;
            case "native":
                view_duration.noteDurationOutputMode_native.setChecked(true);
                break;
        }
        //设置ui可见性
        let real_noteDurationOutputMode = noteDurationOutputMode;
        let musicHasDurationInfo = this.flags.includes(ConfigurationFlags.MUSIC_HAS_DURATION_INFO);
        if (!musicHasDurationInfo) {
            view_duration.noteDurationOutputModeContainerFallbackText.setVisibility(View.VISIBLE);
            view_duration.noteDurationOutputModeContainer.setVisibility(View.GONE);
            real_noteDurationOutputMode = "none";
        }
        switch (real_noteDurationOutputMode) {
            case "none":
                view_duration.defaultClickDurationContainer.setVisibility(View.VISIBLE);
                view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
                view_duration.marginDurationContainer.setVisibility(View.GONE);
                break;
            case "native":
                view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
                view_duration.maxGestureDurationContainer.setVisibility(View.VISIBLE);
                view_duration.marginDurationContainer.setVisibility(View.VISIBLE);
                break;
        }
        //在简单模式下隐藏所有滑动条
        if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
            view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
            view_duration.marginDurationContainer.setVisibility(View.GONE);
        }

        let defaultClickDuration = configuration.readGlobalConfig("defaultClickDuration", 5);
        view_duration.defaultClickDurationValueText.setText(defaultClickDuration.toFixed(2) + "ms");
        view_duration.defaultClickDurationSeekbar.setProgress(numberMapLog(defaultClickDuration, 1, 500));
        let maxGestureDuration = configuration.readGlobalConfig("maxGestureDuration", 8000);
        view_duration.maxGestureDurationValueText.setText(maxGestureDuration.toFixed(2) + "ms");
        view_duration.maxGestureDurationSeekbar.setProgress(numberMapLog(maxGestureDuration, 100, 30000));
        let marginDuration = configuration.readGlobalConfig("marginDuration", 100);
        view_duration.marginDurationValueText.setText(marginDuration.toFixed(2) + "ms");
        view_duration.marginDurationSeekbar.setProgress(numberMapLog(marginDuration, 1, 600));

        view_duration.noteDurationOutputMode.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let noteDurationOutputMode = "";
            switch (checkedId) {
                case view_duration.noteDurationOutputMode_none.getId():
                    noteDurationOutputMode = "none";
                    break;
                case view_duration.noteDurationOutputMode_native.getId():
                    noteDurationOutputMode = "native";
                    break;
            }
            switch (noteDurationOutputMode) {
                case "none":
                    view_duration.defaultClickDurationContainer.setVisibility(View.VISIBLE);
                    view_duration.maxGestureDurationContainer.setVisibility(View.GONE);
                    view_duration.marginDurationContainer.setVisibility(View.GONE);
                    break;
                case "native":
                    view_duration.defaultClickDurationContainer.setVisibility(View.GONE);
                    view_duration.maxGestureDurationContainer.setVisibility(View.VISIBLE);
                    view_duration.marginDurationContainer.setVisibility(View.VISIBLE);
                    break;
            }
            configuration.setFileConfigForTarget("noteDurationOutputMode", noteDurationOutputMode, rawFileName, gameProfile);
            triggerUiRefresh();
        });
        view_duration.defaultClickDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 1, 500);
                view_duration.defaultClickDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 1, 500);
                configuration.setGlobalConfig("defaultClickDuration", value);
            }
        });
        view_duration.maxGestureDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 100, 30000);
                view_duration.maxGestureDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 100, 30000);
                configuration.setGlobalConfig("maxGestureDuration", value);
            }
        });
        view_duration.marginDurationSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMapLog(progress, 1, 600);
                view_duration.marginDurationValueText.setText(value.toFixed(2) + "ms");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMapLog(seekbar.getProgress(), 1, 600);
                configuration.setGlobalConfig("marginDuration", value);
            }
        });
        this.fragments.push({
            name: "duration",
            view: view_duration
        });

        //音域优化
        let view_range = ui.inflate(
            <vertical>
                <text text="音域优化:" textColor="red" />
                {/* <ImageView w="*" h="1dp" bg="#a0a0a0" /> */}
                <horizontal id="semiToneRoundingModeSettingContainer">
                    {/* 默认向下取整 */}
                    <text text="半音取整方法:" layout_gravity="center_vertical" />
                    <radiogroup id="semiToneRoundingModeSetting" orientation="vertical" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="semiToneRoundingModeSetting_roundDown" text="向下取整" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_roundUp" text="向上取整" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_drop" text="丢弃半音" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_both" text="同时上下取整" textSize="12sp" margin="0dp" />
                    </radiogroup>
                </horizontal>
                <vertical id="trackDisableThresholdSettingContainer">
                    <horizontal>
                        {/* 1~99%, 线性, 默认50% */}
                        <text text="自动调整: 禁用音轨阈值(越高->越简单):" />
                        <text text="default%" id="trackDisableThresholdValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="trackDisableThresholdSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
                <horizontal>
                    <button id="autoTuneButton" text="自动优化以下设置(重要!)" />
                </horizontal>
                <horizontal>
                    {/* -2~2 */}
                    <text text="升/降八度:" />
                    <text text="default" id="majorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                </horizontal>
                <seekbar id="majorPitchOffsetSeekbar" w="*" max="4" layout_gravity="center" />
                <vertical id="minorPitchOffsetSettingContainer">
                    <horizontal>
                        {/* -4~7 */}
                        <text text="升/降半音(移调):" />
                        <text text="default" id="minorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="minorPitchOffsetSeekbar" w="*" max="11" layout_gravity="center" />
                </vertical>
                <horizontal id="trackSelectionContainer">
                    <text text="音轨选择:" />
                    <button id="selectTracksButton" text="选择..." padding="0dp" />
                </horizontal>
                <text text="当前的音乐文件没有音轨信息, 选择音轨不可用" id="trackSelectionContainerFallbackText" textColor="red" visibility="gone" />
            </vertical>
        );

        //在简单模式下隐藏菜单
        if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            view_range.semiToneRoundingModeSettingContainer.setVisibility(View.GONE);
            view_range.trackDisableThresholdSettingContainer.setVisibility(View.GONE);
            view_range.minorPitchOffsetSettingContainer.setVisibility(View.GONE);
        }
        //如果游戏有所有半音, 隐藏移调设置
        if (this.flags.includes(ConfigurationFlags.GAME_HAS_ALL_SEMITONES)) {
            view_range.semiToneRoundingModeSettingContainer.setVisibility(View.GONE);
            view_range.autoTuneButton.setVisibility(View.GONE);
            view_range.minorPitchOffsetSettingContainer.setVisibility(View.GONE);
        }
        //如果没有音轨信息, 隐藏音轨选择
        if (!this.flags.includes(ConfigurationFlags.MUSIC_HAS_TRACKS)) {
            view_range.trackSelectionContainer.setVisibility(View.GONE);
            view_range.trackSelectionContainerFallbackText.setVisibility(View.VISIBLE);
        }


        let semiToneRoundingMode = configuration.readFileConfig("semiToneRoundingMode", rawFileName, 0);
        switch (semiToneRoundingMode) {
            case 0:
                view_range.semiToneRoundingModeSetting_roundDown.setChecked(true);
                break;
            case 1:
                view_range.semiToneRoundingModeSetting_roundUp.setChecked(true);
                break;
            case 2:
                view_range.semiToneRoundingModeSetting_drop.setChecked(true);
                break;
            case 3:
                view_range.semiToneRoundingModeSetting_both.setChecked(true);
                break;
        }
        let trackDisableThreshold = 0.5; //不会保存
        view_range.trackDisableThresholdValueText.setText((trackDisableThreshold * 100).toFixed(2) + "%");
        view_range.trackDisableThresholdSeekbar.setProgress(numberMap(trackDisableThreshold * 100, 1, 99));
        let majorPitchOffset = configuration.readFileConfigForTarget("majorPitchOffset", rawFileName, gameProfile, 0);
        view_range.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
        view_range.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
        let minorPitchOffset = configuration.readFileConfigForTarget("minorPitchOffset", rawFileName, gameProfile, 0);
        view_range.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(minorPitchOffset)})`);
        view_range.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);

        view_range.semiToneRoundingModeSetting.setOnCheckedChangeListener(function (group, checkedId) {
            anythingChanged = true;
            let semiToneRoundingMode = 0;
            switch (checkedId) {
                case view_range.semiToneRoundingModeSetting_roundDown.getId():
                    semiToneRoundingMode = 0;
                    break;
                case view_range.semiToneRoundingModeSetting_roundUp.getId():
                    semiToneRoundingMode = 1;
                    break;
                case view_range.semiToneRoundingModeSetting_drop.getId():
                    semiToneRoundingMode = 2;
                    break;
                case view_range.semiToneRoundingModeSetting_both.getId():
                    semiToneRoundingMode = 3;
                    break;
            }
            configuration.setFileConfig("semiToneRoundingMode", semiToneRoundingMode, rawFileName);
        });
        view_range.trackDisableThresholdSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = numberRevMap(progress, 1, 99);
                view_range.trackDisableThresholdValueText.setText(value.toFixed(2) + "%");
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = numberRevMap(seekbar.getProgress(), 1, 99);
                trackDisableThreshold = value;
            }
        });
        view_range.majorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 2;
                view_range.majorPitchOffsetValueText.setText(value.toFixed(0));
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 2;
                configuration.setFileConfigForTarget("majorPitchOffset", value, rawFileName, gameProfile);
            }
        });
        view_range.minorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 4;
                view_range.minorPitchOffsetValueText.setText(`${value.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(value)})`);
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 4;
                configuration.setFileConfigForTarget("minorPitchOffset", value, rawFileName, gameProfile);
            }
        });
        view_range.autoTuneButton.click(function () {
            anythingChanged = true;
            runCallback(ConfigurationCallbacks.runAutoTune, {
                "trackDisableThreshold": trackDisableThreshold
            });
        });
        view_range.selectTracksButton.click(function () {
            anythingChanged = true;
            runCallback(ConfigurationCallbacks.selectTracks, {
            });
        });

        this.fragments.push({
            name: "range",
            view: view_range
        });

        //和弦优化
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_chord = ui.inflate(
                <vertical>
                    <horizontal w="*">
                        <text text="和弦优化:" textColor="red" />
                        <checkbox id="chordLimitCheckbox" />
                    </horizontal>
                    <vertical id="chordLimitSettingContainer">
                        <horizontal w="*">
                            <text text="最多同时按键数量: " />
                            {/* 1-9个, 默认2 */}
                            <text text="default个" id="maxSimultaneousNoteCountValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="maxSimultaneousNoteCountSeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal>
                            {/* 默认向下取整 */}
                            <text text="按键数量限制方法: " layout_gravity="center_vertical" />
                            <radiogroup id="noteCountLimitMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="noteCountLimitMode_delete" text="删除超出的" textSize="12sp" margin="0dp" />
                                <radio id="noteCountLimitMode_split" text="拆分成多组" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                        <horizontal w="*">
                            <text text="拆分成多组时组间间隔: " />
                            {/* 5-500ms, 对数, 默认75ms */}
                            <text text="defaultms" id="noteCountLimitSplitDelayValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="noteCountLimitSplitDelaySeekbar" w="*" max="1000" layout_gravity="center" />
                        <horizontal w="*">
                            <text text="选择方式: " />
                            <radiogroup id="chordSelectMode" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="chordSelectMode_high" text="优先高音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_low" text="优先低音" textSize="12sp" margin="0dp" />
                                <radio id="chordSelectMode_random" text="随机" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                    </vertical>
                </vertical>
            );
            let chordLimitEnabled = configuration.readFileConfig("chordLimitEnabled", rawFileName, false);
            view_chord.chordLimitCheckbox.setChecked(chordLimitEnabled);
            view_chord.chordLimitSettingContainer.setVisibility(chordLimitEnabled ? View.VISIBLE : View.GONE);
            let maxSimultaneousNoteCount = configuration.readFileConfig("maxSimultaneousNoteCount", rawFileName, 2);
            view_chord.maxSimultaneousNoteCountValueText.setText(maxSimultaneousNoteCount.toFixed(0));
            view_chord.maxSimultaneousNoteCountSeekbar.setProgress(numberMap(maxSimultaneousNoteCount, 1, 9));
            let noteCountLimitMode = configuration.readFileConfig("noteCountLimitMode", rawFileName, "split");
            switch (noteCountLimitMode) {
                case "delete":
                    view_chord.noteCountLimitMode_delete.setChecked(true);
                    break;
                case "split":
                    view_chord.noteCountLimitMode_split.setChecked(true);
                    break;
            }
            let noteCountLimitSplitDelay = configuration.readFileConfig("noteCountLimitSplitDelay", rawFileName, 75);
            view_chord.noteCountLimitSplitDelayValueText.setText(noteCountLimitSplitDelay.toFixed(2) + "ms");
            view_chord.noteCountLimitSplitDelaySeekbar.setProgress(numberMapLog(noteCountLimitSplitDelay, 5, 500));
            let chordSelectMode = configuration.readFileConfig("chordSelectMode", rawFileName, "high");
            switch (chordSelectMode) {
                case "high":
                    view_chord.chordSelectMode_high.setChecked(true);
                    break;
                case "low":
                    view_chord.chordSelectMode_low.setChecked(true);
                    break;
                case "random":
                    view_chord.chordSelectMode_random.setChecked(true);
                    break;
            }

            view_chord.chordLimitCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                view_chord.chordLimitSettingContainer.setVisibility(checked ? View.VISIBLE : View.GONE);
                configuration.setFileConfig("chordLimitEnabled", checked, rawFileName);
            });
            view_chord.maxSimultaneousNoteCountSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 1, 9);
                    view_chord.maxSimultaneousNoteCountValueText.setText(value.toFixed(0));
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 1, 9);
                    configuration.setFileConfig("maxSimultaneousNoteCount", value, rawFileName);
                }
            });
            view_chord.noteCountLimitMode.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let noteCountLimitMode = "";
                switch (checkedId) {
                    case view_chord.noteCountLimitMode_delete.getId():
                        noteCountLimitMode = "delete";
                        break;
                    case view_chord.noteCountLimitMode_split.getId():
                        noteCountLimitMode = "split";
                        break;
                }
                configuration.setFileConfig("noteCountLimitMode", noteCountLimitMode, rawFileName);
            });
            view_chord.noteCountLimitSplitDelaySeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMapLog(progress, 5, 500);
                    view_chord.noteCountLimitSplitDelayValueText.setText(value.toFixed(2) + "ms");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMapLog(seekbar.getProgress(), 5, 500);
                    configuration.setFileConfig("noteCountLimitSplitDelay", value, rawFileName);
                }
            });
            view_chord.chordSelectMode.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let chordSelectMode = "";
                switch (checkedId) {
                    case view_chord.chordSelectMode_high.getId():
                        chordSelectMode = "high";
                        break;
                    case view_chord.chordSelectMode_low.getId():
                        chordSelectMode = "low";
                        break;
                    case view_chord.chordSelectMode_random.getId():
                        chordSelectMode = "random";
                        break;
                }
                configuration.setFileConfig("chordSelectMode", chordSelectMode, rawFileName);
            });

            this.fragments.push({
                name: "chord",
                view: view_chord
            });
        } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
            let view_chord = ui.inflate(
                <vertical>
                    <text text="和弦优化:" textColor="red" />
                    <radiogroup id="maxSimultaneousNoteCountSelector" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="maxSimultaneousNoteCountSelector_1" text="1指" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_2" text="2指" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_3" text="3指" textSize="12sp" margin="0dp" />
                        <radio id="maxSimultaneousNoteCountSelector_9" text="不限" textSize="12sp" margin="0dp" checked="true" />
                    </radiogroup>
                </vertical>
            );
            let chordLimitEnabled = configuration.readFileConfig("chordLimitEnabled", rawFileName, false);
            let maxSimultaneousNoteCount = configuration.readFileConfig("maxSimultaneousNoteCount", rawFileName, 9);
            if (chordLimitEnabled) {
                switch (maxSimultaneousNoteCount) {
                    case 1:
                        view_chord.maxSimultaneousNoteCountSelector_1.setChecked(true);
                        break;
                    case 2:
                        view_chord.maxSimultaneousNoteCountSelector_2.setChecked(true);
                        break;
                    case 3:
                        view_chord.maxSimultaneousNoteCountSelector_3.setChecked(true);
                        break;
                    case 9:
                        view_chord.maxSimultaneousNoteCountSelector_9.setChecked(true);
                        break;
                }
            } else {
                view_chord.maxSimultaneousNoteCountSelector_9.setChecked(true);
            }
            view_chord.maxSimultaneousNoteCountSelector.setOnCheckedChangeListener(function (group, checkedId) {
                anythingChanged = true;
                let maxSimultaneousNoteCount = 9;
                switch (checkedId) {
                    case view_chord.maxSimultaneousNoteCountSelector_1.getId():
                        maxSimultaneousNoteCount = 1;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_2.getId():
                        maxSimultaneousNoteCount = 2;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_3.getId():
                        maxSimultaneousNoteCount = 3;
                        break;
                    case view_chord.maxSimultaneousNoteCountSelector_9.getId():
                        configuration.setFileConfig("chordLimitEnabled", false, rawFileName);
                        return;
                        break;
                }
                configuration.setFileConfig("maxSimultaneousNoteCount", maxSimultaneousNoteCount, rawFileName);
                configuration.setFileConfig("chordLimitEnabled", true, rawFileName);
            });

            this.fragments.push({
                name: "chord",
                view: view_chord
            });
        }

        //伪装手弹
        if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
            this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
            let view_humanify = ui.inflate(
                <vertical>
                    <text text="伪装手弹(全局):" textColor="red" />
                    <horizontal w="*">
                        {/* 5~150ms, 线性, 默认0->不使用*/}
                        <text text="音符时间偏差: " />
                        <checkbox id="noteTimeDeviationCheckbox" />
                        <text text="defaultms" id="noteTimeDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="noteTimeDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                    <horizontal w="*">
                        {/* 0~6mm, 线性, 默认1*/}
                        <text text="点击位置偏差: " />
                        <text text="defaultmm" id="clickPositionDeviationValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="clickPositionDeviationSeekbar" w="*" max="1000" layout_gravity="center" />
                </vertical>
            );
            let noteTimeDeviation = configuration.readGlobalConfig("humanifyNoteAbsTimeStdDev", 0);
            view_humanify.noteTimeDeviationCheckbox.setChecked(noteTimeDeviation != 0);
            view_humanify.noteTimeDeviationValueText.setText(noteTimeDeviation.toFixed(2) + "ms");
            view_humanify.noteTimeDeviationSeekbar.setProgress(numberMap(noteTimeDeviation, 5, 150));
            let clickPositionDeviation = configuration.readGlobalConfig("clickPositionDeviationMm", 1);
            view_humanify.clickPositionDeviationValueText.setText(clickPositionDeviation.toFixed(2) + "mm");
            view_humanify.clickPositionDeviationSeekbar.setProgress(numberMap(clickPositionDeviation, 0, 6));

            view_humanify.noteTimeDeviationCheckbox.setOnCheckedChangeListener(function (button, checked) {
                anythingChanged = true;
                let progress = view_humanify.noteTimeDeviationSeekbar.getProgress();
                let value = numberRevMap(progress, 5, 150);
                configuration.setGlobalConfig("humanifyNoteAbsTimeStdDev", checked ? value : 0);
            });
            view_humanify.noteTimeDeviationSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 5, 150);
                    view_humanify.noteTimeDeviationValueText.setText(value.toFixed(2) + "ms");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    if (!view_humanify.noteTimeDeviationCheckbox.isChecked()) return;
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 5, 150);
                    configuration.setGlobalConfig("humanifyNoteAbsTimeStdDev", value);
                }
            });
            view_humanify.clickPositionDeviationSeekbar.setOnSeekBarChangeListener({
                onProgressChanged: function (seekbar, progress, fromUser) {
                    if (progress == undefined) return;
                    let value = numberRevMap(progress, 0, 6);
                    view_humanify.clickPositionDeviationValueText.setText(value.toFixed(2) + "mm");
                    return true;
                },
                onStartTrackingTouch: function (seekbar) { },
                onStopTrackingTouch: function (seekbar) {
                    anythingChanged = true;
                    let value = numberRevMap(seekbar.getProgress(), 0, 6);
                    configuration.setGlobalConfig("clickPositionDeviationMm", value);
                }
            });

            this.fragments.push({
                name: "humanify",
                view: view_humanify
            });
        }

        //跟弹模式配置
        if (this.flags.includes(ConfigurationFlags.WORKMODE_INSTRUCT)) {
            if (this.flags.includes(ConfigurationFlags.LEVEL_ADVANCED) ||
                this.flags.includes(ConfigurationFlags.LEVEL_EXPERT)) {
                let view_instructMode = ui.inflate(
                    <vertical>
                        <text text="跟弹模式配置:" textColor="red" />
                        <horizontal w="*">
                            {/* 30~300%, 对数, 默认100%*/}
                            <text text="图案大小: " />
                            <text text="default%" id="SimpleInstructPlayer_MarkSizeValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                        </horizontal>
                        <seekbar id="SimpleInstructPlayer_MarkSizeSeekbar" w="*" max="1000" layout_gravity="center" />
                        <vertical id="SkyCotlLikeInstructPlayerSettingContainer" visibility="gone">
                            <horizontal>
                                <text text="为每一个音符画出引导线: " />
                                <checkbox id="SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox" />
                            </horizontal>
                            <horizontal>
                                <text text="为下下一个音符画出引导线: " />
                                <checkbox id="SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox" />
                            </horizontal>
                        </vertical>
                        {/*TODO: 取色器(Android居然没有这个组件?)*/}
                    </vertical>
                );
                let selectedPlayerTypes = configuration.readGlobalConfig("playerSelection", ["AutoJsGesturePlayer"]);
                if (selectedPlayerTypes.includes("SkyCotlLikeInstructPlayer")) {
                    view_instructMode.SkyCotlLikeInstructPlayerSettingContainer.setVisibility(View.VISIBLE);
                    let SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys = configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys", false);
                    view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox.setChecked(SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys);
                    let SkyCotlLikeInstructPlayer_DrawLineToNextNextKey = configuration.readGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToNextNextKey", true);
                    view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox.setChecked(SkyCotlLikeInstructPlayer_DrawLineToNextNextKey);
                }

                let SimpleInstructPlayer_MarkSize = configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1);
                view_instructMode.SimpleInstructPlayer_MarkSizeValueText.setText((SimpleInstructPlayer_MarkSize * 100).toFixed(2) + "%");
                view_instructMode.SimpleInstructPlayer_MarkSizeSeekbar.setProgress(numberMapLog(SimpleInstructPlayer_MarkSize, 0.3, 3));

                view_instructMode.SimpleInstructPlayer_MarkSizeSeekbar.setOnSeekBarChangeListener({
                    onProgressChanged: function (seekbar, progress, fromUser) {
                        if (progress == undefined) return;
                        let value = numberRevMapLog(progress, 0.3, 3);
                        view_instructMode.SimpleInstructPlayer_MarkSizeValueText.setText((value * 100).toFixed(2) + "%");
                        return true;
                    },
                    onStartTrackingTouch: function (seekbar) { },
                    onStopTrackingTouch: function (seekbar) {
                        anythingChanged = true;
                        let value = numberRevMapLog(seekbar.getProgress(), 0.3, 3);
                        configuration.setGlobalConfig("SimpleInstructPlayer_MarkSize", value);
                    }
                });

                view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToEachNextKeysCheckbox.setOnCheckedChangeListener(function (button, checked) {
                    anythingChanged = true;
                    configuration.setGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToEachNextKeys", checked);
                });

                view_instructMode.SkyCotlLikeInstructPlayer_DrawLineToNextNextKeyCheckbox.setOnCheckedChangeListener(function (button, checked) {
                    anythingChanged = true;
                    configuration.setGlobalConfig("SkyCotlLikeInstructPlayer_DrawLineToNextNextKey", checked);
                });

                this.fragments.push({
                    name: "instructMode",
                    view: view_instructMode
                });
            } else if (this.flags.includes(ConfigurationFlags.LEVEL_SIMPLE)) {
                let view_instructMode = ui.inflate(
                    <vertical>
                        <text text="跟弹模式配置:" textColor="red" />
                        <horizontal w="*">
                            {/* 30~300%, 对数, 默认100%*/}
                            <text text="图案大小: " />
                            <radiogroup id="SimpleInstructPlayer_MarkSizeSelector" orientation="horizontal" padding="0dp" margin="0dp" layout_height="wrap_content">
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_65" text="小" textSize="12sp" margin="0dp" />
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_100" text="中" textSize="12sp" margin="0dp" checked="true" />
                                <radio id="SimpleInstructPlayer_MarkSizeSelector_150" text="大" textSize="12sp" margin="0dp" />
                            </radiogroup>
                        </horizontal>
                    </vertical>
                );
                let SimpleInstructPlayer_MarkSize = configuration.readGlobalConfig("SimpleInstructPlayer_MarkSize", 1);
                if (floatEqual(SimpleInstructPlayer_MarkSize, 0.65)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_65.setChecked(true);
                } else if (floatEqual(SimpleInstructPlayer_MarkSize, 1)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_100.setChecked(true);
                } else if (floatEqual(SimpleInstructPlayer_MarkSize, 1.5)) {
                    view_instructMode.SimpleInstructPlayer_MarkSizeSelector_150.setChecked(true);
                }

                view_instructMode.SimpleInstructPlayer_MarkSizeSelector.setOnCheckedChangeListener(function (group, checkedId) {
                    anythingChanged = true;
                    let SimpleInstructPlayer_MarkSize = 1;
                    switch (checkedId) {
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_65.getId():
                            SimpleInstructPlayer_MarkSize = 0.65;
                            break;
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_100.getId():
                            SimpleInstructPlayer_MarkSize = 1;
                            break;
                        case view_instructMode.SimpleInstructPlayer_MarkSizeSelector_150.getId():
                            SimpleInstructPlayer_MarkSize = 1.5;
                            break;
                    }
                    configuration.setGlobalConfig("SimpleInstructPlayer_MarkSize", SimpleInstructPlayer_MarkSize);
                });

                this.fragments.push({
                    name: "instructMode",
                    view: view_instructMode
                });
            }
        }

        //跳过空白
        let view_skipBlank = ui.inflate(
            <vertical>
                <text text="跳过空白:" textColor="red" />
                <horizontal w="*">
                    <text text="跳过前奏空白: " />
                    <checkbox id="skipInitEnabledCheckbox" />
                </horizontal>
                <horizontal w="*">
                    <text text="跳过中间空白: " />
                    <checkbox id="skipBlank5sEnabledCheckbox" />
                </horizontal>
            </vertical>
        );
        let skipInitEnabled = configuration.readGlobalConfig("skipInit", false);
        view_skipBlank.skipInitEnabledCheckbox.setChecked(skipInitEnabled ? true : false); //不知道为什么这里可能会返回number
        let skipBlank5sEnabled = configuration.readGlobalConfig("skipBlank5s", false);
        view_skipBlank.skipBlank5sEnabledCheckbox.setChecked(skipBlank5sEnabled ? true : false);

        view_skipBlank.skipInitEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("skipInit", checked);
        });

        view_skipBlank.skipBlank5sEnabledCheckbox.setOnCheckedChangeListener(function (button, checked) {
            anythingChanged = true;
            configuration.setGlobalConfig("skipBlank5s", checked);
        });

        this.fragments.push({
            name: "skipBlank",
            view: view_skipBlank
        });

    } else if (this.flags.includes(ConfigurationFlags.WORKMODE_MIDI_INPUT_STREAMING)) {

        let view_range = ui.inflate(
            <vertical>
                <text text="音域优化:" textColor="red" />
                {/* <horizontal id="semiToneRoundingModeSettingContainer">
                    <text text="半音取整方法:" layout_gravity="center_vertical" />
                    <radiogroup id="semiToneRoundingModeSetting" orientation="vertical" padding="0dp" margin="0dp" layout_height="wrap_content">
                        <radio id="semiToneRoundingModeSetting_roundDown" text="向下取整" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_roundUp" text="向上取整" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_drop" text="丢弃半音" textSize="12sp" margin="0dp" />
                        <radio id="semiToneRoundingModeSetting_both" text="同时上下取整" textSize="12sp" margin="0dp" />
                    </radiogroup>
                </horizontal> */}
                <horizontal>
                    <text text="升/降八度:" />
                    <text text="default" id="majorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                </horizontal>
                <seekbar id="majorPitchOffsetSeekbar" w="*" max="4" layout_gravity="center" />
                <vertical id="minorPitchOffsetSettingContainer">
                    <horizontal>
                        <text text="升/降半音(移调):" />
                        <text text="default" id="minorPitchOffsetValueText" gravity="right|center_vertical" layout_gravity="right|center_vertical" layout_weight="1" />
                    </horizontal>
                    <seekbar id="minorPitchOffsetSeekbar" w="*" max="11" layout_gravity="center" />
                </vertical>
            </vertical>
        );

        //TODO: 流处理的半音取整方法
        // let semiToneRoundingMode = configuration.readGlobalConfig("MIDIInputStreaming_semiToneRoundingMode", 0);
        // switch (semiToneRoundingMode) {
        //     case 0:
        //         view_range.semiToneRoundingModeSetting_roundDown.setChecked(true);
        //         break;
        //     case 1:
        //         view_range.semiToneRoundingModeSetting_roundUp.setChecked(true);
        //         break;
        //     case 2:
        //         view_range.semiToneRoundingModeSetting_drop.setChecked(true);
        //         break;
        //     case 3:
        //         view_range.semiToneRoundingModeSetting_both.setChecked(true);
        //         break;
        // }
        let majorPitchOffset = configuration.readGlobalConfig("MIDIInputStreaming_majorPitchOffset", 0);
        view_range.majorPitchOffsetValueText.setText(majorPitchOffset.toFixed(0));
        view_range.majorPitchOffsetSeekbar.setProgress(majorPitchOffset + 2);
        let minorPitchOffset = configuration.readGlobalConfig("MIDIInputStreaming_minorPitchOffset", 0);
        view_range.minorPitchOffsetValueText.setText(`${minorPitchOffset.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(minorPitchOffset)})`);
        view_range.minorPitchOffsetSeekbar.setProgress(minorPitchOffset + 4);

        // view_range.semiToneRoundingModeSetting.setOnCheckedChangeListener(function (group, checkedId) {
        //     anythingChanged = true;
        //     let semiToneRoundingMode = 0;
        //     switch (checkedId) {
        //         case view_range.semiToneRoundingModeSetting_roundDown.getId():
        //             semiToneRoundingMode = 0;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_roundUp.getId():
        //             semiToneRoundingMode = 1;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_drop.getId():
        //             semiToneRoundingMode = 2;
        //             break;
        //         case view_range.semiToneRoundingModeSetting_both.getId():
        //             semiToneRoundingMode = 3;
        //             break;
        //     }
        //     configuration.setGlobalConfig("MIDIInputStreaming_semiToneRoundingMode", semiToneRoundingMode);
        // });
        view_range.majorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 2;
                view_range.majorPitchOffsetValueText.setText(value.toFixed(0));
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 2;
                configuration.setGlobalConfig("MIDIInputStreaming_majorPitchOffset", value);
            }
        });
        view_range.minorPitchOffsetSeekbar.setOnSeekBarChangeListener({
            onProgressChanged: function (seekbar, progress, fromUser) {
                if (progress == undefined) return;
                let value = progress - 4;
                view_range.minorPitchOffsetValueText.setText(`${value.toFixed(0)} (${midiPitch.getTranspositionEstimatedKey(value)})`);
                return true;
            },
            onStartTrackingTouch: function (seekbar) { },
            onStopTrackingTouch: function (seekbar) {
                anythingChanged = true;
                let value = seekbar.getProgress() - 4;
                configuration.setGlobalConfig("MIDIInputStreaming_minorPitchOffset", value);
            }
        });


        this.fragments.push({
            name: "range",
            view: view_range
        });
    }


    /**
     * @brief 获取配置界面的View
     * @returns {View}
     */
    this.getView = function () {
        let frame = ui.inflate(
            <ScrollView margin="0dp" padding="0dp">
                <vertical id="body" margin="0dp" padding="0dp">
                </vertical>
            </ScrollView>
        );
        for (let fragment of this.fragments) {
            let cardId = 'card_' + fragment.name;
            let card = ui.inflate(
                <card cardElevation="5dp" cardCornerRadius="2dp" margin="2dp" contentPadding="2dp">
                </card>
                , frame.body);
            card.addView(fragment.view);
            // card.setId(cardId);
            frame.body.addView(card);
        }
        return frame;
    }

    /**
     * @brief 是否有任何配置被修改
     */
    this.isAnythingChanged = function () {
        return anythingChanged;
    }
}

module.exports = {
    ConfigurationUi,
    ConfigurationFlags
}