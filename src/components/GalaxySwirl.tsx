import React, { useEffect, useRef } from 'react';

const fragmentShaderSource = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;

uniform float uRotationSpeed;
uniform float uStarDensity;
uniform float uArmCurvature;
uniform float uStarSize;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uColorIntensity;
uniform bool uEnableBloom;
uniform float uTwinkleSpeed;
uniform float uStarTrails;
uniform float uSwirlType;

mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Better 2D Hash function
float hash(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
    float f = 0.0;
    float amp = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for(int i = 0; i < 4; i++) {
        f += amp * snoise(p);
        p = m * p;
        amp *= 0.5;
    }
    return f;
}

const float layers = 7.0;

void main() {
    float t = iTime * uRotationSpeed;
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / min(iResolution.y, iResolution.x);
    
    vec2 warp = vec2(fbm(uv * 3.0 + t * 0.5), fbm(uv * 3.0 + t * 0.5 + 100.0)) - 0.5;
    vec2 p = uv + warp * 0.05;
    
    float r = length(p);
    float angle = atan(p.y, p.x);
    
    vec3 col = vec3(0.0);
    col += vec3(0.015, 0.005, 0.025);
    
    float density = 0.0;
    vec2 q = p;
    mat2 mRot = rot(2.39996);
    vec2 qSwirl = p;
    
    if (uSwirlType < 0.5) {
        for(float i = 1.0; i <= layers; i++) {
            q *= mRot;
            q *= 1.4;
            vec2 sq = q + vec2(t * 0.3 / i, -t * 0.2 / i);
            density += abs(snoise(sq * 2.0)) / i;
        }
    } else {
        for(float i = 1.0; i <= layers; i++) {
            qSwirl *= rot(r * (uArmCurvature * 0.5) - t * 0.8 / i);
            vec2 sq = qSwirl * 2.5 * i;
            float v = sin(sq.x) * cos(sq.y) + sin(sq.y) * cos(sq.x);
            density += abs(v) / i;
        }
    }

    float arms = sin(angle * 3.0 + r * uArmCurvature - t * 5.0) * 0.5 + 0.5;
    float arms2 = sin(angle * 2.0 + r * (uArmCurvature * 0.5) - t * 3.0) * 0.5 + 0.5;
    arms = arms * 0.7 + arms2 * 0.3;
    arms = pow(arms, 2.0);

    vec2 starP = p * rot(r * 1.5 - t * 0.4);
    float starScale = 80.0 - uStarSize * 30.0;
    vec2 starUv = starP * starScale;
    
    vec3 starCol = vec3(0.0);
    float starThreshold = 1.0 - (uStarDensity * 0.1);
    float trailStretch = 1.0 + uStarTrails * 6.0;
    
    for(int y = -1; y <= 1; y++) {
        for(int x = -1; x <= 1; x++) {
            vec2 offsetGrid = vec2(float(x), float(y));
            vec2 cellId = floor(starUv) + offsetGrid;
            vec2 cellGrid = fract(starUv) - offsetGrid - 0.5;
            
            float starHash = hash(cellId);
            if(starHash > starThreshold) {
                vec2 cellCenter = (cellId + 0.5) / starScale;
                vec2 dirP = normalize(cellCenter + 0.0001);
                vec2 tangent = vec2(-dirP.y, dirP.x);
                
                vec2 starOffset = vec2(hash(cellId + 13.0), hash(cellId + 71.0)) * 0.5 - 0.25;
                vec2 floaty = vec2(
                    sin(iTime * 0.8 + starHash * 20.0),
                    cos(iTime * 0.7 + hash(cellId + 33.0) * 20.0)
                ) * 0.25;
                starOffset += floaty;
                
                vec2 dVec = cellGrid - starOffset;
                
                float dTangent = dot(dVec, tangent) / trailStretch;
                float dRadial = dot(dVec, dirP);
                float d = length(vec2(dTangent, dRadial));
                
                float radius = 0.05 + uStarSize * 0.05 + (starHash - starThreshold) * 0.1;
                float twinkle = sin(iTime * (uTwinkleSpeed * 0.5 + 0.5) + starHash * 150.0) * 0.5 + 0.5;
                twinkle = pow(twinkle, 2.0) * 0.7 + 0.3;
                
                float glow = smoothstep(radius, radius * 0.1, d) * twinkle;
                vec3 sc = mix(vec3(0.7, 0.9, 1.0), vec3(1.0, 0.8, 0.6), hash(cellId + 42.0));
                float mask = (0.2 + arms * 0.8) * exp(-r * 1.5);
                starCol += sc * glow * mask * 5.0;
            }
        }
    }
    
    float core = exp(-r * 8.0);
    vec3 coreColor = uColor3;
    
    float colorMix = sin(angle + r * 5.0 + t) * 0.5 + 0.5;
    vec3 nebulaCol = mix(uColor1, uColor2, colorMix);
    nebulaCol = mix(nebulaCol, uColor3, exp(-r * 5.0));
    
    nebulaCol *= uColorIntensity;
    coreColor *= uColorIntensity;
    
    float dust = density * exp(-r * 2.5);
    
    col += nebulaCol * arms * dust * 2.0;
    col += nebulaCol * exp(-r * 3.0) * density * 0.3;
    col += coreColor * core * 1.5;
    col += starCol;

    // Bloom effect
    if (uEnableBloom) {
        col += (coreColor * exp(-r * 4.0)) * 0.5;
        col += nebulaCol * dust * 0.5;
        col += starCol * 0.5;
    }

    col *= 1.0 - smoothstep(0.4, 2.0, r);
    float rx = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
    col += (rx - 0.5) * 0.015;
    
    col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
    gl_FragColor = vec4(col, 1.0);
}
`;

const vertexShaderSource = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export interface GalaxySwirlProps {
  rotationSpeed?: number;
  starDensity?: number;
  armCurvature?: number;
  starSize?: number;
  color1?: number[];
  color2?: number[];
  color3?: number[];
  colorIntensity?: number;
  enableBloom?: boolean;
  twinkleSpeed?: number;
  starTrails?: number;
  swirlType?: number;
}

export default function GalaxySwirl({
  rotationSpeed = 0.45,
  starDensity = 0.8,
  armCurvature = 2.8,
  starSize = 0.5,
  color1 = [0.1, 0.5, 0.9],
  color2 = [0.7, 0.1, 0.8],
  color3 = [0.9, 0.4, 0.2],
  colorIntensity = 1.0,
  enableBloom = true,
  twinkleSpeed = 3.0,
  starTrails = 0.0,
  swirlType = 0.0,
}: GalaxySwirlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const propsRef = useRef({ rotationSpeed, starDensity, armCurvature, starSize, color1, color2, color3, colorIntensity, enableBloom, twinkleSpeed, starTrails, swirlType });

  useEffect(() => {
    propsRef.current = { rotationSpeed, starDensity, armCurvature, starSize, color1, color2, color3, colorIntensity, enableBloom, twinkleSpeed, starTrails, swirlType };
  }, [rotationSpeed, starDensity, armCurvature, starSize, color1, color2, color3, colorIntensity, enableBloom, twinkleSpeed, starTrails, swirlType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    const webgl = gl as WebGLRenderingContext;

    const compileShader = (source: string, type: number) => {
      const shader = webgl.createShader(type);
      if (!shader) return null;
      webgl.shaderSource(shader, source);
      webgl.compileShader(shader);
      if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        console.error('Shader compile error:', webgl.getShaderInfoLog(shader));
        webgl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, webgl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, webgl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = webgl.createProgram();
    if (!program) return;
    webgl.attachShader(program, vertexShader);
    webgl.attachShader(program, fragmentShader);
    webgl.linkProgram(program);
    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      console.error('Program link error:', webgl.getProgramInfoLog(program));
      return;
    }

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

    const positionLocation = webgl.getAttribLocation(program, 'position');
    const resolutionLocation = webgl.getUniformLocation(program, 'iResolution');
    const timeLocation = webgl.getUniformLocation(program, 'iTime');
    
    // Custom Uniforms
    const uRotationSpeedLoc = webgl.getUniformLocation(program, 'uRotationSpeed');
    const uStarDensityLoc = webgl.getUniformLocation(program, 'uStarDensity');
    const uArmCurvatureLoc = webgl.getUniformLocation(program, 'uArmCurvature');
    const uStarSizeLoc = webgl.getUniformLocation(program, 'uStarSize');
    const uColor1Loc = webgl.getUniformLocation(program, 'uColor1');
    const uColor2Loc = webgl.getUniformLocation(program, 'uColor2');
    const uColor3Loc = webgl.getUniformLocation(program, 'uColor3');
    const uColorIntensityLoc = webgl.getUniformLocation(program, 'uColorIntensity');
    const uEnableBloomLoc = webgl.getUniformLocation(program, 'uEnableBloom');
    const uTwinkleSpeedLoc = webgl.getUniformLocation(program, 'uTwinkleSpeed');
    const uStarTrailsLoc = webgl.getUniformLocation(program, 'uStarTrails');
    const uSwirlTypeLoc = webgl.getUniformLocation(program, 'uSwirlType');

    const render = (time: number) => {
      if (!canvas) return;
      
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        webgl.viewport(0, 0, displayWidth, displayHeight);
      }

      webgl.useProgram(program);

      webgl.enableVertexAttribArray(positionLocation);
      webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);
      webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

      webgl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      webgl.uniform1f(timeLocation, time * 0.001);
      
      const props = propsRef.current;
      webgl.uniform1f(uRotationSpeedLoc, props.rotationSpeed);
      webgl.uniform1f(uStarDensityLoc, props.starDensity);
      webgl.uniform1f(uArmCurvatureLoc, props.armCurvature);
      webgl.uniform1f(uStarSizeLoc, props.starSize);
      webgl.uniform3f(uColor1Loc, props.color1[0], props.color1[1], props.color1[2]);
      webgl.uniform3f(uColor2Loc, props.color2[0], props.color2[1], props.color2[2]);
      webgl.uniform3f(uColor3Loc, props.color3[0], props.color3[1], props.color3[2]);
      webgl.uniform1f(uColorIntensityLoc, props.colorIntensity);
      webgl.uniform1i(uEnableBloomLoc, props.enableBloom ? 1 : 0);
      webgl.uniform1f(uTwinkleSpeedLoc, props.twinkleSpeed);
      webgl.uniform1f(uStarTrailsLoc, props.starTrails);
      webgl.uniform1f(uSwirlTypeLoc, props.swirlType);

      webgl.drawArrays(webgl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      webgl.deleteProgram(program);
      webgl.deleteShader(vertexShader);
      webgl.deleteShader(fragmentShader);
      webgl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-black"
    />
  );
}
