<img align="right" width="23%" src="https://github.com/happyme531/clxTools/assets/20812356/1706f681-a66a-44a8-b09f-83362c1df2f8" alt='"Java"Script'>

# clxTools

适用于一些RPG手游，例如《楚留香(一梦江湖)》的自动脚本。 Automatics scripts for some mobile RPGs, such as netease ChuLiuXiang.

脚本文件:[点我下载](https://github.com/happyme531/clxTools/archive/master.zip)  
脚本运行环境: AutoX(Auto.js的一个fork). [进入apk下载](https://github.com/kkevsekk1/AutoX/releases)/[进入项目主页](https://github.com/kkevsekk1/AutoX). (建议使用6.5.9版本)  
注意: 不支持收费版Auto.js  

## 安装说明

1. 下载:
  先下载脚本文件: [脚本文件](https://github.com/happyme531/clxTools/archive/master.zip)  
  如果上面的链接无法访问，也可以点击[镜像地址](https://gh.api.99988866.xyz/https://github.com/happyme531/clxTools/archive/master.zip)下载  
  之后再下载脚本运行环境(AutoX): [进入apk下载](https://github.com/kkevsekk1/AutoX/releases) (建议使用6.5.9版本)

2. 安装:  
     - 点击下载的apk文件，安装AutoX
     - 从手机桌面打开autoX.js软件，授予权限后退出.  
     - 将脚本压缩包(clxTools-master.zip)解压到手机内部存储根目录名叫“脚本”的文件夹中, 例如: 脚本/clxTools-master (/sdcard/脚本/clxTools-master/)
     - 安装完成

3. 运行:
     - 打开AutoX.js, 点击左上角菜单打开侧边栏, 打开"悬浮窗"开关
     - 建议在AutoX.js内进入设置, 打开"音量上键停止所有脚本"开关, 这样可以通过音量上键停止脚本
     - 在游戏中通过悬浮窗即可运行脚本

## 更新说明

按照安装说明中的下载方法下载最新版脚本文件，解压覆盖原有文件即可。绝大多数配置都不会丢失，但是为了安全起见，建议在更新前将原有脚本文件夹重命名为其他名字, 留作备份。

此项目目前处于开发阶段，更新频繁，建议每隔一段时间更新一下脚本文件。

------

## 功能模块说明

### 楚留香刷亲密度

一个功能强大的自动发消息工具，理论上适用于任何手游  

特色功能:  

+ 可调的发送速度  
+ 自定义发送内容  
+ 发送内容中包含时间，当前条数，或者随机一句古诗  
+ 随机发送自定义的文本(custom.txt), 预置：声声慢骚话合集  
+ 发完自动关屏(需要root)  

### 声声慢骚话合集.txt

~~**声声慢的玩家们个个都是人才，说话又好听，我超喜欢他们的！**~~  
声声慢大区里经常有人在世界聊天区发一些让人感觉不把它们复制下来绝对是天大的损失的各种骚话，因此就有了[这个合集！](https://github.com/happyme531/clxTools/blob/master/%E6%A5%9A%E7%95%99%E9%A6%99%E5%88%B7%E4%BA%B2%E5%AF%86%E5%BA%A6/custom.txt)

### 楚留香音乐盒

目前功能最全面的手游自动演奏(弹琴)工具

+ 支持的游戏和配置:  
  - 楚留香(一梦江湖)
  - 天涯明月刀手游
  - 原神(风物之诗琴/老旧的诗琴/晚风圆号)
  - 光遇(3x5/2x4键位)
  - 逆水寒手游(3x7/3x12/1x7键位/专业模式)
  - 蛋仔派对(21/15/36键)
  - 黎明觉醒
  - 奥比岛(22/15键)
  - 哈利波特: 魔法觉醒(专业/普通模式)
  - 第五人格(21/36键)
  - 永劫无间
  - 阴阳师
  - 摩尔庄园(21/36键)
  - 明日之后(21/36/88键)
  - 元梦之星(21/36键)
  - 心动小镇(双排15键/三排15键/22键/37键)
  - 射雕英雄传(22/37键)
  - qq飞车
  - 创造与魔法
  - 妄想山海(21/36键)
  - 星球:重启(88/33键)
  - 荒野行动
  - 我的世界(21/36键)
  - 迷你世界(21/36键)
  - 猫和老鼠
  - 宅时光
  - 剑网3
  - 以闪亮之名
  - 桃源深处有人家(15/21键)
  - 七日世界
  - 其它通过触摸屏幕演奏乐曲，且音符为矩阵分布的游戏
+ 模块化的设计, 便于添加新的游戏
+ 自动识别游戏, 自动获取坐标(10秒完成, 无需手动填写)
+ 多种音乐格式输入(MIDI, Tone.js JSON, DoMiSo, SkyStudio), 音轨选择
+ 拥有约1000首音乐的免费云端曲库! (感谢 autoplay.chimomo.cn 提供的API)
+ 文件搜索, 红心收藏, 自定义歌单功能
+ 针对游戏内演奏设计的乐谱优化器:
  - 自动移调(避开黑键), 自动升降调(音域优化)
  - 多点触控优化/和弦拆分
  - 跳过空白
  - 整体变速/速度限制/去除过于频繁的音符
  - 插入随机误差 (伪装手弹)
  - 加入你自己的优化pass!
+ 按键/手势生成算法覆盖到每个游戏中乐器的全部音域, 效果远超固定21/15键
  - 完全支持带黑键/半音或非连续的音域(36键, 光遇8键, 原神老旧的诗琴...)
  - 完全支持逆水寒专业模式(48/50键...)
+ 支持真实音符时长/长音(长按) (光遇: 小提琴,萨克斯; 逆水寒:曲笛; ...)
+ 乐谱实时可视化
+ 跟弹/练习模式
  - 简单的跟弹模式, 点击发光的按键来演奏
  - 以光遇中乐谱动画为启发设计的高级跟弹模式, 以动画的形式引导你演奏
  - 振动提示
  - 跟弹/练习模式适用于所有游戏
+ lrc歌词显示
  - 加载lrc歌词, 在演奏时同步显示
  - 跳转到指定时间
  - 歌词时间同步不会被变速/跳过空白等操作影响
+ 实时MIDI串流
  - 使用电钢琴/MIDI键盘/各种支持MIDI的控制器在手游中演奏!
    - 支持口袋音乐键盘(EasyPlay 1s) / 魔法音乐键盘
  - 有线/蓝牙无线连接, 低延迟
  - 使用手游作为某种意义上的合成器?
  - 支持移调, 连续点击模拟长音
+ 高性能, 低延迟, 1w音符也不会卡顿 (来点黑乐谱试试?)
+ 导出为键盘谱

<!-- [查看详情](https://github.com/happyme531/clxTools/blob/master/%E6%A5%9A%E7%95%99%E9%A6%99%E9%9F%B3%E4%B9%90%E7%9B%92/README.md)   -->

### 楚留香音乐盒_pc版  

基于Bome MIDI Translator的MIDI转键盘按键配置文件，适用于通过键盘按键在游戏中演奏的pc端游戏，只要演奏使用的键位相同即可使用，至少支持楚留香(一梦江湖)/原神。经过模拟器键盘映射后也适用于上述手游。  

### 百万跑商计算器  

基于<https://www.bilibili.com/video/BV1EM4y1V7TB>的算法, 未详细测试.  

### 楚留香_密令终结者  

自动爆破楚留香"江湖入梦来"活动中的密令的工具, 脚本内包含很多已知密令. 使用时需要自行打开脚本文件修改对话框坐标.  

### 楚留香_筑世刷人气  

因为筑世没人玩，此脚本已弃用.  

### 楚留香图片转影壁  

一个在宅邸影壁上自动作画的工具

+ 以逐个像素点击的方式绘制一般的位图, 自动识别/切换颜色, 完成度很高, 清晰度一般, 可选颜色很有限.  
  使用前建议先运行一次脚本查看图片最佳分辨率, 之后再手动调整图片的分辨率.  
+ 脚本内置GCode解析器, 可以直接绘制标准GCode文件, 清晰度相当高. 但游戏实现存在问题, 最细的线条绘制时中间经常断开, 导致效果没有预览图好看. 多次重复绘制可以缓解这个问题.  
  使用Inkscape或GRBLPlotter等软件可以将矢量图转换为GCode文件, 之后再用此脚本绘制.  
  画板左下角为原点, 向右为X轴正方向, 向上为Y轴正方向, 距离单位为像素, 进给速度单位为像素/分钟, Z轴负数为落笔, 正数为抬笔(或M3落笔, M5抬笔).  

### ~~逆水寒手游_宅邸聆音摆放(目前不可用)~~

在逆水寒手游的庄园中自动摆放聆音骨牌, 跑过去就能播放音乐. [效果展示](https://www.bilibili.com/video/BV11j411o7Az)
基于**楚留香音乐盒**的算法, 因此效果很好.

### 特性诗.txt

仿照Minecraft特性诗格式的楚留香bug收集, 目前很少更新新的bug.  

### 文字转彩字  

给已知句子中插入颜色代码，生成彩虹字的工具。 很多网易手游使用同样的颜色代码，此工具也是可以使用的。  
小技巧: 在楚留香中，悬浮的公共聊天窗口可以输入99个字符，而侧边栏的只能输入50个字符。 但悬浮窗口发送的信息无法被复制,回复,+1。  

### 自动弹琴-nyan cat

"楚留香音乐盒"项目最早的形态。当时楚留香是手游中第一个加入弹琴机制的，这是最早期针对性开发的脚本，其中乐谱只能人工转换。现在基本没有什么实用价值。  

### 自动ai黑白棋

针对楚留香 "无常棋" 开发的脚本，算法不是我写的。很破坏游戏公平性且计算很慢，建议只用来和npc对战("灵犀对战")。需要手动修改坐标，且对坐标精确度要求很高，建议截图后使用ps分析。  

## Star历史

[![Star History Chart](https://api.star-history.com/svg?repos=happyme531/clxTools&type=Date)](https://star-history.com/#happyme531/clxTools&Date)

--------

## 开源协议

[LGPLv2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html)

衍生项目:

- [QiuMusicPro](https://qiu.zhilill.com/code/a729e3167514f8d2235e4a565c47d472) / [部分源码](https://github.com/CencYun/QiuMusicPro): 基于**楚留香音乐盒**的免费自动演奏app, 有很多在线乐谱, 但其它功能受限.  
  注意: 强烈建议不要加入他们的QQ群, 因为群内氛围很差, 且退群后对应的app账号会被封禁!  
- [midi-Streamer-Assistant](https://github.com/Jayce-H/midi-Streamer-Assistant): 基于**楚留香音乐盒**的MIDI串流助手, 只保留了串流功能.

--------  

### by 一梦江湖(楚留香)::声声慢::心慕流霞::李芒果

![1658421643](https://user-images.githubusercontent.com/20812356/180462109-b9971abc-ad18-4e2e-9284-fdbf1856a8e3.jpg)

官方QQ交流群: 954694570 (较慢, 有问题建议直接开issue或者发邮件)  

