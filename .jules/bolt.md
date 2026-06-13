## 2025-02-27 - Fast 2D Array Cloning
**Learning:** The game logic heavily relies on 2D arrays (e.g., `playGrid` in `src/pathfinder.js`, `engine.js`, and `level.js`). When deep cloning these grids, using `JSON.parse(JSON.stringify())` causes severe performance bottlenecks, particularly in areas heavily simulating states like `pathfinder.js`.
**Action:** Use `.map(row => row.slice())` instead of `JSON.parse(JSON.stringify())` to clone these 2D arrays to prevent these severe performance bottlenecks.

## 2024-06-25 - Caching fScore in Pathfinder
**Learning:** Recomputing the heuristic (`getHeuristic`) during `insertSorted` compares causes unnecessary redundant math (`Math.sqrt`) during state exploration in the pathfinder.
**Action:** Caching `fScore` (`path.length * 5 + getHeuristic`) on the state object prior to insertion significantly reduces redundant operations, optimizing A* sort without changing algorithm correctness.

## 2024-05-24 - [Pathfinder A* Array Insertion Bottleneck]
**Learning:** The A* search openSet in `src/pathfinder.js` used a custom binary search `insertSorted` which relied on `Array.splice()`. Even though the search was O(log N), the insertion step shifting memory made it effectively O(N). This became a massive bottleneck causing high memory usage and taking ~8s for 179 iterations.
**Action:** Always replace O(N) Array.splice() insertions in intensive search loops (like A*) with a Min-Heap/Priority Queue class, changing the complexity to purely O(log N).
