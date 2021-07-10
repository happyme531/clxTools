//点击输入文字的输入框所在的位置
const inputBoxPos = [1526, 1051];
//确认按钮所在位置
const confirmBtnPos = [1984,1051];

//所有的密令
const allKeys = [
    //2021.7.9 入梦来新增
    "江湖夜雨十年灯",
    "岁岁常相见",
    "只缘感君一回顾",
    "寄我江南春色一枝梅",
    "一寸相思一寸灰",
    "聒碎乡心梦不成",
    "相思似海深",
    //上一次
    "一春幽梦逐游丝",
    "醉梦醺醺晓未苏",
    "故山空复梦松楸",
    "残霄犹得梦依稀",
    "昨夜闲潭梦落花",
    "梦里云归何处寻",
    "夜深忽梦少年事",
    "忽复乘舟梦日边",
    "一梦江湖费五年",
    //以下是旧的密令
    "青山面目想依依",
    "剑阁再题词",
    "半夜清香入梦来",
    "晓穿细仗又逢君",
    "水石风林入梦思",
    "东风柳色花香",
    "掌上山川初入梦",
    "一夜梦千回",
    "尝闻彷佛入梦寐", //注意这不是仿佛
    "梅花入梦来",
    "濯锦江头频入梦",
    "吟笔自欲图丹青",
    "刀州重入梦",
    "壶中日月尚经年",
    //来自其它人
    "醉后西园入梦",
    "夜半醉香入梦来",
    "秋钓清滩方入梦",
    "桃花水面送归船",
    "佳节又重阳",
    //可能是新增的
    "昨夜因何入梦来",
    "满园花菊郁金黄"
];


function tryKey(key) {
    click(inputBoxPos[0], inputBoxPos[1]);
    if (!className("android.widget.EditText").findOne(300)) {
        //没有找到，说明密令已经解锁
        return 1;
    };
    className("android.widget.EditText").findOnce().setText(key );
    className("android.widget.Button").text("确定").findOne().click();
    sleep(600);
    click(confirmBtnPos[0],confirmBtnPos[1]);
    sleep(20);
return 0;


};

for (var i = 0; i < allKeys.length; i++) {
    if (tryKey(allKeys[i])) {
        toastLog("破解成功");  //脚本速度太快，
        exit();
    };
};