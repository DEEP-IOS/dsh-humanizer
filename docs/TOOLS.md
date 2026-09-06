<!-- generated-by: gsd-doc-writer -->
# 工具契约（0.4）

这些是 DSH 提供给模型的工具，以下 JSON 是参数对象，不是终端命令。普通使用者可以用自然语言让模型调用。[场景示例](USAGE.md) · [配置与长度限制](CONFIGURATION.md)

默认注册 7 个工具；memoryEnabled=false 时保留 5 个（含 prepare 的阅读功能），toolsEnabled=false 时为 0 个。参数契约以 [index.mjs](../index.mjs) 和 [workbench.mjs](../lib/workbench.mjs) 为准。

## humanize_prepare

必填 project（稳定作品名，120 字符内）、task（公开任务，1600 字符内）。可选 text_type=fiction/article/mixed，mode=authoring/polishing，focus 为逗号分隔的 voice、continuity、flow、dialogue、evidence、polishing。

```json
{"project":"海边小城","task":"续写陈默与林舟见面的场景","text_type":"fiction","mode":"authoring","focus":"voice,continuity"}
```

默认 fiction/authoring。未识别体裁归为 mixed，未识别模式归为 authoring；未知 focus 会报错，调用时应使用上述明确值。返回：
- memoryEnabled=true：task（作品绑定、revision、当前任务与 handoff）、memory（召回结果）、reading（所选章节全文）。
- memoryEnabled=false：仅 memoryEnabled 与 reading；不创建记忆绑定。

同一会话、同作品、完全相同的 task 为幂等恢复，不清空交接。更换 task 会建立新任务，将之前的 summary 等放入 handoff。跨会话使用作品中最近更新的绑定作为恢复来源；当前会话已有该作品绑定时优先使用它。不是自动合并多个会话的交接。

## humanize_memory

action 必填。除 projects 外，先 prepare 绑定作品；作用域由宿主工作区和当前会话决定，没有任意数据库路径或跨作品参数。

| action | 输入 | 返回/行为 |
|---|---|---|
| projects | 无其他必填 | {projects: [...]}，当前工作区的作品名；可能初始化空数据库 |
| recall | query 可选，1600 内 | {task, memory}；空 query 返回预算内资料 |
| inspect | key | {record}；不存在时 record=null |
| history | key | {versions}，倒序最多 100 个版本；不存在时空数组 |
| remember | 下表证据字段 | 当前记录；同 key 保留候选而不是覆盖 |
| revise | 证据字段及 expected_revision | 显式修正全部当前候选；历史仍保留 |
| forget | key、expected_revision | {key, revision, status:"forgotten"}；仅按用户请求调用 |

inspect 应提交稳定 key；缺失 key 不会自动找到目标。revise/forget 的 expected_revision 来自刚读取的 record.revision，不是 task.revision。

### 证据写入字段

| 字段 | 必需/默认 | 含义 |
|---|---|---|
| key | 必需 | 稳定事实标识，160 内；不同时点/分支宜分 key |
| subject、relation | 必需 | 图的来源实体与关系，各 120 内 |
| target | 必需 | 目标实体或属性，600 内 |
| source | 必需 | 人可理解的来源标签，200 内 |
| quote | 必需 | 原文引文，1200 内 |
| source_text | 必需 | 本次提供的来源文字，200000 内 |
| kind | fact | fact / voice / preference / thread / event / decision |
| basis | stated | stated（明示）/ inferred（解释或推断） |
| stage | draft | canon（已确认）/ draft（草稿）/ proposal（设想） |
| when | 空 | 故事时间或章节标签，120 内，不执行时间推理 |
| pinned | false | 提升召回优先级，不能保证一定装入预算 |

字符串限制按 JavaScript 字符串长度检查，再去除首尾空白，拒绝 NUL。quote 必须逐字出现在处理后的 source_text 中；保存 quote 和处理后 source_text 的 SHA-256，不保存整篇 source_text。这个检查证明匹配，不证明来源真实、引用充分或解释正确。

同 key 最多 8 个当前候选（包括同事实的不同来源佐证）。语义元组 subject/relation/target/kind/basis/stage/when 有差异时标为 conflict；仅出处或 pinned 不同不构成冲突。完全相同的重复写入不增加版本。程序不查找不同 key 间的语义矛盾。

### 召回结构与限制

memory 包含 project、query、records、graph、omitted、total、note。record 包含 key、revision、status、alternatives、updatedAt。候选保留来源、标注和 sourceHash。graph.nodes 是实体字符串；edges 包含 key/from/relation/to/when/stage/basis/conflict。

召回在当前作品记录上执行关键词匹配，并扩展一跳关系；不提供向量检索或别名归一。草稿、设想、推断和冲突资料都可能返回，模型必须遵守其标注。when 不参与专门的时间排序。

公开工具固定使用 9000 字符的召回 JSON 预算；不包含外层 task 与上下文提示。超限记录整体略过。omitted 只计因预算没装入的候选；不匹配查询的记录不计入，因此 omitted=0 不代表整个作品都已读入。total 是该作品未遗忘记录总数。关键 key 用 inspect 获取。

## humanize_checkpoint

summary 必填，1600 内；expected_revision 必填，取当前 task.revision。next_action、unresolved 可选，各 800 内；status 为 active（默认）或 complete。

```json
{"summary":"已交付陈默回家的草稿，用户尚未确认","next_action":"等待确认后继续旧信场景","unresolved":"旧信作者仍未确定","status":"active","expected_revision":1}
```

数字 1 仅适用于当前任务 revision 确实为 1 的情况；实际调用先 prepare/recall 读取。成功返回更新后的任务绑定，revision 增加。过期版本拒绝写入。complete 不解除绑定，也不将 draft 自动升级为 canon。公开交接记录结果、下一步与未知事项，不保存私有推理。

## 保留的工具

| 工具 | 参数 | 用途与边界 |
|---|---|---|
| humanize_study | text_type、mode 必填 | 返回按体裁排序的全部 21 章全文与三篇示范；长结果按宿主转存提示继续读取 |
| humanize_reference | name 必填 | 查章或小节，例如 "04"、"04#4.7"；仅访问包内参考文件 |
| humanize_guard | original、rewritten 必填 | 内容锚点与文字完整性辅助核对；不能证明所有语义无损 |
| humanize_profile | text 必填 | 退役工具的兼容返回，不提供文风分布画像或 AI 评分 |

humanize_prepare 是日常开始入口；study 留作完整学习。若宿主把长结果转存为文件，返回成功不代表所有内容已进入模型上下文，仍需按宿主提示读取。

## 错误处理

Stale memory revision：重新 inspect，与最新版本核对后决定是否修正。Stale checkpoint：重新 recall，使用最新 task.revision。quote 不匹配：返回来源核对逐字引文，不能编造 source_text 只为通过校验。更多情况见[排错指南](TROUBLESHOOTING.md)。
