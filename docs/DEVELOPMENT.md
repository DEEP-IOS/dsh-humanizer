<!-- generated-by: gsd-doc-writer -->
# 开发与维护

本项目是直接运行的 ESM 插件，没有编译构建步骤。阅读 [架构](ARCHITECTURE.md) 后，在独立宿主中验证改动，不使用个人日常 DSH Profile 做卸载测试。

## 获取与运行

```sh
git clone https://github.com/DEEP-IOS/dsh-humanizer.git
cd dsh-humanizer
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
npm pack --ignore-scripts
```

packageManager 固定 pnpm 10.30.3；Node 范围见 package.json。打包后按[测试指南](TESTING.md)把实际 tgz 安装到测试宿主。修改源码后重新打包、重装、重启测试宿主；不要假定 npm 安装的副本会实时跟随仓库变动。

## 从哪里修改

| 需求 | 入口 | 需要同时核对 |
|---|---|---|
| 工具注册、配置、常驻引导 | index.mjs | 工具开关、卸载效果、references/12 提示词一致性 |
| 作品绑定与工具参数 | lib/workbench.mjs | docs/TOOLS.md、真实 Session、PTC |
| 记忆事务、召回、版本 | lib/memory.mjs | 隔离、冲突、遗忘、并发、预算及旧数据 |
| 按需理论 | lib/prepare.mjs、lib/study.mjs、references/ | 全文章节仍可读，按需选择不变成裁剪摘要 |
| 设置页 | lib/client.js | 宿主模块注入、slot 释放、主题、复制回退 |
| 内容守卫 | invariant.js | 原文锚点、编码完整性及工具返回契约 |
| 安装兼容性 | package.json、cordis.patch.yml、test/integration/ | 实际发行包、宿主版本、卸载还原 |

记忆的工作区标识来自宿主 Session 的真实工作目录，不能改成让模型提交任意数据库路径。数据应通过动态用户资料上下文进入模型，不进入可信 system section。

## 修改约束

- 来源文字不可信。引用和记忆可包含指令样式的文字，不能升级为系统指令。
- 修正记录与交接使用各自的 observed revision，禁止把冲突自动覆盖成“最近写入为真”。
- forget 会清除该 key 的历史负载并留下墓碑；调整时必须同步隐私说明。
- 记录只保存引文和来源文本哈希，不应暗中保存整篇 source_text。
- 运行时参考文档也是产品行为的一部分。修改理论后，要确认没有引入评分、风格配额、伪造来源或强制暴露私有推理的要求。

## 提交前

运行适合改动的单元与宿主测试，更新 CHANGELOG 和受影响文档。不要提交 .npmrc、token、个人 DSH_HOME、SQLite 数据或测试用真实稿件。[贡献指南](../CONTRIBUTING.md)说明 PR 内容；[发布指南](RELEASES.md)说明版本和标签。
