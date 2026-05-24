## 2024-06-19 - [Avoid JSON Serialization for 2D Primitive Arrays]
**Learning:** The game logic heavily relied on `JSON.parse(JSON.stringify(grid))` for deep-cloning 2D arrays (`playGrid`, `grid`). This serialization causes significant performance bottlenecks (~10x slower on 50x50 grids) due to string allocation overhead, despite the arrays only containing primitives (numbers/strings).
**Action:** Always use `.map(row => row.slice())` when deep cloning 2D primitive arrays instead of JSON serialization to drastically improve performance while maintaining readability.
