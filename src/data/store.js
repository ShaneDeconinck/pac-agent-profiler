import Alpine from 'alpinejs'
import { AUT, IMP, BIZ } from './constants.js'
import { EXAMPLE_CASES } from './examples.js'
import { maxAut, reqRel, reqRelForAutonomy } from '../utils/risk-calc.js'
import { loadState, saveState } from '../utils/persistence.js'
import { decodeFromHash, encodeToHash, exportJSON, importJSON } from '../utils/sharing.js'

const DEFAULT_INFRA = { 1: false, 2: false, 3: false, 4: false, 5: false }
const DEFAULT_CONFIG = {
  thresholds: [0, 0.80, 0.90, 0.95, 0.97, 0.99],
  autonomyEscalation: 0.25,
  minReliability: 70,
}

export function registerStore() {
  // Load initial state: URL hash > localStorage > defaults
  const hashState = decodeFromHash()
  const savedState = loadState()
  const initial = hashState || savedState

  // Always start on examples, unless a share link was provided
  const startMode = hashState ? 'custom' : 'examples'
  const startCases = startMode === 'custom'
    ? (hashState?.cases || []).map(c => ({ ...c, infra: c.infra || { ...DEFAULT_INFRA } }))
    : EXAMPLE_CASES.map(c => ({ ...c }))

  // Load saved config (from localStorage only, not affected by mode)
  const savedConfig = (savedState || hashState)?.config
  const startConfig = savedConfig
    ? { ...DEFAULT_CONFIG, ...savedConfig }
    : { ...DEFAULT_CONFIG }

  Alpine.store('pac', {
    // Data
    cases: startCases,
    mode: startMode,
    layers: { base: true, autonomy: false, infra: false, surface: false },
    config: startConfig,
    showConfig: false,

    showForm: false,
    _autonomyClicked: false,

    // Form state
    form: {
      name: '',
      bizValue: 1,
      impact: 1,
      reliability: 85,
      spawns: false,
      deputyResistant: false,
      infra: { ...DEFAULT_INFRA },
    },

    // Constants for templates
    AUT,
    IMP,
    BIZ,

    // Computed helpers
    thresholdAt(impact, autonomy) {
      const { thresholds, autonomyEscalation } = this.config
      return (reqRelForAutonomy(impact, autonomy, thresholds, autonomyEscalation) * 100).toFixed(1)
    },

    caseCount() {
      const n = this.cases.length
      return n === 0 ? 'No cases yet' : n + ' case' + (n !== 1 ? 's' : '')
    },

    caseStatus(c) {
      const { thresholds, autonomyEscalation } = this.config
      const res = maxAut(c, c.infra, thresholds, autonomyEscalation)
      const relOk = (c.reliability / 100) >= reqRel(c.impact, thresholds)
      if (this.layers.autonomy) {
        const aL = AUT[res.actual - 1]
        const label = res.infraLimited
          ? `A${res.actual} ${aL.name} (→A${res.potential})`
          : `A${res.actual} ${aL.name}`
        return { status: { label, type: 'aut' }, ghost: null }
      }
      if (relOk) {
        return { status: { label: '✓', type: 'ok' }, ghost: null }
      }
      const gap = (reqRel(c.impact, thresholds) * 100 - c.reliability).toFixed(0)
      return { status: { label: `✗ -${gap}%`, type: 'bad' }, ghost: null }
    },

    // Mode switching
    switchMode(mode) {
      if (mode === this.mode) return
      this.mode = mode
      if (mode === 'examples') {
        this.cases = EXAMPLE_CASES.map(c => ({ ...c }))
      } else {
        const saved = loadState()
        const custom = (saved?.cases || []).filter(c => !String(c.id).startsWith('ex-'))
        this.cases = custom.map(c => ({ ...c, infra: c.infra || { ...DEFAULT_INFRA } }))
      }
      this._notifyThree('dots')
    },

    _ensureCustomMode() {
      if (this.mode === 'examples') {
        this.mode = 'custom'
        const saved = loadState()
        const custom = (saved?.cases || []).filter(c => !String(c.id).startsWith('ex-'))
        this.cases = custom.map(c => ({ ...c, infra: c.infra || { ...DEFAULT_INFRA } }))
      }
    },

    // Actions
    addCase() {
      if (!this.form.name.trim()) return
      this._ensureCustomMode()
      this.cases.push({
        name: this.form.name.trim(),
        bizValue: this.form.bizValue,
        impact: this.form.impact,
        reliability: this.form.reliability,
        spawns: this.form.spawns,
        deputyResistant: this.form.deputyResistant,
        infra: { ...this.form.infra },
        id: Date.now(),
      })
      this.form = { name: '', bizValue: 1, impact: 1, reliability: 85, spawns: false, deputyResistant: false, infra: { ...DEFAULT_INFRA } }

      this.showForm = false
      this._persist()
      this._notifyThree('dots')
    },

    removeCase(id) {
      this._ensureCustomMode()
      this.cases = this.cases.filter(c => c.id !== id)
      this._persist()
      this._notifyThree('dots')
    },

    editCase(id) {
      const c = this.cases.find(c => c.id === id)
      if (!c) return
      this._ensureCustomMode()
      this.showForm = true
      this.form = {
        name: c.name,
        bizValue: c.bizValue || 1,
        impact: c.impact,
        reliability: c.reliability,
        spawns: c.spawns || false,
        deputyResistant: c.deputyResistant || false,
        infra: { ...c.infra },
      }
      this.cases = this.cases.filter(c => c.id !== id)
      this._persist()
      this._notifyThree('dots')
    },

    setImpact(val) {
      this.form.impact = val
    },

    setBizValue(val) {
      this.form.bizValue = val
    },

    toggleFormInfra(l) {
      this.form.infra[l] = !this.form.infra[l]
      // Cascade: enabling a level enables all below, disabling disables all above
      if (this.form.infra[l]) {
        for (let i = 1; i < l; i++) this.form.infra[i] = true
      } else {
        for (let i = l; i <= 5; i++) this.form.infra[i] = false
      }
    },

    toggleCaseInfra(id, l) {
      this._ensureCustomMode()
      const c = this.cases.find(x => x.id === id)
      if (!c) return
      c.infra[l] = !c.infra[l]
      if (c.infra[l]) {
        for (let i = 1; i < l; i++) c.infra[i] = true
      } else {
        for (let i = l; i <= 5; i++) c.infra[i] = false
      }
      this._persist()
      this._notifyThree('dots')
    },

    toggleLayer(name) {
      if (name === 'base') return
      if (name === 'autonomy') this._autonomyClicked = true
      this.layers[name] = !this.layers[name]

      // Infra always follows autonomy
      if (this.layers.autonomy) {
        this.layers.infra = true
      } else {
        this.layers.infra = false
        this.layers.surface = false
      }

      this._notifyThree('layers')
    },

    // Sharing
    shareLink() {
      const state = { cases: this.cases, config: this.config }
      const hash = encodeToHash(state)
      window.location.hash = hash.slice(1)
      navigator.clipboard?.writeText(window.location.href)
    },

    exportData() {
      exportJSON({ cases: this.cases })
    },

    async importData() {
      const data = await importJSON()
      if (data?.cases) {
        this._ensureCustomMode()
        this.cases = data.cases.map(c => ({
          ...c,
          infra: c.infra || { ...DEFAULT_INFRA },
        }))
        this._persist()
        this._notifyThree('dots')
      }
    },

    // Config
    toggleConfig() {
      this.showConfig = !this.showConfig
    },

    updateThreshold(impact, value) {
      this.config.thresholds[impact] = value
      this._persist()
      this._notifyThree('dots')
    },

    updateAutonomyEscalation(value) {
      this.config.autonomyEscalation = value
      this._persist()
      this._notifyThree('dots')
    },

    updateMinReliability(value) {
      this.config.minReliability = value
      this._persist()
      this._notifyThree('dots')
    },

    resetConfig() {
      this.config = { ...DEFAULT_CONFIG, thresholds: [...DEFAULT_CONFIG.thresholds] }
      this._persist()
      this._notifyThree('dots')
    },

    // Internal
    _persist() {
      if (this.mode === 'custom') {
        saveState({ cases: this.cases, config: this.config })
      } else {
        // Only persist config changes in examples mode, not the example cases
        saveState({ cases: [], config: this.config })
      }
    },

    _notifyThree(type) {
      if (window.__threeUpdate) {
        window.__threeUpdate(type, this)
      }
    },
  })
}
