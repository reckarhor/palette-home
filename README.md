# Palette Home

A colour wheel website for home decorating. Pick a colour, pick a mood
(complementary, split-complementary, analogous, triadic, tetradic, or
monochromatic), and get a decor-ready palette with roles already assigned
the way interior designers work:

- **60-30-10 rule** — every palette is split into dominant (walls),
  secondary (sofa/curtains) and accent (cushions/art/lamps) roles, shown
  as a proportional bar and a live-recoloured room illustration.
- **Wall-ready tints** — the dominant colour is automatically softened
  into a paintable wall shade, adjusted for how bright the room is
  (dim/north-facing, average, bright/south-facing).
- **LRV badges** — every swatch shows its Light Reflectance Value
  (the 0–100 scale printed on paint chips) plus a warm/cool undertone badge.
- **Brightness ladders** — 7 lightness steps under every swatch; click a
  step to use that brightness for the role, and the swatch, 60-30-10 bar
  and room illustration repaint with the exact chosen colour (click again
  to reset). The room's big pieces always wear the palette colours
  exactly as shown.
- **Photo palettes** — upload a photo of a room, rug or artwork and the
  app extracts the base colour (largest surface), a supporting mid-tone
  and the pop/contrast colour, entirely on-device (nothing is uploaded).
  Extraction uses k-means with farthest-point seeding so small but
  chromatically distinct accents (a green lamp in a brown room) are
  found, with pop scoring driven by saturation and hue contrast rather
  than area. The result appears as an extra "From your photo" mood.
- **Click-to-pick correction** — if the automatic pick isn't what you
  meant, click a chip to arm it, then click the exact spot in the photo;
  the colour under the cursor (5×5 average) replaces that chip and the
  whole palette, room and share URL follow.
- **Shareable URLs** — the palette is encoded in the query string
  (`?c=C46A2B&m=complementary&d=bright`).
- **English & German** — a language switcher in the header; the default
  follows the device language (`navigator.language`) and the choice is
  remembered in `localStorage`.
- Light/dark mode, fully client-side, no dependencies, nothing uploaded.

## Run it

Any static file server works:

```sh
python3 devserver.py 4173   # then open http://localhost:4173
```

## Files

- `index.html` — page structure and the room-scene SVG
- `style.css` — theming (light/dark via `data-theme`) and layout
- `app.js` — colour maths (HSL harmonies, LRV, undertones), role
  assignment, rendering and URL state
- `devserver.py` — tiny dev server (chdir-safe for sandboxed spawners)
