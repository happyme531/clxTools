var screenutil={};
screenutil.checkColor = function (x,y,col) {
    let img=images.captureScreen();
    if(colors.isSimilar(images.pixel(img,x,y),col,6,"rgb+")){
        console.verbose("颜色检测成功:图片%s,目标%s",colors.toString(images.pixel(img,x,y)),col)
        return 1;
    }else {
        return 0;
    };
        
};
module.exports=screenutil;