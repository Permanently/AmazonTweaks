// ==UserScript==
// @name         Amazon Tweaks
// @namespace    https://github.com/dataterminals/AmazonTweaks
// @version      0.1.0
// @description  A small, growing collection of quality-of-life tweaks for amazon.com. Starts with a cohesive dark theme (toggleable). Purely cosmetic/read-only — it never clicks a buy control, submits a form, or makes a network request.
// @author       dataterminals
// @homepageURL  https://github.com/dataterminals/AmazonTweaks
// @supportURL   https://github.com/dataterminals/AmazonTweaks/issues
// @match        https://www.amazon.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/dataterminals/AmazonTweaks/main/src/amazon-tweaks.user.js
// @updateURL    https://raw.githubusercontent.com/dataterminals/AmazonTweaks/main/src/amazon-tweaks.user.js
// @noframes
// ==/UserScript==
//
// DESIGN NOTES (for the next maintainer — human or Claude):
//   * This is a COSMETIC, READ-ONLY userscript. It only injects CSS and toggles a class on
//     <html>. It never reads credentials, never issues a network request, and never operates
//     a money-moving control. Keep it that way — anything that touches account state belongs
//     in a different, clearly-scoped tool.
//   * Dark mode is CSS-only, scoped under `html.amz-tw-dark`. Because it is pure CSS, it applies
//     automatically to nodes Amazon injects later (search filtering, lazy sections) — no
//     MutationObserver needed. Toggling the theme is just flipping the class; instant, no reflow
//     of our own doing.
//   * The theme runs at @run-at document-start and adds the class to document.documentElement
//     immediately, so the page paints dark from the first frame (no white flash / FOUC).
//   * Strategy for the CSS: set the page background + text on <html>/<body>, collapse Amazon's
//     structural wrappers to transparent so the dark shows through, then paint the real "cards"
//     (.a-box, buy box, review widgets, search tiles) as surfaces. Semantic accent colors
//     (price, in-stock green, error red) are preserved/brightened rather than flattened. CTA
//     buttons (Add to Cart / Buy Now) intentionally keep Amazon's signature yellow/orange so the
//     muscle-memory targets stay recognizable.
//
// ROADMAP lives in docs/BRIEF.md. Next up: a clearer display for multi-flavor products whose
// variations have different shipping properties (see BRIEF — spec still being pinned down).

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Small persistence layer. Uses Tampermonkey's GM storage when available and
  // falls back to localStorage. We only ever store non-sensitive UI prefs.
  // ---------------------------------------------------------------------------
  const STORE_KEY = 'amz_tw_prefs_v1';
  const DARK_CLASS = 'amz-tw-dark';
  const STYLE_ID = 'amz-tw-dark-style';

  const hasGM =
    typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

  const DEFAULTS = {
    darkMode: true // the whole point of v0.1 — dark by default
  };

  function loadPrefs() {
    try {
      if (hasGM) {
        return Object.assign({}, DEFAULTS, GM_getValue(STORE_KEY, {}) || {});
      }
      const raw = localStorage.getItem(STORE_KEY);
      return Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function savePrefs(p) {
    try {
      if (hasGM) GM_setValue(STORE_KEY, p);
      else localStorage.setItem(STORE_KEY, JSON.stringify(p));
    } catch (e) {
      /* preferences are best-effort; never let a storage failure break the page */
    }
  }

  const prefs = loadPrefs();

  // ---------------------------------------------------------------------------
  // Dark theme. One big scoped stylesheet. Everything is under `html.amz-tw-dark`
  // so a single class toggle turns the whole thing on/off.
  // ---------------------------------------------------------------------------
  const DARK_CSS = `
/* ===== palette ===== */
html.amz-tw-dark {
  color-scheme: dark;
  --ae-bg: #0f1216;
  --ae-bg-2: #151a20;
  --ae-surface: #1b2129;
  --ae-surface-2: #232a33;
  --ae-border: #333c46;
  --ae-border-strong: #48525d;
  --ae-text: #e6e9ec;
  --ae-text-2: #aeb6bf;
  --ae-text-3: #87909b;
  --ae-link: #5cb8ea;
  --ae-link-hover: #ffb64d;
  --ae-price: #ff8f66;
}

/* ===== base ===== */
html.amz-tw-dark,
html.amz-tw-dark body {
  background-color: var(--ae-bg) !important;
  color: var(--ae-text) !important;
}

/* structural wrappers -> transparent so the page background shows through */
html.amz-tw-dark #a-page,
html.amz-tw-dark #dp,
html.amz-tw-dark #dp-container,
html.amz-tw-dark #ppd,
html.amz-tw-dark #centerCol,
html.amz-tw-dark #leftCol,
html.amz-tw-dark #rightCol,
html.amz-tw-dark #pageContent,
html.amz-tw-dark #search,
html.amz-tw-dark .s-desktop-content,
html.amz-tw-dark .s-main-slot,
html.amz-tw-dark .a-section,
html.amz-tw-dark .a-container {
  background-color: transparent !important;
}

/* catch-all for the inline white backgrounds Amazon sprinkles everywhere */
html.amz-tw-dark [style*="background-color:#fff"],
html.amz-tw-dark [style*="background-color: #fff"],
html.amz-tw-dark [style*="background-color:#FFF"],
html.amz-tw-dark [style*="background-color: #FFF"],
html.amz-tw-dark [style*="background:#fff"],
html.amz-tw-dark [style*="background: #fff"],
html.amz-tw-dark [style*="background-color:white"],
html.amz-tw-dark [style*="background-color: white"] {
  background-color: var(--ae-surface) !important;
}

/* ===== cards / boxes ===== */
html.amz-tw-dark .a-box,
html.amz-tw-dark .a-box-inner,
html.amz-tw-dark .a-box-group,
html.amz-tw-dark .s-card-container,
html.amz-tw-dark .puis-card-container,
html.amz-tw-dark #desktop_buybox,
html.amz-tw-dark #buybox,
html.amz-tw-dark #qualifiedBuybox,
html.amz-tw-dark #newAccordionRow,
html.amz-tw-dark #reviewsMedley,
html.amz-tw-dark .review,
html.amz-tw-dark #sc-active-cart,
html.amz-tw-dark .sc-list-item,
html.amz-tw-dark #sc-buy-box {
  background-color: var(--ae-surface) !important;
  border-color: var(--ae-border) !important;
  color: var(--ae-text) !important;
  box-shadow: none !important;
}

/* ===== text ===== */
html.amz-tw-dark #productTitle,
html.amz-tw-dark .a-color-base,
html.amz-tw-dark .a-text-normal,
html.amz-tw-dark h1,
html.amz-tw-dark h2,
html.amz-tw-dark h3,
html.amz-tw-dark h4,
html.amz-tw-dark h5,
html.amz-tw-dark h6 {
  color: var(--ae-text) !important;
}
html.amz-tw-dark .a-color-secondary { color: var(--ae-text-2) !important; }
html.amz-tw-dark .a-color-tertiary { color: var(--ae-text-3) !important; }

/* keep semantic accents legible on dark rather than flattening them */
html.amz-tw-dark .a-color-success { color: #4cc98a !important; }
html.amz-tw-dark .a-color-error,
html.amz-tw-dark .a-color-attention { color: #ff7a7a !important; }

/* ===== links (nav re-asserted below so header links stay light) ===== */
html.amz-tw-dark a,
html.amz-tw-dark a:link,
html.amz-tw-dark a:visited,
html.amz-tw-dark .a-link-normal,
html.amz-tw-dark a.a-color-base,
html.amz-tw-dark .a-link-normal .a-color-base {
  color: var(--ae-link) !important;
}
html.amz-tw-dark a:hover,
html.amz-tw-dark .a-link-normal:hover,
html.amz-tw-dark .a-link-normal:hover .a-color-base {
  color: var(--ae-link-hover) !important;
}

/* ===== header / nav (already dark-ish; unify + keep its links light) ===== */
html.amz-tw-dark #navbar,
html.amz-tw-dark #nav-belt,
html.amz-tw-dark #nav-main,
html.amz-tw-dark .nav-fill,
html.amz-tw-dark #nav-search,
html.amz-tw-dark #navbar-main {
  background-color: #0b0e12 !important;
}
html.amz-tw-dark #navbar a,
html.amz-tw-dark #nav-belt a,
html.amz-tw-dark #nav-main a,
html.amz-tw-dark #nav-subnav a,
html.amz-tw-dark #navFooter a {
  color: #e6e9ec !important;
}
html.amz-tw-dark #nav-subnav {
  background-color: var(--ae-bg-2) !important;
  border-color: var(--ae-border) !important;
}

/* Search bar is intentionally LEFT AT AMAZON'S DEFAULT (light field, dark text).
   Amazon progressively skins the search input (.nav-progressive-attribute) and
   locks its text color + background via cross-origin !important rules that even
   an inline !important can't override — darkening the field just yields
   unreadable dark-on-dark text. A white search box on a dark header is also
   exactly how stock Amazon looks. We only darken the header shell around it
   (see the nav block above), which sits behind the field's own white fill.
   Search-autocomplete and account/nav flyouts are left default for the same
   reason. See docs/BRIEF.md. */

/* hamburger side menu — normal links/text, safe to theme */
html.amz-tw-dark #hmenu-content,
html.amz-tw-dark .hmenu {
  background-color: var(--ae-surface) !important;
  color: var(--ae-text) !important;
  border-color: var(--ae-border) !important;
}
html.amz-tw-dark .hmenu-item { color: var(--ae-text) !important; }
html.amz-tw-dark .hmenu-item:hover { background-color: var(--ae-surface-2) !important; }

/* ===== popovers / modals / dropdown menus ===== */
html.amz-tw-dark .a-popover,
html.amz-tw-dark .a-popover-inner,
html.amz-tw-dark .a-modal-scroller,
html.amz-tw-dark .a-popover-modal,
html.amz-tw-dark .a-dropdown-common,
html.amz-tw-dark .a-list-view {
  background-color: var(--ae-surface) !important;
  color: var(--ae-text) !important;
  border-color: var(--ae-border) !important;
}
html.amz-tw-dark .a-popover-header {
  background-color: var(--ae-surface-2) !important;
  border-color: var(--ae-border) !important;
}
html.amz-tw-dark .a-dropdown-item:hover,
html.amz-tw-dark .a-dropdown-link:hover {
  background-color: var(--ae-surface-2) !important;
}

/* ===== inputs (leave checkboxes/radios to color-scheme) ===== */
html.amz-tw-dark input[type="text"],
html.amz-tw-dark input[type="search"],
html.amz-tw-dark input[type="email"],
html.amz-tw-dark input[type="password"],
html.amz-tw-dark input[type="number"],
html.amz-tw-dark input[type="tel"],
html.amz-tw-dark input[type="url"],
html.amz-tw-dark textarea,
html.amz-tw-dark select,
html.amz-tw-dark .a-input-text {
  background-color: var(--ae-surface) !important;
  color: var(--ae-text) !important;
  border-color: var(--ae-border-strong) !important;
}

/* ===== buttons: theme the neutral ones, keep CTA colors ===== */
html.amz-tw-dark .a-button-base,
html.amz-tw-dark .a-button-base .a-button-inner,
html.amz-tw-dark .a-button-secondary,
html.amz-tw-dark .a-button-secondary .a-button-inner,
html.amz-tw-dark .a-button:not([class*="primary"]):not([class*="cart"]):not([class*="buynow"]):not([class*="oyi"]):not([class*="accent"]),
html.amz-tw-dark .a-button:not([class*="primary"]):not([class*="cart"]):not([class*="buynow"]):not([class*="oyi"]):not([class*="accent"]) .a-button-inner {
  background: var(--ae-surface-2) !important;
  border-color: var(--ae-border-strong) !important;
}
html.amz-tw-dark .a-button-text { color: var(--ae-text) !important; }

/* ===== prices ===== */
html.amz-tw-dark .a-price,
html.amz-tw-dark .a-price .a-price-whole,
html.amz-tw-dark .a-price .a-price-fraction,
html.amz-tw-dark .a-price .a-price-symbol {
  color: var(--ae-text) !important;
}
html.amz-tw-dark #corePriceDisplay_desktop_feature_div .a-price .a-price-whole,
html.amz-tw-dark .priceToPay .a-price-whole,
html.amz-tw-dark .apexPriceToPay,
html.amz-tw-dark .a-color-price {
  color: var(--ae-price) !important;
}

/* ===== variations / twister (relevant to the flavor+shipping roadmap) ===== */
html.amz-tw-dark #twister .a-row,
html.amz-tw-dark #twisterContainer,
html.amz-tw-dark #inline-twister-expander-content,
html.amz-tw-dark #tp_inline_twister_dp,
html.amz-tw-dark .twisterTextDiv,
html.amz-tw-dark .inline-twister-dim-title-value {
  color: var(--ae-text) !important;
}
html.amz-tw-dark .swatchAvailable,
html.amz-tw-dark .swatchSelect,
html.amz-tw-dark .swatchUnavailable,
html.amz-tw-dark .a-button-toggle .a-button-inner {
  background-color: var(--ae-surface-2) !important;
  border-color: var(--ae-border) !important;
  color: var(--ae-text) !important;
}
html.amz-tw-dark .swatchSelect,
html.amz-tw-dark .a-button-selected .a-button-inner {
  border-color: var(--ae-link-hover) !important;
}

/* ===== tables (spec sheets) ===== */
html.amz-tw-dark table,
html.amz-tw-dark .a-keyvalue,
html.amz-tw-dark .prodDetTable,
html.amz-tw-dark #productDetails_techSpec_section_1,
html.amz-tw-dark #productDetails_detailBullets_sections1 {
  background-color: transparent !important;
  color: var(--ae-text) !important;
  border-color: var(--ae-border) !important;
}
html.amz-tw-dark th,
html.amz-tw-dark .a-keyvalue th,
html.amz-tw-dark .prodDetTable th {
  background-color: var(--ae-surface-2) !important;
  color: var(--ae-text) !important;
  border-color: var(--ae-border) !important;
}
html.amz-tw-dark td { border-color: var(--ae-border) !important; }

/* ===== dividers ===== */
html.amz-tw-dark .a-divider-normal,
html.amz-tw-dark hr,
html.amz-tw-dark .a-divider-inner {
  border-color: var(--ae-border) !important;
  background-color: var(--ae-border) !important;
}

/* ===== footer ===== */
html.amz-tw-dark #navFooter,
html.amz-tw-dark .navFooterVerticalColumn,
html.amz-tw-dark .navFooterLine {
  background-color: #0b0e12 !important;
  color: var(--ae-text) !important;
}
html.amz-tw-dark #navBackToTop,
html.amz-tw-dark #navBackToTop .navFooterBackToTopText {
  background-color: var(--ae-surface-2) !important;
  color: var(--ae-text) !important;
}

/* ===== scrollbars ===== */
html.amz-tw-dark ::-webkit-scrollbar { width: 12px; height: 12px; }
html.amz-tw-dark ::-webkit-scrollbar-track { background: var(--ae-bg-2); }
html.amz-tw-dark ::-webkit-scrollbar-thumb { background: var(--ae-border-strong); border-radius: 6px; }
html.amz-tw-dark ::-webkit-scrollbar-thumb:hover { background: #5b6773; }
`;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DARK_CSS;
    // At document-start <head> may not exist yet; documentElement always does.
    (document.head || document.documentElement).appendChild(style);
  }

  function applyDark(on) {
    const root = document.documentElement;
    if (!root) return;
    root.classList.toggle(DARK_CLASS, !!on);
  }

  // Paint dark from the first frame — no white flash.
  injectStyle();
  applyDark(prefs.darkMode);

  function setDark(on) {
    prefs.darkMode = !!on;
    savePrefs(prefs);
    applyDark(prefs.darkMode);
    refreshMenu();
  }

  function toggleDark() {
    setDark(!prefs.darkMode);
  }

  // ---------------------------------------------------------------------------
  // Tampermonkey menu toggle + Alt+Shift+D shortcut.
  // ---------------------------------------------------------------------------
  let menuId = null;

  function refreshMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    if (menuId != null && typeof GM_unregisterMenuCommand === 'function') {
      try { GM_unregisterMenuCommand(menuId); } catch (e) { /* ignore */ }
    }
    const label =
      (prefs.darkMode ? '🌙 Dark mode: ON' : '☀️ Dark mode: OFF') +
      '  —  click to toggle (Alt+Shift+D)';
    menuId = GM_registerMenuCommand(label, toggleDark);
  }
  refreshMenu();

  window.addEventListener(
    'keydown',
    function (e) {
      if (!e.altKey || !e.shiftKey) return;
      if (e.key !== 'D' && e.key !== 'd') return;
      const t = e.target;
      const typing =
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      e.preventDefault();
      toggleDark();
    },
    true
  );

  // ---------------------------------------------------------------------------
  // Feature seam (future work).
  // Next planned tweak: a clearer display for multi-flavor products whose
  // variations ship differently (Prime vs. slow, add-on, ships-from/sold-by).
  // See docs/BRIEF.md for the evolving spec. New features should register here
  // and generally run on DOMContentLoaded rather than document-start.
  // ---------------------------------------------------------------------------
})();
