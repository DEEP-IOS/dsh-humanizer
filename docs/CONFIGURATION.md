<!-- generated-by: gsd-doc-writer -->
# 配置与数据位置

适用 v0.4.x；字段以 [Config](../index.mjs) 为准。设置页提供请求模板，不提供配置开关或数据库管理控件。

## 四个配置项

| 字段 | 默认值 | 作用 |
|---|---|---|
| `workflowEnabled` | `true` | 注册常驻写作引导；关闭后仍可显式调用工具 |
| `toolsEnabled` | `true` | 注册工具；关闭时同时停用写作引导和记忆上下文 |
| `memoryEnabled` | `true` | 注册记忆、交接工具和动态资料；关闭时 prepare 只提供理论 |
| `sectionOrder` | `50` | 常驻引导排序；动态记忆使用该值加 1，分别处于宿主不同的提示贡献列表 |

前三项要求布尔值，不要填写字符串 `"false"`。最后一项是数值，不代表 token 数、记忆容量或模型温度。v0.3 没有 memoryEnabled，也没有记忆工具。

| 配置组合 | 工具数 | 写作引导 | 动态记忆 | prepare |
|---|---:|---|---|---|
| 默认 | 7 | 有 | 绑定作品后有 | 恢复任务、记忆并读取理论 |
| `workflowEnabled: false` | 7 | 无 | 绑定作品后仍有 | 同默认 |
| `memoryEnabled: false` | 5 | 有，明确记忆已关闭 | 无 | 只读取理论，不需要工作目录 |
| `toolsEnabled: false` | 0 | 无 | 无 | 不可用 |

关闭记忆不会删除已保存数据库，也不会从旧会话消息中删除已经展示过的资料。重新打开后可继续使用。

## 应用到已安装插件

先安装插件，再将下面内容保存为自己的补丁文件，例如工作目录中的 `humanizer-options.yml`。这是修改已有 `dsh-humanizer` 条目的补丁，不要再次 insert 同名插件：

```yaml
- id: dsh-humanizer
  config:
    workflowEnabled: true
    toolsEnabled: true
    memoryEnabled: false
    sectionOrder: 50
```

显式启动并验证最终配置：

```sh
dsh --profile web --patch ./humanizer-options.yml --dump-config
dsh web --patch ./humanizer-options.yml
```

`--dump-config` 可能包含其他插件的配置，不要把完整输出公开粘贴。也可通过 dsh 的“打开配置文件”管理持久化补丁，遵循所安装宿主的配置说明。更新包文件或配置后重启 web；不要把直接修改 node_modules 当作持久配置方法。

## 本地数据与工作区

插件使用宿主 `resolveDshHome()`：非空 `DSH_HOME` 环境变量优先，否则使用操作系统用户目录下的 `.dsh`。数据库在：

```text
<DSH_HOME>/plugins/dsh-humanizer/memory.sqlite
```

WAL 模式运行时可能出现同名 `-wal`、`-shm` 文件。首次使用记忆相关操作时才建库；没有保存记录时，projects 查询也可能创建空库。插件不会自动扫描稿件文件。关闭 `memoryEnabled` 不打开数据库。

临时测试可给启动进程设置独立 DSH_HOME；不要为了测试修改现有会话的数据目录。

```powershell
$env:DSH_HOME = 'D:/dsh-humanizer-test-home'
dsh web
```

上面会选择一套独立的宿主配置和插件 profile，并非只改变 humanizer 的数据库位置；新目录需要安装插件并配置宿主。这不是插件提供的 memoryPath 配置项。

## 固定限制

以下是当前实现的上限，**不是 Config 中可调的字段**。字符长度按 JavaScript 字符串长度计算，不等同于模型 token：

| 项目 | 上限或默认 |
|---|---|
| 作品名 / 主体 / 关系 / 故事时点 | 各 120 字符 |
| 关系 key | 160 字符 |
| 对象或属性值 target | 600 字符 |
| 来源标签 source | 200 字符 |
| 原文摘录 quote / 提供的来源全文 source_text | 1200 / 200000 字符 |
| 当前任务 / 查询 / 交接摘要 | 各 1600 字符 |
| 下一步 / 待决事项 | 各 800 字符 |
| 一部作品 | 5000 个 key，遗忘后的版本标记也占 key |
| 单 key 当前候选或佐证 | 最多 8 条；不等于只能修订 8 次 |
| history 返回 | 最新 100 个版本；这不是历史存储总上限 |
| 工具及自动记忆召回 | 9000 个 JSON 字符预算；不含外围任务和提示包装 |

数据库内部 recall 有预算参数，但公开工具和 Config 没有该参数。大项目可按卷使用不同作品名；卷间信息需要明确转录，插件不会自动跨作品检索。参见 [工具参考](TOOLS.md) 与 [故障排查](TROUBLESHOOTING.md)。
