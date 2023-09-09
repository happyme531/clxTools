//humanify.js --- 为乐曲加入扰动, 让它听起来更像人弹的

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

function Humanify() {
    this.stddev = 200; 
    /**
     * @param {number} stddev 标准差
     * @brief 设置标准差
     */
    this.setNoteAbsTimeStdDev = function (stddev) {
        this.stddev = stddev;
    }

    /**
     * @param {import("./noteUtils.js").NoteLike[]} notes 乐曲数组
     * @brief 为乐曲加入扰动, 让它听起来更像是人弹的. 处理速度应该很快
     * @return {import("./noteUtils.js").NoteLike[]} 扰动后的乐曲数组
     */
    this.humanify = function(notes){
        var randomizer = new NormalDistributionRandomizer(0, this.stddev);
        for (var i = 0; i < notes.length; i++) {
            notes[i][1] += randomizer.next();
            if(notes[i][1] < 0) notes[i][1] = 0;
        }
        //重新排序
        notes.sort(function (a, b) {
            return a[1] - b[1];
        });
        return notes;
    }
}

module.exports = Humanify;