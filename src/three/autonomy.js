import { Group } from 'three'
import { S, cell, gp } from './scene.js'
import { addLine } from './helpers.js'
import { AUT_COLORS } from '../data/constants.js'

const TICK = 0.08

// Autonomy is the Y axis (height, toggled on/off)
// Each level gets its own gradient color
export function buildAutonomyLayer() {
  const group = new Group()
  group.visible = false

  // Y axis — colored segments per autonomy level
  for (let l = 1; l <= 5; l++) {
    const col = AUT_COLORS[l].hex
    const y0 = (l - 1) * cell
    const y1 = l * cell
    addLine([0, y0, 0], [0, y1, 0], col, 1, group)
  }
  // Arrow tip beyond L5
  addLine([0, S, 0], [0, S + 0.3, 0], AUT_COLORS[5].hex, 0.5, group)

  // Horizontal lines at band boundaries
  for (let l = 0; l <= 5; l++) {
    const y = l * cell
    const col = AUT_COLORS[Math.min(l + 1, 5)].hex
    addLine([0, y, 0], [S, y, 0], col, 0.06, group)
    addLine([0, y, 0], [0, y, S], col, 0.06, group)
  }

  // Tick dashes at band centers (where labels are), colored per level
  for (let l = 1; l <= 5; l++) {
    const y = gp(l)
    addLine([-TICK, y, 0], [TICK, y, 0], AUT_COLORS[l].hex, 1, group)
  }

  return group
}
