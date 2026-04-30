import React, { useEffect, useRef } from "react";

/**
 * NorthernLightsBackground
 * Premium aurora borealis with layered curtains, atmospheric glow, and refined star field.
 */
export interface NorthernLightsBackgroundProps {
  color1?: number[];
  color2?: number[];
  color3?: number[];
  colorIntensity?: number;
  speed?: number;
  length?: number;
  width?: number;
  auroraStyle?: number;
  auroraProfile?: number;
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
uniform float u_length;
uniform float u_width;
uniform float u_style;

float hash12(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash12(p);
  return vec2(n, hash12(p + n + 19.19));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 warp = mat2(1.6, 1.2, -1.2, 1.6);

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = warp * p;
    amplitude *= 0.5;
  }

  return value;
}

float ridgedFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.40;
  mat2 warp = mat2(1.55, -0.95, 0.95, 1.55);

  for (int i = 0; i < 3; i++) {
    float n = noise(p);
    value += amplitude * (1.0 - abs(2.0 * n - 1.0)) * 0.72;
    p = warp * p + 0.08;
    amplitude *= 0.5;
  }

  return value;
}

vec2 domainWarp(vec2 p, float time, float layer) {
  vec2 q = vec2(
    fbm(p * 1.3 + vec2(0.0, time * 0.10 + layer * 1.7)),
    fbm(p * 1.3 + vec2(4.7, -time * 0.08 + layer * 2.3))
  );

  vec2 r = vec2(
    fbm(p * 2.1 + q * 1.6 + vec2(time * 0.05, layer * 2.1)),
    fbm(p * 2.1 - q * 1.6 + vec2(layer * 3.3, -time * 0.04))
  );

  return p + (q - 0.5) * 0.30 + (r - 0.5) * 0.12;
}

float auroraCurtain(vec2 uv, float time, float layer, float lengthScale, float widthScale, float compactScreen, float styleMix) {
  float motion = max(u_motion, 0.0);
  float y = 1.0 - uv.y;
  vec2 p = uv;

  float xStretch = mix(0.88, 1.92, clamp(lengthScale / 5.0, 0.0, 1.0));
  xStretch *= mix(1.04, 0.96, styleMix);
  float curtainThickness = mix(0.058, 0.150, clamp(widthScale / 5.0, 0.0, 1.0));
  curtainThickness *= mix(1.02, 0.90, styleMix) * mix(1.0, 1.08, compactScreen);
  float layerBias = 0.09 + layer * 0.050;

  vec2 warped = domainWarp(vec2(p.x * xStretch, p.y * 1.08), time * motion, layer);
  float flow = fbm(vec2(warped.x * mix(0.95, 1.55, styleMix) + layer * 1.55, time * 0.08 * motion));
  float drift = fbm(vec2(warped.x * mix(1.9, 3.0, styleMix) - time * 0.06 * motion, layer * 2.8));
  float ridge = ridgedFbm(vec2(warped.x * mix(1.35, 2.05, styleMix), warped.y * 1.12 + time * 0.028 * motion));

  float centerLine = layerBias;
  centerLine += (flow - 0.5) * mix(0.072, 0.048, styleMix);
  centerLine += sin((warped.x * (1.7 + 0.32 * layer)) + time * (0.16 + 0.025 * layer) * motion + drift * 1.7) * mix(0.055, 0.033, styleMix);
  centerLine += sin((warped.x * (4.0 + 0.7 * layer)) - time * (0.075 + 0.018 * layer) * motion + ridge * 0.9) * mix(0.007, 0.012, styleMix);
  centerLine += (fbm(vec2(warped.x * 3.2, time * 0.072 * motion + layer * 0.9)) - 0.5) * mix(0.030, 0.022, styleMix);

  float distance = y - centerLine;
  float band = smoothstep(curtainThickness * 2.7, -curtainThickness * 0.9, distance);
  float core = exp(-pow(distance / max(curtainThickness * mix(0.58, 0.46, styleMix), 0.015), 2.0));
  float shell = exp(-pow(distance / max(curtainThickness * mix(1.62, 1.34, styleMix), 0.026), 2.0));
  float ribbon = 0.5 + 0.5 * sin((warped.x * (1.9 + 0.32 * layer)) + time * (0.18 + 0.045 * layer) * motion + flow * 1.25);
  ribbon = pow(max(ribbon, 0.0), mix(1.6, 2.8, styleMix));
  float veil = 0.5 + 0.5 * sin((warped.x * (5.0 + 0.8 * layer)) - time * (0.085 + 0.018 * layer) * motion + drift * 1.3);
  veil = pow(max(veil, 0.0), mix(2.4, 4.0, styleMix)) * mix(0.03, 0.11, styleMix);
  float smoothRidge = smoothstep(0.12, 0.86, ridge) * mix(0.10, 0.05, styleMix);
  float taper = smoothstep(0.98, 0.14, uv.x) * smoothstep(0.02, 0.88, uv.x);

  float lift = smoothstep(0.40, 0.02, uv.y);
  float body = band * (0.60 + ribbon * mix(0.28, 0.54, styleMix) + veil) + core * 0.84 + shell * 0.28 + smoothRidge;
  body *= taper * (0.80 + 0.20 * lift);
  body *= mix(1.0, 0.95, compactScreen);

  return body * (1.0 - layer * 0.10);
}

float starShape(vec2 uv, vec2 cell, float time, float scale, float density, float twinkleSpeed) {
  vec2 grid = uv * scale;
  vec2 id = floor(grid);
  vec2 local = fract(grid) - 0.5;

  float rnd = hash12(id + cell);
  float gate = step(1.0 - density, rnd);
  vec2 offset = hash22(id + cell * 13.7) - 0.5;
  float size = mix(0.012, 0.045, hash12(id + cell * 7.3));
  float dist = length(local - offset * 0.72);
  float shape = smoothstep(size, 0.0, dist);
  float twinkle = 0.72 + 0.28 * sin(time * twinkleSpeed + rnd * 6.2831);

  return shape * gate * twinkle;
}

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv - 0.5;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  centered.x *= aspect;

  float time = u_time;
  float motion = u_motion;
  float shortestSide = min(u_resolution.x, u_resolution.y);
  float compactScreen = 1.0 - smoothstep(640.0, 1180.0, shortestSide);
  float lengthScale = max(u_length, 0.1);
  float widthScale = max(u_width, 0.1);
  float styleMix = clamp(u_style, 0.0, 1.0);

  vec3 color = u_base;

  float skyGradient = smoothstep(1.05, 0.05, uv.y);
  float zenith = smoothstep(0.10, 0.92, uv.y);
  float horizonGlow = exp(-pow(uv.y * 8.5, 2.0));
  float mist = exp(-pow((uv.y - 0.28) * 3.0, 2.0));
  float heroSweep = exp(-pow((uv.x + 0.18) * 1.25, 2.0)) * exp(-pow((uv.y - 0.30) * 2.35, 2.0));
  float auroraPocket = 1.0 - 0.16 * exp(-pow((uv.x - 0.05) * 1.6, 2.0));

  color += mix(u_purple, u_cyan, 0.35 + 0.25 * centered.x) * skyGradient * 0.08 * u_intensity;
  color += u_purple * zenith * 0.045 * u_intensity;
  color += mix(u_gold, u_cyan, 0.55) * horizonGlow * 0.12 * u_intensity;
  color += u_cyan * mist * 0.022 * u_intensity;
  color += mix(u_purple, u_cyan, 0.6) * heroSweep * 0.20 * u_intensity;
  color *= auroraPocket;

  vec3 aurora = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float layer = float(i);
    float amount = auroraCurtain(uv, time, layer, lengthScale, widthScale, compactScreen, styleMix);

    float verticalMix = smoothstep(0.0, 0.78, 1.0 - uv.y);
    float coreMix = smoothstep(0.08, 0.52, verticalMix);
    float prismSplit = styleMix * smoothstep(0.20, 0.88, verticalMix) * 0.55;
    vec3 layerColor = mix(u_purple, u_cyan, mix(coreMix, smoothstep(0.05, 0.90, coreMix + prismSplit * 0.10), styleMix * 0.72));
    layerColor = mix(layerColor, u_gold, mix(0.10, 0.22, styleMix) * smoothstep(0.0, 0.5, 1.0 - uv.y));
    layerColor += (u_gold - u_purple) * prismSplit * 0.05;

    float depth = 1.0 - layer * 0.12;
    float bloom = mix(0.86, 1.18, verticalMix);
    aurora += layerColor * amount * depth * bloom;
  }

  vec3 veilColor = mix(u_cyan, u_purple, 0.28);
  float veil = fbm(vec2(uv.x * 1.8, uv.y * 2.5 + time * 0.035 * motion));
  aurora += veilColor * max(veil - 0.5, 0.0) * 0.12 * u_intensity;

  color += aurora * 1.08 * u_intensity;
  color += aurora * aurora * 0.42 * u_intensity;
  color += mix(u_cyan, u_gold, 0.28) * heroSweep * 0.18 * u_intensity;

  float starMask = smoothstep(0.22, 0.98, uv.y);
  float fineStars = starShape(uv, vec2(0.0, 0.0), time, 250.0, 0.0038, 1.8);
  fineStars += starShape(uv, vec2(3.7, 2.1), time, 170.0, 0.0048, 2.6);
  fineStars += starShape(uv, vec2(8.1, 5.4), time, 88.0, 0.009, 1.3) * 0.55;
  fineStars *= starMask * mix(1.0, 0.72, compactScreen);

  float starTint = mix(0.88, 1.18, hash12(floor(uv * vec2(260.0, 180.0))));
  color += vec3(fineStars * starTint);

  float bigStars = starShape(uv, vec2(11.0, 7.0), time, 68.0, 0.0024, 4.2);
  bigStars += starShape(uv, vec2(16.3, 1.9), time, 52.0, 0.0022, 3.4);
  color += vec3(1.0, 0.98, 0.92) * bigStars * 1.6 * starMask;

  float atmosphere = exp(-pow((uv.y - 0.12) * 6.5, 2.0));
  atmosphere += exp(-pow((uv.y - 0.50) * 2.2, 2.0)) * 0.25;
  color += mix(u_cyan, u_gold, 0.35) * atmosphere * 0.045 * u_intensity;
  color += mix(u_purple, u_cyan, 0.45) * exp(-pow((uv.y - 0.22) * 2.0, 2.0)) * 0.045 * u_intensity;

  float grain = hash12(uv * u_resolution.xy + vec2(time, time * 1.37)) - 0.5;
  color += grain * mix(0.008, 0.004, compactScreen);

  color = 1.0 - exp(-color * 1.18);
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
  length = 1.0,
  width = 1.0,
  auroraStyle = 0.0,
  auroraProfile,
  staticMode = false,
}: NorthernLightsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const isReducedMotion = useRef(false);

  const resolvedProfile = auroraProfile ?? auroraStyle ?? 0.0;

  const propsRef = useRef({
    color1,
    color2,
    color3,
    colorIntensity,
    speed,
    length,
    width,
    auroraStyle: resolvedProfile,
    staticMode,
  });

  useEffect(() => {
    propsRef.current = { color1, color2, color3, colorIntensity, speed, length, width, auroraStyle: resolvedProfile, staticMode };
  }, [color1, color2, color3, colorIntensity, speed, length, width, resolvedProfile, staticMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    isReducedMotion.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion.current = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
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
      length: gl.getUniformLocation(program, "u_length"),
      width: gl.getUniformLocation(program, "u_width"),
      style: gl.getUniformLocation(program, "u_style"),
    };

    gl.uniform3fv(uniforms.base, [0.020, 0.012, 0.039]);

    let accumulatedTime = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const widthPx = Math.floor(canvas.clientWidth * dpr);
      const heightPx = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== widthPx || canvas.height !== heightPx) {
        canvas.width = widthPx;
        canvas.height = heightPx;
      }

      gl.viewport(0, 0, widthPx, heightPx);
      gl.uniform2f(uniforms.resolution, widthPx, heightPx);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    resize();

    const render = (now: number) => {
      const p = propsRef.current;
      const deltaTime = now - lastTime;
      lastTime = now;

      const motionScale = p.staticMode ? 0.0 : (isReducedMotion.current ? 0.12 : 1.0);
      const effectiveSpeed = p.staticMode ? 0.0 : p.speed * (isReducedMotion.current ? 0.08 : 1.0);
      accumulatedTime += (deltaTime * 0.001) * effectiveSpeed;

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform1f(uniforms.time, accumulatedTime);
      gl.uniform1f(uniforms.motion, motionScale);

      gl.uniform3f(uniforms.purple, p.color1[0], p.color1[1], p.color1[2]);
      gl.uniform3f(uniforms.cyan, p.color2[0], p.color2[1], p.color2[2]);
      gl.uniform3f(uniforms.gold, p.color3[0], p.color3[1], p.color3[2]);
      gl.uniform1f(uniforms.intensity, p.colorIntensity);
      gl.uniform1f(uniforms.length, p.length);
      gl.uniform1f(uniforms.width, p.width);
      gl.uniform1f(uniforms.style, p.auroraStyle ?? 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", resize);

      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundColor: "#04020a",
        backgroundImage:
          "radial-gradient(circle at 50% 12%, rgba(124, 44, 255, 0.24), transparent 28%), radial-gradient(circle at 58% 24%, rgba(38, 211, 255, 0.10), transparent 24%), radial-gradient(circle at 50% 100%, rgba(227, 173, 63, 0.08), transparent 42%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-[0.93]"
      />
    </div>
  );
}
