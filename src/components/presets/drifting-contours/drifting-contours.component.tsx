import React, { useEffect, useRef } from 'react';

/**
 * DriftingContours: original procedural contour-field shader.
 *
 * Inspired by the broad idea of animated contour/topographic fields, but built as
 * an independent shader: domain-warped scalar terrain, anti-aliased isolines,
 * luminous mineral seams, and subtle paper-like grain.
 */
export interface DriftingContoursProps {
  speed?: number;
  contourDensity?: number;
  lineWidth?: number;
  warpStrength?: number;
  terrainDepth?: number;
  glowStrength?: number;
  paletteShift?: number;
  grainAmount?: number;
  zoom?: number;
  colorA?: [number, number, number];
  colorB?: [number, number, number];
  accentColor?: [number, number, number];
  backgroundColor?: [number, number, number];
}

const vertexShaderSource = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_contourDensity;
uniform float u_lineWidth;
uniform float u_warpStrength;
uniform float u_terrainDepth;
uniform float u_glowStrength;
uniform float u_paletteShift;
uniform float u_grainAmount;
uniform float u_zoom;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_accentColor;
uniform vec3 u_backgroundColor;

out vec4 fragColor;

#define PI 3.141592653589793

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.54;
  mat2 m = mat2(1.72, 1.08, -1.08, 1.72);
  for (int i = 0; i < 5; i++) {
    value += amp * snoise(p);
    p = m * p + 0.17;
    amp *= 0.48;
  }
  return value;
}

float ridgeShape(float x) {
  x = 1.0 - abs(x);
  return x * x;
}

vec3 tonemap(vec3 c) {
  c = max(c, vec3(0.0));
  return c * (2.51 * c + 0.03) / (c * (2.43 * c + 0.59) + 0.14);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time * u_speed;
  float zoom = max(u_zoom, 0.05);
  vec2 q = p * zoom;

  // Editorial composition: an off-center field with a stronger upper-left to lower-right flow.
  vec2 frame = p;
  frame.x *= aspect;
  frame += vec2(-0.16, 0.08);
  float composition = exp(-dot(frame, frame) * 1.15);
  float diagonal = exp(-abs((p.x * 0.95) + (p.y * 1.18) - 0.08) * 1.55);
  vec2 heroOffset = p - vec2(-0.20, 0.14);
  float heroFocus = exp(-dot(heroOffset * vec2(1.18, 0.90), heroOffset * vec2(1.18, 0.90)) * 1.35);
  vec2 breathingOffset = p - vec2(0.42, -0.20);
  float breathingRoom = 1.0 - 0.20 * exp(-dot(breathingOffset * vec2(1.12, 0.86), breathingOffset * vec2(1.12, 0.86)) * 1.45);

  // Slow-moving warps build depth without breaking the contour family.
  vec2 driftA = vec2(0.10 * t, -0.07 * t);
  vec2 driftB = vec2(-0.045 * t, 0.085 * t);
  vec2 warp1 = vec2(
    fbm(q * 1.10 + driftA),
    fbm(q * 1.10 + vec2(7.4, -3.1) + driftB)
  );
  vec2 warp2 = vec2(
    fbm(q * 2.00 + warp1 * 0.70 - driftB),
    fbm(q * 2.00 + warp1.yx * 0.58 + vec2(-2.6, 5.8) + driftA)
  );

  vec2 terrainP = q + (warp1 * 0.60 + warp2 * 0.30) * u_warpStrength;
  terrainP *= rot(0.10 * sin(t * 0.22));

  float terrain = 0.0;
  terrain += fbm(terrainP * 1.28 + vec2(0.03 * t, -0.02 * t)) * 0.70;
  terrain += fbm(terrainP * 2.35 - warp2 * 0.52 - vec2(0.04 * t, 0.03 * t)) * 0.23;
  terrain += 0.10 * sin((terrainP.x * 1.8 + terrainP.y * 1.22) + t * 0.17);
  terrain += 0.06 * fbm(terrainP * 4.6 + warp1 * 0.4);
  terrain *= u_terrainDepth;

  float broad = terrain * u_contourDensity + 0.11 * sin(t * 0.35);
  float broadWidth = clamp(u_lineWidth, 0.002, 0.35);
  float broadAA = max(fwidth(broad) * 1.35, 0.0012);
  float broadPhase = fract(broad);
  float broadDist = abs(broadPhase - 0.5);
  float contour = 1.0 - smoothstep(broadWidth, broadWidth + broadAA, broadDist);
  contour *= breathingRoom;

  // Hero ridges: selectively emphasize certain contour bands so the piece reads more curated.
  float ridgeBand = ridgeShape(fract(broad * 0.50 + fbm(terrainP * 1.65) * 0.08 + u_paletteShift * 0.17));
  ridgeBand *= smoothstep(0.18, 0.84, composition + 0.35 * diagonal);
  ridgeBand *= 0.74 + 0.26 * heroFocus;
  ridgeBand *= 0.55 + 0.45 * smoothstep(-0.2, 0.65, terrain);

  // Secondary lines: softer and less repetitive, sitting between the hero bands.
  float fineField = broad * 2.0 + fbm(terrainP * 3.9 + warp2 * 0.25) * 0.14;
  float finePhase = fract(fineField);
  float fineDist = abs(finePhase - 0.5);
  float fineAA = max(broadAA * 1.12, 0.0012);
  float fine = 1.0 - smoothstep(0.038, 0.038 + fineAA, fineDist);
  fine *= 0.14 + 0.11 * ridgeBand;
  fine *= 0.88 + 0.12 * heroFocus;

  float microField = terrain * (u_contourDensity * 2.35) + fbm(terrainP * 5.8 - warp1 * 0.18) * 0.07;
  float micro = 1.0 - smoothstep(0.020, 0.020 + fineAA * 0.8, abs(fract(microField) - 0.5));
  micro *= 0.06 + 0.03 * heroFocus;

  float ridge = pow(max(0.0, 1.0 - abs(terrain) * 0.42), 2.4);
  float seamNoise = fbm(terrainP * 3.0 + vec2(t * 0.08, -t * 0.06));
  float seam = smoothstep(0.54, 0.93, seamNoise + ridge * 0.20 + composition * 0.08);
  seam *= 0.42 + 0.58 * contour;
  seam *= 0.84 + 0.16 * heroFocus;

  float paletteFlow = 0.5 + 0.5 * sin(terrain * 2.0 + u_paletteShift * PI * 2.0 + warp2.x * 1.3 - warp2.y * 0.9);
  float mineralMix = smoothstep(0.12, 0.88, paletteFlow);
  vec3 mineral = mix(u_colorA, u_colorB, mineralMix);
  mineral = mix(mineral, mix(u_colorB, u_accentColor, 0.25), ridgeBand * 0.32);

  float paper = fbm(q * 7.0 + warp1 * 0.22) * 0.5 + 0.5;
  float depthMask = smoothstep(-0.15, 0.85, terrain);
  float shadowMask = smoothstep(0.35, -0.55, terrain);
  vec3 col = u_backgroundColor;
  col = mix(col, u_backgroundColor * 1.18 + mineral * 0.08, composition * 0.6);
  col += mineral * (0.10 + 0.18 * paper + ridge * 0.14 + ridgeBand * 0.22);
  col += mineral * (fine * 0.68 + micro * 0.38);
  col = mix(col, mineral * 1.20 + u_accentColor * 0.12, contour * (0.50 + 0.22 * ridgeBand));
  col += u_accentColor * seam * u_glowStrength * (0.40 + 0.28 * ridgeBand);
  col += u_accentColor * contour * u_glowStrength * 0.12;
  col += (u_colorA * 0.24 + u_colorB * 0.16) * depthMask * 0.10;
  col -= vec3(0.025, 0.02, 0.03) * shadowMask * 0.22;
  col += mineral * heroFocus * 0.08;

  // Gentle off-center light preserves the premium editorial feel without flattening the terrain.
  vec2 lightPos = vec2(-0.42, 0.34);
  float light = exp(-length((p - lightPos) * vec2(1.08, 0.92)) * 1.78);
  col += mix(u_colorA, u_accentColor, 0.28) * light * 0.18;
  col += mineral * composition * 0.08;

  float vignette = smoothstep(1.34, 0.18, length(p * vec2(0.94, 1.08)));
  col *= 0.50 + 0.70 * vignette;

  float grain = hash(gl_FragCoord.xy + fract(u_time) * 91.7) - 0.5;
  col += grain * u_grainAmount;
  col += (paper - 0.5) * u_grainAmount * 0.42;

  col = tonemap(col);
  col = pow(col, vec3(0.92));
  fragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('DriftingContours shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function DriftingContours({
  speed = 0.32,
  contourDensity = 11.5,
  lineWidth = 0.085,
  warpStrength = 0.82,
  terrainDepth = 1.18,
  glowStrength = 0.75,
  paletteShift = 0.0,
  grainAmount = 0.035,
  zoom = 1.55,
  colorA = [0.08, 0.48, 0.72],
  colorB = [0.72, 0.20, 0.58],
  accentColor = [1.0, 0.72, 0.28],
  backgroundColor = [0.018, 0.015, 0.038],
}: DriftingContoursProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const propsRef = useRef({
    speed, contourDensity, lineWidth, warpStrength, terrainDepth, glowStrength,
    paletteShift, grainAmount, zoom, colorA, colorB, accentColor, backgroundColor,
  });

  useEffect(() => {
    propsRef.current = {
      speed, contourDensity, lineWidth, warpStrength, terrainDepth, glowStrength,
      paletteShift, grainAmount, zoom, colorA, colorB, accentColor, backgroundColor,
    };
  }, [speed, contourDensity, lineWidth, warpStrength, terrainDepth, glowStrength, paletteShift, grainAmount, zoom, colorA, colorB, accentColor, backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      console.error('DriftingContours requires WebGL2 support');
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('DriftingContours program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      contourDensity: gl.getUniformLocation(program, 'u_contourDensity'),
      lineWidth: gl.getUniformLocation(program, 'u_lineWidth'),
      warpStrength: gl.getUniformLocation(program, 'u_warpStrength'),
      terrainDepth: gl.getUniformLocation(program, 'u_terrainDepth'),
      glowStrength: gl.getUniformLocation(program, 'u_glowStrength'),
      paletteShift: gl.getUniformLocation(program, 'u_paletteShift'),
      grainAmount: gl.getUniformLocation(program, 'u_grainAmount'),
      zoom: gl.getUniformLocation(program, 'u_zoom'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      accentColor: gl.getUniformLocation(program, 'u_accentColor'),
      backgroundColor: gl.getUniformLocation(program, 'u_backgroundColor'),
    };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = (time: number) => {
      resize();
      const props = propsRef.current;
      const motion = reducedMotionQuery.matches ? 0.16 : 1.0;

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, time * 0.001 * motion);
      gl.uniform1f(uniforms.speed, props.speed);
      gl.uniform1f(uniforms.contourDensity, props.contourDensity);
      gl.uniform1f(uniforms.lineWidth, props.lineWidth);
      gl.uniform1f(uniforms.warpStrength, props.warpStrength);
      gl.uniform1f(uniforms.terrainDepth, props.terrainDepth);
      gl.uniform1f(uniforms.glowStrength, props.glowStrength);
      gl.uniform1f(uniforms.paletteShift, props.paletteShift);
      gl.uniform1f(uniforms.grainAmount, props.grainAmount);
      gl.uniform1f(uniforms.zoom, props.zoom);
      gl.uniform3f(uniforms.colorA, props.colorA[0], props.colorA[1], props.colorA[2]);
      gl.uniform3f(uniforms.colorB, props.colorB[0], props.colorB[1], props.colorB[2]);
      gl.uniform3f(uniforms.accentColor, props.accentColor[0], props.accentColor[1], props.accentColor[2]);
      gl.uniform3f(uniforms.backgroundColor, props.backgroundColor[0], props.backgroundColor[1], props.backgroundColor[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block bg-[#05040a]" />;
}
