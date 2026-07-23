# Amazon Tweaks

A small, growing **Tampermonkey/Greasemonkey userscript** of quality-of-life tweaks for
`www.amazon.com`. It **starts with a cohesive dark theme** and is structured so more tweaks can
slot in cleanly.

> **Cosmetic and read-only.** The script only injects CSS and toggles a class on the page. It never
> reads credentials, never makes a network request, and never operates a buy/checkout control.

---

## What it does

- **Dark mode (v0.1).** A hand-tuned dark theme for the pages you actually use — home, search
  results, product detail (title, buy box, variations/"twister", spec tables, reviews), and cart.
  - Paints dark **from the first frame** (`@run-at document-start`), so there's no white flash.
  - Preserves the accents you rely on: prices, in-stock green, error red, and the signature
    **yellow "Add to Cart" / orange "Buy Now"** buttons stay recognizable.
  - **Toggle any time** from the Tampermonkey menu or with **`Alt+Shift+D`**. Your choice persists.

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
- The setting is remembered across pages and sessions (stored via `GM_setValue`, or `localStorage`
  as a fallback — UI preference only, nothing sensitive).

## Compatibility

- Scoped to `https://www.amazon.com/*`. Other Amazon locales (`.co.uk`, `.de`, …) aren't matched yet
  — see the roadmap.
- Amazon's markup shifts over time. The theme leans on long-stable IDs/classes (`#nav-belt`,
  `#ppd`, `.a-box`, `#twister`, …) plus a catch-all for inline white backgrounds, but the odd
  corner may slip through. Please [open an issue](https://github.com/dataterminals/AmazonTweaks/issues)
  with a screenshot if you spot a stubborn light patch.

## How it works

Dark mode is a single stylesheet scoped under `html.amz-tw-dark`. The class is added to
`<html>` at `document-start`; toggling is just flipping that class (instant, and it automatically
covers content Amazon injects later, so no `MutationObserver` is needed). The approach: set the
background/text on the page root, collapse Amazon's structural wrappers to transparent so the dark
shows through, then paint the real "cards" as surfaces — while preserving semantic accent colors.

## Roadmap

- [ ] **Multi-flavor shipping clarity.** A clearer display for products with many variations
      ("flavors") whose options ship differently (Prime vs. slow, add-on item, ships-from/sold-by).
      Spec is still being pinned down — see [`docs/BRIEF.md`](docs/BRIEF.md).
- [ ] Dark-mode refinements: product image tiles, Q&A, sponsored blocks, checkout, orders/returns.
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
