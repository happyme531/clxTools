console.log("渐变字体会占用很多输入空间，请注意这一点");

//所有可用的单个彩字代码
var letterset = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "R", "W", "X", "Y"]; //S暂时不能用
//彩虹模式下的彩字代码(7种颜色)
var rainbowLetterSet=["O","F","D","Y","B","I","P"];
var mode = dialogs.singleChoice("转换类型？", ["随机彩字", "渐变彩字", "彩虹字体(模式1)","彩虹字体(模式2)"]);

var input = dialogs.rawInput("请输入需转换原文");
var now, i = 0,
    output = "";
var imax = input.length;
//检测输入
if (imax == 0) {
    toast("输入不能为空！");
    exit()
};

//渐变
if (mode == 1) {
    var defaultcol = dialogs.rawInput("输入初始颜色(16进制，例如FF0000)")
    //颜色16进制转10进制
    var r, g, b;
    r = parseInt(defaultcol.substring(0, 2), 16);
    g = parseInt(defaultcol.substring(2, 4), 16);
    b = parseInt(defaultcol.substring(4, 6), 16);
    //计算差量
    var dr, dg, db;
    dr = Math.floor((255 - r) / (input.length));
    dg = Math.floor((255 - g) / (input.length));
    db = Math.floor((255 - b) / (input.length));


    var curcol;

    for (i; i < imax; i++) {
        var now = input.substring(i, i + 1);
        //每个字符的颜色，10进制转16
        r += dr;
        g += dg;
        b += db;
        curcol = r.toString(16) + g.toString(16) + b.toString(16);
        output = output + "#c" + curcol + now;
    };
} else if (mode == 0) {
    for (i; i < imax; i++) {
        var now = input.substring(i, i + 1);
        output = output + "#" + letterset[random(0, letterset.length - 1)] + now;
    };
}else if (mode==2){
    for (i; i < imax; i++) {
        var now = input.substring(i, i + 1);
        output = output + "#" + rainbowLetterSet[i%(rainbowLetterSet.length)] + now;
    };

};


var reg = /NaN|nul/;
if (reg.test(output) == 1) {
    toast("转换失败，请检查你的输入！");
    exit();
} else {
    toast("转换成功,已复制到剪贴板");
    setClip(output);
}
exit();
