import {
  LineBasicMaterial,
  BufferGeometry,
  Line,
  Vector3,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
} from 'three'

export function addLine(from, to, col, op, parent) {
  const m = new LineBasicMaterial({ color: col, transparent: true, opacity: op || 1 })
  const g = new BufferGeometry().setFromPoints([new Vector3(...from), new Vector3(...to)])
  const line = new Line(g, m)
  parent.add(line)
  return line
}

export function mkLabel(text, pos, col, fs, mw) {
  fs = fs || 26
  mw = mw || 280
  const c = document.createElement('canvas')
  c.width = mw
  c.height = 56
  const x = c.getContext('2d')
  x.fillStyle = col
  x.font = `bold ${fs}px IBM Plex Mono, monospace`
  x.textAlign = 'center'
  x.fillText(text, mw / 2, 38)
  const t = new CanvasTexture(c)
  const sp = new Sprite(new SpriteMaterial({ map: t, transparent: true }))
  sp.position.set(...pos)
  sp.scale.set(mw / 190, 0.3, 1)
  return sp
}
