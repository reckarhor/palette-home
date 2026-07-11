"use strict";

/* ================================================================
   Colour maths
   ================================================================ */

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function mod360(h) { return ((h % 360) + 360) % 360; }

function hslToRgb(h, s, l) {
  h = mod360(h); s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: mod360(h), s: s * 100, l: l * 100 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hslToHex(c) {
  const [r, g, b] = hslToRgb(c.h, c.s, c.l);
  return rgbToHex(r, g, b);
}

/* LRV ≈ CIE relative luminance × 100 (the scale paint brands print on chips) */
function lrvOf(c) {
  const [r, g, b] = hslToRgb(c.h, c.s, c.l).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 100);
}

function warmCool(c) {
  if (c.s < 10) return "Neutral";
  return (c.h < 90 || c.h >= 330) ? "Warm" : "Cool";
}

function textOn(c) { return lrvOf(c) > 45 ? "#1E1C19" : "#FFFFFF"; }

/* ================================================================
   Harmony modes
   ================================================================ */

const MODES = [
  {
    id: "analogous", name: "Calm & cohesive", sub: "Analogous — neighbouring hues",
    angles: [0, -30, 30],
    why: "These hues sit next to each other on the wheel, so they share undertones and blend without tension — the classic recipe for calm bedrooms and easy living rooms.",
    tip: "Vary the lightness a lot — pale walls, mid-tone furniture, deep accents — so the room reads layered rather than flat."
  },
  {
    id: "complementary", name: "Classic contrast", sub: "Complementary — direct opposites",
    angles: [0, 180],
    why: "Opposites on the wheel intensify each other. Used 60-30-10 style — mostly one colour with disciplined pops of its opposite — the room feels bold but controlled.",
    tip: "Keep the opposite colour strictly in the 10% slot: cushions, art, one chair. Half-and-half complementary rooms feel restless."
  },
  {
    id: "split", name: "Softer contrast", sub: "Split-complementary — the opposite's two neighbours",
    angles: [0, 150, 210],
    why: "Instead of the direct opposite, this borrows its two neighbours — you keep the energy of contrast but lose the harshness. The most forgiving 'interesting' scheme for a room.",
    tip: "A great starter scheme: it is very hard to get wrong. Let the two split colours trade places between the 30% and 10% slots until one feels right."
  },
  {
    id: "triadic", name: "Vibrant & balanced", sub: "Triadic — three evenly spaced hues",
    angles: [0, 120, 240],
    why: "Three hues spaced evenly around the wheel give a lively room that still feels balanced. Playrooms, kitchens and eclectic living rooms love this scheme.",
    tip: "Mute two of the three (lower saturation, lighter tints) and let one sing at full strength — three loud colours compete."
  },
  {
    id: "tetradic", name: "Rich & layered", sub: "Tetradic — two complementary pairs",
    angles: [0, 60, 180, 240],
    why: "Two complementary pairs make the richest scheme — and the hardest to balance. One colour must clearly dominate; the other three stay in supporting roles.",
    tip: "Designer's rule for tetradic rooms: pick your dominant, then use the remaining three only in textiles and objects you can easily swap."
  },
  {
    id: "mono", name: "Tone-on-tone", sub: "Monochromatic — one hue, many depths",
    angles: [0],
    why: "One hue at different depths always matches itself. Texture — linen, wood, wool, matte and gloss paint — does the work that colour contrast would normally do.",
    tip: "Push the extremes: the palest tint on walls and the deepest shade on one anchor piece stop a tone-on-tone room feeling like a paint chip."
  }
];

const DIRECTIONS = {
  dim: {
    label: "Dim / north-facing",
    note: "North light is cool and flattens colour, so the wall tint is kept pale (LRV ≈ 80+) with softened saturation to bounce light back.",
    wall: c => ({ h: c.h, s: Math.min(c.s, 26), l: 86 })
  },
  avg: {
    label: "Average light",
    note: "With balanced light you can take walls a step deeper while keeping the room feeling open.",
    wall: c => ({ h: c.h, s: Math.min(c.s, 32), l: 80 })
  },
  bright: {
    label: "Bright / south-facing",
    note: "Strong southern light washes pale colours out — richer, deeper walls hold their own here.",
    wall: c => ({ h: c.h, s: Math.min(c.s, 40), l: 71 })
  }
};

/* ================================================================
   Palette construction
   ================================================================ */

function buildCores(base, mode) {
  if (mode.id === "mono") {
    return [
      { h: base.h, s: base.s * 0.6, l: clamp(base.l + 28, 60, 88) },
      { h: base.h, s: base.s, l: base.l },
      { h: base.h, s: Math.min(base.s * 1.05, 95), l: clamp(base.l - 22, 14, 40) }
    ];
  }
  return mode.angles.map(a => ({ h: mod360(base.h + a), s: base.s, l: base.l }));
}

/* Map core colours onto decor roles (60 / 30 / 10) */
function assignRoles(cores, mode, dirKey) {
  const wall = DIRECTIONS[dirKey].wall(cores[0]);
  const roles = [];

  const push = (name, share, colour, blurb) =>
    roles.push({ name, share, colour, blurb });

  if (mode.id === "mono") {
    push("Dominant · 60%", 60, cores[0], "Walls & large pieces");
    push("Secondary · 30%", 30, cores[1], "Sofa, curtains, rug");
    push("Accent · 10%", 10, cores[2], "Cushions, art, lamps");
  } else if (cores.length === 2) {
    push("Dominant · 60%", 60, cores[0], "Walls & large pieces");
    push("Secondary · 30%", 30,
      { h: cores[0].h, s: Math.min(cores[0].s + 6, 95), l: clamp(cores[0].l - 14, 12, 60) },
      "A deeper cut of your base — sofa, curtains");
    push("Accent · 10%", 10, cores[1], "The opposite — cushions, art, lamps");
  } else if (cores.length === 3) {
    push("Dominant · 60%", 60, cores[0], "Walls & large pieces");
    push("Secondary · 30%", 30, cores[1], "Sofa, curtains, rug");
    push("Accent · 10%", 10, cores[2], "Cushions, art, lamps");
  } else {
    push("Dominant · 60%", 60, cores[0], "Walls & large pieces");
    push("Secondary · 30%", 30, cores[2], "Sofa, curtains, rug");
    push("Accent · 6%", 6, cores[1], "Cushions & throws");
    push("Second accent · 4%", 4, cores[3], "Small objects, vases, books");
  }

  return { roles, wall };
}

function ladderOf(c) {
  const steps = [92, 81, 69, 57, 45, 33, 21];
  return steps.map(l => ({ h: c.h, s: c.s * (l > 75 ? 0.7 : l < 30 ? 0.9 : 1), l }));
}

/* ================================================================
   State
   ================================================================ */

const state = {
  h: 165, s: 55, l: 42,
  mode: "split",
  dir: "avg"
};

function baseColour() { return { h: state.h, s: state.s, l: state.l }; }
function currentMode() { return MODES.find(m => m.id === state.mode); }

/* ================================================================
   DOM refs
   ================================================================ */

const $ = id => document.getElementById(id);
const wheelEl = $("wheel"), overlay = $("wheelOverlay"), centerEl = $("wheelCenter"), centerHex = $("centerHex");
const satSlider = $("satSlider"), lightSlider = $("lightSlider"), hexInput = $("hexInput");
const modeList = $("modeList"), directionSeg = $("directionSeg"), directionNote = $("directionNote");
const swatchesEl = $("swatches"), modeBlurb = $("modeBlurb");
const ratioBar = $("ratioBar"), ratioLegend = $("ratioLegend");
const whyText = $("whyText"), tipList = $("tipList"), roomCaption = $("roomCaption");
const toast = $("toast");

/* ================================================================
   Rendering
   ================================================================ */

const WHEEL_C = 140, WHEEL_R = 112;

function wheelPoint(h, r = WHEEL_R) {
  const rad = (h * Math.PI) / 180;
  return [WHEEL_C + r * Math.sin(rad), WHEEL_C - r * Math.cos(rad)];
}

function renderWheel(cores) {
  let svg = "";
  const pts = cores.map(c => wheelPoint(c.h));
  if (cores.length > 1) {
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if (pts.length === 2 && i === 1) break;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink-soft)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".6"/>`;
    }
  }
  cores.forEach((c, i) => {
    const [x, y] = pts[i];
    svg += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 13 : 8.5}" fill="${hslToHex(c)}" stroke="#fff" stroke-width="${i === 0 ? 3 : 2}" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))"/>`;
  });
  overlay.innerHTML = svg;

  const hex = hslToHex(baseColour());
  centerEl.style.background = hex;
  centerEl.style.color = textOn(baseColour());
  centerHex.textContent = hex;
  if (document.activeElement !== hexInput) hexInput.value = hex;

  satSlider.value = state.s;
  lightSlider.value = state.l;
  satSlider.style.background =
    `linear-gradient(to right, hsl(${state.h} 0% ${state.l}%), hsl(${state.h} 100% ${state.l}%))`;
  lightSlider.style.background =
    `linear-gradient(to right, #000, hsl(${state.h} ${state.s}% 50%), #fff)`;
}

function swatchHTML(role) {
  const hex = hslToHex(role.colour);
  const txt = textOn(role.colour);
  const lrv = lrvOf(role.colour);
  const temp = warmCool(role.colour);
  const ladder = ladderOf(role.colour)
    .map(s => {
      const h = hslToHex(s);
      return `<button data-copy="${h}" style="background:${h}" title="${h} · LRV ${lrvOf(s)} — click to copy" aria-label="Copy ${h}"></button>`;
    }).join("");
  return `
  <div class="swatch">
    <div class="swatch-main" style="background:${hex};color:${txt}">
      <div class="swatch-info">
        <span class="swatch-role">${role.name}</span>
        <span class="swatch-hex">${hex}</span>
        <span class="swatch-meta">${role.blurb}</span>
      </div>
      <div class="badges">
        <span class="badge">LRV ${lrv}</span>
        <span class="badge">${temp}</span>
        <button class="copy-btn" data-copy="${hex}">Copy</button>
      </div>
    </div>
    <div class="ladder" title="Tints & shades — click any step to copy">${ladder}</div>
  </div>`;
}

function renderSwatches(roles, wall) {
  const mode = currentMode();
  modeBlurb.textContent = `${mode.name} · ${mode.sub}`;
  let html = roles.map(swatchHTML).join("");
  swatchesEl.innerHTML = html;

  const wallHex = hslToHex(wall);
  const dom = swatchesEl.querySelector(".swatch-meta");
  if (dom) dom.innerHTML =
    `Walls & large pieces · wall-ready tint <strong>${wallHex}</strong> (LRV ${lrvOf(wall)})`;
}

function renderRatio(roles) {
  ratioBar.innerHTML = roles.map(r =>
    `<div style="width:${r.share}%;background:${hslToHex(r.colour)}"></div>`).join("");
  ratioLegend.innerHTML = roles.map(r =>
    `<span><i style="background:${hslToHex(r.colour)}"></i>${r.name}</span>`).join("");
}

function renderRoom(roles, wall) {
  const g = id => document.getElementById(id);
  const dom = roles[0].colour, sec = roles[1].colour, acc = roles[2].colour;
  const acc2 = roles[3] ? roles[3].colour : { h: dom.h, s: dom.s, l: clamp(dom.l - 18, 12, 55) };

  const fill = (id, c) => { const el = g(id); if (el) el.setAttribute("fill", typeof c === "string" ? c : hslToHex(c)); };

  const trim = { h: wall.h, s: 12, l: 95 };
  fill("rmWall", wall);
  fill("rmSkirting", trim);
  fill("rmFloor", "#C6A176");

  fill("rmWinFrame", trim);
  fill("rmWinPane", { h: wall.h, s: Math.min(wall.s, 20), l: 92 });
  g("rmWinBar1").setAttribute("stroke", hslToHex(trim));
  g("rmWinBar2").setAttribute("stroke", hslToHex(trim));

  fill("rmArtFrame", { h: dom.h, s: 14, l: 22 });
  fill("rmArtMat", { h: wall.h, s: 8, l: 96 });
  fill("rmArtShape1", acc);
  fill("rmArtShape2", sec);

  fill("rmRug", { h: sec.h, s: sec.s * 0.35, l: 80 });

  fill("rmSofaBack", sec);
  fill("rmSofaArmL", sec);
  fill("rmSofaArmR", sec);
  fill("rmSofaSeat", { h: sec.h, s: sec.s, l: clamp(sec.l - 9, 10, 80) });
  fill("rmCushion1", acc);
  fill("rmCushion2", { h: acc.h, s: acc.s * 0.8, l: clamp(acc.l + 22, 20, 88) });
  fill("rmCushion3", acc2);

  fill("rmTableTop", "#8A6A48");
  fill("rmTableLeg1", "#8A6A48");
  fill("rmTableLeg2", "#8A6A48");
  fill("rmLampStand", "#3B372F");
  fill("rmLampShade", acc);

  fill("rmLeaf1", "#4C7A4F");
  fill("rmLeaf2", "#5D8F57");
  fill("rmLeaf3", "#3F6B45");
  fill("rmPot", acc2);
  fill("rmVase", { h: acc.h, s: acc.s * 0.7, l: clamp(acc.l + 15, 25, 85) });

  roomCaption.textContent =
    `Walls in the wall-ready tint ${hslToHex(wall)}, sofa in your secondary, cushions, lamp and art in your accent${roles[3] ? "s" : ""}.`;
}

function renderWhy() {
  const mode = currentMode();
  const base = baseColour();
  const temp = warmCool(base);
  whyText.textContent = mode.why;

  const undertoneTip = temp === "Warm"
    ? "Your base is warm — pair it with warm-family neutrals and woods (cream, camel, oak, rust) rather than cool greys."
    : temp === "Cool"
      ? "Your base is cool — slate, charcoal, blue-greens and cool whites will feel more at home than yellowed creams."
      : "Your base is close to neutral — it will take on the temperature of whatever you put next to it, so commit to warm or cool in your accents.";

  tipList.innerHTML = [mode.tip, undertoneTip, DIRECTIONS[state.dir].note]
    .map(t => `<li>${t}</li>`).join("");
}

function renderModeList(base) {
  modeList.innerHTML = MODES.map(m => {
    const dots = buildCores(base, m).map(c =>
      `<span style="background:${hslToHex(c)}"></span>`).join("");
    return `
    <button class="mode-item" role="radio" data-mode="${m.id}" aria-checked="${m.id === state.mode}">
      <span class="mode-name">${m.name}</span>
      <span class="mode-dots">${dots}</span>
      <span class="mode-sub">${m.sub}</span>
    </button>`;
  }).join("");
}

function renderDirection() {
  directionSeg.querySelectorAll("button").forEach(b =>
    b.setAttribute("aria-checked", String(b.dataset.dir === state.dir)));
  directionNote.textContent = DIRECTIONS[state.dir].note;
}

function syncURL() {
  const hex = hslToHex(baseColour()).slice(1);
  const q = `?c=${hex}&m=${state.mode}&d=${state.dir}`;
  history.replaceState(null, "", q);
}

function renderAll() {
  const base = baseColour();
  const mode = currentMode();
  const cores = buildCores(base, mode);
  const { roles, wall } = assignRoles(cores, mode, state.dir);

  renderWheel(cores);
  renderModeList(base);
  renderDirection();
  renderSwatches(roles, wall);
  renderRatio(roles);
  renderRoom(roles, wall);
  renderWhy();
  syncURL();
}

/* ================================================================
   Interactions
   ================================================================ */

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function copyText(text, label) {
  navigator.clipboard.writeText(text)
    .then(() => showToast(label || `${text} copied`))
    .catch(() => showToast("Couldn't copy — select it manually"));
}

/* wheel dragging */
let dragging = false;
function hueFromEvent(e) {
  const r = wheelEl.getBoundingClientRect();
  const x = e.clientX - (r.left + r.width / 2);
  const y = e.clientY - (r.top + r.height / 2);
  return mod360((Math.atan2(x, -y) * 180) / Math.PI);
}
wheelEl.addEventListener("pointerdown", e => {
  dragging = true;
  try { wheelEl.setPointerCapture(e.pointerId); } catch (_) { /* synthetic pointers have no capture */ }
  state.h = hueFromEvent(e);
  renderAll();
});
wheelEl.addEventListener("pointermove", e => {
  if (!dragging) return;
  state.h = hueFromEvent(e);
  renderAll();
});
wheelEl.addEventListener("pointerup", () => { dragging = false; });

satSlider.addEventListener("input", () => { state.s = +satSlider.value; renderAll(); });
lightSlider.addEventListener("input", () => { state.l = +lightSlider.value; renderAll(); });

hexInput.addEventListener("change", () => {
  const rgb = hexToRgb(hexInput.value);
  if (!rgb) { showToast("Not a valid hex colour"); hexInput.value = hslToHex(baseColour()); return; }
  const hsl = rgbToHsl(...rgb);
  state.h = hsl.h; state.s = hsl.s; state.l = hsl.l;
  renderAll();
});

$("randomBtn").addEventListener("click", () => {
  state.h = Math.floor(Math.random() * 360);
  state.s = 45 + Math.floor(Math.random() * 40);
  state.l = 38 + Math.floor(Math.random() * 27);
  renderAll();
});

modeList.addEventListener("click", e => {
  const btn = e.target.closest("[data-mode]");
  if (!btn) return;
  state.mode = btn.dataset.mode;
  renderAll();
});

directionSeg.addEventListener("click", e => {
  const btn = e.target.closest("[data-dir]");
  if (!btn) return;
  state.dir = btn.dataset.dir;
  renderAll();
});

/* copy buttons (swatches + ladders) */
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-copy]");
  if (btn) copyText(btn.dataset.copy);
});

$("shareBtn").addEventListener("click", () => {
  copyText(location.href, "Palette link copied");
});

/* theme */
const themeToggle = $("themeToggle");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem("ph-theme", t);
}
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
applyTheme(localStorage.getItem("ph-theme") ||
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

/* ================================================================
   Init from URL
   ================================================================ */

(function init() {
  const q = new URLSearchParams(location.search);
  const rgb = q.get("c") ? hexToRgb("#" + q.get("c").replace("#", "")) : null;
  if (rgb) {
    const hsl = rgbToHsl(...rgb);
    state.h = hsl.h; state.s = hsl.s; state.l = hsl.l;
  }
  if (q.get("m") && MODES.some(m => m.id === q.get("m"))) state.mode = q.get("m");
  if (q.get("d") && DIRECTIONS[q.get("d")]) state.dir = q.get("d");
  renderAll();
})();
