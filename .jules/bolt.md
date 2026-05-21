## 2024-06-25 - 2D Array Cloning Bottleneck
**Learning:** The game heavily relies on 2D arrays for the game grid and uses deep cloning extensively (especially in the `pathfinder.js` simulation). The previous approach of using `JSON.parse(JSON.stringify())` created a significant performance bottleneck due to serialization overhead.
**Action:** Always use `.map(row => row.slice())` when cloning simple 2D arrays containing primitive types (like tile IDs) to improve performance.
