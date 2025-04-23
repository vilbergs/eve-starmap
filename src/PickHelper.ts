import * as THREE from 'three'

export class PickHelper {
  private raycaster = new THREE.Raycaster()
  private pickedObject: THREE.Object3D | null = null

  pick(
    normalizedPosition: THREE.Vector2,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      // this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor)
      this.pickedObject = null
    }

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera)
    // get the list of objects the ray intersected

    const intersectedObjects = this.raycaster.intersectObject(scene.children[0])

    if (intersectedObjects.length === 0) {
      return null
    }

    return intersectedObjects[0].object
  }
}
