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
import { PickHelper } from './PickHelper'
import gsap from 'gsap'

const show_lines_button = document.getElementById('show-lines-button')

window.state = {
  shouldShowLines: true,
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

const cssRenderer = new CSS3DRenderer({})
cssRenderer.setSize(window.innerWidth, window.innerHeight)
cssRenderer.domElement.style.position = 'absolute'
cssRenderer.domElement.style.top = '0'
cssRenderer.domElement.style.left = '0'
cssRenderer.domElement.style.pointerEvents = 'none'

document.body.appendChild(renderer.domElement)
document.body.appendChild(cssRenderer.domElement)
const line_points: any[] = []
const line_colors: number[] = []

const material = new THREE.MeshBasicMaterial({
  // vertexColors: true,
  opacity: 0.9,
  transparent: true,
})

const mesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1.2),
  material,
  systems.length
)

for (const { center, security, stargates, solarSystemID } of systems) {
  const geometry = new THREE.SphereGeometry(1.2)
  const color = new THREE.Color().setHex(getSecurityColor(security))
  const system_position = [-center[0], center[1], center[2]].map(
    (p) => p / divisor
  ) as Point

  // get the colors as an array of values from 0 to 255
  const rgb = color.toArray().map((v) => v * 255)

  // make an array to store colors for each vertex
  // const numVerts = geometry.getAttribute('position').count
  // const itemSize = 3 // r, g, b
  // const colors = new Uint8Array(itemSize * numVerts)

  // // copy the color into the colors array for each vertex
  // colors.forEach((_, ndx) => {
  //   colors[ndx] = rgb[ndx % 3]
  // })

  // const normalized = true
  // const colorAttrib = new THREE.BufferAttribute(colors, itemSize, normalized)
  // geometry.setAttribute('color', colorAttrib)

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

  const material = new THREE.MeshBasicMaterial({
    color,
    opacity: 0.8,
    transparent: true,
  })
  const cube = new THREE.Mesh(geometry, material)
  cube.userData = {
    id: solarSystemID,
  }

  cube.position.set(...system_position)

  mesh.attach(cube)

  geometries.push(geometry)
}

const line_colors_uint = new Uint8Array(line_colors)

const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true)
mergedGeometry.computeBoundingBox()

// const mesh = new THREE.Mesh(mergedGeometry, material)

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
    opacity: 0.3,
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

const ring_geo = new THREE.RingGeometry(1.4, 1.7)

const ring = new THREE.Mesh(ring_geo)
ring.visible = false
scene.add(ring)

function animate() {
  for (let i = 0; i < region_objects.length; i++) {
    region_elements[i].style.pointerEvents = 'none'
    region_objects[i].rotation.set(...camera.rotation.toArray())
  }

  line.visible = window.state.shouldShowLines

  if (ring.visible) {
    ring.rotation.set(...camera.rotation.toArray())
  }

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

const pickHelper = new PickHelper()

window.addEventListener('click', pickSystem, false)

function getCanvasRelativePosition(event: MouseEvent) {
  const vec = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  )

  return vec
}

function pickSystem(event: MouseEvent) {
  // exit if we have not loaded the data yet
  const position = getCanvasRelativePosition(event)
  const object = pickHelper.pick(position, scene, camera)

  console.log(object)

  if (!object) {
    return
  }

  ring.visible = true
  ring.position.set(...object.position.toArray())

  animateTargetChange(...object.position.toArray(), 0.75)
}

function animateTargetChange(
  newTargetX: number,
  newTargetY: number,
  newTargetZ: number,
  duration = 1
) {
  // Animate to new target
  gsap.to(controls.target, {
    x: newTargetX,
    y: newTargetY,
    z: newTargetZ,
    duration: duration,
    onUpdate: function () {
      // Update controls on each frame of the animation
      controls.update()
    },
  })
}
