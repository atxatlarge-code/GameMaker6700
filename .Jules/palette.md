## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2026-06-03 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** The application's UI relies heavily on icon-only buttons (e.g., FontAwesome icons) with `title` attributes for tooltips, but these elements frequently lacked `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Added `aria-label` attributes to all icon-only buttons across HTML files, mapping their existing `title` values to `aria-label` to ensure consistent and accessible descriptions for assistive technologies.
