import React, { useEffect, useRef } from 'react';

const fragmentShaderSourceNebular = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 iResolution;
uniform float iTime;

uniform float uSpeed;
uniform float uGridDensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uColorIntensity;
uniform float uSmokeOpacity;

void main() {
    // Normalized device coordinates
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    // Horizon curvature
    float horizonCurve = 0.05 * p.x * p.x;
    float adjustedY = p.y + horizonCurve; 
    
    vec3 col = uColor1; // Background deep color
    
    // Calculate WebGL derivatives outside of non-uniform control flow
    float py = max(abs(adjustedY), 0.001);
    vec2 gridP = vec2(p.x / py, 1.0 / py);
    float movingY = gridP.y - (iTime * uSpeed * 2.0);
    
    vec2 gridUV = fract(vec2(gridP.x, movingY) * uGridDensity);
    vec2 dist = abs(gridUV - 0.5);
    
    #ifdef GL_OES_standard_derivatives
        vec2 fw = fwidth(vec2(gridP.x, movingY) * uGridDensity);
    #else
        vec2 fw = vec2(0.02 * py);
    #endif
    
    fw = max(fw, 0.001);
    
    if (adjustedY < 0.0) {
        // --- FLOOR ---
        // Core line thickness
        vec2 line = smoothstep(fw, vec2(0.0), dist);
        float gridPattern = max(line.x, line.y);
        
        // Exponential Neon Bleed
        float glowSharpness = 12.0;
        float neonGlow = exp(-min(dist.x, dist.y) * glowSharpness);
        
        float distZ = 1.0 / py;
        float fade = exp(-distZ * 0.15); // Fade into the distance
        
        // Mix grid lines and glow
        vec3 gridCol = col + (uColor2 * gridPattern * uColorIntensity);
        gridCol += uColor3 * neonGlow * uColorIntensity * 0.5;
        
        col = mix(col, gridCol, fade);
        
        // Floor mist (glow originating from lower center)
        float floorMist = exp(-length(vec2(p.x * 0.5, p.y + 0.5)) * 1.5);
        col += mix(uColor2, uColor3, 0.5) * floorMist * uSmokeOpacity * uColorIntensity * 0.5;
    } else {
        // --- SKY ---
        // Big glowing bottom-anchored blob (synthwave sun)
        vec2 sunP = vec2(p.x, adjustedY - 0.1); 
        float sunDist = length(sunP);
        
        // Core of the sun
        float sunCore = smoothstep(0.4, 0.38, sunDist);
        // Sun gradient/glow
        float sunGlow = exp(-sunDist * 2.0);
        
        // Horizontal scanlines in the sun
        float scanline = sin(sunP.y * 50.0 - iTime * 2.0) * 0.5 + 0.5;
        float sunCutout = smoothstep(0.2, 0.8, scanline + (adjustedY * 2.0)); 
        
        vec3 sunColor = mix(uColor3, uColor2, adjustedY * 2.0); 
        
        col += sunColor * sunCore * sunCutout * uColorIntensity;
        // The outer ambient bloom from the blob
        col += sunColor * sunGlow * uSmokeOpacity * uColorIntensity * 0.8;
    }
    
    // Global Horizon Glow (bleeds into both sky and floor)
    float horizonDist = min(abs(adjustedY), 1.0);
    float globalHorizonGlow = exp(-horizonDist * 5.0);
    col += mix(uColor2, uColor3, 0.5) * globalHorizonGlow * uSmokeOpacity * uColorIntensity * 0.4;
    
    // Vignetting (Darken edges and top)
    float vignette = 1.0 - smoothstep(0.5, 1.8, length(p));
    float topDarken = smoothstep(0.0, 1.0, -p.y + 0.5);
    col *= vignette * mix(1.0, topDarken, 0.5);
    
    col = col * col * (3.0 - 2.0 * col); // Contrast boost
    
    gl_FragColor = vec4(col, 1.0);
}
`;

const fragmentShaderSourceCubed = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 iResolution;
uniform float iTime;

uniform float uSpeed;
uniform float uGridDensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uColorIntensity;
uniform float uSmokeOpacity;

// Better 2D Hash function
float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// noise
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
    for(int i = 0; i < 5; i++) {
        f += amp * snoise(p);
        p = m * p;
        amp *= 0.5;
    }
    return f;
}

void main() {
    // Normalized device coordinates
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    // Horizon curvature
    float y = abs(p.y) + 0.02; // Horizon offset
    float py = max(y, 0.001);
    
    // Perspective division
    vec2 gridP = vec2(p.x / py, 1.0 / py);
    float movingY = gridP.y - (iTime * uSpeed * 2.0);
    
    vec2 gridUV = fract(vec2(gridP.x, movingY) * uGridDensity);
    vec2 dist = abs(gridUV - 0.5);
    
    #ifdef GL_OES_standard_derivatives
        vec2 fw = fwidth(vec2(gridP.x, movingY) * uGridDensity);
    #else
        vec2 fw = vec2(0.02 * py);
    #endif
    
    fw = max(fw, 0.001);
    
    // Core line thickness
    vec2 line = smoothstep(fw, vec2(0.0), dist);
    float gridPattern = max(line.x, line.y);
    
    float distZ = 1.0 / py;
    float fade = exp(-distZ * 0.1);
    
    float glow = exp(-min(dist.x, dist.y) * 10.0);
    
    vec3 col = uColor1; // Background
    vec3 gridCol = mix(col, uColor2, gridPattern * uColorIntensity);
    gridCol += uColor3 * glow * uColorIntensity * 0.4;
    
    col = mix(col, gridCol, fade);
    
    // Smoke layering via FBM
    vec2 smokeUV = p * 1.5 + vec2(iTime * 0.1, -iTime * uSpeed * 0.5);
    float smoke = fbm(smokeUV + fbm(smokeUV * 2.0 - iTime * 0.2));
    smoke = smoothstep(0.0, 1.0, smoke);
    
    vec3 smokeCol = mix(uColor1, uColor3, smoke);
    col += smokeCol * uSmokeOpacity * (0.3 + fade * 0.7);
    
    // Horizon glow
    float horizonGlow = exp(-abs(p.y) * 4.0);
    col += uColor3 * horizonGlow * 0.4 * uColorIntensity;
    
    col = col * col * (3.0 - 2.0 * col); // contrast
    
    gl_FragColor = vec4(col, 1.0);
}
`;

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export interface GridBackgroundProps {
  speed?: number;
  gridDensity?: number;
  color1?: number[];
  color2?: number[];
  color3?: number[];
  colorIntensity?: number;
  smokeOpacity?: number;
  staticMode?: boolean;
  mode?: 'cubed_smoke' | 'nebular_grid';
}

export default function GridBackground({
  speed = 0.5,
  gridDensity = 2.0,
  color1 = [0.04, 0.0, 0.1], // deep purple
  color2 = [0.0, 1.0, 1.0], // cyan
  color3 = [1.0, 0.0, 0.5], // hot pink
  colorIntensity = 1.5,
  smokeOpacity = 0.5,
  staticMode = false,
  mode = 'cubed_smoke',
}: GridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const propsRef = useRef({ speed, gridDensity, color1, color2, color3, colorIntensity, smokeOpacity, staticMode, mode });

  useEffect(() => {
    propsRef.current = { speed, gridDensity, color1, color2, color3, colorIntensity, smokeOpacity, staticMode, mode };
  }, [speed, gridDensity, color1, color2, color3, colorIntensity, smokeOpacity, staticMode, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    const webgl = gl as WebGLRenderingContext;

    webgl.getExtension('OES_standard_derivatives');

    const compileShader = (source: string, type: number) => {
      const shader = webgl.createShader(type);
      if (!shader) return null;
      webgl.shaderSource(shader, source);
      webgl.compileShader(shader);
      if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        const errInfo = webgl.getShaderInfoLog(shader);
        console.error('Shader compile error:', errInfo);
        
        // Output error to screen for debugging
        const errDiv = document.createElement('div');
        errDiv.style.position = 'absolute';
        errDiv.style.top = '10px';
        errDiv.style.left = '10px';
        errDiv.style.color = 'red';
        errDiv.style.zIndex = '9999';
        errDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        errDiv.innerText = (type === webgl.VERTEX_SHADER ? 'Vertex' : 'Fragment') + ' Error: ' + errInfo;
        document.body.appendChild(errDiv);
        
        webgl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, webgl.VERTEX_SHADER);
    const fragmentShaderSource = mode === 'nebular_grid' ? fragmentShaderSourceNebular : fragmentShaderSourceCubed;
    const fragmentShader = compileShader(fragmentShaderSource, webgl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = webgl.createProgram();
    if (!program) return;
    webgl.attachShader(program, vertexShader);
    webgl.attachShader(program, fragmentShader);
    webgl.linkProgram(program);
    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      console.error('Program link error:', webgl.getProgramInfoLog(program));
      return;
    }

    const vertices = new Float32Array([
      -1, -1,  1, -1,  -1,  1,
      -1,  1,  1, -1,   1,  1,
    ]);

    const positionBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

    const positionLocation = webgl.getAttribLocation(program, 'position');
    const resolutionLocation = webgl.getUniformLocation(program, 'iResolution');
    const timeLocation = webgl.getUniformLocation(program, 'iTime');
    
    // Custom Uniforms
    const uSpeedLoc = webgl.getUniformLocation(program, 'uSpeed');
    const uGridDensityLoc = webgl.getUniformLocation(program, 'uGridDensity');
    const uColor1Loc = webgl.getUniformLocation(program, 'uColor1');
    const uColor2Loc = webgl.getUniformLocation(program, 'uColor2');
    const uColor3Loc = webgl.getUniformLocation(program, 'uColor3');
    const uColorIntensityLoc = webgl.getUniformLocation(program, 'uColorIntensity');
    const uSmokeOpacityLoc = webgl.getUniformLocation(program, 'uSmokeOpacity');

    const render = (time: number) => {
      if (!canvas) return;
      
      const props = propsRef.current;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        webgl.viewport(0, 0, displayWidth, displayHeight);
      }

      webgl.useProgram(program);

      webgl.enableVertexAttribArray(positionLocation);
      webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
      webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

      webgl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      webgl.uniform1f(timeLocation, props.staticMode ? 0.0 : time * 0.001);
      
      webgl.uniform1f(uSpeedLoc, props.speed);
      webgl.uniform1f(uGridDensityLoc, props.gridDensity);
      webgl.uniform3f(uColor1Loc, props.color1[0], props.color1[1], props.color1[2]);
      webgl.uniform3f(uColor2Loc, props.color2[0], props.color2[1], props.color2[2]);
      webgl.uniform3f(uColor3Loc, props.color3[0], props.color3[1], props.color3[2]);
      webgl.uniform1f(uColorIntensityLoc, props.colorIntensity);
      webgl.uniform1f(uSmokeOpacityLoc, props.smokeOpacity);

      webgl.drawArrays(webgl.TRIANGLES, 0, 6);

      if (!props.staticMode) {
        requestRef.current = requestAnimationFrame(render);
      } else {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
    };

    requestRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (propsRef.current.staticMode) {
        requestAnimationFrame(render);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      webgl.deleteProgram(program);
      webgl.deleteShader(vertexShader);
      webgl.deleteShader(fragmentShader);
      webgl.deleteBuffer(positionBuffer);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-black"
    />
  );
}
