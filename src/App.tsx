import { Check, Copy, X } from 'lucide-react';
import React, { useState } from 'react';
import GalaxySwirlRaw from './components/presets/galaxy-swirl/galaxy-swirl.component?raw';
import GridBackgroundRaw from './components/presets/grid-background/grid-background.component?raw';
import NeonFogGrid, { NEON_FOG_GRID_PRESET as NEON_FOG_PRESET, GridSurface } from './components/NeonFogGrid';
import NeonFogGridRaw from './components/presets/neon-fog/neon-fog.component?raw';
import NorthernLightsBackgroundRaw from './components/presets/northern-lights/northern-lights.component?raw';
import { getPreset } from './components/presets/PresetRegistry';
import { PresetErrorBoundary } from './components/presets/PresetErrorBoundary';
import PresetInspector from './components/presets/PresetInspector';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0,0,0];
};

export default function App() {
  const [shaderType, setShaderType] = useState('noorder_licht');
  const [gridSurfaces, setGridSurfaces] = useState<GridSurface[]>([
    { enabled: true, color: [0, 1, 1, 0.5], rotation: [0, 0, 4], tileWidth: 1, tileDepth: 1, patternType: 4, patternSize: 0.2, patternRotation: 0, offset: [0, 0] },
    { enabled: false, color: [1, 0, 0.5, 0.5], rotation: [0, 0, 3], tileWidth: 1, tileDepth: 1, patternType: 3, patternSize: 0.2, patternRotation: 0, offset: [0, 0] },
    { enabled: false, color: [0.5, 0, 1, 0.5], rotation: [0, 0, 6], tileWidth: 1, tileDepth: 1, patternType: 6, patternSize: 0.2, patternRotation: 0, offset: [0, 0] },
    { enabled: false, color: [1, 1, 0, 0.5], rotation: [0, 0, 13], tileWidth: 1, tileDepth: 1, patternType: 13, patternSize: 0.2, patternRotation: 0, offset: [0, 0] }
  ]);
  
  // ... rest of the app logic ...
  return (<div>App</div>);
}
