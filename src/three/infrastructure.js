import {
  Group,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Vector3,
  DoubleSide,
} from 'three'
import { S, cell, gp } from './scene.js'
import { addLine } from './helpers.js'

const COL = 0x5c6a78 // neutral muted

// Infrastructure gate reference planes at each autonomy level
export function buildInfraLayer() {
  const group = new Group()
  group.visible = false

  // Infra axis line along back edge (X=S, Z=S)
  addLine([S, 0, S], [S, S + 0.3, S], COL, 0.5, group)

  for (let l = 1; l <= 5; l++) {
    const y = gp(l)

    // Translucent plane
    const pg = new PlaneGeometry(S, S)
    pg.rotateX(-Math.PI / 2)
    const mesh = new Mesh(pg, new MeshBasicMaterial({
      color: COL, transparent: true, opacity: 0.02, side: DoubleSide,
    }))
    mesh.position.set(S / 2, y - cell / 2 + 0.01, S / 2)
    group.add(mesh)

    // Border outline
    const yPos = y - cell / 2 + 0.01
    const bp = [
      [0, yPos, 0], [S, yPos, 0], [S, yPos, S],
      [0, yPos, S], [0, yPos, 0],
    ].map(v => new Vector3(...v))
    group.add(new Line(
      new BufferGeometry().setFromPoints(bp),
      new LineBasicMaterial({ color: COL, transparent: true, opacity: 0.15 }),
    ))
  }

  return group
}
