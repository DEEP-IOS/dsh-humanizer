<!-- generated-by: gsd-doc-writer -->
# 文档导航

当前版本：**0.4.0-alpha.2**，npm **next**。稳定使用入口 latest 仍为 **0.3.0-rc.2**。alpha.2 补齐新版文档，并统一模型读取的参考协议；记忆工具和 schema 1 沿用 alpha.1。

| 你要做什么 | 从这里开始 |
|---|---|
| 安装、升级、回退、第一次写作 | [快速开始](GETTING-STARTED.md) |
| 看新版变化与发布渠道 | [版本与发布](RELEASES.md)、[变更记录](../CHANGELOG.md) |
| 配置开关、找到数据、理解限制 | [配置](CONFIGURATION.md) |
| 保存设定、跨会话续写、处理冲突 | [使用场景](USAGE.md) |
| 查工具参数与返回值 | [工具契约](TOOLS.md) |
| 排查无记忆、冲突或安装问题 | [故障排查](TROUBLESHOOTING.md) |
| 理解写作理念与证据边界 | [理论总纲](THEORY.md)、[设计取舍](WHY.md) |
| 理解模块和记忆模型 | [架构](ARCHITECTURE.md)、[记忆设计](MEMORY-DESIGN.md) |
| 复现兼容测试与评估成稿 | [测试](TESTING.md)、[兼容性](COMPATIBILITY.md)、[评估](EVALUATION.md) |
| 修改源码或贡献资料 | [开发](DEVELOPMENT.md)、[贡献](../CONTRIBUTING.md) |
| 数据隐私与漏洞报告 | [安全政策](../SECURITY.md) |

## 模型读取的完整参考库

[00 工作流](../references/00-工作流.md) 是当前执行入口；[02 人类作者感](../references/02-人类作者感.md)与[20 文笔与温度](../references/20-文笔与温度原理.md)说明写作取舍；[19 后处理禁令](../references/19-后处理禁令.md)约束机械改写。[references/](../references/)保留完整 21 章。

默认 humanize_prepare 选择相关章节全文；需要系统阅读时使用 humanize_study，针对问题可以 humanize_reference 读取章或小节。按需阅读不是省略证据，也不能由“工具已返回”推断模型已经理解。

## 历史材料

[V0.3-DESIGN-HISTORY.md](V0.3-DESIGN-HISTORY.md)用于了解旧版设计，不是当前操作要求。CHANGELOG 中历史版本的“必须全文读入”“禁止一切工件”等描述记录当时行为；当前以本导航、工具契约和 00 工作流为准。
