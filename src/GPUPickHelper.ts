// Copied from https://threejs.org/manual/#en/picking and ported to TS

import * as THREE from 'three'

export class GPUPickHelper {
  private pickingTexture = new THREE.WebGLRenderTarget(1, 1)
  private pixelBuffer = new Uint8Array(4)

  private renderer: THREE.WebGLRenderer

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer
  }

  pick(
    cssPosition: { x: number; y: number },
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    const { pickingTexture, pixelBuffer } = this

    // set the view offset to represent just a single pixel under the mouse
    const pixelRatio = this.renderer.getPixelRatio()
    camera.setViewOffset(
      this.renderer.getContext().drawingBufferWidth, // full width
      this.renderer.getContext().drawingBufferHeight, // full top
      (cssPosition.x * pixelRatio) | 0, // rect x
      (cssPosition.y * pixelRatio) | 0, // rect y
      1, // rect width
      1 // rect height
    )
    // render the scene
    this.renderer.setRenderTarget(pickingTexture)
    this.renderer.render(scene, camera)
    this.renderer.setRenderTarget(null)
    // clear the view offset so rendering returns to normal
    camera.clearViewOffset()
    //read the pixel
    this.renderer.readRenderTargetPixels(
      pickingTexture,
      0, // x
      0, // y
      1, // width
      1, // height
      pixelBuffer
    )

    const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2]

    return id
  }
}
