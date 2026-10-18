/* RK4 solver for the football model in the paper (Sections 5-7). Spin axis vertical, constant spin. */
function simulate(v0, thetaDeg, S0, opts) {
  opts = opts || {};
  const spin = opts.spin !== false, h = opts.h || 0.001;
  const g = 9.81, rho = 1.1515, m = 0.43, R = 0.11, A = Math.PI * R * R;
  const kD = rho * 0.25 * A / (2 * m), kL = rho * A / (2 * m);
  const th = thetaDeg * Math.PI / 180, w = S0 * v0 / R;
  const f = q => {
    const vx = q[3], vy = q[4], vz = q[5], V = Math.hypot(vx, vy, vz);
    const CL = spin ? Math.min(0.25, 0.5 * R * w / V) : 0;
    return [vx, vy, vz, -kD * V * vx - kL * CL * V * vy, -kD * V * vy + kL * CL * V * vx, -g - kD * V * vz];
  };
  const add = (a, b, s) => a.map((x, i) => x + s * b[i]);
  let q = [0, 0, R, v0 * Math.cos(th), 0, v0 * Math.sin(th)], t = 0, n = 0, zmax = R;
  const pts = [[0, 0, 0]];
  for (;;) {
    const k1 = f(q), k2 = f(add(q, k1, h / 2)), k3 = f(add(q, k2, h / 2)), k4 = f(add(q, k3, h));
    const nq = q.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    t += h; n++;
    if (nq[2] < R) {                       // landing: linear interpolation (Section 6.4)
      const a = (q[2] - R) / (q[2] - nq[2]);
      const L = q[0] + a * (nq[0] - q[0]), Y = q[1] + a * (nq[1] - q[1]);
      pts.push([L, Y, 0]);
      return { pts, L, Y, H: zmax - R, T: t - h + a * h };
    }
    q = nq; zmax = Math.max(zmax, q[2]);
    if (n % 20 === 0) pts.push([q[0], q[1], q[2] - R]);
    if (t > 30) return { pts, L: q[0], Y: q[1], H: zmax - R, T: t };
  }
}
if (typeof module !== 'undefined') module.exports = simulate;
