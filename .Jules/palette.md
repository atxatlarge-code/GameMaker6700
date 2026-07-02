## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2024-06-08 - Added Disabled State for Delete Level Button
**Learning:** Preset levels in the game cannot be deleted, but the UI previously allowed users to click the delete button and would only tell them it was not allowed via a blocking system `alert()` after the click. This is a disruptive interaction pattern and provides poor feedforward accessibility.
**Action:** Implemented a visual disabled state on the `btn-del-level` button when a preset level is selected. Removed the reactive alert and replaced it with an updated ARIA label and `title` tooltip explaining *why* the button is disabled, improving clarity without blocking user flow.

## 2024-07-02 - Async UI Feedback
**Learning:** Adding loading spinners and disabled states to buttons during asynchronous operations improves the user experience significantly by providing visual feedback, but it's critical to wrap the async call in a `try...finally` block.
**Action:** When adding loading states to buttons, always wrap the async logic in a `try...finally` block to guarantee the original UI state is restored and the button re-enabled even if an error occurs.
