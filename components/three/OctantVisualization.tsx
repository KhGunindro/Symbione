'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EmotionType, EMOTIONS, getEmotionTheme } from '@/lib/emotions';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { fetchOctantNews, fetchHistoricalOctantNews } from '@/lib/store/slices/newsSlice';

interface NewsParticle {
  id: string;
  headline: string;
  source: string;
  emotion: EmotionType;
  position: THREE.Vector3;
  intensity: number;
  mesh?: THREE.Mesh;
  emotionMaterial?: THREE.MeshBasicMaterial;
  article: ProcessedNewsArticle;
}

interface OctantVisualizationProps {
  onParticleClick: (article: ProcessedNewsArticle) => void;
  viewType?: 'today' | 'yearly';
}

// Define strict octant boundaries for each emotion
const OCTANT_BOUNDARIES = {
  joy: { x: [0.5, 4.5], y: [0.5, 4.5], z: [0.5, 4.5] },        // Positive X, Y, Z
  trust: { x: [-4.5, -0.5], y: [0.5, 4.5], z: [0.5, 4.5] },    // Negative X, Positive Y, Z
  fear: { x: [0.5, 4.5], y: [-4.5, -0.5], z: [0.5, 4.5] },     // Positive X, Negative Y, Positive Z
  surprise: { x: [-4.5, -0.5], y: [-4.5, -0.5], z: [0.5, 4.5] }, // Negative X, Y, Positive Z
  sadness: { x: [0.5, 4.5], y: [0.5, 4.5], z: [-4.5, -0.5] },   // Positive X, Y, Negative Z
  disgust: { x: [-4.5, -0.5], y: [0.5, 4.5], z: [-4.5, -0.5] }, // Negative X, Positive Y, Negative Z
  anger: { x: [0.5, 4.5], y: [-4.5, -0.5], z: [-4.5, -0.5] },   // Positive X, Negative Y, Negative Z
  anticipation: { x: [-4.5, -0.5], y: [-4.5, -0.5], z: [-4.5, -0.5] } // Negative X, Y, Z
};

export default function OctantVisualization({ onParticleClick, viewType = 'today' }: OctantVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const particlesRef = useRef<NewsParticle[]>([]);
  const hoveredParticleRef = useRef<NewsParticle | null>(null);
  const [sceneInitialized, setSceneInitialized] = useState(false);

  const dispatch = useAppDispatch();
  
  // Get articles from Redux store based on view type
  const { octantArticles, historicalOctantArticles, isLoading } = useAppSelector(state => state.news);
  const { octantEmotionDistribution } = useAppSelector(state => state.emotion);

  // Choose the correct articles based on view type
  const currentArticles = viewType === 'yearly' ? historicalOctantArticles : octantArticles;

  // Load articles if not already loaded
  useEffect(() => {
    if (viewType === 'today' && octantArticles.length === 0 && !isLoading) {
      dispatch(fetchOctantNews(1000));
    } else if (viewType === 'yearly' && historicalOctantArticles.length === 0 && !isLoading) {
      dispatch(fetchHistoricalOctantNews());
    }
  }, [dispatch, viewType, octantArticles.length, historicalOctantArticles.length, isLoading]);

  // Initialize scene only once
  useEffect(() => {
    if (!mountRef.current || sceneInitialized) return;

    // Scene setup with TRANSPARENT background
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - positioned closer to origin
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup with TRANSPARENT background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, // Enable transparency
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Fully transparent background
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create coordinate system axes with dotted particles
    const axisLength = 10;
    const axisParticleSize = 0.03;
    const axisParticleSpacing = 0.2;
    const axisParticleGeometry = new THREE.SphereGeometry(axisParticleSize, 8, 8);
    const axisParticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // X-axis particles
    for (let x = -axisLength; x <= axisLength; x += axisParticleSpacing) {
      const particle = new THREE.Mesh(axisParticleGeometry, axisParticleMaterial);
      particle.position.set(x, 0, 0);
      scene.add(particle);
    }
    
    // Y-axis particles
    for (let y = -axisLength; y <= axisLength; y += axisParticleSpacing) {
      const particle = new THREE.Mesh(axisParticleGeometry, axisParticleMaterial);
      particle.position.set(0, y, 0);
      scene.add(particle);
    }
    
    // Z-axis particles
    for (let z = -axisLength; z <= axisLength; z += axisParticleSpacing) {
      const particle = new THREE.Mesh(axisParticleGeometry, axisParticleMaterial);
      particle.position.set(0, 0, z);
      scene.add(particle);
    }

    // Create grid lines
    const gridSize = 20;
    const gridDivisions = 20;
    
    // XY plane grid
    const xyGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    xyGrid.rotateX(Math.PI / 2);
    scene.add(xyGrid);

    // XZ plane grid
    const xzGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    scene.add(xzGrid);

    // YZ plane grid
    const yzGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    yzGrid.rotateZ(Math.PI / 2);
    scene.add(yzGrid);

    // Enhanced lighting for better particle visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Mouse controls
    let mouseX = 0, mouseY = 0;
    let isMouseDown = false;
    let cameraRadius = Math.sqrt(camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2);
    let cameraTheta = Math.atan2(camera.position.z, camera.position.x);
    let cameraPhi = Math.acos(camera.position.y / cameraRadius);

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        cameraTheta -= deltaX * 0.01;
        cameraPhi += deltaY * 0.01;
        
        // Constrain phi to avoid gimbal lock
        cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi));
        
        // Update camera position
        camera.position.x = cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
        camera.position.y = cameraRadius * Math.cos(cameraPhi);
        camera.position.z = cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
        
        camera.lookAt(0, 0, 0);
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      }

      // Handle particle hover effects only when not dragging
      if (!isMouseDown) {
        const rect = mountRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const meshes = particlesRef.current.map(p => p.mesh!).filter(Boolean);
        const intersects = raycaster.intersectObjects(meshes);

        // Reset all particles to normal scale
        particlesRef.current.forEach(particle => {
          if (particle.mesh) {
            particle.mesh.scale.setScalar(1);
          }
        });

        hoveredParticleRef.current = null;

        // Highlight hovered particle with larger scale
        if (intersects.length > 0) {
          const intersectedMesh = intersects[0].object;
          const particle = particlesRef.current.find(p => p.mesh === intersectedMesh);
          if (particle && particle.mesh) {
            particle.mesh.scale.setScalar(2.0);
            hoveredParticleRef.current = particle;
          }
        }
      }
    };

    // Zoom control
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraRadius += event.deltaY * 0.01;
      cameraRadius = Math.max(5, Math.min(50, cameraRadius));
      
      camera.position.x = cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.position.y = cameraRadius * Math.cos(cameraPhi);
      camera.position.z = cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      
      camera.lookAt(0, 0, 0);
    };

    const handleClick = (event: MouseEvent) => {
      if (isMouseDown) return;
      
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const meshes = particlesRef.current.map(p => p.mesh!).filter(Boolean);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;
        const particle = particlesRef.current.find(p => p.mesh === intersectedMesh);
        if (particle) {
          onParticleClick(particle.article);
        }
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop - REMOVED floating animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Particles are now completely static - no floating animation
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    setSceneInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      setSceneInitialized(false);
    };
  }, [onParticleClick]);

  // Create particles in strict octant boundaries when articles change
  useEffect(() => {
    if (!sceneRef.current || !currentArticles || currentArticles.length === 0 || !sceneInitialized) return;

    const scene = sceneRef.current;
    
    // Clear existing news particles only
    particlesRef.current.forEach(particle => {
      if (particle.mesh) {
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        if (particle.emotionMaterial) {
          particle.emotionMaterial.dispose();
        }
      }
    });
    particlesRef.current = [];

    // Create particles positioned strictly within emotion octants
    const newsParticles: NewsParticle[] = [];
    const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    
    currentArticles.forEach((article, index) => {
      const emotionConfig = EMOTIONS[article.emotion];
      const boundaries = OCTANT_BOUNDARIES[article.emotion];
      
      // Create emotion-colored material
      const emotionMaterial = new THREE.MeshBasicMaterial({ 
        color: emotionConfig.color
      });
      
      const mesh = new THREE.Mesh(particleGeometry, emotionMaterial);
      
      // Position particles STRICTLY within the emotion's octant boundaries
      const position = new THREE.Vector3(
        boundaries.x[0] + Math.random() * (boundaries.x[1] - boundaries.x[0]),
        boundaries.y[0] + Math.random() * (boundaries.y[1] - boundaries.y[0]),
        boundaries.z[0] + Math.random() * (boundaries.z[1] - boundaries.z[0])
      );
      
      mesh.position.copy(position);
      
      const particle: NewsParticle = {
        id: article.id,
        headline: article.headline,
        source: article.source,
        emotion: article.emotion,
        position: position.clone(),
        intensity: article.intensity,
        mesh,
        emotionMaterial: emotionMaterial,
        article
      };
      
      newsParticles.push(particle);
      scene.add(mesh);
    });
    
    particlesRef.current = newsParticles;
    console.log(`Created ${newsParticles.length} particles in strict octant boundaries for ${viewType} view`);
  }, [currentArticles, sceneInitialized, viewType]);

  // Calculate emotion statistics for display
  const emotionStats = (currentArticles || []).reduce((stats, article) => {
    stats[article.emotion] = (stats[article.emotion] || 0) + 1;
    return stats;
  }, {} as Record<EmotionType, number>);

  // Get total articles count
  const totalArticles = currentArticles?.length || 0;

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-pointer" />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center glass z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto mb-6"></div>
            <div className="text-white text-xl font-semibold">Loading Octant Space</div>
            <div className="text-white/60 text-sm mt-3">
              {viewType === 'yearly' 
                ? 'Loading top 8 highest intensity articles...' 
                : 'Organizing articles in strict octant boundaries...'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}