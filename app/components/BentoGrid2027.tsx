/**
 * EDGELOOP BENTO GRID - 2027 Modern Layout
 * Using MeshPortalMaterial for 3D portal effects
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { MeshPortalMaterial, Text } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface BentoGridItemProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
  delay?: number;
  title?: string;
}

export function BentoGridItem({ children, className = '', span = 1, delay = 0, title }: BentoGridItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`card-3d p-6 ${span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''} ${className}`}
    >
      {title && (
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}

// 3D Portal Card Component
export function PortalCard({ children, title }: { children: ReactNode; title?: string }) {
  const portalRef = useRef<THREE.Mesh>(null);

  return (
    <div className="card-3d p-6 relative overflow-hidden">
      {title && (
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      )}
      <div className="relative h-64">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <mesh ref={portalRef}>
            <planeGeometry args={[4, 4]} />
            <MeshPortalMaterial blur={0.5} resolution={256}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} />
              {children}
            </MeshPortalMaterial>
          </mesh>
        </Canvas>
      </div>
    </div>
  );
}
