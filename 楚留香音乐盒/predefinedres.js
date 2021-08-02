//predefinedres.js -- 预设分辨率

function preDefinedRes() {
    /*
     * 获取内置的按键位置
        screenHeight:屏幕高度(像素)
        screenWidth:屏幕宽度(像素)
        gameType:游戏类型, 可以为"楚留香","天涯明月刀","原神","摩尔庄园", 
     */
    this.getKeyPosition = function (screenHeight, screenWidth, gameType) {
        let clickx_pos;
        let clicky_pos;
        let longclick_pos;

        switch (gameType) {
            case "楚留香":
                if (screenWidth == 1080 && screenHeight == 1920) {
                    //1920x1080分辨率的参数(现在的大多数手机)
                    clickx_pos = [340, 580, 819, 1055, 1291, 1531, 1768];
                    clicky_pos = [956, 816, 680];
                    longclick_pos = [78, 367];
                } else if (screenWidth == 1440 && screenHeight == 3120) {
                    //3120x1440分辨率的参数(我的lg g7,2k屏)
                    clickx_pos = [781, 1099, 1418, 1735, 2051, 2369, 2686];
                    clicky_pos = [1271, 1089, 905];
                    longclick_pos = [400, 525]; //x,y
                } else if (screenWidth == 1080 && screenHeight == 2160) {
                    //2160x1080带鱼屏的分辨率
                    clickx_pos = [460, 697, 940, 1176, 1414, 1652, 1862];
                    clicky_pos = [955, 818, 679];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 1080 && screenHeight == 2340) {
                    //eg.红米k20 pro
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 1080 && screenHeight == 2240) {
                    //
                    clickx_pos = [502, 738, 982, 1215, 1436, 1693, 1931];
                    clicky_pos = [955, 818, 680];
                    longclick_pos = [204, 359];
                } else if (screenWidth == 720 && screenHeight == 1520) {
                    //1520x720(很奇怪啊)
                    clickx_pos = [348, 506, 665, 824, 982, 1141, 1300];
                    clicky_pos = [637, 547, 454];
                    longclick_pos = [175, 240];
                } else if (screenWidth == 1080 && screenHeight == 2248) {
                    //2188x1080(也很奇怪)
                    clickx_pos = [507, 746, 983, 1220, 1458, 1696, 1934];
                    clicky_pos = [956, 818, 681];
                    longclick_pos = [388, 420];
                } else if (screenWidth == 1176 && screenHeight == 2400) {
                    clickx_pos = [553, 801, 1055, 1300, 1551, 1800, 2052];
                    clicky_pos = [997, 857, 715];
                    longclick_pos = [455, 442];
                } else {
                    throw new Error("不支持的分辨率");
                }
                break;
            case "天涯明月刀":
                if (device.width == 1440 && device.height == 3120) {
                    //3120x1440分辨率的参数(我的lg g7,2k屏)
                    clickx_pos = [574, 928, 1290, 1655, 2018, 2376, 2743];
                    clicky_pos = [1322, 1169, 1024];
                } else if (device.width == 1080 && device.height == 2310) {
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                } else if (device.width == 1080 && device.height == 2376) {
                    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    clicky_pos = [955, 818, 680];
                    //奇怪的问题出现了---2340x1080分辨率似乎有两种不同的坐标？
                    //如果第一组坐标不适合你，你需要把后1~3行代码开头加两个斜杠(//),并去掉后4~6行开头的两个斜杠
                } else if (device.width == 1080 && device.height == 2340) {
                    toast("如果不能正常弹奏，请打开脚本查看260行附近");
                    clickx_pos = [421, 696, 968, 1243, 1512, 1787, 2055];
                    clicky_pos = [990, 879, 766];
                    //} else if (device.width == 1080 && device.height == 2340) {
                    //    clickx_pos = [550, 790, 1027, 1266, 1505, 1744, 1980];
                    //    clicky_pos = [955, 818, 680];
                } else if (device.width == 1080 && device.height == 2280) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2244) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2230) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2160) {
                    clickx_pos = [396, 666, 938, 1216, 1484, 1756, 2025];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 2400) {
                    clickx_pos = [443, 727, 1004, 1274, 1546, 1815, 2088];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 1080 && device.height == 1920) {
                    clickx_pos = [215, 488, 757, 1031, 1300, 1573, 1847];
                    clicky_pos = [987, 876, 766];
                } else if (device.width == 720 && device.height == 1465) {
                    clickx_pos = [252, 426, 602, 775, 950, 1125, 1301];
                    clicky_pos = [510, 584, 661];
                } else {
                    throw new Error("不支持的分辨率");
                }
                break;
            case "原神":
                throw new Error("不支持的分辨率");
                break;
            case "摩尔庄园":
                throw new Error("不支持的分辨率");
                break;
            default:
                throw new Error("错误的游戏类型");
                break;
        }
        return {
            clickx_pos: clickx_pos,
            clicky_pos: clicky_pos,
            longclick_pos: longclick_pos
        }
    }
}

module.exports = preDefinedRes;