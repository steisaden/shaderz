import React from 'react';

export interface BasePresetProps {
  speed?: number;
  color1?: [number, number, number];
  color2?: [number, number, number];
  color3?: [number, number, number];
  colorIntensity?: number;
  staticMode?: boolean;
  className?: string;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  component: React.ComponentType<any>;
  defaultProps: Record<string, any>;
}
