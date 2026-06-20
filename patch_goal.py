import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# Replace goalPos for The Fundamentals
content = re.sub(r"goalPos:\s*\{[^}]*row:\s*19\s*\}", "goalPos: { col: 55, row: 21 }", content)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Updated goalPos.")
