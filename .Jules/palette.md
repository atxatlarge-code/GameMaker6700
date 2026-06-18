## 2024-05-25 - Missing Global Focus Styles for Keyboard Accessibility
**Learning:** The application's design system lacked a global focus state for interactive elements (`:focus-visible`), which made keyboard navigation impossible as users couldn't see which element had focus.
**Action:** Added a reusable global `*:focus-visible` rule in `style.css` using the primary theme color (`var(--primary)`) with a solid outline and offset. This establishes a baseline accessibility standard for all current and future interactive components in the app.

## 2024-06-08 - Added Disabled State for Delete Level Button
**Learning:** Preset levels in the game cannot be deleted, but the UI previously allowed users to click the delete button and would only tell them it was not allowed via a blocking system `alert()` after the click. This is a disruptive interaction pattern and provides poor feedforward accessibility.
**Action:** Implemented a visual disabled state on the `btn-del-level` button when a preset level is selected. Removed the reactive alert and replaced it with an updated ARIA label and `title` tooltip explaining *why* the button is disabled, improving clarity without blocking user flow.

## 2024-06-25 - Auto-selecting Text and Keyboard Accessibility in Modals
**Learning:** When users edit existing names (like level names), clicking into an input and manually deleting the old text is friction. Furthermore, forcing users to click "Save" or "Cancel" breaks keyboard flow.
**Action:** Implemented `input.select()` immediately after `input.focus()` when opening the rename modal so users can start typing to instantly replace the text. Added keyboard listeners so `Enter` saves and `Escape` cancels, aligning with standard OS modal behavior and drastically improving efficiency.
