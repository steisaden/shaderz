import React, { useEffect, useRef, useState } from 'react';

export interface PaperShaderProps {
  baseColor?: [number, number, number];
  inkColor?: [number, number, number];
  accentColor?: [number, number, number];
  secondaryAccent?: [number, number, number];

  fiberScale?: number;
  fiberStrength?: number;
  grainAmount?: number;
  noiseScale?: number;

  inkBleedAmount?: number;
  inkBleedSpeed?: number;
  inkSoftness?: number;

  foilAmount?: number;
  foilSpeed?: number;
  foilAngle?: number;

  vignetteAmount?: number;
  edgeDarkness?: number;
  tornEdgeAmount?: number;

  halftoneAmount?: number;
  halftoneScale?: number;
  printOffset?: number;

  motionAmount?: number;
  paperWarp?: number;
  contrast?: number;
  brightness?: number;

  creaseAmount?: number;
  ghostAmount?: number;
  blueprintGrid?: number;
  paperProfile?: number;
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
uniform float u_profile;

uniform vec3 u_baseColor;
uniform vec3 u_inkColor;
uniform vec3 u_accentColor;
uniform vec3 u_secondaryAccent;

uniform float u_fiberScale;
uniform float u_fiberStrength;
uniform float u_grainAmount;
uniform float u_noiseScale;

uniform float u_inkBleedAmount;
uniform float u_inkBleedSpeed;
uniform float u_inkSoftness;

uniform float u_foilAmount;
uniform float u_foilSpeed;
uniform float u_foilAngle;

uniform float u_vignetteAmount;
uniform float u_edgeDarkness;
uniform float u_tornEdgeAmount;

uniform float u_halftoneAmount;
uniform float u_halftoneScale;
uniform float u_printOffset;

uniform float u_motionAmount;
uniform float u_paperWarp;
uniform float u_contrast;
uniform float u_brightness;

uniform float u_creaseAmount;
uniform float u_ghostAmount;
uniform float u_blueprintGrid;

out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 19.19));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float ridgedFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * (1.0 - abs(2.0 * noise(p) - 1.0));
    p *= 2.05;
    amplitude *= 0.55;
  }
  return value;
}

float voronoi(vec2 p) {
  vec2 g = floor(p);
  vec2 f = fract(p);
  float result = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 r = o + hash22(g + o) - f;
      result = min(result, dot(r, r));
    }
  }
  return sqrt(result);
}

float paperFiber(vec2 uv, float scale, float strength) {
  vec2 p = uv * scale;
  float threads = noise(vec2(p.x * 1.15, p.y * 5.6));
  float weave = noise(vec2(p.y * 1.25, p.x * 3.9));
  float hair = fbm(p * 0.7 + vec2(2.0, -1.5));
  float filament = 1.0 - abs(noise(vec2(p.x * 0.45, p.y * 10.0)) * 2.0 - 1.0);
  return ((mix(threads, weave, 0.52) * 0.7 + hair * 0.22 + filament * 0.18) - 0.45) * strength;
}

float paperGrain(vec2 uv, float amount, float time) {
  return (hash21(uv * 720.0 + time) - 0.5) * amount;
}

float foldField(vec2 uv, float amount) {
  float centerX = smoothstep(0.16, 0.0, abs(uv.x - 0.5));
  float centerY = smoothstep(0.16, 0.0, abs(uv.y - 0.5));
  float diagonal = smoothstep(0.14, 0.0, abs((uv.x + uv.y) - 1.0));
  float otherDiagonal = smoothstep(0.14, 0.0, abs(uv.x - uv.y));
  return (centerX + centerY * 0.92 + diagonal * 0.48 + otherDiagonal * 0.32) * amount;
}

float deckleMask(vec2 uv, float amount) {
  if (amount <= 0.001) {
    return 1.0;
  }

  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float rough = fbm(uv * 12.0) * 0.016 + fbm(uv * 28.0 + 4.0) * 0.008;
  float width = mix(0.004, 0.024, clamp(amount, 0.0, 1.0));
  return smoothstep(0.0, width + rough * amount, edge);
}

float softBanding(vec2 uv, float frequency, float phase, float softness) {
  float band = sin(uv.x * frequency + phase) * 0.5 + 0.5;
  return smoothstep(0.5 - softness, 0.5 + softness, band);
}

float flutedHighlight(vec2 uv, float angle, float frequency, float time) {
  vec2 dir = vec2(cos(angle), sin(angle));
  float projected = dot(uv - 0.5, dir) * frequency;
  float groove = sin(projected * 6.28318 + time * 1.35) * 0.5 + 0.5;
  float ridge = pow(1.0 - abs(groove * 2.0 - 1.0), 6.8);
  float micro = fbm(uv * frequency * 0.35 + time * 0.12);
  return ridge * (0.58 + micro * 0.42);
}

vec2 liquidWarp(vec2 uv, float amount, float time) {
  vec2 p = uv - 0.5;
  vec2 drift = vec2(
    fbm(p * 3.8 + vec2(time * 0.07, -time * 0.05)),
    fbm(p * 4.2 + vec2(-time * 0.06, time * 0.08))
  ) - 0.5;
  p += drift * amount * 0.14;
  return p + 0.5;
}

float inkBloom(vec2 uv, vec2 center, float spread, float softness, float time) {
  vec2 p = uv - center;
  vec2 drift = vec2(fbm(p * 6.0 + time * 0.12), fbm(p * 6.0 - time * 0.1)) - 0.5;
  p += drift * spread * 0.55;
  float d = length(p);
  return smoothstep(spread + softness, spread, d);
}

float foilBand(vec2 uv, float time, float angle) {
  vec2 dir = vec2(cos(angle), sin(angle));
  float projected = dot(uv - 0.5, dir);
  float sweep = sin(projected * 7.2 + time * 1.45) * 0.5 + 0.5;
  float shimmer = fbm(uv * 6.5 + time * 0.16);
  float ridge = pow(smoothstep(0.14, 0.98, sweep), 1.7);
  return ridge * (0.5 + shimmer * 0.5);
}

float halftoneMask(vec2 uv, float scale) {
  vec2 p = fract(uv * scale) - 0.5;
  float d = length(p);
  return smoothstep(0.46, 0.2, d);
}

float blueprintMask(vec2 uv, float density) {
  vec2 p = fract(uv * density);
  float major = min(abs(p.x - 0.5), abs(p.y - 0.5));
  float minor = min(p.x, p.y);
  float grid = 1.0 - smoothstep(0.0, 0.02, minor);
  float cross = 1.0 - smoothstep(0.0, 0.04, major);
  return max(grid * 0.55, cross * 0.35);
}

float orbitRing(vec2 uv, vec2 center, float radius, float width) {
  float d = abs(length(uv - center) - radius);
  return 1.0 - smoothstep(width, width + 0.01, d);
}

float spotlight(vec2 uv, vec2 center, vec2 stretch, float radius) {
  return smoothstep(radius, 0.05, length((uv - center) * stretch));
}

float paperEdgeLift(vec2 centered, float radius, float softness) {
  return smoothstep(radius, softness, length(centered));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 centered = uv * 2.0 - 1.0;
  centered.x *= u_resolution.x / u_resolution.y;

  float profile = floor(u_profile + 0.5);
  float time = u_time * max(u_motionAmount, 0.01);

  vec2 warp = vec2(
    fbm(uv * (2.5 + u_noiseScale) + time * 0.05),
    fbm(uv * (2.5 + u_noiseScale) - time * 0.04)
  ) - 0.5;
  vec2 paperUV = uv + warp * u_paperWarp * 0.08;

  float fiber = paperFiber(paperUV, u_fiberScale, u_fiberStrength);
  float grain = paperGrain(paperUV, u_grainAmount, time);
  float crease = foldField(paperUV, u_creaseAmount);
  float sheetGlow = smoothstep(1.1, 0.12, length(centered));
  float bodyShade = smoothstep(1.0, 0.2, length(centered));
  float micro = ridgedFbm(paperUV * (6.0 + u_noiseScale * 2.0));
  float wearMask = deckleMask(uv, u_tornEdgeAmount);
  float edgeLift = paperEdgeLift(centered, 1.12, 0.24);
  float lightBand = smoothstep(-0.22, 0.72, dot(normalize(centered + vec2(0.001)), normalize(vec2(-0.72, 0.52))));

  vec3 color = mix(u_baseColor * 1.03, u_baseColor * 0.92, bodyShade * 0.48);
  color += vec3(fiber * 0.84 + grain * 0.55 + micro * 0.03);
  color += vec3(0.03, 0.025, 0.02) * edgeLift * 0.06;
  color -= crease * 0.045;
  color += vec3(0.02, 0.022, 0.03) * sheetGlow;
  color += vec3(0.04, 0.03, 0.02) * lightBand * 0.08;

  if (profile < 0.5) {
    float airy = spotlight(paperUV, vec2(0.36, 0.28), vec2(1.18, 1.02), 0.92);
    float silk = flutedHighlight(paperUV, 0.72, 11.0, time * 0.3);
    float bloom = fbm(paperUV * 5.1 + vec2(time * 0.05, -time * 0.04));
    float dust = voronoi(paperUV * 36.0) * 0.1;
    float fiberGlow = smoothstep(0.25, 0.92, fiber + grain * 2.5);
    color = mix(color, vec3(0.968, 0.958, 0.928), 0.6);
    color += vec3(0.08, 0.05, 0.02) * airy * 0.12;
    color += u_secondaryAccent * silk * 0.05;
    color += u_accentColor * bloom * 0.03;
    color += vec3(0.03, 0.025, 0.012) * spotlight(paperUV, vec2(0.58, 0.52), vec2(0.94, 1.0), 0.82) * 0.05;
    color += vec3(0.02, 0.015, 0.015) * fiberGlow * 0.04;
    color += vec3(dust) * 0.01;
  } else if (profile < 1.5) {
    float sheen = foilBand(paperUV, time * u_foilSpeed, u_foilAngle);
    float fluted = flutedHighlight(paperUV, u_foilAngle, 19.0, time * 0.36);
    float emboss = ridgedFbm(paperUV * 8.2 + time * 0.03);
    float glow = spotlight(paperUV, vec2(0.52, 0.44), vec2(1.05, 0.92), 0.78);
    float highlight = paperEdgeLift(centered, 0.94, 0.18);
    color = mix(color, vec3(0.9, 0.78, 0.61), 0.34);
    color += vec3(0.08, 0.04, 0.01) * emboss * 0.05;
    color += mix(u_accentColor, u_secondaryAccent, 0.28) * sheen * (u_foilAmount * 1.7 + 0.2);
    color += mix(vec3(0.985, 0.88, 0.56), u_accentColor, fluted) * 0.085;
    color += u_secondaryAccent * glow * 0.045;
    color += vec3(0.03, 0.02, 0.01) * grain * 0.38;
    color += vec3(0.04, 0.03, 0.02) * highlight * 0.05;
  } else if (profile < 2.5) {
    vec2 fluidUV = liquidWarp(paperUV, max(u_paperWarp, 0.16) + 0.26, time);
    vec2 centerA = vec2(0.33, 0.43);
    vec2 centerB = vec2(0.67, 0.58);
    vec2 centerC = vec2(0.54, 0.34);
    float bloomA = inkBloom(fluidUV, centerA, 0.18 + u_inkBleedAmount * 0.3, u_inkSoftness * 0.9, time * u_inkBleedSpeed);
    float bloomB = inkBloom(fluidUV, centerB, 0.14 + u_inkBleedAmount * 0.25, u_inkSoftness * 1.0, time * u_inkBleedSpeed * 1.08);
    float bloomC = inkBloom(fluidUV, centerC, 0.11 + u_inkBleedAmount * 0.18, u_inkSoftness * 0.88, time * u_inkBleedSpeed * 0.78);
    float coreA = pow(bloomA, 1.35);
    float coreB = pow(bloomB, 1.4);
    float coreC = pow(bloomC, 1.45);
    float pooled = max(max(coreA, coreB), coreC);
    float plume = fbm(fluidUV * 4.7 + vec2(time * 0.08, -time * 0.05));
    float tide = smoothstep(0.14, 0.82, fbm(fluidUV * 2.2 + time * 0.03));
    float haloA = spotlight(fluidUV, centerA, vec2(1.0, 1.12), 0.84);
    float haloB = spotlight(fluidUV, centerB, vec2(1.04, 0.96), 0.76);
    float haloC = spotlight(fluidUV, centerC, vec2(1.15, 1.0), 0.72);
    float bloomRim = smoothstep(0.12, 0.98, plume);
    float capillary = smoothstep(0.08, 0.82, fbm(fluidUV * 7.0 + time * 0.08));
    color = mix(color, u_inkColor, pooled * 0.92);
    color += u_accentColor * coreA * 0.22;
    color += u_secondaryAccent * coreB * 0.2;
    color += mix(u_secondaryAccent, u_accentColor, plume) * coreC * 0.11;
    color += vec3(0.13, 0.09, 0.08) * (haloA + haloB + haloC) * 0.055;
    color += vec3(0.07, 0.08, 0.11) * tide * 0.055;
    color += vec3(0.024, 0.02, 0.034) * softBanding(fluidUV, 7.0, time * 0.15, 0.2) * 0.05;
    color += mix(u_accentColor, u_secondaryAccent, bloomRim) * bloomRim * 0.028;
    color += vec3(0.02, 0.03, 0.04) * capillary * 0.08;
    color -= vec3(0.018, 0.012, 0.02) * (1.0 - pooled) * 0.04;
  } else if (profile < 3.5) {
    vec2 jitter = vec2((hash21(vec2(uv.y * 220.0, time)) - 0.5) * 0.016, 0.0);
    float copyA = smoothstep(0.52, 0.18, length((paperUV + jitter) - vec2(0.5)));
    float copyB = smoothstep(0.58, 0.2, length((paperUV + jitter + vec2(0.016, -0.01)) - vec2(0.5)));
    float ghost = max(copyA, copyB) * u_ghostAmount;
    float scan = (sin(uv.y * 242.0 + time * 9.5) * 0.5 + 0.5) * 0.038;
    float dither = halftoneMask(paperUV + vec2(0.0, time * 0.012), max(u_halftoneScale, 96.0));
    float dust = fbm(paperUV * 120.0 + time * 0.2);
    float toner = smoothstep(0.24, 0.84, fbm(paperUV * 6.0 + time * 0.03));
    float shadow = 1.0 - paperEdgeLift(centered, 1.0, 0.2);
    color = mix(color, vec3(0.095, 0.1, 0.105), ghost * 0.58);
    color += u_inkColor * ghost * 0.34;
    color -= scan;
    color += vec3(dither) * 0.024;
    color += vec3(dust) * 0.017;
    color += vec3(toner) * 0.018;
    color += vec3(0.02, 0.02, 0.025) * shadow * 0.04;
  } else if (profile < 4.5) {
    float dots = halftoneMask(paperUV + vec2(u_printOffset, -u_printOffset), u_halftoneScale);
    float passR = fbm((paperUV + vec2(u_printOffset * 1.8, 0.0)) * 7.0 + time * 0.05);
    float passG = fbm((paperUV + vec2(-u_printOffset * 1.5, u_printOffset * 1.1)) * 7.0 - time * 0.03);
    float passB = fbm((paperUV + vec2(0.0, -u_printOffset * 1.7)) * 7.0 + 3.0);
    vec3 misreg = vec3(passR, passG, passB);
    float panelA = smoothstep(0.08, 0.82, paperUV.x);
    float panelB = smoothstep(0.18, 0.94, paperUV.y);
    float panelC = smoothstep(0.22, 0.78, fract(paperUV.x * 2.2 + paperUV.y * 0.35));
    float neonCore = spotlight(paperUV, vec2(0.53, 0.48), vec2(1.0, 1.0), 0.88);
    float cmykSplit = smoothstep(0.15, 0.9, fbm(paperUV * 4.2 + vec2(time * 0.06, -time * 0.04)));
    color = mix(color, misreg, min(u_printOffset * 24.0, 1.0) * 0.5);
    color = mix(color, mix(u_accentColor, u_secondaryAccent, 0.5), dots * u_halftoneAmount * 0.92);
    color += u_inkColor * dots * 0.07;
    color += vec3(0.02, 0.01, 0.03) * softBanding(paperUV, 14.0, time * 0.08, 0.14) * 0.05;
    color += mix(u_accentColor, u_secondaryAccent, panelB) * panelA * 0.05;
    color += mix(u_secondaryAccent, u_accentColor, panelC) * 0.03;
    color += (u_accentColor * 0.05 + u_secondaryAccent * 0.035) * neonCore;
    color += vec3(0.03, 0.02, 0.05) * cmykSplit * 0.03;
  } else if (profile < 5.5) {
    float soot = 1.0 - deckleMask(uv, max(u_tornEdgeAmount, 0.12));
    float ember = fbm(paperUV * 11.0 + time * 0.03);
    float smoke = fbm(paperUV * 4.0 + vec2(0.0, time * 0.02));
    float scorch = fbm(paperUV * 18.0 + vec2(time * 0.02, time * 0.01));
    float ash = ridgedFbm(paperUV * 7.5 + time * 0.02);
    float heat = smoothstep(0.45, 0.98, ember);
    color = mix(color, vec3(0.5, 0.31, 0.16), 0.22);
    color -= soot * 0.28;
    color += u_accentColor * heat * 0.08;
    color += u_secondaryAccent * smoke * 0.055;
    color += vec3(0.3, 0.11, 0.04) * smoothstep(0.72, 1.0, scorch) * 0.075;
    color += vec3(ash * 0.06) * (1.0 - soot * 0.65);
    color += vec3(0.03, 0.02, 0.01) * edgeLift * 0.05;
  } else if (profile < 6.5) {
    float sheen = foilBand(paperUV, time * u_foilSpeed, u_foilAngle);
    float fluted = flutedHighlight(paperUV, u_foilAngle, 16.0, time * 0.22);
    float liquid = fbm(paperUV * 5.5 + vec2(time * 0.11, -time * 0.07));
    float prismShift = fbm(paperUV * 2.0 + time * 0.08);
    float spectral = fbm(paperUV * 3.2 + vec2(time * 0.05, -time * 0.04));
    float facet = smoothstep(0.22, 0.96, ridgedFbm(paperUV * 7.8 + vec2(time * 0.1, -time * 0.07)));
    float sparkle = smoothstep(0.72, 0.98, fbm(paperUV * 28.0 + time * 0.18));
    float rim = 1.0 - paperEdgeLift(centered, 0.92, 0.18);
    vec3 prism = mix(u_accentColor, u_secondaryAccent, 0.5);
    vec3 chrome = mix(vec3(0.12, 0.13, 0.18), vec3(0.96, 0.96, 1.0), sheen);
    vec3 spectralWarm = mix(vec3(0.94, 0.58, 0.28), vec3(0.84, 0.34, 0.92), spectral);
    vec3 spectralCool = mix(vec3(0.26, 0.86, 1.0), vec3(0.58, 0.72, 1.0), liquid);
    color = mix(color, vec3(0.08, 0.09, 0.13), 0.42);
    color += prism * sheen * (u_foilAmount * 1.45 + 0.12);
    color += mix(spectralWarm, spectralCool, 0.5) * fluted * 0.08;
    color += mix(vec3(0.03, 0.04, 0.06), prism, facet) * 0.08;
    color += chrome * liquid * 0.04;
    color += vec3(0.08, 0.12, 0.18) * prismShift * 0.04;
    color += mix(vec3(0.02, 0.03, 0.05), prism, lightBand) * 0.05;
    color += vec3(0.04, 0.05, 0.08) * rim * 0.05;
    color += mix(vec3(0.03, 0.05, 0.07), spectralWarm, sparkle) * 0.03;
  } else {
    float grid = blueprintMask(paperUV, max(u_blueprintGrid, 0.05) * 24.0);
    float hatch = 1.0 - smoothstep(0.0, 0.02, abs(fract((paperUV.x + paperUV.y * 0.65) * 120.0) - 0.5));
    float orbit = orbitRing(paperUV, vec2(0.5, 0.46), 0.22, 0.006);
    float orbit2 = orbitRing(paperUV, vec2(0.5, 0.46), 0.34, 0.005);
    float annotation = 1.0 - smoothstep(0.01, 0.0, abs(fract((paperUV.x * 64.0) + paperUV.y * 13.0) - 0.5));
    float blueprintFog = smoothstep(0.95, 0.18, length(centered));
    color = mix(color, vec3(0.07, 0.18, 0.42), 0.34);
    color += mix(u_inkColor, u_accentColor, 0.35) * grid * (0.6 + u_blueprintGrid);
    color += u_secondaryAccent * hatch * 0.05;
    color += vec3(0.01, 0.02, 0.04) * softBanding(paperUV, 12.0, time * 0.08, 0.16) * 0.05;
    color += u_accentColor * (orbit + orbit2) * 0.045;
    color += u_secondaryAccent * annotation * 0.022;
    color += vec3(0.03, 0.05, 0.08) * blueprintFog * 0.04;
  }

  color = mix(color, color * wearMask + u_baseColor * (1.0 - wearMask), 0.18);
  color *= mix(1.0, wearMask, clamp(1.0 - u_tornEdgeAmount * 2.0, 0.0, 1.0));
  color -= (1.0 - wearMask) * u_edgeDarkness * 0.24;

  float vignetteStrength = clamp(u_vignetteAmount, 0.0, 2.0);
  if (vignetteStrength > 0.0) {
    float vignette = smoothstep(1.2, 0.22, length(centered));
    color *= mix(1.0, vignette, vignetteStrength * 0.16);
  }

  color += vec3(0.015, 0.015, 0.02) * (bodyShade - 0.5) * 0.34;
  color = (color - 0.5) * max(u_contrast, 0.0) + 0.5 + u_brightness - 1.0;
  color = max(color, 0.0);

  fragColor = vec4(color, 1.0);
}
`;

export default function PaperShader(props: PaperShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const propsRef = useRef({
    baseColor: props.baseColor ?? [0.94, 0.92, 0.88],
    inkColor: props.inkColor ?? [0.12, 0.1, 0.1],
    accentColor: props.accentColor ?? [0.98, 0.76, 0.32],
    secondaryAccent: props.secondaryAccent ?? [0.34, 0.82, 0.95],
    fiberScale: props.fiberScale ?? 82.0,
    fiberStrength: props.fiberStrength ?? 0.24,
    grainAmount: props.grainAmount ?? 0.08,
    noiseScale: props.noiseScale ?? 1.0,
    inkBleedAmount: props.inkBleedAmount ?? 0.0,
    inkBleedSpeed: props.inkBleedSpeed ?? 1.0,
    inkSoftness: props.inkSoftness ?? 0.5,
    foilAmount: props.foilAmount ?? 0.0,
    foilSpeed: props.foilSpeed ?? 1.0,
    foilAngle: props.foilAngle ?? 0.785,
    vignetteAmount: props.vignetteAmount ?? 0.0,
    edgeDarkness: props.edgeDarkness ?? 0.0,
    tornEdgeAmount: props.tornEdgeAmount ?? 0.0,
    halftoneAmount: props.halftoneAmount ?? 0.0,
    halftoneScale: props.halftoneScale ?? 100.0,
    printOffset: props.printOffset ?? 0.0,
    motionAmount: props.motionAmount ?? 1.0,
    paperWarp: props.paperWarp ?? 0.0,
    contrast: props.contrast ?? 1.0,
    brightness: props.brightness ?? 1.0,
    creaseAmount: props.creaseAmount ?? 0.0,
    ghostAmount: props.ghostAmount ?? 0.0,
    blueprintGrid: props.blueprintGrid ?? 0.0,
    paperProfile: props.paperProfile ?? 0,
  });

  useEffect(() => {
    propsRef.current = {
      baseColor: props.baseColor ?? [0.94, 0.92, 0.88],
      inkColor: props.inkColor ?? [0.12, 0.1, 0.1],
      accentColor: props.accentColor ?? [0.98, 0.76, 0.32],
      secondaryAccent: props.secondaryAccent ?? [0.34, 0.82, 0.95],
      fiberScale: props.fiberScale ?? 82.0,
      fiberStrength: props.fiberStrength ?? 0.24,
      grainAmount: props.grainAmount ?? 0.08,
      noiseScale: props.noiseScale ?? 1.0,
      inkBleedAmount: props.inkBleedAmount ?? 0.0,
      inkBleedSpeed: props.inkBleedSpeed ?? 1.0,
      inkSoftness: props.inkSoftness ?? 0.5,
      foilAmount: props.foilAmount ?? 0.0,
      foilSpeed: props.foilSpeed ?? 1.0,
      foilAngle: props.foilAngle ?? 0.785,
      vignetteAmount: props.vignetteAmount ?? 0.0,
      edgeDarkness: props.edgeDarkness ?? 0.0,
      tornEdgeAmount: props.tornEdgeAmount ?? 0.0,
      halftoneAmount: props.halftoneAmount ?? 0.0,
      halftoneScale: props.halftoneScale ?? 100.0,
      printOffset: props.printOffset ?? 0.0,
      motionAmount: props.motionAmount ?? 1.0,
      paperWarp: props.paperWarp ?? 0.0,
      contrast: props.contrast ?? 1.0,
      brightness: props.brightness ?? 1.0,
      creaseAmount: props.creaseAmount ?? 0.0,
      ghostAmount: props.ghostAmount ?? 0.0,
      blueprintGrid: props.blueprintGrid ?? 0.0,
      paperProfile: props.paperProfile ?? 0,
    };
  }, [props]);

  useEffect(() => {
    if (hasError) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL2 context creation failed', e);
    }

    if (!gl) {
      setHasError(true);
      setErrorMessage('WebGL2 is not supported in this browser.');
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.warn('Shader compilation failed: ', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vs || !fs) {
      setHasError(true);
      setErrorMessage('Failed to compile shaders.');
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasError(true);
      setErrorMessage('Failed to create WebGL program.');
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link failed: ', gl.getProgramInfoLog(program));
      setHasError(true);
      setErrorMessage('Failed to link WebGL program.');
      return;
    }

    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      profile: gl.getUniformLocation(program, 'u_profile'),
      baseColor: gl.getUniformLocation(program, 'u_baseColor'),
      inkColor: gl.getUniformLocation(program, 'u_inkColor'),
      accentColor: gl.getUniformLocation(program, 'u_accentColor'),
      secondaryAccent: gl.getUniformLocation(program, 'u_secondaryAccent'),
      fiberScale: gl.getUniformLocation(program, 'u_fiberScale'),
      fiberStrength: gl.getUniformLocation(program, 'u_fiberStrength'),
      grainAmount: gl.getUniformLocation(program, 'u_grainAmount'),
      noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
      inkBleedAmount: gl.getUniformLocation(program, 'u_inkBleedAmount'),
      inkBleedSpeed: gl.getUniformLocation(program, 'u_inkBleedSpeed'),
      inkSoftness: gl.getUniformLocation(program, 'u_inkSoftness'),
      foilAmount: gl.getUniformLocation(program, 'u_foilAmount'),
      foilSpeed: gl.getUniformLocation(program, 'u_foilSpeed'),
      foilAngle: gl.getUniformLocation(program, 'u_foilAngle'),
      vignetteAmount: gl.getUniformLocation(program, 'u_vignetteAmount'),
      edgeDarkness: gl.getUniformLocation(program, 'u_edgeDarkness'),
      tornEdgeAmount: gl.getUniformLocation(program, 'u_tornEdgeAmount'),
      halftoneAmount: gl.getUniformLocation(program, 'u_halftoneAmount'),
      halftoneScale: gl.getUniformLocation(program, 'u_halftoneScale'),
      printOffset: gl.getUniformLocation(program, 'u_printOffset'),
      motionAmount: gl.getUniformLocation(program, 'u_motionAmount'),
      paperWarp: gl.getUniformLocation(program, 'u_paperWarp'),
      contrast: gl.getUniformLocation(program, 'u_contrast'),
      brightness: gl.getUniformLocation(program, 'u_brightness'),
      creaseAmount: gl.getUniformLocation(program, 'u_creaseAmount'),
      ghostAmount: gl.getUniformLocation(program, 'u_ghostAmount'),
      blueprintGrid: gl.getUniformLocation(program, 'u_blueprintGrid'),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frameId: number;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (t: number) => {
      const p = propsRef.current;
      gl!.uniform2f(uniforms.res, canvas.width, canvas.height);

      const timeVal = isReducedMotion ? t * 0.0001 : t * 0.001;
      gl!.uniform1f(uniforms.time, timeVal);
      gl!.uniform1f(uniforms.profile, p.paperProfile);

      gl!.uniform3fv(uniforms.baseColor, p.baseColor);
      gl!.uniform3fv(uniforms.inkColor, p.inkColor);
      gl!.uniform3fv(uniforms.accentColor, p.accentColor);
      gl!.uniform3fv(uniforms.secondaryAccent, p.secondaryAccent);
      gl!.uniform1f(uniforms.fiberScale, p.fiberScale);
      gl!.uniform1f(uniforms.fiberStrength, p.fiberStrength);
      gl!.uniform1f(uniforms.grainAmount, p.grainAmount);
      gl!.uniform1f(uniforms.noiseScale, p.noiseScale);
      gl!.uniform1f(uniforms.inkBleedAmount, p.inkBleedAmount);
      gl!.uniform1f(uniforms.inkBleedSpeed, p.inkBleedSpeed);
      gl!.uniform1f(uniforms.inkSoftness, p.inkSoftness);
      gl!.uniform1f(uniforms.foilAmount, p.foilAmount);
      gl!.uniform1f(uniforms.foilSpeed, p.foilSpeed);
      gl!.uniform1f(uniforms.foilAngle, p.foilAngle);
      gl!.uniform1f(uniforms.vignetteAmount, p.vignetteAmount);
      gl!.uniform1f(uniforms.edgeDarkness, p.edgeDarkness);
      gl!.uniform1f(uniforms.tornEdgeAmount, p.tornEdgeAmount);
      gl!.uniform1f(uniforms.halftoneAmount, p.halftoneAmount);
      gl!.uniform1f(uniforms.halftoneScale, p.halftoneScale);
      gl!.uniform1f(uniforms.printOffset, p.printOffset);
      gl!.uniform1f(uniforms.motionAmount, p.motionAmount);
      gl!.uniform1f(uniforms.paperWarp, p.paperWarp);
      gl!.uniform1f(uniforms.contrast, p.contrast);
      gl!.uniform1f(uniforms.brightness, p.brightness);
      gl!.uniform1f(uniforms.creaseAmount, p.creaseAmount);
      gl!.uniform1f(uniforms.ghostAmount, p.ghostAmount);
      gl!.uniform1f(uniforms.blueprintGrid, p.blueprintGrid);

      gl!.drawArrays(gl!.TRIANGLES, 0, 6);

      if (!isReducedMotion || p.motionAmount > 0) {
        frameId = requestAnimationFrame(render);
      }
    };

    render(0);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buf);
      }
    };
  }, [hasError]);

  if (hasError) {
    return (
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundColor: `rgb(${props.baseColor?.[0]!*255}, ${props.baseColor?.[1]!*255}, ${props.baseColor?.[2]!*255})`,
          backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span className="text-white/20 text-xs hidden">{errorMessage}</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}
