// dsh-humanizer 浏览器 half（产物入库：本文件即构建产物，等价于官方 esbuild/tsdown CJS 打包结果）
// 作用：在「设置 → 人味化」挂一个工作台面板，展示写作与润色总协议。
// 说明：面板是静态引导，实际执行由模型完成；没有工件与门禁，只有内容守卫。
window.__ModuleLoader__.load({
  id: 'dsh-humanizer',
  factory: function (require) {
    var React = require('react')

    var 理念 = [
      '你不执行方法，你学习全部理论，然后成为这次要写的人。',
      '理论完整地放在思考层，文本层不许露出理论的任何形状。',
      '文笔来自声音，句界来自感知与呼吸，温度来自在乎，没有机械感来自无痕。',
      '不评分，不检测，不画像，不配额，不产工件；无法证明修改必要，保持原文。',
    ]
    var 模式 = [
      '创作：读全，想完，成为作者；一口气写，写时忘记理论；写完听一遍，只改真实的不适，然后停。',
      '润色：把原文当成认真作者的草稿，不预设它是 AI；只改断了、硬了、凉了、空了、说多了的地方，其余一字不动；改完读接缝，然后停。',
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
        React.createElement('h1', { style: 样式.标题 }, '人味写作与润色'),
        React.createElement('p', { style: 样式.正文 }, '本插件让模型在动笔前完整读入理论，在思考中成为作者，然后把理论忘记。成品里看不见方法。'),
        React.createElement('h2', { style: 样式.小节 }, '核心理念'),
        React.createElement('ul', { style: 样式.列表 },
          理念.map(function (t) { return React.createElement('li', { key: t, style: 样式.条目 }, t) })),
        React.createElement('h2', { style: 样式.小节 }, '两个模式'),
        React.createElement('ol', { style: 样式.列表 },
          模式.map(function (t) { return React.createElement('li', { key: t, style: 样式.条目 }, t) })),
        React.createElement('h2', { style: 样式.小节 }, '怎么用'),
        React.createElement('p', { style: 样式.正文 }, '对模型说「用 humanizer 写这一章」或「用 humanizer 润色这段文本」。模型会先调 humanize_study 完整读一遍理论，然后开始写或改；中间没有工件、没有表格、没有门禁。'),
        React.createElement('p', { style: 样式.正文 }, '写完可以用 humanize_guard 核对一次内容锚点与文字完好性。它不评分、不检测、不画像。'),
        React.createElement('p', { style: 样式.弱化 }, '本插件是写作辅助，不是 AI 检测器；不输出概率、不声称识别作者、不要求提交外部检测。')
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
