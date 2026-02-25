import { Vector3 } from 'three'
import { S, gp } from './scene.js'
import { IMP, AUT, AUT_COLORS } from '../data/constants.js'
import { relToZ } from '../utils/risk-calc.js'

/**
 * HTML overlay labels — crisp DOM text projected from 3D to screen.
 * X = Impact, Y = Autonomy (height), Z = Reliability
 */
export function createLabels(container, camera, renderer) {
  const overlay = document.createElement('div')
  overlay.className = 'labels-overlay'
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;'
  container.appendChild(overlay)

  const labels = []

  function addLabel(worldPos, text, opts = {}) {
    const el = document.createElement('div')
    el.textContent = text
    el.style.cssText = `
      position:absolute;white-space:nowrap;
      font-family:'IBM Plex Mono',monospace;
      font-weight:${opts.weight || 600};
      font-size:${opts.size || 11}px;
      color:${opts.color || '#5c6a78'};
      transform:translate(${opts.alignRight ? '-100%' : '-50%'},-50%)${opts.rotate ? ' rotate(-90deg)' : ''};
      transition:opacity 0.3s;
    `
    if (opts.hidden) el.style.display = 'none'
    overlay.appendChild(el)
    const entry = { el, pos: new Vector3(...worldPos), opts, group: opts.group || 'always' }
    labels.push(entry)
    return el
  }

  // --- Always-visible labels (both 2D and 3D) ---

  // Z-axis title (Reliability)
  addLabel([-0.15, -0.05, S + 0.55], 'RELIABILITY →', { color: '#2d4a6f', size: 11, weight: 700 })

  // X-axis title (Blast Radius) — top-left, beside axis
  addLabel([S + 0.1, -0.05, -0.55], 'BLAST RADIUS ↑', { color: '#5c6a78', size: 11, weight: 700 })

  // Z-axis tick labels (reliability %, log-scale)
  const REL_TICKS = [70, 80, 90, 95, 99, 99.9]
  REL_TICKS.forEach(pct => {
    const label = pct === 99.9 ? '99.9%' : pct + '%'
    addLabel([-0.15, -0.05, relToZ(pct, S)], label, { color: '#2d4a6f', size: 10 })
  })

  // X-axis tick labels (blast radius levels)
  IMP.forEach((im, i) => {
    addLabel([gp(i + 1), -0.05, -0.12], 'B' + (i + 1) + ' ' + im.name, { color: '#5c6a78', size: 9, alignRight: true })
  })

  // --- Autonomy labels (3D mode only) ---

  // Y-axis title
  addLabel([0, S + 0.25, 0], 'AUTONOMY ↑', { color: AUT_COLORS[5].css, size: 11, weight: 700, group: 'autonomy', hidden: true })

  // Y-axis tick labels (autonomy levels) — colored per level
  AUT.forEach((a, i) => {
    addLabel([-0.05, gp(i + 1), -0.05], 'A' + (i + 1) + ' ' + a.name, {
      color: AUT_COLORS[i + 1].css, size: 10, alignRight: true, group: 'autonomy', hidden: true,
    })
  })

  // --- Infrastructure axis + gate labels (infra layer only) ---
  addLabel([S + 0.15, S + 0.25, S + 0.15], 'INFRASTRUCTURE ↑', {
    color: '#78716c', size: 11, weight: 700, group: 'infra', hidden: true,
  })

  const INFRA_NAMES = { 1: 'Open', 2: 'Logged', 3: 'Verified', 4: 'Authorized', 5: 'Contained' }
  for (let l = 1; l <= 5; l++) {
    addLabel([S + 0.15, gp(l), S + 0.15], `I${l} ${INFRA_NAMES[l]}`, {
      color: '#78716c', size: 9, group: 'infra', hidden: true,
    })
  }

  function update() {
    const rect = renderer.domElement.getBoundingClientRect()
    labels.forEach(({ el, pos }) => {
      if (el.style.display === 'none') return
      const projected = pos.clone().project(camera)
      const x = (projected.x * 0.5 + 0.5) * rect.width
      const y = (-projected.y * 0.5 + 0.5) * rect.height
      el.style.left = x + 'px'
      el.style.top = y + 'px'
    })
  }

  function setMode(is3D, showInfra) {
    labels.forEach(({ el, group }) => {
      if (group === 'autonomy') {
        el.style.display = is3D ? '' : 'none'
      }
      if (group === 'infra') {
        el.style.display = (is3D && showInfra) ? '' : 'none'
      }
    })
  }

  return { update, setMode }
}
