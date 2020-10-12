var AI = {};
new function() {
    AI.Pattern = pattern;
    // 定义了 8 个偏移量
    // 可以简单通过加法得到任一点周围 8 个点的坐标
    // -11 -10 -9
    //  -1  x  1
    //  9   10 11
    // 如左上角的坐标为 x + (-11)
    var directions = [-11, -10, -9, -1, 1, 9, 10, 11];

    function pattern() {
        // 把整个棋盘填满 0
        for (var i = 0; i < 100; i++) this[i] = 0;
        // 中间的 4 个格子，先放上两黑两白的棋子
        this[54] = this[45] = 1;
        this[55] = this[44] = 2;
        // 黑净胜外围子数目（黑减去白），估值时用。 
        this.divergence = 0;
        // 当前可走棋方为黑棋
        this.color = 1;
        // 已经走了几步棋
        this.moves = 0;
        // 稳定原型
        // 0 是空白，1 是黑棋，2 是白棋，3 是边界
        // 把 8 * 8 的棋盘扩展成 10 * 10，是一种技巧
        // 可以简化坐标有效性的判断
        var stableProto = [
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3
        ]
        // 从一个 8 * 8 的棋盘载入状态
        this.load = function(arr) {
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    this[y * 10 + x] = arr[y - 1][x - 1];
                }
            }
        }
        // 判断能不能 pass
        // 如果能，则当前可走棋方变更
        this.pass = function() {
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    if (this[y * 10 + x] == 0) {
                        // 有任何一步棋可走，都不可以 Pass
                        if (this.move(x, y, this.color)) {
                            return false;
                        }
                    }
                }
            }
            //alert("pass");
            // 这是一个技巧，因为 this.color 的值域是 {1, 2}
            // 所以当 color 是 1 时，执行完下一语句后就是 2
            // 当 color 是 2 时，执行完下一语句后就是 1
            this.color = 3 - this.color;
            return true;
        }
        this.clone = function() {
            function pattern() {}
            pattern.prototype = this;
            return new pattern();
        }
        this.toString = function() {
            var icon = [" ", "*", "o"]
            var r = "";
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    r += icon[this[y * 10 + x]] + " ";
                    //r+=stableDiscs[y*10+x]+" ";
                }
                r += "/n";
            }
            return r + this.exact();
        }

        // 净胜子数
        this.exact = function() {
            // 这里是一个技巧， r[0] 是不使用的，r[1] r[2] 对应黑白棋子的个数
            var r = [0, 0, 0];
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    r[this[y * 10 + x]]++; // 数目加一
                }
            }
            // 当前颜色的数量为 0，输了，返回负极值
            if (r[this.color] == 0) return -64;
            // 敌对颜色的数量为 0，赢了，返回极值
            if (r[3 - this.color] == 0) return 64;
            // 返回当前走棋方比对方多的数量
            return r[this.color] - r[3 - this.color];
        }
        // 对棋盘的估值
        this.calculate = function() {
            // 基本估值方法：
            // 1、能占棋盘四角是很有价值的
            // 2、邻近棋盘四角的位子是很差的
            // 3、稳定子
            // 4、外围子净胜数
            var r = [0, 0, 0];
            var r = this.divergence;
            // 如果左上角有棋子，自己的，就+30分，敌方的，-30 分	
            if (this[11]) r += ((this[11] == this.color) ? 1 : -1) * 30;
            // 次左上角，分值是 -15
            else if (this[22] == this.color) r -= 15;
            // 右上角，分值 30
            if (this[18]) r += ((this[18] == this.color) ? 1 : -1) * 30;
            // 次右上角，分值 -15
            else if (this[27] == this.color) r -= 15;
            // 左下角，分值 30
            if (this[81]) r += ((this[81] == this.color) ? 1 : -1) * 30;
            // 次左下角，分值 -15
            else if (this[72] == this.color) r -= 15;
            // 右下角，分值 30
            if (this[88]) {
                r += ((this[88] == this.color) ? 1 : -1) * 30;
            }
            // 次右下角，分值 -15
            else if (this[77] == this.color) r -= 15;
            // 查找稳定子，
            // 稳定子就是挨着 4 个角点并且周边的棋子要么是同色，要么是边界
            //var color = this.color;
            var stableDiscs = stableProto.slice();

            var queue = [];
            if (this[11] != 0) queue.push([11, this[11]]);
            if (this[18] != 0) queue.push([18, this[18]]);
            if (this[81] != 0) queue.push([81, this[81]]);
            if (this[88] != 0) queue.push([88, this[88]]);
            while (queue.length) {
                var position = queue[0][0];
                var c = queue[0][1];
                // 不懂 JS 的数组的内存管理算法，不过感觉从头上删除肯定是比较慢的，
                // 我感觉从后面删除会更好，或者使用标记不删除的方法性能会更好
                queue.shift();
                //if(stableDiscs[position]==0 || stableDiscs[position]==3) continue;
                stableDiscs[position] = c;
                if ((stableDiscs[position - 10] == 3 || stableDiscs[position + 10] == 3 || stableDiscs[position - 10] == c || stableDiscs[position + 10] == c) &&
                    (stableDiscs[position - 1] == 3 || stableDiscs[position + 1] == 3 || stableDiscs[position - 1] == c || stableDiscs[position + 1] == c) &&
                    (stableDiscs[position - 11] == 3 || stableDiscs[position + 11] == 3 || stableDiscs[position - 11] == c || stableDiscs[position + 11] == c) &&
                    (stableDiscs[position - 9] == 3 || stableDiscs[position + 9] == 3 || stableDiscs[position - 9] == c || stableDiscs[position + 9] == c)) {
                    stableDiscs[position] = c;
                    // 稳定子的分值为 7
                    r += ((c == this.color) ? 1 : -1) * 7;
                    // 进一步扩展，查找稳定子
                    for (var i = 0; i < directions.length; i++)
                        if (stableDiscs[directions[i] + position] == 0 && this[directions[i] + position] == c)
                            queue.push([directions[i] + position, c]);
                }
            }

            // 返回估值
            return r;
        }
        this.toLocalString = function(depth) {
            var r = "";
            if (!depth) depth = 0;

            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    if (this[y * 10 + x] != 0) r += (this[y * 10 + x] == 1 ? "*" : "o") + " ";
                    else {
                        var tmp = this.move(x, y, this.color);
                        if (tmp) {
                            var tmp2 = -tmp.search(-Infinity, Infinity, depth);
                            if (tmp2 < 0 || tmp2 > 9) r += tmp2;
                            else r += " " + tmp2;
                        } else r += "X ";
                    }
                }
                r += "/n";
            }
            return r + this.exact();
        }
        // 计算机去找一步可走的棋步
        // 这里 AI 部分的入口
        this.computer = function(depth, exactDepth) {
            if (!depth) depth = 0;
            if (!exactDepth) exactDepth = depth;
            var r = [];
            var max = -Infinity;
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    if (this[y * 10 + x]) continue;
                    // 找到一个空白格子
                    else {
                        // 尝试走这个格子
                        var tmp = this.move(x, y, this.color);
                        // 不成功，非法
                        if (!tmp) continue;
                        // 已走步数+已搜索深度 >= 有 60 步
                        // 这时使用精确搜索得到更精确的结果
                        if (this.moves + exactDepth >= 60) {
                            var v = -tmp.exactSearch(-Infinity, Infinity);
                            //alert([x,y]+":"+v);
                        }
                        // 离四个角最近的那 3 * 4 个格子，则多搜索一层
                        // 因为对手可能在下一手下在角上，会出现大翻盘。
                        else if ((x == 2 || x == 7) && (y == 2 || y == 7))
                            var v = -tmp.search(-Infinity, Infinity, depth + 1);
                        else
                            var v = -tmp.search(-Infinity, Infinity, depth);
                        // 还不如之前的棋步
                        if (v < max) continue;
                        // 比之前的棋步好
                        if (v > max) {
                            // 保存起来
                            r = [
                                [x, y]
                            ];
                            max = v;
                        }
                        // 另一个可选的棋步
                        else r.push([x, y]);
                    }
                }
            }
            // 在所有可选的棋步中，随机选择一个，让玩家觉得比较多变化，不那么单调。
            var tmp = Math.floor(Math.random() * r.length);
            return r[tmp];
        }
        // 搜索算法
        // 使用负极大值形式的 Alpha-Beta 剪枝搜索算法
        this.search = function(alpha, beta, depth, pass) {
            // 叶子节点，返回估值
            if (depth == 0) return this.calculate();
            var canmove = false;
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    if (this[y * 10 + x] != 0) r += (this[y * 10 + x] == 1 ? "*" : "o") + " ";
                    else {
                        var tmp = this.move(x, y, this.color);
                        if (!tmp) continue;
                        canmove = true;
                        // 往更深搜索
                        var r = -tmp.search(-beta, -alpha, depth - 1);
                        //if(depth==4)WScript.echo(r);
                        // 收窗窗口
                        if (r >= alpha) alpha = r;
                        // 胜着
                        if (alpha > beta) return Infinity;
                    }
                }
            }
            // 返回当前局面的最佳着法估值
            if (canmove) return alpha;
            // 双方都没有可下子之处，返回净胜子数
            if (pass) return this.exact();
            // pass 一次，往深搜索
            this.color = 3 - this.color;
            return -this.search(-beta, -alpha, depth - 1, true);
        }
        // 精确搜索，这段的算法原理跟 search 是一样的
        this.exactSearch = function(alpha, beta, pass) {
            // 已经走了 60 步了，返回净胜子数
            if (this.moves == 60) return this.exact();
            var canmove = false;
            for (var y = 1; y <= 8; y++) {
                for (var x = 1; x <= 8; x++) {
                    if (this[y * 10 + x] != 0); //r+=(this[y*10+x]==1?"*":"o")+" ";
                    else {
                        var tmp = this.move(x, y, this.color);
                        if (!tmp) continue;
                        canmove = true;
                        var r = -tmp.exactSearch(-beta, -alpha);
                        if (r >= alpha) alpha = r;
                        if (alpha > beta) return Infinity;
                    }
                }
            }
            if (canmove) return alpha;
            if (pass) return this.exact();
            this.color = 3 - this.color;
            return -this.exactSearch(-beta, -alpha, true);
        }
        // 尝试在 x, y 放下 this.color 颜色的棋子，成功返回下一棋盘状态，否则返回 null
        this.move = function(x, y) {
            // 复制当前状态
            var pattern = this.clone();
            pattern.color = 3 - this.color;
            // 注意这个负号
            pattern.divergence = -pattern.divergence;
            // move 数++
            pattern.moves++;
            var canmove;
            canmove = false;
            // 放在函数入口处，可以优化性能
            // 把 10*y+x 放入临时变量可优化性能
            if (pattern[10 * y + x] != 0) return null;
            // 8 方向判断
            for (var i = 0; i < 8; i++) {
                // 转换为一维索引
                var p = 10 * y + x + directions[i];
                // 邻近的格子上棋子不同色
                if (pattern[p] == 3 - this.color)
                    while (pattern[p] != 0) {
                        // 往同方向搜索
                        p += directions[i];
                        // 另一端还有一个自己的棋子，则是一个可走的点。
                        if (pattern[p] == this.color) {
                            canmove = true;
                            // 把中间的棋子翻过来
                            while ((p += -directions[i]) != 10 * y + x) {
                                pattern[p] = this.color;
                                //alert(p);
                                for (var d = 0; d < 8; d++) {
                                    // 非空
                                    if (!pattern[p + directions[d]]
                                        // 非边界
                                        &&
                                        p + directions[d] > 10 &&
                                        p + directions[d] < 89 &&
                                        (p + directions[d]) % 10 != 0 &&
                                        (p + directions[d]) != 9)
                                        // 外围净胜子数增加
                                        pattern.divergence++;
                                }
                            }
                            break;
                        }
                    }
            }
            // 返回新的棋盘状态
            if (canmove) {
                pattern[10 * y + x] = this.color;
                return pattern;
            } else return null;
        }
    }
    //pattern.prototype = emptyboard;
    //WScript.echo(new pattern().move(5,6).move(6,4).move(4,3).move(3,4).toLocalString(3));
    //WScript.echo(new pattern().move(5,6).search(-Infinity,Infinity,2));
}()

/*
*@brief 检测一个点周围多个颜色是否都符合要求
*@param img 图片对象,centerX/Y 中心点坐标
*@param gridSize 需要检测的点成一个方形网格，这个方形每条边上的点数,gridWidth 每条边上相邻两点距离
*@param targetColor 目标颜色, threshold 最多可容忍的差异
*/
function checkAreaColorSimilar(img, centerX, centerY, gridSize, gridWidth, targetColor, threshold) {
    let matchSuccess = true;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
             let col = img.pixel(centerX - ((gridSize - 1) / 2) * gridWidth + i * gridWidth,centerY - ((gridSize - 1) / 2) * gridWidth + j * gridWidth);
            if (!colors.isSimilar(col, targetColor, threshold, "rgb+")) matchSuccess = false;
           //console.log("color at %d,%d is %d,match %d",centerX - ((gridSize - 1) / 2) * gridWidth + i * gridWidth,centerY - ((gridSize - 1) / 2) * gridWidth + j * gridWidth,col,matchSuccess);
        };
    };
    return matchSuccess;
};


function gameUtil() {
    const startPos = [1714, 261];//左上角格子的中心
    //const startPos = [1756, 277];
    const gap = 156; //两个棋子中心的距离
    this.gameMode=0; //游戏模式:0为玩家对战，1为灵犀对战
    this.readBoard = function() {
        let arr =  new Array();                
        for (var  i = 0; i < 8; i++) {                    
            arr[i] = new  Array(0);              
            for (var  j = 0; j < 8; j++) {                
                arr[i][j] = 0;       
            };
        };

        let img = images.captureScreen();
        let col = img.pixel(2762, 88); //检测玩家棋子的颜色
        let playerCol = 0; //黑色
        if (colors.isSimilar(col, "#ffffff", 1, "diff")) { 
            playerCol = 1

        };
        
        for (var i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                col = img.pixel(startPos[0] + j * gap, startPos[1] + i * gap);
                if (checkAreaColorSimilar(img,startPos[0] + j * gap,startPos[1] + i * gap,3,9,"#333438",9)){  //匹配黑色,如果匹配不到请减小第二个5
                    arr[i][j] = playerCol ? 2 : 1;

                }else if(checkAreaColorSimilar(img,startPos[0] + j * gap,startPos[1] + i * gap,3,7,"#d8e0e2",13)) {//匹配白色
                    arr[i][j] = playerCol ? 1 : 2;
                };
            };
        };
        log("棋盘:\n%j",arr);
        return arr;

    };
    this.place = function(x, y) {
        click(startPos[0] + x * gap, startPos[1] + y * gap);
    };
    this.isMyTurn = function() {
        let img = images.captureScreen();
        let col=0;
        if(this.gameMode){
            col=images.pixel(img,2188,186); //(灵犀对战)
        }else{
        col = images.pixel(img, 2158, 186); //"己"下面的一个点,只有己方回合才是白色(玩家对战)
        };
        if (colors.isSimilar(col, "#fffeffff", 4)) {
            return 1;
        };
        return 0;
    };
};

function main() {
    console.show();
    let game = new gameUtil();
    let ai = new AI.Pattern();
    game.gameMode=dialogs.singleChoice("游戏模式",["玩家对战","灵犀对战"]);
   while (1) {
       if (game.isMyTurn()) {
           console.log("读取棋盘..");
            ai.load(game.readBoard());
            console.log("开始计算..");
            let step =game.gameMode? ai.computer(3, 4):ai.computer(2,3);
            console.log("点击位置:"+step);
            game.place(step[0] - 1, step[1] - 1);
        }else{
            console.log("不是我方落子，等待..");
       
            };
       sleep(2000);
    };
};


//sleep(2000);
requestScreenCapture();
main();