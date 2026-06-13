## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.
## 2024-05-13 - Icon-only Buttons Missing Screen Reader Context
**Learning:** Icon-only buttons relying solely on `title` attributes provide visual tooltips for sighted mouse users but don't consistently broadcast their purpose to all assistive technologies unless an explicit `aria-label` is present.
**Action:** Always include an `aria-label` attribute on buttons where the text content is empty or only consists of icons, ensuring the text clearly describes the button's action.
