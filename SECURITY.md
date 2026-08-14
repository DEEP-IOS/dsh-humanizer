# 安全政策（SECURITY）

## 报告漏洞

请勿公开披露。通过以下渠道报告：

- GitHub：在仓库提 **Security advisory**（推荐）
- 邮件：见仓库维护者信息（发布后补充）

## 范围

- 确定性层（`lib/guard.mjs`、`lib/reference.mjs`）：路径遍历、任意文件读取（`humanize_reference` 的参数边界）
- 工具参数校验（JSON schema 之外的边界）
- 发布供应链（npm 包完整性、依赖锁定）

## 处理承诺

确认后 7 天内响应；修复随下一个 rc/稳定版发布，CHANGELOG 记录（不暴露漏洞细节）。
