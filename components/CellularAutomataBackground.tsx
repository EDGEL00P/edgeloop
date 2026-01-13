import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/lib/store';

export function CellularAutomataBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { reduceMotion, themeIntensity } = useSettings();

  const getOpacity = useCallback(() => {
    switch (themeIntensity) {
      case 'low': return 0.15;
      case 'high': return 0.4;
      default: return 0.25;
    }
  }, [themeIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cellSize = 12;
    const cols = Math.ceil(canvas.width / cellSize);
    const rows = Math.ceil(canvas.height / cellSize);

    let grid: number[][] = [];
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        grid[i][j] = Math.random() > 0.85 ? 1 : 0;
      }
    }

    const colors = [
      `hsla(185, 100%, 50%, ${getOpacity()})`,
      `hsla(280, 100%, 65%, ${getOpacity()})`,
      `hsla(320, 100%, 60%, ${getOpacity()})`,
    ];

    const countNeighbors = (grid: number[][], x: number, y: number) => {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const row = (y + i + rows) % rows;
          const col = (x + j + cols) % cols;
          sum += grid[row][col];
        }
      }
      return sum;
    };

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      
      if (!reduceMotion && frameCount % 8 === 0) {
        const newGrid: number[][] = [];
        for (let i = 0; i < rows; i++) {
          newGrid[i] = [];
          for (let j = 0; j < cols; j++) {
            const neighbors = countNeighbors(grid, j, i);
            if (grid[i][j] === 1) {
              newGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
            } else {
              newGrid[i][j] = neighbors === 3 ? 1 : 0;
            }
          }
        }
        grid = newGrid;
      }

      ctx.fillStyle = 'rgba(5, 5, 15, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (grid[i][j] === 1) {
            const colorIndex = (i + j + frameCount) % colors.length;
            ctx.fillStyle = colors[colorIndex];
            ctx.beginPath();
            ctx.arc(
              j * cellSize + cellSize / 2,
              i * cellSize + cellSize / 2,
              cellSize / 3,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (!reduceMotion) {
      animate();
    } else {
      ctx.fillStyle = 'rgba(5, 5, 15, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (grid[i][j] === 1) {
            const colorIndex = (i + j) % colors.length;
            ctx.fillStyle = colors[colorIndex];
            ctx.beginPath();
            ctx.arc(
              j * cellSize + cellSize / 2,
              i * cellSize + cellSize / 2,
              cellSize / 3,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [reduceMotion, getOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: 'hsl(240, 15%, 3%)' }}
    />
  );
}
