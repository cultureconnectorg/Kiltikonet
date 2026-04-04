# Design System Specification: Editorial Precision & Tonal Depth

## 1. Overview & Creative North Star: "The Digital Curator"
The Creative North Star for this design system is **"The Digital Curator."** This concept moves away from the aggressive, fast-paced nature of traditional SaaS interfaces, leaning instead toward the hushed, authoritative atmosphere of a private high-end cultural institution. 

The aesthetic is "Mysterious yet Precise." We achieve this through a "Noir Editorial" lens: deep, ink-like voids contrasted against razor-sharp serif typography and surgical applications of gold. We break the "template" look by favoring intentional asymmetry, generous white space (negative space as a luxury), and a refusal to use traditional structural lines. The UI does not contain content; it frames it.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the absence of light, using gold only as a marker of "value" or "identity."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Boundaries must be defined solely through background color shifts or tonal transitions. Use `surface-container-low` against a `surface` background to denote change in context.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of obsidian and smoked glass.
*   **Base Layer:** `surface` (#131314) or `surface_container_lowest` (#0e0e0f) for the deep background.
*   **Secondary Layer:** `surface_container` (#201f20) for primary content areas.
*   **Elevated Layer:** `surface_container_high` (#2a2a2b) for interactive cards or floating menus.

### The "Glass & Gold" Rule
For high-impact floating elements (modals, dropdowns), use **Glassmorphism**. Apply `surface_container_highest` at 70% opacity with a `24px` backdrop-blur. This ensures the mysterious depth of the background "bleeds" through the interface. 

**Signature Texture:** Use a subtle linear gradient on primary CTAs transitioning from `primary_container` (#e8d5a0) to `primary_fixed_dim` (#d8c591) at a 135-degree angle to provide a metallic, light-catching quality.

---

## 3. Typography: The Editorial Voice
The system relies on the tension between the classicism of the serif and the modernism of the sans-serif.

*   **Display & Headlines (Newsreader/Cormorant):** These are the "Curator's Voice." Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em) to create an authoritative, editorial feel. These should always be in `on_surface`.
*   **UI & Action (Manrope/DM Sans):** The "Assistant’s Voice." Precise, functional, and highly legible. Use `title-sm` for navigation and `label-md` for metadata.
*   **Hierarchy Tip:** If a piece of information is a "Value" (e.g., a price, a date, a rare status), use the `primary` gold token. Everything else remains in the `on_surface` or `on_surface_variant` (muted) scale.

---

## 4. Elevation & Depth: Tonal Layering
We reject drop shadows in favor of **Ambient Light** and **Tonal Stacking**.

*   **The Layering Principle:** Place a `surface_container_highest` card on a `surface_dim` background. The contrast is the boundary.
*   **Ambient Shadows:** If an element must float (e.g., a luxury product hover), use a shadow color of `#000000` at 40% opacity, with a `40px` blur and `20px` Y-offset. It should feel like an object casting a shadow in a dimly lit room.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline_variant` (#4b463b) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Interaction Patterns

### Buttons
*   **Primary:** Background `primary_container` (#e8d5a0), Text `on_primary` (#3a2f09). Shape: `sm` (0.125rem) for a sharp, architectural look.
*   **Secondary:** No background. Ghost border (15% opacity `outline`).
*   **Interaction:** 
    *   **Hover:** `scale(1.02)` with a 1px solid `primary` (#fff2d2) border reveal.
    *   **Active:** `scale(0.97)`. Transition: `200ms cubic-bezier(0.2, 0, 0, 1)`.

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Structure:** Use 48px or 64px of vertical space (Spaced Layout) to separate list items. Use a `surface_container_low` background on hover to highlight a row.
*   **Skeleton Loading:** Use a shimmering gradient moving from `surface_container` to `primary_fixed_dim` (at 10% opacity) back to `surface_container`. It should look like light catching a gold thread in the dark.

### Input Fields
*   **Style:** Underline-only or subtle `surface_container_highest` blocks. 
*   **Focus:** The label should transition to `primary` gold. The caret should be `primary`. Avoid heavy box-shadows on focus; use a subtle `0.5px` gold bottom-border.

### Signature Component: The "Value Badge"
Used for high-status items or rare data. A small, `9999px` (full round) chip using `primary_fixed_dim` with `on_primary_fixed` text, featuring a subtle `0.5px` inner glow.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins (e.g., a wider left margin than right) to mimic high-end magazine layouts.
*   **Do** use "Optical Centering"—place elements slightly above the mathematical center to create a sense of poise.
*   **Do** use the `tertiary` (#f4f0ff) token very sparingly for "Success" or "New" notifications to provide a cool contrast to the warm gold.

### Don't
*   **Don't** use 100% white (#FFFFFF). Always use `on_surface` (#e5e2e3) to avoid "eye-bleed" on the dark background.
*   **Don't** use standard `md` or `lg` corner radii for everything. Keep it sharp (`none` or `sm`) for structural elements and `full` for interactive "identity" elements.
*   **Don't** use standard "Warning" yellows. If an error occurs, use the `error` (#ffb4ab) token, which is tuned to sit elegantly within the dark obsidian palette.

---

## 7. Motion & Interaction
*   **The "Curator's Reveal":** Page transitions should use a subtle vertical stagger. Elements don't just appear; they "settle" into place with a slight Y-axis slide (10px) and an opacity fade.
*   **Duration:** All animations must be slightly slower than standard (300ms–450ms) to convey a sense of deliberate, high-end precision.