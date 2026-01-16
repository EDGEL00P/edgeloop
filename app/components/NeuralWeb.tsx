/**
 * NEURAL WEB BACKGROUND
 * Living, sentient background that represents AI thinking
 * React Canvas implementation for high performance
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface NeuralWebProps {
  state?: 'idle' | 'loading' | 'critical';
  intensity?: number; // 0-1, controls particle speed
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  pulse: number;
  size?: number;
}

export function NeuralWeb({ state = 'idle', intensity = 0.3, className = '' }: NeuralWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // State-based colors - MORE INTENSE
  const stateColors = {
    idle: { primary: 'rgba(0, 245, 255, 0.4)', secondary: 'rgba(0, 245, 255, 0.15)' }, // Electric Cyan - BRIGHTER
    loading: { primary: 'rgba(147, 51, 234, 0.5)', secondary: 'rgba(147, 51, 234, 0.2)' }, // Purple - BRIGHTER
    critical: { primary: 'rgba(255, 77, 0, 0.7)', secondary: 'rgba(255, 77, 0, 0.3)' }, // Toxic Orange - BRIGHTER
  };

  const colors = stateColors[state];

  // Initialize particles
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Create MORE particles for dramatic effect
    const particleCount = Math.floor((dimensions.width * dimensions.height) / 8000); // More particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * (0.8 + intensity * 2),
      vy: (Math.random() - 0.5) * (0.8 + intensity * 2),
      connections: [],
      pulse: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 3, // Variable particle sizes
    }));

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      const particles = particlesRef.current;

      // Update particles
      particles.forEach((particle) => {
        particle.x += particle.vx * (0.5 + intensity);
        particle.y += particle.vy * (0.5 + intensity);
        particle.pulse += 0.02;

        // Boundary wrap
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;
      });

      // Draw connections - MORE VISIBLE
      const maxDistance = 180; // Increased connection distance
      particles.forEach((particle, i) => {
        particle.connections = [];
        particles.forEach((other, j) => {
          if (i !== j) {
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
              const opacity = (1 - distance / maxDistance) * 0.5; // More visible
              ctx.strokeStyle = colors.primary; // Use primary color for connections
              ctx.globalAlpha = opacity;
              ctx.lineWidth = 1; // Thicker lines
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
              particle.connections.push(j);
            }
          }
        });
      });

      // Draw particles - MORE DRAMATIC
      particles.forEach((particle) => {
        const pulseSize = (particle.size || 2) + Math.sin(particle.pulse) * 2;
        const opacity = 0.6 + Math.sin(particle.pulse) * 0.4;

        // Outer glow - LARGER
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulseSize * 3
        );
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(0.5, colors.primary.replace('1)', '0.3)'));
        gradient.addColorStop(1, colors.primary.replace('1)', '0)'));
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = opacity * 0.5;
        ctx.fill();

        // Middle glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = opacity * 0.7;
        ctx.fill();

        // Core particle - BRIGHTER
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = opacity;
        ctx.fill();
        
        // White hot center
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = opacity * 0.8;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, intensity, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
