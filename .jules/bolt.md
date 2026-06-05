## 2025-02-27 - Fast 2D Array Cloning
**Learning:** The game logic heavily relies on 2D arrays (e.g., `playGrid` in `src/pathfinder.js`, `engine.js`, and `level.js`). When deep cloning these grids, using `JSON.parse(JSON.stringify())` causes severe performance bottlenecks, particularly in areas heavily simulating states like `pathfinder.js`.
**Action:** Use `.map(row => row.slice())` instead of `JSON.parse(JSON.stringify())` to clone these 2D arrays to prevent these severe performance bottlenecks.

## 2024-06-25 - Caching fScore in Pathfinder
**Learning:** Recomputing the heuristic (`getHeuristic`) during `insertSorted` compares causes unnecessary redundant math (`Math.sqrt`) during state exploration in the pathfinder.
**Action:** Caching `fScore` (`path.length * 5 + getHeuristic`) on the state object prior to insertion significantly reduces redundant operations, optimizing A* sort without changing algorithm correctness.

## 2025-03-05 - Array Spreading in Deep Search Loops
**Learning:** In the A* pathfinding algorithm (`src/pathfinder.js`), duplicating the action history array using the spread operator (`[...curr.path, act]`) in every loop iteration causes massive Garbage Collection overhead and memory exhaustion (OOM), as paths grow to hundreds of items across 20k+ iterations. Array spreading scales at O(N) memory complexity per expansion.
**Action:** Use a backwards-referencing linked list (`pathNode: { act, parent: curr.pathNode }`) when exploring deep states in A*, scaling memory at O(1) per expansion. Traverse backwards to reconstruct the path array only once a goal is found.
