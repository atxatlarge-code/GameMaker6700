import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# The PRESETS array is at the bottom of the file
# We will split on "const PRESETS = ["
parts = content.split('const PRESETS = [\n')
before_presets = parts[0]
presets_str = parts[1]

# Now we need to extract the individual presets.
# They are dictionaries like:
#   {
#     id: 'level-X',
#     ...
#   },
# Let's split them by finding "  {\n    id: "
preset_blocks = re.split(r'(?=\n  \{\n    id:)', presets_str)

# Some items might be empty or the closing brackets
# Filter and sort
parsed_presets = []
closing = ""

for block in preset_blocks:
    if "id: 'level-3'" in block:
        level3 = block
    elif "id: 'level-4'" in block:
        level4 = block
    elif "id: 'level-1'" in block:
        level1 = block
    elif "id: 'level-2'" in block:
        level2 = block
    else:
        closing = block

# Reorder
ordered_presets = level1 + level2 + level3 + level4 + closing

new_content = before_presets + 'const PRESETS = [\n' + ordered_presets

with open('src/levels.js', 'w') as f:
    f.write(new_content)

print("Presets reordered!")
