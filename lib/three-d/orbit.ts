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
