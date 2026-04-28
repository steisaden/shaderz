import React, { useEffect, useRef } from "react";

/**
 * JSDoc documentation for NorthernLightsBackground
 * @purpose Renders a dynamic simulated aurora borealis waving across the night sky.
 * @version 1.0.0
 */
export interface NorthernLightsBackgroundProps {
  color1?: number[]; 
  color2?: number[]; 
  color3?: number[]; 
  colorIntensity?: number;
  speed?: number;
  staticMode?: boolean;
}

const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_motion;
uniform vec3 u_base;
uniform vec3 u_purple;
uniform vec3 u_gold;
uniform vec3 u_cyan;
uniform float u_intensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.04;
    amplitude *= 0.5;
  }

  return value;
}

float auroraLayer(vec2 uv, float layerIndex, float time) {
  float x = uv.x;
  float yFromTop = 1.0 - uv.y;

  float layerOffset = layerIndex * 0.075;
  float waveA = sin(x * 5.0 + time * 0.55 + layerIndex * 1.7) * 0.055;
  float waveB = sin(x * 13.0 - time * 0.35 + layerIndex * 2.2) * 0.025;
  float flowNoise = (fbm(vec2(x * 2.5 + layerIndex * 3.0, time * 0.12)) - 0.5) * 0.13;

  float path = 0.12 + layerOffset + waveA + waveB + flowNoise;

  float yRel = max(yFromTop - path, 0.0);

  float body = smoothstep(0.0, 0.04, yRel) * exp(-yRel * 2.35);
  body *= smoothstep(0.88, 0.18, yRel);

  float rayNoise = fbm(vec2(x * 12.0 + layerIndex * 8.0, time * 0.18));
  float rays = 0.5 + 0.5 * sin((x + rayNoise * 0.12) * 58.0 + layerIndex * 6.0 + time * 0.65);
  rays = pow(rays, 8.0);

  float fineRays = 0.5 + 0.5 * sin((x + rayNoise * 0.06) * 118.0 - time * 0.4);
  fineRays = pow(fineRays, 16.0) * 0.45;

  float ribbon = exp(-pow((yFromTop - path) * 18.0, 2.0)) * 1.65;

  float curtain = body * (0.45 + rays * 1.55 + fineRays);
  curtain += ribbon;

  float horizontalFade = smoothstep(-0.12, 0.22, uv.x) * smoothstep(1.12, 0.78, uv.x);
  return curtain * horizontalFade;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 centered = uv - 0.5;
  centered.x *= aspect;

  float time = u_time * u_motion;

  vec3 color = u_base;

  float skyGlow = smoothstep(1.05, 0.15, length(centered * vec2(0.75, 1.2)));
  color += u_purple * skyGlow * 0.075 * u_intensity;
  color += u_gold * smoothstep(0.95, 0.25, length(centered - vec2(0.1, 0.22))) * 0.035 * u_intensity;

  vec3 aurora = vec3(0.0);

  for (int i = 0; i < 4; i++) {
    float layer = float(i);
    float amount = auroraLayer(uv, layer, time);

    float yFromTop = 1.0 - uv.y;
    float colorMixA = smoothstep(0.04, 0.38, yFromTop);
    float colorMixB = smoothstep(0.25, 0.78, yFromTop);

    vec3 layerColor = mix(u_purple, u_gold, colorMixA);
    layerColor = mix(layerColor, u_cyan, colorMixB * 0.55);

    float depthFade = 1.0 - layer * 0.13;
    aurora += layerColor * amount * depthFade;
  }

  color += aurora * 0.72 * u_intensity;

  float stars = step(0.9975, hash(floor(uv * u_resolution.xy * 0.35)));
  stars *= smoothstep(0.45, 1.0, uv.y) * 0.18;
  color += vec3(stars);

  float vignette = smoothstep(0.95, 0.25, length(centered));
  color *= vignette;

  float grain = hash(uv * u_resolution.xy + time) - 0.5;
  color += grain * 0.018;

  color = 1.0 - exp(-color * 1.12);
  outColor = vec4(color, 1.0);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    console.error(message || "Shader compile failed");
    return null;
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    console.error(message || "Program link failed");
    return null;
  }

  return program;
}

export default function NorthernLightsBackground({
  color1 = [0.486, 0.173, 1.0], 
  color2 = [0.059, 0.675, 0.796], 
  color3 = [0.890, 0.678, 0.247], 
  colorIntensity = 1.0,
  speed = 1.0,
  staticMode = false
}: NorthernLightsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const isReducedMotion = useRef(false);

  const propsRef = useRef({ color1, color2, color3, colorIntensity, speed, staticMode });

  useEffect(() => {
    propsRef.current = { color1, color2, color3, colorIntensity, speed, staticMode };
  }, [color1, color2, color3, colorIntensity, speed, staticMode]);

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
    
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      console.warn("WebGL2 not supported");
      return;
    }

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;
    gl.useProgram(program);

    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      motion: gl.getUniformLocation(program, "u_motion"),
      base: gl.getUniformLocation(program, "u_base"),
      purple: gl.getUniformLocation(program, "u_purple"),
      gold: gl.getUniformLocation(program, "u_gold"),
      cyan: gl.getUniformLocation(program, "u_cyan"),
      intensity: gl.getUniformLocation(program, "u_intensity"),
    };

    gl.uniform3fv(uniforms.base, [0.020, 0.012, 0.039]); 

    let accumulatedTime = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.resolution, width, height);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    
    resize();

    const render = (now: number) => {
      const p = propsRef.current;
      const deltaTime = now - lastTime;
      lastTime = now;
      
      const effectiveSpeed = (p.staticMode) ? 0 : (isReducedMotion.current ? 0.03 : p.speed);
      accumulatedTime += (deltaTime * 0.001) * effectiveSpeed;

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      
      gl.uniform1f(uniforms.time, accumulatedTime);
      gl.uniform1f(uniforms.motion, 1.0); 
      
      gl.uniform3f(uniforms.purple, p.color1[0], p.color1[1], p.color1[2]);
      gl.uniform3f(uniforms.cyan, p.color2[0], p.color2[1], p.color2[2]);
      gl.uniform3f(uniforms.gold, p.color3[0], p.color3[1], p.color3[2]);
      gl.uniform1f(uniforms.intensity, p.colorIntensity);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resize);
      
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundColor: '#05030a',
        backgroundImage: 'radial-gradient(circle at 50% 8%, rgba(124, 44, 255, 0.22), transparent 32%), radial-gradient(circle at 60% 20%, rgba(227, 173, 63, 0.12), transparent 26%)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block opacity-[0.88]"
      />
    </div>
  );
}
