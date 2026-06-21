import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_presets = """const PRESETS = [
  { id: 'level-1', name: 'Mushroom Forest', grid: createMushroomForestGrid(), playerSpawn: { col: 5, row: 27 }, goalPos: { col: 55, row: 19 }, isPreset: true },
  { id: 'level-2', name: 'Platformer Basics', grid: createPlatformerGrid(), playerSpawn: { col: 5, row: 27 }, goalPos: { col: 48, row: 27 }, isPreset: true },
  { id: 'level-3', name: 'Sky Climb', grid: createSkyClimbGrid(), playerSpawn: { col: 4, row: 27 }, goalPos: { col: 46, row: 6 }, isPreset: true },
  { id: 'level-4', name: 'Singularity Sprint', grid: createSingularitySprintGrid(), playerSpawn: { col: 5, row: 10 }, goalPos: { col: 52, row: 18 }, isPreset: true },
  { id: 'level-5', name: 'Ghostly Demolition', grid: createGhostlyDemolitionGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-6', name: 'Pinball Chaos V2', grid: createBallLevelGrid(), playerSpawn: { col: 58, row: 20, charId: 'ball' }, goalPos: { col: 29, row: 3 }, isPreset: true }
];"""

# Replace the entire PRESETS array
content = re.sub(r'const PRESETS = \[.*?\];', new_presets, content, flags=re.DOTALL)

with open('src/levels.js', 'w') as f:
    f.write(content)
