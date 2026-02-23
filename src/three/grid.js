import { S, cell } from './scene.js'
import { addLine } from './helpers.js'
import { IMP } from '../data/constants.js'
import { relToZ } from '../utils/risk-calc.js'

// Colors for cream/light background
const AXIS_NAVY = 0x2d4a6f
const AXIS_MUTED = 0x5c6a78
const GRID_LINE = 0xd5d2cb
const LANE_LINE = 0xc8c5be
const TICK = 0.08

const REL_TICKS = [70, 80, 90, 95, 99, 99.9]

// Axes: X = Blast Radius, Y = Autonomy (height, toggled), Z = Reliability
export function buildGrid(scene) {
  // Reliability axis (Z)
  addLine([0, 0, 0], [0, 0, S + 0.3], AXIS_NAVY, 1, scene)
  // Blast Radius axis (X)
  addLine([0, 0, 0], [S + 0.3, 0, 0], AXIS_MUTED, 1, scene)

  // Reliability ticks + grid lines (log-scale)
  REL_TICKS.forEach(pct => {
    const z = relToZ(pct, S)
    addLine([0, 0, z], [S, 0, z], GRID_LINE, 0.5, scene)
    // Tick dash on Z axis (perpendicular, along X)
    addLine([-TICK, 0, z], [TICK, 0, z], AXIS_NAVY, 1, scene)
  })

  // Lane dividers between blast radius buckets (at boundaries)
  for (let i = 1; i < 5; i++) {
    const x = i * cell
    addLine([x, 0, 0], [x, 0, S], LANE_LINE, 0.5, scene)
  }

  // Blast radius tick marks (at bucket centers)
  IMP.forEach((_, i) => {
    const x = (i + 1 - 0.5) * cell
    addLine([x, 0, -TICK], [x, 0, TICK], AXIS_MUTED, 1, scene)
  })
}
