'use client'

import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import { PresentationControls, Environment, MeshReflectorMaterial, Text } from '@react-three/drei'
import { cn } from '../utils'

export interface ReflectiveCardProps {
  title?: string
  value?: string | number
  subtitle?: string
  variant?: 'glossy' | 'metallic' | 'glass' | 'holographic'
  color?: string
  className?: string
  children?: React.ReactNode
}

export function ReflectiveCard({
  title,
  value,
  subtitle,
  variant = 'glossy',
  color = '#1d4ed8',
  className,
  children,
}: ReflectiveCardProps) {
  return (
    <div className={cn('relative rounded-2xl overflow-hidden h-64', className)}>
      <Canvas camera={{ position: [0, 0, 8], fov: 35 }} dpr={[1, 2]}>
        <PresentationControls
          global
          snap
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <Card3D variant={variant} color={color} title={title} value={value} subtitle={subtitle} />
        </PresentationControls>

        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      </Canvas>

      {children && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-end">
          <div className="pointer-events-auto">{children}</div>
        </div>
      )}
    </div>
  )
}

function Card3D({
  variant,
  color,
  title,
  value,
  subtitle,
}: {
  variant: ReflectiveCardProps['variant']
  color: string
  title?: string
  value?: string | number
  subtitle?: string
}) {
  const materials = {
    glossy: {
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    },
    metallic: {
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.5,
    },
    glass: {
      metalness: 0.1,
      roughness: 0,
      transmission: 0.9,
      thickness: 0.5,
      envMapIntensity: 2,
    },
    holographic: {
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 2,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.3,
    },
  }

  const props = materials[variant || 'glossy']

  return (
    <group>
      {/* Main card body */}
      <mesh castShadow>
        <boxGeometry args={[6, 8, 0.2]} />
        <meshPhysicalMaterial color={color} {...props} />
      </mesh>

      {/* Beveled edges */}
      <mesh position={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[5.8, 7.8, 0.1]} />
        <meshPhysicalMaterial color={color} {...props} opacity={0.8} transparent />
      </mesh>

      {/* Text labels */}
      {title && (
        <Text
          position={[0, 2.5, 0.2]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {title}
        </Text>
      )}

      {value && (
        <Text
          position={[0, 0, 0.2]}
          fontSize={1.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
          fontWeight={700}
        >
          {value}
        </Text>
      )}

      {subtitle && (
        <Text
          position={[0, -2.5, 0.2]}
          fontSize={0.4}
          color="rgba(255,255,255,0.7)"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-medium.woff"
        >
          {subtitle}
        </Text>
      )}

      {/* Shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
        />
      </mesh>
    </group>
  )
}
