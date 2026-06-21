import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_func = """function createLevel5Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=5; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  // Ice slide 1
  for(let c=6; c<=12; c++) {
    grid[28][c] = 17; // Ice
    grid[29][c] = 7;
  }
  
  // Lava gap
  for(let c=13; c<=15; c++) {
    grid[28][c] = 0; grid[29][c] = 3; // Lava
  }
  
  // Ice platform up high
  for(let c=16; c<=20; c++) {
    grid[25][c] = 17; // Ice
  }
  
  // Water gap with spikes
  for(let c=21; c<=24; c++) {
    grid[28][c] = 31; // Water
    grid[29][c] = 4; // Spikes underneath water
  }
  
  // Safe ground with turret
  for(let c=25; c<=30; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  grid[27][30] = 54; // Turret
  
  // Ice platform jumping
  for(let c=33; c<=35; c++) { grid[24][c] = 17; }
  for(let c=38; c<=40; c++) { grid[20][c] = 17; }
  for(let c=44; c<=46; c++) { grid[24][c] = 17; }
  
  // Goal safe ground
  for(let c=49; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

"""

# Insert function right before const PRESETS
content = content.replace("const PRESETS = [", new_func + "const PRESETS = [")

# Add preset to PRESETS array
new_preset = """  {
    id: 'level-5',
    name: 'The Elements',
    grid: createLevel5Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 27 },
    isPreset: true,
  }
];"""

content = re.sub(r'\];$', new_preset, content, flags=re.MULTILINE)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Level 5 added to levels.js")
