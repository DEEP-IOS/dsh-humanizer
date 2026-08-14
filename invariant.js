// dsh-humanizer — ./invariant 配套入口
//
// 官方惯例（@deepseek-ai/dsh-invariants）：每个发布包提供 ./invariant 入口，
// 用于注册包自有的运行时关系断言；无跨记录关系的包提供空 installer。
//
// No runtime invariant: 本插件的确定性层（lib/guard.mjs）是三个纯函数
// （profile / guard / validateArtifact），不存在跨记录的事件或可变数据关系
// 可断言；工具注册、注入声明与插件名称属于加载/单元测试关注点，而非运行时
// 不变量。故按官方惯例提供空配套入口（与 @deepseek-ai/dsh-tools 的
// invariant.js 同为 0 字节占位等价物）。
export {}


