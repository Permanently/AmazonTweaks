# Amazon Tweaks — design brief

A single userscript collecting small, **cosmetic, read-only** quality-of-life tweaks for
`www.amazon.com`. This doc is the authoritative-ish spec; the README is the user-facing summary.

## Non-negotiables

- **Read-only + cosmetic.** Inject CSS, toggle a class, at most reorganize/annotate existing DOM.
  Never click a buy/checkout control, never submit a form, never issue a network request, never
  touch credentials. Anything stateful belongs in a different, clearly-scoped tool.
- **No FOUC.** Anything theme-related runs at `document-start` and applies before first paint.
- **Fail safe.** A tweak that can't find what it expects should no-op, never throw into the page.
- **Persist only non-sensitive UI prefs** (`GM_setValue`, `localStorage` fallback), namespaced
  under `amz_tw_prefs_v1`.

## Feature 1 — Dark mode (shipped; v0.1 static theme, v0.2 sweeper, v0.2.1 image dim)

Scoped under `html.amz-tw-dark` (class toggled on `<html>`). **Two layers:**

- **Layer 1 — static stylesheet.** Handles structure/text/links/accents and the common named
  surfaces. Strategy: background/text on the page root → collapse structural wrappers
  (`#ppd`, `#centerCol`, `.a-section`, …) to transparent → paint the real cards (`.a-box`, buy box,
  review widgets, search tiles) as surfaces → preserve/brighten semantic accents (price, in-stock
  green, error red) → **keep CTA buttons (Add to Cart yellow / Buy Now orange)** so muscle memory
  survives. Pure CSS, so it also covers nodes Amazon injects later; toggling is instant.
- **Layer 2 — background sweeper (v0.2).** The stylesheet can't name everything: Amazon's newer
  pages (Buy Again, Orders, lists, cart flyout) are React apps whose card classes carry a
  **per-deploy hash** (e.g. `_YnV5L_gridCell_1hj4x`) — no stable selector exists. So a JS pass walks
  the DOM and tags any element whose background is an **opaque, near-greyscale, light** colour
  (`luma ≥ 0.72`, `chroma ≤ 28`, `alpha ≥ 0.9`) with `data-amztw`, which the stylesheet paints dark.
  **Saturation guard** is the safety net: saturated colours (promo banners, sale badges) are left
  alone, as are the CTAs and the search bar. Backgrounds only — text already themes via the standard
  `.a-color-*` / `.a-price-*` classes the cards use. Runs a full pass on load + a `MutationObserver`
  whose flush is scheduled on `requestAnimationFrame` (v0.2.1) so freshly added nodes are darkened
  **before** their first paint — no white flash — plus a few one-time delayed re-sweeps (400/1200/
  3000 ms) as straggler insurance for slow renders and in-place class/style changes the childList
  observer can't see. Verified live 2026-07-23 on Buy Again (React grid + cart flyout), the homepage
  (recommendation shovelers vs. colour banners) and a product page (buy box). One-pass counts:
  ~200–660 elements depending on how much had rendered.
- **Layer 3 — thumbnail dim (v0.2.1, toggleable).** After the sweep, the only brightness left on
  the homepage is **product photos with white backgrounds baked into the JPEG** — image pixels, not
  a CSS background, so nothing to repaint. The sweeper tags small `<img>` (rendered 40–300 px both
  axes → thumbnails, never the big promo banners or the item-page main image) with `data-amztw-img`,
  and a CSS rule gated on a root `data-amztw-dimimg` attribute applies `filter: brightness(.83)
  contrast(1.03)`. Mild by request ("a little") — softens the white glare while keeping products
  recognizable. **On by default, its own menu toggle.** Verified live on Buy Again 2026-07-23.
- **Toggle:** Tampermonkey menu — *🌙 Dark mode* (also `Alt+Shift+D`, re-runs the sweeper when
  re-enabled) and *🖼️ Dim product photos*. Both prefs persist.
- **Search bar left default (deliberate).** Amazon progressively skins the search input
  (`.nav-progressive-attribute`) and locks its text color (`#111`) and background via
  cross-origin `!important` rules (in `NavDesktopUberAsset` / `AmazonUI` sheets) that even an
  *inline* `!important` can't override. Its white field comes from `.nav-search-field`
  (`background:#fff`) with a transparent input on top. Darkening the wrapper therefore yields
  unreadable dark-on-dark text, so the whole search bar (field, "All" scope dropdown,
  autocomplete flyout, account/nav flyouts) is left at Amazon's default light styling — which is
  also how stock Amazon looks against the dark header. Verified live on the homepage 2026-07-22.
- **Known rough edges (roadmap):** product-photo mattes are now *softened* by the Layer-3 dim rather
  than fully removed — a stronger cut would mute products, so "a little" is the deliberate ceiling
  (a per-image white-background detector, e.g. canvas-sampling the corners and only dimming true
  white mattes, is the obvious v0.3 refinement). Sweeper limitations: (a) it reacts
  to *added* nodes, so an in-place `class`/`style` change that turns an existing element white
  without re-mounting it won't be re-caught until something else triggers a pass; (b) a rare element
  with genuinely dark text set inline could sit on a now-dark swept background — none seen so far,
  but a text-contrast pass is the obvious v0.3 hardening if one shows up.

## Feature 2 — Multi-flavor shipping clarity (planned — SPEC NOT YET FINAL)

**Problem (as stated by the owner):** for products with many variations ("flavors"), the different
options can have **different shipping properties**, and Amazon's current presentation makes that
hard to see at a glance.

**Open questions to pin down before building:**

- Which surface(s)? The variation picker / inline twister on the product page, the search grid, or
  both?
- What shipping signals matter? Candidates: Prime eligibility, delivery ETA/speed, add-on-item,
  ships-from / sold-by (Amazon vs. third-party), and price deltas between flavors.
- Where does that data live in the page? The twister exposes variation metadata via
  `#twister`/inline-twister state and `dataToReturn`/`twisterController` globals; per-variation
  shipping usually only resolves after selection (buy-box refresh). Need to confirm what's
  available without triggering navigation or extra requests (**read-only constraint**).
- Presentation: annotate each swatch/row in place (badges), or a compact summary table of
  flavor → price → shipping? Sort/filter flavors by "fastest/Prime"?

**Next step:** owner to describe the exact behavior they want; then turn the above into a concrete
DOM plan and add it as a second feature module (registered at the feature seam, running on
`DOMContentLoaded`).

## Layout

```
AmazonTweaks/
├── src/amazon-tweaks.user.js   # userscript
├── docs/BRIEF.md               # this file
├── LICENSE                     # MIT
└── README.md
```
