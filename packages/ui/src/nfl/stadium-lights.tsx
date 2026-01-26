'use client'

import * as React from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface StadiumLightsProps {
  intensity?: number
  color?: string
  variant?: 'day' | 'night' | 'broadcast'
  animated?: boolean
}

export function StadiumLights({
  intensity = 1,
  color = '#ffffff',
  variant = 'broadcast',
  animated = false,
}: StadiumLightsProps) {
  const lightRefs = React.useRef<THREE.PointLight[]>([])

  useFrame(({ clock }) => {
    if (animated && lightRefs.current.length > 0) {
      lightRefs.current.forEach((light, i) => {
        if (light) {
          const offset = i * 0.5
          light.intensity = intensity * (0.9 + Math.sin(clock.elapsedTime + offset) * 0.1)
        }
      })
    }
  })

  const config = React.useMemo(() => {
    switch (variant) {
      case 'day':
        return {
          ambient: 0.8,
          directional: 1.2,
          point: 0.6,
          color: '#fffef0',
        }
      case 'night':
        return {
          ambient: 0.3,
          directional: 0.5,
          point: 1.2,
          color: '#ffffff',
        }
      case 'broadcast':
      default:
        return {
          ambient: 0.5,
          directional: 0.9,
          point: 1.0,
          color: '#fff5e6',
        }
    }
  }, [variant])

  return (
    <group>
      {/* Ambient light */}
      <ambientLight intensity={config.ambient * intensity} color={color || config.color} />

      {/* Directional sun/key light */}
      <directionalLight
        position={[20, 40, 10]}
        intensity={config.directional * intensity}
        color={color || config.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Stadium light towers (4 corners) */}
      <StadiumTower
        ref={(ref) => {
          if (ref) lightRefs.current[0] = ref
        }}
        position={[-40, 50, -20]}
        intensity={config.point * intensity}
        color={color || config.color}
      />
      <StadiumTower
        ref={(ref) => {
          if (ref) lightRefs.current[1] = ref
        }}
        position={[40, 50, -20]}
        intensity={config.point * intensity}
        color={color || config.color}
      />
      <StadiumTower
        ref={(ref) => {
          if (ref) lightRefs.current[2] = ref
        }}
        position={[-40, 50, 20]}
        intensity={config.point * intensity}
        color={color || config.color}
      />
      <StadiumTower
        ref={(ref) => {
          if (ref) lightRefs.current[3] = ref
        }}
        position={[40, 50, 20]}
        intensity={config.point * intensity}
        color={color || config.color}
      />

      {/* Fill lights (softer, from sides) */}
      <pointLight position={[-30, 20, 0]} intensity={0.3 * intensity} color={color || config.color} distance={80} />
      <pointLight position={[30, 20, 0]} intensity={0.3 * intensity} color={color || config.color} distance={80} />

      {/* Rim light (from behind) */}
      <spotLight
        position={[0, 30, 40]}
        angle={0.5}
        penumbra={1}
        intensity={0.4 * intensity}
        color={color || config.color}
        castShadow
      />
    </group>
  )
}

const StadiumTower = React.forwardRef<
  THREE.PointLight,
  {
    position: [number, number, number]
    intensity: number
    color: string
  }
>(({ position, intensity, color }, ref) => {
  return (
    <pointLight
      ref={ref}
      position={position}
      intensity={intensity}
      color={color}
      distance={100}
      decay={2}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  )
})

StadiumTower.displayName = 'StadiumTower'
