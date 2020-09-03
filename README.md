# Quicker Connector Extension
Browser extension for Quicker  Quicker的浏览器扩展


# 文件
- src:  扩展源代码
- dist: 用于发布或下载的zip文件。
(含有local的包含key信息，用于在本地调试模式下使用。含有publish的去除了key信息，用于发布到商店)
- create_zip.ps1   用于生成zip文件

# 扩展网址
## Chrome
- https://chrome.google.com/webstore/detail/quicker-chrome-connector/klggbkjfmbonefdcfkiidhcmfjdfnepa?hl=zh-CN
## Edge
- 待审核
## Firefox
- 待审核

# 参考
- [扩展开发官方文档](https://developer.chrome.com/extensions)

# Change Logs

## 0.4.0
- 重命名，去除Chrome字样，以避免Ms不给审核通过Edge插件。
- 支持Firefox

## 0.3.0
- 运行后台脚本支持从脚本中返回数据: `sendReplyToQuicker(isSuccess, message, data, qk_msg_serial)`. 如果脚本中不含有sendReplyToQuicker，则自动返回。
- Popup中增加附加权限管理。
- 显示当前浏览器标识。
- 解决启动Chrome后，插件未自动启动的问题。

