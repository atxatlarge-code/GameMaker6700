## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2024-06-08 - Added Disabled State for Delete Level Button
**Learning:** Preset levels in the game cannot be deleted, but the UI previously allowed users to click the delete button and would only tell them it was not allowed via a blocking system `alert()` after the click. This is a disruptive interaction pattern and provides poor feedforward accessibility.
**Action:** Implemented a visual disabled state on the `btn-del-level` button when a preset level is selected. Removed the reactive alert and replaced it with an updated ARIA label and `title` tooltip explaining *why* the button is disabled, improving clarity without blocking user flow.
## 2024-07-02 - Icon-only buttons accessibility pattern
**Learning:** Found multiple icon-only buttons across `index.html` and `mobile.html` lacking explicit ARIA labels, which impacts screen reader usage. This includes toolbar buttons like "Parallax" or "Chat", game buttons like "Pan Up", and popup action buttons.
**Action:** Consistently use `aria-label` matching the `title` attribute for all `.icon-only-btn` or similar icon-centric interactive elements to ensure full accessibility coverage.
