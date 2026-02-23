import { createScene } from './scene.js'
import { buildGrid } from './grid.js'
import { buildAutonomyLayer } from './autonomy.js'
import { buildInfraLayer } from './infrastructure.js'
import { buildSurface } from './surface.js'
import { buildDots } from './dots.js'
import { createCameraControls } from './camera-controls.js'
import { createTooltip } from './tooltip.js'
import { createLabels } from './labels.js'

export function initThree(container, tipEl) {
  const { scene, camera, renderer } = createScene(container)

  // Immediate resize — ensure canvas matches container from the start
  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    cam.onResize(w, h)
    labels.update()
  }

  // Grid lines (always visible)
  buildGrid(scene)

  // HTML overlay labels (crisp text, always visible)
  const labels = createLabels(container, camera, renderer)

  // Layer groups
  let autGroup = buildAutonomyLayer()
  scene.add(autGroup)

  let infraGroup = buildInfraLayer()
  scene.add(infraGroup)

  let surf = buildSurface()
  scene.add(surf.group)

  function rebuildSurface(config) {
    const vis = surf.group.visible
    scene.remove(surf.group)
    surf.group.traverse(child => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
    surf = buildSurface(config)
    surf.group.visible = vis
    scene.add(surf.group)
    tooltip.setShelfMeshes(vis ? surf.shelfMeshes : [])
  }

  // Dots
  let dotsGroup = null
  let dotMeshes = []

  // Camera
  const cam = createCameraControls(camera, renderer)

  // Tooltip + highlight mesh
  const tooltip = createTooltip(camera, renderer, tipEl)
  scene.add(tooltip.hlMesh)

  // Bridge for panel hover → dot highlight
  window.__threeHighlight = function (idx) {
    tooltip.highlightByIndex(idx)
  }

  // Resize handling — immediate + observer + window
  resize()
  new ResizeObserver(resize).observe(container)
  window.addEventListener('resize', resize)

  // Animate
  let currentCases = []
  function animate() {
    requestAnimationFrame(animate)
    tooltip.checkHover(currentCases)
    labels.update()
    renderer.render(scene, camera)
  }
  animate()

  function rebuildDots(store, animateRise) {
    if (dotsGroup) {
      scene.remove(dotsGroup)
      dotsGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })
    }
    const result = buildDots(store.cases, null, store.layers, store.config)
    dotsGroup = result.group
    dotMeshes = result.meshes
    scene.add(dotsGroup)
    tooltip.setDotMeshes(dotMeshes)
    tooltip.setConfig(store.config)

    // Animate dots rising from floor to their autonomy Y position
    if (animateRise && dotMeshes.length > 0) {
      const targets = dotMeshes.map(m => m.position.y)
      dotMeshes.forEach(m => { m.position.y = 0.06 }) // start at floor
      const t0 = performance.now()
      const dur = 500
      function tick() {
        const t = Math.min(1, (performance.now() - t0) / dur)
        const e = 1 - Math.pow(1 - t, 3) // ease-out cubic
        dotMeshes.forEach((m, i) => {
          m.position.y = 0.06 + (targets[i] - 0.06) * e
        })
        if (t < 1) requestAnimationFrame(tick)
      }
      tick()
    }
  }

  // Bridge: called from Alpine store
  let prevAutonomy = false
  window.__threeUpdate = function (type, store) {
    currentCases = store.cases

    if (type === 'dots') {
      rebuildDots(store)
      rebuildSurface(store.config)
    }

    if (type === 'layers') {
      const autonomyJustToggled = store.layers.autonomy !== prevAutonomy
      prevAutonomy = store.layers.autonomy

      if (store.layers.autonomy && autonomyJustToggled) {
        // Entering 3D: camera tilts, then reveal autonomy axis
        rebuildDots(store)
        cam.setLayerMode(true, () => {
          autGroup.visible = true
          labels.setMode(true, store.layers.infra)
        })
      } else if (!store.layers.autonomy && autonomyJustToggled) {
        // Returning to 2D: hide autonomy immediately, rebuild dots, animate camera
        autGroup.visible = false
        labels.setMode(false, false)
        rebuildDots(store)
        cam.setLayerMode(false)
      } else {
        // Other layer toggle (infra, surface) — just rebuild dots, no animation
        rebuildDots(store)
      }

      infraGroup.visible = store.layers.infra
      labels.setMode(store.layers.autonomy, store.layers.infra)
      surf.group.visible = store.layers.surface
      tooltip.setShelfMeshes(store.layers.surface ? surf.shelfMeshes : [])
    }
  }
}
