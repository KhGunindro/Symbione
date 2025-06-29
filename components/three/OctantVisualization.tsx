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

    // Create coordinate system axes with dotted particles (like the HTML example)
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

    // Create grid lines (like the HTML example)
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

    // Mouse controls (same as HTML example)
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

    // Zoom control (same as HTML example)
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Subtle floating animation for particles
      const time = Date.now() * 0.001;
      particlesRef.current.forEach((particle, index) => {
        if (particle.mesh) {
          const floatY = Math.sin(time + index * 0.1) * 0.02;
          particle.mesh.position.y = particle.position.y + floatY;
        }
      });
      
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

  // Create stationary particles near origin when articles change
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

    // Create stationary particles positioned NEAR ORIGIN (0,0,0) with emotion colors
    const newsParticles: NewsParticle[] = [];
    const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    
    currentArticles.forEach((article, index) => {
      const emotionConfig = EMOTIONS[article.emotion];
      
      // Create emotion-colored material
      const emotionMaterial = new THREE.MeshBasicMaterial({ 
        color: emotionConfig.color
      });
      
      const mesh = new THREE.Mesh(particleGeometry, emotionMaterial);
      
      // Position particles VERY CLOSE to origin with small random distribution
      const maxDistance = 5; // Keep within 5 units of origin
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const radius = Math.random() * maxDistance;
      
      const position = new THREE.Vector3(
        radius * Math.sin(angle2) * Math.cos(angle1),
        radius * Math.sin(angle2) * Math.sin(angle1),
        radius * Math.cos(angle2)
      );
      
      // Add slight emotion-based bias while staying near origin
      const emotionBias = getEmotionBias(article.emotion);
      position.add(emotionBias.multiplyScalar(0.5)); // Small bias
      
      // Ensure particles stay close to origin
      position.clampLength(0, 5);
      
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
    console.log(`Created ${newsParticles.length} stationary particles near origin (0,0,0) for ${viewType} view`);
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
                : 'Organizing articles near origin...'
              }
            </div>
          </div>
        </div>
      )}

      {/* Premium Controls */}
      <div className="absolute top-6 left-6 z-10">
        <div className="glass-card border-white/20 hover-glow p-4 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5">
          <div className="text-white text-sm space-y-2">
            <div className="font-semibold text-white/90 mb-3">Navigation Controls</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white/70">Click and drag to rotate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/70">Scroll to zoom</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-white/70">Hover to highlight</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-white/70">Click to read article</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Origin Indicator */}
      <div className="absolute top-6 right-6 z-10">
        <div className="glass-card border-white/20 hover-glow p-4 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5">
          <div className="text-center">
            <div className="text-white/90 font-semibold mb-2">Origin Point</div>
            <div className="text-3xl font-mono text-blue-400 mb-1">(0,0,0)</div>
            <div className="text-xs text-white/60">
              {viewType === 'yearly' 
                ? 'Top 8 highest intensity articles' 
                : 'All particles clustered near center'
              }
            </div>
            <div className="mt-3 flex justify-center space-x-1">
              <div className="w-1 h-1 bg-red-400 rounded-full"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            </div>
            <div className="text-xs text-white/50 mt-1">X Y Z axes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get slight emotion-based positioning bias
function getEmotionBias(emotion: EmotionType): THREE.Vector3 {
  const biases: Record<EmotionType, THREE.Vector3> = {
    joy: new THREE.Vector3(0.2, 0.3, 0.1),
    sadness: new THREE.Vector3(-0.2, -0.3, -0.1),
    anger: new THREE.Vector3(0.3, -0.2, 0.2),
    fear: new THREE.Vector3(-0.3, 0.1, -0.2),
    surprise: new THREE.Vector3(0.1, 0.2, -0.3),
    disgust: new THREE.Vector3(-0.1, -0.2, 0.3),
    trust: new THREE.Vector3(0.2, -0.1, -0.2),
    anticipation: new THREE.Vector3(-0.2, 0.3, 0.2)
  };
  
  return biases[emotion] || new THREE.Vector3(0, 0, 0);
}