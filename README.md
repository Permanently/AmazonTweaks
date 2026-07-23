# Amazon Tweaks

A small, growing **Tampermonkey/Greasemonkey userscript** of quality-of-life tweaks for
`www.amazon.com`. It **starts with a cohesive dark theme** and is structured so more tweaks can
slot in cleanly.

> **Cosmetic and read-only.** The script only injects CSS and toggles a class on the page. It never
> reads credentials, never makes a network request, and never operates a buy/checkout control.

---

## What it does

- **Dark mode.** A hand-tuned dark theme for the pages you actually use — home, search results,
  product detail (title, buy box, variations/"twister", spec tables, reviews), cart, and the
  Buy Again / Orders pages.
  - Paints dark **from the first frame** (`@run-at document-start`), so there's no white flash.
  - **Broad coverage (v0.2).** A saturation-aware **background sweeper** darkens the white cards on
    Amazon's newer React pages too — the ones whose class names are per-deploy hashes that no
    stylesheet can target — while leaving colorful promo banners and sale badges alone.
  - Preserves the accents you rely on: prices, in-stock green, error red, and the signature
    **yellow "Add to Cart" / orange "Buy Now"** buttons stay recognizable.
  - **Gentle photo dimming (v0.2.1).** Product photos have white backgrounds baked into the image
    itself (no CSS background to darken), so small thumbnails get a mild brightness cut to take the
    glare off — while promo banners and the main item-page photo stay full-brightness. It's on by
    default and has its own toggle.
  - **Toggle any time** from the Tampermonkey menu (dark mode also on **`Alt+Shift+D`**). Choices persist.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Edge/Firefox/Safari) or Greasemonkey.
2. Open the raw script and Tampermonkey will offer to install it:
   [`src/amazon-tweaks.user.js`](src/amazon-tweaks.user.js) →
   [raw install link](https://raw.githubusercontent.com/dataterminals/AmazonTweaks/main/src/amazon-tweaks.user.js).
   (Or create a new script and paste the file's contents.)
3. Visit [www.amazon.com](https://www.amazon.com/). It's dark by default.

Because `@downloadURL`/`@updateURL` point at this repo's `main`, Tampermonkey will auto-update the
script when you push a new `@version`.

## Usage

- **Toggle dark mode:** Tampermonkey tray icon → **Amazon Tweaks** → *🌙 Dark mode: ON/OFF*, or press
  **`Alt+Shift+D`** on any Amazon page.
- **Toggle photo dimming:** same menu → *🖼️ Dim product photos: ON/OFF*.
- Both settings are remembered across pages and sessions (stored via `GM_setValue`, or `localStorage`
  as a fallback — UI preferences only, nothing sensitive).

## Compatibility

- Scoped to `https://www.amazon.com/*`. Other Amazon locales (`.co.uk`, `.de`, …) aren't matched yet
  — see the roadmap.
- Amazon's markup shifts over time. The theme leans on long-stable IDs/classes (`#nav-belt`,
  `#ppd`, `.a-box`, `#twister`, …) plus the background sweeper for the rest, but the odd corner may
  slip through. Please [open an issue](https://github.com/dataterminals/AmazonTweaks/issues) with a
  screenshot if you spot a stubborn light patch.

## How it works

Dark mode is scoped under `html.amz-tw-dark` (added to `<html>` at `document-start`; toggling just
flips that class). It's **two layers**:

1. **A static stylesheet** for structure, text, links, accents and the common named surfaces. Pure
   CSS, so it also covers content Amazon injects later. Approach: background/text on the page root,
   collapse structural wrappers to transparent, paint the real "cards" as surfaces, preserve
   semantic accent colors.
2. **A background sweeper** for everything the stylesheet can't name — Amazon's React pages use
   per-deploy **hashed** class names (e.g. `_YnV5L_gridCell_1hj4x`) with no stable selector. It
   tags any *opaque, near-greyscale, light* background and darkens it, guarded by a **saturation
   check** so colorful banners/badges, the CTAs and the search bar are left alone. It runs once on
   load and then watches for lazily added nodes with a debounced `MutationObserver`.

## Roadmap

- [ ] **Multi-flavor shipping clarity.** A clearer display for products with many variations
      ("flavors") whose options ship differently (Prime vs. slow, add-on item, ships-from/sold-by).
      Spec is still being pinned down — see [`docs/BRIEF.md`](docs/BRIEF.md).
- [x] Broad card coverage on modern React pages (Buy Again / Orders / cart) — via the v0.2 sweeper.
- [x] No white flash on lazily-loaded cards; gentle product-photo dimming (v0.2.1).
- [ ] Dark-mode refinements: per-image white-matte detection (dim only true white backgrounds), a
      text-contrast pass for any dark-on-dark stragglers.
- [ ] Match more Amazon locales (`.co.uk`, `.ca`, `.de`, …).
- [ ] Optional "follow system theme" mode.

## Layout

```
AmazonTweaks/
├── src/amazon-tweaks.user.js   # the userscript (dark mode today; more tweaks later)
├── docs/BRIEF.md               # design notes + evolving spec for upcoming tweaks
├── LICENSE                     # MIT
└── README.md
```

## License

[MIT](LICENSE) © dataterminals. Not affiliated with, or endorsed by, Amazon.
