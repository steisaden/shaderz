import React from 'react';
import { PresetDefinition } from './types';
import GalaxySwirl from './galaxy-swirl/galaxy-swirl.component';
import GridBackground from './grid-background/grid-background.component';
import NeonFogGrid from './neon-fog/neon-fog.component';
import NorthernLightsBackground from './northern-lights/northern-lights.component';

export const PRESET_REGISTRY: Record<string, PresetDefinition> = {
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy Swirl',
    description: 'A swirling stellar vortex with volumetric star paths.',
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
    }
  },
  neon_fog: {
    id: 'neon_fog',
    name: 'Neon Fog Grid',
    description: 'Retro cyberpunk grid receding into glowing purple and cyan fog.',
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
    }
  },
  noorder_licht: {
    id: 'noorder_licht',
    name: 'Northern Lights',
    description: 'Dynamic simulated aurora borealis waving against a starry void.',
    version: '1.0.0',
    component: NorthernLightsBackground,
    defaultProps: {
      speed: 1.0,
      colorIntensity: 1.0
    }
  },
  grid: {
    id: 'grid',
    name: 'Nebular Grid',
    description: 'A glowing cosmic grid mapped against colorful gas clouds.',
    version: '1.0.0',
    component: GridBackground,
    defaultProps: {
      speed: 1.0,
      gridOpacity: 2.0,
      smokeOpacity: 0.5,
      colorIntensity: 1.0,
      mode: 'nebular_grid',
      polySides: 0,
      polySize: 0.3,
      polyRotation: 0.0,
      polyColor: [1.0, 1.0, 1.0],
      polyPosition: [0.0, 0.0],
    }
  },
  cubed_smoke: {
    id: 'cubed_smoke',
    name: 'Cubed Smoke',
    description: 'Layered volumetric smoke mapped against glowing geometric grids.',
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
    }
  }
};

export function getPreset(id: string): PresetDefinition | undefined {
  return PRESET_REGISTRY[id];
}

export function getAllPresets(): PresetDefinition[] {
  return Object.values(PRESET_REGISTRY);
}
