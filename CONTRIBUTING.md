# 贡献指南（CONTRIBUTING）

欢迎贡献。本项目遵循 dsh 官方插件规范（bundle + client 双面声明、peer 依赖、rc 版本、`./invariant` 配套入口）。

## 开发

```sh
pnpm install          # 安装 schemastery（确定性层零依赖）
pnpm test             # node:test 全量测试
node scripts/guard-humanizer.mjs profile ./文本.md   # CLI 冒烟
```

## 本地挂载到 dsh

```sh
# 在包目录内执行（生成 link: 依赖；改动即时生效，重启 web 生效）
dsh plugin --profile web add .
```

## 提交规范

- 提交信息用中文或英文皆可，前缀标明类型：`fix:` / `feat:` / `chore:` / `docs:` / `test:`
- 修改确定性层（`lib/guard.mjs`、`lib/reference.mjs`）必须同步补测试
- 修改引导文本或工具描述，注意 KV cache 前缀稳定性（避免无意义改动）

## 发布流程（维护者）

```sh
pnpm test
npm login
pnpm publish --tag next     # rc 线
pnpm publish                # 稳定线转 latest
```

发布后更新 `CHANGELOG.md` 与 README 状态节，并打 git tag（`v0.1.0-rc.1`）。

## 行为约定

- 坚持「编辑辅助，非 AI 检测器」定位：不加入检测/评分/识别作者类能力
- 确定性层保持零依赖（node:fs/node:path/node:url 等内置即可）
- 新工具命名保持 `humanize_` 前缀
