"ui";
const FileChooserPathEvent = "FileChooserPathEvent";

importClass(android.content.Intent);
importClass(android.provider.MediaStore);
importClass(android.provider.OpenableColumns);

function URIUtils_uriToFile(uri) {
  //Source : https://www.cnblogs.com/panhouye/archive/2017/04/23/6751710.html
  var r = null,
    cursor,
    column_index,
    selection = null,
    selectionArgs = null,
    isKitKat = android.os.Build.VERSION.SDK_INT >= 19,
    docs;
  if (uri.getScheme().equalsIgnoreCase("content")) {
    if (isKitKat && android.provider.DocumentsContract.isDocumentUri(activity, uri)) {
      if (String(uri.getAuthority()) == "com.android.externalstorage.documents") {
        docs = String(android.provider.DocumentsContract.getDocumentId(uri)).split(":");
        if (docs[0] == "primary") {
          return android.os.Environment.getExternalStorageDirectory() + "/" + docs[1];
        }
      } else if (String(uri.getAuthority()) == "com.android.providers.downloads.documents") {
        uri = android.content.ContentUris.withAppendedId(
          android.net.Uri.parse("content://downloads/public_downloads"),
          parseInt(android.provider.DocumentsContract.getDocumentId(uri))
        );
      } else if (String(uri.getAuthority()) == "com.android.providers.media.documents") {
        docs = String(android.provider.DocumentsContract.getDocumentId(uri)).split(":");
        if (docs[0] == "image") {
          uri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        } else if (docs[0] == "video") {
          uri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        } else if (docs[0] == "audio") {
          uri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
        }
        selection = "_id=?";
        selectionArgs = [docs[1]];
      }
    }
    try {
      cursor = activity.getContentResolver().query(uri, ["_data"], selection, selectionArgs, null);
      if (cursor && cursor.moveToFirst()) {
        r = String(cursor.getString(cursor.getColumnIndexOrThrow("_data")));
      }
    } catch (e) {
      log(e);
    }
    if (cursor) cursor.close();
    return r;
  } else if (uri.getScheme().equalsIgnoreCase("file")) {
    return String(uri.getPath());
  }
  return null;
}

function getUriFileName(resolver,uri) {
  let returnCursor =
          resolver.query(uri, null, null, null, null);
  let nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
  returnCursor.moveToFirst();
  let name = returnCursor.getString(nameIndex);
  returnCursor.close();
  return name;
}



activity.getEventEmitter().on("activity_result", function (requestCode, resultCode, data) {
  if (requestCode == 5) {
    if (resultCode == activity.RESULT_OK) {
      var uri = data.getData();
      let path = null;
      console.log("uri: " + uri);
      try {
        path = URIUtils_uriToFile(uri);
        console.log("path: " + path);
      } catch (e) {
        console.warn("无法获取文件路径, 尝试其它方法...");
      }
      let args = engines.myEngine().execArgv;
      console.log(args);
      switch (args[0]) {
        case "copyTo":
          if (path !== null) {
            let dst = args[1] + files.getName(path);
            let res = files.copy(path, dst);
            console.log("copyTo: " + path + " -> " + dst + " result: " + res);
            if (res) {
              toast("成功");
            }
          } else {
            //"其它方法"的实现
            try {
              let is = activity.getContentResolver().openInputStream(uri);
              let dst = args[1] + getUriFileName(activity.getContentResolver(),uri);
              let os = new java.io.FileOutputStream(dst);
              let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
              let len;
              while ((len = is.read(buffer)) != -1) {
                os.write(buffer, 0, len);
              }
              os.flush();
              os.close();
              is.close();
              toast("成功");
            } catch (e) {
              console.error(e);
              toast("失败");
            }
          }
          break;
        default:
          console.warn("unknown args[0]: " + args[0]);
      }

    } else {
      console.warn("result code: " + resultCode);
    }
  }
  exit();
});

var intent = new Intent(Intent.ACTION_GET_CONTENT);
intent.setType("*/*");
intent.addCategory(Intent.CATEGORY_OPENABLE);
activity.startActivityForResult(intent, 5);