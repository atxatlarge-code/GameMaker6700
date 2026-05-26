## 2024-05-26 - [Avoid JSON.parse(JSON.stringify) for 2D Grids]
**Learning:** Using `JSON.parse(JSON.stringify(grid))` for deep cloning 2D arrays like `playGrid` is a severe performance bottleneck, especially in pathfinding loops.
**Action:** Replaced with `.map(row => row.slice())` which is significantly faster and achieves the same deep clone for 2D arrays of primitives.
