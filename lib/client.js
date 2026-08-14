// dsh-humanizer 浏览器 half（产物入库：本文件即构建产物，等价于官方 esbuild/tsdown CJS 打包结果）
// 作用：在「设置 → 人味化」挂一个工作台面板，展示十步状态机与核心理念，作为用户可见的引导。
// 说明：面板是静态引导，实际执行由模型用 humanizer 技能 + 三个工具完成；校验门禁由 humanize_validate_artifact 承担。
window.__ModuleLoader__.load({
  id: 'dsh-humanizer',
  factory: function (require) {
    var React = require('react')

    var 理念 = [
      '反套路化、反同质化、反模板化 —— 这是十维叙事设计的本质。',
      '每个章节的功能要不同：事实/关系/解释/风险轮换，连续两章不重复。',
      '限制简单主谓宾句式与短句碎句的使用率，避免通篇短句/通篇简单主谓宾。',
      '一次一步：状态机十步，每步产出单一工件、程序校验通过才进下一步。',
    ]
    var 十步 = [
      '第 0 步 接单卡',
      '第 1 步 十维叙事设计（工件 A，逐细分项）',
      '第 2 步 功能路径图（工件 B，八类逐形态）',
      '第 3 步 十五层语言分析（工件 C，逐细分项＋句式使用率）',
      '第 4 步 认识与来源图（工件 D）',
      '第 5 步 问题清单（合并 A/B/C/D）',
      '第 6 步 改写轮 1：只改材料/叙事/论证',
      '第 7 步 改写轮 2：只改信息焦点/照应/句法',
      '第 8 步 改写轮 3：只改词汇/搭配/虚词',
      '第 9 步 复核（内容守卫＋工件校验＋七类高危＋五层＋盲审）',
      '第 10 步 交付',
    ]

    var 样式 = {
      标题: { fontSize: '16px', fontWeight: 600, margin: '0 0 12px' },
      小节: { fontSize: '13px', fontWeight: 600, margin: '16px 0 8px' },
      正文: { fontSize: '13px', margin: '4px 0', lineHeight: '1.6', color: 'var(--color-text, #333)' },
      弱化: { fontSize: '12px', margin: '4px 0', lineHeight: '1.6', color: 'var(--color-text-muted, #888)' },
      列表: { margin: '4px 0', paddingLeft: '20px' },
      条目: { fontSize: '13px', margin: '2px 0', lineHeight: '1.6' },
    }

    function HumanizerPanel() {
      return React.createElement(
        'div',
        { style: { padding: '16px', maxWidth: '720px' } },
        React.createElement('h1', { style: 样式.标题 }, '人味化工作台'),
        React.createElement('p', { style: 样式.正文 }, '把 AI 味重、模板化、机器腔的中文文本，从深层改得更自然、更像人写，内容不跑偏、每处修改可复核。'),
        React.createElement('h2', { style: 样式.小节 }, '核心理念'),
        React.createElement('ul', { style: 样式.列表 },
          理念.map(function (t) { return React.createElement('li', { key: t, style: 样式.条目 }, t) })),
        React.createElement('h2', { style: 样式.小节 }, '十步状态机（一次一步）'),
        React.createElement('ol', { style: 样式.列表 },
          十步.map(function (t) { return React.createElement('li', { key: t, style: 样式.条目 }, t) })),
        React.createElement('h2', { style: 样式.小节 }, '怎么用'),
        React.createElement('p', { style: 样式.正文 }, '对模型说「用 humanizer 处理这段文本」，模型会按十步状态机执行，并用 humanize_profile（画像）、humanize_guard（内容守卫）、humanize_validate_artifact（工件校验）三个工具把关。'),
        React.createElement('p', { style: 样式.弱化 }, '本插件是编辑辅助，不是 AI 检测器；不输出概率、不声称识别作者、不要求提交外部检测。')
      )
    }

    return {
      name: 'dsh-humanizer-client',
      inject: ['slots'],
      apply: function (ctx) {
        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register(
            { name: 'settings.section', id: 'dsh-humanizer', order: 9000, label: '人味化' },
            HumanizerPanel
          )
        })
      },
    }
  },
})


