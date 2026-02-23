import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from 'three'

export const S = 3
export const cell = S / 5

export function gp(l) {
  return (l - 0.5) * cell
}

export function createScene(container) {
  const scene = new Scene()
  // No scene.background — canvas is transparent, page CSS background shows through

  const camera = new PerspectiveCamera(50, 1, 0.1, 100)

  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  scene.add(new AmbientLight(0x8899aa, 1.2))
  const dl = new DirectionalLight(0xffffff, 0.8)
  dl.position.set(5, 8, 5)
  scene.add(dl)

  return { scene, camera, renderer }
}
