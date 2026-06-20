with open('src/engine.js', 'r') as f:
    content = f.read()

# Make sure not to replace the implementation of setTile inside Level class!
# Wait, this is engine.js, not level.js.
# In engine.js, `this.level.setTile` is called multiple times.
new_content = content.replace('this.level.setTile(', 'this.setTile(')

# Wait, `setTile` at line 217 in engine.js is:
#  setTile(col, row, value) { ... }
# And inside it: `this.level.setTile(col, row, value);`
# If we replace ALL, then `this.level.setTile` inside `setTile` becomes `this.setTile`, creating an infinite loop!
# We MUST fix that one back!

new_content = new_content.replace("""
  setTile(col, row, value) {
    if (this.mode === CONFIG.MODE_PLAY && this.playGrid) {
      if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
        this.playGrid[row][col] = value;
      }
    } else {
      this.setTile(col, row, value);
    }
  }""", """
  setTile(col, row, value) {
    if (this.mode === CONFIG.MODE_PLAY && this.playGrid) {
      if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
        this.playGrid[row][col] = value;
      }
    } else {
      this.level.setTile(col, row, value);
    }
  }""")

with open('src/engine.js', 'w') as f:
    f.write(new_content)

print("Engine patched!")
