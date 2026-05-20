# Autoplay Game Runner

This project contains a programmatic level solver and autoplay runner that automatically plays levels using an A* search algorithm and captures screenshots of the progress.

## Prerequisites

Make sure you have dependencies installed and the game server running:

```bash
# Install dependencies (puppeteer-core)
npm install

# Start the game server (if not already running)
python3 -m http.server 8085
```

## Running the Autoplay

You can run the runner script from your terminal:

```bash
# Run headless on your custom level (saves screenshots to ./screenshots_autoplay/)
node autoplay-runner.js --level="Mushroom Forest (Custom)"

# Run on a preset level
node autoplay-runner.js --level="Platformer Basics"

# Watch the AI solve and play the level in a visible browser window
node autoplay-runner.js --level="Mushroom Forest (Custom)" --headful
```

## How it Works

1. **Local Level Injection**: The script reads the level data from `custom_levels.json` and injects it into the browser's `localStorage`.
2. **A* Pathfinder**: Runs a fast, physics-accurate A* search inside the game engine's context in the browser. It branches at 5-frame action intervals (e.g. Right, Left, Jump, Wait) to find the shortest path of inputs to the goal.
3. **Real-time Playback**: It hooks the solved key sequence into the engine's update loop to play back the level.
4. **Milestone Screenshots**: Captures viewport screenshots at 0%, 25%, 50%, 75%, and 100% of the path length. Screenshots are stored in the `screenshots_autoplay/` folder.
