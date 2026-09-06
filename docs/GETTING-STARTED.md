<!-- generated-by: gsd-doc-writer -->
# 安装、第一次写作与升级

本页对应 0.4.0-alpha.2。首次使用建议从一个小作品开始，确认工具能读写记忆后，再把正式项目接入。[文档导航](README.md) · [版本说明](RELEASES.md)

## 环境与安装

需要已经能正常启动的 DSH Web Profile，以及 Node.js 22.19.0 以上的 22.x 或 24 及以上版本。作者实际验证的 DSH 版本是 0.1.2-alpha.4、0.1.2-alpha.5、0.1.2-rc.1；其他版本请先查[兼容性记录](COMPATIBILITY.md)。

在终端检查版本并安装：
```sh
node --version
dsh --version
npm view dsh-humanizer dist-tags --json
dsh plugin --profile web add dsh-humanizer@next
dsh web
```
`next` 提供 0.4 记忆工作台；不写标签会安装 `latest`，当前为 0.3.0-rc.2。要锁定本页版本，将安装参数改成 `dsh-humanizer@0.4.0-alpha.2`。安装使用 DSH 官方插件入口，重启已经打开的 Web 服务后生效。

在设置页找到 Humanizer。面板提供五种可编辑、可复制的请求模板；复制后需要发送到会话，点击模板本身不会写入记忆。它目前不是数据库浏览器或图谱可视化编辑器。

## 第一次使用

在同一个工作目录下建立会话，发送：
> 作品名叫“海边小城”。准备写第一章：陈默下班后回家，发现父亲留下的旧信。请恢复这个作品的已有资料，按需阅读相关理论，再开始写作。没有来源的细节只作为草稿。

模型应调用 `humanize_prepare`。这会绑定作品、保存当前公开任务，返回相关章节全文和已有记忆；空作品没有历史资料是正常结果。没有绑定作品时不会自动注入其他作品的资料。

需要保存确定设定时，明确提供原文：
> 请记住用户设定：“陈默的师父是林舟。”这条是定稿设定，事实 key 使用 chen.mentor.canon；保存时附上来源与原句。

模型通过 `humanize_memory` 写入。出处校验只能证明引文出现在所提供的文字中；你仍需检查是否适合成为正式设定。不同时间或草稿分支使用不同 key。详见[完整示例](USAGE.md)。

暂停前可以发送：
> 保存交接：本次交付了什么、下一步写什么、哪些问题还未确定。不要把未确认草稿写成定稿。

模型读取当前任务 revision 后调用 `humanize_checkpoint`。下次在同一工作区、同一 DSH_HOME 中，对同一作品再次 prepare，才能恢复。插件不会自动读取磁盘上的小说文件，也不会自动保存全部对话。

## 升级与回退

升级前记录当前插件版本，停止正在运行的 DSH。需要备份记忆时，退出所有使用同一数据库的 DSH 进程后，再复制[数据目录](CONFIGURATION.md#本地数据与工作区)。

```sh
dsh plugin --profile web remove dsh-humanizer
dsh plugin --profile web add dsh-humanizer@0.4.0-alpha.2
dsh web
```

从 0.3 升级会新增本地记忆能力；旧版没有持久记忆可自动导入。从 0.4.0-alpha.1 升级到 alpha.2 沿用 schema 1，无数据迁移，JavaScript 工具实现不变；更新文档及模型读取的参考协议。

回退到 0.3.0-rc.2 时，将上面的安装版本替换为该版本。旧版不提供记忆工具，原 SQLite 数据不会因此被转换成旧版可用格式。卸载插件不等于删除用户数据；不要为了回退随意删除数据库。

## 遇到问题

工具不存在，先检查是否装了 `next`、是否重启、是否启用了 toolsEnabled；记忆工具还要求 memoryEnabled。恢复为空时，先核对工作目录、DSH_HOME、作品名，再列出 projects。完整处理顺序见[故障排查](TROUBLESHOOTING.md)。
