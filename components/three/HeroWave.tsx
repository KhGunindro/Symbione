'use client';

import React, { useEffect, useRef } from 'react';

interface HeroWaveProps {
  className?: string;
  opacity?: number;
}

const HeroWave: React.FC<HeroWaveProps> = ({ className = '', opacity = 0.3 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number, imageData: ImageData, data: Uint8ClampedArray;
    const SCALE = 4; // Increased scale for better performance

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      imageData = ctx.createImageData(width, height);
      data = imageData.data;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();

    // Simplified wave calculation for better performance
    const render = () => {
      const time = (Date.now() - startTime) * 0.0005; // Slower time progression

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;

          // Simplified wave calculation with only 2 iterations instead of 4
          let a = 0;
          let d = 0;

          for (let i = 0; i < 2; i++) {
            a += Math.cos(i - d + time * 0.3 - a * u_x);
            d += Math.sin(i * u_y + a);
          }

          // Generate wave intensity with simpler calculations
          const wave = (Math.sin(a) + Math.cos(d)) * 0.5;
          const intensity = 0.2 + 0.6 * wave;
          
          // Simplified variations
          const baseVal = 0.1 + 0.2 * Math.cos(u_x + u_y + time * 0.2);
          const variation = 0.15 * Math.sin(a * 1.2 + time * 0.15);

          // Calculate final grayscale value (black to white gradient)
          const grayValue = Math.max(0, Math.min(1, 
            baseVal + variation * intensity
          ));

          // Apply the grayscale value to RGB channels for white waves
          const finalValue = grayValue * intensity * 255;

          const index = (y * width + x) * 4;
          data[index] = finalValue;     // Red
          data[index + 1] = finalValue; // Green
          data[index + 2] = finalValue; // Blue
          data[index + 3] = 255;        // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Scale up with smooth interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(canvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
    />
  );
};

export default HeroWave;