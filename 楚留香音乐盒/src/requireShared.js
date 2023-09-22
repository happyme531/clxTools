
/**
 * 加载共享的js文件, 和require类似，用来解决几个项目共享js文件的问题。
 * 安卓不能软链接，如果把共享的js文件放上一个目录，打包之后就找不到了。
 * @param {string} fileName
 */
function requireShared(fileName) {
    const sharedDirRel = "../shared/";
    const cacheDirRel = "./sharedcache/";
    const alternativeSharedDir = "/sdcard/脚本/shared/";
    let sharedDir = files.path(sharedDirRel);
    let cacheDir = files.path(cacheDirRel);
    //检查是否在/data/user/目录下运行，如果是，则使用备用目录 (调试用)
    console.log(files.cwd());
    if (files.cwd().startsWith("/data/user/")) {
        sharedDir = alternativeSharedDir;
    }
    files.ensureDir(cacheDir);
    let sourceExists = files.exists(sharedDir + fileName);
    let cacheExists = files.exists(cacheDir + fileName);
    if (sourceExists && !cacheExists) {
        console.log("复制共享文件: " + fileName);
        files.copy(sharedDir + fileName, cacheDir + fileName);
        return require(cacheDir + fileName);
    } else if (!sourceExists && cacheExists) {
        //如果共享文件不存在，但是缓存文件存在，则直接加载缓存文件（打包之后，共享文件会丢失）
        console.log("共享文件不存在，加载缓存文件: " + fileName);
        return require(cacheDir + fileName);
    } else if (!sourceExists && !cacheExists) {
        throw new Error("共享文件不存在: " + fileName);
    }

    //都存在，检查是否有更新
    let sourceLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(sharedDir + fileName)).toMillis();
    let cacheLastModified = java.nio.file.Files.getLastModifiedTime(java.nio.file.Paths.get(cacheDir + fileName)).toMillis();
    if (sourceLastModified > cacheLastModified) {
        console.log("共享文件有更新: " + fileName);
        files.copy(sharedDir + fileName, cacheDir + fileName);
    }
    return require(cacheDir + fileName);
}

module.exports = {
    requireShared: requireShared
}