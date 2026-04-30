import React from 'react';
import { Control, ControlFormat, ControlGroup, PresetDefinition } from './types';
import GalaxySwirl from './galaxy-swirl/galaxy-swirl.component';
import GridBackground from './grid-background/grid-background.component';
import NeonFogGrid from './neon-fog/neon-fog.component';
import NorthernLightsBackground from './northern-lights/northern-lights.component';
import AuraBackground from './aura/aura.component';
import GalaxyOrb from './galaxy-orb/galaxy-orb.component';
import DriftingContours from './drifting-contours/drifting-contours.component';
import RetroGridShader from '../RetroGridShader';
import PaperShader from '../PaperShader';

const CONTROL_GROUPS: Record<string, ControlGroup> = {
  speed: 'Motion',
  rotationSpeed: 'Motion',
  twinkleSpeed: 'Motion',
  fogSpeed: 'Motion',
  foilSpeed: 'Motion',
  motionAmount: 'Motion',
  paletteShift: 'Motion',
  polyRotation: 'Motion',

  armCurvature: 'Shape',
  armCount: 'Shape',
  armSharpness: 'Shape',
  swirlStrength: 'Shape',
  coreIntensity: 'Shape',
  coreSize: 'Shape',
  contourDensity: 'Shape',
  lineWidth: 'Shape',
  warpStrength: 'Shape',
  terrainDepth: 'Shape',
  zoom: 'Shape',
  gridScale: 'Shape',
  gridDensity: 'Shape',
  perspective: 'Shape',
  horizon: 'Shape',
  length: 'Shape',
  width: 'Shape',
  density: 'Shape',
  galaxyScale: 'Shape',
  polySize: 'Shape',

  glowStrength: 'Atmosphere',
  gridGlow: 'Atmosphere',
  fogIntensity: 'Atmosphere',
  vignette: 'Atmosphere',
  vignetteAmount: 'Atmosphere',
  smokeOpacity: 'Atmosphere',
  colorIntensity: 'Atmosphere',
  opacity: 'Atmosphere',
  bgDarkness: 'Atmosphere',

  grainAmount: 'Texture',
  fiberStrength: 'Texture',
  inkBleedAmount: 'Texture',
  foilAmount: 'Texture',
  edgeDarkness: 'Texture',
  tornEdgeAmount: 'Texture',
  ghostAmount: 'Texture',
  halftoneAmount: 'Texture',
  paperWarp: 'Texture',
  starDensity: 'Texture',
  starSize: 'Texture',
  starBrightness: 'Texture',
  dustAmount: 'Texture',
  dustScale: 'Texture',
  starTrails: 'Texture',

  intensity: 'Output',
};

const MULTIPLIER_FORMAT_PROPS = new Set([
  'speed',
  'rotationSpeed',
  'twinkleSpeed',
  'fogSpeed',
  'foilSpeed',
  'zoom',
  'gridScale',
  'galaxyScale',
  'dustScale',
  'gridDensity',
  'density',
]);

const PERCENT_FORMAT_PROPS = new Set([
  'grainAmount',
  'inkBleedAmount',
  'foilAmount',
  'motionAmount',
  'edgeDarkness',
  'vignette',
  'vignetteAmount',
  'tornEdgeAmount',
  'ghostAmount',
  'halftoneAmount',
  'paperWarp',
  'fiberStrength',
  'warpStrength',
  'glowStrength',
  'gridGlow',
  'fogIntensity',
  'smokeOpacity',
  'opacity',
  'bgDarkness',
  'starDensity',
  'starSize',
  'starBrightness',
  'dustAmount',
  'starTrails',
]);

function getControlFormat(control: Control): ControlFormat {
  if (MULTIPLIER_FORMAT_PROPS.has(control.propName)) {
    return 'multiplier';
  }

  if (PERCENT_FORMAT_PROPS.has(control.propName) && control.min >= 0 && control.max <= 2) {
    return 'percent';
  }

  return 'number';
}

function withControlMetadata(controls: Control[]): Control[] {
  return controls.map((control) => ({
    ...control,
    group: control.group ?? CONTROL_GROUPS[control.propName],
    format: control.format ?? getControlFormat(control),
  }));
}

export const PRESET_REGISTRY: Record<string, PresetDefinition> = {
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy Swirl',
    description: 'A swirling stellar vortex with volumetric star paths.',
    category: 'Cosmic',
    version: '1.0.0',
    component: GalaxySwirl,
    defaultProps: {
      rotationSpeed: 0.45,
      starDensity: 0.8,
      armCurvature: 2.8,
      starSize: 0.5,
      colorIntensity: 1.0,
      enableBloom: true,
      twinkleSpeed: 3.0,
      starTrails: 0.0,
      swirlType: 0.0,
    },
    controls: withControlMetadata([
      { label: 'Rotation Speed', propName: 'rotationSpeed', min: 0, max: 2, step: 0.01 },
      { label: 'Star Density', propName: 'starDensity', min: 0, max: 2, step: 0.01 },
      { label: 'Arm Curvature', propName: 'armCurvature', min: 0, max: 5, step: 0.1 },
      { label: 'Star Size', propName: 'starSize', min: 0, max: 2, step: 0.01 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Primary Color', propName: 'color1', kind: 'color' },
      { label: 'Secondary Color', propName: 'color2', kind: 'color' },
      { label: 'Accent Color', propName: 'color3', kind: 'color' },
      { label: 'Twinkle Speed', propName: 'twinkleSpeed', min: 0, max: 10, step: 0.1 },
      { label: 'Star Trails', propName: 'starTrails', min: 0, max: 1, step: 0.01 },
      { label: 'Swirl Type', propName: 'swirlType', min: 0, max: 2, step: 1 }
    ])
  },
  galaxy_orb: {
    id: 'galaxy_orb',
    name: 'Galaxy Orb',
    description: 'A hypnotic swirling vortex of cosmic dust, radiant spiral arms, and dense stellar fields.',
    category: 'Cosmic',
    version: '1.0.0',
    component: GalaxyOrb,
    defaultProps: {
      speed: 0.18,
      swirlStrength: 5.5,
      armCount: 4,
      armSharpness: 4.5,
      coreSize: 0.14,
      coreIntensity: 1.8,
      dustAmount: 1.0,
      dustScale: 4.0,
      starDensity: 0.18,
      starBrightness: 0.75,
      glowStrength: 1.4,
      galaxyScale: 1.0,
      centerX: 0.5,
      centerY: 0.5,
      colorA: [0.486, 0.173, 1.0],
      colorB: [0.059, 0.675, 0.796],
      colorC: [0.890, 0.678, 0.247],
      bgDarkness: 0.82,
      vignette: 0.9,
      opacity: 0.9
    },
    controls: withControlMetadata([
        { label: 'Speed', propName: 'speed', min: -2, max: 2, step: 0.01 },
        { label: 'Swirl Strength', propName: 'swirlStrength', min: 0, max: 12, step: 0.1 },
        { label: 'Arm Count', propName: 'armCount', min: 1, max: 8, step: 1 },
        { label: 'Arm Sharpness', propName: 'armSharpness', min: 0.5, max: 12, step: 0.1 },
        { label: 'Core Intensity', propName: 'coreIntensity', min: 0, max: 5, step: 0.1 },
        { label: 'Dust Amount', propName: 'dustAmount', min: 0, max: 2, step: 0.01 },
        { label: 'Star Density', propName: 'starDensity', min: 0, max: 1, step: 0.01 },
        { label: 'Glow Strength', propName: 'glowStrength', min: 0, max: 2, step: 0.01 },
        { label: 'Galaxy Scale', propName: 'galaxyScale', min: 0.25, max: 3, step: 0.01 },
        { label: 'Vignette', propName: 'vignette', min: 0, max: 2, step: 0.01 }
    ])
  },
  drifting_contours: {
    id: 'drifting_contours',
    name: 'Drifting Contours',
    description: 'A luminous topographic field with slow domain-warped isolines, mineral color drift, and paper-grain texture.',
    category: 'Abstract',
    version: '1.0.0',
    component: DriftingContours,
    defaultProps: {
      speed: 0.32,
      contourDensity: 11.5,
      lineWidth: 0.085,
      warpStrength: 0.82,
      terrainDepth: 1.18,
      glowStrength: 0.75,
      paletteShift: 0.0,
      grainAmount: 0.035,
      zoom: 1.55,
      colorA: [0.08, 0.48, 0.72],
      colorB: [0.72, 0.20, 0.58],
      accentColor: [1.0, 0.72, 0.28],
      backgroundColor: [0.018, 0.015, 0.038]
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: -1, max: 1.5, step: 0.01 },
      { label: 'Contour Density', propName: 'contourDensity', min: 4, max: 24, step: 0.1 },
      { label: 'Line Width', propName: 'lineWidth', min: 0.01, max: 0.2, step: 0.001 },
      { label: 'Warp Strength', propName: 'warpStrength', min: 0, max: 2, step: 0.01 },
      { label: 'Terrain Depth', propName: 'terrainDepth', min: 0.25, max: 2.5, step: 0.01 },
      { label: 'Glow Strength', propName: 'glowStrength', min: 0, max: 2, step: 0.01 },
      { label: 'Palette Shift', propName: 'paletteShift', min: 0, max: 1, step: 0.01 },
      { label: 'Primary Color', propName: 'colorA', kind: 'color' },
      { label: 'Secondary Color', propName: 'colorB', kind: 'color' },
      { label: 'Accent Color', propName: 'accentColor', kind: 'color' },
      { label: 'Background Color', propName: 'backgroundColor', kind: 'color' },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 0.12, step: 0.001 },
      { label: 'Zoom', propName: 'zoom', min: 0.5, max: 3.5, step: 0.01 }
    ])
  },
  neon_fog: {
    id: 'neon_fog',
    name: 'Neon Fog Grid',
    description: 'Retro cyberpunk grid receding into glowing purple and cyan fog.',
    category: 'Grid',
    version: '1.1.0',
    component: NeonFogGrid,
    defaultProps: {
      speed: 0.5,
      gridScale: 2.5,
      lineWidth: 0.03,
      perspective: 1.5,
      horizon: 0.1,
      gridGlow: 0.6,
      fogIntensity: 0.8,
      fogSpeed: 0.15,
      grainAmount: 0.04,
      vignette: 1.2,
      polySides: 0,
      polySize: 0.3,
      polyRotation: 0.0,
      polyColor: [1.0, 1.0, 1.0],
      polyPosition: [0.0, 0.0],
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 2, step: 0.01 },
      { label: 'Grid Scale', propName: 'gridScale', min: 0.5, max: 5, step: 0.1 },
      { label: 'Line Width', propName: 'lineWidth', min: 0.01, max: 0.1, step: 0.001 },
      { label: 'Perspective', propName: 'perspective', min: 0.5, max: 3, step: 0.1 },
      { label: 'Horizon', propName: 'horizon', min: 0, max: 0.5, step: 0.01 },
      { label: 'Grid Glow', propName: 'gridGlow', min: 0, max: 2, step: 0.1 },
      { label: 'Fog Intensity', propName: 'fogIntensity', min: 0, max: 2, step: 0.1 },
      { label: 'Fog Speed', propName: 'fogSpeed', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 0.2, step: 0.01 },
      { label: 'Vignette', propName: 'vignette', min: 0, max: 2, step: 0.1 }
    ])
  },
  noorder_licht: {
    id: 'noorder_licht',
    name: 'Northern Lights',
    description: 'A cinematic aurora curtain with editorial pacing, deep spectral gradients, and floating veil layers.',
    category: 'Aurora',
    version: '2.0.0',
    component: NorthernLightsBackground,
    defaultProps: {
      speed: 0.58,
      colorIntensity: 1.16,
      color1: [0.36, 0.16, 0.95],
      color2: [0.13, 0.82, 0.88],
      color3: [0.98, 0.74, 0.34],
      length: 2.38,
      width: 1.84,
      auroraProfile: 0
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 3, step: 0.01 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Primary Color', propName: 'color1', kind: 'color' },
      { label: 'Secondary Color', propName: 'color2', kind: 'color' },
      { label: 'Accent Color', propName: 'color3', kind: 'color' },
      { label: 'Length', propName: 'length', min: 0.1, max: 5.0, step: 0.1 },
      { label: 'Width', propName: 'width', min: 0.1, max: 5.0, step: 0.1 }
    ])
  },
  aura: {
    id: 'aura',
    name: 'Aura',
    description: 'A flowing emerald aurora with domain-warped ribbons, spectral blue-violet crowns, and a soft volumetric curtain.',
    category: 'Aurora',
    version: '1.0.0',
    component: AuraBackground,
    defaultProps: {
      speed: 0.62,
      colorIntensity: 1.22,
      color1: [0.11, 0.95, 0.56],
      color2: [0.10, 0.73, 1.0],
      color3: [0.60, 0.30, 1.0],
      length: 2.7,
      width: 1.55,
      auraStyle: 0.36
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 3, step: 0.01 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Primary Color', propName: 'color1', kind: 'color' },
      { label: 'Secondary Color', propName: 'color2', kind: 'color' },
      { label: 'Accent Color', propName: 'color3', kind: 'color' },
      { label: 'Length', propName: 'length', min: 0.1, max: 5.0, step: 0.1 },
      { label: 'Width', propName: 'width', min: 0.1, max: 5.0, step: 0.1 }
    ])
  },
  noorder_licht_prism: {
    id: 'noorder_licht_prism',
    name: 'Northern Lights Prism',
    description: 'A prismatic aurora study with sharper spectral splits, brighter bands, and a more crystalline sky.',
    category: 'Aurora',
    version: '2.0.0',
    component: NorthernLightsBackground,
    defaultProps: {
      speed: 0.88,
      colorIntensity: 1.34,
      color1: [0.95, 0.32, 0.98],
      color2: [0.11, 0.92, 0.96],
      color3: [1.0, 0.86, 0.46],
      length: 1.48,
      width: 1.04,
      auroraProfile: 1
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 3, step: 0.01 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Primary Color', propName: 'color1', kind: 'color' },
      { label: 'Secondary Color', propName: 'color2', kind: 'color' },
      { label: 'Accent Color', propName: 'color3', kind: 'color' },
      { label: 'Length', propName: 'length', min: 0.1, max: 5.0, step: 0.1 },
      { label: 'Width', propName: 'width', min: 0.1, max: 5.0, step: 0.1 }
    ])
  },
  grid: {
    id: 'grid',
    name: 'Nebular Grid',
    description: 'A glowing cosmic grid mapped against colorful gas clouds.',
    category: 'Grid',
    version: '1.0.0',
    component: GridBackground,
    defaultProps: {
      speed: 1.0,
      gridDensity: 2.0,
      smokeOpacity: 0.5,
      colorIntensity: 1.0,
      mode: 'nebular_grid',
      polySides: 0,
      polySize: 0.3,
      polyRotation: 0.0,
      polyColor: [1.0, 1.0, 1.0],
      polyPosition: [0.0, 0.0],
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 2, step: 0.01 },
      { label: 'Grid Density', propName: 'gridDensity', min: 0, max: 3, step: 0.1 },
      { label: 'Smoke Opacity', propName: 'smokeOpacity', min: 0, max: 2, step: 0.1 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Poly Size', propName: 'polySize', min: 0.1, max: 1.0, step: 0.01 },
      { label: 'Poly Rotation', propName: 'polyRotation', min: -3.14, max: 3.14, step: 0.01 }
    ])
  },
  cubed_smoke: {
    id: 'cubed_smoke',
    name: 'Cubed Smoke',
    description: 'Layered volumetric smoke mapped against glowing geometric grids.',
    category: 'Grid',
    version: '1.0.0',
    component: GridBackground,
    defaultProps: {
      speed: 0.5,
      gridDensity: 2.0,
      smokeOpacity: 0.5,
      colorIntensity: 1.5,
      mode: 'cubed_smoke',
      polySides: 0,
      polySize: 0.3,
      polyRotation: 0.0,
      polyColor: [1.0, 1.0, 1.0],
      polyPosition: [0.0, 0.0],
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 2, step: 0.01 },
      { label: 'Grid Density', propName: 'gridDensity', min: 0, max: 5, step: 0.1 },
      { label: 'Smoke Opacity', propName: 'smokeOpacity', min: 0, max: 2, step: 0.1 },
      { label: 'Color Intensity', propName: 'colorIntensity', min: 0, max: 3, step: 0.1 },
      { label: 'Poly Size', propName: 'polySize', min: 0.1, max: 1.0, step: 0.01 },
      { label: 'Poly Rotation', propName: 'polyRotation', min: -3.14, max: 3.14, step: 0.01 }
    ])
  },
  retro_grid: {
    id: 'retro_grid',
    name: 'Retro Synth Grid',
    description: 'A cinematic synthwave horizon featuring exponential glow, curved perspective, and volumetric atmospheric fog.',
    category: 'Grid',
    version: '1.0.0',
    component: RetroGridShader,
    defaultProps: {
      speed: 0.15,
      density: 1.5,
      intensity: 1.0,
      staticMode: false
    },
    controls: withControlMetadata([
      { label: 'Speed', propName: 'speed', min: 0, max: 2, step: 0.01 },
      { label: 'Density', propName: 'density', min: 1, max: 80, step: 1 },
      { label: 'Intensity', propName: 'intensity', min: 0.1, max: 3.0, step: 0.1 }
    ])
  },
  midnight_rice_paper: {
    id: 'midnight_rice_paper',
    name: 'Midnight Rice Paper',
    description: 'An airy nocturnal sheet with luminous fibers, soft spectral glints, and a gallery-lit surface.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.97, 0.95, 0.91],
      inkColor: [0.14, 0.12, 0.2],
      accentColor: [0.97, 0.84, 0.5],
      secondaryAccent: [0.58, 0.86, 1.0],
      fiberScale: 104.0,
      fiberStrength: 0.48,
      grainAmount: 0.06,
      foilAmount: 0.04,
      paperWarp: 0.12,
      creaseAmount: 0.08,
      vignetteAmount: 0.0,
      motionAmount: 0.04,
      contrast: 1.04,
      brightness: 1.01,
      paperProfile: 0
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  gold_foil_parchment: {
    id: 'gold_foil_parchment',
    name: 'Gold Foil Parchment',
    description: 'A warm vellum parchment with satin foil bands, fluted highlights, and burnished depth.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.94, 0.82, 0.63],
      inkColor: [0.2, 0.11, 0.05],
      accentColor: [0.99, 0.81, 0.34],
      secondaryAccent: [1.0, 0.93, 0.67],
      fiberScale: 72.0,
      fiberStrength: 0.34,
      grainAmount: 0.09,
      foilAmount: 0.98,
      foilSpeed: 0.28,
      edgeDarkness: 0.07,
      tornEdgeAmount: 0.01,
      ghostAmount: 0.02,
      paperWarp: 0.18,
      vignetteAmount: 0.0,
      motionAmount: 0.08,
      creaseAmount: 0.22,
      paperProfile: 1
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  wet_ink_bloom: {
    id: 'wet_ink_bloom',
    name: 'Wet Ink Bloom',
    description: 'A luminous watercolor bloom with liquid diffusion, soft pooling, and refined paper fibers.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.95, 0.93, 0.89],
      inkColor: [0.1, 0.48, 0.8],
      accentColor: [0.92, 0.25, 0.68],
      secondaryAccent: [0.26, 0.88, 0.8],
      fiberScale: 108.0,
      fiberStrength: 0.16,
      grainAmount: 0.05,
      inkBleedAmount: 0.92,
      inkBleedSpeed: 0.56,
      inkSoftness: 0.72,
      foilAmount: 0.02,
      paperWarp: 0.42,
      vignetteAmount: 0.0,
      motionAmount: 0.14,
      ghostAmount: 0.08,
      contrast: 1.03,
      paperProfile: 2
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  xerox_ghost: {
    id: 'xerox_ghost',
    name: 'Xerox Ghost',
    description: 'A premium photocopy artifact with scan jitter, dust bloom, and deliberate ghosted duplication.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.96, 0.96, 0.94],
      inkColor: [0.08, 0.08, 0.09],
      accentColor: [0.66, 0.78, 0.96],
      secondaryAccent: [0.9, 0.92, 0.95],
      fiberStrength: 0.03,
      grainAmount: 0.28,
      inkBleedAmount: 0.02,
      contrast: 1.34,
      ghostAmount: 1.0,
      paperWarp: 0.42,
      edgeDarkness: 0.04,
      tornEdgeAmount: 0.01,
      halftoneAmount: 0.22,
      halftoneScale: 126.0,
      printOffset: 0.02,
      vignetteAmount: 0.0,
      motionAmount: 0.14,
      paperProfile: 3
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  neon_risograph: {
    id: 'neon_risograph',
    name: 'Neon Risograph',
    description: 'A vibrant CMYK misregistration study with luminous halftones and saturated print layers.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.98, 0.95, 0.88],
      inkColor: [1.0, 0.18, 0.74],
      accentColor: [0.16, 0.86, 1.0],
      secondaryAccent: [1.0, 0.72, 0.28],
      fiberStrength: 0.18,
      grainAmount: 0.12,
      halftoneAmount: 0.84,
      halftoneScale: 168.0,
      printOffset: 0.042,
      foilAmount: 0.03,
      edgeDarkness: 0.0,
      ghostAmount: 0.24,
      paperWarp: 0.26,
      motionAmount: 0.5,
      vignetteAmount: 0.0,
      contrast: 1.12,
      paperProfile: 4
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  burnt_edge_manuscript: {
    id: 'burnt_edge_manuscript',
    name: 'Burnt Edge Manuscript',
    description: 'An archival manuscript with scorched margins, smoke-dark corners, and refined warmth.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.76, 0.58, 0.37],
      inkColor: [0.13, 0.06, 0.02],
      accentColor: [0.96, 0.62, 0.28],
      secondaryAccent: [0.34, 0.22, 0.12],
      fiberScale: 58.0,
      fiberStrength: 0.46,
      grainAmount: 0.18,
      inkBleedAmount: 0.04,
      edgeDarkness: 0.74,
      tornEdgeAmount: 0.16,
      ghostAmount: 0.04,
      paperWarp: 0.2,
      creaseAmount: 0.4,
      vignetteAmount: 0.0,
      motionAmount: 0.02,
      paperProfile: 5
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  holographic_poster_paper: {
    id: 'holographic_poster_paper',
    name: 'Holographic Poster Paper',
    description: 'A collector-grade poster stock with iridescent foil, liquid-metal fluting, and glossy depth.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.08, 0.09, 0.14],
      inkColor: [0.95, 0.96, 1.0],
      accentColor: [1.0, 0.2, 0.74],
      secondaryAccent: [0.15, 0.9, 1.0],
      fiberStrength: 0.08,
      grainAmount: 0.05,
      foilAmount: 0.98,
      foilSpeed: 0.46,
      foilAngle: 1.1,
      edgeDarkness: 0.0,
      ghostAmount: 0.06,
      paperWarp: 0.11,
      tornEdgeAmount: 0.0,
      vignetteAmount: 0.0,
      motionAmount: 0.44,
      contrast: 1.04,
      paperProfile: 6
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  },
  torn_blueprint_paper: {
    id: 'torn_blueprint_paper',
    name: 'Torn Blueprint Paper',
    description: 'A controlled blueprint sheet with technical linework, orbiting marks, and measured wear.',
    category: 'Paper',
    version: '2.0.0',
    component: PaperShader,
    defaultProps: {
      baseColor: [0.08, 0.21, 0.45],
      inkColor: [0.84, 0.92, 1.0],
      accentColor: [0.16, 0.95, 0.97],
      secondaryAccent: [1.0, 0.9, 0.45],
      fiberScale: 108.0,
      fiberStrength: 0.18,
      grainAmount: 0.1,
      blueprintGrid: 0.86,
      creaseAmount: 0.36,
      edgeDarkness: 0.04,
      tornEdgeAmount: 0.06,
      ghostAmount: 0.04,
      paperWarp: 0.04,
      halftoneAmount: 0.04,
      vignetteAmount: 0.0,
      motionAmount: 0.02,
      contrast: 1.04,
      paperProfile: 7
    },
    controls: withControlMetadata([
      { label: 'Fiber Strength', propName: 'fiberStrength', min: 0, max: 1, step: 0.01 },
      { label: 'Grain Amount', propName: 'grainAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Ink Bleed', propName: 'inkBleedAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Foil Amount', propName: 'foilAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Motion Amount', propName: 'motionAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Edge Darkness', propName: 'edgeDarkness', min: 0, max: 2, step: 0.01 },
      { label: 'Vignette', propName: 'vignetteAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Torn Edge', propName: 'tornEdgeAmount', min: 0, max: 0.5, step: 0.01 },
      { label: 'Ghost Offset', propName: 'ghostAmount', min: 0, max: 2, step: 0.01 },
      { label: 'Halftone', propName: 'halftoneAmount', min: 0, max: 1, step: 0.01 },
      { label: 'Paper Warp', propName: 'paperWarp', min: 0, max: 1, step: 0.01 }
    ])
  }
};

export function getPreset(id: string): PresetDefinition | undefined {
  return PRESET_REGISTRY[id];
}

export function getAllPresets(): PresetDefinition[] {
  return Object.values(PRESET_REGISTRY);
}
