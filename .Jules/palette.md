## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2024-06-08 - Added Disabled State for Delete Level Button
**Learning:** Preset levels in the game cannot be deleted, but the UI previously allowed users to click the delete button and would only tell them it was not allowed via a blocking system `alert()` after the click. This is a disruptive interaction pattern and provides poor feedforward accessibility.
**Action:** Implemented a visual disabled state on the `btn-del-level` button when a preset level is selected. Removed the reactive alert and replaced it with an updated ARIA label and `title` tooltip explaining *why* the button is disabled, improving clarity without blocking user flow.

## 2024-06-24 - Missing Loading States for Async Thread Actions
**Learning:** The community mailbox lacked visual feedback during asynchronous network operations (creating a thread or sending a reply). This violated usability heuristics for visibility of system status, potentially leading to users double-clicking submit buttons and accidentally creating duplicate database entries.
**Action:** Implemented a reusable `:disabled` styling pattern for primary and icon buttons (`.primary-btn` and `.send-btn`) in `style.css`. Hooked this up to `src/main.js` to temporarily swap the button HTML to a FontAwesome spinner (`<i class="fa-solid fa-spinner fa-spin"></i>`) and disable the button while `messageService` async operations are awaited.
