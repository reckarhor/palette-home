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
      ladderTitle: "Brightness — click a step to use it in the palette and room",
      setBright: "use this brightness",
      resetBright: "click again to reset",
      wallTint: "wall-ready tint",
      modeGroup: "Colour harmony",
      lightGroup: "Room light",
      upload: "Upload a photo",
      uploadHint: "A room, a rug, a painting — analysed on your device, never uploaded.",
      extracted: "Found in your photo — click a chip, then click in the photo to fine-tune that colour.",
      pickHint: "Now click anywhere in the photo to pull that colour.",
      analysing: "Analysing photo…",
      imgError: "Couldn't read that image",
      chipTitle: "click, then pick the colour from the photo",
      chipTitleNoImg: "use as base colour"
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
      `Walls in the wall-ready tint ${wallHex}, sofa in your secondary, cushions, lamp and art in your accent${multi ? "s" : ""}. Pick a brightness step under any swatch to repaint the room with it.`,
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
      },
      photo: {
        name: "From your photo", sub: "Extracted — base, supporting & pop colour",
        why: "These are the colours actually living in your photo: the base covering the biggest area, a supporting mid-tone, and the most striking pop colour. Schemes taken from an image you love almost always feel right — its maker already balanced them.",
        tip: "Fine-tune with the brightness ladders — extracted colours often want a lighter wall tint or a deeper accent before they work as paint."
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
      ladderTitle: "Helligkeit — Klick übernimmt die Stufe in Palette und Raum",
      setBright: "diese Helligkeit verwenden",
      resetBright: "erneut klicken setzt zurück",
      wallTint: "Wandton",
      modeGroup: "Farbharmonie",
      lightGroup: "Raumlicht",
      upload: "Foto hochladen",
      uploadHint: "Ein Raum, ein Teppich, ein Bild — wird auf deinem Gerät analysiert, nie hochgeladen.",
      extracted: "Im Foto gefunden — erst einen Chip anklicken, dann ins Foto klicken, um die Farbe anzupassen.",
      pickHint: "Jetzt irgendwo ins Foto klicken, um die Farbe zu übernehmen.",
      analysing: "Foto wird analysiert…",
      imgError: "Bild konnte nicht gelesen werden",
      chipTitle: "klicken, dann Farbe im Foto wählen",
      chipTitleNoImg: "als Basisfarbe verwenden"
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
      `Wände im Wandton ${wallHex}, Sofa in der Zweitfarbe, Kissen, Lampe und Kunst ${multi ? "in den Akzenten" : "im Akzent"}. Wähle unter einem Farbfeld eine Helligkeitsstufe, um den Raum damit umzustreichen.`,
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
      },
      photo: {
        name: "Aus deinem Foto", sub: "Erkannt — Basis-, Zweit- und Akzentfarbe",
        why: "Das sind die Farben, die wirklich in deinem Foto stecken: die flächige Basisfarbe, ein tragender Mittelton und die auffälligste Akzentfarbe. Schemata aus einer geliebten Vorlage wirken fast immer stimmig — die Balance stimmt schon.",
        tip: "Feinjustiere mit den Helligkeitsleitern — erkannte Farben brauchen als Wandfarbe oft einen helleren Ton oder als Akzent einen tieferen."
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
const PHOTO_MODE = { id: "photo", angles: [] };

/* Wall tint: follows the dominant's chosen lightness, clamped so the
   advice for the room's light still holds. Without a user override the
   defaults match the original recommendations. */
const DIRECTIONS = {
  dim:    { satCap: 26, defaultL: 86, floorL: 78 },
  avg:    { satCap: 32, defaultL: 80, floorL: 70 },
  bright: { satCap: 40, defaultL: 71, floorL: 55 }
};

function wallTintOf(dom, dirKey, hasOverride) {
  const d = DIRECTIONS[dirKey];
  const l = hasOverride ? clamp(dom.l, d.floorL, 92) : d.defaultL;
  return { h: dom.h, s: Math.min(dom.s, d.satCap), l };
}

/* ================================================================
   Palette construction
   ================================================================ */

function buildCores(base, mode) {
  if (mode.id === "photo" && state.photoCores) {
    return state.photoCores.map(c => ({ ...c }));
  }
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
function assignRoles(cores, mode) {
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
  return roles;
}

const LADDER_STEPS = [92, 81, 69, 57, 45, 33, 21];
function ladderSat(s, l) { return s * (l > 75 ? 0.7 : l < 30 ? 0.9 : 1); }
function ladderOf(c) {
  return LADDER_STEPS.map(l => ({ h: c.h, s: ladderSat(c.s, l), l }));
}

/* user-selected brightness per role slot */
function applyBrightness(roles) {
  roles.forEach((r, i) => {
    const l = state.bright[i];
    if (l !== undefined) {
      r.colour = { h: r.colour.h, s: ladderSat(r.colour.s, l), l };
      r.brightSet = true;
    }
  });
}

/* ================================================================
   State
   ================================================================ */

const state = {
  h: 165, s: 55, l: 42,
  mode: "split",
  dir: "avg",
  lang: "en",
  bright: {},          // role index -> selected ladder lightness
  photoCores: null,    // [{h,s,l} x3] extracted from an uploaded photo
  armedChip: null      // chip index awaiting a click in the photo
};

function L() { return I18N[state.lang]; }
function baseColour() { return { h: state.h, s: state.s, l: state.l }; }
function activeModes() { return state.photoCores ? [PHOTO_MODE, ...MODES] : MODES; }
function currentMode() { return activeModes().find(m => m.id === state.mode) || MODES[2]; }

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
const photoInput = $("photoInput"), photoResult = $("photoResult"), photoThumb = $("photoThumb"), photoChips = $("photoChips");

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

function swatchHTML(role, idx) {
  const hex = hslToHex(role.colour);
  const txt = textOn(role.colour);
  const lrv = lrvOf(role.colour);
  const temp = L().temps[warmCool(role.colour)];
  const roleTxt = L().roles[role.roleKey];
  const selL = state.bright[idx];
  const ladder = ladderOf(role.colour)
    .map(s => {
      const h = hslToHex(s);
      const sel = selL === s.l;
      const hint = sel ? L().ui.resetBright : L().ui.setBright;
      return `<button data-bl="${s.l}" data-role="${idx}" class="${sel ? "sel" : ""}" style="background:${h}" title="${h} · LRV ${lrvOf(s)} — ${hint}" aria-label="${h}" aria-pressed="${sel}"></button>`;
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
  const acc2 = roles[3] ? roles[3].colour : acc;

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

  fill("rmRug", { h: sec.h, s: sec.s * 0.35, l: clamp(sec.l + 35, 60, 88) });

  /* the big pieces wear the palette colours exactly as shown in the swatches */
  fill("rmSofaBack", sec);
  fill("rmSofaArmL", sec);
  fill("rmSofaArmR", sec);
  fill("rmSofaSeat", sec);
  fill("rmCushion1", acc);
  fill("rmCushion2", dom);
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
  fill("rmVase", acc);

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
  modeList.innerHTML = activeModes().map(m => {
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

function renderPhotoChips() {
  if (!state.photoCores) { photoResult.hidden = true; return; }
  photoResult.hidden = false;
  const hasImg = Boolean(photoCanvas && photoThumb.getAttribute("src"));
  photoThumb.style.display = hasImg ? "" : "none";
  photoThumb.classList.toggle("pickable", hasImg && state.armedChip !== null);
  $("photoHint").textContent =
    hasImg && state.armedChip !== null ? L().ui.pickHint : L().ui.extracted;
  photoChips.innerHTML = state.photoCores.map((c, i) => {
    const hex = hslToHex(c);
    const armed = state.armedChip === i;
    const title = hasImg ? L().ui.chipTitle : L().ui.chipTitleNoImg;
    return `<button data-chip="${i}" class="${armed ? "armed" : ""}" style="background:${hex}" title="${hex} — ${title}" aria-label="${hex}" aria-pressed="${armed}"></button>`;
  }).join("");
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
  let q = `?c=${hex}&m=${state.mode}&d=${state.dir}`;
  const b = Object.entries(state.bright).map(([i, l]) => `${i}-${l}`).join(".");
  if (b) q += `&b=${b}`;
  if (state.photoCores) q += `&p=${state.photoCores.map(c => hslToHex(c).slice(1)).join(",")}`;
  history.replaceState(null, "", q);
}

function renderAll() {
  const base = baseColour();
  const mode = currentMode();
  const cores = buildCores(base, mode);
  const roles = assignRoles(cores, mode);
  applyBrightness(roles);
  const wall = wallTintOf(roles[0].colour, state.dir, roles[0].brightSet);

  renderWheel(cores);
  renderModeList(base);
  renderDirection();
  renderSwatches(roles, wall);
  renderRatio(roles);
  renderRoom(roles, wall);
  renderWhy();
  renderPhotoChips();
  syncURL();
}

/* ================================================================
   Photo colour extraction (all on-device: downscale + k-means,
   then pick base / supporting / pop clusters)
   ================================================================ */

function extractPalette(imgSource) {
  const size = 120;
  const cv = document.createElement("canvas");
  const w = imgSource.width, h = imgSource.height;
  const scale = Math.min(size / w, size / h, 1);
  cv.width = Math.max(1, Math.round(w * scale));
  cv.height = Math.max(1, Math.round(h * scale));
  const cx = cv.getContext("2d", { willReadFrequently: true });
  cx.drawImage(imgSource, 0, 0, cv.width, cv.height);
  const data = cx.getImageData(0, 0, cv.width, cv.height).data;

  const px = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 200) px.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (px.length < 20) return null;

  /* k-means, k=10, farthest-point seeding: small but chromatically
     distinct regions (a green lamp in a brown room) get their own seed
     instead of being absorbed into a big neutral cluster */
  const k = Math.min(10, px.length);
  const sub = px.filter((_, i) => i % 4 === 0);
  const mean = sub.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0])
    .map(v => v / sub.length);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  let centers = [mean];
  while (centers.length < k) {
    let best = null, bestD = -1;
    for (const p of sub) {
      let m = Infinity;
      for (const c of centers) m = Math.min(m, d2(p, c));
      if (m > bestD) { bestD = m; best = p; }
    }
    centers.push([...best]);
  }
  let counts = new Array(k).fill(0);

  for (let iter = 0; iter < 12; iter++) {
    const sum = Array.from({ length: k }, () => [0, 0, 0]);
    counts = new Array(k).fill(0);
    for (const p of px) {
      let bi = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (p[0] - centers[c][0]) ** 2 + (p[1] - centers[c][1]) ** 2 + (p[2] - centers[c][2]) ** 2;
        if (d < bd) { bd = d; bi = c; }
      }
      counts[bi]++;
      sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) centers[c] = sum[c].map(v => v / counts[c]);
    }
  }

  const clusters = centers
    .map((c, i) => ({ hsl: rgbToHsl(c[0], c[1], c[2]), share: counts[i] / px.length }))
    .filter(c => c.share > 0.004)
    .sort((a, b) => b.share - a.share);
  if (!clusters.length) return null;

  const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  const colourDist = (a, b) =>
    hueDist(a.h, b.h) * (Math.min(a.s, b.s) / 100) + Math.abs(a.l - b.l) * 0.6 + Math.abs(a.s - b.s) * 0.3;

  /* base: the biggest surface in the photo */
  const base = clusters[0].hsl;

  /* pop: the most chromatic voice in the photo — saturation and hue
     contrast against the base dominate; area barely matters as long as
     the colour is really there (share^0.2, floor 0.4%) */
  let pop = null, popScore = -1;
  for (const c of clusters) {
    if (c === clusters[0]) continue;
    if (c.hsl.l < 10 || c.hsl.l > 92) continue;
    const score = Math.pow(c.hsl.s / 100, 1.3)
      * (0.3 + hueDist(c.hsl.h, base.h) / 180)
      * Math.pow(c.share, 0.2);
    if (score > popScore) { popScore = score; pop = c.hsl; }
  }
  if (!pop) pop = { h: mod360(base.h + 180), s: Math.max(base.s, 45), l: 45 };

  /* supporting: next-largest cluster distinct from both */
  let mid = null;
  for (const c of clusters.slice(1)) {
    if (colourDist(c.hsl, pop) < 18) continue;
    if (colourDist(c.hsl, base) < 14) continue;
    mid = c.hsl; break;
  }
  if (!mid) mid = { h: base.h, s: Math.min(base.s + 10, 90), l: clamp(base.l - 18, 15, 60) };

  const norm = c => ({ h: Math.round(c.h), s: Math.round(clamp(c.s, 3, 95)), l: Math.round(clamp(c.l, 6, 94)) });
  return [norm(base), norm(mid), norm(pop)];
}

/* full-res-ish copy of the last photo, used for click-to-pick sampling */
let photoCanvas = null;

function samplePhotoAt(relX, relY) {
  const cx = photoCanvas.getContext("2d");
  const x = clamp(Math.round(relX * photoCanvas.width), 2, photoCanvas.width - 3);
  const y = clamp(Math.round(relY * photoCanvas.height), 2, photoCanvas.height - 3);
  const d = cx.getImageData(x - 2, y - 2, 5, 5).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue;
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  if (!n) return null;
  const c = rgbToHsl(r / n, g / n, b / n);
  return { h: Math.round(c.h), s: Math.round(c.s), l: Math.round(c.l) };
}

function handlePhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  showToast(L().ui.analysing);
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const cores = extractPalette(img);
    if (!cores) { showToast(L().ui.imgError); URL.revokeObjectURL(url); return; }
    photoCanvas = document.createElement("canvas");
    const scale = Math.min(800 / img.width, 800 / img.height, 1);
    photoCanvas.width = Math.max(1, Math.round(img.width * scale));
    photoCanvas.height = Math.max(1, Math.round(img.height * scale));
    photoCanvas.getContext("2d", { willReadFrequently: true })
      .drawImage(img, 0, 0, photoCanvas.width, photoCanvas.height);
    photoThumb.src = url; // kept alive for the thumbnail
    state.photoCores = cores;
    state.mode = "photo";
    state.bright = {};
    state.armedChip = null;
    /* base colour follows the photo so the classic moods riff on it too */
    state.h = cores[0].h; state.s = cores[0].s; state.l = cores[0].l;
    renderAll();
  };
  img.onerror = () => { showToast(L().ui.imgError); URL.revokeObjectURL(url); };
  img.src = url;
}

/* click-to-pick: arm a chip, then pull the colour from the photo */
photoThumb.addEventListener("click", e => {
  if (!photoCanvas || state.armedChip === null || !state.photoCores) return;
  const r = photoThumb.getBoundingClientRect();
  const c = samplePhotoAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  if (!c) return;
  const i = state.armedChip;
  state.photoCores[i] = c;
  if (i === 0) { state.h = c.h; state.s = c.s; state.l = c.l; }
  delete state.bright[i];
  showToast(`${hslToHex(c)} ✓`);
  renderAll();
});

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
  state.bright = {}; // roles change meaning, drop brightness picks
  renderAll();
});

directionSeg.addEventListener("click", e => {
  const btn = e.target.closest("[data-dir]");
  if (!btn) return;
  state.dir = btn.dataset.dir;
  renderAll();
});

photoInput.addEventListener("change", () => handlePhoto(photoInput.files[0]));

/* swatch copy buttons, brightness ladders and photo chips */
document.addEventListener("click", e => {
  const copyBtn = e.target.closest("[data-copy]");
  if (copyBtn) { copyText(copyBtn.dataset.copy); return; }

  const step = e.target.closest("[data-bl]");
  if (step) {
    const idx = +step.dataset.role;
    const l = +step.dataset.bl;
    if (state.bright[idx] === l) delete state.bright[idx];
    else state.bright[idx] = l;
    renderAll();
    return;
  }

  const chip = e.target.closest("[data-chip]");
  if (chip) {
    const i = +chip.dataset.chip;
    if (photoCanvas && photoThumb.getAttribute("src")) {
      /* arm / disarm for click-to-pick */
      state.armedChip = state.armedChip === i ? null : i;
    } else if (state.photoCores) {
      /* no image available (restored from a share link): use as base */
      const c = state.photoCores[i];
      state.h = c.h; state.s = c.s; state.l = c.l;
    }
    renderAll();
  }
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

  if (q.get("p")) {
    const cores = q.get("p").split(",").map(hexToRgb);
    if (cores.length === 3 && cores.every(Boolean)) {
      state.photoCores = cores.map(rgb => {
        const c = rgbToHsl(...rgb);
        return { h: Math.round(c.h), s: Math.round(c.s), l: Math.round(c.l) };
      });
    }
  }

  const rgb = q.get("c") ? hexToRgb("#" + q.get("c").replace("#", "")) : null;
  if (rgb) {
    const hsl = rgbToHsl(...rgb);
    state.h = hsl.h; state.s = hsl.s; state.l = hsl.l;
  }
  if (q.get("m") && activeModes().some(m => m.id === q.get("m"))) state.mode = q.get("m");
  if (q.get("d") && DIRECTIONS[q.get("d")]) state.dir = q.get("d");

  if (q.get("b")) {
    q.get("b").split(".").forEach(pair => {
      const [i, l] = pair.split("-").map(Number);
      if (Number.isInteger(i) && i >= 0 && i < 4 && LADDER_STEPS.includes(l)) state.bright[i] = l;
    });
  }

  const saved = localStorage.getItem("ph-lang");
  const device = (navigator.language || "").toLowerCase().startsWith("de") ? "de" : "en";
  applyLang(saved || device);
})();
