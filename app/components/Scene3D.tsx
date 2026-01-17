'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Instances, Instance } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Suspense, useMemo } from 'react';

function ParticleField() {
  const count = 50;

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return { positions };
  }, []);

  return (
    <Instances limit={count} range={count} frustumCulled>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial
        color="#00F5FF"
        emissive="#00F5FF"
        emissiveIntensity={0.2}
        transparent
        opacity={0.3}
      />
      {Array.from({ length: count }).map((_, i) => (
        <Instance
          key={i}
          position={[particles.positions[i * 3], particles.positions[i * 3 + 1], particles.positions[i * 3 + 2]]}
        />
      ))}
    </Instances>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} color="#00F5FF" />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#FF4D00" />
      <ParticleField />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#0A1A2E" 
          opacity={0.2}
          transparent
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <EffectComposer>
        <Bloom intensity={0.15} luminanceThreshold={0.95} />
        <Vignette eskil={false} offset={0.2} darkness={0.25} />
      </EffectComposer>
    </>
  );
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 5, 15], fov: 50 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
          <PerspectiveCamera makeDefault position={[0, 5, 15]} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.15}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.8}
          />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
