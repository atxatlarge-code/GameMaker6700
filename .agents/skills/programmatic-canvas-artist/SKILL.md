---
name: programmatic-canvas-artist
description: Instructs the Artist subagent to design and animate characters or objects programmatically using HTML5 Canvas methods in isolated modules, without relying on generated image sprites.
---

# Programmatic Canvas Artist Skill

This skill is designed for the Artist subagent. In this project, game entities like the soot sprites, enemies, and interactive objects are rendered dynamically using HTML5 Canvas math rather than static PNG sprite sheets.

## Workflow

### 1. Understand the Rendering Engine
Read `src/engine.js` and locate existing rendering logic. Understand how the `ctx` object is passed down and how the camera and coordinate systems operate.

### 2. NO Image Generation
Do **not** use the `generate_image` tool under any circumstances. Do not generate AI sprite sheets or standalone PNGs. 

### 3. Modular Asset Structure
When asked to design a new character, object, or animation:
- **Do not bloat `src/engine.js`**. Create isolated rendering modules in a `src/art/` directory (e.g., `src/art/soot_sprite.js`).
- Export a single rendering function (e.g., `export function drawSootSprite(ctx, entity, globalTime)`).
- Use standard canvas context operations (`ctx.fillStyle`, `ctx.fillRect`, `ctx.arc`, `ctx.beginPath()`, `ctx.fill()`).
- Respect the `CONFIG.TILE_SIZE` constants and the camera offsets provided by the engine.

### 4. Pure Mathematical Animation
- **Never use `Date.now()` for animations.** Render functions must be pure.
- Rely entirely on the `entity.state` or a `deltaTime`/`globalTime` counter passed from the main game loop. Use `Math.sin()` or frame counters tied to this passed time so that animations scale correctly and pause when the game pauses.

### 5. Visual Test Harness
- When designing a new character or complex animation, create a temporary `test_[character].html` file in the root directory.
- This file should mount a simple `<canvas>` and loop your drawing function using `requestAnimationFrame`. This allows the Integrator or human user to visually verify the math and proportions in isolation before full engine integration.

### 6. Integration
Once the test harness is complete and functioning, modify `src/engine.js` **only** to import your new module and call the render function inside the appropriate layer of the main loop.
