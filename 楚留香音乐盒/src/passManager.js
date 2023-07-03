//@ts-check
// passManager.js 

const Passes = require("./passes.js");

function PassManager() {
    this.passConfigs = [];
    const passes = new Passes();

    this.addPass = function (name, config, progressCallback, finishCallback) {
        let pass = passes.getPassByName(name);
        if (pass == null) {
            throw new Error("不存在的pass: " + name);
        }
        if (progressCallback == null) {
            progressCallback = function (progress) { };
        }
        if (finishCallback == null) {
            finishCallback = function (result, statistics, timeElapsed) { };
        }
        this.passConfigs.push({
            class: pass,
            config: config,
            progressCallback: progressCallback,
            finishCallback: finishCallback
        });
        return this;
    }

    this.run = function (input) {
        let output = input;
        for (let passConfig of this.passConfigs) {
            let pass = new passConfig.class(passConfig.config);
            let startTime = new Date().getTime();
            output = pass.run(output, passConfig.progressCallback);
            let endTime = new Date().getTime();
            passConfig.finishCallback(output, pass.getStatistics(), endTime - startTime);
        }
        return output;
    }

    this.reset = function () {
        this.passConfigs = [];
    }

    this.hashCode = function () {
        let hashCode = 0;
        for (let passConfig of this.passConfigs) {
            hashCode += stringHashCode(passConfig.class.name);
            hashCode += stringHashCode(JSON.stringify(passConfig.config));
            hashCode = hashCode % 2147483647;
        }
        return hashCode;
    }

    function stringHashCode(str) {
        let hash = 0;
        if (str.length == 0) return hash;
        for (let i = 0; i < str.length; i++) {
            let char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
}

module.exports = PassManager;