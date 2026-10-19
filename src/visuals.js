import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createStudioEnvironment(renderer) {
  const generator = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const target = generator.fromScene(room, 0.04);
  room.dispose();
  generator.dispose();
  return target;
}

const textures = new Map();
export function grainTexture(kind = 'stone') {
  if (textures.has(kind)) return textures.get(kind);
  const size = 128,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const noise =
        (((Math.imul(x + 17, 73856093) ^ Math.imul(y + 23, 19349663)) >>> 0) %
          101) /
        100;
      let value = 228 + noise * 25;
      if (kind === 'wood') {
        value =
          230 + noise * 12 + Math.sin(x * 0.4 + Math.sin(y * 0.05) * 2) * 4;
        if (y % 32 < 1 || (x + (Math.floor(y / 32) % 2) * 64) % 128 < 1)
          value -= 28;
      }
      const at = (y * size + x) * 4;
      data[at] = data[at + 1] = data[at + 2] = value;
      data[at + 3] = 255;
    }
  const tex = new T.DataTexture(data, size, size);
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(kind === 'wood' ? 3 : 6, kind === 'wood' ? 3 : 8);
  tex.generateMipmaps = true;
  tex.minFilter = T.LinearMipmapLinearFilter;
  tex.magFilter = T.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textures.set(kind, tex);
  return tex;
}

export function addSky(scene, zenith, horizon) {
  const sky = new T.Mesh(
    new T.SphereGeometry(80, 24, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new T.Color(zenith) },
        horizon: { value: new T.Color(horizon) },
      },
      vertexShader:
        'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 zenith;uniform vec3 horizon;varying vec3 vSky;
      void main(){float h=pow(clamp(normalize(vSky).y,0.,1.),.7);gl_FragColor=vec4(mix(horizon,zenith,h),1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    }),
  );
  sky.name = 'atmosphere';
  sky.renderOrder = -1000;
  scene.add(sky);
  return sky;
}
