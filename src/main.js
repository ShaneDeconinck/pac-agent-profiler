import './main.css'
import Alpine from 'alpinejs'
import { registerStore } from './data/store.js'
import { initThree } from './three/index.js'
import { initIntroScene } from './three/intro-scene.js'

// Register Alpine store before starting
registerStore()

// Start Alpine
window.Alpine = Alpine
Alpine.start()

// Init Three.js after DOM is fully laid out
function boot() {
  const container = document.getElementById('vizContainer')
  const tipEl = document.getElementById('tip')
  if (!container || !tipEl) return

  // Wait until container has actual dimensions
  if (container.clientWidth === 0 || container.clientHeight === 0) {
    requestAnimationFrame(boot)
    return
  }

  initThree(container, tipEl)

  // Trigger initial render from store state
  const store = Alpine.store('pac')
  if (window.__threeUpdate) {
    window.__threeUpdate('dots', store)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  requestAnimationFrame(boot)
}

// Intro scene
let introScene = null
let introTimer = null

function bootIntro(attempt) {
  clearTimeout(introTimer)
  if (introScene) return
  attempt = attempt || 0
  if (attempt > 30) return
  const el = document.getElementById('intro-viz')
  if (!el || el.clientWidth === 0 || el.clientHeight === 0) {
    introTimer = setTimeout(() => bootIntro(attempt + 1), 100)
    return
  }
  introScene = initIntroScene(el)
  window.__introHL = (dim) => { if (introScene) introScene.highlight(dim) }
}

window.__bootIntro = () => {
  clearTimeout(introTimer)
  introScene = null
  bootIntro(0)
}

window.__destroyIntro = () => {
  clearTimeout(introTimer)
  if (introScene) {
    introScene.destroy()
    introScene = null
    window.__introHL = null
  }
}

bootIntro(0)
