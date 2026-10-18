/* Charts + interactive solver. Data in the static charts is copied from the paper's tables. */
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const nice = r => { const e = Math.pow(10, Math.floor(Math.log10(r))), f = r / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; };
const fmt = v => (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01)) ? v.toExponential(0).replace('e-', '×10⁻').replace('e+', '×10') : +v.toPrecision(3) + '';

function chart(svg, o) {
  svg.innerHTML = '';
  const W = 640, H = o.h || 340, M = { l: 58, r: 18, t: 38, b: 46 };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); const fs = o.fs || 14; svg.style.setProperty('--fs', fs + 'px');
  const all = o.series.flatMap(s => s.pts), lg = v => Math.log10(v);
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]).concat(o.hline ? [o.hline.y] : []);
  let x0 = o.xmin ?? (o.xlog ? Math.min(...xs) : 0), x1 = o.xmax ?? Math.max(...xs);
  let y0 = o.ymin ?? (o.ylog ? Math.min(...ys) : 0), y1 = o.ymax ?? Math.max(...ys);
  const ticks = (a, b, log) => {
    if (log) { const r = []; for (let e = Math.floor(lg(a)); e <= Math.ceil(lg(b)); e++) r.push(Math.pow(10, e)); return r; }
    const s = nice((b - a) / 5), r = []; for (let v = Math.ceil(a / s) * s; v <= b + 1e-9; v += s) r.push(+v.toFixed(10)); return r;
  };
  const tx = ticks(x0, x1, o.xlog), ty = ticks(y0, y1, o.ylog);
  if (o.xlog) { x0 = tx[0]; x1 = tx[tx.length - 1]; } else if (o.xmax == null) x1 = Math.max(x1, tx[tx.length - 1]);
  if (o.ylog) { y0 = ty[0]; y1 = ty[ty.length - 1]; } else if (o.ymax == null) y1 = Math.max(y1, ty[ty.length - 1]);
  const X = v => M.l + ((o.xlog ? lg(v) - lg(x0) : v - x0) / ((o.xlog ? lg(x1) - lg(x0) : x1 - x0))) * (W - M.l - M.r);
  const Y = v => H - M.b - ((o.ylog ? lg(v) - lg(y0) : v - y0) / ((o.ylog ? lg(y1) - lg(y0) : y1 - y0))) * (H - M.t - M.b);
  const g = el('g', { class: 'grid' }, svg);
  tx.forEach(v => { if (v < x0 - 1e-9 || v > x1 + 1e-9) return; el('line', { x1: X(v), x2: X(v), y1: M.t, y2: H - M.b }, g); el('text', { x: X(v), y: H - M.b + 18, 'text-anchor': 'middle' }, g).textContent = fmt(v); });
  ty.forEach(v => { if (v < y0 - 1e-9 || v > y1 + 1e-9) return; el('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }, g); el('text', { x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }, g).textContent = fmt(v); });
  el('text', { x: (M.l + W - M.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'ax' }, svg).textContent = o.xlab;
  const yl = el('text', { transform: `translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 'ax' }, svg); yl.textContent = o.ylab;
  if (o.band) el('rect', { x: X(o.band[0]), y: M.t, width: X(o.band[1]) - X(o.band[0]), height: H - M.t - M.b, class: 'band' }, svg);
  if (o.hline) { el('line', { x1: M.l, x2: W - M.r, y1: Y(o.hline.y), y2: Y(o.hline.y), class: 'ref' }, svg); el('text', { x: W - M.r - 4, y: Y(o.hline.y) - 6, 'text-anchor': 'end', class: 'reflab' }, svg).textContent = o.hline.label; }
  let lx = M.l;
  o.series.forEach((s, i) => {
    const d = s.pts.map((p, j) => (j ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    const p = el('path', { d, class: 'ln c' + (s.c ?? i) + (s.dash ? ' dash' : '') }, svg);
    if (o.draw) { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.3,.6,.2,1)'; requestAnimationFrame(() => p.style.strokeDashoffset = 0); p.addEventListener('transitionend', () => p.style.strokeDasharray = s.dash ? '6 5' : 'none', { once: true }); }
    if (o.dots) s.pts.forEach(q => el('circle', { cx: X(q[0]), cy: Y(q[1]), r: 3.4, class: 'dot c' + (s.c ?? i) }, svg));
    el('line', { x1: lx, x2: lx + 20, y1: 16, y2: 16, class: 'ln c' + (s.c ?? i) + (s.dash ? ' dash' : '') }, svg);
    const t = el('text', { x: lx + 26, y: 20, class: 'lg' }, svg); t.textContent = s.name; lx += 40 + s.name.length * fs * 0.56;
  });
}

const D = {
  conv: { h: [0.05, 0.02, 0.01, 0.005, 0.001], rx: [3.1e-3, 4.2e-4, 1.5e-4, 1.0e-5, 1.4e-6], ry: [4.2e-4, 5.7e-5, 2.0e-5, 1.4e-6, 1.9e-7], ex: [0.57, 0.23, 0.12, 0.058, 0.012], ey: [0.079, 0.032, 0.016, 0.0079, 0.0016] },
  scale: { L: [8.7, 14.7, 21.5, 28.8, 36.2, 43.6], H: [0.82, 1.42, 2.15, 2.97, 3.87, 4.83], y: [0.16, 0.47, 1.04, 1.92, 3.17, 4.78] },
  sweep: { S: [0, 0.05, 0.1, 0.15, 0.25, 0.35, 0.5, 0.75], long: [0, 1.6, 3.2, 4.78, 7.9, 10.5, 11.76, 11.76], l75: [0, 0.06, 0.12, 0.18, 0.29, 0.41, 0.56, 0.56], lL: [0, 0.11, 0.21, 0.32, 0.53, 0.74, 1, 1], sh: [0, 0.05, 0.1, 0.15, 0.25, 0.35, 0.48, 0.48] }
};
const zip = (a, b) => a.map((v, i) => [v, b[i]]);

function drawStatic() {
  const q = id => document.getElementById(id); if (!q('fig-conv')) return;
  const c = D.conv;
  chart(q('fig-conv'), { xlog: true, ylog: true, xlab: 'step size h (s)', ylab: 'landing error (m)', dots: true, series: [
    { name: 'Euler, x', pts: zip(c.h, c.ex), c: 1 }, { name: 'Euler, y', pts: zip(c.h, c.ey), c: 1, dash: 1 },
    { name: 'RK4, x', pts: zip(c.h, c.rx), c: 0 }, { name: 'RK4, y', pts: zip(c.h, c.ry), c: 0, dash: 1 }] });
  const s = D.scale;
  chart(q('fig-scale'), { xlab: 'range L (m)', ylab: 'metres', dots: true, ymax: 5, series: [
    { name: 'sideways y  (∝ L^2.1)', pts: zip(s.L, s.y), c: 0 }, { name: 'peak height H  (∝ L^1.1)', pts: zip(s.L, s.H), c: 2 }] });
  const w = D.sweep;
  chart(q('fig-sweep-a'), { fs: 17, xlab: 'launch spin parameter S₀', ylab: 'sideways shift y (m)', dots: true, xmax: 0.8, series: [{ name: 'long kick, 27 m/s · 30°', pts: zip(w.S, w.long), c: 0 }], band: [0.5, 0.8] });
  chart(q('fig-sweep-b'), { fs: 17, xlab: 'launch spin parameter S₀', ylab: 'sideways shift y (m)', dots: true, xmax: 0.8, ymax: 1.1, band: [0.5, 0.8], hline: { y: 0.38, label: 'clears a defender: 0.38 m' }, series: [
    { name: 'lane pass at 0.75L', pts: zip(w.S, w.l75), c: 1 }, { name: 'lane pass at landing', pts: zip(w.S, w.lL), c: 3 }, { name: 'short pass', pts: zip(w.S, w.sh), c: 2, dash: 1 }] });
}

/* interactive solver */
function runSolver(first) {
  const v = +$('v0').value, th = +$('th').value, S = +$('s0').value / 100;
  $('v0o').textContent = v + ' m/s'; $('tho').textContent = th + '°'; $('s0o').textContent = S.toFixed(2) + (S >= 0.5 ? ' (plateau)' : '');
  const a = simulate(v, th, S), b = simulate(v, th, 0, { spin: false });
  chart($('fig-side'), { xlab: 'downrange x (m)', ylab: 'height above launch (m)', xmin: 0, ymin: 0, xmax: Math.max(10, Math.ceil(Math.max(a.L, b.L) / 5) * 5), draw: first, h: 300, fs: 18, series: [
    { name: 'with spin', pts: a.pts.map(p => [p[0], p[2]]), c: 0 }, { name: 'no spin', pts: b.pts.map(p => [p[0], p[2]]), c: 4, dash: 1 }] });
  chart($('fig-top'), { xlab: 'downrange x (m)', ylab: 'sideways y (m, scale ≠ x)', xmin: 0, ymin: 0, ymax: Math.max(0.5, Math.ceil(a.Y * 1.1)), xmax: Math.max(10, Math.ceil(Math.max(a.L, b.L) / 5) * 5), draw: first, h: 300, fs: 18, series: [
    { name: 'with spin', pts: a.pts.map(p => [p[0], p[1]]), c: 1 }, { name: 'no spin (straight)', pts: b.pts.map(p => [p[0], 0]), c: 4, dash: 1 }] });
  $('r-L').textContent = a.L.toFixed(2) + ' m'; $('r-Y').textContent = a.Y.toFixed(2) + ' m'; $('r-H').textContent = a.H.toFixed(2) + ' m'; $('r-T').textContent = a.T.toFixed(2) + ' s';
  $('r-d').textContent = (2 * S / 3 * 11).toFixed(1) + ' cm';
}
const $ = id => document.getElementById(id);
function presets(k) {
  const P = { long: [27, 30, 15], short: [15, 12, 15], lane: [20, 10, 50] }[k];
  ['v0', 'th', 's0'].forEach((id, i) => $(id).value = P[i]); runSolver(true);
}

document.addEventListener('DOMContentLoaded', () => {
  drawStatic();
  if ($('v0')) {
    ['v0', 'th', 's0'].forEach(id => $(id).addEventListener('input', () => runSolver(false)));
    document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => presets(b.dataset.preset)));
    const lazy = new IntersectionObserver(es => { if (es[0].isIntersecting) { runSolver(true); lazy.disconnect(); } }, { rootMargin: '200px' });
    lazy.observe($('solver'));
  }
  /* hero: one-time path draw */
  if ($('hero-fig')) { const a = simulate(27, 30, 0.15), b = simulate(27, 30, 0, { spin: false }); chart($('hero-fig'), { xlab: 'downrange x (m)', ylab: 'sideways drift y (m, exaggerated)', draw: true, h: 300, fs: 15, xmin: 0, ymin: 0, ymax: 6, series: [{ name: 'with spin: lands 4.8 m off line', pts: a.pts.map(p => [p[0], p[1]]), c: 0 }, { name: 'textbook: straight', pts: b.pts.map(p => [p[0], 0]), c: 4, dash: 1 }] }); }
  /* table of contents highlight + progress */
  const links = [...document.querySelectorAll('.toc a')], secs = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-15% 0px -75% 0px' });
  secs.forEach(s => io.observe(s));
  const bar = $('bar'); addEventListener('scroll', () => { const h = document.documentElement; bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight)})`; }, { passive: true });
});
