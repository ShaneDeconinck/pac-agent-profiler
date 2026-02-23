import { Vector3 } from 'three'
import { S } from './scene.js'

export function createCameraControls(camera, renderer) {
  let dragging = false
  let prev = { x: 0, y: 0 }
  let is3D = false

  // Camera state
  // theta=PI so camera tilts to -X side in 3D, keeping Z (reliability) going right on screen
  let sph = { theta: Math.PI, phi: 0.001, radius: 4.8 }
  const tgt = new Vector3(S / 2 + 0.4, 0, S / 2)
  const up = new Vector3(1, 0, 0) // 2D: X (impact) points up on screen

  // Target states — theta stays PI for both, only phi/radius change
  const VIEW_2D = { theta: Math.PI, phi: 0.001, radius: 4.8 }
  const VIEW_3D = { theta: 2.915, phi: 1.481, radius: 6.2 }

  // Camera debug readout — click to toggle
  let dbg = document.getElementById('cam-debug')
  if (!dbg) {
    dbg = document.createElement('div')
    dbg.id = 'cam-debug'
    dbg.style.cssText = 'position:fixed;bottom:4px;left:4px;z-index:999;font:9px/1.3 monospace;color:#5c6a78;opacity:0;cursor:pointer;padding:2px 5px;border-radius:3px;transition:opacity 0.2s;'
    dbg.title = 'Camera params'
    dbg.addEventListener('click', () => { dbg._on = !dbg._on; dbg.style.opacity = dbg._on ? 0.7 : 0 })
    document.body.appendChild(dbg)
    // Triple-click bottom-left corner to reveal
    let clicks = 0, timer
    const corner = document.createElement('div')
    corner.style.cssText = 'position:fixed;bottom:0;left:0;width:20px;height:20px;z-index:1000;'
    corner.addEventListener('click', () => {
      clicks++
      clearTimeout(timer)
      timer = setTimeout(() => { clicks = 0 }, 400)
      if (clicks >= 3) { dbg._on = !dbg._on; dbg.style.opacity = dbg._on ? 0.7 : 0; clicks = 0 }
    })
    document.body.appendChild(corner)
  }

  function updateCam() {
    if (sph.phi < 0.01) {
      // 2D: top-down view. up=(1,0,0) → X goes up, Z goes right on screen
      camera.position.set(tgt.x, tgt.y + sph.radius, tgt.z)
      camera.up.copy(up)
      camera.lookAt(tgt)
    } else {
      // 3D: orbital view
      camera.up.copy(up)
      camera.position.set(
        tgt.x + sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta),
        tgt.y + sph.radius * Math.cos(sph.phi),
        tgt.z + sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
      )
      camera.lookAt(tgt)
    }
    dbg.textContent = `θ=${sph.theta.toFixed(3)} φ=${sph.phi.toFixed(3)} r=${sph.radius.toFixed(1)} tgt=(${tgt.x.toFixed(1)},${tgt.y.toFixed(1)},${tgt.z.toFixed(1)})`
  }

  function animateCam(target, dur, onComplete) {
    const start = { phi: sph.phi, theta: sph.theta, radius: sph.radius }
    const startTgt = tgt.clone()
    const endTgt = target.tgt || tgt.clone()
    const startUp = up.clone()
    const endUp = target.up || up.clone()
    const t0 = performance.now()
    dur = dur || 700
    function tick() {
      const t = Math.min(1, (performance.now() - t0) / dur)
      const e = 1 - Math.pow(1 - t, 3)
      sph.phi = start.phi + (target.phi - start.phi) * e
      sph.theta = start.theta + (target.theta - start.theta) * e
      sph.radius = start.radius + (target.radius - start.radius) * e
      tgt.lerpVectors(startTgt, endTgt, e)
      up.lerpVectors(startUp, endUp, e).normalize()
      updateCam()
      if (t < 1) {
        requestAnimationFrame(tick)
      } else if (onComplete) {
        onComplete()
      }
    }
    tick()
  }

  function setLayerMode(showAutonomy, onComplete) {
    is3D = showAutonomy
    if (showAutonomy) {
      animateCam({
        ...VIEW_3D,
        tgt: new Vector3(S / 2, S * 0.55, S / 2),
        up: new Vector3(0, 1, 0),
      }, 700, onComplete)
    } else {
      animateCam({
        ...VIEW_2D,
        tgt: new Vector3(S / 2 + 0.4, 0, S / 2),
        up: new Vector3(1, 0, 0),
      }, 700, onComplete)
    }
  }

  // Pointer events — rotation only in 3D mode
  const el = renderer.domElement
  el.addEventListener('pointerdown', e => { dragging = true; prev = { x: e.clientX, y: e.clientY } })
  window.addEventListener('pointerup', () => { dragging = false })
  el.addEventListener('pointermove', e => {
    if (!dragging) return
    if (is3D) {
      sph.theta -= (e.clientX - prev.x) * 0.005
      sph.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, sph.phi + (e.clientY - prev.y) * 0.005))
    }
    prev = { x: e.clientX, y: e.clientY }
    updateCam()
  })
  el.addEventListener('wheel', e => {
    sph.radius = Math.max(3, Math.min(15, sph.radius + e.deltaY * 0.005))
    updateCam()
  })

  // Touch
  el.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, { passive: true })
  el.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return
    if (is3D) {
      sph.theta -= (e.touches[0].clientX - prev.x) * 0.005
      sph.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, sph.phi + (e.touches[0].clientY - prev.y) * 0.005))
    }
    prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    updateCam()
  }, { passive: true })
  el.addEventListener('touchend', () => { dragging = false })

  updateCam()

  // Adaptive radius based on container aspect ratio
  const baseRadius2D = VIEW_2D.radius
  const baseRadius3D = VIEW_3D.radius
  function onResize(w, h) {
    if (dragging || w === 0 || h === 0) return
    const aspect = w / h
    const scale = Math.max(1, 1.1 / aspect)
    VIEW_2D.radius = baseRadius2D * scale
    VIEW_3D.radius = baseRadius3D * scale
    if (!is3D) {
      sph.radius = VIEW_2D.radius
    } else {
      sph.radius = VIEW_3D.radius
    }
    updateCam()
  }

  return { updateCam, animateCam, setLayerMode, onResize }
}
