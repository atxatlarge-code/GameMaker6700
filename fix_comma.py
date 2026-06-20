with open('src/levels.js', 'r') as f:
    content = f.read()

content = content.replace("}\n  {\n    id: 'level-2'", "},\n  {\n    id: 'level-2'")

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Fixed comma.")
