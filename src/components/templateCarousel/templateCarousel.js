// templateCarousel.js
// Interactive carousel of live template previews. Vanilla JS, no dependencies.
//
//   import { createTemplateCarousel } from './templateCarousel.js';
//   import { TEMPLATES } from './templates.data.js';
//   const tc = createTemplateCarousel(document.getElementById('templates'), { templates: TEMPLATES });
//   tc.go(3);  tc.next();  tc.prev();  tc.expand();  tc.copy();  tc.destroy();
// Options: { templates, start, height, label, copy: true }   (copy:false hides the Copy HTML buttons)
//
// Each template renders inside a sandboxed iframe (white "Canvas page" look), so site CSS never
// leaks into it and tabs / collapsibles stay clickable. Colors come from the CSS variables below.

const VW = 860; // virtual width the previews are laid out at before scaling down

const CSS = `
.tc{--tc-card:#181112;--tc-line:#5b3b3d;--tc-line-soft:#3a2a2c;--tc-text:#f4ece6;--tc-muted:#a79a94;--tc-accent:#e0705f;--tc-h:340px;
  --tc-mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;color:var(--tc-text);min-width:0}
.tc *{box-sizing:border-box}
:where(.tc) button{font:inherit;color:inherit;cursor:pointer}
.tc-filters{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.tc-chip{font-family:var(--tc-mono);font-size:11.5px;letter-spacing:.02em;padding:5px 10px;border:1px solid var(--tc-line-soft);border-radius:999px;background:transparent;color:var(--tc-muted)}
.tc-chip:hover{color:var(--tc-text);border-color:var(--tc-line)}
.tc-chip[aria-pressed="true"]{color:var(--tc-text);border-color:var(--tc-accent);background:rgba(224,112,95,.12)}
.tc-region{outline:none}
.tc-region:focus-visible .tc-frame{box-shadow:0 0 0 2px var(--tc-accent)}
.tc-frame{position:relative;border:1px solid var(--tc-line);border-radius:12px;background:var(--tc-card);overflow:hidden}
.tc-viewport{height:var(--tc-h);overflow:hidden}
.tc-track{display:flex;height:100%;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.tc-slide{flex:0 0 100%;min-width:0;height:100%;padding:14px;position:relative}
.tc-paper{position:relative;width:100%;height:100%;overflow:hidden;border-radius:8px;background:#fff}
.tc-paper iframe{position:absolute;left:0;top:0;border:0;background:#fff;transform-origin:0 0}
.tc-expand{position:absolute;right:26px;bottom:26px;z-index:2;display:inline-flex;gap:10px;align-items:center;padding:9px 14px;border:1px solid #8b7b77;border-radius:6px;background:#0c0708;color:var(--tc-text);font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.tc-expand:hover{border-color:var(--tc-text)}
.tc-bar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:14px 0 0}
.tc-line{font-family:var(--tc-mono);font-size:13px;color:var(--tc-text)}
.tc-line b{font-weight:700}.tc-line span{color:var(--tc-muted)}
.tc-desc{margin:6px 0 0;font-size:14px;line-height:1.5;color:var(--tc-muted);max-width:52ch}
.tc-hint{margin:6px 0 0;font-family:var(--tc-mono);font-size:12px;color:var(--tc-accent)}
.tc-hint:empty{display:none}
.tc-arrows{display:flex;align-items:center;gap:8px;flex:none}
.tc-copy{padding:8px 13px;border:1px solid var(--tc-line);border-radius:999px;background:transparent;font-family:var(--tc-mono);font-size:12px;color:var(--tc-text);white-space:nowrap}
.tc-copy:hover{border-color:var(--tc-text);background:rgba(255,255,255,.05)}
.tc-copy[data-state="done"]{border-color:var(--tc-accent);color:var(--tc-accent)}
.tc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.tc-arrow{width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--tc-line);border-radius:50%;background:transparent;font-size:17px;line-height:1}
.tc-arrow:hover{border-color:var(--tc-text);background:rgba(255,255,255,.05)}
.tc-thumbs{position:relative;display:flex;gap:10px;margin:14px 0 0;padding:4px 2px 12px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:var(--tc-line) transparent}
.tc-thumb{position:relative;flex:0 0 132px;height:84px;padding:0;border:1px solid var(--tc-line-soft);border-radius:8px;overflow:hidden;background:#fff;scroll-snap-align:center;opacity:.6;transition:opacity .2s,border-color .2s,transform .2s}
.tc-thumb:hover{opacity:1}
.tc-thumb[aria-current="true"]{opacity:1;border-color:var(--tc-accent);box-shadow:0 0 0 1px var(--tc-accent)}
.tc-thumb-paper{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.tc-thumb-paper iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0;pointer-events:none}
.tc-thumb-n{position:absolute;left:6px;bottom:5px;padding:1px 6px;border-radius:4px;background:rgba(12,7,8,.82);color:var(--tc-text);font-family:var(--tc-mono);font-size:10px}
.tc button:focus-visible{outline:2px solid var(--tc-accent);outline-offset:2px}
.tc-modal{padding:0;border:1px solid var(--tc-line);border-radius:14px;background:#140d0e;color:var(--tc-text);width:min(1040px,94vw);height:min(88vh,880px);overflow:hidden}
.tc-modal[open]{display:flex;flex-direction:column}
.tc-modal::backdrop{background:rgba(8,4,5,.74);backdrop-filter:blur(3px)}
.tc-m-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--tc-line-soft)}
.tc-m-title{font-family:var(--tc-mono);font-size:13px;min-width:0}
.tc-m-title b{display:block;font-size:15px;font-family:inherit}
.tc-m-title span{color:var(--tc-muted)}
.tc-m-tools{display:flex;align-items:center;gap:8px;flex:none}
.tc-seg{display:flex;border:1px solid var(--tc-line);border-radius:999px;overflow:hidden}
.tc-seg button{padding:7px 12px;border:0;background:transparent;font-size:13px;color:var(--tc-muted)}
.tc-seg button[aria-pressed="true"]{background:rgba(224,112,95,.18);color:var(--tc-text)}
.tc-m-body{flex:1;min-height:0;padding:14px;background:var(--tc-card)}
.tc-m-paper{height:100%;margin:0 auto;max-width:100%;overflow:hidden;border-radius:8px;background:#fff;transition:max-width .3s}
.tc-m-paper[data-w="mobile"]{max-width:390px}
.tc-m-paper iframe{display:block;width:100%;height:100%;border:0}
@media (max-width:640px){.tc-expand{right:20px;bottom:20px}.tc-modal{width:100vw;height:100vh;border-radius:0}.tc-seg{display:none}}
@media (prefers-reduced-motion:reduce){.tc-track,.tc-thumb,.tc-m-paper{transition:none}}
`;

const FRAME_SCRIPT = `(function(){
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a)e.preventDefault()});
document.querySelectorAll('.tabs').forEach(function(box){
 var links=box.querySelectorAll('.tab-link'),panels=box.querySelectorAll('.tab-content');
 function show(id){panels.forEach(function(p){p.style.display=p.id===id?'':'none'});
  links.forEach(function(l){var on=l.getAttribute('href')==='#'+id;l.setAttribute('aria-selected',on?'true':'false');l.style.filter=on?'brightness(1.4)':''})}
 links.forEach(function(l){l.setAttribute('role','tab');l.addEventListener('click',function(e){e.preventDefault();show(l.getAttribute('href').slice(1))})});
 if(links[0])show(links[0].getAttribute('href').slice(1));
});
})();`;

const BASE_CSS = 'html{scrollbar-width:thin}body{margin:0;padding:24px 28px 32px;background:#fff;color:#1f2933;font:16px/1.5 Lato,"Helvetica Neue",Arial,sans-serif}img,svg{max-width:100%}h2{font-size:1.5em}h3{font-size:1.17em}h4{font-size:1em}';

function frameDoc(html) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' +
    BASE_CSS + '</style></head><body>' + html + '<scr' + 'ipt>' + FRAME_SCRIPT + '</scr' + 'ipt></body></html>';
}

function injectCss() {
  if (document.getElementById('tc-css')) return;
  const s = document.createElement('style');
  s.id = 'tc-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const pad = (n) => String(n).padStart(2, '0');

export function createTemplateCarousel(root, opts = {}) {
  const all = opts.templates || [];
  if (!root || !all.length) return null;
  const label = opts.label || 'Ensign Canvas templates';
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  injectCss();

  root.classList.add('tc');
  if (opts.height) root.style.setProperty('--tc-h', opts.height + 'px');
  root.innerHTML =
    '<div class="tc-filters" role="group" aria-label="Filter templates by type"></div>' +
    '<div class="tc-region" role="region" aria-roledescription="carousel" tabindex="0">' +
      '<div class="tc-frame"><div class="tc-viewport"><div class="tc-track"></div></div>' +
      '<button class="tc-expand" type="button">Expand <span aria-hidden="true">\u2197</span></button></div>' +
      '<div class="tc-bar"><div><div class="tc-line" aria-live="polite"></div><p class="tc-desc"></p><p class="tc-hint"></p></div>' +
      '<div class="tc-arrows"><button class="tc-copy tc-bar-copy" type="button">Copy HTML</button><button class="tc-arrow tc-prev" type="button" aria-label="Previous template">\u2190</button>' +
      '<button class="tc-arrow tc-next" type="button" aria-label="Next template">\u2192</button></div></div>' +
    '</div>' +
    '<div class="tc-thumbs" role="group" aria-label="Choose a template"></div>' +
    '<span class="tc-sr tc-sr-main" role="status"></span>' +
    '<dialog class="tc-modal" aria-label="Template preview">' +
      '<div class="tc-m-head"><div class="tc-m-title"><b></b><span></span></div><div class="tc-m-tools">' +
      '<button class="tc-copy tc-m-copy" type="button">Copy HTML</button>' +
      '<div class="tc-seg" role="group" aria-label="Preview width"><button type="button" data-w="desktop" aria-pressed="true">Desktop</button><button type="button" data-w="mobile" aria-pressed="false">Mobile</button></div>' +
      '<button class="tc-arrow tc-m-prev" type="button" aria-label="Previous template">\u2190</button>' +
      '<button class="tc-arrow tc-m-next" type="button" aria-label="Next template">\u2192</button>' +
      '<button class="tc-arrow tc-m-close" type="button" aria-label="Close preview">\u2715</button></div></div>' +
      '<span class="tc-sr tc-sr-modal" role="status"></span><div class="tc-m-body"><div class="tc-m-paper" data-w="desktop"><iframe title="Template preview" sandbox="allow-scripts"></iframe></div></div>' +
    '</dialog>';

  const $ = (s) => root.querySelector(s);
  const filters = $('.tc-filters'), region = $('.tc-region'), viewport = $('.tc-viewport'), track = $('.tc-track');
  const line = $('.tc-line'), desc = $('.tc-desc'), hint = $('.tc-hint'), thumbs = $('.tc-thumbs');
  const dlg = $('.tc-modal'), mPaper = $('.tc-m-paper'), mFrame = mPaper.querySelector('iframe');
  region.setAttribute('aria-label', label);

  let list = all.slice(), idx = Math.max(0, Math.min(opts.start || 0, all.length - 1)), cat = 'All', thumbsSeen = false;
  const cache = new Map();

  function mkFrame(t, thumb) {
    const f = document.createElement('iframe');
    f.title = thumb ? '' : t.title + ' template preview';
    f.setAttribute('sandbox', 'allow-scripts');
    if (thumb) { f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; }
    f.srcdoc = frameDoc(t.html);
    return f;
  }
  function fit(paper, frame) {
    const w = paper.clientWidth, h = paper.clientHeight;
    if (!w) return;
    const s = w / VW;
    frame.style.width = VW + 'px';
    frame.style.height = Math.ceil(h / s) + 'px';
    frame.style.transform = 'scale(' + s + ')';
  }

  function entry(t) {
    if (cache.has(t.id)) return cache.get(t.id);
    const slide = document.createElement('div');
    slide.className = 'tc-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    const paper = document.createElement('div');
    paper.className = 'tc-paper';
    slide.appendChild(paper);
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'tc-thumb';
    thumb.setAttribute('aria-label', t.title);
    const tp = document.createElement('span');
    tp.className = 'tc-thumb-paper';
    const tn = document.createElement('span');
    tn.className = 'tc-thumb-n';
    thumb.append(tp, tn);
    const e = { t, slide, paper, thumb, tp, tn, frame: null, tframe: null };
    thumb.addEventListener('click', () => go(list.indexOf(t)));
    cache.set(t.id, e);
    return e;
  }
  function loadMain(e) {
    if (e.frame) return;
    e.frame = mkFrame(e.t, false);
    e.paper.appendChild(e.frame);
    fit(e.paper, e.frame);
  }
  function loadThumb(e) {
    if (e.tframe) return;
    e.tframe = mkFrame(e.t, true);
    e.tp.appendChild(e.tframe);
    fit(e.tp, e.tframe);
  }

  function renderChips() {
    const cats = ['All'].concat(all.map((t) => t.category).filter((c, i, a) => a.indexOf(c) === i));
    filters.replaceChildren();
    cats.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tc-chip';
      b.textContent = c;
      b.setAttribute('aria-pressed', c === cat ? 'true' : 'false');
      b.addEventListener('click', () => {
        cat = c;
        list = c === 'All' ? all.slice() : all.filter((t) => t.category === c);
        filters.querySelectorAll('.tc-chip').forEach((x) => x.setAttribute('aria-pressed', x.textContent === c ? 'true' : 'false'));
        rebuild();
        go(0);
      });
      filters.appendChild(b);
    });
  }

  function rebuild() {
    const es = list.map(entry);
    track.replaceChildren(...es.map((e) => e.slide));
    thumbs.replaceChildren(...es.map((e) => e.thumb));
    es.forEach((e, k) => { e.tn.textContent = pad(k + 1); });
    es.forEach((e) => { if (e.frame) fit(e.paper, e.frame); });
    if (thumbsSeen) es.forEach((e) => { loadThumb(e); });
  }

  function go(i, immediate) {
    const n = list.length;
    idx = ((i % n) + n) % n;
    if (immediate || reduced()) track.style.transition = 'none';
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    if (immediate) { void track.offsetWidth; track.style.transition = ''; }
    list.forEach((t, k) => {
      const e = entry(t);
      e.slide.setAttribute('aria-label', (k + 1) + ' of ' + n);
      e.slide.inert = k !== idx;
      e.thumb.setAttribute('aria-current', k === idx ? 'true' : 'false');
    });
    [idx, idx + 1, idx - 1].forEach((k) => loadMain(entry(list[((k % n) + n) % n])));
    const t = list[idx], e = entry(t);
    line.innerHTML = '<b></b> <span></span>';
    line.firstChild.textContent = pad(idx + 1) + ' / ' + pad(n) + ' \u00b7 ' + t.title;
    line.lastChild.textContent = '\u00b7 ' + t.category + ' \u00b7 sample content';
    desc.textContent = t.desc || '';
    hint.textContent = t.hint || '';
    const left = e.thumb.offsetLeft - (thumbs.clientWidth - e.thumb.offsetWidth) / 2;
    thumbs.scrollTo({ left: Math.max(0, left), behavior: immediate || reduced() ? 'auto' : 'smooth' });
    if (dlg.open) renderModal();
    if (opts.onChange) opts.onChange(t, idx);
  }

  function renderModal() {
    const t = list[idx];
    dlg.querySelector('.tc-m-title b').textContent = t.title;
    dlg.querySelector('.tc-m-title span').textContent = pad(idx + 1) + ' / ' + pad(list.length) + ' \u00b7 ' + t.category + ' \u00b7 sample content';
    mFrame.title = t.title + ' full preview';
    mFrame.srcdoc = frameDoc(t.html);
  }
function expand() {
  if (dlg.showModal) {
    dlg.showModal();
  } else {
    dlg.setAttribute('open', '');
  }

  requestAnimationFrame(() => {
    mFrame.srcdoc = '';
    requestAnimationFrame(() => {
      renderModal();
    });
  });
}

  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall back */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (dlg.open ? dlg : document.body).appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  let copyTimer = 0;
  async function copy() {
    const ok = await copyText(list[idx].html);
    const msg = ok ? 'Copied \u2713' : 'Copy failed';
    root.querySelectorAll('.tc-copy').forEach((b) => { b.textContent = msg; b.dataset.state = ok ? 'done' : 'error'; });
    root.querySelectorAll('.tc-sr').forEach((r) => { r.textContent = ok ? list[idx].title + ' HTML copied to clipboard' : 'Could not copy the HTML'; });
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      root.querySelectorAll('.tc-copy').forEach((b) => { b.textContent = 'Copy HTML'; delete b.dataset.state; });
      root.querySelectorAll('.tc-sr').forEach((r) => { r.textContent = ''; });
    }, 1800);
    return ok;
  }
  if (opts.copy === false) root.querySelectorAll('.tc-copy').forEach((b) => b.remove());
  root.querySelectorAll('.tc-copy').forEach((b) => b.addEventListener('click', copy));

  const next = () => go(idx + 1), prev = () => go(idx - 1);
  $('.tc-next').addEventListener('click', next);
  $('.tc-prev').addEventListener('click', prev);
  $('.tc-expand').addEventListener('click', expand);
  $('.tc-m-next').addEventListener('click', next);
  $('.tc-m-prev').addEventListener('click', prev);
  $('.tc-m-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
  dlg.querySelectorAll('.tc-seg button').forEach((b) => b.addEventListener('click', () => {
    mPaper.dataset.w = b.dataset.w;
    dlg.querySelectorAll('.tc-seg button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  }));
  region.addEventListener('keydown', (e) => {
    if (e.target !== region) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(list.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); expand(); }
  });

  const ro = new ResizeObserver(() => { cache.forEach((e) => { if (e.frame) fit(e.paper, e.frame); }); });
  ro.observe(viewport);
  const io = new IntersectionObserver((entries) => {
    if (entries.some((x) => x.isIntersecting) && !thumbsSeen) {
      thumbsSeen = true;
      list.forEach((t) => loadThumb(entry(t)));
      io.disconnect();
    }
  }, { rootMargin: '200px' });
  io.observe(thumbs);

  renderChips();
  rebuild();
  go(idx, true);

  return {
    go, next, prev, expand, copy,
    get index() { return idx; },
    destroy() { clearTimeout(copyTimer); ro.disconnect(); io.disconnect(); if (dlg.open) dlg.close(); root.replaceChildren(); root.classList.remove('tc'); },
  };
}
