import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# I will find the PRESETS array, remove the trailing blocks, and reconstruct it properly.
# Find "const PRESETS = [" and split
parts = content.split('const PRESETS = [')
before_presets = parts[0]
after_presets = parts[1]

# Now, we need to extract level 1, 2, 3, 4 properly.
# We know their strings perfectly.
def get_level(l_id):
    start_idx = content.find("  {\n    id: '" + l_id + "'")
    if start_idx == -1:
        return ""
    end_idx = content.find("  },", start_idx) + 4
    return content[start_idx:end_idx]

level1 = get_level('level-1')
level2 = get_level('level-2')
level3 = get_level('level-3')
level4 = get_level('level-4')

# Where does the presets array end?
# Find the end of PRESETS: "];\n\nfunction createTinyTunnelsGrid()"
end_of_presets_idx = content.find('];\n\nfunction createTinyTunnelsGrid()')

if end_of_presets_idx != -1:
    # Get the rest of the file
    rest_of_file = content[end_of_presets_idx:]
    # But wait, level3 and level4 are currently dumped at the end of the file.
    # Let's find "class LevelManager {" and its end.
    # Actually, `content` has `{ id: 'level-3', ...` appended at the very end after LevelManager.
    # We can just truncate everything after `export class LevelManager { ... }`
    
    # Let's find where LevelManager ends.
    lm_start = content.find('export class LevelManager {')
    lm_end = content.find('}\n', lm_start) + 2
    
    rest_of_file = content[end_of_presets_idx:lm_end]
    
    # Reconstruct
    new_presets = '\n' + level1 + '\n' + level2 + '\n' + level3 + '\n' + level4 + '\n'
    
    new_content = before_presets + 'const PRESETS = [' + new_presets + rest_of_file
    
    with open('src/levels.js', 'w') as f:
        f.write(new_content)
    print("Syntax fixed!")
else:
    print("Could not find ];")
