import { Object3DNode, extend } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<THREE.Group, typeof THREE.Group>
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
      spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
      pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>
      planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>
      sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
      meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
      meshPhysicalMaterial: Object3DNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>
    }
  }
}
