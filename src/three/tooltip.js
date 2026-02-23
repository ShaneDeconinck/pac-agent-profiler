import { Raycaster, Vector2, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide } from 'three'
import { AUT, IMP, BIZ } from '../data/constants.js'
import { reqRel, reqRelForAutonomy, relToZ } from '../utils/risk-calc.js'
import { S, cell } from './scene.js'

export function createTooltip(camera, renderer, tipEl) {
  const rc = new Raycaster()
  const mouse = new Vector2(-9, -9)
  let dotMeshes = []
  let shelfMeshes = []
  let currentConfig = null
  let selectedIdx = -1

  // Highlight plane — vertical wall at threshold
  const hlGeo = new PlaneGeometry(1, 1)
  const hlMat = new MeshBasicMaterial({
    color: 0x3b82f6, transparent: true, opacity: 0.15,
    side: DoubleSide, depthWrite: false,
  })
  const hlMesh = new Mesh(hlGeo, hlMat)
  hlMesh.visible = false

  renderer.domElement.addEventListener('pointermove', e => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  })

  renderer.domElement.addEventListener('click', () => {
    rc.setFromCamera(mouse, camera)
    const hits = rc.intersectObjects(dotMeshes)
    if (hits.length > 0) {
      const clickedIdx = hits[0].object.userData.idx
      selectedIdx = selectedIdx === clickedIdx ? -1 : clickedIdx
    } else {
      selectedIdx = -1
    }
    applySelection()
    if (window.__panelSelect) window.__panelSelect(selectedIdx)
  })

  // Ghost color for non-selected dots — very light so phong shading doesn't darken them
  const GHOST = 0xe8ecf0

  function applySelection() {
    dotMeshes.forEach(m => {
      const mat = m.material
      const origColor = m.userData.ok ? 0x10b981 : 0xef4444
      if (selectedIdx === -1) {
        mat.color.setHex(origColor)
        mat.emissive.setHex(origColor)
        mat.emissiveIntensity = 0.5
        mat.opacity = 1
        mat.transparent = false
      } else if (m.userData.idx === selectedIdx) {
        mat.color.setHex(origColor)
        mat.emissive.setHex(origColor)
        mat.emissiveIntensity = 0.6
        mat.opacity = 1
        mat.transparent = false
      } else {
        mat.color.setHex(GHOST)
        mat.emissive.setHex(GHOST)
        mat.emissiveIntensity = 0.1
        mat.opacity = 0.18
        mat.transparent = true
      }
    })
  }

  function setDotMeshes(meshes) {
    dotMeshes = meshes
    selectedIdx = -1
  }

  function highlightByIndex(idx) {
    selectedIdx = idx
    applySelection()
  }

  function setConfig(config) {
    currentConfig = config
  }

  function setShelfMeshes(meshes) {
    shelfMeshes = meshes
  }

  function positionTip() {
    const rect = renderer.domElement.getBoundingClientRect()
    tipEl.style.left = Math.min(
      (mouse.x * 0.5 + 0.5) * rect.width + rect.left + 12,
      window.innerWidth - 280,
    ) + 'px'
    tipEl.style.top = Math.max(
      (-mouse.y * 0.5 + 0.5) * rect.height + rect.top - 12,
      10,
    ) + 'px'
  }

  function showDotTip(m, cases) {
    const ud = m.userData
    const c = cases[ud.idx]
    const im = IMP[c.impact - 1]
    const biz = BIZ[(c.bizValue || 1) - 1]
    const thresholds = currentConfig?.thresholds
    const escalation = currentConfig?.autonomyEscalation

    if (ud.flat) {
      const ok = ud.ok
      tipEl.innerHTML = `<div class="tip-name">${c.name}${c.spawns ? ' 🔀' : ''}</div>
        <div class="tip-detail">B${c.impact} ${im.name} · V${c.bizValue || 1} ${biz.name} · ${c.reliability}% · Req: ${(reqRel(c.impact, thresholds) * 100).toFixed(0)}%</div>
        <div class="tip-status ${ok ? 'tip-ok' : 'tip-bad'}">${ok ? '✓ Above governance line' : '✗ Below — needs ' + (reqRel(c.impact, thresholds) * 100 - c.reliability).toFixed(0) + '% more'}</div>`
    } else {
      const res = ud.res
      const aL = AUT[res.actual - 1]
      let sc, st
      if (ud.ok) {
        sc = 'tip-ok'
        st = res.infraLimited
          ? `✓ A${res.actual} (infra ceiling — governance allows A${res.potential})`
          : `✓ Cleared at A${res.actual} ${aL.name}`
      } else {
        sc = 'tip-bad'
        st = `✗ Reliability insufficient for A${res.actual}`
      }
      tipEl.innerHTML = `<div class="tip-name">${c.name}${c.spawns ? ' 🔀' : ''}</div>
        <div class="tip-detail">B${c.impact} ${im.name} · V${c.bizValue || 1} ${biz.name} · ${c.reliability}%<br>
        A${res.actual} ${aL.name} · I${res.actual} ${aL.inf}</div>
        <div class="tip-status ${sc}">${st}</div>`
    }
  }

  function positionTipAtDot(m) {
    const v = new Vector3().copy(m.position)
    v.project(camera)
    const rect = renderer.domElement.getBoundingClientRect()
    const sx = (v.x * 0.5 + 0.5) * rect.width + rect.left
    const sy = (-v.y * 0.5 + 0.5) * rect.height + rect.top
    tipEl.style.left = Math.min(sx + 16, window.innerWidth - 280) + 'px'
    tipEl.style.top = Math.max(sy - 12, 10) + 'px'
  }

  function checkHover(cases) {
    rc.setFromCamera(mouse, camera)
    const hits = rc.intersectObjects(dotMeshes)
    const thresholds = currentConfig?.thresholds
    const escalation = currentConfig?.autonomyEscalation

    if (hits.length > 0) {
      hlMesh.visible = false
      const m = hits[0].object
      tipEl.style.display = 'block'
      positionTip()
      showDotTip(m, cases)
    } else if (selectedIdx >= 0 && dotMeshes.length > 0) {
      // Show tooltip anchored to selected dot
      hlMesh.visible = false
      const m = dotMeshes.find(d => d.userData.idx === selectedIdx)
      if (m) {
        tipEl.style.display = 'block'
        positionTipAtDot(m)
        showDotTip(m, cases)
      }
    } else if (shelfMeshes.length > 0) {
      // Raycast only against horizontal shelf meshes — first hit = topmost visible shelf
      const shelfHits = rc.intersectObjects(shelfMeshes)
      if (shelfHits.length > 0) {
        const hit = shelfHits[0]
        const { level: autLevel, impact } = hit.object.userData
        const im = IMP[impact - 1]

        // Position highlight wall at threshold
        if (thresholds) {
          const thresholdZ = relToZ(reqRelForAutonomy(impact, autLevel, thresholds, escalation) * 100, S)
          const xStart = (impact - 1) * cell
          hlMesh.scale.set(cell, cell, 1)
          hlMesh.position.set(xStart + cell / 2, (autLevel - 0.5) * cell, thresholdZ)
          hlMesh.visible = true
        }

        tipEl.style.display = 'block'
        positionTip()

        const aL = AUT[autLevel - 1]
        const threshold = reqRelForAutonomy(impact, autLevel, thresholds, escalation) * 100
        tipEl.innerHTML = `<div class="tip-detail">B${impact} ${im.name} · A${autLevel} ${aL.name}</div>
          <div class="tip-status tip-ok">Threshold: ${threshold.toFixed(1)}%</div>`
      } else {
        hlMesh.visible = false
        tipEl.style.display = 'none'
      }
    } else {
      hlMesh.visible = false
      tipEl.style.display = 'none'
    }
  }

  return { checkHover, setDotMeshes, setConfig, setShelfMeshes, highlightByIndex, hlMesh }
}
