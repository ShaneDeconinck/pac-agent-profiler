import {
  Group,
  Mesh,
  SphereGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Vector3,
  DoubleSide,
} from 'three'
import { S, gp, cell } from './scene.js'
import { AUT_COLORS } from '../data/constants.js'
import { reqRel, reqRelForAutonomy, maxAut, relToZ } from '../utils/risk-calc.js'

const BIZ_RADIUS = [0, 0.04, 0.06, 0.09, 0.12]

// X=impact, Y=autonomy, Z=reliability
export function buildDots(cases, _infra, layers, config) {
  const group = new Group()
  const meshes = []
  const showAut = layers.autonomy
  const thresholds = config?.thresholds
  const escalation = config?.autonomyEscalation

  // Pre-compute X offsets: centered by default, only spread overlapping dots
  const xOffsets = new Array(cases.length).fill(0)
  const buckets = {}
  cases.forEach((c, i) => {
    const b = c.impact
    if (!buckets[b]) buckets[b] = []
    buckets[b].push({ i, z: relToZ(c.reliability, S), r: BIZ_RADIUS[c.bizValue || 1] * (layers.autonomy ? 1 : 0.6) })
  })
  Object.values(buckets).forEach(dots => {
    // Sort by Z to find overlapping neighbors
    dots.sort((a, b) => a.z - b.z)
    // Group into clusters where spheres touch on Z axis
    const clusters = []
    let cur = [dots[0]]
    for (let j = 1; j < dots.length; j++) {
      const prev = cur[cur.length - 1]
      if (dots[j].z - prev.z < prev.r + dots[j].r + 0.02) {
        cur.push(dots[j])
      } else {
        clusters.push(cur)
        cur = [dots[j]]
      }
    }
    clusters.push(cur)
    // Spread each cluster symmetrically around center
    clusters.forEach(cl => {
      if (cl.length <= 1) return // single dot stays centered
      // Just enough to separate — use max radius in cluster as spacing
      const maxR = Math.max(...cl.map(d => d.r))
      const spacing = maxR * 1.8 / Math.max(cl.length - 1, 1)
      cl.forEach((d, k) => {
        xOffsets[d.i] = (k - (cl.length - 1) / 2) * spacing
      })
    })
  })

  // In 2D mode, draw governance staircases for each autonomy level
  if (!showAut) {
    // Red/green floor per lane split at A1 threshold
    for (let imp = 1; imp <= 5; imp++) {
      const threshold = reqRelForAutonomy(imp, 1, thresholds, escalation)
      const relPct = threshold * 100
      if (relPct > 99.9 || relPct < 65) continue
      const gz = relToZ(relPct, S)
      const xStart = (imp - 1) * cell

      // Red zone: 0 to threshold
      const rp = new PlaneGeometry(cell, gz)
      rp.rotateX(-Math.PI / 2)
      const rf = new Mesh(rp, new MeshBasicMaterial({
        color: 0xef4444, transparent: true, opacity: 0.06,
        side: DoubleSide, depthWrite: false,
      }))
      rf.position.set(xStart + cell / 2, 0.003, gz / 2)
      group.add(rf)

      // Green zone: threshold to S
      const gLen = S - gz
      if (gLen > 0.01) {
        const gp2 = new PlaneGeometry(cell, gLen)
        gp2.rotateX(-Math.PI / 2)
        const gf = new Mesh(gp2, new MeshBasicMaterial({
          color: 0x10b981, transparent: true, opacity: 0.045,
          side: DoubleSide, depthWrite: false,
        }))
        gf.position.set(xStart + cell / 2, 0.003, gz + gLen / 2)
        group.add(gf)
      }
    }

    for (let aut = 1; aut <= 5; aut++) {
      // A1 = solid line (pass/fail boundary), A2-A5 = dashed
      const isSolid = aut === 1
      const govMat = isSolid
        ? new LineBasicMaterial({
            color: AUT_COLORS[aut].hex,
            transparent: true,
            opacity: 1,
            linewidth: 1,
          })
        : new LineDashedMaterial({
            color: AUT_COLORS[aut].hex,
            transparent: true,
            opacity: 0.6,
            dashSize: 0.06,
            gapSize: 0.03,
            linewidth: 1,
          })
      // Horizontal line per blast radius lane at this autonomy's threshold
      for (let imp = 1; imp <= 5; imp++) {
        const threshold = reqRelForAutonomy(imp, aut, thresholds, escalation)
        const relPct = threshold * 100
        if (relPct > 99.9 || relPct < 65) continue
        const gz = relToZ(relPct, S)
        const xStart = (imp - 1) * cell
        const xEnd = imp * cell
        const lg = new BufferGeometry().setFromPoints([
          new Vector3(xStart, 0.008, gz),
          new Vector3(xEnd, 0.008, gz),
        ])
        const line = new Line(lg, govMat)
        if (!isSolid) line.computeLineDistances()
        group.add(line)
      }
      // Vertical steps connecting lanes
      for (let imp = 1; imp < 5; imp++) {
        const gz1 = relToZ(reqRelForAutonomy(imp, aut, thresholds, escalation) * 100, S)
        const gz2 = relToZ(reqRelForAutonomy(imp + 1, aut, thresholds, escalation) * 100, S)
        if (gz1 > S || gz2 > S) continue
        const xBoundary = imp * cell
        const lg = new BufferGeometry().setFromPoints([
          new Vector3(xBoundary, 0.008, gz1),
          new Vector3(xBoundary, 0.008, gz2),
        ])
        const step = new Line(lg, govMat)
        if (!isSolid) step.computeLineDistances()
        group.add(step)
      }
    }
  }

  cases.forEach((c, i) => {
    const res = maxAut(c, c.infra || { 1: true, 2: true, 3: false, 4: false, 5: false }, thresholds, escalation)
    const rel = c.reliability / 100
    const x = gp(c.impact) + xOffsets[i]
    const z = relToZ(c.reliability, S)
    const radius = BIZ_RADIUS[c.bizValue || 1]

    if (!showAut) {
      // 2D: dots on floor (XZ plane), smaller radius
      const r2d = radius * 0.6
      const floorY = r2d
      const ok = rel >= reqRel(c.impact, thresholds)
      const col = ok ? 0x10b981 : 0xef4444
      const m = new Mesh(
        new SphereGeometry(r2d, 16, 16),
        new MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.25 }),
      )
      m.position.set(x, floorY, z)
      m.userData = { idx: i, flat: true, ok }
      group.add(m)
      meshes.push(m)

    } else {
      // 3D: dots at autonomy Y level
      const y = gp(res.actual)
      const floorY = radius
      const ok = rel >= reqRelForAutonomy(c.impact, res.actual, thresholds, escalation)
      const col = ok ? 0x10b981 : 0xef4444
      const m = new Mesh(
        new SphereGeometry(radius, 16, 16),
        new MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }),
      )
      m.position.set(x, y, z)
      m.userData = { idx: i, flat: false, ok, res }
      group.add(m)
      meshes.push(m)

      // Vertical line from floor to dot (along Y)
      const lm = new LineBasicMaterial({ color: col, transparent: true, opacity: 0.15 })
      const lg = new BufferGeometry().setFromPoints([new Vector3(x, 0, z), new Vector3(x, y, z)])
      group.add(new Line(lg, lm))
    }
  })

  return { group, meshes }
}
