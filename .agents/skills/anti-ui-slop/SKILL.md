---
name: anti-ui-slop
description: Anti-UI-Slop for Budget Fort. Prevents AI from generating generic, disconnected UI. Enforces strict consistency with Angular Material design system, SCSS+BEM, and established Budget Fort UI patterns. USE WHEN creating new components, redesigning layouts, or performing UI review.
---

# Anti-UI-Slop — Stop Generic AI Interfaces

**Do not let AI generate generic, template-like interfaces in Budget Fort.**

Every new component must harmonize with the existing design system, employ Angular Material components according to established project patterns, and adhere strictly to SCSS + BEM conventions.

## Budget Fort Design System Context

- **Framework:** Angular Material (`mat-card`, `mat-table`, `mat-dialog`, `mat-form-field`, `mat-toolbar`, `mat-sidenav`)
- **Styling:** SCSS + BEM (`&__element`, `&--modifier`)
- **Style Files:** `styleUrl: './*.component.scss'` — NEVER inline `styles`
- **Color Palette:** Angular Material theme tokens + CSS custom properties
- **Typography:** Angular Material typography scale
- **Component Architecture:** Container/Presenter pattern, inline template, separate SCSS
- **Layout:** CSS Grid + Flexbox, responsive breakpoints

## Guidelines

### Design From the Product, Not Generic Trends

Before authoring any new component:
1. Inspect existing components in the target feature module.
2. Review shared presentation components in `libs/*/ui-*`.
3. Check how similar components configure Angular Material.
4. Study existing SCSS patterns and class namings.

**NEVER invent an ad-hoc design system.** Always extend the existing one.

### New Component Checklist

- [ ] Uses existing Angular Material components
- [ ] Inline template (`template: \`...\``)
- [ ] Dedicated SCSS stylesheet (`styleUrl: './*.component.scss'`)
- [ ] BEM naming convention: `&__element`, `&--modifier`
- [ ] Container/Presenter architecture (for data-driven views)
- [ ] Complete state coverage: loading, empty, error, and success
- [ ] Structural responsiveness (not just fluid scaling)
- [ ] Accessibility: contrast, semantic labels, visible focus rings, ARIA roles
- [ ] i18n: all user-facing strings referenced via `@@` translation tags

### UI Review Checklist

- [ ] Does the component visually integrate with the rest of the application?
- [ ] Does it reuse standard Material primitives?
- [ ] Are spacing, typography, and colors consistent?
- [ ] Is BEM nesting correctly implemented?
- [ ] Are styles properly scoped with zero bleed?
- [ ] Are all screen states (loading, empty, error) handled?
- [ ] Is the layout stable on mobile viewports (< 768px)?

## Anti-Patterns — NEVER Do This

| Bad | Good |
|-----|------|
| Inventing custom input/dialog controls | Use `MatDialog`, `MatFormField`, `MatTable` |
| Inline styles (`styles: [...]`) | External stylesheet (`styleUrl: './*.component.scss'`) |
| Arbitrary CSS class naming | Strict BEM syntax (`&__element`, `&--modifier`) |
| Generic "trendy" card layouts | Cohesive layouts matching Budget Fort views |
| Hardcoded hex colors | Use theme CSS variables and tokens |
| Missing empty or loading states | Every data-driven view provides loading + empty states |
| Skipping i18n | Every user string localized via `@@` translation keys |

## Verification Gate

After generating a component, verify:
1. Standard Material primitives are utilized.
2. Styles reside in SCSS, never inline.
3. BEM class conventions are followed.
4. Visual design harmonizes with existing screens.
5. All 4 UI states are implemented.
6. Localization entries exist in `.xlf`.
