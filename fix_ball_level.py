import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_grid = """function createBallLevelGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor and ceiling
  for(let c=0; c<60; c++) {
    grid[0][c] = 1;
    grid[29][c] = 1;
  }
  // Left and Right walls
  for(let r=0; r<30; r++) {
    grid[r][0] = 1;
    grid[r][59] = 1;
  }

  // Giant funnel towards the center
  for(let i=0; i<15; i++) {
    // left stairs
    grid[28 - i][1 + i] = 1;
    // right stairs
    grid[28 - i][58 - i] = 1;
  }
  
  // Trampolines at the bottom funnel to bounce you back up!
  for(let c=16; c<=20; c++) {
    grid[28][c] = 2; // Trampoline
  }
  for(let c=39; c<=43; c++) {
    grid[28][c] = 2; // Trampoline
  }
  
  // The central pit of spikes
  for(let c=21; c<=38; c++) {
    grid[29][c] = 4; // Spikes
    grid[28][c] = 4; // Spikes
  }
  
  // A safety island in the middle of the pit with a big trampoline
  for(let c=28; c<=31; c++) {
    grid[28][c] = 1;
    grid[27][c] = 2; // Mega bounce
  }
  
  // Bumpers scattered to create chaotic bounces
  grid[20][10] = 28;
  grid[22][15] = 28;
  grid[15][20] = 28;
  grid[18][30] = 28;
  grid[15][40] = 28;
  grid[22][45] = 28;
  grid[20][50] = 28;
  grid[10][25] = 28;
  grid[10][35] = 28;

  // Some floating platforms to land on
  grid[12][10] = 1; grid[12][11] = 1;
  grid[12][48] = 1; grid[12][49] = 1;
  
  // Gravity Wells (60) to pull the ball in crazy directions
  grid[8][15] = 60;
  grid[8][45] = 60;
  
  // Wind blowing up in the center column
  for(let r=5; r<=24; r++) {
    for(let c=29; c<=30; c++) {
      grid[r][c] = 36; // Wind Up
    }
  }

  // Goal platform at the top middle
  for(let c=28; c<=31; c++) {
    grid[4][c] = 1;
  }
  
  // Slime on the upper walls to catch you
  for(let r=1; r<15; r++) {
    grid[r][1] = 32;
    grid[r][58] = 32;
  }

  return grid;
}"""

# Use regex to replace the old function entirely
pattern = re.compile(r"function createBallLevelGrid\(\) \{.*?\n\}", re.DOTALL)
new_content = pattern.sub(new_grid, content)

with open('src/levels.js', 'w') as f:
    f.write(new_content)

print("Level updated!")
