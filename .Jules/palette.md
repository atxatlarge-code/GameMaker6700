## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2024-06-08 - Added Disabled State for Delete Level Button
**Learning:** Preset levels in the game cannot be deleted, but the UI previously allowed users to click the delete button and would only tell them it was not allowed via a blocking system `alert()` after the click. This is a disruptive interaction pattern and provides poor feedforward accessibility.
**Action:** Implemented a visual disabled state on the `btn-del-level` button when a preset level is selected. Removed the reactive alert and replaced it with an updated ARIA label and `title` tooltip explaining *why* the button is disabled, improving clarity without blocking user flow.

## 2026-06-28 - Adding loading states to async form submissions
**Learning:** The chat features ('New Thread' and 'Send Reply') lacked immediate visual feedback upon submission, allowing users to rapidly click the submit button during network delays, potentially resulting in duplicate requests.
**Action:** Implemented a standard loading state using `disabled` properties and FontAwesome spinners on `btnSubmitThread` and `btnSendReply`. Wrapped async `messageService` calls in `try...finally` blocks to guarantee state restoration.
