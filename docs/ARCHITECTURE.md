# v0.4 工程结构

`index.mjs` 注册常驻写作引导及兼容的四个原工具。`lib/workbench.mjs` 注册 prepare、memory、checkpoint，并通过官方 `systemPrompt.context` 在每次组装时恢复资料。常驻引导在 system section，记忆在宿主动态 user-role context；不向系统指令拼接稿件摘录。

`lib/memory.mjs` 使用 Node 内置 SQLite。首次调用记忆工具才建库，Cordis scope 释放时关闭连接。WAL、busy timeout、BEGIN IMMEDIATE 事务保证独立进程可串行提交，修订/遗忘/进度更新还校验调用方观察到的版本。表结构版本为 1，未知版本拒绝打开；尚无旧数据库迁移需求。

数据表：projects 保存工作区内作品；bindings 保存会话选择的作品、当前任务与公开交接；heads 指向每个关系 key 的当前版本；records 保存带出处的历史版本。工作区取宿主 session.header.cwd 的 realpath，并对 Windows 路径大小写归一后哈希；不接受模型传来的文件路径。作品名和 key 全部作为 SQL 绑定值，绝不拼接进路径。

关系图直接由主体—关系—对象的断言生成，无外部图数据库。实体/属性字面匹配确定直接命中，再扩展一跳关系；置顶项参与候选，按关联强度排序。在完整 JSON 预算内逐条返回，不截断单条摘录，省略数量显式报告。它不会自动分词、识别别名或理解时间先后；可存别名边，故事时点明确标注但不推测排序。需要其他检索器时可替换 recall 而保留证据存储。

每个 key 新增不同断言时保留 conflict；revise 用观察到的当前版本替换为经核对的断言，历史不丢。遗忘清除该 key 的所有历史 payload，保留版本墓碑。数据库设置 secure_delete，但不承诺物理介质擦除、WAL 历史、系统备份或宿主日志删除。

prepare 对同作品同任务幂等；新任务继承最近可用的公开交接。新会话未选作品时没有记忆注入。自动资料只查询已绑定作品，配置关闭或插件卸载后移除贡献。读取失败给出不可用提示，避免导致整个宿主提示组装失败；不会假装记住。依旧需要模型实际调用工具保存资料，插件不被动抽取全部对话。

`lib/prepare.mjs` 按体裁/问题挑选相关章节全文；`lib/study.mjs` 保留完整 21 章。`lib/reference.mjs` 缓存只读原文，每次结果重新组装。`lib/guard.mjs` 是机械锚点/字符辅助检查，不是语义或文体评分器。`lib/client.js` 提供可编辑、可复制的请求模板；不连接数据库、不展示伪实时记录。

测试分三层：Node 单元测试验证存储与检索不变量；真实官方宿主服务+Session 验证工具、资料组装和 PTC；可安装 tarball 的隔离 Web Profile 验证安装、启动和移除。尚未通过真实付费模型执行小说生成闭环，质量验证按 EVALUATION.md 进行。
