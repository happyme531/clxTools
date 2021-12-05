# 楚留香音乐盒: 下一代的自动演奏工具 ![](https://img.shields.io/badge/Author-%E6%9D%8E%E8%8A%92%E6%9E%9C-yellow.svg) ![](https://img.shields.io/badge/PRs-welcome-blue.svg)

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/0-percent-optimized.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/built-for-android.svg)](https://forthebadge.com)
  
## 自动演奏，无须参与

  还在羡慕大佬们苦练的技术? 不用怕，只要下载脚本和乐谱，游戏中即可自动演奏，满足你在亲友和路人面前装逼的愿望。

## 通用格式，自由下载

  支持标准的MIDI格式，借助`loadDex()`的力量，现在可以在手机本地完成大部分MIDI文件的解析。对于无法在本地解析的复杂MIDI文件，也可以使用`Tone.js`将其转换为可解析的文本格式。这种格式世界通用，随处可以下载。在生活中听到一首好听的音乐，下载MIDI格式文件即可在游戏中演奏。  
  另外, 你可以通过[原神乐谱导出](https://github.com/happyme531/GenshinImpactPianoExtract)将一段原神弹琴视频转换为脚本可用的MIDI文件.  

## 多种游戏，广泛兼容

  理论上支持所有通过触摸屏幕演奏乐曲，且音符为矩阵分布的游戏，例如楚留香(一梦江湖)/天涯明月刀手游/原神/摩尔庄园。  
  不同手机的分辨率不尽相同，但脚本提供了坐标校准功能，一次校准即可永久正常使用。

## 开源免费，无须ROOT

  抛弃那些不注册账号无法进入，被杀毒软件报毒，或者下载歌曲还要花钱的软件吧！这个脚本永久免费，代码开源，甚至脚本的执行环境也是开源的，既可无限制使用，也不必担心脚本中植入病毒的安全风险。脚本利用无障碍功能运行，无需获取ROOT权限即可使用。

## 电脑版游戏支持?

  请移步[楚留香音乐盒_pc版](https://github.com/happyme531/clxTools/tree/master/%E6%A5%9A%E7%95%99%E9%A6%99%E9%9F%B3%E4%B9%90%E7%9B%92_pc%E7%89%88)。这个配置文件也支持除楚留香以外的多种游戏。

## 格式支持说明

  脚本支持的格式有：  
  
 1. Tone.js JSON 格式:  
    扩展名为.json的音乐文件将被解析为 Tone.js JSON 格式  
    目前, 此脚本对该格式的支持很好, 一般都可以正常解析  
    更多详情请参考: https://tonejs.github.io/  

 2. 标准 MIDI 格式:  
    扩展名为.mid的音乐文件将被解析为标准 MIDI 格式  
    目前, 此脚本对该格式的支持较好, 少许情况下可能无法正常解析  
    如果发现无法正常解析, 可以在https://tonejs.github.io/Midi/ 将此音乐文件转换为 Tone.js JSON 格式  

 3. DoMiSo(文本)格式  
    格式设计者为 nigh@github.com , 参见 https://github.com/Nigh/DoMiSo-genshin  
    扩展名为.dms.txt的音乐文件将被解析为 DoMiSo(文本)格式  
    这种格式原来的扩展名是.txt, 你需要重命名为.dms.txt  
    目前, 此脚本对该格式的支持较好, 少许情况下可能无法正常解析  
  
 4. 光遇 SkyStudio JSON 格式  
    扩展名为.skystudio.txt的音乐文件将被解析为 SkyStudio JSON 格式。  
    这种格式原来的扩展名是.txt, 你需要重命名为.skystudio.txt  
    目前, 此脚本对该格式的支持很好, 一般都可以正常解析  

    你可以下载[SkyStudio](https://play.google.com/store/apps/details?id=com.Maple.SkyStudio)进行编曲, 或在 https://github.com/StageGuard/SkyAutoPlayerScript 找到一些乐谱。  
    注意: 这个格式中音符的范围只有C4-C6, 总计15个.
