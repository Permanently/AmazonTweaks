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

## Feature 1 — Dark mode (shipped, v0.1)

Single stylesheet scoped under `html.amz-tw-dark`; the class is toggled on `<html>`.

- **Why CSS-only + a class:** it applies automatically to nodes Amazon injects later (search
  filtering, lazy sections), so no `MutationObserver`. Toggling is instant.
- **Strategy:** background/text on the page root → collapse structural wrappers
  (`#ppd`, `#centerCol`, `.a-section`, …) to transparent → paint the real cards (`.a-box`, buy box,
  review widgets, search tiles) as surfaces → preserve/brighten semantic accents (price, in-stock
  green, error red) → **keep CTA buttons (Add to Cart yellow / Buy Now orange)** so muscle memory
  survives.
- **Toggle:** Tampermonkey menu command + `Alt+Shift+D`.
- **Search bar left default (deliberate).** Amazon progressively skins the search input
  (`.nav-progressive-attribute`) and locks its text color (`#111`) and background via
  cross-origin `!important` rules (in `NavDesktopUberAsset` / `AmazonUI` sheets) that even an
  *inline* `!important` can't override. Its white field comes from `.nav-search-field`
  (`background:#fff`) with a transparent input on top. Darkening the wrapper therefore yields
  unreadable dark-on-dark text, so the whole search bar (field, "All" scope dropdown,
  autocomplete flyout, account/nav flyouts) is left at Amazon's default light styling — which is
  also how stock Amazon looks against the dark header. Verified live on the homepage 2026-07-22.
- **Known rough edges (roadmap):** product image tiles (white-background photos still show as light
  rectangles — that's the image itself), sponsored blocks, Q&A, checkout, orders/returns pages.

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
