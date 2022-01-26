
window.onload = function () {
    console.log("onload" + Date())

    // 请后台代码更新界面
    chrome.runtime.sendMessage({ cmd: "update_ui" }, function (response) { });

    //
    // update permission list
    var manifest = chrome.runtime.getManifest();
    var optional_permissions = manifest.optional_permissions;
    console.log(optional_permissions);

    var container = document.getElementById('pnlPermissions');

    for (var permission of optional_permissions) {
        // 赋值给局部变量，避免回调的时候变化
        let perm = permission;
        var btn = document.createElement("BUTTON");
        btn.id = 'btn_' + perm;
        
    
        container.appendChild(btn);

        updatePermissionButton(perm);

        btn.addEventListener('click', function(e){
           
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
function updatePermissionButton(perm){
    chrome.permissions.contains({
        permissions: [perm]
    }, function (result) {
        var html = result ? '<span title="已允许" class="allowed mark" style="color:green">✔</span>'
            : '<span title="已禁止" class="forbidden mark" style="color:red;">🛇</span>';
        html += "<span>" + perm + "</span>";
        document.getElementById('btn_' + perm).innerHTML = html;
    })
}

function togglePermission(permission){
    var permissions = {
        permissions: [permission]
      };
    chrome.permissions.contains(permissions, function(result) {
        if (result) {
          // The extension has the permissions.
          chrome.permissions.remove(permissions, function(result1){
              updatePermissionButton(permission);
          });
        } else {
          // The extension doesn't have the permissions.
          chrome.permissions.request(permissions, function(granted){
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
document.getElementById('btn-allow-all').addEventListener("click", function(){
  var manifest = chrome.runtime.getManifest();
  var optional_permissions = manifest.optional_permissions;
  var permissions = {
    permissions: optional_permissions
  };

  chrome.permissions.request(permissions, function(granted){
    // 更新所有按钮的状态
    updateAllButtons();
  });
});


document.getElementById('btn-remove-all').addEventListener("click", function(){
  var manifest = chrome.runtime.getManifest();
  var optional_permissions = manifest.optional_permissions;
  var permissions = {
    permissions: optional_permissions
  };

  chrome.permissions.remove(permissions, function(granted){
    // 更新所有按钮的状态
    updateAllButtons();
  });
});


// 更新所有按钮的状态
function updateAllButtons(){
  var manifest = chrome.runtime.getManifest();
  for(var permission of manifest.optional_permissions){
    updatePermissionButton(permission);
  }
}