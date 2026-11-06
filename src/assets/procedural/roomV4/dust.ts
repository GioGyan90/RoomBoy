import * as THREE from "three";
import { rand, randRange } from "./utils";

export function createRoomDust() {
  const count = 144;
  const positions: number[] = [];
  const sizes: number[] = [];
  const brightness: number[] = [];
  const amplitude: number[] = [];
  const frequency: number[] = [];
  const phase: number[] = [];
  for (let i = 0; i < count; i++) {
    if (rand() < .82) {
      // Concentrate motes around the window-to-floor path of the daylight.
      const distance = 4.9 * rand() ** 1.28;
      const spread = .64 + distance * .22;
      positions.push(
        -1.02 - distance * .36 + (rand() - rand()) * spread,
        3.8 - distance * .49 + (rand() - rand()) * spread * .76,
        -5.66 + distance,
      );
    } else {
      positions.push(randRange(-4.3, .65), randRange(.48, 4.65), randRange(-5.35, -.68));
    }
    sizes.push(.022 + .137 * rand() ** 2.7);
    brightness.push(randRange(.25, .92));
    for (let axis = 0; axis < 3; axis++) {
      amplitude.push(randRange(.037, axis === 1 ? .28 : .42) * (rand() < .5 ? -1 : 1));
      frequency.push(randRange(.22, 1.62));
      phase.push(randRange(0, Math.PI * 2));
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("moteSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("moteBrightness", new THREE.Float32BufferAttribute(brightness, 1));
  geometry.setAttribute("moteAmplitude", new THREE.Float32BufferAttribute(amplitude, 3));
  geometry.setAttribute("moteFrequency", new THREE.Float32BufferAttribute(frequency, 3));
  geometry.setAttribute("motePhase", new THREE.Float32BufferAttribute(phase, 3));

  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: .75 },
    uViewportHeight: { value: 1 },
    uColor: { value: new THREE.Color(0xffe8b9) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uViewportHeight;
      attribute float moteSize;
      attribute float moteBrightness;
      attribute vec3 moteAmplitude;
      attribute vec3 moteFrequency;
      attribute vec3 motePhase;
      varying float vBrightness;

      void main() {
        vec3 drift = sin(moteFrequency * uTime + motePhase)
          + 0.21 * cos(moteFrequency.yzx * uTime * 0.59 + motePhase.zxy);
        vec4 view = modelViewMatrix * vec4(position + moteAmplitude * drift, 1.0);
        gl_Position = projectionMatrix * view;
        float roomScale = length(modelViewMatrix[0].xyz);
        float pulse = sin(uTime * moteFrequency.y + motePhase.z);
        gl_PointSize = clamp(moteSize * (1.0 + 0.12 * pulse) * roomScale
          * 0.5 * uViewportHeight * projectionMatrix[1][1] / -view.z, 0.75, 18.0);
        vBrightness = moteBrightness * (0.78 + 0.22 * pulse);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying float vBrightness;

      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float halo = 1.0 - smoothstep(0.04, 1.0, radius);
        float core = 1.0 - smoothstep(0.02, 0.40, radius);
        gl_FragColor = vec4(uColor, (0.52 * halo * halo + 0.48 * core) * vBrightness * uIntensity);
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "window-light-dust";
  points.frustumCulled = false;
  const viewport = new THREE.Vector2();
  points.onBeforeRender = renderer => {
    uniforms.uViewportHeight.value = renderer.getDrawingBufferSize(viewport).y;
  };

  return {
    points,
    update(time: number, intensity: number) {
      uniforms.uTime.value = time;
      uniforms.uIntensity.value = intensity;
    },
  };
}
