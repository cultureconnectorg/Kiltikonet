# Design System Specification: Sovereign Editorial

## 1. Overview & Creative North Star
### The "Digital Sovereign"
This design system is built to evoke the feeling of a high-end cultural institution—one that sits at the intersection of heritage and the bleeding edge of technology. We are moving away from the "template" aesthetic of the modern web. Our North Star is **Sovereign Editorial**: a style defined by expansive negative space, authoritative typography, and a tactile sense of depth achieved through light and material rather than lines and boxes.

We break the standard grid through **Intentional Asymmetry**. Elements should feel curated, not just placed. Overlapping typography on glass containers and "floating" hero elements create a cinematic experience that feels immersive and premium.

---

## 2. Color & Materiality
The palette is rooted in the "Deepest Black" and "Burnished Gold." It is designed to feel expensive, using the contrast between high-gloss gold accents and matte, layered dark surfaces.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Structural boundaries must be defined solely through:
1.  **Background Color Shifts:** A `surface-container-low` section sitting against a `surface` background.
2.  **Tonal Transitions:** Using subtle gradients to suggest an edge.
3.  **Negative Space:** Using the spacing scale to create mental boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of luxury materials.
*   **Base Layer (`surface` / `#131313`):** The canvas.
*   **Layer 1 (`surface-container-low` / `#1b1b1b`):** Secondary content areas.
*   **Layer 2 (`surface-container-highest` / `#353535`):** Interactive cards or focused modals.

### The Glass & Gradient Rule
To achieve "Sovereign" luxury, use **Glassmorphism** for floating UI elements (Navigation bars, dropdowns, hovering stats).
*   **Effect:** `surface-container` at 60% opacity with a `24px` backdrop-blur.
*   **Gradients:** Use a linear gradient from `primary` (#e5c363) to `primary-container` (#c8a84b) for active states and high-impact CTAs. This provides a "soul" and metallic luster that flat hex codes cannot replicate.

---

## 3. Typography
We utilize a dual-typeface system to balance authority with modern tech-forwardness.

*   **Display & Headlines (Manrope):** Our "Authoritative" voice. Manrope’s geometric yet warm proportions should be used in large scales (`display-lg` to `headline-sm`) with tight letter-spacing (-0.02em) to create a commanding presence.
*   **Body & Labels (Plus Jakarta Sans):** Our "Tech-Forward" voice. This typeface offers exceptional readability at smaller scales. Use `body-lg` for editorial copy to maintain a premium feel.

**Hierarchy Tip:** Always favor extreme contrast. Pair a `display-lg` headline with a `label-md` sub-header in `primary` gold to create an editorial, "poster-like" layout.

---

## 4. Elevation & Depth
Depth in this system is a result of **Tonal Layering**, not structural reinforcement.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, "inset" feel that mimics fine leatherwork or high-end architectural recessed lighting.
*   **Ambient Shadows:** If an element must "float" (e.g., a primary CTA button or a modal), use a shadow with a blur radius of `32px` or higher, at `8%` opacity. The shadow color must be a tinted version of the background, never pure black, to maintain a naturalistic feel.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at **15% opacity**. Pure, opaque borders are considered a failure of the design system's elegance.
*   **Glassmorphism & Depth:** Use semi-transparent layers to allow the rich background colors to bleed through, ensuring the UI feels integrated into the environment rather than "pasted" on top.

---

## 5. Components

### Buttons
*   **Primary:** A gradient fill (`primary` to `primary-container`) with `on-primary` text. No border. High-gloss finish.
*   **Secondary (Sovereign Glass):** A glassmorphic background with a "Ghost Border."
*   **Tertiary:** Text-only in `primary` gold with a subtle underline that expands on hover.
*   **Rounding:** Use `md` (0.375rem) for a sharp, tailored look.

### Cards & Containers
*   **Forbid Dividers:** Do not use lines to separate content within a card. Use `body-md` vs `label-sm` typographic hierarchy and vertical spacing.
*   **Hover State:** Transition the background from `surface-container` to `surface-bright` and increase the "Ghost Border" opacity to 30%.

### Input Fields
*   **Styling:** Inputs should be `surface-container-highest` with a bottom-only `outline-variant` (20% opacity). When focused, the bottom border glows with a `primary` gold gradient.
*   **Feedback:** Error states use `error` (#ffb4ab) but maintain the glassmorphic background to stay within the brand's visual language.

### Immersive Components
*   **The "Sovereign Header":** A full-bleed hero section using `display-lg` typography that overlaps a high-resolution, culturally relevant image or a 3D glass texture.
*   **Navigation:** A fixed, floating glass bar at the top or bottom of the viewport with a `40%` opacity `surface-container-lowest` fill.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts to lead the eye through the "cultural" narrative.
*   **Do** lean heavily on the `surface-container` tiers to create depth.
*   **Do** use `primary` gold sparingly—it is a "light source" in the dark environment.
*   **Do** ensure all "glass" elements have a `backdrop-blur` for legibility.

### Don't:
*   **Don't** use 1px solid borders to separate sections.
*   **Don't** use standard "drop shadows" with high opacity.
*   **Don't** use pure white (#FFFFFF) for text; use `on-surface` (#e2e2e2) to prevent eye strain against the deep black.
*   **Don't** clutter the screen. If in doubt, add more whitespace. High-end design "breathes."