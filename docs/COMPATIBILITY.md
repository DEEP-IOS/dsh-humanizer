# DSH 兼容性与运行验证

验证日期：2026-09-06。插件：`0.3.0-rc.2`。本地平台：Windows x64、Node.js 24.14.0、pnpm 10.30.3。

## 版本矩阵

| DSH 完整版本 | 声明 | 一次性 Web Profile 安装/启动/卸载 | 工具与 PTC | 浏览器面板 |
|---|---|---|---|---|
| 0.1.2-alpha.4 | compatible | 通过，卸载后配置恢复 | 通过 | 已检查启动 HTML 中的模块图，未单独人工验收 |
| 0.1.2-alpha.5 | compatible | 通过，卸载后配置恢复 | 通过 | 已检查启动 HTML 中的模块图，未单独人工验收 |
| 0.1.2-rc.1 | compatible | 通过，卸载后配置恢复 | 通过 | 实际打开“设置 → 人味化”，浅色和深色均通过 |
| 0.1.3-alpha.1 | unknown | npm 未提供该版本，未运行 | 仅源码接口核对 | 未运行 |

`compatible` 是作者对当前源码的声明，不代表 DSH STORE 已完成复检、独立安全审核或更新了 Catalog。`dshOperations` 的商城证据仍由商城独立处理，不伪造其运行状态。

## 可安装最新版与 GitHub 最新标签

核验官方 npm Registry 时，`@deepseek-ai/dsh` 的 `latest` 为 `0.1.2-rc.1`；查询 `@deepseek-ai/dsh@0.1.3-alpha.1` 与 `@deepseek-ai/dsh-tools@0.1.3-alpha.1` 均返回 E404。GitHub 已有 [dsh-v0.1.3-alpha.1](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.3-alpha.1)，固定提交为 `d347e703908d0406b7a7ef80e3a0e594d86b2215`。

对比该标签与 `dsh-v0.1.2-rc.1`，`tools/src/schema.ts`、`system-prompt/src/index.ts`、浏览器 `modules/src/client/manifest.ts`、`ui-settings/src/client/contract/slots.ts` 和 `ui-settings-general/src/client/index.ts` 无差异。插件使用这些扩展接口，并已修正包级依赖和服务级注入的区别；这项源码核对不能替代 0.1.3 的实际运行测试。

## 验证覆盖

- `pnpm test`：34 项通过，包含内容守卫、21 章完整阅读、参考查询、返回对象隔离和前端工厂/slot 生命周期。
- 每个 DSH 版本运行 18 次正常原生工具调用，覆盖三体裁 × 两模式、内容守卫、参考读取和旧工具兼容；缺参调用按预期失败。
- 每个版本通过两轮真实 Cordis 挂载、注销、重载，以及 `toolsEnabled` / `workflowEnabled` 配置开关检查；卸载后没有残留工具或提示词。
- 每个版本通过官方 worker-thread PTC：`run_code` 内并行调用 `humanize_study` 和 `humanize_reference`，校验章节完整性与返回值。
- 安装实际 `npm pack` 产物，启动绑定回环地址的 Web 服务，完成启动 token 的正常 cookie 交换，校验 HTTP 200 与客户端模块图。
- 经 `dsh plugin ... remove` 卸载后，组合配置与安装前逐字节相等，插件从 profile bundle 列表移除。
- 本地核对三个隔离 npm 宿主内各 214 个 DSH 包均与对应完整版本一致，避免旧 CLI 搭配新依赖产生假阳性。自动冒烟继续检查本插件使用的关键宿主包版本一致性。

未调用付费模型，未测试生成文本的主观文笔、外部检测分数或 `0.1.3-alpha.1` 的运行行为。测试未读取或改动用户已有 DSH Profile、会话或凭据。

## 复现

从插件仓库执行以下命令。将 `<host>` 替换为独立测试目录的绝对路径；命令适用于 PowerShell 或 Bash。`--before` 防止预发布依赖的宽泛范围漂移到后续发行版。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
npm pack --ignore-scripts
npm install --prefix "<host>" --before=2026-09-04T00:00:00Z --ignore-scripts --no-audit --no-fund @deepseek-ai/dsh@0.1.2-rc.1
node test/integration/smoke-profile.mjs "<host>" ./dsh-humanizer-0.3.0-rc.2.tgz
```

测试脚本在 `<host>` 下创建唯一 `humanizer-smoke-*` 目录，用独立 `DSH_HOME` 执行；结束时停止自己启动的 Web 进程并卸载插件，保留一次性目录便于复查。正常输出为：

```json
{"dsh":"0.1.2-rc.1","calls":18,"lifecycle":"mount/dispose/remount passed","config":"passed","tools":"passed"}
{"ptc":"passed","worker":"official worker-thread","parallelTools":2}
{"profile":"web","install":"passed","start":"passed","uninstall":"passed","baselineRestored":true,"home":"<host>/humanizer-smoke-..."}
```

另两个版本分别使用：

| 版本 | npm `--before` |
|---|---|
| 0.1.2-alpha.4 | 2026-09-02T00:00:00Z |
| 0.1.2-alpha.5 | 2026-09-03T00:00:00Z |

GitHub Actions 为上述三版配置 Linux/Windows 矩阵，运行固定发行依赖、打包和同一冒烟脚本。具体 CI 结果以当前提交的 Actions 记录为准。
