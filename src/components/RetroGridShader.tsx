import React, { useEffect, useRef } from 'react';

/**
 * RetroGridShader: A high-performance, synthwave-inspired background preset.
 * Implements exponential bloom grid lines, perspective curvature, and atmospheric fog.
 */

const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;


const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_density;
uniform float u_intensity;

out vec4 fragColor;

// Exponential Bloom/Glow math
float glow(float dist, float thickness) {
    return exp(-dist * thickness);
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Horizon Curvature
    float horizonCurve = p.x * p.x * 0.05;
    float y = p.y + horizonCurve;
    
    vec3 col = vec3(0.0196, 0.0, 0.1019); // #05001A
    
    if (y < 0.0) {
        // Perspective Warp
        float py = max(abs(y), 0.05);
        vec2 grid = vec2(p.x / py, 1.0 / py);
        
        // Infinite scroll
        grid.y -= u_time * u_speed;
        
        vec2 gridUV = fract(grid * u_density);
        vec2 dist = abs(gridUV - 0.5);
        
        // Exponential falloff bloom lines (Cyan)
        float lines = max(glow(min(dist.x, dist.y), 15.0), glow(max(dist.x, dist.y), 5.0));
        
        // Depth-based fade
        float fade = exp(-py * 0.3);
        
        col = mix(col, vec3(0.0, 1.0, 1.0) * u_intensity, lines * fade);
    } else {
        // Horizon Glow (Hot Pink)
        float horizonGlow = exp(-y * 5.0);
        col += vec3(1.0, 0.0, 0.67) * horizonGlow * u_intensity * 0.5;
    }
    
    // Vignetting
    float vig = length(p);
    col *= 1.0 - smoothstep(0.3, 1.5, vig);
    
    fragColor = vec4(col, 1.0);
}
`;

interface RetroGridProps {
  staticMode?: boolean;
  speed?: number;
  density?: number;
  intensity?: number;
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

export default function RetroGridShader({ 
  staticMode = false, 
  speed = 0.15, 
  density = 1.5, 
  primaryColor = '#00ffff', 
  accentColor = '#ff00aa', 
  bgColor = '#020205', 
  intensity = 1.0 
}: RetroGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ staticMode, speed, density, primaryColor, accentColor, bgColor, intensity });

  useEffect(() => {
    propsRef.current = { staticMode, speed, density, primaryColor, accentColor, bgColor, intensity };
  }, [staticMode, speed, density, primaryColor, accentColor, bgColor, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      density: gl.getUniformLocation(program, 'u_density'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
    };

    const resize = () => {
      const dpr = 1.0;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frameId: number;
    const render = (t: number) => {
      const p = propsRef.current;
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, t * 0.001);
      gl.uniform1f(uniforms.speed, p.speed);
      gl.uniform1f(uniforms.density, p.density);
      gl.uniform1f(uniforms.intensity, p.intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!p.staticMode) frameId = requestAnimationFrame(render);
    };

    render(0);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}
