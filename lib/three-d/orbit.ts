import { add, cross, dot, len, norm, rotate, sub, type Camera3, type V3 } from './math';

/** Orbit around the specimen without crossing a pole and turning anatomy upside down. */
export function orbitCamera(camera: Camera3, turn: { yaw: number; pitch: number }): Camera3 {
  if (!turn.yaw && !turn.pitch) return camera;
  const up: V3 = norm(camera.up ?? [0, 1, 0]);
  let offset = sub(camera.eye, camera.target);
  const elevation = Math.asin(Math.max(-1, Math.min(1, dot(norm(offset), up))));
  const limit = Math.PI / 2 - 0.08;
  const pitch = Math.max(-limit - elevation, Math.min(limit - elevation, turn.pitch));
  offset = rotate(offset, up, turn.yaw);
  const right = norm(cross(up, offset));
  if (len(right) > 0) offset = rotate(offset, right, -pitch);
  return { ...camera, eye: add(camera.target, offset) };
}

/**
 * The turn (for `orbitCamera`) that puts the eye on `dir` as seen from the target: the camera looks at
 * the specimen from that side (as close to straight above or below as the orbit allows).
 */
export function lookTurn(camera: Camera3, dir: V3): { yaw: number; pitch: number } {
  const up: V3 = norm(camera.up ?? [0, 1, 0]);
  const off = norm(sub(camera.eye, camera.target));
  const d = norm(dir);
  const flat = (v: V3): V3 => norm(sub(v, [up[0] * dot(v, up), up[1] * dot(v, up), up[2] * dot(v, up)]));
  const h0 = flat(off);
  // Straight above or below has no side of its own: keep the camera's.
  const h1 = Math.abs(dot(d, up)) > 0.999 ? h0 : flat(d);
  const yaw = Math.atan2(dot(up, cross(h0, h1)), dot(h0, h1));
  const elev = (v: V3) => Math.asin(Math.max(-1, Math.min(1, dot(v, up))));
  return { yaw, pitch: elev(d) - elev(off) };
}
