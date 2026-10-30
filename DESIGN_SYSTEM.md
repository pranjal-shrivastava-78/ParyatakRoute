# ParyatakRoute — Design System Specification

> **Authoritative Reference:** Adapted from `DESIGN.md` for ParyatakRoute's brand identity.  
> **Aesthetic Philosophy:** Hopper-inspired architectural travel interface. Travel discovery framed through a panoramic window, panoramic destination photography with 32px rounded corners, suspended white pill search controls (9999px radius), crisp 1px gray structural rules, and flat border-led surfaces with zero box shadow.

---

## 1. Color System

ParyatakRoute uses a curated, achromatic foundation punctuated by a high-clarity electric blue (`#1878ec`).

### Color Tokens

| Name | Hex Value | CSS Variable | Semantic Role |
| :--- | :--- | :--- | :--- |
| **Hopper Blue** | `#1878ec` | `--color-hopper-blue` | Primary brand accent: search submit button fill, destination links, inline navigation links, active tab underlines, and promotional card surfaces. |
| **White** | `#ffffff` | `--color-white` | Primary content canvas, card surfaces, and overlay typography/borders across photographic hero frames. |
| **Cloud** | `#f6f6f6` | `--color-cloud` | Level 1 surface: muted destination card backgrounds, itinerary day container fills, and inactive filter pills. |
| **Mist** | `#ededed` | `--color-mist` | Level 2 surface: secondary exploration bands, wide link directories, and soft structural background containers. |
| **Divider Gray**| `#d9d9d9` | `--color-divider-gray`| 1px borders, search field separators, card outlines, and quiet structural division lines. |
| **Ink** | `#111111` | `--color-ink` | Primary headings, active search input text, high-emphasis metrics, and itinerary milestones. |
| **Graphite** | `#606060` | `--color-graphite` | Secondary descriptive text, metadata tags, breadcrumbs, and inactive utility iconography. |
| **Placeholder** | `#b3b3b3` | `--color-placeholder-gray`| Input placeholder text, disabled actions, and unselected control outlines. |

### Surface Elevation Levels

ParyatakRoute eschews fuzzy drop shadows in favor of crisp architectural separation:

```
Level 0: White Canvas (#ffffff)       -> Base page surface & modal card surfaces
Level 1: Cloud Surface (#f6f6f6)      -> Activity cards, day wrappers, info widgets
Level 2: Mist Band (#ededed)          -> Full-width footer exploration bands
Level 3: Blue Surface (#1878ec)       -> High-conversion promotional tiles & highlights
```

---

## 2. Typography

The typographic system utilizes **Nunito Sans** as the geometric, high-legibility substitute for Proxima Nova. The weights (400, 600, 700, 800) create a compact, punchy travel-retail voice.

### Typeface Configuration
- **Primary Font Family:** `'Nunito Sans', 'Proxima Nova', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Fallback Font Family:** `ui-sans-serif, system-ui, sans-serif`

### Type Scale

| Role | Weight | Size | Line Height | Tracking | Token | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **App Heading** | 800 | 32px | 1.25 (40px) | `-0.02em` | `--text-app-heading` | Hero titles, promotional headlines, app showcase |
| **Card Heading**| 700 | 24px | 1.33 (32px) | `-0.01em` | `--text-card-heading`| Destination card titles, itinerary day titles |
| **Section Heading** | 700 | 20px | 1.40 (28px) | `0px` | `--text-section-heading` | Directory headings, widget group titles |
| **Nav Text** | 600 | 16px | 1.50 (24px) | `0px` | `--text-nav` | Header navigation, pill buttons, filter controls |
| **Body Text** | 400 | 16px | 1.50 (24px) | `0px` | `--text-body` | General descriptions, AI explanations, notes |
| **Destination Link**| 400 | 14px | 1.43 (20px) | `0px` | `--text-destination-link`| Footer links, metadata pills, micro badges |

---

## 3. Spacing & Spatial Rhythm

Built on a strict **4px spatial base unit**. Density is calibrated to feel comfortable, open, and editorial.

### Spacing Scale

| Token | Value | Applied To |
| :--- | :--- | :--- |
| `--spacing-4` | 4px | Micro padding, pill search right buffer, badge offsets |
| `--spacing-8` | 8px | Button vertical padding, icon-text gap, element gaps |
| `--spacing-12`| 12px| Card internal padding, button horizontal padding |
| `--spacing-16`| 16px| Compact container padding, list item gaps |
| `--spacing-20`| 20px| Grid gutters, modal internal content spacing |
| `--spacing-24`| 24px| Search pill left padding, card header margin |
| `--spacing-28`| 28px| Section subheader margins, drawer gutters |
| `--spacing-32`| 32px| Hero internal padding, container side gutters |
| `--spacing-40`| 40px| Large module margins, split card paddings |
| `--spacing-48`| 48px| Standard section gap (`--section-gap`) |
| `--spacing-56`| 56px| Major page block separation |

---

## 4. Border Radius Matrix

Radius values define the visual hierarchy and architectural personality of ParyatakRoute.

| Token | Value | Target UI Elements |
| :--- | :--- | :--- |
| `--radius-inputs` | `0px` | **Search inputs inside the pill** (never individually rounded) |
| `--radius-links` | `4px` | Text link focus rectangles, micro tags |
| `--radius-compactcontrols` | `12px` | Sign-in outline buttons, dropdown menus, calendar pickers |
| `--radius-cards` | `16px` | Destination deal cards, activity cards, day containers |
| `--radius-images` | `32px` | **Hero photographic frame**, blue promotional banner tiles |
| `--radius-buttons`| `1000px`| Primary pill buttons, product navigation pills |
| `--radius-pills` | `9999px`| **Unified search pill**, circular search action button |

---

## 5. Component Specifications

### 5.1 Hero Destination Frame
- **Visual Role:** Top-level travel discovery and brand anchor.
- **Specification:** Contained container with `border-radius: 32px`, `overflow: hidden`, `aspect-ratio: 16 / 9` on desktop (minimum height `580px`).
- **Surface:** Atmospheric destination photography with high-res contrast, overlaid by subtle gradient vignette (`rgba(0,0,0,0.25)` to `rgba(0,0,0,0.65)`).
- **Embedded Controls:** Top navigation bar (`HeroNav`) and centered search pill (`SearchPill`) suspended directly over the photograph.

### 5.2 Transparent Product Navigation
- **Visual Role:** Mode switching (Flights, Stays, Car Rental, AI Planner, Packages).
- **Specification:** Suspended over the hero. White text (`#ffffff`), `font-weight: 600`, `16px/24px`, paired with 18px line icons.
- **Pill Treatment:** `padding: 8px 12px`, `border-radius: 1000px`. Active item receives `border: 1px solid #ffffff; background: rgba(255,255,255,0.12);`.

### 5.3 Unified Destination Search Pill
- **Visual Role:** Multi-field booking and itinerary generation search engine.
- **Specification:** Pure white background (`#ffffff`), `border-radius: 9999px`, zero box-shadow.
- **Field Separators:** `1px solid #d9d9d9` vertical rules separating Destination, Dates, and Travelers.
- **Internal Radii:** Individual text input fields strictly maintain `border-radius: 0px`.
- **Text Styling:** Entered values in `#111111`, placeholder in `#b3b3b3`.
- **Submit Control:** Saturated `#1878ec` circular button (`height: 48px`, `width: 48px`, `border-radius: 9999px`) seated at the right edge with a white search icon.

### 5.4 Flat Destination Deal Card
- **Visual Role:** Curated exploration item and featured itinerary cards.
- **Specification:** Flat `#f6f6f6` surface, `border-radius: 16px`, `1px solid #d9d9d9` border, strictly **zero box-shadow**.
- **Imagery:** Edge-to-edge top image with `border-top-left-radius: 15px; border-top-right-radius: 15px`.
- **Body Padding:** `padding: 16px`. Title in `#111111` 700 18px, pricing in `#1878ec` 700 20px.

### 5.5 Blue Promotional Tile
- **Visual Role:** Highlighting AI itinerary generator, special perks, or offline features.
- **Specification:** Full-bleed `#1878ec` background, `border-radius: 32px`, no shadow.
- **Typography:** Headlines and supporting body exclusively in `#ffffff`.
- **Button:** White filled pill button (`background: #ffffff; color: #1878ec; border-radius: 1000px`).

### 5.6 App Download & Acquisition Showcase
- **Visual Role:** Conversion section for mobile PWA and QR downloads.
- **Specification:** Set on `#ffffff` canvas. Left column: `#111111` 32px/40px bold heading, 16px supporting text, raw high-contrast QR code, `#1878ec` text link, and store star ratings. Right column: Overlapping upright mobile device frames with raw screen edges.

### 5.7 Destination Link Directory Band
- **Visual Role:** Deep exploration and SEO navigation band.
- **Specification:** Set across a wide `#ededed` band (`--color-mist`).
- **Heading:** `#111111` 20px/28px bold heading.
- **Columns:** 4-column balanced grid with links in `#1878ec` at 14px/20px weight 400 with 8px vertical rhythm.

---

## 6. Do's and Don'ts

### DO
- ✅ Use `#ffffff` as default canvas and reserve `#f6f6f6` and `#ededed` for section blocks and utility bands.
- ✅ Keep headings in `#111111` with compact line-heights (1.25 to 1.4).
- ✅ Confine `#1878ec` to interactive accents, search submission, destination links, and contained promotional surfaces.
- ✅ Retain `9999px` radii on unified search bars and `32px` radii on photographic hero frames.
- ✅ Use `1px solid #d9d9d9` dividers between search inputs and on bordered card perimeters.
- ✅ Maintain unauthenticated public access for AI Itinerary generation and AI chat queries.

### DON'T
- ❌ Do NOT apply drop shadows to `#f6f6f6` cards or `#1878ec` promo banners.
- ❌ Do NOT use `#1878ec` as an entire page-wide background.
- ❌ Do NOT make individual search inputs inside the search pill rounded; they must have `0px` radius.
- ❌ Do NOT use sharp 0px corners on hero images; maintain the signature `32px` radius.
- ❌ Do NOT copy Hopper trademarked logos, branding, or mascot graphics.
- ❌ Do NOT use borders thicker than `1px solid #d9d9d9`.

---

## 7. Responsive Design Principles

| Breakpoint | Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Mobile** | `< 768px` | Hero frame radius relaxes to `16px`; Search pill expands into a stacked card modal; Product nav becomes horizontally scrollable; Link directory collapses to 1-2 columns. |
| **Tablet** | `768px - 1024px` | Hero frame radius maintains `24px`; Search pill displays compact 2-field row; Deal cards display in 2-column grid; Link directory displays in 2-3 columns. |
| **Desktop** | `> 1024px` | Full architectural experience: `32px` hero radius; 4-field unified `9999px` search pill; 3-4 column deal card grids; 4-column link directory on `#ededed`. |

---

## 8. Iconography & Asset Guidelines

- **Icon Set:** `lucide-react` line icons.
- **Stroke Width:** Standardized `1.75px` to `2.0px`.
- **Hero Iconography:** Exclusively `#ffffff` line icons.
- **Card Iconography:** `#606060` (Graphite) for metadata; `#1878ec` for highlight actions.
- **Imagery Tone:** High-clarity, naturally lit, scenic travel photography reflecting Indian and global heritage, landscapes, and urban centers.
