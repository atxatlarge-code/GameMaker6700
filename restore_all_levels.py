import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# 1. Remove all old createLevelXGrid functions to start clean
for i in range(1, 11):
    pattern = rf'function createLevel{i}Grid\(\) \{{.*?\n\}}'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

# 2. Re-read all grids from my previous scripts
grids = ""
scripts = [
    'fix_all.py', # contains 1-5
    'add_level6.py',
    'add_level7.py',
    'add_level8.py',
    'add_level9.py',
    'add_level10.py'
]

level1_5 = open('fix_all.py').read()
match = re.search(r'grids = """(.*?)"""\n\npresets', level1_5, re.DOTALL)
if match:
    grids += match.group(1).strip() + "\n\n"

for s in scripts[1:]:
    script_content = open(s).read()
    match = re.search(r'function createLevel\d+Grid\(\) \{.*?\n\}', script_content, re.DOTALL)
    if match:
        grids += match.group(0) + "\n\n"

# 3. Create the perfect PRESETS array
presets = """const PRESETS = [
  { id: 'level-1', name: 'The Fundamentals', grid: createLevel1Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-2', name: 'Puzzles & Pathways', grid: createLevel2Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-3', name: 'Demolition & Danger', grid: createLevel3Grid(), enemies: [{ id: 'e1', col: 42, row: 26, speed: 1.8, patrolRange: 5, type: 'basic' }], playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-4', name: 'Hostile Territory', grid: createLevel4Grid(), enemies: [{ id: 'e1', col: 19, row: 24, speed: 0, patrolRange: 0, type: 'worm' }, { id: 'e2', col: 33, row: 19, speed: 0, patrolRange: 0, type: 'bat' }, { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }], playerSpawn: { col: 2, row: 24 }, goalPos: { col: 57, row: 24 }, isPreset: true },
  { id: 'level-5', name: 'The Elements', grid: createLevel5Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-6', name: 'Industrial Complex', grid: createLevel6Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-7', name: 'Momentum & Trajectory', grid: createLevel7Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-8', name: 'Quantum Facility', grid: createLevel8Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, portal1: { col: 5, row: 27 }, portal2: { col: 15, row: 27 }, isPreset: true },
  { id: 'level-9', name: 'Powerup Playground', grid: createLevel9Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-10', name: 'The Final Gauntlet', grid: createLevel10Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 57, row: 27 }, isPreset: true }
];"""

start = content.find('const PRESETS = [')
end = content.find('];', start) + 2

if start != -1 and end != -1:
    before = content[:start]
    after = content[end:]
    
    with open('src/levels.js', 'w') as f:
        f.write(before + grids + presets + after)
    print("SUCCESS: Restored levels 1-10 to PRESETS!")
else:
    print("FAILED to find PRESETS.")
