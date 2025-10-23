import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export default function ThreeJS360Viewer({ src, title }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  const stopBubble = useCallback((e) => { 
    try { 
      e.stopPropagation(); 
      e.preventDefault();
    } catch {} 
  }, []);

  const ensureThreeJS = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.THREE) return resolve();
      
      // Cargar Three.js desde CDN
      if (!document.getElementById('threejs-script')) {
        const script = document.createElement('script');
        script.id = 'threejs-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = Math.max(30, cameraRef.current.fov - 10);
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = Math.min(120, cameraRef.current.fov + 10);
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const handleCenter = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.rotation.set(0, 0, 0);
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
      rotationRef.current = { x: 0, y: 0 };
    }
  }, []);

  const handleMouseDown = useCallback((event) => {
    setIsMouseDown(true);
    mouseRef.current = {
      x: event.clientX,
      y: event.clientY
    };
    stopBubble(event);
  }, [stopBubble]);

  const handleMouseMove = useCallback((event) => {
    if (!isMouseDown || !cameraRef.current) return;

    const deltaX = event.clientX - mouseRef.current.x;
    const deltaY = event.clientY - mouseRef.current.y;

    rotationRef.current.y -= deltaX * 0.005;
    rotationRef.current.x -= deltaY * 0.005;

    // Limitar rotación vertical
    rotationRef.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationRef.current.x));

    cameraRef.current.rotation.set(rotationRef.current.x, rotationRef.current.y, 0);

    mouseRef.current = {
      x: event.clientX,
      y: event.clientY
    };

    stopBubble(event);
  }, [isMouseDown, stopBubble]);

  const handleMouseUp = useCallback((event) => {
    setIsMouseDown(false);
    stopBubble(event);
  }, [stopBubble]);

  const handleWheel = useCallback((event) => {
    if (!cameraRef.current) return;
    
    const delta = event.deltaY > 0 ? 5 : -5;
    cameraRef.current.fov = Math.max(30, Math.min(120, cameraRef.current.fov + delta));
    cameraRef.current.updateProjectionMatrix();
    
    stopBubble(event);
  }, [stopBubble]);

  useEffect(() => {
    let cancelled = false;
    let animationId = null;

    console.log('[ThreeJS360Viewer] Iniciando con src:', src);
    if (!src || !mountRef.current) {
      console.log('[ThreeJS360Viewer] No hay src o mountRef');
      return;
    }

    ensureThreeJS()
      .then(() => {
        if (cancelled || !mountRef.current || !window.THREE) return;

        const THREE = window.THREE;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Crear escena
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Crear cámara
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 0, 0);
        cameraRef.current = camera;

        // Crear renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        // Limpiar contenedor y agregar canvas
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);

        // Crear geometría esférica (invertida para ver desde adentro)
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invertir para ver desde adentro

        // Cargar textura
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          src,
          (texture) => {
            if (cancelled) return;

            // Configurar textura para equirectangular
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.flipY = false;

            // Crear material
            const material = new THREE.MeshBasicMaterial({ 
              map: texture,
              side: THREE.BackSide // Ver desde adentro
            });

            // Crear mesh
            const sphere = new THREE.Mesh(geometry, material);
            sphereRef.current = sphere;
            scene.add(sphere);

            setIsLoaded(true);
            console.log('[ThreeJS360Viewer] Panorama 360° cargado exitosamente');
          },
          (progress) => {
            console.log('[ThreeJS360Viewer] Cargando:', (progress.loaded / progress.total * 100) + '%');
          },
          (error) => {
            console.warn('[ThreeJS360Viewer] Error cargando textura:', error);
          }
        );

        // Función de animación
        const animate = () => {
          if (cancelled) return;
          animationId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Manejar redimensionamiento
        const handleResize = () => {
          if (!mountRef.current || !camera || !renderer) return;
          const newWidth = mountRef.current.clientWidth;
          const newHeight = mountRef.current.clientHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      })
      .catch((error) => {
        console.warn('[ThreeJS360Viewer] Error cargando Three.js:', error);
      });

    return () => {
      cancelled = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sphereRef.current) {
        if (sphereRef.current.geometry) sphereRef.current.geometry.dispose();
        if (sphereRef.current.material) {
          if (sphereRef.current.material.map) sphereRef.current.material.map.dispose();
          sphereRef.current.material.dispose();
        }
      }
      setIsLoaded(false);
    };
  }, [src, ensureThreeJS]);

  // Event listeners para mouse
  useEffect(() => {
    const canvas = mountRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  if (!src) return null;

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        cursor: isMouseDown ? 'grabbing' : 'grab'
      }}
    >
      {/* Contenedor Three.js */}
      <div
        ref={mountRef}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
      />

      {/* Controles personalizados */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        <IconButton
          onClick={handleZoomIn}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <ZoomInIcon />
        </IconButton>

        <IconButton
          onClick={handleZoomOut}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <ZoomOutIcon />
        </IconButton>

        <IconButton
          onClick={handleCenter}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CenterFocusStrongIcon />
        </IconButton>
      </Box>

      {/* Indicador de carga */}
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '14px',
            zIndex: 1001,
            textAlign: 'center'
          }}
        >
          <div>Cargando vista 360°...</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
            Arrastra para navegar
          </div>
        </Box>
      )}
    </Box>
  );
}
