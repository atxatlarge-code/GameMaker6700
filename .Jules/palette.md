## 2024-05-24 - Missing Focus Styles for Keyboard Nav
**Learning:** The application uses `outline: none;` on many interactive elements (`:focus` state) without providing custom focus-visible styles. This causes keyboard users to lose track of where they are on the page. Adding `focus-visible` ring or outline is necessary for accessibility.
**Action:** Enhance focus states for keyboard users (`focus-visible`) specifically on buttons/inputs when `outline: none` is used.
