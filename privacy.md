# Quicker Connector 隐私政策（中文）

**术语说明：**
- Quicker Connector：本项目所指的浏览器扩展程序；
- Quicker软件：一款Windows效率工具，网址为 https://getquicker.net ，它用于执行用户自定义的动作以提升操作Windows或其他软件的效率；
- 用户：使用Quicker软件和Quicker Connector扩展的人；
- Quicker动作：由Quicker使用者编写的可视化脚本，其中可能包含通过Quicker Connector控制浏览器和网页的步骤。

**隐私政策说明：**
- Quicker Connector作为Quicker软件和浏览器的连接中介，负责传输用户的自定义指令和返回运行结果。
- Quicker Connector和Quicker软件本身不会主动收集、存储或公开用户的隐私数据。
- Quicker Connector和Quicker软件对所运行的脚本和返回的结果，除了用于转换数据格式等实现Quicker动作功能的情况外，对数据内容不做任何主动的侦测和分析。
- Quicker Connector在执行用户脚本的过程中，根据所运行的脚本的实际内容，可能会获取隐私数据（包括Cookie、浏览历史、TopSites等），并通过本地消息主机（Native Message Host）传输给Quicker动作，并允许用户通过动作步骤使用这些信息。在此过程中，Quicker Connector和Quicker软件不会识别、存储或将这些信息发送到任何第三方服务器中。
- Quicker Connector通过manifest文件申请了一些可选的权限，允许用户在扩展弹窗（popup）界面中开启或关闭这些权限。这些权限包括："bookmarks","browsingData","topSites","downloads","history","pageCapture","cookies","sessions","management"。 申请这些可选权限的目的是为了支持用户在必要的时候运行脚本以实现自身的特定需求。在用户不使用特定脚本时，可以关闭相应的权限以避免意外的隐私数据读取。
- 用户在使用他人分享的Quicker动作时，应检验动作的源代码，确保其中不包含非必要的隐私数据读取和使用。
- Quicker Connector在这里开源：https://github.com/cuiliang/QuickerConnectorExtension ，用户可以通过源代码检查其中是否包含非必要的隐私数据读取。 Quicker软件通过C#语言编写，也可以较为容易的对其内部机制进行审查。


# Privacy Policy of Quicker Connector (En)

English version, translated by https://translate.google.com/

**Term Description:**
- Quicker Connector: the browser extension referred to by this project;
- Quicker software: a Windows productivity tool (https://getquicker.net), which is used to perform user-defined actions to improve the efficiency of operating Windows or other software;
- Users: those who use the Quicker software and the Quicker Connector extension;
- Quicker Actions: Visual scripts written by Quicker users.  Quicker action may contain steps to control browsers or web pages through the Quicker Connector.

**Privacy Policy Description:**
- Quicker Connector, as the connection intermediary between Quicker software and browser, is responsible for transmitting user-defined instructions and returning running results.
- Quicker Connector and Quicker software itself do not actively collect, store or disclose users' private data.
- Quicker Connector and Quicker software do not do any active detection and analysis of the data content  or the returned results, except for converting data formats and other situations to realize Quicker action functions.
- In the process of executing user scripts, Quicker Connector may obtain private data (including cookies, browsing history, TopSites, etc.) according to the actual content of the scripts being run, and transmit them to Quicker actions through the Native Message Host , and allow users to use these data through action steps. During this process, Quicker Connector and Quicker software do not recognize, store or send these data to any third-party server.
- Quicker Connector applies for some optional permissions through the manifest file, allowing users to enable or disable these permissions in the extension popup window. These permissions include: "bookmarks","browsingData","topSites","downloads","history","pageCapture","cookies","sessions","management". The purpose of applying for these optional permissions is to enable users to run scripts when necessary to achieve their specific needs. When the user does not use a specific script, the corresponding permission can be turned off to avoid accidental private data reading.
- When users use Quicker actions shared by others, they should check the source code of the actions to ensure that they do not contain unnecessary private data reading and use.
- Quicker Connector is open source here: https://github.com/cuiliang/QuickerConnectorExtension, users can check whether it contains unnecessary private data reading through the source code. Quicker software is written in C# language, and its internal mechanism can also be easily reviewed.



# Changes to the privacy policy

The Privacy Policy may be changed occasionally and you are advised to check it from time to time.
