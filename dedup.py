import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# We will remove the duplicate createLevel3Grid and createLevel4Grid.
# Find the second occurrence and remove it.

def remove_second(func_name, content):
    first = content.find(f"function {func_name}() {{")
    if first != -1:
        second = content.find(f"function {func_name}() {{", first + 1)
        if second != -1:
            # find the end of the function (the closing brace at the same indentation)
            # Actually, we know they are followed by either another function or const PRESETS.
            next_func = content.find("function createLevel", second + 1)
            next_const = content.find("const PRESETS", second + 1)
            end = min(x for x in [next_func, next_const] if x != -1)
            if end != -1:
                content = content[:second] + content[end:]
    return content

content = remove_second("createLevel3Grid", content)
content = remove_second("createLevel4Grid", content)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Removed duplicates.")
