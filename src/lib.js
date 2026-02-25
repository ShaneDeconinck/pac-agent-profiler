import './lib.css'
import Alpine from 'alpinejs'
import { registerStore } from './data/store.js'
import { initThree } from './three/index.js'
import { initIntroScene } from './three/intro-scene.js'
import graphTpl from './templates/graph.html?raw'
import panelTpl from './templates/panel.html?raw'
import modalsTpl from './templates/modals.html?raw'

let alpineReady = false
let modalsWired = false

function wireModals() {
  if (modalsWired) return
  modalsWired = true
  window.__showHelp = function () {
    var el = document.querySelector('[data-pac-help]')
    if (el) el.classList.remove('hidden')
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var help = document.querySelector('[data-pac-help]')
      var howto = document.querySelector('[data-pac-howto]')
      if (help) help.classList.add('hidden')
      if (howto) howto.classList.add('hidden')
    }
  })
}

function ensureAlpine() {
  if (alpineReady) return
  alpineReady = true
  registerStore()
  window.Alpine = Alpine
  Alpine.start()
}

function bootThree(container) {
  const vizEl = container.querySelector('[data-pac-viz]')
  const tipEl = container.querySelector('[data-pac-tip]')
  if (!vizEl) return

  function tryBoot() {
    if (vizEl.clientWidth === 0) {
      requestAnimationFrame(tryBoot)
      return
    }
    initThree(vizEl, tipEl)
    const store = Alpine.store('pac')
    if (window.__threeUpdate) window.__threeUpdate('dots', store)
  }

  requestAnimationFrame(tryBoot)
}

export function mount(container, options = {}) {
  container.innerHTML =
    '<div style="display:flex;height:100%" x-data x-cloak>' +
      '<div style="flex:1">' + graphTpl + '</div>' +
      '<div class="pac-panel" style="width:360px;max-width:30%;flex-shrink:0">' + panelTpl + '</div>' +
    '</div>' +
    modalsTpl
  ensureAlpine()
  wireModals()
  bootThree(container)
}

export function mountGraph(container, options = {}) {
  container.innerHTML = graphTpl + modalsTpl
  ensureAlpine()
  wireModals()
  bootThree(container)
}

export function mountPanel(container, options = {}) {
  container.innerHTML = panelTpl + modalsTpl
  ensureAlpine()
  wireModals()
}

export function mountIntro(container) {
  let scene = null
  function tryBoot(attempt) {
    if (attempt > 30) return
    if (!container || container.clientWidth === 0) {
      setTimeout(() => tryBoot(attempt + 1), 100)
      return
    }
    scene = initIntroScene(container)
  }
  tryBoot(0)
  return {
    highlight(dim) { if (scene) scene.highlight(dim) },
    destroy() { if (scene) { scene.destroy(); scene = null } },
  }
}
