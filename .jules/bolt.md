## 2025-02-27 - Fast 2D Array Cloning
**Learning:** The game logic heavily relies on 2D arrays (e.g., `playGrid` in `src/pathfinder.js`, `engine.js`, and `level.js`). When deep cloning these grids, using `JSON.parse(JSON.stringify())` causes severe performance bottlenecks, particularly in areas heavily simulating states like `pathfinder.js`.
**Action:** Use `.map(row => row.slice())` instead of `JSON.parse(JSON.stringify())` to clone these 2D arrays to prevent these severe performance bottlenecks.

## 2024-06-25 - Caching fScore in Pathfinder
**Learning:** Recomputing the heuristic (`getHeuristic`) during `insertSorted` compares causes unnecessary redundant math (`Math.sqrt`) during state exploration in the pathfinder.
**Action:** Caching `fScore` (`path.length * 5 + getHeuristic`) on the state object prior to insertion significantly reduces redundant operations, optimizing A* sort without changing algorithm correctness.

## 2026-06-16 - A* Search Queue Insertion Bottleneck
**Learning:** In A* pathfinding mechanisms with large state spaces (like `autoplay-runner.js` and `src/pathfinder.js`), using an array `splice` to maintain sorted order within an `openSet` causes a massive O(n) bottleneck during `push` insertions. This severely degrades performance over thousands of iterations.
**Action:** Replace `insertSorted(array, item, compareFn)` array splices with an implementation of a Min-Heap `PriorityQueue` which maintains O(log N) insertion complexity and avoids array shifting.
