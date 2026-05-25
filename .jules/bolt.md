## 2025-02-23 - 2D Grid Deep Cloning Performance Bottleneck
**Learning:** Using `JSON.parse(JSON.stringify())` to deep clone 2D arrays (like `playGrid`) in high-frequency operations such as the A* pathfinder (which creates thousands of state clones per frame) causes severe performance bottlenecks in this architecture.
**Action:** Always use `.map(row => row.slice())` when cloning 2D arrays (e.g. game grids) instead of JSON serialization methods to prevent massive slowdowns in simulation and pathfinding loops.
