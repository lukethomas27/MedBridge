# Design System Specification: Soft Medical Editorial



## 1. Overview & Creative North Star: "The Clinical Sanctuary"

This design system moves healthcare SaaS away from the sterile, rigid grids of legacy medical software and toward a high-end, editorial experience. Our Creative North Star is **"The Clinical Sanctuary"**—an interface that feels authoritative yet breathing, combining the precision of a laboratory with the serenity of a high-end wellness space.



We break the "template" look by favoring **intentional asymmetry** and **tonal depth** over structural lines. By utilizing large-scale typography and expansive whitespace, we signal to the user that the information is high-value and the platform is premium. The goal is to reduce cognitive load for healthcare professionals through a UI that feels like it was "curated" rather than just "programmed."



---



## 2. Color & Surface Philosophy

The palette is rooted in `primary` (#0042dc) and `secondary` (#006a6a), but its sophistication comes from how we layer neutrals.



### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.

* **Example:** A `surface-container-low` section sitting on a `surface` background creates a natural, soft boundary that feels architectural rather than digital.



### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Use the surface tiers to define importance:

* **Base Layer:** `surface` (#f8f9fa) for the main canvas.

* **Secondary Content:** `surface-container-low` (#f3f4f5) for sidebars or background groupings.

* **Actionable Elements:** `surface-container-lowest` (#ffffff) for cards and inputs to provide a "lifted" feel.

* **High-Detail Elements:** `surface-container-high` (#e7e8e9) for nested data tables or utility panels.



### The "Glass & Gradient" Rule

To elevate the "Soft Medical" feel, use **Glassmorphism** for floating overlays (e.g., Modals, Popovers). Use `surface-container-lowest` at 80% opacity with a `20px` backdrop-blur.

* **Signature Textures:** Apply a subtle linear gradient to main CTAs transitioning from `primary` (#0042dc) to `primary_container` (#2a5cff) at a 135-degree angle. This adds "soul" and a sense of energy to the interface.



---



## 3. Typography: The Editorial Voice

We utilize a dual-font approach to balance humanism with clinical precision.



* **Display & Headlines (Manrope):** Use `display-lg` through `headline-sm` for high-impact areas. Manrope’s geometric yet open curves provide a modern, approachable authority.

* *Direction:* Use `headline-lg` (2rem) for page titles with generous `spacing-12` (4rem) margins to create an editorial feel.

* **Body & Labels (Inter):** Use `body-md` and `body-sm` for data-heavy views. Inter is chosen for its exceptional legibility in complex medical contexts.

* *Direction:* Maintain a high contrast between `title-lg` (Inter, 1.375rem) and `body-md` (Inter, 0.875rem) to ensure clear information architecture.



---



## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often too "dirty" for a medical context. We use **Tonal Layering** to achieve depth.



* **The Layering Principle:** Instead of shadows, place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in hex value creates a soft, natural lift.

* **Ambient Shadows:** When a floating effect is required (e.g., a floating action button), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(0, 66, 220, 0.06);`. Note the blue tint in the shadow—this mimics natural light passing through medical-grade glass.

* **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at **20% opacity**. Never use 100% opaque borders.

* **Glassmorphism:** Use `backdrop-filter: blur(12px)` on all floating navigation elements to soften the edges of the layout and make it feel integrated.



---



## 5. Signature Components



### Buttons & Interaction

* **Primary:** Gradient from `primary` to `primary_container`. `rounded-full` (9999px) for a soft, pill-shaped feel. Padding: `spacing-3` (top/bottom) and `spacing-6` (left/right).

* **Secondary:** `surface-container-low` background with `primary` text. No border.

* **Tertiary:** Ghost style using `on_surface_variant` text, shifting to `surface-container-lowest` on hover.



### Cards & Data Lists

* **Constraint:** Forbid the use of horizontal divider lines (`

`).



* **Separation:** Separate list items using `spacing-4` (1.4rem) of vertical whitespace. If grouping is needed, use a subtle background shift to `surface-container-lowest` for the active item.

* **Radius:** All cards must use `rounded-xl` (1.5rem) to reinforce the "Soft Medical" atmosphere.



### Input Fields

* **Style:** `surface-container-lowest` background with a `ghost-border` (outline-variant at 20%). On focus, transition the border to `primary` at 100% opacity and add a subtle 4px `primary_fixed` outer glow.

* **Corners:** `rounded-md` (0.75rem) to maintain professional alignment while avoiding sharp "dangerous" points.



### Contextual Components (Medical AI)

* **The "Insight Chip":** Use `tertiary_container` (Healing Teal) for AI-generated insights. These should feature a `backdrop-blur` and a `rounded-lg` (1rem) corner.

* **Status Indicators:** Instead of small dots, use "Soft Badges"—large, pill-shaped `rounded-full` containers using `secondary_fixed` for a calm, non-alarming status indication.



---



## 6. Do’s and Don’ts



### Do

* **Do** use asymmetrical layouts (e.g., a wide left column for data and a narrow right column for AI insights) to break the "grid" feel.

* **Do** lean heavily on `spacing-10` and `spacing-16` for page margins to convey luxury and calm.

* **Do** use `primary_fixed_dim` for subtle hover states on interactive surfaces.



### Don't

* **Don't** use pure black (#000000) for text. Use `on_surface` (#191c1d) to maintain a soft, premium contrast.

* **Don't** use 1px dividers to separate content. Use background color blocks or whitespace.

* **Don't** use sharp corners. Anything under `rounded-md` (12px/0.75rem) is too aggressive for this system's personality.