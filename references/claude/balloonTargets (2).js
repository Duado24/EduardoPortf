// balloonTargets.js
// Turns balloon.svg into morph targets for an existing three.js point cloud.
// Usage:
//   const t = await loadBalloonTargets('/balloon.svg', { count: geometry.attributes.position.count, height: 4 });
//   geometry.setAttribute('aTarget', new THREE.BufferAttribute(t.positions, 3));
//   geometry.setAttribute('aGroup',  new THREE.BufferAttribute(t.groups, 1));
//   geometry.setAttribute('aGlow',   new THREE.BufferAttribute(t.glow, 1));

export const GROUPS = {
  env: 0, gores: 1, belt: 2, patches: 3, ropes: 4,
  house: 5, scope: 6, banners: 7, moon: 8, birds: 9,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export async function loadBalloonTargets(url, opts = {}) {
  const svgText = await (await fetch(url)).text();
  return sampleBalloon(svgText, opts);
}

export function sampleBalloon(svgText, opts = {}) {
  const {
    count = 20000,
    height = 4,        // scene units for the balloon's full height
    depth = 0.1,       // each flat shape (house, banners...) sits on its own z layer within +/- depth
    bulge = 1,         // envelope depth multiplier (1 = true sphere-of-revolution)
    jitter = 0.006,    // random scatter in scene units
    mouthY = 288,      // y of the envelope mouth in the SVG (used for burner glow)
    seed = 1,
  } = opts;

  // Mount the SVG off-screen (getPointAtLength needs it in the DOM).
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
  holder.innerHTML = svgText;
  document.body.appendChild(holder);
  const svg = holder.querySelector('svg');
  const vb = svg.viewBox.baseVal;

  // Measure every shape.
  const shapes = [];
  const groupLen = {};
  const groupMeta = {};
  svg.querySelectorAll('g[data-g]').forEach((g) => {
    const name = g.dataset.g;
    groupMeta[name] = { w: parseFloat(g.dataset.w), bulge: g.dataset.bulge === '1', front: g.dataset.front === '1' };
    groupLen[name] = 0;
    g.querySelectorAll('path,circle,ellipse,rect,line,polygon,polyline').forEach((el) => {
      const len = el.getTotalLength();
      shapes.push({ el, name, len });
      groupLen[name] += len;
    });
  });

  const totalW = Object.values(groupMeta).reduce((s, m) => s + m.w, 0);

  // Envelope radius table: half-width of the outline at each y, so the envelope
  // can be rebuilt as a surface of revolution (z = sqrt(r(y)^2 - dx^2)).
  const envBox = svg.querySelector('g[data-g="env"]').getBBox();
  const ecx = envBox.x + envBox.width / 2;
  const outline = svg.querySelector('g[data-g="env"] path');
  const outLen = outline.getTotalLength();
  const radiusAt = new Float32Array(Math.ceil(vb.height / 2) + 2);
  for (let k = 0; k <= 800; k++) {
    const q = outline.getPointAtLength((k / 800) * outLen);
    const bin = Math.round(q.y / 2);
    radiusAt[bin] = Math.max(radiusAt[bin], Math.abs(q.x - ecx));
  }
  const rOf = (y) => {
    const b = Math.max(0, Math.min(radiusAt.length - 1, Math.round(y / 2)));
    // fall back to nearest neighbour if a bin was never hit
    for (let d = 0; d < 6; d++) {
      const v = Math.max(radiusAt[b - d] || 0, radiusAt[b + d] || 0);
      if (v > 0) return v;
    }
    return 0;
  };

  // Seeded RNG so the shape is identical every load.
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  const scale = height / vb.height;
  const cx = vb.x + vb.width / 2;
  const cy = vb.y + vb.height / 2;

  const positions = new Float32Array(count * 3);
  const groups = new Float32Array(count);
  const glow = new Float32Array(count);

  let i = 0;
  for (const sh of shapes) {
    const m = groupMeta[sh.name];
    let n = Math.round(count * (m.w / totalW) * (sh.len / groupLen[sh.name]));
    const layerZ = (rnd() - 0.5) * 2 * depth;   // one depth layer per flat shape
    for (let k = 0; k < n && i < count; k++, i++) {
      const p = sh.el.getPointAtLength(rnd() * sh.len);
      let z;
      if (m.bulge) {
        const r = rOf(p.y), dx = p.x - ecx;
        z = (m.front || rnd() < 0.5 ? 1 : -1) * Math.sqrt(Math.max(0, r * r - dx * dx)) * bulge * scale;
      } else {
        z = layerZ;
      }
      positions[i * 3]     = (p.x - cx) * scale + (rnd() - 0.5) * jitter;
      positions[i * 3 + 1] = -(p.y - cy) * scale + (rnd() - 0.5) * jitter;
      positions[i * 3 + 2] = z + (rnd() - 0.5) * jitter;
      groups[i] = GROUPS[sh.name];
      // Burner glow: 1 right at the mouth, fading up into the envelope.
      const d = (mouthY - p.y) / 120;
      glow[i] = (sh.name === 'env' || sh.name === 'gores') ? Math.max(0, 1 - Math.abs(d)) : 0;
    }
  }

  // Rounding left us short: top up with random envelope-line points.
  const fill = shapes.filter((x) => x.name === 'env' || x.name === 'gores');
  while (i < count) {
    const sh = fill[(rnd() * fill.length) | 0];
    const p = sh.el.getPointAtLength(rnd() * sh.len);
    const r = rOf(p.y), dx = p.x - ecx;
    positions[i * 3]     = (p.x - cx) * scale;
    positions[i * 3 + 1] = -(p.y - cy) * scale;
    positions[i * 3 + 2] = (rnd() < 0.5 ? -1 : 1) * Math.sqrt(Math.max(0, r * r - dx * dx)) * bulge * scale;
    groups[i] = GROUPS[sh.name];
    i++;
  }

  holder.remove();
  return { positions, groups, glow, count, scale };
}
