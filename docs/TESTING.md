<!-- generated-by: gsd-doc-writer -->
# 测试、复现与证据边界

测试分为程序行为、真实宿主集成、浏览器交互和模型成稿评估。这些层次回答不同问题：工具测试通过不能证明文笔更好。

## 单元测试

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
```

当前套件包含 50 项测试，覆盖内容守卫、完整参考阅读、客户端生命周期、持久记忆、隔离、证据匹配、冲突、版本、遗忘、召回预算和关系扩展。测试文件位于 [test/](../test/)；以实际命令退出码和 TAP 结果为准。

## 实际发行包与宿主

以下命令中的 <host> 必须换成独立目录的绝对路径。不是个人 DSH_HOME。
```sh
npm pack --ignore-scripts
npm install --prefix "<host>" --before=2026-09-04T00:00:00Z --ignore-scripts --no-audit --no-fund @deepseek-ai/dsh@0.1.2-rc.1
node test/integration/smoke-profile.mjs "<host>" ./dsh-humanizer-0.4.0-alpha.2.tgz
```

smoke-profile 在该目录创建唯一的 humanizer-smoke-* DSH_HOME，使用官方 CLI 安装打包产物，再进行原生工具、真实 Cordis 生命周期、Session 记忆恢复和官方 worker-thread PTC 调用。随后启动回环地址 Web 服务，完成登录 cookie 交换，检查启动 HTML 的客户端模块图，停止服务、卸载并检查配置恢复。

独立目录会保留用于复查；脚本不使用你的模型账户完成付费生成。旧发行版的依赖范围可能解析到较新的预发布包，因此使用 --before 固定历史依赖环境。[完整版本矩阵和日期](COMPATIBILITY.md)。

## 浏览器人工验收

需要实际交互时：
```sh
node test/integration/smoke-profile.mjs "<host>" ./dsh-humanizer-0.4.0-alpha.2.tgz --preview
```
脚本打印本地地址并等待回车结束。打开设置页，检查五种模板的切换、编辑、复制反馈、浅深色可读性。自动 HTTP 检查只证明资源加载与模块声明，不能替代这一步。

## 记忆回归场景

用虚构短资料做以下验证，不放个人稿件：
1. 保存有来源的设定，重启后同作品可召回；换工作区或作品不可混入。
2. 同 key 写入另一事实时保留冲突候选；不同出处支持同一事实时允许共存。
3. inspect 后 revise，旧 revision 再写入应失败；history 能看到修正前版本。
4. 用户请求 forget 后，历史负载清除，留下 forgotten 墓碑。
5. 长记录超出预算时整体遗漏，检查 omitted 并通过 inspect 读取，不假设上下文包含一切。
6. 保存公开交接，新会话 prepare 恢复；多会话交接不会自动合并。

## 成稿评估

按 [EVALUATION.md](EVALUATION.md) 比较基线、完整阅读版、按需记忆版；固定输入和模型设置，记录多次结果，盲评内容忠实、叙述视角、人物声音和继续任务的正确率。当前发布提供工程验证，尚无公开的盲评优势结论，不将“测试通过”写成“全球最好”。
