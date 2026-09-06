<!-- generated-by: gsd-doc-writer -->
# 使用场景：连续写作、设定修正与作者声音

日常用自然语言提出意图；JSON 供维护者理解和复现模型工具调用。以下均为虚构素材，模型工具参数详见 [TOOLS.md](TOOLS.md)。

## 一、从设定到跨会话续写

先调用 humanize_prepare：
```json
{"project":"海边小城","task":"写陈默第一次拜访林舟的场景","text_type":"fiction","mode":"authoring","focus":"continuity,dialogue"}
```

用户确认的原文是“陈默的师父是林舟。”，humanize_memory 可以保存：
```json
{"action":"remember","key":"chen.mentor.canon","subject":"陈默","relation":"师父","target":"林舟","kind":"fact","basis":"stated","stage":"canon","source":"用户确认的设定","quote":"陈默的师父是林舟。","source_text":"陈默的师父是林舟。","pinned":false}
```

不要把模型刚写出的场景默认标为 canon。只有草稿时用 stage=draft，只有构想时用 proposal。用户确认后，可检查当前记录并显式 revise；程序不会从“继续写”推断整篇已经定稿。

暂停时让模型保存公开交接：
> 第一场景草稿已交付；下一步等待我确认林舟的态度；尚不确定旧信是谁写的。请读取当前任务版本后保存 checkpoint。

换会话后，在同一工作区与 DSH_HOME 下，对“海边小城”再次 prepare。需要人物关系时调用：
```json
{"action":"recall","query":"陈默 林舟"}
```
更准确的实体名有助于关键词与一跳召回。改了作品名、目录或 DSH_HOME 会进入不同作用域；插件没有自动重命名/搬迁项目的工具。

## 二、处理冲突，而不是悄悄覆盖

用户后来明确修正：“此前写错了，陈默的师父是周岚。”先 inspect：
```json
{"action":"inspect","key":"chen.mentor.canon"}
```
核对原记录与新依据，使用返回的 revision。若它确实为 1：
```json
{"action":"revise","key":"chen.mentor.canon","expected_revision":1,"subject":"陈默","relation":"师父","target":"周岚","kind":"fact","basis":"stated","stage":"canon","source":"用户修正","quote":"陈默的师父是周岚。","source_text":"此前写错了，陈默的师父是周岚。"}
```

如果尚不能判断两份材料谁有效，使用 remember 保留不同候选；同 key 会标 conflict。不能编造修订理由。不同 key 即使语义冲突也不会自动报警，因此同一事实应复用稳定 key，不同时点则显式区分。

## 三、保留作者声音

“克制”“温暖”过于笼统，可以保存用户的明确偏好和少量支撑原句：
```json
{"action":"remember","key":"voice.narrator.preference","subject":"叙述者","relation":"声音偏好","target":"克制，允许留白，保留有功能的重复","kind":"voice","basis":"stated","stage":"canon","source":"用户风格要求","quote":"叙述要克制，允许留白，保留有功能的重复。","source_text":"叙述要克制，允许留白，保留有功能的重复。","pinned":true}
```

如果声音判断来自模型对样文的解释，应使用 inferred，并给出样文引句；不能伪装成用户命令。pinned 有助召回，但不保证预算里永远有位置；也不能把这一偏好变成“每段必须留白”的配额。

## 四、润色文章并保留事实

> 作品“城市观察九月”，请准备润色。我会提供原文，保留所有数字、专名、限定条件与有功能重复，只改表达不清楚的地方。需要时查 evidence 和 polishing 相关理论。

prepare 使用 text_type=article、mode=polishing。完成后可 humanize_guard 比较 original 和 rewritten，再人工核对论点、因果和证据范围。guard 能检查明确锚点及文字问题，不能替代语义审阅。

插件不会主动读取你的文件夹。需要处理文件时，通过 DSH 正常文件工具或直接提供内容；记忆工具只接收本次提供的 source_text。

## 五、查看和遗忘

让模型 history 查看某 key 的近期版本。需要删除该事实时，用户明确提出遗忘，先 inspect，再带当前 record.revision 调用 forget：
```json
{"action":"forget","key":"chen.mentor.canon","expected_revision":2}
```
2 只是上述新建后修正一次的示例值。遗忘清除该 key 的历史负载，留下墓碑；不会清理其他 key、交接文本、宿主会话或备份。重新使用墓碑需要有来源且版本匹配的显式 revise。

## 六、多个会话同时写

为每个会话写清当前任务。作品记忆可共享，但任务交接按会话绑定；新会话恢复最近更新的绑定，不会合并全部并行进度。需要共同交接时，由人或模型核对各份交付后明确保存一份总结。遇到 stale 错误重新读取，不循环盲重试。
