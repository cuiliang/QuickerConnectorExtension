// 可选权限的说明
var permissionDesc = {
  "bookmarks": "允许从动作中访问浏览器书签数据",
  "browsingData": "允许从动作中访问浏览历史数据",
  "topSites": "允许从动作中获取常用网站信息",
  "downloads": "允许从动作中访问下载数据",
  "history": "允许从动作中访问浏览历史",
  "pageCapture": "允许从动作中保存网页到MHTML",
  "cookies": "允许从动作中访问网站cookie",
  "sessions": "允许从动作中查询和恢复标签、窗口",
  "management": "允许从动作中管理扩展和app"
}


window.onload = function () {
  console.log("onload" + Date())

  // 请后台代码更新界面
  chrome.runtime.sendMessage({ cmd: "update_ui" }, function (response) { });

  //
  // update permission list
  // 
  updatePermissionList();

  // update config option
  //
  updateSettings();

  // tools
  //
  setupTools();
}

/**
 * 工具按钮处理
 */
function setupTools() {

  // // 选择元素
  // var btnPickElement = document.getElementById('btnPickElement');

  // btnPickElement.addEventListener('click', function () {
  //   startPickElement();
  //   window.close();
  // });
}




/**
 * 更新设置界面
 */
function updateSettings() {
  var chkEnable = document.getElementById('chkEnableReport');

  chrome.storage.sync.get('enableReport', function (data) {
    console.log('value:', data);
    chkEnable.checked = data.enableReport;
  });

  chkEnable.addEventListener('change', function () {
    chrome.storage.sync.set({ enableReport: this.checked });

    // 通知background脚本
    chrome.runtime.sendMessage({ cmd: "local_setting_changed" }, function (response) { });
  });
}


/**
 * 更新权限列表
 */
function updatePermissionList() {
  var manifest = chrome.runtime.getManifest();
  var optional_permissions = manifest.optional_permissions;
  console.log(optional_permissions);

  var container = document.getElementById('pnlPermissions');

  for (var permission of optional_permissions) {
    // 赋值给局部变量，避免回调的时候变化
    let perm = permission;
    var btn = document.createElement("BUTTON");
    btn.id = 'btn_' + perm;
    btn.classList.add('hint--bottom');
    btn.setAttribute('aria-label', permissionDesc[permission]);

    container.appendChild(btn);

    updatePermissionButton(perm);

    btn.addEventListener('click', function (e) {

      e.stopPropagation();
      togglePermission(perm);

      return false;
    });
  }
}

/**
 * 更新权限按钮
 * @param {*} perm 权限
 */
function updatePermissionButton(perm) {
  chrome.permissions.contains({
    permissions: [perm]
  }, function (result) {
    var html = result ? '<span title="已允许" class="allowed mark" style="color:green">✔</span>'
      : '<span title="已禁止" class="forbidden mark" style="color:red;">🛇</span>';
    html += "<span>" + perm + "</span>";
    document.getElementById('btn_' + perm).innerHTML = html;
  })
}

function togglePermission(permission) {
  var permissions = {
    permissions: [permission]
  };
  chrome.permissions.contains(permissions, function (result) {
    if (result) {
      // The extension has the permissions.
      chrome.permissions.remove(permissions, function (result1) {
        updatePermissionButton(permission);
      });
    } else {
      // The extension doesn't have the permissions.
      chrome.permissions.request(permissions, function (granted) {
        if (granted) {
          //doSomething();
          updatePermissionButton(permission);
        } else {
          // not granted
        }
      });
    }
  });

}

// 允许所有权限
document.getElementById('btn-allow-all').addEventListener("click", function () {
  var manifest = chrome.runtime.getManifest();
  var optional_permissions = manifest.optional_permissions;
  var permissions = {
    permissions: optional_permissions
  };

  chrome.permissions.request(permissions, function (granted) {
    // 更新所有按钮的状态
    updateAllButtons();
  });
});


document.getElementById('btn-remove-all').addEventListener("click", function () {
  var manifest = chrome.runtime.getManifest();
  var optional_permissions = manifest.optional_permissions;
  var permissions = {
    permissions: optional_permissions
  };

  chrome.permissions.remove(permissions, function (granted) {
    // 更新所有按钮的状态
    updateAllButtons();
  });
});

// 重置浮标位置
document.getElementById('btn-reset-floater').addEventListener("click", function () {

  chrome.runtime.sendMessage(
    {
      cmd: 'reset_floater_position',
      data: {}
    }, function () {
      window.close();
    });
});

// 获取元素选择器
document.getElementById('btn-picker').addEventListener("click", function () {

  chrome.runtime.sendMessage(
    {
      cmd: 'start_picker',
      data: {}
    },
    function () {
      window.close();
    });
});

// 更新所有按钮的状态
function updateAllButtons() {
  var manifest = chrome.runtime.getManifest();
  for (var permission of manifest.optional_permissions) {
    updatePermissionButton(permission);
  }
}