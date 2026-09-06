<!-- generated-by: gsd-doc-writer -->
# 版本、升级与发布

## 当前渠道

| npm dist-tag | 版本 | 适用范围 |
|---|---|---|
| latest | 0.3.0-rc.2 | 兼容修复版，不含持久记忆工作台 |
| next | 0.4.0-alpha.2 | 记忆工作台、任务交接、按需理论及新版文档 |

标签是可移动指针；实际安装前用 npm 查询。按固定版本安装可复现结果：
```sh
npm view dsh-humanizer dist-tags --json
npm view dsh-humanizer@0.4.0-alpha.2 version dist.integrity --json
dsh plugin --profile web add dsh-humanizer@0.4.0-alpha.2
```

0.4.0-alpha.1 首次加入 SQLite 证据图谱、prepare/memory/checkpoint、动态资料恢复及设置页模板。alpha.2 补齐安装、配置、工具、场景、排错、开发和发布文档，修正参考库中与新版冲突的旧协议及无依据的效果承诺。JavaScript 工具实现与数据库 schema 1 沿用 alpha.1；模型读取的 Markdown 已更新，因此并非仅修改网页说明。

当前仍是 alpha：没有公开证明成稿质量优于其他插件的盲评结果；同 key 冲突、关键词与一跳召回等边界见[记忆设计](MEMORY-DESIGN.md)。不能把版本升级等同于主观写作效果保证。

## 使用者升级

停止 DSH，在同一 DSH_HOME 下卸载旧包再安装目标版本，重启。完整命令与备份说明见[快速开始](GETTING-STARTED.md#升级与回退)。0.3 没有持久记忆可迁移；alpha.1 到 alpha.2 不需迁移。卸载保留的用户数据不会自动转换成旧版本格式。

## 维护者发布检查

1. 在目标提交检查版本、CHANGELOG、README、兼容矩阵和参考协议一致；不把未运行的宿主写成 compatible。
2. 按[测试指南](TESTING.md)运行必要验证；打包后确认 docs、references、README、CHANGELOG、CONTRIBUTING、SECURITY 均随包发布，排除凭据和个人数据。
3. 更新 GitHub 默认分支，使用户看到的说明与待发布内容一致。已发布 npm 版本不可原地替换，文档修订也需要新版本号。
4. 使用已授权的 npm 身份发布，显式选择标签。常规源码发布会运行 prepublishOnly 的 pnpm test；发布预先验证的 tgz 时，应记录该产物对应的测试和提交。
5. 等待 Registry 可见，分别检查版本、dist-tag、下载产物的 integrity。不要把 CLI 返回“处理中”当作所有地区已可安装。
6. DSH STORE Catalog 与复检由商城处理；npm 发布成功不会证明商城状态已更新。

维护者在仓库根目录完成验证后可执行：
```sh
npm pack --dry-run
npm publish --tag next --access public
npm view dsh-humanizer dist-tags --json
```

上面是 0.4 alpha 渠道命令，不能直接照搬到正式版；正式版应在评估与兼容性达标后，明确决定是否移动 latest。发布凭据通过本地受控认证使用，不写进命令示例、源码或 PR。

## 回退与问题记录

应用版本回退和 npm 标签回退是不同操作。普通使用者安装一个已知版本即可；维护者移动 dist-tag 前应确认该版本仍可安装并保留变更说明。若发现数据问题，先停写、保留关闭状态下的备份，以明确版本和脱敏复现报告问题，不覆盖损坏数据库来掩盖错误。
