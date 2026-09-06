<!-- generated-by: gsd-doc-writer -->
# 贡献指南

欢迎提交可复现的问题、工具改进、参考理论修订与真实写作评估。当前 0.4 系列重点是来源可靠的记忆恢复、连续写作和按需阅读。先看[开发指南](docs/DEVELOPMENT.md)与[文档导航](docs/README.md)。

## 报告问题

提供插件版本、npm 标签、DSH 完整版本、Node 版本、操作系统，以及能复现问题的最短虚构输入。说明期待行为、实际结果和是否换过工作目录或 DSH_HOME。涉及记忆时给出脱敏的 key、revision、调用动作；不要上传整个数据库、账户凭据或未经允许的小说全文。

安全问题使用 [SECURITY.md](SECURITY.md) 中的渠道，避免公开漏洞细节与真实数据。

## 提交修改

使用独立分支，围绕一个具体问题修改。PR 应说明触发条件、修改后的行为、运行的验证、尚未覆盖的限制。新增功能要同步参数说明、示例、配置和 CHANGELOG；仅修文档也需要核对命令和实际工具行为。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
npm pack --ignore-scripts
node scripts/guard-humanizer.mjs study fiction authoring
node scripts/guard-humanizer.mjs guard original.txt rewritten.txt
```

最后一条需要自行提供两份文本。study CLI 只输出阅读包元信息，完整正文通过模型工具 humanize_study 获取。旧 CLI 的 profile、validate-decision 已退役，不能作为当前贡献检查命令。影响宿主接口时运行[集成测试](docs/TESTING.md)。

## 理论和评估贡献

保留能解释具体写作选择的理论与实例；区分研究结果、作者经验和待验证假设。引用一手材料，避免把检测器观察推广成所有作者必须遵守的规律。不要引入以“人味分”、固定句长比例、特征字配额或故意错字驱动的改稿流程。

记忆示例应有出处，并区分明示/推断、定稿/草稿/设想。公开交接可以保存结果和待办，但不要求输出或持久化模型的私有推理。贡献风格改进时优先提供可盲评的前后样例，而非检测分数截图。

## 发布权限与流程

发布由具有包权限的维护者执行，贡献 PR 不应携带发布凭据。npm latest 是稳定使用入口，next 是 0.4 alpha 试用入口；两者不会因版本号更大自动同步。[发布指南](docs/RELEASES.md)给出打包、验证、标签和回退步骤。GitHub 源码合并、npm 发布和 DSH STORE 复检是三个独立结果，需要分别确认。
