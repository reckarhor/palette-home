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

/* returns a key into I18N[lang].temps */
function warmCool(c) {
  if (c.s < 10) return "neutral";
  return (c.h < 90 || c.h >= 330) ? "warm" : "cool";
}

function textOn(c) { return lrvOf(c) > 45 ? "#1E1C19" : "#FFFFFF"; }

/* ================================================================
   Translations
   ================================================================ */

const I18N = {
  en: {
    ui: {
      docTitle: "Palette Home — colour schemes for real rooms",
      metaDesc: "Pick a colour, choose a mood, and get a decor-ready palette with wall, furniture and accent roles assigned.",
      tagline: "Colour schemes for real rooms",
      share: "Share palette",
      shareTitle: "Copy a shareable link to this palette",
      themeTitle: "Toggle light / dark mode",
      step1: "1 · Pick your colour",
      step2: "2 · Pick a mood",
      step3: "3 · Your room's light",
      saturation: "Saturation",
      lightness: "Lightness",
      surprise: "Surprise me",
      randomTitle: "Try a random starting colour",
      paletteTitle: "Your palette",
      ratioTitle: "The 60-30-10 balance",
      ratioHint: "Interior designers split a room roughly 60% dominant (walls, big pieces), 30% secondary (sofa, curtains), 10% accent (cushions, art, lamps).",
      roomTitle: "In a room",
      whyTitle: "Why these colours work",
      footer: "All colour maths runs in your browser — nothing is uploaded or tracked. LRV = Light Reflectance Value (0 dark – 100 light).",
      dirDim: "Dim / north-facing",
      dirAvg: "Average light",
      dirBright: "Bright / south-facing",
      copy: "Copy",
      copied: "copied",
      linkCopied: "Palette link copied",
      badHex: "Not a valid hex colour",
      copyFail: "Couldn't copy — select it manually",
      ladderTitle: "Tints & shades — click any step to copy",
      clickToCopy: "click to copy",
      wallTint: "wall-ready tint",
      modeGroup: "Colour harmony",
      lightGroup: "Room light"
    },
    temps: { warm: "Warm", cool: "Cool", neutral: "Neutral" },
    roles: {
      dominant:   { name: "Dominant · 60%",      blurb: "Walls & large pieces" },
      secondary:  { name: "Secondary · 30%",     blurb: "Sofa, curtains, rug" },
      secondaryDeep: { name: "Secondary · 30%",  blurb: "A deeper cut of your base — sofa, curtains" },
      accent:     { name: "Accent · 10%",        blurb: "Cushions, art, lamps" },
      accentComp: { name: "Accent · 10%",        blurb: "The opposite — cushions, art, lamps" },
      accent6:    { name: "Accent · 6%",         blurb: "Cushions & throws" },
      accent4:    { name: "Second accent · 4%",  blurb: "Small objects, vases, books" }
    },
    undertone: {
      warm: "Your base is warm — pair it with warm-family neutrals and woods (cream, camel, oak, rust) rather than cool greys.",
      cool: "Your base is cool — slate, charcoal, blue-greens and cool whites will feel more at home than yellowed creams.",
      neutral: "Your base is close to neutral — it will take on the temperature of whatever you put next to it, so commit to warm or cool in your accents."
    },
    roomCaption: (wallHex, multi) =>
      `Walls in the wall-ready tint ${wallHex}, sofa in your secondary, cushions, lamp and art in your accent${multi ? "s" : ""}.`,
    modes: {
      analogous: {
        name: "Calm & cohesive", sub: "Analogous — neighbouring hues",
        why: "These hues sit next to each other on the wheel, so they share undertones and blend without tension — the classic recipe for calm bedrooms and easy living rooms.",
        tip: "Vary the lightness a lot — pale walls, mid-tone furniture, deep accents — so the room reads layered rather than flat."
      },
      complementary: {
        name: "Classic contrast", sub: "Complementary — direct opposites",
        why: "Opposites on the wheel intensify each other. Used 60-30-10 style — mostly one colour with disciplined pops of its opposite — the room feels bold but controlled.",
        tip: "Keep the opposite colour strictly in the 10% slot: cushions, art, one chair. Half-and-half complementary rooms feel restless."
      },
      split: {
        name: "Softer contrast", sub: "Split-complementary — the opposite's two neighbours",
        why: "Instead of the direct opposite, this borrows its two neighbours — you keep the energy of contrast but lose the harshness. The most forgiving 'interesting' scheme for a room.",
        tip: "A great starter scheme: it is very hard to get wrong. Let the two split colours trade places between the 30% and 10% slots until one feels right."
      },
      triadic: {
        name: "Vibrant & balanced", sub: "Triadic — three evenly spaced hues",
        why: "Three hues spaced evenly around the wheel give a lively room that still feels balanced. Playrooms, kitchens and eclectic living rooms love this scheme.",
        tip: "Mute two of the three (lower saturation, lighter tints) and let one sing at full strength — three loud colours compete."
      },
      tetradic: {
        name: "Rich & layered", sub: "Tetradic — two complementary pairs",
        why: "Two complementary pairs make the richest scheme — and the hardest to balance. One colour must clearly dominate; the other three stay in supporting roles.",
        tip: "Designer's rule for tetradic rooms: pick your dominant, then use the remaining three only in textiles and objects you can easily swap."
      },
      mono: {
        name: "Tone-on-tone", sub: "Monochromatic — one hue, many depths",
        why: "One hue at different depths always matches itself. Texture — linen, wood, wool, matte and gloss paint — does the work that colour contrast would normally do.",
        tip: "Push the extremes: the palest tint on walls and the deepest shade on one anchor piece stop a tone-on-tone room feeling like a paint chip."
      }
    },
    dirs: {
      dim: "North light is cool and flattens colour, so the wall tint is kept pale (LRV ≈ 80+) with softened saturation to bounce light back.",
      avg: "With balanced light you can take walls a step deeper while keeping the room feeling open.",
      bright: "Strong southern light washes pale colours out — richer, deeper walls hold their own here."
    }
  },

  de: {
    ui: {
      docTitle: "Palette Home — Farbkonzepte für echte Räume",
      metaDesc: "Farbe wählen, Stimmung festlegen — und eine einrichtungsfertige Palette mit Rollen für Wand, Möbel und Akzente erhalten.",
      tagline: "Farbkonzepte für echte Räume",
      share: "Palette teilen",
      shareTitle: "Link zu dieser Palette kopieren",
      themeTitle: "Hellen / dunklen Modus umschalten",
      step1: "1 · Farbe wählen",
      step2: "2 · Stimmung wählen",
      step3: "3 · Licht im Raum",
      saturation: "Sättigung",
      lightness: "Helligkeit",
      surprise: "Überrasch mich",
      randomTitle: "Zufällige Ausgangsfarbe ausprobieren",
      paletteTitle: "Deine Palette",
      ratioTitle: "Die 60-30-10-Balance",
      ratioHint: "Einrichtungsprofis teilen einen Raum grob in 60 % Hauptfarbe (Wände, große Möbel), 30 % Zweitfarbe (Sofa, Vorhänge) und 10 % Akzentfarbe (Kissen, Kunst, Lampen).",
      roomTitle: "Im Raum",
      whyTitle: "Warum diese Farben funktionieren",
      footer: "Alle Farbberechnungen laufen in deinem Browser — nichts wird hochgeladen oder getrackt. LRV = Lichtreflexionsgrad (0 dunkel – 100 hell).",
      dirDim: "Dunkel / Nordseite",
      dirAvg: "Mittleres Licht",
      dirBright: "Hell / Südseite",
      copy: "Kopieren",
      copied: "kopiert",
      linkCopied: "Palettenlink kopiert",
      badHex: "Kein gültiger Hex-Farbwert",
      copyFail: "Kopieren fehlgeschlagen — bitte manuell markieren",
      ladderTitle: "Auf- und Abtönungen — Klick kopiert den Farbwert",
      clickToCopy: "Klick kopiert",
      wallTint: "Wandton",
      modeGroup: "Farbharmonie",
      lightGroup: "Raumlicht"
    },
    temps: { warm: "Warm", cool: "Kühl", neutral: "Neutral" },
    roles: {
      dominant:   { name: "Hauptfarbe · 60 %",   blurb: "Wände & große Möbel" },
      secondary:  { name: "Zweitfarbe · 30 %",   blurb: "Sofa, Vorhänge, Teppich" },
      secondaryDeep: { name: "Zweitfarbe · 30 %", blurb: "Ein tieferer Ton deiner Basis — Sofa, Vorhänge" },
      accent:     { name: "Akzent · 10 %",       blurb: "Kissen, Kunst, Lampen" },
      accentComp: { name: "Akzent · 10 %",       blurb: "Das Gegenstück — Kissen, Kunst, Lampen" },
      accent6:    { name: "Akzent · 6 %",        blurb: "Kissen & Decken" },
      accent4:    { name: "Zweiter Akzent · 4 %", blurb: "Kleine Objekte, Vasen, Bücher" }
    },
    undertone: {
      warm: "Deine Basisfarbe ist warm — kombiniere sie mit warmen Neutraltönen und Hölzern (Creme, Camel, Eiche, Rost) statt mit kühlen Grautönen.",
      cool: "Deine Basisfarbe ist kühl — Schiefer, Anthrazit, Blaugrün und kühle Weißtöne passen besser als gelbliche Cremetöne.",
      neutral: "Deine Basisfarbe ist fast neutral — sie nimmt die Temperatur ihrer Umgebung an; entscheide dich bei den Akzenten klar für warm oder kühl."
    },
    roomCaption: (wallHex, multi) =>
      `Wände im Wandton ${wallHex}, Sofa in der Zweitfarbe, Kissen, Lampe und Kunst ${multi ? "in den Akzenten" : "im Akzent"}.`,
    modes: {
      analogous: {
        name: "Ruhig & harmonisch", sub: "Analog — benachbarte Farbtöne",
        why: "Diese Töne liegen auf dem Farbkreis nebeneinander, teilen sich Untertöne und fügen sich spannungsfrei zusammen — das klassische Rezept für ruhige Schlaf- und Wohnzimmer.",
        tip: "Variiere die Helligkeit deutlich — helle Wände, mittlere Möbel, dunkle Akzente —, damit der Raum vielschichtig statt flach wirkt."
      },
      complementary: {
        name: "Klassischer Kontrast", sub: "Komplementär — direkte Gegensätze",
        why: "Gegenüberliegende Farben verstärken einander. Nach der 60-30-10-Regel eingesetzt — überwiegend eine Farbe mit gezielten Tupfern ihres Gegenstücks — wirkt der Raum mutig, aber kontrolliert.",
        tip: "Halte die Gegenfarbe strikt im 10-%-Slot: Kissen, Kunst, ein Sessel. Halb und halb wirkt schnell unruhig."
      },
      split: {
        name: "Sanfter Kontrast", sub: "Split-Komplementär — die beiden Nachbarn des Gegentons",
        why: "Statt des direkten Gegentons kommen dessen zwei Nachbarn zum Zug — die Energie des Kontrasts bleibt, die Härte verschwindet. Das gutmütigste „interessante“ Schema für einen Raum.",
        tip: "Ideal für den Einstieg — kaum falsch zu machen. Lass die beiden Split-Farben zwischen 30-%- und 10-%-Slot tauschen, bis es sich richtig anfühlt."
      },
      triadic: {
        name: "Lebendig & ausgewogen", sub: "Triadisch — drei gleichmäßig verteilte Töne",
        why: "Drei gleichmäßig über den Farbkreis verteilte Töne ergeben einen lebendigen und trotzdem ausgewogenen Raum. Spielzimmer, Küchen und eklektische Wohnzimmer lieben dieses Schema.",
        tip: "Dämpfe zwei der drei Farben (weniger Sättigung, hellere Töne) und lass eine in voller Stärke singen — drei laute Farben konkurrieren."
      },
      tetradic: {
        name: "Üppig & vielschichtig", sub: "Tetradisch — zwei Komplementärpaare",
        why: "Zwei Komplementärpaare ergeben das reichste Schema — und das am schwersten auszubalancierende. Eine Farbe muss klar dominieren; die anderen drei bleiben in Nebenrollen.",
        tip: "Profi-Regel für tetradische Räume: Hauptfarbe festlegen und die übrigen drei nur in Textilien und leicht austauschbaren Objekten einsetzen."
      },
      mono: {
        name: "Ton in Ton", sub: "Monochromatisch — ein Farbton, viele Tiefen",
        why: "Ein Farbton in verschiedenen Tiefen passt immer zu sich selbst. Textur — Leinen, Holz, Wolle, matte und glänzende Farbe — übernimmt die Arbeit, die sonst der Farbkontrast leistet.",
        tip: "Geh an die Extreme: der blasseste Ton an die Wände, der tiefste auf ein Ankermöbel — so wirkt Ton in Ton nicht wie eine Farbkarte."
      }
    },
    dirs: {
      dim: "Nordlicht ist kühl und lässt Farben flach wirken — der Wandton bleibt daher hell (LRV ≈ 80+) mit reduzierter Sättigung, um Licht zurückzuwerfen.",
      avg: "Bei ausgewogenem Licht dürfen die Wände eine Stufe tiefer werden, ohne dass der Raum eng wirkt.",
      bright: "Starkes Südlicht bleicht blasse Farben aus — sattere, tiefere Wandtöne behaupten sich hier."
    }
  }
};

/* ================================================================
   Harmony modes & room light
   ================================================================ */

const MODES = [
  { id: "analogous",     angles: [0, -30, 30] },
  { id: "complementary", angles: [0, 180] },
  { id: "split",         angles: [0, 150, 210] },
  { id: "triadic",       angles: [0, 120, 240] },
  { id: "tetradic",      angles: [0, 60, 180, 240] },
  { id: "mono",          angles: [0] }
];

const DIRECTIONS = {
  dim:    { wall: c => ({ h: c.h, s: Math.min(c.s, 26), l: 86 }) },
  avg:    { wall: c => ({ h: c.h, s: Math.min(c.s, 32), l: 80 }) },
  bright: { wall: c => ({ h: c.h, s: Math.min(c.s, 40), l: 71 }) }
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
  const push = (roleKey, share, colour) => roles.push({ roleKey, share, colour });

  if (mode.id === "mono") {
    push("dominant", 60, cores[0]);
    push("secondary", 30, cores[1]);
    push("accent", 10, cores[2]);
  } else if (cores.length === 2) {
    push("dominant", 60, cores[0]);
    push("secondaryDeep", 30,
      { h: cores[0].h, s: Math.min(cores[0].s + 6, 95), l: clamp(cores[0].l - 14, 12, 60) });
    push("accentComp", 10, cores[1]);
  } else if (cores.length === 3) {
    push("dominant", 60, cores[0]);
    push("secondary", 30, cores[1]);
    push("accent", 10, cores[2]);
  } else {
    push("dominant", 60, cores[0]);
    push("secondary", 30, cores[2]);
    push("accent6", 6, cores[1]);
    push("accent4", 4, cores[3]);
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
  dir: "avg",
  lang: "en"
};

function L() { return I18N[state.lang]; }
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
const toast = $("toast"), langSwitch = $("langSwitch");

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
  const temp = L().temps[warmCool(role.colour)];
  const roleTxt = L().roles[role.roleKey];
  const ladder = ladderOf(role.colour)
    .map(s => {
      const h = hslToHex(s);
      return `<button data-copy="${h}" style="background:${h}" title="${h} · LRV ${lrvOf(s)} — ${L().ui.clickToCopy}" aria-label="${h}"></button>`;
    }).join("");
  return `
  <div class="swatch">
    <div class="swatch-main" style="background:${hex};color:${txt}">
      <div class="swatch-info">
        <span class="swatch-role">${roleTxt.name}</span>
        <span class="swatch-hex">${hex}</span>
        <span class="swatch-meta">${roleTxt.blurb}</span>
      </div>
      <div class="badges">
        <span class="badge">LRV ${lrv}</span>
        <span class="badge">${temp}</span>
        <button class="copy-btn" data-copy="${hex}">${L().ui.copy}</button>
      </div>
    </div>
    <div class="ladder" title="${L().ui.ladderTitle}">${ladder}</div>
  </div>`;
}

function renderSwatches(roles, wall) {
  const m = L().modes[state.mode];
  modeBlurb.textContent = `${m.name} · ${m.sub}`;
  swatchesEl.innerHTML = roles.map(swatchHTML).join("");

  const wallHex = hslToHex(wall);
  const dom = swatchesEl.querySelector(".swatch-meta");
  if (dom) dom.innerHTML =
    `${L().roles.dominant.blurb} · ${L().ui.wallTint} <strong>${wallHex}</strong> (LRV ${lrvOf(wall)})`;
}

function renderRatio(roles) {
  ratioBar.innerHTML = roles.map(r =>
    `<div style="width:${r.share}%;background:${hslToHex(r.colour)}"></div>`).join("");
  ratioLegend.innerHTML = roles.map(r =>
    `<span><i style="background:${hslToHex(r.colour)}"></i>${L().roles[r.roleKey].name}</span>`).join("");
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

  roomCaption.textContent = L().roomCaption(hslToHex(wall), Boolean(roles[3]));
}

function renderWhy() {
  const m = L().modes[state.mode];
  whyText.textContent = m.why;
  const temp = warmCool(baseColour());
  tipList.innerHTML = [m.tip, L().undertone[temp], L().dirs[state.dir]]
    .map(t => `<li>${t}</li>`).join("");
}

function renderModeList(base) {
  modeList.innerHTML = MODES.map(m => {
    const txt = L().modes[m.id];
    const dots = buildCores(base, m).map(c =>
      `<span style="background:${hslToHex(c)}"></span>`).join("");
    return `
    <button class="mode-item" role="radio" data-mode="${m.id}" aria-checked="${m.id === state.mode}">
      <span class="mode-name">${txt.name}</span>
      <span class="mode-dots">${dots}</span>
      <span class="mode-sub">${txt.sub}</span>
    </button>`;
  }).join("");
}

function renderDirection() {
  directionSeg.querySelectorAll("button").forEach(b =>
    b.setAttribute("aria-checked", String(b.dataset.dir === state.dir)));
  directionNote.textContent = L().dirs[state.dir];
}

/* Static text carrying data-i18n / data-i18n-title attributes */
function applyStatic() {
  document.documentElement.lang = state.lang;
  document.title = L().ui.docTitle;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", L().ui.metaDesc);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const s = L().ui[el.dataset.i18n];
    if (s) el.textContent = s;
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const s = L().ui[el.dataset.i18nTitle];
    if (s) el.title = s;
  });
  modeList.setAttribute("aria-label", L().ui.modeGroup);
  directionSeg.setAttribute("aria-label", L().ui.lightGroup);
  langSwitch.querySelectorAll("button").forEach(b =>
    b.setAttribute("aria-checked", String(b.dataset.lang === state.lang)));
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
    .then(() => showToast(label || `${text} ${L().ui.copied}`))
    .catch(() => showToast(L().ui.copyFail));
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
  if (!rgb) { showToast(L().ui.badHex); hexInput.value = hslToHex(baseColour()); return; }
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
  copyText(location.href, L().ui.linkCopied);
});

/* language */
function applyLang(lang) {
  state.lang = I18N[lang] ? lang : "en";
  localStorage.setItem("ph-lang", state.lang);
  applyStatic();
  renderAll();
}
langSwitch.addEventListener("click", e => {
  const btn = e.target.closest("[data-lang]");
  if (btn) applyLang(btn.dataset.lang);
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
   Init from URL + device language
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

  const saved = localStorage.getItem("ph-lang");
  const device = (navigator.language || "").toLowerCase().startsWith("de") ? "de" : "en";
  applyLang(saved || device);
})();
