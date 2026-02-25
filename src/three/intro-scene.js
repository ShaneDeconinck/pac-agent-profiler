import {
  Scene, PerspectiveCamera, WebGLRenderer,
  AmbientLight, DirectionalLight, Vector3,
  LineBasicMaterial, BufferGeometry, Line,
  SphereGeometry, MeshPhongMaterial, Mesh,
  MeshBasicMaterial, PlaneGeometry, DoubleSide,
} from 'three'
import { S, cell, gp } from './scene.js'
import { relToZ, reqRelForAutonomy } from '../utils/risk-calc.js'

const DIM_CSS = {
  reliability: '#0891b2',
  blastRadius: '#c2410c',
  autonomy: '#7c3aed',
  businessValue: '#ca8a04',
  governance: '#2563eb',
  infrastructure: '#78716c',
}

export function initIntroScene(container) {
  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 100)
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  scene.add(new AmbientLight(0xaabbcc, 2.5))
  const dl = new DirectionalLight(0xffffff, 0.5)
  dl.position.set(5, 8, 5)
  scene.add(dl)

  // Floor grid
  const gridMat = new LineBasicMaterial({ color: 0x1e2a3a, transparent: true, opacity: 0.10 })
  for (let i = 0; i <= 5; i++) {
    const p = i * cell
    scene.add(new Line(new BufferGeometry().setFromPoints([new Vector3(p, 0, 0), new Vector3(p, 0, S)]), gridMat))
    scene.add(new Line(new BufferGeometry().setFromPoints([new Vector3(0, 0, p), new Vector3(S, 0, p)]), gridMat))
  }

  // Dimension materials — tracked for highlighting
  const dimMats = { reliability: [], blastRadius: [], autonomy: [], governance: [], infrastructure: [] }

  function addAxisLine(key, from, to, color, opacity) {
    const mat = new LineBasicMaterial({ color, transparent: true, opacity })
    scene.add(new Line(new BufferGeometry().setFromPoints([new Vector3(...from), new Vector3(...to)]), mat))
    dimMats[key].push({ mat, origOp: opacity })
  }

  // Z = Reliability (cyan)
  addAxisLine('reliability', [0, 0, 0], [0, 0, S + 0.3], 0x06b6d4, 0.6)
  // X = Blast Radius (amber)
  addAxisLine('blastRadius', [0, 0, 0], [S + 0.3, 0, 0], 0xf59e0b, 0.6)
  // Y = Autonomy (violet)
  addAxisLine('autonomy', [0, 0, 0], [0, S + 0.3, 0], 0xa78bfa, 0.6)

  // Y-axis colored segments + level markers
  const autCols = [0x93c5fd, 0x60a5fa, 0x3b82f6, 0x2563eb, 0x1d4ed8]
  for (let l = 1; l <= 5; l++) {
    addAxisLine('autonomy', [0, (l - 1) * cell, 0], [0, l * cell, 0], autCols[l - 1], 0.35)
    const hMat = new LineBasicMaterial({ color: autCols[l - 1], transparent: true, opacity: 0.12 })
    scene.add(new Line(new BufferGeometry().setFromPoints([new Vector3(0, l * cell, 0), new Vector3(S, l * cell, 0)]), hMat))
    scene.add(new Line(new BufferGeometry().setFromPoints([new Vector3(0, l * cell, 0), new Vector3(0, l * cell, S)]), hMat))
    dimMats.autonomy.push({ mat: hMat, origOp: 0.12 })
  }

  // --- Governance threshold staircase lines ---
  for (let aut = 1; aut <= 5; aut++) {
    const isSolid = aut === 1
    const govMat = new LineBasicMaterial({
      color: autCols[aut - 1], transparent: true,
      opacity: isSolid ? 0.7 : 0.35,
    })
    dimMats.governance.push({ mat: govMat, origOp: isSolid ? 0.7 : 0.35 })

    for (let imp = 1; imp <= 5; imp++) {
      const threshold = reqRelForAutonomy(imp, aut)
      const relPct = threshold * 100
      if (relPct > 99.9 || relPct < 65) continue
      const gz = relToZ(relPct, S)
      scene.add(new Line(
        new BufferGeometry().setFromPoints([
          new Vector3((imp - 1) * cell, 0.008, gz),
          new Vector3(imp * cell, 0.008, gz),
        ]),
        govMat,
      ))
    }
    for (let imp = 1; imp < 5; imp++) {
      const gz1 = relToZ(reqRelForAutonomy(imp, aut) * 100, S)
      const gz2 = relToZ(reqRelForAutonomy(imp + 1, aut) * 100, S)
      if (gz1 > S || gz2 > S) continue
      scene.add(new Line(
        new BufferGeometry().setFromPoints([
          new Vector3(imp * cell, 0.008, gz1),
          new Vector3(imp * cell, 0.008, gz2),
        ]),
        govMat,
      ))
    }
  }

  // Red/green floor zones
  for (let imp = 1; imp <= 5; imp++) {
    const threshold = reqRelForAutonomy(imp, 1)
    const relPct = threshold * 100
    if (relPct > 99.9 || relPct < 65) continue
    const gz = relToZ(relPct, S)
    const xStart = (imp - 1) * cell

    const rp = new PlaneGeometry(cell, gz)
    rp.rotateX(-Math.PI / 2)
    scene.add(new Mesh(rp, new MeshBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.04,
      side: DoubleSide, depthWrite: false,
    })).translateX(xStart + cell / 2).translateY(0.003).translateZ(gz / 2))

    const gLen = S - gz
    if (gLen > 0.01) {
      const gp2 = new PlaneGeometry(cell, gLen)
      gp2.rotateX(-Math.PI / 2)
      scene.add(new Mesh(gp2, new MeshBasicMaterial({
        color: 0x10b981, transparent: true, opacity: 0.03,
        side: DoubleSide, depthWrite: false,
      })).translateX(xStart + cell / 2).translateY(0.003).translateZ(gz + gLen / 2))
    }
  }

  // --- Infrastructure: full-size planes at each level (I1-I5) ---
  const INFRA_COL = 0x78716c
  addAxisLine('infrastructure', [S, 0, S], [S, S + 0.3, S], INFRA_COL, 0.4)
  for (let l = 1; l <= 5; l++) {
    const y = l * cell // top of each autonomy cell, matching main scene
    // Full S×S translucent plane
    const ipg = new PlaneGeometry(S, S)
    ipg.rotateX(-Math.PI / 2)
    const ipOp = 0.08
    const ipMat = new MeshBasicMaterial({ color: INFRA_COL, transparent: true, opacity: ipOp, side: DoubleSide, depthWrite: false })
    const ipMesh = new Mesh(ipg, ipMat)
    ipMesh.position.set(S / 2, y, S / 2)
    scene.add(ipMesh)
    dimMats.infrastructure.push({ mat: ipMat, origOp: ipOp })
    // Border outline
    const bp = [[0, y, 0], [S, y, 0], [S, y, S], [0, y, S], [0, y, 0]].map(v => new Vector3(...v))
    const borderMat = new LineBasicMaterial({ color: INFRA_COL, transparent: true, opacity: 0.25 })
    scene.add(new Line(new BufferGeometry().setFromPoints(bp), borderMat))
    dimMats.infrastructure.push({ mat: borderMat, origOp: 0.25 })
  }

  // --- Dots ---
  const dotMeshes = []
  const BIZ_R = [0, 0.04, 0.06, 0.09, 0.12]
  const dotData = [
    { imp: 1, aut: 2, rel: 92, biz: 1 },
    { imp: 1, aut: 4, rel: 97, biz: 1 },
    { imp: 2, aut: 1, rel: 95, biz: 2 },
    { imp: 2, aut: 3, rel: 90, biz: 2 },
    { imp: 3, aut: 2, rel: 92, biz: 3 },
    { imp: 3, aut: 1, rel: 85, biz: 2 },
    { imp: 4, aut: 1, rel: 83, biz: 3 },
    { imp: 5, aut: 1, rel: 99.5, biz: 2 },
    { imp: 5, aut: 1, rel: 97, biz: 4 },
  ]
  dotData.forEach(d => {
    const ok = d.rel / 100 >= reqRelForAutonomy(d.imp, d.aut)
    const col = ok ? 0x10b981 : 0xef4444
    const r = BIZ_R[d.biz]
    const x = gp(d.imp), y = gp(d.aut), z = relToZ(d.rel, S)
    const m = new Mesh(
      new SphereGeometry(r, 10, 10),
      new MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, transparent: true, opacity: 0.8 }),
    )
    m.position.set(x, y, z)
    scene.add(m)
    dotMeshes.push(m)
    scene.add(new Line(
      new BufferGeometry().setFromPoints([new Vector3(x, 0, z), new Vector3(x, y, z)]),
      new LineBasicMaterial({ color: col, transparent: true, opacity: 0.12 }),
    ))
  })

  // --- Governance surface: staircase with shelves + vertical risers ---
  const surfMeshes = []
  for (let imp = 1; imp <= 5; imp++) {
    const xL = (imp - 1) * cell
    const xR = imp * cell
    for (let l = 1; l <= 5; l++) {
      const r = reqRelForAutonomy(imp, l)
      if (r < 0.65 || r > 0.999) continue
      const z = relToZ(r * 100, S)
      const y = l * cell
      const yPrev = (l - 1) * cell
      // Z extent of this shelf
      let zEnd = S
      if (l < 5) {
        const rNext = reqRelForAutonomy(imp, l + 1)
        if (rNext <= 0.999) zEnd = relToZ(rNext * 100, S)
      }
      const zLen = zEnd - z
      const shelfOp = 0.08 + l * 0.03
      // Horizontal shelf
      if (zLen > 0.01) {
        const sg = new PlaneGeometry(cell, zLen)
        sg.rotateX(-Math.PI / 2)
        const sm = new Mesh(sg, new MeshBasicMaterial({
          color: autCols[l - 1], transparent: true, opacity: shelfOp,
          side: DoubleSide, depthWrite: false,
        }))
        sm.position.set(xL + cell / 2, y + 0.005, z + zLen / 2)
        scene.add(sm)
        surfMeshes.push({ mesh: sm, origOp: shelfOp })
      }
      // Vertical riser wall at threshold Z
      const riserH = y - yPrev
      if (riserH > 0.01) {
        const rg = new PlaneGeometry(cell, riserH)
        const rm = new Mesh(rg, new MeshBasicMaterial({
          color: autCols[l - 1], transparent: true, opacity: shelfOp + 0.03,
          side: DoubleSide, depthWrite: false,
        }))
        rm.position.set(xL + cell / 2, yPrev + riserH / 2, z)
        scene.add(rm)
        surfMeshes.push({ mesh: rm, origOp: shelfOp + 0.03 })
      }
    }
  }

  // --- Highlight glow planes (invisible until hovered) ---
  const glows = {}

  // Reliability: cyan strip on floor along Z
  const relGlow = new Mesh(
    new PlaneGeometry(0.2, S + 0.3).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false }),
  )
  relGlow.position.set(0, 0.002, (S + 0.3) / 2)
  relGlow.visible = false
  scene.add(relGlow)
  glows.reliability = relGlow

  // Blast radius: amber strip on floor along X
  const brGlow = new Mesh(
    new PlaneGeometry(S + 0.3, 0.2).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false }),
  )
  brGlow.position.set((S + 0.3) / 2, 0.002, 0)
  brGlow.visible = false
  scene.add(brGlow)
  glows.blastRadius = brGlow

  // Autonomy: violet strip on wall along Y at Z=0
  const autGlow = new Mesh(
    new PlaneGeometry(0.2, S + 0.3),
    new MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false }),
  )
  autGlow.position.set(0, (S + 0.3) / 2, 0)
  autGlow.visible = false
  scene.add(autGlow)
  glows.autonomy = autGlow

  // --- Camera ---
  const tgt = new Vector3(S / 2, S / 2.5, S / 2)
  camera.up.set(0, 1, 0)
  let theta = 2.915
  const phi = 1.481
  const radius = 8

  function updateCamera() {
    camera.position.set(
      tgt.x + radius * Math.sin(phi) * Math.cos(theta),
      tgt.y + radius * Math.cos(phi),
      tgt.z + radius * Math.sin(phi) * Math.sin(theta),
    )
    camera.lookAt(tgt)
  }
  updateCamera()

  // --- Mouse drag: rotate around vertical (Y) axis only ---
  let dragging = false
  let prevX = 0
  const el = renderer.domElement
  el.style.cursor = 'grab'
  el.addEventListener('pointerdown', e => {
    dragging = true
    prevX = e.clientX
    el.style.cursor = 'grabbing'
  })
  window.addEventListener('pointerup', () => {
    dragging = false
    el.style.cursor = 'grab'
  })
  el.addEventListener('pointermove', e => {
    if (!dragging) return
    theta -= (e.clientX - prevX) * 0.006
    prevX = e.clientX
    updateCamera()
  })
  el.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { dragging = true; prevX = e.touches[0].clientX }
  }, { passive: true })
  el.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return
    theta -= (e.touches[0].clientX - prevX) * 0.006
    prevX = e.touches[0].clientX
    updateCamera()
  }, { passive: true })
  el.addEventListener('touchend', () => { dragging = false })

  // --- HTML overlay labels ---
  const labelsDiv = document.createElement('div')
  labelsDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;'
  container.appendChild(labelsDiv)

  const dimLabels = {}
  function addLabel(dim, worldPos, text) {
    const el = document.createElement('div')
    el.textContent = text
    const css = DIM_CSS[dim]
    el.style.cssText = `
      position:absolute;white-space:nowrap;
      font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:10px;
      color:${css};opacity:0;transition:opacity 0.3s;
      transform:translate(-50%,-50%);
    `
    labelsDiv.appendChild(el)
    dimLabels[dim] = { el, pos: new Vector3(...worldPos) }
  }

  addLabel('reliability', [-0.1, -0.05, S + 0.5], 'RELIABILITY')
  addLabel('blastRadius', [S + 0.5, -0.05, -0.15], 'BLAST RADIUS')
  addLabel('autonomy', [-0.1, S + 0.3, -0.05], 'AUTONOMY')
  addLabel('businessValue', [S / 2, 0.3, S / 2], 'DOT SIZE = VALUE')
  addLabel('governance', [S / 2, 0.05, relToZ(87, S)], 'GOVERNANCE THRESHOLDS')
  addLabel('infrastructure', [S + 0.15, S / 2, S + 0.15], 'INFRASTRUCTURE')

  function updateLabels() {
    const rect = renderer.domElement.getBoundingClientRect()
    Object.values(dimLabels).forEach(({ el, pos }) => {
      const p = pos.clone().project(camera)
      el.style.left = (p.x * 0.5 + 0.5) * rect.width + 'px'
      el.style.top = (-p.y * 0.5 + 0.5) * rect.height + 'px'
    })
  }

  // --- Highlight API (additive — brightens hovered, keeps rest visible) ---
  function applyHighlight(dim) {
    // Axis/element materials — brighten matched, dim others
    Object.entries(dimMats).forEach(([key, items]) => {
      items.forEach(({ mat, origOp }) => {
        if (!dim) { mat.opacity = origOp }
        else if (key === dim) { mat.opacity = Math.min(1, origOp * 4) }
        else { mat.opacity = origOp * 0.4 }
      })
    })

    // Glow planes
    Object.entries(glows).forEach(([key, mesh]) => {
      mesh.visible = key === dim
    })

    // Labels — show matched label
    Object.entries(dimLabels).forEach(([key, { el }]) => {
      el.style.opacity = key === dim ? '1' : '0'
    })

    // Dots — pulse on businessValue, otherwise restore
    dotMeshes.forEach(m => {
      if (dim === 'businessValue') {
        m.scale.setScalar(1.5)
        m.material.emissiveIntensity = 0.4
      } else {
        m.scale.setScalar(1)
        m.material.emissiveIntensity = 0.25
      }
    })

    // Surface shelves — brighten on governance
    surfMeshes.forEach(({ mesh, origOp }) => {
      mesh.material.opacity = (dim === 'governance') ? Math.min(0.35, origOp * 3) : origOp
    })
  }

  // --- Auto-cycle labels when idle (soft — label only, no scene dimming) ---
  const CYCLE_DIMS = ['reliability', 'blastRadius', 'businessValue', 'governance', 'infrastructure', 'autonomy']
  const CYCLE_SHOW = 2400   // ms each label is visible
  const CYCLE_GAP = 400     // ms between labels (all hidden)
  const CYCLE_DELAY = 1500  // ms before first cycle starts
  let cycleIdx = 0
  let cycleTimer = null
  let userHovering = false

  function softShow(dim) {
    // Only fade in the label + faint glow plane — leave list items untouched
    Object.entries(dimLabels).forEach(([key, { el }]) => {
      el.style.opacity = key === dim ? '0.7' : '0'
    })
    Object.entries(glows).forEach(([key, mesh]) => {
      mesh.visible = key === dim
      if (mesh.material) mesh.material.opacity = 0.06
    })
  }

  function softHide() {
    Object.values(dimLabels).forEach(({ el }) => { el.style.opacity = '0' })
    Object.values(glows).forEach(mesh => { mesh.visible = false })
  }

  function cycleNext() {
    if (userHovering) return
    softShow(CYCLE_DIMS[cycleIdx])
    cycleTimer = setTimeout(() => {
      softHide()
      cycleIdx = (cycleIdx + 1) % CYCLE_DIMS.length
      cycleTimer = setTimeout(cycleNext, CYCLE_GAP)
    }, CYCLE_SHOW)
  }

  function startCycle() {
    stopCycle()
    cycleTimer = setTimeout(cycleNext, CYCLE_DELAY)
  }

  function stopCycle() {
    if (cycleTimer) { clearTimeout(cycleTimer); cycleTimer = null }
    softHide()
  }

  function highlight(dim) {
    if (dim) {
      userHovering = true
      stopCycle()
      applyHighlight(dim)
    } else {
      userHovering = false
      applyHighlight(null)
      startCycle()
    }
  }

  // Restore glow opacity after hover ends (applyHighlight sets full opacity)
  const GLOW_FULL_OP = 0.12

  // Start auto-cycle on load
  startCycle()

  // --- Resize ---
  function resize() {
    const w = container.clientWidth, h = container.clientHeight
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()

  // --- Animate ---
  let animId = null
  function animate() {
    animId = requestAnimationFrame(animate)
    theta += 0.0008
    updateCamera()
    updateLabels()
    renderer.render(scene, camera)
  }
  animate()

  const ro = new ResizeObserver(resize)
  ro.observe(container)

  function destroy() {
    stopCycle()
    if (animId) cancelAnimationFrame(animId)
    ro.disconnect()
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    if (labelsDiv.parentNode) labelsDiv.parentNode.removeChild(labelsDiv)
    scene.traverse(child => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
  }

  return { highlight, destroy }
}
