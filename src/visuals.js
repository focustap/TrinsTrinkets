import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const motionPreference =
  typeof window === 'undefined'
    ? null
    : window.matchMedia('(prefers-reduced-motion: reduce)');
export const ambientTime = (t) => (motionPreference?.matches ? 0 : t);

export function createStudioEnvironment(renderer) {
  const generator = new T.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const target = generator.fromScene(room, 0.04);
  room.dispose();
  generator.dispose();
  return target;
}
export function createSkyEnvironment(renderer, zenith, horizon, options) {
  const scene = new T.Scene(),
    sky = addSky(scene, zenith, horizon, options),
    generator = new T.PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0.03);
  sky.geometry.dispose();
  sky.material.dispose();
  generator.dispose();
  return target;
}

const textures = new Map();
const hash = (x, y) => {
  const n = Math.imul(x + 17, 73856093) ^ Math.imul(y + 23, 19349663);
  return (
    ((Math.imul(n ^ (n >>> 13), 1274126177) ^ (n >>> 16)) >>> 0) / 4294967295
  );
};
function noise(x, y) {
  const a = Math.floor(x),
    b = Math.floor(y);
  let u = x - a,
    v = y - b;
  u = u * u * (3 - 2 * u);
  v = v * v * (3 - 2 * v);
  return T.MathUtils.lerp(
    T.MathUtils.lerp(hash(a, b), hash(a + 1, b), u),
    T.MathUtils.lerp(hash(a, b + 1), hash(a + 1, b + 1), u),
    v,
  );
}
export function fieldNoise(x, y) {
  return (
    noise(x, y) * 0.56 +
    noise(x * 2.1 + 8, y * 2.1) * 0.28 +
    noise(x * 4.3, y * 4.3 + 7) * 0.16
  );
}
export function grainTexture(kind = 'stone') {
  if (textures.has(kind)) return textures.get(kind);
  const size = 256,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const grain = hash(x, y),
        wash = fieldNoise(x / 31, y / 31);
      let value = 173 + wash * 70 + grain * 12;
      if (kind === 'wood') {
        value =
          206 +
          wash * 24 +
          grain * 5 +
          Math.sin(y * 0.8 + noise(x / 38, y / 24) * 3) * 4;
        if (y % 64 < 1) value -= 34;
        if ((x + (Math.floor(y / 64) % 2) * 128) % 256 < 1) value -= 25;
      } else if (kind === 'sand') {
        value =
          175 +
          wash * 65 +
          grain * 15 +
          Math.sin(y * 0.11 + noise(x / 33, y / 40) * 6) * 6;
      } else if (kind === 'cloth') {
        value = 195 + wash * 34 + (x % 3 ? 8 : -8) + (y % 3 ? 5 : -5);
      } else if (kind === 'plaster') {
        value = 233 + wash * 15 + grain * 5;
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

export function addSky(
  scene,
  zenith,
  horizon,
  { sun = [-0.4, 0.19, -0.9], clouds = 0.5 } = {},
) {
  const sky = new T.Mesh(
    new T.SphereGeometry(80, 24, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new T.Color(zenith) },
        horizon: { value: new T.Color(horizon) },
        sunDirection: { value: new T.Vector3(...sun).normalize() },
        cloudAmount: { value: clouds },
        time: { value: 0 },
      },
      vertexShader:
        'varying vec3 vSky; void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 zenith;uniform vec3 horizon;uniform vec3 sunDirection;uniform float cloudAmount;uniform float time;varying vec3 vSky;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float n=0.,a=.56;for(int i=0;i<4;i++){n+=noise(p)*a;p=p*2.13+3.7;a*=.48;}return n;}
      void main(){vec3 d=normalize(vSky);float h=pow(clamp(d.y,0.,1.),.7);
      vec3 col=mix(horizon,zenith,h);float glow=pow(max(0.,dot(d,sunDirection)),18.);
      col+=vec3(.55,.24,.08)*glow*cloudAmount;
      vec2 p=d.xz/(.16+max(.03,d.y)) * 1.25 +vec2(time*.002,0.);
      float n=fbm(p*2.2);float cloud=smoothstep(.44,.7,n)*smoothstep(.02,.18,d.y)*cloudAmount;
      vec3 shade=mix(vec3(.30,.31,.36),horizon*1.25+.09,smoothstep(.45,.72,n));
      col=mix(col,shade,cloud*.83);gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    }),
  );
  sky.name = 'atmosphere';
  sky.renderOrder = -1000;
  scene.add(sky);
  scene.userData.sky = sky;
  return sky;
}

export function waterNormalTexture() {
  if (textures.has('water-normal')) return textures.get('water-normal');
  const size = 128,
    data = new Uint8Array(size * size * 4);
  const wave = (x, y) =>
    Math.sin(
      ((x * Math.PI * 2) / size) * 8 +
        Math.sin(((y * Math.PI * 2) / size) * 3) * 0.9,
    ) *
      0.7 +
    Math.sin(
      ((y * Math.PI * 2) / size) * 15 +
        Math.sin(((x * Math.PI * 2) / size) * 2),
    ) *
      0.2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = new T.Vector3(
        (wave(x - 1, y) - wave(x + 1, y)) * 0.65,
        (wave(x, y - 1) - wave(x, y + 1)) * 0.65,
        1,
      ).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const tex = new T.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(9, 14);
  tex.magFilter = T.LinearFilter;
  tex.minFilter = T.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  textures.set('water-normal', tex);
  return tex;
}

export function memoryPrint(variant = 0) {
  if (typeof document === 'undefined') return null;
  const key = 'memory-' + variant;
  if (textures.has(key)) return textures.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#dcd2b7';
  ctx.fillRect(0, 0, 256, 320);
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, '#6d8390');
  sky.addColorStop(1, '#e1b48c');
  ctx.fillStyle = sky;
  ctx.fillRect(15, 15, 226, 232);
  ctx.fillStyle = '#e3c594';
  ctx.beginPath();
  ctx.arc(72 + variant * 37, 81, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6c9492';
  ctx.fillRect(15, 175, 226, 72);
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ['#708b82', '#526e68', '#324e49'][layer];
    ctx.beginPath();
    ctx.moveTo(15, 247);
    for (let x = 15; x <= 241; x += 2)
      ctx.lineTo(
        x,
        143 +
          layer * 22 +
          Math.sin(x * 0.019 + variant + layer) * 24 +
          noise(x * 0.045, layer + variant) * 12,
      );
    ctx.lineTo(241, 247);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#324e49';
  ctx.strokeStyle = '#344740';
  ctx.lineWidth = 2;
  for (let j = 0; j < 10; j++) {
    const x = 20 + j * 23,
      h = 35 + hash(j, variant) * 54,
      y = 238 - Math.sin(x * 0.02 + variant) * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h);
    ctx.stroke();
    for (let k = 1; k < 9; k++) {
      const v = k / 9,
        w = h * 0.19 * v;
      ctx.beginPath();
      ctx.moveTo(x, y - h + h * v);
      ctx.lineTo(x - w, y - h + h * v + 5);
      ctx.lineTo(x + w, y - h + h * v + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = '#655c49';
  ctx.font = '22px Caveat, Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(
    ['the way home', 'a quiet morning', 'out past the pines'][variant % 3],
    128,
    284,
  );
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  textures.set(key, tex);
  return tex;
}

// Linear scene lighting is tone mapped once, then given a restrained photographic finish.
export function createCoastalRenderer(renderer) {
  if (!renderer.extensions.has('EXT_color_buffer_float'))
    return {
      resize() {},
      render(scene, camera) {
        renderer.render(scene, camera);
      },
      dispose() {},
    };
  const target = new T.WebGLRenderTarget(1, 1, {
    type: T.HalfFloatType,
    samples: Math.min(2, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, target),
    scenePass = new RenderPass(new T.Scene(), new T.Camera());
  const finish = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      cool: { value: 0.016 },
      warm: { value: 0.014 },
      vignette: { value: 0.18 },
    },
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D tDiffuse;uniform float cool,warm,vignette;varying vec2 vUv;
    void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));
    c=mix(vec3(l),c,.94);c=(c-.5)*1.065+.5;
    c+=vec3(-cool*.6,cool*.12,cool)*(1.-smoothstep(.08,.55,l));
    c+=vec3(warm,warm*.25,-warm*.65)*smoothstep(.5,.95,l);
    vec2 p=(vUv-.5)*vec2(1.,.85);c*=1.-vignette*smoothstep(.12,.55,dot(p,p));
    float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
    c+=grain*.009;gl_FragColor=vec4(clamp(c,0.,1.),1.);}`,
  });
  composer.addPass(scenePass);
  const output = new OutputPass();
  composer.addPass(output);
  composer.addPass(finish);
  return {
    resize(w, h) {
      composer.setSize(w, h);
    },
    render(scene, camera, dt) {
      scenePass.scene = scene;
      scenePass.camera = camera;
      finish.uniforms.cool.value = scene.userData.finishCool ?? 0.016;
      finish.uniforms.warm.value = scene.userData.finishWarm ?? 0.014;
      composer.render(dt);
    },
    dispose() {
      composer.dispose();
      scenePass.dispose();
      output.dispose();
      finish.dispose();
    },
  };
}
