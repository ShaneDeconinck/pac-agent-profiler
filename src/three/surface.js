import {
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Line,
  LineBasicMaterial,
  Vector3,
  DoubleSide,
} from 'three'
import { S, cell } from './scene.js'
import { AUT_COLORS } from '../data/constants.js'
import { reqRelForAutonomy, relToZ } from '../utils/risk-calc.js'

// Governance surface — explicit staircase: shelves + walls + edges
export function buildSurface(config) {
  const group = new Group()
  const shelfMeshes = [] // exposed for raycasting
  group.visible = false
  const thresholds = config?.thresholds
  const escalation = config?.autonomyEscalation

  const edgeMat = new LineBasicMaterial({ color: 0x5c6a78, transparent: true, opacity: 0.3 })

  for (let imp = 1; imp <= 5; imp++) {
    const xL = (imp - 1) * cell
    const xR = imp * cell

    for (let l = 1; l <= 5; l++) {
      const r = reqRelForAutonomy(imp, l, thresholds, escalation)
      if (r < 0.65 || r > 0.999) continue
      const z = relToZ(r * 100, S)
      const y = l * cell
      const yPrev = (l - 1) * cell

      // Z extent of this shelf
      let zEnd = S
      if (l < 5) {
        const rNext = reqRelForAutonomy(imp, l + 1, thresholds, escalation)
        if (rNext <= 0.999) zEnd = relToZ(rNext * 100, S)
      }
      const zLen = zEnd - z

      // Progressive opacity: higher autonomy = stronger shade
      const shelfOpacity = 0.06 + l * 0.03  // 0.09 → 0.21

      // Horizontal shelf fill
      if (zLen > 0.01) {
        const sg = new BufferGeometry()
        sg.setAttribute('position', new Float32BufferAttribute([
          xL, y + 0.005, z,
          xR, y + 0.005, z,
          xR, y + 0.005, zEnd,
          xL, y + 0.005, zEnd,
        ], 3))
        sg.setIndex([0, 2, 1, 0, 3, 2])
        sg.computeVertexNormals()
        const sm = new Mesh(sg, new MeshBasicMaterial({
          color: AUT_COLORS[l].hex,
          transparent: true,
          opacity: shelfOpacity,
          side: DoubleSide,
          depthWrite: false,
        }))
        sm.userData = { level: l, impact: imp }
        group.add(sm)
        shelfMeshes.push(sm)
      }

      // Vertical wall fill (riser) at threshold Z
      const wg = new BufferGeometry()
      wg.setAttribute('position', new Float32BufferAttribute([
        xL, yPrev, z,
        xR, yPrev, z,
        xR, y, z,
        xL, y, z,
      ], 3))
      wg.setIndex([0, 2, 1, 0, 3, 2])
      wg.computeVertexNormals()
      const wm = new Mesh(wg, new MeshBasicMaterial({
        color: AUT_COLORS[l].hex,
        transparent: true,
        opacity: shelfOpacity + 0.04,
        side: DoubleSide,
        depthWrite: false,
      }))
      wm.userData = { level: l, impact: imp }
      group.add(wm)
      shelfMeshes.push(wm)

      // Side walls parallel to reliability (Z axis) — shelf portion
      if (zLen > 0.01) {
        for (const xPos of [xL, xR]) {
          const swg = new BufferGeometry()
          swg.setAttribute('position', new Float32BufferAttribute([
            xPos, yPrev, z,
            xPos, yPrev, zEnd,
            xPos, y, zEnd,
            xPos, y, z,
          ], 3))
          swg.setIndex([0, 2, 1, 0, 3, 2])
          swg.computeVertexNormals()
          const swm = new Mesh(swg, new MeshBasicMaterial({
            color: AUT_COLORS[l].hex,
            transparent: true,
            opacity: 0.03,
            side: DoubleSide,
            depthWrite: false,
          }))
          swm.userData = { level: l, impact: imp }
          group.add(swm)
          shelfMeshes.push(swm)
        }
      }

      // Side walls for the riser face (close off the step at xL and xR)
      const zPrev = l > 1
        ? (() => { const rp = reqRelForAutonomy(imp, l - 1, thresholds, escalation); return rp >= 0.65 && rp <= 0.999 ? relToZ(rp * 100, S) : 0 })()
        : 0
      if (z - zPrev > 0.005) {
        for (const xPos of [xL, xR]) {
          const rsg = new BufferGeometry()
          rsg.setAttribute('position', new Float32BufferAttribute([
            xPos, yPrev, zPrev,
            xPos, yPrev, z,
            xPos, y, z,
            xPos, y, zPrev,
          ], 3))
          rsg.setIndex([0, 2, 1, 0, 3, 2])
          rsg.computeVertexNormals()
          const rsm = new Mesh(rsg, new MeshBasicMaterial({
            color: AUT_COLORS[l].hex,
            transparent: true,
            opacity: 0.03,
            side: DoubleSide,
            depthWrite: false,
          }))
          rsm.userData = { level: l, impact: imp }
          group.add(rsm)
          shelfMeshes.push(rsm)
        }
      }

      // Edge lines — shelf edges parallel to Z
      group.add(new Line(
        new BufferGeometry().setFromPoints([new Vector3(xL, y, z), new Vector3(xL, y, zEnd)]),
        edgeMat,
      ))
      group.add(new Line(
        new BufferGeometry().setFromPoints([new Vector3(xR, y, z), new Vector3(xR, y, zEnd)]),
        edgeMat,
      ))
      // Front edge parallel to X at threshold Z
      group.add(new Line(
        new BufferGeometry().setFromPoints([new Vector3(xL, y, z), new Vector3(xR, y, z)]),
        edgeMat,
      ))
      // Vertical riser edges
      group.add(new Line(
        new BufferGeometry().setFromPoints([new Vector3(xL, yPrev, z), new Vector3(xL, y, z)]),
        edgeMat,
      ))
      group.add(new Line(
        new BufferGeometry().setFromPoints([new Vector3(xR, yPrev, z), new Vector3(xR, y, z)]),
        edgeMat,
      ))
    }
  }

  // Floor per lane: red below A1 threshold, green above
  for (let imp = 1; imp <= 5; imp++) {
    const xL = (imp - 1) * cell
    const xR = imp * cell
    const r = reqRelForAutonomy(imp, 1, thresholds, escalation)
    const threshZ = (r >= 0.65 && r <= 0.999) ? relToZ(r * 100, S) : 0

    // Red zone: Z=0 to threshold
    if (threshZ > 0.01) {
      const rg = new BufferGeometry()
      rg.setAttribute('position', new Float32BufferAttribute([
        xL, 0.005, 0, xR, 0.005, 0, xR, 0.005, threshZ, xL, 0.005, threshZ,
      ], 3))
      rg.setIndex([0, 2, 1, 0, 3, 2])
      rg.computeVertexNormals()
      const rm = new Mesh(rg, new MeshBasicMaterial({
        color: 0xef4444, transparent: true, opacity: 0.08,
        side: DoubleSide, depthWrite: false,
      }))
      rm.renderOrder = -1
      group.add(rm)
    }

    // Green zone: threshold to S
    if (threshZ < S - 0.01) {
      const gg = new BufferGeometry()
      gg.setAttribute('position', new Float32BufferAttribute([
        xL, 0.005, threshZ, xR, 0.005, threshZ, xR, 0.005, S, xL, 0.005, S,
      ], 3))
      gg.setIndex([0, 2, 1, 0, 3, 2])
      gg.computeVertexNormals()
      const gm = new Mesh(gg, new MeshBasicMaterial({
        color: 0x10b981, transparent: true, opacity: 0.06,
        side: DoubleSide, depthWrite: false,
      }))
      gm.renderOrder = -1
      group.add(gm)
    }
  }

  return { group, shelfMeshes }
}
