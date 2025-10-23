import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

// Singleton para gestionar contextos WebGL
class WebGLManager {
  constructor() {
    this.contexts = new Map();
    this.maxContexts = 8; // Límite seguro para la mayoría de navegadores
  }

  getContext(canvas, contextId) {
    // Si ya existe un contexto para este canvas, reutilizarlo
    if (this.contexts.has(contextId)) {
      const existing = this.contexts.get(contextId);
      if (existing.canvas === canvas) {
        return existing.gl;
      }
    }

    // Limpiar contextos antiguos si excedemos el límite
    if (this.contexts.size >= this.maxContexts) {
      const oldestKey = this.contexts.keys().next().value;
      const oldest = this.contexts.get(oldestKey);
      if (oldest.gl.getExtension('WEBGL_lose_context')) {
        oldest.gl.getExtension('WEBGL_lose_context').loseContext();
      }
      this.contexts.delete(oldestKey);
      console.log('[WebGLManager] Contexto WebGL liberado:', oldestKey);
    }

    // Crear nuevo contexto
    const gl = canvas.getContext('webgl', { 
      preserveDrawingBuffer: false,
      antialias: true,
      alpha: false,
      depth: true
    });

    if (gl) {
      this.contexts.set(contextId, { gl, canvas });
      console.log('[WebGLManager] Nuevo contexto WebGL creado:', contextId);
    }

    return gl;
  }

  releaseContext(contextId) {
    if (this.contexts.has(contextId)) {
      const context = this.contexts.get(contextId);
      if (context.gl.getExtension('WEBGL_lose_context')) {
        context.gl.getExtension('WEBGL_lose_context').loseContext();
      }
      this.contexts.delete(contextId);
      console.log('[WebGLManager] Contexto WebGL liberado manualmente:', contextId);
    }
  }
}

const webglManager = new WebGLManager();

export default function WebGL360Viewer({ src, title }) {
  console.log('[WebGL360Viewer] 🚀 COMPONENTE RENDERIZADO con src:', src);
  
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(75); // FOV en grados
  const [error, setError] = useState(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureRef = useRef(null);
  const animationRef = useRef(null);
  const contextId = useRef(`webgl360-${Math.random().toString(36).substr(2, 9)}`);
  const isInitialized = useRef(false);

  const stopBubble = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // React SyntheticEvents no tienen stopImmediatePropagation
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation();
    }
  }, []);

  // Vertex shader para la esfera
  const vertexShaderSource = `
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 projection;
    uniform mat4 view;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projection * view * vec4(position, 1.0);
    }
  `;

  // Fragment shader para mapear la textura equirectangular
  const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D texture;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = texture2D(texture, vUv);
    }
  `;

  const createShader = useCallback((gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error enlazando programa:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  const createSphere = useCallback((gl, program) => {
    const latBands = 30;
    const longBands = 30;
    const radius = 1;
    
    const vertices = [];
    const uvs = [];
    const indices = [];
    
    // Generar vértices de la esfera
    for (let lat = 0; lat <= latBands; lat++) {
      const theta = lat * Math.PI / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let long = 0; long <= longBands; long++) {
        const phi = long * 2 * Math.PI / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        
        // Corregir mapeo UV para evitar imagen invertida
        const u = long / longBands;
        const v = lat / latBands;
        
        vertices.push(x * radius, y * radius, z * radius);
        uvs.push(u, v);
      }
    }
    
    // Generar índices
    for (let lat = 0; lat < latBands; lat++) {
      for (let long = 0; long < longBands; long++) {
        const first = (lat * (longBands + 1)) + long;
        const second = first + longBands + 1;
        
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }
    
    // Crear buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    return {
      position: positionBuffer,
      uv: uvBuffer,
      indices: indexBuffer,
      indexCount: indices.length
    };
  }, []);

  const loadTexture = useCallback((gl, src) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Pixel temporal mientras carga
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      setIsLoaded(true);
      console.log('[WebGL360Viewer] ✅ Textura 360° cargada correctamente');
      console.log('[WebGL360Viewer] 🎮 Controles: drag para rotar, wheel para zoom');
    };
    image.onerror = () => {
      console.error('[WebGL360Viewer] Error cargando imagen:', src);
    };
    image.src = src;
    
    return texture;
  }, []);

  const createMatrix4 = useCallback(() => {
    return new Float32Array(16);
  }, []);

  const perspective = useCallback((fovy, aspect, near, far) => {
    const f = 1.0 / Math.tan(fovy / 2);
    const rangeInv = 1 / (near - far);
    
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]);
  }, []);

  const rotateY = useCallback((angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
      c, 0, s, 0,
      0, 1, 0, 0,
      -s, 0, c, 0,
      0, 0, 0, 1
    ]);
  }, []);

  const rotateX = useCallback((angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1
    ]);
  }, []);

  const multiply = useCallback((a, b) => {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    
    return result;
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program || !isLoaded) return;
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    // Matrices
    const projectionMatrix = perspective(
      zoom * Math.PI / 180, 
      gl.canvas.width / gl.canvas.height, 
      0.1, 
      100
    );
    
    const rotX = rotateX(rotation.x * Math.PI / 180);
    const rotY = rotateY(rotation.y * Math.PI / 180);
    const viewMatrix = multiply(rotX, rotY);
    
    // Uniforms
    const projectionLocation = gl.getUniformLocation(program, 'projection');
    const viewLocation = gl.getUniformLocation(program, 'view');
    const textureLocation = gl.getUniformLocation(program, 'texture');
    
    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
    gl.uniform1i(textureLocation, 0);
    
    // Dibujar
    gl.drawElements(gl.TRIANGLES, glRef.current.sphere.indexCount, gl.UNSIGNED_SHORT, 0);
  }, [zoom, rotation, isLoaded, perspective, rotateX, rotateY, multiply]);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[WebGL360Viewer] Canvas no disponible');
      return;
    }

    // Asegurar que el canvas tenga dimensiones válidas
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      console.error('[WebGL360Viewer] Canvas sin dimensiones válidas:', rect);
      setError('Canvas sin dimensiones válidas');
      return;
    }

    canvas.width = rect.width;
    canvas.height = rect.height;

    // Prevenir múltiples inicializaciones
    if (isInitialized.current) {
      console.log('[WebGL360Viewer] Ya inicializado, saltando...');
      return;
    }

    try {
      // Usar WebGLManager para obtener contexto
      const gl = webglManager.getContext(canvas, contextId.current);
      if (!gl) {
        console.error('[WebGL360Viewer] WebGL no soportado');
        setError('WebGL no soportado');
        return;
      }
      
      glRef.current = gl;
      isInitialized.current = true;
    
      // Configurar WebGL
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);
      
      // Crear shaders
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      if (!vertexShader || !fragmentShader) {
        throw new Error('Error creando shaders');
      }
    
      // Crear programa
      const program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) {
        throw new Error('Error creando programa WebGL');
      }
      
      programRef.current = program;
      
      // Crear geometría
      const sphere = createSphere(gl, program);
      gl.sphere = sphere;
      
      // Configurar atributos
      const positionLocation = gl.getAttribLocation(program, 'position');
      const uvLocation = gl.getAttribLocation(program, 'uv');
      
      gl.bindBuffer(gl.ARRAY_BUFFER, sphere.position);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, sphere.uv);
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.indices);
      
      // Cargar textura
      textureRef.current = loadTexture(gl, src);
      
      console.log('[WebGL360Viewer] WebGL inicializado correctamente');
      
    } catch (error) {
      console.error('[WebGL360Viewer] Error inicializando WebGL:', error);
      setError(`Error inicializando WebGL: ${error.message}`);
      isInitialized.current = false;
    }
  }, [src, createShader, createProgram, createSphere, loadTexture]);

  // Función de limpieza
  const cleanup = useCallback(() => {
    console.log('[WebGL360Viewer] Iniciando limpieza...');
    
    // Detener animación
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Limpiar WebGL
    if (glRef.current) {
      const gl = glRef.current;
      
      // Limpiar textura
      if (textureRef.current) {
        gl.deleteTexture(textureRef.current);
        textureRef.current = null;
      }
      
      // Limpiar programa
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
        programRef.current = null;
      }
      
      // Limpiar buffers
      if (gl.sphere) {
        gl.deleteBuffer(gl.sphere.position);
        gl.deleteBuffer(gl.sphere.uv);
        gl.deleteBuffer(gl.sphere.indices);
        gl.sphere = null;
      }
    }

    // Liberar contexto WebGL
    webglManager.releaseContext(contextId.current);
    
    // Reset estado
    glRef.current = null;
    isInitialized.current = false;
    setIsLoaded(false);
    setError(null);
    
    console.log('[WebGL360Viewer] Limpieza completada');
  }, []);

  // Función para obtener coordenadas de mouse o touch
  const getEventCoords = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }, []);

  // Eventos de mouse y touch
  const handleMouseDown = useCallback((e) => {
    const coords = getEventCoords(e);
    setIsDragging(true);
    lastMousePos.current = coords;
    console.log('[WebGL360Viewer] 🖱️ Interacción iniciada - drag');
    stopBubble(e);
  }, [stopBubble, getEventCoords]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const coords = getEventCoords(e);
    const deltaX = coords.x - lastMousePos.current.x;
    const deltaY = coords.y - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    lastMousePos.current = coords;
    console.log('[WebGL360Viewer] 🔄 Rotación actualizada');
    stopBubble(e);
  }, [isDragging, stopBubble, getEventCoords]);

  const handleMouseUp = useCallback((e) => {
    setIsDragging(false);
    console.log('[WebGL360Viewer] 🖱️ Interacción finalizada');
    stopBubble(e);
  }, [stopBubble]);

  const handleWheel = useCallback((e) => {
    const delta = e.deltaY > 0 ? 5 : -5;
    setZoom(prev => Math.max(30, Math.min(120, prev + delta)));
    stopBubble(e);
  }, [stopBubble]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.max(30, prev - 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.min(120, prev + 10));
  }, []);

  const handleCenter = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setZoom(75);
  }, []);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    if (glRef.current) {
      glRef.current.viewport(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Efectos
  useEffect(() => {
    if (src) {
      // Limpiar antes de inicializar nuevo
      cleanup();
      // Pequeño delay para asegurar limpieza
      const timer = setTimeout(() => {
        initWebGL();
      }, 50);
      return () => clearTimeout(timer);
    }
    return cleanup;
  }, [src, initWebGL, cleanup]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Agregar eventos con capture para interceptar antes que el lightbox
    canvas.addEventListener('mousedown', handleMouseDown, { capture: true, passive: false });
    canvas.addEventListener('mousemove', handleMouseMove, { capture: true, passive: false });
    canvas.addEventListener('mouseup', handleMouseUp, { capture: true, passive: false });
    canvas.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    
    // También agregar eventos de touch para dispositivos móviles
    canvas.addEventListener('touchstart', handleMouseDown, { capture: true, passive: false });
    canvas.addEventListener('touchmove', handleMouseMove, { capture: true, passive: false });
    canvas.addEventListener('touchend', handleMouseUp, { capture: true, passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown, { capture: true });
      canvas.removeEventListener('mousemove', handleMouseMove, { capture: true });
      canvas.removeEventListener('mouseup', handleMouseUp, { capture: true });
      canvas.removeEventListener('wheel', handleWheel, { capture: true });
      canvas.removeEventListener('touchstart', handleMouseDown, { capture: true });
      canvas.removeEventListener('touchmove', handleMouseMove, { capture: true });
      canvas.removeEventListener('touchend', handleMouseUp, { capture: true });
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  useEffect(() => {
    if (isLoaded && !animationRef.current) {
      const animate = () => {
        if (glRef.current && isLoaded) {
          render();
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isLoaded, render]);

  // Limpieza al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (!src) return null;

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1000,
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'auto',
          touchAction: 'none',
          position: 'relative',
          zIndex: 100
        }}
      />

      {/* Controles */}
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
        <IconButton onClick={handleZoomIn} sx={{ width: 40, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#fff' }}>
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={handleZoomOut} sx={{ width: 40, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#fff' }}>
          <ZoomOutIcon />
        </IconButton>
        <IconButton onClick={handleCenter} sx={{ width: 40, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#fff' }}>
          <CenterFocusStrongIcon />
        </IconButton>
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ff6b6b', textAlign: 'center', padding: 2 }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️ Error</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>{error}</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
            Intenta recargar la imagen
          </div>
        </Box>
      )}

      {/* Loading */}
      {!isLoaded && !error && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', textAlign: 'center' }}>
          <div>Cargando vista 360°...</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
            Arrastra para navegar • Rueda para zoom
          </div>
        </Box>
      )}

      {/* Instructions */}
      {isLoaded && !error && (
        <Box sx={{ position: 'absolute', top: 16, left: 16, color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', pointerEvents: 'none' }}>
          Arrastra para rotar • Rueda para zoom
        </Box>
      )}
    </Box>
  );
}
