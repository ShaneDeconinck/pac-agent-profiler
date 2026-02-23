const DEFAULT_THRESHOLDS = [0, 0.80, 0.90, 0.95, 0.97, 0.99]
const DEFAULT_ESCALATION = 0.25
const DEFAULT_MIN_REL = 65

const NINES_MAX = -Math.log10(1 - 0.999) // 3.0

function ninesMin(minRel) {
  return -Math.log10(1 - (minRel ?? DEFAULT_MIN_REL) / 100)
}

export function relToNines(relPercent, minRel) {
  const min = minRel ?? DEFAULT_MIN_REL
  const rel = Math.max(min, Math.min(99.9, relPercent)) / 100
  return -Math.log10(1 - rel)
}

export function relToZ(relPercent, S, minRel) {
  const nMin = ninesMin(minRel)
  return ((relToNines(relPercent, minRel) - nMin) / (NINES_MAX - nMin)) * S
}

export function reqRel(impact, thresholds) {
  const t = thresholds || DEFAULT_THRESHOLDS
  return t[impact]
}

export function reqRelForAutonomy(impact, autonomy, thresholds, escalation) {
  const baseNines = -Math.log10(1 - reqRel(impact, thresholds))
  const esc = escalation ?? DEFAULT_ESCALATION
  const totalNines = baseNines + (autonomy - 1) * esc
  return 1 - Math.pow(10, -totalNines)
}

// Inverse of relToZ: Z position → reliability percentage
export function zToRel(z, S, minRel) {
  const nMin = ninesMin(minRel)
  const nines = (z / S) * (NINES_MAX - nMin) + nMin
  return (1 - Math.pow(10, -nines)) * 100
}

export function maxAut(c, infra, thresholds, escalation) {
  const rel = c.reliability / 100
  let maxR = 1
  for (let l = 5; l >= 1; l--) {
    if (rel >= reqRelForAutonomy(c.impact, l, thresholds, escalation)) { maxR = l; break }
  }
  let maxI = 1
  for (let l = 5; l >= 1; l--) { if (infra[l]) { maxI = l; break } }
  const actual = Math.min(maxR, maxI)
  return { actual, potential: maxR, infraLimited: maxI < maxR }
}
