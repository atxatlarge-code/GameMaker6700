## 2024-05-15 - [Deep Copy 2D Arrays]
**Learning:** Using `JSON.parse(JSON.stringify())` to clone large 2D grids repeatedly (e.g. in `level.js`, `engine.js`, and `pathfinder.js`) severely slows down performance, especially in recursive/pathfinding functions.
**Action:** Always use `.map(row => row.slice())` for shallow-cloning 2D arrays containing primitives. It performs significantly faster.
