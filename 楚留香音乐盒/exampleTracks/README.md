# 楚留香音乐盒::使用帮助

欢迎使用同类软件中历史最悠久, 功能最先进, 效果最好并且完全开源免费的手机端自动演奏神器: 楚留香音乐盒  

## 1. 下载安装

事实上如果你是从脚本中"使用说明"点击进入本页面, 那么你已经安装好了。
否则请参考[https://github.com/happyme531/clxTools/blob/master/README.md](https://github.com/happyme531/clxTools/blob/master/README.md)中的说明。

## 2. 导入音乐文件

将音乐文件放入手机内部存储中的`楚留香音乐盒`目录下即可, 运行脚本就可以看到导入的文件。如果你看不到这个目录, 请先运行一次脚本, 之后再查看。  

目前支持的文件类型:  

1. MIDI:  
    这是世界上最为通用的音乐文件格式之一。
    文件后缀名为.mid。
    网上到处都能找到各种midi音乐, 你可以自行搜索下载想要的音乐。  
    我推荐的下载网站是: https://www.midishow.com/ 。注意: 下载需要积分, 但评论就可以获得等量的积分, 先试听评论后再下载即可。  
    - 如果你想要的音乐找不到midi格式但可以在b站找到原神弹琴视频, 这时使用 https://github.com/happyme531/GenshinImpactPianoExtract 可以将一段原神弹琴视频转换为脚本可用的MIDI文件。(效果不错)
    - 可以使用WIDI/piano-transcription/basicpitch等软件将mp3转换为midi。(效果不一定好)

2. DoMiSo:  
    这是Nigh@github.com开发的一种音乐文件格式。
    这些音乐文件的原后缀名为.txt, 为了脚本正常识别, 你需要将后缀名改为.dms.txt。
    参见: https://github.com/Nigh/DoMiSo-genshin  
 
3. 光遇 SkyStudio:  
    为光遇演奏设计的一种音乐文件格式。
    这些音乐文件的原后缀名为.txt, 为了脚本正常识别, 你需要将后缀名改为.skystudio.txt。
    - 在各种地方都能找到SkyStudio乐谱, 你可以自行搜索下载想要的音乐。
    - 可以下载[SkyStudio](https://play.google.com/store/apps/details?id=com.Maple.SkyStudio)进行编曲。
    - 在 https://github.com/StageGuard/SkyAutoPlayerScript 可以找到一些乐谱。  
    注意: 这个格式中音符的范围只有C4-C6, 总计15个.

## 3. 游戏选择

使用前请在 主菜单 -> 全局设置 -> 选择游戏/乐器 菜单中选择与你的游戏对应的选项。
如果没有对应的乐器, 选择"默认"即可。  

## 4. TODO: 以后再写

## 附加功能: MIDI串流

  使用此功能可以实时演奏电脑上的MIDI文件，或者连接电子琴/MIDI键盘等设备直接在游戏中演奏。

  1. 将手机的**USB配置**设置为**MIDI**. 有些手机可以在连接USB后直接选择, 有些手机需要在**开发者选项**中设置.
  2. 连接手机到电脑, 此时电脑上会识别到MIDI设备.  
  3. 打开脚本的**MIDI串流**功能, 在电脑上选择MIDI输出设备为手机, 即可进行MIDI串流演奏.
