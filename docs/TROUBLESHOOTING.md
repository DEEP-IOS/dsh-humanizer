<!-- generated-by: gsd-doc-writer -->
# 故障排查

先收集插件版本、DSH 完整版本、Node 版本、npm 标签与最短脱敏复现。不要把数据库、API Key 或整份配置贴到公开 issue。[安全政策](../SECURITY.md)

| 现象 | 常见原因 | 处理 |
|---|---|---|
| 没有 prepare/memory/checkpoint | 安装的是 latest 0.3，或服务未重启 | 查询 dist-tags，按[升级步骤](GETTING-STARTED.md#升级与回退)装 0.4 next 后重启 |
| 所有工具都没有 | toolsEnabled=false，或插件加载失败 | 查看启动错误和[配置](CONFIGURATION.md)，确认官方插件安装成功 |
| prepare 只有 reading | memoryEnabled=false | 按需开启；此模式没有持久任务与记忆 |
| 设置页按钮没改变会话 | 按钮只选择/复制请求模板 | 把请求发送给模型，查看实际工具调用结果 |
| 换会话后没有资料 | 未 prepare，或工作区/作品名/DSH_HOME 改变 | 先 projects，再以原作品名 prepare；确认同一数据目录 |
| Call humanize_prepare… | 当前会话尚未绑定作品 | 用稳定作品名准备任务后再访问记录 |
| Memory needs a DSH session… | 调用环境缺少真实宿主会话或工作目录 | 在目标目录启动 DSH 正常会话；不要直接伪造路径参数 |
| quote must occur verbatim… | 引文被改写、标点不同或来源传错 | 核对真正原句和 source_text，重新提交真实证据 |
| Stale memory revision | 记录在上次读取后变化 | inspect 最新记录，核对修改意图，再使用当前版本 |
| Stale checkpoint | 任务交接版本已变化 | recall 读取 task.revision，再决定新交接内容 |
| Too many alternatives/sources | 同 key 当前候选已达 8 个 | 检查并协调来源，明确 revise；不要随意抹除有效证据 |
| Work limit reached | 达到 5000 个 key，含遗忘墓碑 | 将后续工作拆成不同作品/卷；遗忘不是释放 key 配额 |
| 查询没找到已知事实 | 别名、隐含关系或关键词不匹配 | 用明确实体名 recall，已知 key 用 inspect |
| omitted 大于 0 | 预算装不下所有相关候选 | 缩小查询、按 key inspect；不要假装已完整恢复 |
| when 没按故事时间排序 | 当前仅保存故事时间标签 | 明确查询实体并核对 when；不同时间使用不同 key |
| forgotten key 不能 remember | 墓碑防止无意恢复 | 确认需要恢复后，以新证据和当前 revision 显式 revise |
| Unsupported humanizer memory format | 数据 schema 不受当前代码支持 | 停止使用该库，保留备份并使用支持其格式的插件，不手改 metadata |
| database is locked | 多进程写入或其他程序长事务占锁 | 结束占用/等待写入完成后重新读取再尝试，避免同时编辑数据库 |

## “memory is unavailable” 如何定位

动态上下文回调遇到错误会给出通用提示，并要求不要假装记得。先运行 memory 的 projects/recall 取得更具体的错误，再检查宿主会话和数据库状态。

当前自动召回把 task 与 next_action 拼接为查询。两者分别合法时，拼接结果仍可能超出 query 的 1600 字符限制；把任务与下一步写得简短，让合计留在限制内。单独 recall 可用短查询诊断。这个边界尚未有独立的配置项。

## 为什么保存成功仍然记错

工具成功只说明调用完成。检查该记录的 stage、basis、source、quote、冲突候选和任务 handoff。推断、设想和冲突可能被召回，但不应当作已确认事实；不同 key 的矛盾不会自动发现。

跨会话恢复只读取已有记录和交接，不重新扫描所有聊天或稿件。重要进展需要明确保存；没有来源的内容应保留为未知或草稿。

## 数据备份与损坏

数据路径见[配置](CONFIGURATION.md#本地数据与工作区)。使用普通文件复制备份前，退出所有使用该库的 DSH 进程，避免只复制主文件漏掉 WAL 状态。恢复时先保留现有文件，不在活跃进程下覆盖。schema 检查不是完全只读的格式探针，不要用旧版反复打开未知格式的数据库。

## 报告可复现问题

提交系统与版本、动作顺序、脱敏错误、期望/实际结果；能用本文虚构案例复现最好。区分“工具没有返回”“模型没采用返回资料”“成稿质量不理想”，三者需要不同修复。主观问题附具体句子及为什么不合适，避免只写“没人味”。
