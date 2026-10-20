// Adapted from the original sky prototype. Catalog: d3-celestial (BSD-3-Clause).
// Spherical camera and detail drawing only: the host particle renderer owns all
// scheduling, visibility, resize, pause, reduced-motion, and destruction behavior.
// Catalog prefix particles are drawn by that host; this layer draws the remainder.

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap180 = (x) => ((x + 180) % 360 + 360) % 360 - 180;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function slerp(a, b, t) { const d = clamp(dot(a, b), -1, 1), th = Math.acos(d); if (th < 1e-5) return a.slice(); const s = Math.sin(th), w1 = Math.sin((1 - t) * th) / s, w2 = Math.sin(t * th) / s; return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2]; }
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function radec2v(ra, dec) { const c = Math.cos(dec * D2R); return [c * Math.cos(ra * D2R), c * Math.sin(ra * D2R), Math.sin(dec * D2R)]; }
const GT = [[-0.0548755604, 0.4941094279, -0.8676661490], [-0.8734370902, -0.4448296300, -0.1980763734], [-0.4838350155, 0.7469822445, 0.4559837762]];
function gal2eq(l, b) { const x = Math.cos(b * D2R) * Math.cos(l * D2R), y = Math.cos(b * D2R) * Math.sin(l * D2R), z = Math.sin(b * D2R); return [GT[0][0] * x + GT[0][1] * y + GT[0][2] * z, GT[1][0] * x + GT[1][1] * y + GT[1][2] * z, GT[2][0] * x + GT[2][1] * y + GT[2][2] * z]; }

// Stylized Yacana (Inca llama), local sky degrees around galactic l=326, b=0; baby llama upside down beneath.
const K = 0.95, LL0 = 326;
const LLAMA = [[-14, 5], [-13, 6.8], [-12, 5.6], [-9, 6.2], [-4, 6.5], [1, 6.3], [5.5, 6.6], [7.3, 7.4], [8.4, 10.5], [9, 13.2], [9.4, 15.2], [9.2, 17], [9.7, 19.6], [10.6, 17.9], [11.5, 19.9], [12.2, 17.6], [14, 16.6], [15.6, 15.4], [15.3, 14.3], [13.4, 14.2], [11.7, 13.2], [11.1, 10.2], [10.9, 6], [10.5, 1.5], [10.2, -8], [8.5, -8], [8.3, -2.2], [7.2, -2.2], [7, -8], [5.4, -8], [5.4, -2.4], [-5, -2.2], [-5, -8], [-6.6, -8], [-6.8, -2.4], [-8, -2.4], [-8.2, -8], [-9.8, -8], [-10, -2.6], [-12, 0], [-13.2, 2.8]].map((p) => [p[0] * K, p[1] * K]);
const BABY = LLAMA.map((p) => [p[0] * 0.38 + 1, -p[1] * 0.38 - 14]);
function inPoly(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function distPoly(P, x, y) { let m = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j], dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1), px = a[0] + t * dx - x, py = a[1] + t * dy - y; m = Math.min(m, Math.hypot(px, py)); } return m; }
const toVec = (P) => P.map((p) => gal2eq(LL0 - p[0], p[1]));

export function createJourneySky(cv, opts = {}) {
  const milestones = opts.milestones || [], STARS = opts.stars, CONS = opts.cons;
  const reduced = false;
  const baseCtx = cv.getContext('2d', { alpha: true });
  if (!baseCtx) throw new Error('Sky canvas unavailable');
  // Overlays (routes, constellations, labels) draw here; during the Skills descent they
  // go through an offscreen layer so they can fade as one.
  let ctx = baseCtx;
  let overlay = null;
  let lang = opts.lang || 'en';

  // ---- stars ----
  const NS = STARS.length / 4, SV = new Float32Array(NS * 3), SM = new Float32Array(NS), SC = new Uint8Array(NS), SP = new Float32Array(NS);
  { const r = mulberry(3); for (let i = 0; i < NS; i++) { const v = radec2v(STARS[i * 4], STARS[i * 4 + 1]); SV[i * 3] = v[0]; SV[i * 3 + 1] = v[1]; SV[i * 3 + 2] = v[2]; SM[i] = STARS[i * 4 + 2]; SC[i] = STARS[i * 4 + 3]; SP[i] = r() * TAU; } }

  // ---- Milky Way particles (whole sky) + llama carve-out ----
  const LLAMA_V = toVec(LLAMA), BABY_V = toVec(BABY);
  const MWL = [];
  {
    const r = mulberry(7), gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) * 1.732; };
    while (MWL.length < 36000) {
      const l = r() * 360, lc = wrap180(l), A = 0.42 + 0.58 * Math.exp(-((lc / 42) ** 2)), sb = 3.2 + 2.2 * Math.exp(-((lc / 26) ** 2));
      const b = gauss() * (r() < 0.72 ? sb : sb * 2.5); if (Math.abs(b) > 24) continue;
      const X = wrap180(LL0 - l); if (inPoly(LLAMA, X, b) || inPoly(BABY, X, b)) continue;
      const lane = 0.5 + 0.5 * Math.sin(0.33 * l + 0.55 * b + 1.7) * Math.sin(0.19 * l - 0.8 * b + 0.4);
      if (r() > 0.42 + 0.58 * lane * lane) continue;
      const v = gal2eq(l, b); MWL.push([v[0], v[1], v[2], (0.10 + 0.26 * r()) * (0.6 + 0.6 * A), r()]);
    }
    let h = 0, tries = 0;
    while (h < 2600 && tries < 300000) { tries++; const X = -26 + r() * 52, Y = -24 + r() * 46; if (inPoly(LLAMA, X, Y) || inPoly(BABY, X, Y)) continue; if (Math.min(distPoly(LLAMA, X, Y), distPoly(BABY, X, Y)) < 3.4) { const v = gal2eq(LL0 - X, Y); MWL.push([v[0], v[1], v[2], 0.18 + 0.26 * r(), r()]); h++; } }
  }
  MWL.sort((a, b) => Math.min(5, Math.floor(a[3] / 0.06)) - Math.min(5, Math.floor(b[3] / 0.06)));
  const NM = MWL.length, MV = new Float32Array(NM * 3), MS = new Float32Array(NM), MB = [0, 0, 0, 0, 0, 0, NM];
  MWL.forEach((p, i) => { MV[i * 3] = p[0]; MV[i * 3 + 1] = p[1]; MV[i * 3 + 2] = p[2]; MS[i] = p[4]; });
  { let k = 0; for (let i = 0; i < NM; i++) { const b = Math.min(5, Math.floor(MWL[i][3] / 0.06)); while (k <= b) MB[k++] = i; } while (k < 6) MB[k++] = NM; }

  // ---- constellations ----
  const conList = [];
  for (const code of Object.keys(CONS)) {
    const c = CONS[code], cen = radec2v(c.c[0], c.c[1]), verts = [], keyIdx = new Map(), polys = [];
    for (const flat of c.l) {
      const idxs = [];
      for (let i = 0; i < flat.length; i += 2) { const key = flat[i] + ',' + flat[i + 1]; let vi = keyIdx.get(key); if (vi === undefined) { vi = verts.length; verts.push(radec2v(flat[i], flat[i + 1])); keyIdx.set(key, vi); } idxs.push(vi); }
      polys.push(idxs);
    }
    let ext = 0; for (const v of verts) ext = Math.max(ext, Math.acos(clamp(dot(v, cen), -1, 1)) / D2R);
    conList.push({ code, name: c.n, es: c.es, cen, verts, polys, ext: ext * 2, px: new Float32Array(verts.length * 3) });
  }
  const conByCode = Object.fromEntries(conList.map((c) => [c.code, c]));
  const ms = milestones.map((m) => ({ ...m, con: conByCode[m.con] }));
  // route arcs between consecutive milestone constellations
  const arcs = [];
  for (let i = 0; i < ms.length - 1; i++) { const a = ms[i].con.cen, b = ms[i + 1].con.cen, pts = []; for (let k = 0; k <= 56; k++) pts.push(slerp(a, b, k / 56)); arcs.push(pts); }

  // ---- camera ----
  let W = 1, H = 1, dpr = 1, S = 1, cx = 0, cy = 0;
  const cam = { c: [1, 0, 0], fov: 40 };
  let from = { c: [1, 0, 0], fov: 40 }, to = { c: [1, 0, 0], fov: 40 }, tT = 1, dur = 2.4, pulse = 30, idx = opts.start || 0, hiFrom = idx, hiTo = idx;
  let manualReveal = false, reveal = 0, paused = true, T = 0;
  // Skills looks down from this sky: 0 is Journey's view, 1 has tilted to the horizon.
  let descent = 0, horizon = 0;
  function viewFor(i) {
    const m = ms[i];
    if (manualReveal && i === 0) return { c: norm(gal2eq(318, 2)), fov: 78 };
    return { c: m.con.cen.slice(), fov: m.fov || clamp(m.con.ext * 2.7, 26, 82) };
  }
  function aim(instant) {
    const v = viewFor(idx);
    if (instant) { cam.c = v.c; cam.fov = v.fov; from = { c: v.c.slice(), fov: v.fov }; to = v; tT = 1; hiFrom = hiTo = idx; return; }
    from = { c: cam.c.slice(), fov: cam.fov }; to = v; tT = 0;
    const ang = Math.acos(clamp(dot(from.c, to.c), -1, 1));
    dur = clamp(1.5 + ang * 1.0, 1.7, 3.4); pulse = clamp(ang / D2R * 0.55, 6, 56);
  }
  function select(i, instant) {
    const n = clamp(i, 0, ms.length - 1); if (n === idx && !instant) return;
    hiFrom = hiTo; idx = n; hiTo = n; aim(instant);
  }
  function setReveal(v, instant) { manualReveal = !!v; if (idx === 0) aim(instant); if (instant) reveal = manualReveal ? 1 : 0; }
  function setLang(l) { lang = l === 'es' ? 'es' : 'en'; }


  let side = 1;
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const mobile = window.innerWidth <= 760;
    const w = window.innerWidth, h = mobile ? 400 : window.innerHeight;
    side = Math.max(w, h) * dpr;
    cv.width = cv.height = Math.round(side);
    W = w * dpr; H = h * dpr;
    cx = (W / H > 1.2 ? .47 : .5) * W; cy = H * .5;
  }

  // ---- drawing ----
  const out = [0, 0, 0];
  let C0 = [1, 0, 0], E0 = [0, 1, 0], N0 = [0, 0, 1], SX = 0, SY = 0;
  function proj(x, y, z) { const d = x * C0[0] + y * C0[1] + z * C0[2]; out[2] = d; if (d < 0) return false; const k = 2 / (1 + d); out[0] = SX - k * (x * E0[0] + y * E0[1] + z * E0[2]) * S; out[1] = SY - k * (x * N0[0] + y * N0[1] + z * N0[2]) * S; return true; }
  const STAR_RGB = [[200, 218, 255], [246, 232, 224], [255, 204, 160]];
  const label = (txt, x, y, a, o = {}) => { ctx.globalAlpha = a; ctx.font = (o.font || ((o.size || 11.5) * dpr + 'px ui-monospace,SFMono-Regular,Consolas,monospace')); ctx.textAlign = o.align || 'center'; ctx.lineWidth = 3.2 * dpr; ctx.strokeStyle = 'rgba(10,6,7,.9)'; ctx.strokeText(txt, x, y); ctx.fillStyle = o.color || '#f4ece6'; ctx.fillText(txt, x, y); ctx.globalAlpha = 1; };
  const nameOf = (c) => (lang === 'es' ? c.es : c.name).toUpperCase();

  function render(dt) {
    if (!paused) T += dt;
    // camera flight
    if (tT < 1) { tT = Math.min(1, tT + dt / dur); const e = ease(tT); cam.c = norm(slerp(from.c, to.c, e)); cam.fov = from.fov + (to.fov - from.fov) * e + pulse * Math.sin(Math.PI * e); }
    else if (reduced) { cam.c = to.c; cam.fov = to.fov; }
    const eNow = tT < 1 ? ease(tT) : 1;
    reveal += (((manualReveal && idx === 0) ? 1 : 0) - reveal) * (reduced ? 1 : 1 - Math.exp(-dt * 2.4));

    C0 = cam.c; E0 = norm(cross([0, 0, 1], C0)); if (Math.hypot(E0[0], E0[1], E0[2]) < 0.5) E0 = [1, 0, 0]; N0 = cross(C0, E0);
    S = (H / 2) / (2 * Math.tan(cam.fov * D2R / 4));
    const wob = paused || reduced ? 0 : 1; SX = cx + Math.sin(T * 0.2) * 5 * dpr * wob; SY = cy + Math.cos(T * 0.17) * 3.5 * dpr * wob - descent * 0.42 * H;
    const zf = clamp(Math.sqrt(44 / cam.fov), 0.8, 1.55);

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, side, side);
    ctx.translate((side - W) / 2, (side - H) / 2);

    // Milky Way particles (pre-sorted into 6 alpha buckets; no per-frame allocations)
    const msz = 1.25 * dpr * zf;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      for (let i = MB[k], e = k < 5 ? MB[k + 1] : NM; i < e; i++) { if (!proj(MV[i * 3], MV[i * 3 + 1], MV[i * 3 + 2])) continue; const x = out[0], y = out[1]; if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue; const sz = msz * (0.7 + MS[i] * 0.7); ctx.rect(x, y, sz, sz); }
      ctx.fillStyle = 'rgba(238,214,206,' + (0.07 * (k + 1) + 0.04).toFixed(3) + ')'; ctx.fill();
    }

    // stars
    const sp = []; for (let c = 0; c < 3; c++) { sp.push([]); for (let k = 0; k < 5; k++) sp[c].push(new Path2D()); }
    const halo = new Path2D();
    for (let i = Math.min(opts.count, NS); i < NS; i++) {
      if (!proj(SV[i * 3], SV[i * 3 + 1], SV[i * 3 + 2])) continue; const x = out[0], y = out[1]; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
      const m = SM[i], r = Math.max(0.6, 2.2 - m * 0.32) * dpr * zf; let a = clamp(1.22 - m * 0.15, 0.35, 1); if (!paused && !reduced) a *= 0.88 + 0.12 * Math.sin(T * 1.7 + SP[i]);
      const b = Math.min(4, Math.floor(a * 5)); sp[SC[i]][b].moveTo(x + r, y); sp[SC[i]][b].arc(x, y, r, 0, TAU);
      if (m < 2.4) { halo.moveTo(x + r * 3.4, y); halo.arc(x, y, r * 3.4, 0, TAU); }
    }
    ctx.fillStyle = 'rgba(255,226,214,.08)'; ctx.fill(halo);
    for (let c = 0; c < 3; c++) for (let k = 0; k < 5; k++) { const rgb = STAR_RGB[c]; ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.25 + 0.17 * k).toFixed(2) + ')'; ctx.fill(sp[c][k]); }

    const overlayAlpha = 1 - descent;
    if (overlayAlpha > 0.01) {
      const layered = overlayAlpha < 0.99;
      if (layered) {
        overlay ??= document.createElement('canvas');
        if (overlay.width !== cv.width || overlay.height !== cv.height) { overlay.width = cv.width; overlay.height = cv.height; }
        ctx = overlay.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.translate((side - W) / 2, (side - H) / 2);
      }
      drawOverlays(eNow, zf);
      if (layered) {
        ctx = baseCtx;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = overlayAlpha; ctx.drawImage(overlay, 0, 0); ctx.restore();
      }
    }

    // Below the horizon the ground takes over; the edge rises with the descent.
    if (descent > 0.001) {
      const ground = H + 60 * dpr + (H / 2 + horizon * dpr - H - 60 * dpr) * descent, fade = 90 * dpr;
      const gradient = ctx.createLinearGradient(0, ground - fade, 0, ground);
      gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gradient; ctx.fillRect(-W, ground - fade, W * 3, fade);
      ctx.fillStyle = '#000'; ctx.fillRect(-W, ground, W * 3, side);
      ctx.restore();
    }
  }

  function drawOverlays(eNow, zf) {
    // route arcs between your constellations (accent dots): traveled = brighter
    ctx.lineCap = 'round';
    arcs.forEach((pts, i) => {
      const done = i < idx; ctx.beginPath(); let pen = false;
      for (const p of pts) { if (proj(p[0], p[1], p[2])) { pen ? ctx.lineTo(out[0], out[1]) : ctx.moveTo(out[0], out[1]); pen = true; } else pen = false; }
      ctx.setLineDash([1.2 * dpr, 6 * dpr]); ctx.lineWidth = 1.8 * dpr; ctx.strokeStyle = '#e8806e'; ctx.globalAlpha = done ? 0.55 : 0.22; ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
    });

    // constellation lines: all faint, milestone ones glow
    const fa = new Path2D(), hiList = [];
    for (let ci = 0; ci < conList.length; ci++) {
      const c = conList[ci], v = c.verts, px = c.px; let any = false;
      for (let i = 0; i < v.length; i++) { const ok = proj(v[i][0], v[i][1], v[i][2]); px[i * 3] = out[0]; px[i * 3 + 1] = out[1]; px[i * 3 + 2] = ok ? 1 : 0; if (ok) any = true; }
      if (!any) continue;
      for (const poly of c.polys) { let pen = false; for (const vi of poly) { if (px[vi * 3 + 2]) { pen ? fa.lineTo(px[vi * 3], px[vi * 3 + 1]) : fa.moveTo(px[vi * 3], px[vi * 3 + 1]); pen = true; } else pen = false; } }
    }
    ctx.setLineDash([1.2 * dpr, 4.4 * dpr]); ctx.lineWidth = 1.5 * dpr; ctx.strokeStyle = 'rgba(236,222,216,.26)'; ctx.stroke(fa);
    const hiOf = (i) => (i === hiTo && i === hiFrom) ? 1 : (i === hiTo ? eNow : (i === hiFrom ? 1 - eNow : 0));
    ms.forEach((m, i) => {
      const h = hiOf(i); if (h < 0.02) return; const c = m.con, px = c.px;
      const seg = new Path2D(); for (const poly of c.polys) { let pen = false; for (const vi of poly) { if (px[vi * 3 + 2]) { pen ? seg.lineTo(px[vi * 3], px[vi * 3 + 1]) : seg.moveTo(px[vi * 3], px[vi * 3 + 1]); pen = true; } else pen = false; } }
      ctx.setLineDash([]); ctx.lineWidth = 7 * dpr; ctx.strokeStyle = 'rgba(255,160,140,' + (0.07 * h).toFixed(3) + ')'; ctx.stroke(seg);
      ctx.setLineDash([1.3 * dpr, 3.4 * dpr]); ctx.lineWidth = 2.1 * dpr; ctx.strokeStyle = 'rgba(255,236,228,' + (0.95 * h).toFixed(3) + ')'; ctx.stroke(seg);
      const dots = new Path2D(), rings = new Path2D(), rd = 2.4 * dpr * zf;
      for (let k = 0; k < c.verts.length; k++) if (px[k * 3 + 2]) { dots.moveTo(px[k * 3] + rd, px[k * 3 + 1]); dots.arc(px[k * 3], px[k * 3 + 1], rd, 0, TAU); rings.moveTo(px[k * 3] + rd * 2.6, px[k * 3 + 1]); rings.arc(px[k * 3], px[k * 3 + 1], rd * 2.6, 0, TAU); }
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,246,240,' + (0.95 * h).toFixed(3) + ')'; ctx.fill(dots);
      ctx.setLineDash([1 * dpr, 3 * dpr]); ctx.lineWidth = 1.1 * dpr; ctx.strokeStyle = 'rgba(255,190,170,' + (0.5 * h).toFixed(3) + ')'; ctx.stroke(rings); ctx.setLineDash([]);
      hiList.push([i, h]);
    });
    ctx.setLineDash([]);

    // Inca dark constellations (optional)
    if (reveal > 0.01) {
      const poly = (V, a, lw) => { ctx.beginPath(); let ok = true; V.forEach((v, i) => { if (!proj(v[0], v[1], v[2])) ok = false; i ? ctx.lineTo(out[0], out[1]) : ctx.moveTo(out[0], out[1]); }); ctx.closePath(); ctx.setLineDash([1.4 * dpr, 5 * dpr]); ctx.lineWidth = lw * dpr; ctx.strokeStyle = '#f08a78'; ctx.globalAlpha = a; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; return ok; };
      poly(LLAMA_V, 0.95 * reveal, 1.8); poly(BABY_V, 0.8 * reveal, 1.5);
      if (proj(LLAMA_V[17][0], LLAMA_V[17][1], LLAMA_V[17][2])) label('Yacana \u00b7 the Llama', out[0] + 14 * dpr, out[1] - 10 * dpr, 0.95 * reveal, { align: 'left' });
      if (proj(BABY_V[10][0], BABY_V[10][1], BABY_V[10][2])) label('U\u00f1allamacha \u00b7 the baby llama', out[0] + 12 * dpr, out[1] + 18 * dpr, 0.85 * reveal, { align: 'left' });
    }

    // labels
    ms.forEach((m, i) => {
      const c = m.con; if (!proj(c.cen[0], c.cen[1], c.cen[2]) || out[2] < 0.15) return;
      const h = hiOf(i), cxp = out[0], cyp = out[1], extPx = c.ext * D2R * S * 0.5 * (2 / (1 + out[2]));
      const num = '0' + (i + 1) + ' \u00b7 ' + nameOf(c);
      if (h > 0.02) {
        let y = cyp + extPx + 30 * dpr; if (y + 28 * dpr > H * 0.80) y = Math.max(H * 0.13, cyp - extPx - 40 * dpr);
        label(num, cxp, y, h, { size: 12.5, color: '#f6b8a8' });
        label(((m.nick && m.nick[lang]) || ''), cxp, y + 22 * dpr, h, { font: (16 * dpr) + 'px system-ui,-apple-system,Segoe UI,Roboto,sans-serif' });
      }
      if (h < 0.98) label(num, cxp, Math.min(cyp + extPx + 24 * dpr, H * 0.78), 0.5 * (1 - h), { size: 11 });
    });
  }

  layout(); aim(true); render(0);
  return {
    resize() { layout(); render(0); },
    update(dt) { render(dt); },
    setView(view, instant) {
      setLang(view.lang); select(view.index, instant);
      if (manualReveal !== view.reveal) setReveal(view.reveal, instant);
      if (instant) { aim(true); reveal = manualReveal && idx === 0 ? 1 : 0; }
      render(0);
    },
    get moving() { return tT < 1 || Math.abs(reveal - (manualReveal && idx === 0 ? 1 : 0)) > .005; },
    project(positions, style, sizes) {
      for (let i = 0; i < positions.length / 3; i++) {
        const j = i % NS;
        const visible = proj(SV[j * 3], SV[j * 3 + 1], SV[j * 3 + 2]);
        positions[i * 3] = visible ? clamp((out[0] - W / 2) / side * 2.4, -4, 4) : 4;
        positions[i * 3 + 1] = visible ? clamp((H / 2 - out[1]) / side * 2.4, -4, 4) : 4;
        positions[i * 3 + 2] = 0;
        style[i * 2] = visible && i < NS ? clamp(1.22 - SM[j] * .15, .35, 1) : 0;
        style[i * 2 + 1] = 0;
        if (sizes) sizes[i] = Math.max(.6, 2.2 - SM[j] * .32) * clamp(Math.sqrt(44 / cam.fov), .8, 1.55);
      }
    },
    present(opacity) { cv.style.opacity = String(opacity); },
    /** 0 = Journey's view; 1 = tilted down to the Skills horizon (overlays faded). */
    setDescent(value) { const next = clamp(value, 0, 1); if (next !== descent) { descent = next; render(0); } },
    /** Horizon line for the descent, in CSS px below the sky band's center; drawn on the next redraw. */
    setHorizon(px) { horizon = px; },
    destroy() { ctx.clearRect(0, 0, cv.width, cv.height); },
  };
}
