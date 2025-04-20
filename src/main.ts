import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  CSS3DObject,
  CSS3DRenderer,
} from 'three/addons/renderers/CSS3DRenderer.js'
import systems from './systems.json'
import regions from './regions.json'

const region_elements: HTMLDivElement[] = []
const region_objects: CSS3DObject[] = []

const divisor = 1_000_000_000_000_000

// SETUP

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.id = 'canvas'

const cssRenderer = new CSS3DRenderer()
cssRenderer.setSize(window.innerWidth, window.innerHeight)
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.top = '0'
cssRenderer.domElement.style.left = '0'
cssRenderer.domElement.style.width = '100%'
cssRenderer.domElement.style.height = '100%'
cssRenderer.domElement.style.pointerEvents = 'none'

document.body.appendChild(renderer.domElement)
document.body.appendChild(cssRenderer.domElement)

for (const { center, security } of systems) {
  const geometry = new THREE.SphereGeometry(1)

  const material = new THREE.MeshBasicMaterial({
    color: getSecurityColor(security),
    opacity: 0.5,
    transparent: true,
  })
  const cube = new THREE.Mesh(geometry, material)

  center[0] = -center[0]
  cube.position.set(
    ...(center.map((coord) => coord / divisor) as [number, number, number])
  )

  scene.add(cube)
}

createRegions()

camera.position.z = 100

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 5, 0)
controls.update()

const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const info = document.getElementById('info')!

function animate() {
  info.innerHTML = ''
  info.appendChild(
    createInfoNode('Camera', camera.position.toArray().join(', '), 'white')
  )
  info.appendChild(
    createInfoNode(
      'Camera Rotation',
      camera.rotation.toArray().join(', '),
      'white'
    )
  )

  for (let i = 0; i < region_objects.length; i++) {
    region_elements[i].style.pointerEvents = 'none'
    region_objects[i].rotation.set(...camera.rotation.toArray())
  }

  renderer.render(scene, camera)
  cssRenderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)

function createInfoNode(
  name: string,
  value: string | number,
  color: string = 'black'
): HTMLDivElement {
  const node = document.createElement('div')
  node.innerText = `${name}: ${value}`
  node.style.color = color
  return node
}

function createRegions() {
  for (const region of regions) {
    const element = document.createElement('div')
    element.style.color = 'white'
    element.style.fontSize = '4px'
    element.textContent = region.name
    element.style.opacity = '0.9'
    element.className = 'textnode'

    const objectCSS = new CSS3DObject(element)
    objectCSS.position.x = -region.center[0] / divisor
    objectCSS.position.y = region.center[1] / divisor
    objectCSS.position.z = region.center[2] / divisor

    scene.add(objectCSS)

    region_elements.push(element)
    region_objects.push(objectCSS)
  }
}

function getSecurityColor(security: number) {
  if (security >= 1) return 0x2f75dc

  if (security >= 0.9) return 0x3b9cec

  if (security >= 0.8) return 0x4bcff2

  if (security >= 0.7) return 0x5fdba6

  if (security >= 0.6) {
    return 0x72e452
  }
  if (security >= 0.5) {
    return 0xeeff83
  }
  if (security >= 0.4) {
    return 0xe1690b
  }

  if (security >= 0.3) {
    return 0xcb4712
  }

  if (security >= 0.2) {
    return 0xbd1117
  }

  if (security >= 0.1) {
    return 0x73201c
  }

  return 0x8f2f6a
}
