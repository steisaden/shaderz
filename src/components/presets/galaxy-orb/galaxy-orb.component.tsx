import React, { useEffect, useRef } from 'react';

/**
 * GalaxyOrb: Premium swirling cosmic galaxy shader.
 * Features procedural spiral arms, nebula dust, starfields, and atmospheric bloom.
 */

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
uniform float u_swirlStrength;
uniform float u_rotationSpeed;
uniform int u_armCount;
uniform float u_armSharpness;
uniform float u_coreSize;
uniform float u_coreIntensity;
uniform float u_dustAmount;
uniform float u_dustScale;
uniform float u_starDensity;
uniform float u_starBrightness;
uniform float u_glowStrength;
uniform float u_galaxyScale;
uniform vec2 u_center;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform float u_bgDarkness;
uniform float u_vignette;
uniform float u_opacity;
uniform float u_motionMultiplier;

out vec4 fragColor;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
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
    for(int i = 0; i < 3; i++) {
        f += amp * snoise(p);
        p = m * p;
        amp *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    vec2 center = (u_center - 0.5) * 2.0; 
    vec2 p = (uv - center) * (1.0 / u_galaxyScale);
    
    float r = length(p);
    float a = atan(p.y, p.x);
    
    // Swirl logic
    float swirl = a + r * u_swirlStrength - (u_time * u_rotationSpeed * u_motionMultiplier);
    float arms = sin(swirl * float(u_armCount));
    float armBand = pow(max(arms * 0.5 + 0.5, 0.0), max(u_armSharpness, 0.001));
    
    // Core
    float core = exp(-r * (1.0 / u_coreSize)) * u_coreIntensity;
    
    // Dust
    float dust = fbm(p * u_dustScale + u_time * 0.1 * u_motionMultiplier) * u_dustAmount;
    
    // Compose
    vec3 col = mix(u_colorC, u_colorA, smoothstep(0.1, 0.4, r));
    col = mix(col, u_colorB, armBand);
    col += dust * u_colorA;
    col += core * u_colorC * u_glowStrength;
    
    // Stars
    float starField = step(1.0 - u_starDensity, hash(floor(p * 500.0)));
    col += starField * u_starBrightness;
    
    // Vignette
    col *= 1.0 - smoothstep(0.3, 2.0, r) * u_vignette;
    
    // Background Darkness
    col *= u_bgDarkness;
    
    fragColor = vec4(col * u_opacity, 1.0);
}
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Unable to create WebGL shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
        gl.deleteShader(shader);
        throw new Error(info);
    }

    return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;

    try {
        vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        program = gl.createProgram();

        if (!program) {
            throw new Error('Unable to create WebGL program');
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program) || 'Unknown program link error';
            throw new Error(info);
        }

        return { program, vertexShader, fragmentShader };
    } catch (error) {
        if (program) {
            gl.deleteProgram(program);
        }
        if (vertexShader) {
            gl.deleteShader(vertexShader);
        }
        if (fragmentShader) {
            gl.deleteShader(fragmentShader);
        }
        throw error;
    }
}

export interface GalaxyOrbProps {
    speed?: number;
    swirlStrength?: number;
    armCount?: number;
    armSharpness?: number;
    coreSize?: number;
    coreIntensity?: number;
    dustAmount?: number;
    dustScale?: number;
    starDensity?: number;
    starBrightness?: number;
    glowStrength?: number;
    galaxyScale?: number;
    centerX?: number;
    centerY?: number;
    colorA?: [number, number, number];
    colorB?: [number, number, number];
    colorC?: [number, number, number];
    bgDarkness?: number;
    vignette?: number;
    opacity?: number;
}

export default function GalaxyOrb(props: GalaxyOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const propsRef = useRef(props);

    useEffect(() => {
        propsRef.current = props;
    }, [props]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
        if (!gl) return;

        let resources: ReturnType<typeof createProgram>;
        try {
            resources = createProgram(gl);
        } catch (error) {
            console.error('GalaxyOrb WebGL initialization failed:', error);
            return;
        }

        const { program, vertexShader, fragmentShader } = resources;
        gl.useProgram(program);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(program, 'a_position');
        if (pos >= 0) {
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        }

        const locs = {
            res: gl.getUniformLocation(program, 'u_resolution'),
            time: gl.getUniformLocation(program, 'u_time'),
            swirl: gl.getUniformLocation(program, 'u_swirlStrength'),
            rot: gl.getUniformLocation(program, 'u_rotationSpeed'),
            arms: gl.getUniformLocation(program, 'u_armCount'),
            sharp: gl.getUniformLocation(program, 'u_armSharpness'),
            cSize: gl.getUniformLocation(program, 'u_coreSize'),
            cInt: gl.getUniformLocation(program, 'u_coreIntensity'),
            dustA: gl.getUniformLocation(program, 'u_dustAmount'),
            dustS: gl.getUniformLocation(program, 'u_dustScale'),
            sDens: gl.getUniformLocation(program, 'u_starDensity'),
            sBright: gl.getUniformLocation(program, 'u_starBrightness'),
            glow: gl.getUniformLocation(program, 'u_glowStrength'),
            scale: gl.getUniformLocation(program, 'u_galaxyScale'),
            center: gl.getUniformLocation(program, 'u_center'),
            colA: gl.getUniformLocation(program, 'u_colorA'),
            colB: gl.getUniformLocation(program, 'u_colorB'),
            colC: gl.getUniformLocation(program, 'u_colorC'),
            bgDark: gl.getUniformLocation(program, 'u_bgDarkness'),
            vig: gl.getUniformLocation(program, 'u_vignette'),
            opacity: gl.getUniformLocation(program, 'u_opacity'),
            motion: gl.getUniformLocation(program, 'u_motionMultiplier'),
        };

        const mm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const getMotion = () => mm.matches ? 0.1 : 1.0;
        let motionMultiplier = getMotion();
        const listener = () => { motionMultiplier = getMotion(); };
        mm.addEventListener('change', listener);

        let lastDpr = 0;
        const getCappedDpr = () => Math.min(window.devicePixelRatio || 1, 1.75);
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = getCappedDpr();
            const width = Math.max(1, Math.floor(rect.width * dpr));
            const height = Math.max(1, Math.floor(rect.height * dpr));
            lastDpr = dpr;

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            gl.viewport(0, 0, width, height);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas.parentElement ?? canvas);
        window.addEventListener('resize', resize);
        resize();

        let lastTimestamp: number | undefined;
        let elapsedSeconds = 0;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                lastTimestamp = undefined;
                return;
            }

            lastTimestamp = undefined;
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        let frame: number;
        const render = (t: number) => {
            if (document.hidden) {
                lastTimestamp = undefined;
                frame = requestAnimationFrame(render);
                return;
            }

            if (lastTimestamp !== undefined) {
                elapsedSeconds += Math.min((t - lastTimestamp) * 0.001, 0.1);
            }
            lastTimestamp = t;

            const currentProps = propsRef.current;

            if (getCappedDpr() !== lastDpr) {
                resize();
            }

            gl.uniform2f(locs.res, canvas.width, canvas.height);
            gl.uniform1f(locs.time, elapsedSeconds);
            gl.uniform1f(locs.swirl, currentProps.swirlStrength ?? 5.5);
            gl.uniform1f(locs.rot, currentProps.speed ?? 0.18);
            gl.uniform1i(locs.arms, Math.max(1, Math.round(currentProps.armCount ?? 4)));
            gl.uniform1f(locs.sharp, currentProps.armSharpness ?? 4.5);
            gl.uniform1f(locs.cSize, currentProps.coreSize ?? 0.14);
            gl.uniform1f(locs.cInt, currentProps.coreIntensity ?? 1.8);
            gl.uniform1f(locs.dustA, currentProps.dustAmount ?? 1.0);
            gl.uniform1f(locs.dustS, currentProps.dustScale ?? 4.0);
            gl.uniform1f(locs.sDens, currentProps.starDensity ?? 0.18);
            gl.uniform1f(locs.sBright, currentProps.starBrightness ?? 0.75);
            gl.uniform1f(locs.glow, currentProps.glowStrength ?? 1.4);
            gl.uniform1f(locs.scale, currentProps.galaxyScale ?? 1.0);
            gl.uniform2f(locs.center, currentProps.centerX ?? 0.5, currentProps.centerY ?? 0.5);
            gl.uniform3f(locs.colA, ...(currentProps.colorA ?? [0.486, 0.173, 1.0]));
            gl.uniform3f(locs.colB, ...(currentProps.colorB ?? [0.059, 0.675, 0.796]));
            gl.uniform3f(locs.colC, ...(currentProps.colorC ?? [0.890, 0.678, 0.247]));
            gl.uniform1f(locs.bgDark, currentProps.bgDarkness ?? 0.82);
            gl.uniform1f(locs.vig, currentProps.vignette ?? 0.9);
            gl.uniform1f(locs.opacity, currentProps.opacity ?? 0.9);
            gl.uniform1f(locs.motion, motionMultiplier);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            frame = requestAnimationFrame(render);
        };
        frame = requestAnimationFrame(render);

        return () => { 
            cancelAnimationFrame(frame); 
            mm.removeEventListener('change', listener);
            resizeObserver.disconnect();
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.deleteBuffer(buf);
            gl.deleteVertexArray(vao);
            gl.detachShader(program, vertexShader);
            gl.detachShader(program, fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="block h-full w-full"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
