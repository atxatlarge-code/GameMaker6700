export function drawRobot(ctx, entity, globalTime, isTrail = false) {
    const { x = 0, y = 0, width = 32, height = 32, facing = 'right', vx = 0, vy = 0, alpha = 1, skin = 'default', theme = 'default', isGrounded = false, scaleX = 1, scaleY = 1, tiltAngle = 0 } = entity;
    ctx.save();
    ctx.globalAlpha = isTrail ? alpha : (ctx.globalAlpha * alpha);

    ctx.translate(x + width / 2, y + height);
    ctx.scale(facing === 'left' ? -scaleX : scaleX, scaleY);
    ctx.rotate(tiltAngle);

    const time = globalTime;

    // Tracks / Wheels stay on ground
    ctx.fillStyle = '#374151'; // dark tracks
    ctx.fillRect(-width / 2 - 2, -4, 10, 4);
    ctx.fillRect(width / 2 - 8, -4, 10, 4);

    // Suspension bob for the body
    const bob = Math.sin(time * 0.005) * 1.5;
    ctx.translate(0, bob);

    // Robot Body
    ctx.fillStyle = '#9ca3af'; // light grey
    ctx.fillRect(-width / 2, -height + 4, width, height - 8);
    
    // Glowing Core
    const corePulse = (Math.sin(time * 0.003) + 1) / 2; // 0 to 1
    ctx.fillStyle = `rgba(59, 130, 246, ${0.4 + corePulse * 0.6})`; // pulsing blue
    ctx.beginPath();
    ctx.arc(0, -height / 2 + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Robot Head
    ctx.fillStyle = '#6b7280'; // darker grey
    ctx.fillRect(-width / 2 + 2, -height, width - 4, 12);

    // Antenna
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -height);
    ctx.lineTo(0, -height - 6);
    ctx.stroke();
    
    // Pulsing Red bulb
    const bulbAlpha = (Math.sin(time * 0.01) + 1) / 2; // Fast pulse
    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + bulbAlpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(0, -height - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Blink occasionally)
    const isBlinking = (time % 4000) < 150; // Blink every 4s for 150ms
    if (!isBlinking) {
      ctx.fillStyle = '#3b82f6'; // Blue glowing eyes
      ctx.fillRect(2, -height + 3, 4, 4);
      ctx.fillRect(8, -height + 3, 4, 4);
    } else {
      ctx.fillStyle = '#1e3a8a'; // Dark blue (shut)
      ctx.fillRect(2, -height + 5, 4, 2);
      ctx.fillRect(8, -height + 5, 4, 2);
    }

    ctx.restore();
  }
