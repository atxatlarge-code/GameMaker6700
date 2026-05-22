## 2026-05-22 - Array deep clone optimization for 2D grids
**Learning:** Using `JSON.parse(JSON.stringify(grid))` for deep cloning simple 2D arrays (like level grids) is a severe performance bottleneck, especially in pathfinding logic where state is cloned repeatedly.
**Action:** Always use `.map(row => row.slice())` when cloning 2D arrays of primitive values. It reduces cloning time by ~65-70% (~677ms to ~214ms per 10k iterations).
