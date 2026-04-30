import React from 'react';
import NorthernLightsBackground from '../northern-lights/northern-lights.component';

export interface AuraBackgroundProps {
  color1?: number[];
  color2?: number[];
  color3?: number[];
  colorIntensity?: number;
  speed?: number;
  length?: number;
  width?: number;
  auraStyle?: number;
  auroraProfile?: number;
  staticMode?: boolean;
}

export default function AuraBackground({
  color1 = [0.11, 0.95, 0.56],
  color2 = [0.10, 0.73, 1.0],
  color3 = [0.60, 0.30, 1.0],
  colorIntensity = 1.22,
  speed = 0.62,
  length = 2.7,
  width = 1.55,
  auraStyle,
  auroraProfile,
  staticMode = false,
}: AuraBackgroundProps) {
  return (
    <NorthernLightsBackground
      color1={color1}
      color2={color2}
      color3={color3}
      colorIntensity={colorIntensity}
      speed={speed}
      length={length}
      width={width}
      auroraStyle={auraStyle ?? auroraProfile ?? 0.22}
      staticMode={staticMode}
    />
  );
}
