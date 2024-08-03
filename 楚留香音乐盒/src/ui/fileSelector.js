var FileProvider = require("../fileProvider.js");
var MusicFormats = require("../musicFormats.js");

/**
 * @argument {FileProvider} fileProvider 
 */
function FileSelector(fileProvider) {
    const musicFormats = new MusicFormats();
    let window;
    /**
     * @type {string?}
     */
    let selectedMusic = null;
    /**
     * @type {string?}
     */
    let selectedPlaylist = null;
    /**
     * @type {number?}
     */
    let selectedPlaylistIndex = null;

    /**
     * @type {(selectedMusic: string?, selectedPlaylist: string?) => void}
     */
    let onItemSelected = (selectedMusic, selectedPlaylist) => { };

    // 创建UI
    function createUI() {
        window = floaty.window(  //如果设置成rawWindow, spinner会点不开
            <frame id="board" w="*" h="*">
                <vertical w="{{Math.round(device.width * 0.9)}}px" h="{{Math.round(device.height * 0.8)}}px" bg="#ffffff" padding="8sp">
                    <horizontal w="*" h="32dp" bg="#f5f5f5" marginBottom="8sp">
                        <text id="btnManagePlaylist" text="≡" textSize="24sp" textColor="#000000" padding="12 0" h="*" gravity="center" />
                        <spinner id="playlistSelector" w="*" h="*" layout_weight="1.6" gravity="center" ellipsize="end" margin="12 0" />
                        <input id="searchInput" w="*" h="40dp" hint="搜索音乐" bg="#f0f0f0" padding="8sp" layout_weight="1" inputType="text" imeOptions="actionDone" singleLine="true" focusable="true" focusableInTouchMode="true" />
                        <text id="btnClose" text="×" textSize="24sp" textColor="#000000" padding="12 0" gravity="center" />
                    </horizontal>

                    <list id="fileList" w="*" h="*" bg="#fafafa">
                        <horizontal w="*" h="40dp">
                            <text id="fileName" text="{{this.displayName}}" textSize="16sp" textColor="#000000" maxLines="1" ellipsize="end" layout_weight="1" />
                            <text id="extraInfo" text="{{this.extraInfo}}" textSize="12sp" textColor="#808080" maxLines="1" ellipsize="end" />
                            <button id="btnLike" text="{{this.liked ? '♥' : '♡'}}" textSize="15sp" w="40dp" h="40dp" margin="0" style="Widget.AppCompat.Button.Borderless" textColor="#FF8080" />
                            <button id="btnAdd" text="+" textSize="18sp" w="40dp" h="40dp" padding="0" style="Widget.AppCompat.Button.Borderless" textColor="#4CAF50" visibility="{{this.addable ? 'visible' : 'gone'}}" />
                            <button id="btnRemove" text="-" textSize="22sp" w="40dp" h="40dp" style="Widget.AppCompat.Button.Borderless" textColor="#F44336" visibility="{{this.removable ? 'visible' : 'gone'}}" />
                        </horizontal>
                    </list>
                </vertical>
            </frame>
        );
        // 设置UI交互逻辑
        ui.run(() => setupUILogic());
    }

    // 设置UI交互逻辑
    function setupUILogic() {
        // window.setAdjustEnabled(true);
        window.setSize(-1, -1);
        // window.setTouchable(true);
        window.board.on('touch_down', () => {
            window.searchInput.clearFocus();
            window.disableFocus();
            // window.board.setVisibility(8);
            // window.setTouchable(true);
        });
        // 初始化歌单选择器
        let playlists = fileProvider.listAllMusicLists();
        playlists.unshift("全部歌曲");  // 在列表开头添加"全部歌曲"选项
        console.verbose(`全部歌单: ${JSON.stringify(playlists)}`);

        window.playlistSelector.setAdapter(new android.widget.ArrayAdapter(context, android.R.layout.simple_spinner_item, playlists));
        window.playlistSelector.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
            onItemSelected: function (parent, view, position, id) {
                selectedPlaylistIndex = position === 0 ? null : position - 1;
                selectedPlaylist = position === 0 ? null : playlists[position];
                refreshFileList();
            },
            onNothingSelected: function () {
            }
        }));
        // 搜索输入框事件
        window.searchInput.setOnEditorActionListener(new android.widget.TextView.OnEditorActionListener((view, i, event) => {
            const EditorInfo = android.view.inputmethod.EditorInfo;
            switch (i) {
                case EditorInfo.IME_ACTION_DONE:
                    let keyword = window.searchInput.getText().toString().trim();
                    refreshFileList(keyword.toLowerCase());
                    window.searchInput.clearFocus();
                    window.disableFocus();
                    return false;
                default:
                    return true;
            }
        }));
        window.searchInput.on("touch_down", () => {
            window.requestFocus();
            window.searchInput.requestFocus();
        });
        // 管理歌单按钮
        window.btnManagePlaylist.on("click", function () {
            window.close();
            showPlaylistManagementDialog();
        });

        // 关闭按钮
        window.btnClose.on("click", function () {
            window.close();
        });

        // 文件列表项点击事件
        window.fileList.on("item_click", function (item, position, itemView, listView) {
            selectedMusic = item.name;
            window.close();
            if (onItemSelected != null) {
                onItemSelected(selectedMusic, selectedPlaylist);
            }
        });

        function onBtnRemoveClickFunc(itemHolder) {
            return function () {
                const musicName = itemHolder.getItem().name;
                if (selectedPlaylist && fileProvider.removeMusicFromList(selectedPlaylist, musicName)) {
                    toast("已从歌单移除");
                    refreshFileList();
                } else {
                    toast("移除失败");
                }
            };
        }

        function onBtnLikeClickFunc(itemHolder, itemView) {
            return function () {
                const musicName = itemHolder.getItem().name;
                const liked = fileProvider.userMusicLists[0].musicFiles.includes(musicName);
                if (!liked) {
                    fileProvider.addMusicToList(fileProvider.userMusicLists[0].name, musicName);
                    itemView.btnLike.setText("♥");
                    toast("已收藏");
                } else {
                    fileProvider.removeMusicFromList(fileProvider.userMusicLists[0].name, musicName);
                    itemView.btnLike.setText("♡");
                    toast("已取消收藏");
                }
            };
        }

        function onBtnAddClickFunc(itemHolder, itemView) {
            return function () {
                const musicName = itemHolder.getItem().name;
                //弹出菜单
                const popUpMenu = new android.widget.PopupMenu(context, itemView.btnAdd);
                const menu = popUpMenu.getMenu();
                const playlists = fileProvider.listAllMusicLists();
                for (let i = 0; i < playlists.length; i++) {
                    menu.add(0, i, i, playlists[i]);
                }
                popUpMenu.setOnMenuItemClickListener(new android.widget.PopupMenu.OnMenuItemClickListener({
                    onMenuItemClick: function (menuItem) {
                        const playlist = playlists[menuItem.getItemId()];
                        if (fileProvider.addMusicToList(playlist, musicName)) {
                            toast(`已添加到歌单"${playlist}"`);
                        } else {
                            toast("添加失败");
                        }
                        return true;
                    }
                }));
                popUpMenu.show();
            };
        }

        // 文件列表项绑定事件
        window.fileList.on("item_bind", function (itemView, itemHolder) {
            //收藏
            itemView.btnLike.on("click", onBtnLikeClickFunc(itemHolder, itemView));
            //加入指定歌单
            itemView.btnAdd.on("click", onBtnAddClickFunc(itemHolder, itemView));
            //移除当前歌单
            itemView.btnRemove.on("click", onBtnRemoveClickFunc(itemHolder));
        });
        window.fileList.setItemViewCacheSize(40);
        window.fileList.setDrawingCacheEnabled(true);
        window.fileList.recycledViewPool.setMaxRecycledViews(0, 40);
    }

    function refreshFileList(searchText) {
        let files;

        if (selectedPlaylist) {
            files = fileProvider.listMusicInList(selectedPlaylist) || [];
        } else {
            try {
                files = fileProvider.listAllMusicFilesWithCache();
            } catch (e) {
                console.error(e);
                dialogs.alert("错误", "无法读取音乐文件列表: " + e + "\n" + e.stack);
                window.close();
                return;
            }
        }

        // 应用搜索过滤
        if (searchText != null)
            files = files.filter(function (file) {
                return file.toLowerCase().includes(searchText);
            });

        ui.run(() =>
            window.fileList.setDataSource(files.map(function (name) {
                return {
                    name: name,
                    displayName: musicFormats.getFileNameWithoutExtension(name),
                    addable: selectedPlaylistIndex == null,
                    removable: selectedPlaylistIndex != null,
                    liked: fileProvider.userMusicLists[0].musicFiles.includes(name),
                    extraInfo: name.startsWith('cloud') ? '(云端)' : ''
                };
            })));
    }

    function showPlaylistManagementDialog() {
        dialogs.build({
            title: "管理...",
            items: ["创建新歌单", "重命名当前歌单", "删除当前歌单", "手动刷新云端歌曲列表", "清除歌曲缓存"],
            itemsSelectMode: "select"
        }).on("item_select", function (index, item) {
            switch (index) {
                case 0:
                    createPlaylist();
                    break;
                case 1:
                    renamePlaylist();
                    break;
                case 2:
                    deletePlaylist();
                    break;
                case 3:
                    {
                        const d = dialogs.build({
                            title: "加载中...",
                            content: "正在更新云端歌曲列表...",
                            progress: {
                                max: -1,
                                horizontal: true
                            }
                        });
                        d.show();
                        fileProvider.updateCloudMusicList((err, succeed) => {
                            d.dismiss();
                            if (err) {
                                dialogs.alert("加载失败", "更新云端歌曲列表失败: " + err);
                                return;
                            }
                            toast("更新成功");
                        }, true);
                    }
                    break;
                case 4:
                    fileProvider.clearMusicFileCache();
                    toast("歌曲缓存已清除");
                    break;
            }
        }).show();
    }

    function createPlaylist() {
        dialogs.rawInput("输入歌单名称").then(function (name) {
            if (name && fileProvider.createMusicList(name)) {
                toast("歌单创建成功");
            } else {
                toast("歌单创建失败");
            }
            createUI();
        });
    }

    function renamePlaylist() {
        if (!selectedPlaylist) {
            toast("请先选择一个歌单");
            return;
        }
        dialogs.rawInput("输入新的歌单名称", selectedPlaylist).then(function (newName) {
            if (newName && fileProvider.renameMusicList(selectedPlaylist, newName)) {
                toast("歌单重命名成功");
                selectedPlaylist = newName;
            } else {
                toast("歌单重命名失败");
            }
            createUI();
        });
    }

    function deletePlaylist() {
        if (!selectedPlaylist) {
            toast("请先选择一个歌单");
            return;
        }
        dialogs.confirm("确定要删除歌单 " + selectedPlaylist + " 吗？").then(function (confirm) {
            if (confirm && fileProvider.deleteMusicList(selectedPlaylist)) {
                toast("歌单删除成功");
                selectedPlaylist = null;
            } else {
                toast("歌单删除失败");
            }
            createUI();
        });
    }

    function updatePlaylistSelector() {
        let playlists = fileProvider.listAllMusicLists();
        playlists.unshift("全部歌曲");
        window.playlistSelector.setAdapter(new android.widget.ArrayAdapter(context, android.R.layout.simple_spinner_item, playlists));
        refreshFileList();
    }

    // 公开方法：显示选择菜单
    this.show = function () {
        createUI();
        // refreshFileList();  // window.playlistSelector.setOnItemSelectedListener会自动调用
    };

    // 公开方法：获取选择的音乐名称
    this.getSelectedMusic = function () {
        return selectedMusic;
    };

    // 公开方法：获取选定的歌单名称
    this.getSelectedPlaylist = function () {
        return selectedPlaylist;
    };

    this.setOnItemSelected = function (/** @type {(selectedMusic: string?, selectedPlaylistIndex: string?) => void} */ callback) {
        onItemSelected = callback;
    }

}

module.exports = FileSelector;