// dsh-humanizer 浏览器 half（产物入库：本文件即构建产物，等价于官方 esbuild/tsdown CJS 打包结果）
// 作用：在「设置 → 人味化」挂一个工作台面板，提供自然语言任务模板。
// 说明：面板提供可编辑模板；实际记忆读写由会话工具完成，面板不冒充实时数据库视图。
window.__ModuleLoader__.load({
  id: 'dsh-humanizer',
  factory: function (require) {
    var React = require('react')

    var 理念 = [
      '记住有出处的人物关系、伏笔与文风偏好；作品之间隔离。',
      '定稿、草稿和设想分开；推断不当事实，矛盾保留到核对后再修订。',
      '按当前问题读相关理论全文，保留完整学习入口。',
      '润色保住原意和作者声音，不按句长、比例或检测分塑造文本。',
    ]
    var 模板 = [
      { label: '继续长篇', text: '用 humanizer 继续《作品名》。先恢复人物关系、作者声音、未回收伏笔和上次进度，再写本章。当前任务：……。完成后保存有出处的新增草稿记忆和下一步；不要把草稿当定稿。' },
      { label: '忠实润色', text: '用 humanizer 润色《文章名》中的下面这段。先理解作者声音，保留事实、人名、术语和有功能重复，只修改确有必要的地方。我的偏好：……。原文：……' },
      { label: '查看记忆', text: '查看 humanizer 中《作品名》的记忆。先列出当前工作区已有作品，再切换到这部作品；查看人物名：……，展示相关关系、出处、故事时点、草稿或定稿状态以及未解决的矛盾。' },
      { label: '修正设定', text: '修正 humanizer 中《作品名》关于……的记忆。先查看已有记录和版本，我的新设定是：……。保留修订历史，不把新旧设定混用。' },
      { label: '遗忘一条', text: '请遗忘 humanizer 中《作品名》的这一条记忆：……。先确定对应 key 与当前版本，再删除该条所有历史内容。告诉我还保留哪些记录；dsh 会话日志不在插件删除范围内。' },
    ]

    var 样式 = {
      标题: { fontSize: '16px', fontWeight: 600, margin: '0 0 12px' },
      小节: { fontSize: '13px', fontWeight: 600, margin: '16px 0 8px' },
      正文: { fontSize: '13px', margin: '4px 0', lineHeight: '1.6', color: 'var(--dsw-alias-label-primary, inherit)' },
      弱化: { fontSize: '12px', margin: '4px 0', lineHeight: '1.6', color: 'var(--dsw-alias-label-secondary, inherit)' },
      列表: { margin: '4px 0', paddingLeft: '20px' },
      条目: { fontSize: '13px', margin: '2px 0', lineHeight: '1.6' },
    }

    function HumanizerPanel() {
      var draftState = React.useState(模板[0].text)
      var draft = draftState[0], setDraft = draftState[1]
      var statusState = React.useState('')
      var status = statusState[0], setStatus = statusState[1]
      async function copy() {
        try {
          await navigator.clipboard.writeText(draft)
          setStatus('已复制。回到对话粘贴并发送即可。')
        } catch (_) {
          setStatus('浏览器未允许复制，请选中文本框内容后手动复制。')
        }
      }
      return React.createElement(
        'div',
        { style: { padding: '16px', maxWidth: '720px', color: 'var(--dsw-alias-label-primary, inherit)', overflowWrap: 'anywhere' } },
        React.createElement('h1', { style: 样式.标题 }, '人味写作与润色'),
        React.createElement('p', { style: 样式.正文 }, '为长篇小说和文章润色保留材料、声音与进度。先选择一个起点，改好作品名和任务，再把请求发给模型。'),
        React.createElement('h2', { style: 样式.小节 }, '核心理念'),
        React.createElement('ul', { style: 样式.列表 },
          理念.map(function (t) { return React.createElement('li', { key: t, style: 样式.条目 }, t) })),
        React.createElement('h2', { style: 样式.小节 }, '开始或继续'),
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' } },
          模板.map(function (item) { return React.createElement('button', { key: item.label, type: 'button', onClick: function () { setDraft(item.text); setStatus('') }, style: { padding: '6px 10px', borderRadius: '6px', border: '1px solid currentColor', color: 'inherit', background: 'transparent', cursor: 'pointer' } }, item.label) })),
        React.createElement('label', { htmlFor: 'humanizer-request', style: 样式.正文 }, '修改作品名、人物名和当前任务'),
        React.createElement('textarea', { id: 'humanizer-request', value: draft, onChange: function (event) { setDraft(event.target.value); setStatus('') }, rows: 6, style: { display: 'block', boxSizing: 'border-box', width: '100%', padding: '10px', margin: '8px 0', color: 'inherit', background: 'transparent', border: '1px solid currentColor', borderRadius: '6px', lineHeight: '1.7', resize: 'vertical' } }),
        React.createElement('button', { type: 'button', onClick: copy, style: { padding: '7px 14px', border: '1px solid currentColor', borderRadius: '6px', color: 'inherit', background: 'transparent', cursor: 'pointer' } }, '复制请求'),
        React.createElement('p', { role: 'status', 'aria-live': 'polite', style: 样式.弱化 }, status),
        React.createElement('h2', { style: 样式.小节 }, '记忆如何工作'),
        React.createElement('p', { style: 样式.正文 }, '记忆保存在本机 dsh 数据目录，按工作区与作品隔离。新会话说出同一作品名即可恢复；关系记录附带原文摘录，修正会保留历史。未提供工作目录或关闭记忆时仍可使用写作理论。'),
        React.createElement('p', { style: 样式.弱化 }, '这里是请求模板，不是实时记忆列表。查看实际记录请使用“查看记忆”模板。只会记住模型成功保存的内容；自动召回有长度预算，必要时按人物名补查。'),
        React.createElement('p', { style: 样式.弱化 }, '本插件是写作辅助，不是 AI 检测器；不输出概率、不声称识别作者、不要求提交外部检测。')
      )
    }

    return {
      name: 'dsh-humanizer-client',
      inject: ['slots'],
      apply: function (ctx) {
        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register(
            { name: 'settings.section', id: 'dsh-humanizer', order: 9000, label: function () { return '人味化' } },
            HumanizerPanel
          )
        })
      },
    }
  },
})
