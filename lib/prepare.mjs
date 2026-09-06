import { buildStudyPackage } from './study.mjs'

const FOCUS = {
  voice: ['06', '20'], continuity: ['06', '09'], flow: ['04', '20'],
  dialogue: ['09', '16'], evidence: ['08', '06'], polishing: ['19', '10'],
}

export function prepareReading(textType = 'fiction', mode = 'authoring', focus = '') {
  const full = buildStudyPackage(textType, mode)
  const selected = new Set(['02', '20', full.meta.textType === 'article' ? '08' : '09'])
  const names = focus.split(/[\s,，]+/).filter(Boolean)
  for (const name of names) {
    if (!FOCUS[name]) throw new Error(`Unknown focus: ${name}. Use ${Object.keys(FOCUS).join(', ')}`)
    for (const key of FOCUS[name]) selected.add(key)
  }
  if (full.meta.mode === 'polishing') for (const key of FOCUS.polishing) selected.add(key)
  const chapters = full.chapters.filter(c => selected.has(c.name.slice(0, 2)))
  return { mode: full.meta.mode, textType: full.meta.textType, focus: names, mode_contract: full.mode_contract, chapters,
    selectedCharacters: chapters.reduce((n, c) => n + c.text.length, 0),
    fullCharacters: full.chapters.reduce((n, c) => n + c.text.length, 0),
    note: 'Selected chapters are complete original text, not summaries. Reading is not proof of understanding. Use humanize_reference for another issue or humanize_study for the complete library. Apply knowledge to the material; never impose prose quotas.' }
}
