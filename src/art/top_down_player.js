export function drawTopDownPlayer(ctx, entity, globalTime, isTrail = false) {
    const { x = 0, y = 0, width = 32, height = 32, facing = 'right', vx = 0, vy = 0, alpha = 1, skin = 'default', theme = 'default', isGrounded = false, scaleX = 1, scaleY = 1, tiltAngle = 0 } = entity;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Position center of the box
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(scaleX, scaleY);
    ctx.rotate(tiltAngle);

    // Dynamic hovering/bobbing based on time
    const hoverY = Math.sin(globalTime / 150) * 2;
    ctx.translate(0, hoverY);

    // If facing left, we flip horizontally
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, height / 2 + 6, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack / Thruster Pack
    ctx.fillStyle = '#1e293b'; // Dark gray
    ctx.beginPath();
    ctx.roundRect(-10, -8, 20, 24, 4);
    ctx.fill();

    // Glowing thrusters
    const thrustGlow = Math.abs(Math.sin(globalTime / 100)) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(56, 189, 248, ${thrustGlow})`; // Cyan glow
    ctx.beginPath();
    ctx.arc(-5, 16, 4, 0, Math.PI * 2);
    ctx.arc(5, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    // Inner thruster bright spots
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(-5, 16, 2, 0, Math.PI * 2);
    ctx.arc(5, 16, 2, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders
    ctx.fillStyle = '#0284c7'; // Blue armor
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 14, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fcd34d'; // Warm skin tone
    ctx.beginPath();
    ctx.arc(0, -6, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Helmet
    ctx.fillStyle = '#0f172a'; // Dark helmet
    ctx.beginPath();
    ctx.arc(0, -7, 8.5, Math.PI, 0); // Top half
    ctx.fill();
    
    // Visor
    ctx.fillStyle = '#38bdf8'; // Glowing visor
    ctx.beginPath();
    ctx.roundRect(-5, -6, 10, 4, 2);
    ctx.fill();

    // Hands (bobbing opposite to hover)
    const handY = Math.cos(globalTime / 150) * 2;
    ctx.fillStyle = '#0f172a'; // Gloves
    ctx.beginPath();
    ctx.arc(-16, handY + 2, 4, 0, Math.PI * 2);
    ctx.arc(16, handY + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
