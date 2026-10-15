/** Shared data for Level 4 (scene, quiz and mini-game). */

export const LB_PUBLIC_IP = '88.88.88.1';
export const PRIVATE_IPS = ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5'];

/* ---------------------------- Traffic Cop game ---------------------------- */
export const COP = {
  servers: 3,
  /** Max in-flight requests a server can hold before it starts dropping. */
  capacity: 4,
  /** In-flight requests each healthy server finishes per second. */
  drainPerSec: 0.75,
  /** Seconds between new requests. */
  spawnEvery: 0.85,
  /** Seconds a request can wait before it times out (falls off the screen). */
  patience: 2.6,
  /** Total requests in a round. */
  total: 44,
  /** Scripted outages: [server, down at, back at] (seconds). */
  outages: [
    [0, 9, 19],
    [2, 22, 31],
    [1, 33, 40],
  ] as [number, number, number][],
};
