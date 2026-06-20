---
name: hand-drawn-animator
description: Creates hand-drawn 2D sprite animations for game objects using generate_image and a sprite slicing script.
---

# Hand-Drawn Animator Skill

This skill allows you to generate hand-drawn style animations for game objects in the project.

## Workflow

1. **Generate the Sprite Sheet**:
   Use the `generate_image` tool to create a sprite sheet. Use a prompt similar to this to ensure consistent framing and a clean background:
   > "A sprite sheet of a hand-drawn 2D cartoon animation of [OBJECT], [ACTION], [COLS]x[ROWS] grid, isolated on a clean white background, consistent art style, no text"
   
   *Example*: `"A sprite sheet of a hand-drawn 2D cartoon animation of a bouncing slime, 4x1 grid, isolated on a clean white background, consistent art style, no text"`
   
   Save the image locally.

2. **Slice the Sprite Sheet**:
   Use the included Python script to automatically slice the sprite sheet into individual frames and make the white background transparent.
   
   ```bash
   python3 .agents/skills/hand-drawn-animator/scripts/sprite_slicer.py \
       --input /absolute/path/to/generated_image.png \
       --output_dir /Users/jaketrigg/Projects/GameMaker6700/assets/sprites/<object_name> \
       --prefix <object_name> \
       --rows <rows> \
       --cols <cols> \
       --remove_bg
   ```

3. **Integrate into the Game**:
   Update the relevant game objects (in `index.html` or JS files) to load the newly generated frame images and cycle through them during updates.
