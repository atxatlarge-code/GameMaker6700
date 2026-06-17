import re

def patch():
    # Fix pathfinder.js
    pathfinder_path = 'src/pathfinder.js'
    with open(pathfinder_path, 'r') as f:
        pf_content = f.read()

    # In getDiscretizedKey
    pf_content = pf_content.replace('s.x / 5', 's.player.x / 5')
    pf_content = pf_content.replace('s.y / 5', 's.player.y / 5')
    pf_content = pf_content.replace('s.vx * 2', 's.player.vx * 2')
    pf_content = pf_content.replace('s.vy * 2', 's.player.vy * 2')
    pf_content = pf_content.replace('s.isGrounded', 's.player.isGrounded')
    pf_content = pf_content.replace('s.coyoteTimer', 's.player.coyoteTimer')
    pf_content = pf_content.replace('s.jumpBufferTimer', 's.player.jumpBufferTimer')
    pf_content = pf_content.replace('s.enemies.map', 's.liveEnemies.map')

    # In getHeuristic
    pf_content = pf_content.replace('this.goalX - s.x', 'this.goalX - s.player.x')
    pf_content = pf_content.replace('this.goalY - s.y', 'this.goalY - s.player.y')

    # In step()
    pf_content = pf_content.replace('this.exploredPoints.push({ x: curr.x, y: curr.y })', 'this.exploredPoints.push({ x: curr.player.x, y: curr.player.y })')

    with open(pathfinder_path, 'w') as f:
        f.write(pf_content)


    # Fix autoplay-runner.js
    runner_path = 'autoplay-runner.js'
    with open(runner_path, 'r') as f:
        runner_content = f.read()

    runner_content = runner_content.replace('s.x / 5', 's.player.x / 5')
    runner_content = runner_content.replace('s.y / 5', 's.player.y / 5')
    runner_content = runner_content.replace('s.vx * 2', 's.player.vx * 2')
    runner_content = runner_content.replace('s.vy * 2', 's.player.vy * 2')
    runner_content = runner_content.replace('s.isGrounded', 's.player.isGrounded')
    runner_content = runner_content.replace('s.coyoteTimer', 's.player.coyoteTimer')
    runner_content = runner_content.replace('s.jumpBufferTimer', 's.player.jumpBufferTimer')
    runner_content = runner_content.replace('s.enemies.map', 's.liveEnemies.map')

    runner_content = runner_content.replace('goalX - s.x', 'goalX - s.player.x')
    runner_content = runner_content.replace('goalY - s.y', 'goalY - s.player.y')

    # Ensure engine player state extraction at the end uses correct save structure?
    # No, it just evaluates window.engine.player.x directly, so it's fine.

    with open(runner_path, 'w') as f:
        f.write(runner_content)

if __name__ == '__main__':
    patch()
    print("Key access patched.")
