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

export interface Control {
  label: string;
  propName: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | [number, number, number];
  group?: ControlGroup;
  format?: ControlFormat;
  kind?: 'slider' | 'color';
}

export type ControlGroup =
  | 'Motion'
  | 'Shape'
  | 'Atmosphere'
  | 'Texture'
  | 'Output'
  | (string & {});

export type ControlFormat = 'number' | 'percent' | 'multiplier';

export type PresetCategory =
  | 'Cosmic'
  | 'Abstract'
  | 'Grid'
  | 'Aurora'
  | 'Paper'
  | 'Experimental'
  | (string & {});

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  component: React.ComponentType<any>;
  defaultProps: Record<string, any>;
  version: string;
  controls?: Control[];
}
