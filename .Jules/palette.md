## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.
## 2024-05-25 - ARIA Labels for Icon-Only Buttons
**Learning:** Found several buttons in `index.html` containing only `<i>` fontawesome elements and a `title`, which lacked semantic descriptions (`aria-label`) to support screen readers effectively. The missing labels span various interface parts including console controls, editor pan tools, and dialog actions.
**Action:** Implemented `aria-label` attributes on all icon-only buttons aligning with their `title` values to establish baseline semantic access for interactive elements.
