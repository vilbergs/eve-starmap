import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  CSS3DObject,
  CSS3DRenderer,
} from 'three/addons/renderers/CSS3DRenderer.js'
import systems from './systems.json'
import regions from './regions.json'
import { create_system_graph } from './system-graph'
import { z } from '@zod/mini'
import { Point, SolarSystemSchema } from './schemas'

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

const show_lines_button = document.getElementById('show-lines-button')

window.state = {
  shouldShowLines: false,
  toggleLineVisibility() {
    this.shouldShowLines = !this.shouldShowLines
    show_lines_button!.innerHTML = `Show Lines: ${this.shouldShowLines}`
  },
}

const SystemArraySchema = z.array(SolarSystemSchema)
const all_systems = SystemArraySchema.parse(systems)
const system_graph = create_system_graph(all_systems)

const region_elements: HTMLDivElement[] = []
const region_objects: CSS3DObject[] = []
const geometries: any[] = []

const divisor = 1_000_000_000_000_000

// SETUP

const scene = new THREE.Scene()
scene.background = new THREE.Color('black')
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1500
)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.id = 'canvas'
renderer.setPixelRatio(window.devicePixelRatio)

const cssRenderer = new CSS3DRenderer()
cssRenderer.setSize(window.innerWidth, window.innerHeight)
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.top = '0'
cssRenderer.domElement.style.left = '0'
cssRenderer.domElement.style.pointerEvents = 'none'

document.body.appendChild(renderer.domElement)
document.body.appendChild(cssRenderer.domElement)
const line_points: any[] = []
const line_colors: number[] = []

for (const { center, security, stargates } of systems) {
  const geometry = new THREE.SphereGeometry(1)

  // const color =
  const color = new THREE.Color().setHex(getSecurityColor(security))

  const system_position = [-center[0], center[1], center[2]].map(
    (p) => p / divisor
  ) as Point

  // cube.position.set(...system_position)
  geometry.translate(...system_position)

  // get the colors as an array of values from 0 to 255
  const rgb = color.toArray().map((v) => v * 255)

  // make an array to store colors for each vertex
  const numVerts = geometry.getAttribute('position').count
  const itemSize = 3 // r, g, b
  const colors = new Uint8Array(itemSize * numVerts)

  // copy the color into the colors array for each vertex
  colors.forEach((_, ndx) => {
    colors[ndx] = rgb[ndx % 3]
  })

  const normalized = true
  const colorAttrib = new THREE.BufferAttribute(colors, itemSize, normalized)
  geometry.setAttribute('color', colorAttrib)

  stargates.forEach((stargate) => {
    const stargate_position = new THREE.Vector3(
      ...(system_position.map((p) => p) as Point)
    )

    const destination_system = system_graph.get(stargate.destination)

    if (!destination_system) {
      return
    }

    const { center: destination_p, security: destination_sec } =
      destination_system

    const p: Point = [
      -destination_p[0],
      destination_p[1],
      destination_p[2],
    ].map((p) => p / divisor) as Point

    const destination_position = new THREE.Vector3(...p)

    const destination_color = new THREE.Color(getSecurityColor(destination_sec))
      .toArray()
      .map((v) => v * 255)
    line_points.push(stargate_position, destination_position)
    line_colors.push(...rgb, ...destination_color) // push the same color for both points
  })

  // line_geometries.push(line)

  // scene.add(cube)
  geometries.push(geometry)
}

const line_colors_uint = new Uint8Array(line_colors)

const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false)
const material = new THREE.MeshPhongMaterial({
  vertexColors: true,
  opacity: 0.6,
  transparent: true,
  shininess: 50,
})
const mesh = new THREE.Mesh(mergedGeometry, material)
scene.add(mesh)

const line_geometry = new THREE.BufferGeometry().setFromPoints(line_points)

line_geometry.setAttribute(
  'color',
  new THREE.BufferAttribute(line_colors_uint, 3, true)
)

const line = new THREE.Line(
  line_geometry,
  new THREE.LineBasicMaterial({
    vertexColors: true,
    opacity: 0.2,
    transparent: true,
  })
)

scene.add(line)

createRegions()

camera.position.x = 29
camera.position.y = 272
camera.position.z = -153
camera.rotation.x = -0.48
camera.rotation.y = -0.125
camera.rotation.z = -2.5

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(150, 100, 0)
controls.update()

const color = 0xffffff
const intensity = 2
const light = new THREE.DirectionalLight(color, intensity)
light.position.set(...camera.position.toArray())
light.target.position.set(150, 100, 0)

scene.add(light)
scene.add(light.target)

const helper = new THREE.DirectionalLightHelper(light)
scene.add(helper)

function animate() {
  for (let i = 0; i < region_objects.length; i++) {
    region_elements[i].style.pointerEvents = 'none'
    region_objects[i].rotation.set(...camera.rotation.toArray())
  }

  line.visible = window.state.shouldShowLines

  light.position.set(...camera.position.toArray())
  light.rotation.set(...camera.rotation.toArray())

  light.target.position.set(...getPositionInFrontOfCamera(100).toArray())
  light.intensity = Math.pow(
    light.target.position.distanceTo(camera.position),
    0.4
  )

  renderer.render(scene, camera)
  cssRenderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)

function createRegions() {
  for (const region of regions) {
    const element = document.createElement('div')
    element.id = 'region-node'
    element.textContent = region.name

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

function getPositionInFrontOfCamera(distance) {
  // Create a vector representing the direction the camera is facing
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)

  // Normalize the direction vector (make it length 1)
  direction.normalize()

  // Multiply by the distance you want
  direction.multiplyScalar(distance)

  // Add this offset to the camera's position to get the final position
  const targetPosition = new THREE.Vector3()
  targetPosition.addVectors(camera.position, direction)

  return targetPosition
}
