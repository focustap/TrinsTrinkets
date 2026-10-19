import * as T from 'three';

export const GROUND = Object.freeze({
  beach: -0.08,
  cave: -0.06,
  moonpool: -0.16,
  cottage: 0.07,
});

export function sceneryRandom(seed = 7411) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function discoveryAngle(uid) {
  let n = 0;
  for (const ch of String(uid)) n = (Math.imul(n, 31) + ch.charCodeAt(0)) | 0;
  return ((n >>> 0) / 4294967296) * Math.PI * 2;
}

// The rendered support is authoritative, including stepping stones and pool beds.
export function createSurface(baseY, meshes = []) {
  const ray = new T.Raycaster(),
    down = new T.Vector3(0, -1, 0);
  return {
    baseY,
    meshes,
    heightAt(x, z, exclude = null) {
      if (!meshes.length) return baseY;
      for (const mesh of meshes) mesh.updateWorldMatrix(true, false);
      ray.set(new T.Vector3(x, 12, z), down);
      const supports = exclude
        ? meshes.filter((mesh) => {
            for (let p = mesh; p; p = p.parent) if (p === exclude) return false;
            return true;
          })
        : meshes;
      return ray.intersectObjects(supports, false)[0]?.point.y ?? baseY;
    },
  };
}

export function restOnSurface(object, surface, embed = 0.006) {
  object.updateWorldMatrix(true, true);
  const bounds = new T.Box3().setFromObject(object);
  if (bounds.isEmpty()) return object;
  const position = object.getWorldPosition(new T.Vector3());
  const height =
    typeof surface === 'number'
      ? surface
      : surface.heightAt(position.x, position.z, object);
  position.y += height - embed - bounds.min.y;
  if (object.parent) object.parent.worldToLocal(position);
  object.position.copy(position);
  object.updateWorldMatrix(true, true);
  object.userData.groundContact = { height, embed };
  return object;
}

let shadowTexture;
export function softDiscTexture() {
  if (shadowTexture) return shadowTexture;
  const size = 64,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(
        ((x + 0.5) / size) * 2 - 1,
        ((y + 0.5) / size) * 2 - 1,
      );
      const at = (y * size + x) * 4;
      data[at] = data[at + 1] = data[at + 2] = 255;
      data[at + 3] = Math.round(
        255 * Math.exp(-r * r * 5) * Math.max(0, 1 - r * r),
      );
    }
  shadowTexture = new T.DataTexture(data, size, size);
  shadowTexture.needsUpdate = true;
  return shadowTexture;
}

export function addContactShadow(parent, object, surface, opacity = 0.19) {
  const bounds = new T.Box3().setFromObject(object),
    size = bounds.getSize(new T.Vector3());
  const center = bounds.getCenter(new T.Vector3());
  const height =
    typeof surface === 'number'
      ? surface
      : surface.heightAt(center.x, center.z);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1, 1),
    new T.MeshBasicMaterial({
      color: '#504e46',
      map: softDiscTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  shadow.name = 'contact-shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(
    Math.max(0.17, size.x * 1.45),
    Math.max(0.15, size.z * 1.45),
    1,
  );
  shadow.position.set(center.x, height + 0.0015, center.z);
  if (parent.parent) parent.worldToLocal(shadow.position);
  parent.add(shadow);
  return shadow;
}

export function disposeContactShadow(shadow) {
  shadow?.removeFromParent();
  shadow?.geometry.dispose();
  shadow?.material.dispose();
}
