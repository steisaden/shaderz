import React, { useEffect, useRef } from 'react';

export const NEON_FOG_GRID_PRESET = {
  gridScale: 2.5,
  lineWidth: 0.03,
  perspective: 1.5,
  horizon: 0.1,
  gridGlow: 0.6,
  fogIntensity: 0.8,
  fogSpeed: 0.15,
  grainAmount: 0.04,
  vignette: 1.2,
  colorBase: [0.15, 0.05, 0.2] as [number, number, number],
  colorGridA: [0.0, 0.8, 1.0] as [number, number, number],
  colorGridB: [0.2, 0.1, 1.0] as [number, number, number],
  colorFogPurple: [0.4, 0.0, 0.6] as [number, number, number],
  colorFogCyan: [0.0, 0.5, 0.6] as [number, number, number],
  colorAccent: [0.8, 0.6, 0.0] as [number, number, number],
};

export interface GridSurface {
  enabled: boolean;
  color: [number, number, number, number]; // RGBA
  rotation: [number, number, number]; // X, Y, Z
  tileWidth: number;
  tileDepth: number;
  patternType: number; // 3-12, or 13 for circle
  patternSize: number;
  patternRotation: number;
  offset: [number, number];
}

export interface NeonFogGridProps {
  speed?: number;
  gridScale?: number;
  lineWidth?: number;
  perspective?: number;
  horizon?: number;
  gridGlow?: number;
  fogIntensity?: number;
  fogSpeed?: number;
  grainAmount?: number;
  vignette?: number;
  colorBase?: [number, number, number];
  colorGridA?: [number, number, number];
  colorGridB?: [number, number, number];
  colorFogPurple?: [number, number, number];
  colorFogCyan?: [number, number, number];
  colorAccent?: [number, number, number];
  gridSurfaces?: GridSurface[];
  className?: string;
  staticMode?: boolean;
}

const vertexShaderSource = `#version 300 es
in vec2 position;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

out vec4 outColor;

uniform vec2 iResolution;
uniform float iTime;

uniform float uGridScale;
uniform float uLineWidth;
uniform float uPerspective;
uniform float uHorizon;
uniform float uGridGlow;
uniform float uFogIntensity;
uniform float uFogSpeed;
uniform float uGrainAmount;
uniform float uVignette;

uniform vec3 uColorBase;
uniform vec3 uColorGridA;
uniform vec3 uColorGridB;
uniform vec3 uColorFogPurple;
uniform vec3 uColorFogCyan;
uniform vec3 uColorAccent;
uniform vec4 uSurfaceColors[4];
uniform vec3 uSurfaceRotations[4];

float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
    float f = 0.0;
    float amp = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for(int i = 0; i < 4; i++) {
        f += amp * snoise(p);
        p = m * p;
        amp *= 0.5;
    }
    return f;
}

float sdPolygon(vec2 p, float r, int sides) {
    float a = atan(p.y, p.x) + 3.14159 / float(sides);
    float b = 6.28318 / float(sides);
    return cos(floor(.5 + a / b) * b - a) * length(p) - r;
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec3 col = uColorBase;
    float pY = p.y - uHorizon;
    float isFloor = smoothstep(0.0, -0.05, pY);
    
    if (pY < 0.0) {
        float yDist = abs(pY);
        float py = max(yDist, 0.001);
        vec2 gridP = vec2(p.x / (py * uPerspective), 1.0 / (py * uPerspective));
        
        vec3 finalGridCol = vec3(0.0);
        for(int i = 0; i < 4; i++) {
            if (uSurfaceColors[i].a > 0.0) {
                vec2 rotatedGridP = gridP;
                float rotZ = radians(uSurfaceRotations[i].z);
                mat2 rotMat = mat2(cos(rotZ), -sin(rotZ), sin(rotZ), cos(rotZ));
                rotatedGridP = rotMat * (gridP + uSurfaceRotations[i].xy);

                vec2 centered = fract(rotatedGridP * uGridScale) - 0.5;
                float sides = uSurfaceColors[i].a * 100.0; // Use alpha channel to encode pattern type if needed, or pass as array
                // For now, mapping pattern type based on uniform rotation X
                float patternType = uSurfaceRotations[i].x;
                float d = (patternType > 12.5) ? sdCircle(centered, 0.2) : sdPolygon(centered, 0.2, int(patternType));
                
                float edge = smoothstep(0.02, 0.0, abs(d) - 0.05);
                finalGridCol += uSurfaceColors[i].rgb * edge * uSurfaceColors[i].a;
            }
        }
        
        float timeMove = iTime * 0.5;
        gridP.y -= timeMove;
        
        vec2 gridUV = fract(gridP * uGridScale);
        vec2 distToEdge = abs(gridUV - 0.5);
        
        vec2 fw = fwidth(gridP * uGridScale);
        fw = max(fw, 0.0001);
        
        vec2 lineMaskStr = smoothstep(fw, vec2(0.0), distToEdge - (0.5 - uLineWidth));
        float lines = max(lineMaskStr.x, lineMaskStr.y);
        vec2 glowMaskStr = exp(-distToEdge * 8.0);
        float glow = max(glowMaskStr.x, glowMaskStr.y) * uGridGlow;
        float zDepth = 1.0 / py;
        float fade = exp(-zDepth * 0.2);
        
        vec3 gridActualColor = mix(uColorGridB, uColorGridA, lines) + finalGridCol;
        vec3 floorEmissive = gridActualColor * lines + uColorGridA * glow;
        
        col = mix(col, floorEmissive, fade * isFloor);
    }
    
    float tFog = iTime * uFogSpeed;
    vec2 fogUV1 = p * 1.5 + vec2(tFog * 0.5, tFog * 0.2);
    float noise1 = fbm(fogUV1) * 0.5 + 0.5;
    col += uColorFogPurple * noise1 * 0.5 * uFogIntensity;
    
    vec2 fogUV2 = p * 2.0 + vec2(-tFog * 0.8, tFog * 0.3);
    float noise2 = fbm(fogUV2 + noise1) * 0.5 + 0.5;
    col += uColorFogCyan * noise2 * 0.5 * uFogIntensity;
    
    vec2 accentPos = vec2(0.8, -0.5);
    float accentDist = length(p - accentPos);
    float accentGlow = exp(-accentDist * 2.5);
    float pulse = sin(iTime * 1.5) * 0.1 + 0.9;
    col += uColorAccent * accentGlow * pulse * 0.8 * uFogIntensity;
    
    float horizonGlow = exp(-abs(pY) * 3.0);
    col += mix(uColorFogPurple, uColorGridA, 0.5) * horizonGlow * 0.3 * uFogIntensity;
    
    float vig = length(p);
    col *= 1.0 - smoothstep(0.5, uVignette * 2.0, vig);
    
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float grain = hash(uv + fract(iTime)) - 0.5;
    col += grain * uGrainAmount;
    
    col = col * col * (3.0 - 2.0 * col);
    
    outColor = vec4(col, 1.0);
}
`;

export default function NeonFogGrid({
  speed = 1.0,
  gridScale = NEON_FOG_GRID_PRESET.gridScale,
  lineWidth = NEON_FOG_GRID_PRESET.lineWidth,
  perspective = NEON_FOG_GRID_PRESET.perspective,
  horizon = NEON_FOG_GRID_PRESET.horizon,
  gridGlow = NEON_FOG_GRID_PRESET.gridGlow,
  fogIntensity = NEON_FOG_GRID_PRESET.fogIntensity,
  fogSpeed = NEON_FOG_GRID_PRESET.fogSpeed,
  grainAmount = NEON_FOG_GRID_PRESET.grainAmount,
  vignette = NEON_FOG_GRID_PRESET.vignette,
  colorBase = NEON_FOG_GRID_PRESET.colorBase,
  colorGridA = NEON_FOG_GRID_PRESET.colorGridA,
  colorGridB = NEON_FOG_GRID_PRESET.colorGridB,
  colorFogPurple = NEON_FOG_GRID_PRESET.colorFogPurple,
  colorFogCyan = NEON_FOG_GRID_PRESET.colorFogCyan,
  colorAccent = NEON_FOG_GRID_PRESET.colorAccent,
  gridSurfaces = [],
  className = '',
  staticMode = false,
}: NeonFogGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const isReducedMotion = useRef(false);

  const propsRef = useRef({
    speed, gridScale, lineWidth, perspective, horizon, gridGlow,
    fogIntensity, fogSpeed, grainAmount, vignette, colorBase, colorGridA,
    colorGridB, colorFogPurple, colorFogCyan, colorAccent, gridSurfaces, staticMode
  });

  useEffect(() => {
    propsRef.current = {
      speed, gridScale, lineWidth, perspective, horizon, gridGlow,
      fogIntensity, fogSpeed, grainAmount, vignette, colorBase, colorGridA,
      colorGridB, colorFogPurple, colorFogCyan, colorAccent, gridSurfaces, staticMode
    };
  }, [speed, gridScale, lineWidth, perspective, horizon, gridGlow, fogIntensity, fogSpeed, grainAmount, vignette, colorBase, colorGridA, colorGridB, colorFogPurple, colorFogCyan, colorAccent, gridSurfaces, staticMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { 
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance"
    }) as WebGL2RenderingContext | null;
    
    if (!gl) {
      console.warn("WebGL2 not supported, fallback not available");
      return;
    }

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    const positionBuffer = gl.createBuffer();
    const vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const locations = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uGridScale: gl.getUniformLocation(program, 'uGridScale'),
      uLineWidth: gl.getUniformLocation(program, 'uLineWidth'),
      uPerspective: gl.getUniformLocation(program, 'uPerspective'),
      uHorizon: gl.getUniformLocation(program, 'uHorizon'),
      uGridGlow: gl.getUniformLocation(program, 'uGridGlow'),
      uFogIntensity: gl.getUniformLocation(program, 'uFogIntensity'),
      uFogSpeed: gl.getUniformLocation(program, 'uFogSpeed'),
      uGrainAmount: gl.getUniformLocation(program, 'uGrainAmount'),
      uVignette: gl.getUniformLocation(program, 'uVignette'),
      uColorBase: gl.getUniformLocation(program, 'uColorBase'),
      uColorGridA: gl.getUniformLocation(program, 'uColorGridA'),
      uColorGridB: gl.getUniformLocation(program, 'uColorGridB'),
      uColorFogPurple: gl.getUniformLocation(program, 'uColorFogPurple'),
      uColorFogCyan: gl.getUniformLocation(program, 'uColorFogCyan'),
      uColorAccent: gl.getUniformLocation(program, 'uColorAccent'),
      uSurfaceColors: gl.getUniformLocation(program, 'uSurfaceColors'),
      uSurfaceRotations: gl.getUniformLocation(program, 'uSurfaceRotations'),
    };

    let startTime = performance.now();
    let accumulatedTime = 0;
    let lastTime = startTime;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    
    resize();

    const render = (time: number) => {
      const p = propsRef.current;
      const deltaTime = time - lastTime;
      lastTime = time;

      const effectiveSpeed = (p.staticMode || isReducedMotion.current) ? 0 : p.speed;
      accumulatedTime += (deltaTime * 0.001) * effectiveSpeed;

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      
      gl.uniform1f(locations.iTime, accumulatedTime);
      gl.uniform2f(locations.iResolution, canvas.width, canvas.height);
      gl.uniform1f(locations.uGridScale, p.gridScale);
      gl.uniform1f(locations.uLineWidth, p.lineWidth);
      gl.uniform1f(locations.uPerspective, p.perspective);
      gl.uniform1f(locations.uHorizon, p.horizon);
      gl.uniform1f(locations.uGridGlow, p.gridGlow);
      gl.uniform1f(locations.uFogIntensity, p.fogIntensity);
      gl.uniform1f(locations.uFogSpeed, p.fogSpeed);
      gl.uniform1f(locations.uGrainAmount, p.grainAmount);
      gl.uniform1f(locations.uVignette, p.vignette);
      gl.uniform3f(locations.uColorBase, p.colorBase[0], p.colorBase[1], p.colorBase[2]);
      gl.uniform3f(locations.uColorGridA, p.colorGridA[0], p.colorGridA[1], p.colorGridA[2]);
      gl.uniform3f(locations.uColorGridB, p.colorGridB[0], p.colorGridB[1], p.colorGridB[2]);
      gl.uniform3f(locations.uColorFogPurple, p.colorFogPurple[0], p.colorFogPurple[1], p.colorFogPurple[2]);
      gl.uniform3f(locations.uColorFogCyan, p.colorFogCyan[0], p.colorFogCyan[1], p.colorFogCyan[2]);
      gl.uniform3f(locations.uColorAccent, p.colorAccent[0], p.colorAccent[1], p.colorAccent[2]);
      
      const flatColors = new Float32Array(16);
      const flatRots = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        if (p.gridSurfaces[i]) {
            flatColors.set(p.gridSurfaces[i].color, i * 4);
            flatRots.set(p.gridSurfaces[i].rotation, i * 3);
        }
      }
      gl.uniform4fv(locations.uSurfaceColors, flatColors);
      gl.uniform3fv(locations.uSurfaceRotations, flatRots);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resize);
      
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full block bg-black ${className}`}
    />
  );
}
