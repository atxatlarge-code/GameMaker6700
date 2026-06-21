export function drawForestKid(ctx, entity, globalTime, isTrail = false) {
    const { x = 0, y = 0, width = 32, height = 32, facing = 'right', vx = 0, vy = 0, alpha = 1, skin = 'default', theme = 'default', isGrounded = false, scaleX = 1, scaleY = 1, tiltAngle = 0 } = entity;
    ctx.save();
    ctx.globalAlpha = isTrail ? alpha : (ctx.globalAlpha * alpha);

    // Position bottom-center of the box
    ctx.translate(x + width / 2, y + height);
    ctx.scale(facing === 'left' ? -1 : 1, 1);

    // Breathing animation
    let breathScaleY = 1;
    let breathScaleX = 1;
    if (entity && entity.isGrounded && Math.abs(entity.vx) < 0.1 && !isTrail && alpha === 1.0) {
      const breath = Math.sin(globalTime * 0.003) * 0.03;
      breathScaleY = 1 + breath;
      breathScaleX = 1 - breath * 0.5;
    }
    ctx.scale(scaleX * breathScaleX, scaleY * breathScaleY);
    ctx.rotate(tiltAngle);

    // Color definitions
    const themeName = entity.theme || entity.theme;
    let capeColor, liningColor, faceColor, eyeColor;
    if (themeName === 'spooky') {
      capeColor = '#3d2b56'; liningColor = '#706fd3'; faceColor = '#1e1720'; eyeColor = '#00ffcc';
    } else if (themeName === 'butterflies') {
      capeColor = '#ec4899'; liningColor = '#ffd60a'; faceColor = '#fefefe'; eyeColor = '#3d2b56';
    } else if (themeName === 'icecream') {
      capeColor = '#ffb3c1'; liningColor = '#ffe5ec'; faceColor = '#fff0f5'; eyeColor = '#fb6f92';
    } else if (themeName === '16bit') {
      capeColor = '#b85c27'; liningColor = '#ffd60a'; faceColor = '#ffe57f'; eyeColor = '#1e1720';
    } else {
      capeColor = '#4a5d4e'; liningColor = '#c29b68'; faceColor = '#f5f0eb'; eyeColor = '#2b2621';
    }
    if (skin === 'ninja') {
      capeColor = '#111111'; liningColor = '#e63946'; faceColor = '#ffe0e0'; eyeColor = '#111111';
    } else if (skin === 'knight') {
      capeColor = '#a8dadc'; liningColor = '#457b9d'; faceColor = '#f1faee'; eyeColor = '#1d3557';
    } else if (skin === 'gold') {
      capeColor = '#ffb703'; liningColor = '#fb8500'; faceColor = '#fff3b0'; eyeColor = '#023047';
    } else if (skin === 'void') {
      capeColor = '#000000'; liningColor = '#ff00ff'; faceColor = '#220022'; eyeColor = '#ff00ff';
    }


    if (isTrail) {
      ctx.fillStyle = themeName === 'spooky' ? '#00ffcc' : '#c29b68';
      ctx.beginPath();
      ctx.roundRect(-10, -20, 20, 20, 6);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 12fps Hand-drawn wiggle boil effect
    const step = Math.floor(globalTime / 90);
    const w = (seed, sc = 1) => {
      if (isTrail) return 0; // Trails don't boil/wiggle to look cleaner
      return Math.sin(step * 17.3 + seed * 23.7) * 0.8 * sc;
    };

    // Draw little cute legs
    let legOffset1 = 0;
    let legOffset2 = 0;
    if (entity.isGrounded && Math.abs(entity.vx) > 0.1) {
      const cycle = (globalTime * 0.012) % (Math.PI * 2);
      legOffset1 = Math.sin(cycle) * 6;
      legOffset2 = -Math.sin(cycle) * 6;
    } else if (!entity.isGrounded) {
      if (entity.vy < 0) {
        legOffset1 = -2;
        legOffset2 = -1;
      } else {
        legOffset1 = 1;
        legOffset2 = 3;
      }
    }

    ctx.strokeStyle = '#1e1720';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-6 + w(91), -5 + w(92));
    ctx.lineTo(-6 + legOffset1 + w(93), (legOffset1 > 0 ? 0 : -2) + w(94));
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(6 + w(95), -5 + w(96));
    ctx.lineTo(6 + legOffset2 + w(97), (legOffset2 > 0 ? 0 : -2) + w(98));
    ctx.stroke();

    // Satchel Bag (bouncing slightly offset from the body)
    if (!isTrail && entity) {
      ctx.fillStyle = '#6e4b3a'; // brown leather
      ctx.strokeStyle = '#1e1720';
      ctx.lineWidth = 2.5;
      
      const bounce = entity.isGrounded && Math.abs(entity.vx) > 0.1 ? Math.sin(globalTime * 0.015) * 2 : 0;
      const jumpFloat = !entity.isGrounded ? (entity.vy < 0 ? 3 : -3) : 0;
      
      ctx.beginPath();
      ctx.roundRect(-2 + w(101), -18 + bounce + jumpFloat + w(102), 10, 8, 2);
      ctx.fill();
      ctx.stroke();
      
      // Satchel strap
      ctx.beginPath();
      ctx.moveTo(-2 + w(101), -15 + bounce + jumpFloat + w(103));
      ctx.lineTo(-6 + w(104), -22 + w(105));
      ctx.stroke();
    }

    // Cape / Cloak (flowing to the left)
    ctx.fillStyle = capeColor;
    ctx.strokeStyle = '#1e1720';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0 + w(3), -height + 14 + w(4)); // Neck attachment
    
    // Wind drag pulling cloak back & Falling hood
    const runPull = entity ? Math.min(12, Math.abs(entity.vx) * 2.2) : 0;
    const fallUp = (entity && !entity.isGrounded && entity.vy > 2) ? -Math.min(10, entity.vy * 1.2) : 0;

    const cpx1 = -12 - runPull + w(5);
    const cpy1 = -height / 2 + w(6) + fallUp;
    const cpx2 = -20 - runPull + w(7);
    const cpy2 = -6 + w(8) + fallUp;
    
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, -18 - runPull + w(9), -2 + fallUp * 0.5 + w(10));
    ctx.lineTo(-4 + w(11), -4 + w(12));
    ctx.quadraticCurveTo(-2 + w(13), -height / 2 + w(14), 0 + w(15), -height + 14 + w(16));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Main Hood
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(-10 + w(17), -18 + w(18));
    ctx.quadraticCurveTo(-16 + w(19), -height + 8 + w(20), -7 + w(21), -height + w(22)); // cute cap tip
    ctx.quadraticCurveTo(0 + w(23), -height - 3 + w(24), 10 + w(25), -height + 4 + w(26)); // crown
    ctx.quadraticCurveTo(16 + w(27), -height + 16 + w(28), 12 + w(29), -14 + w(30)); // face opening
    ctx.quadraticCurveTo(8 + w(31), -4 + w(32), 0 + w(33), -4 + w(34)); // base
    ctx.quadraticCurveTo(-10 + w(35), -6 + w(36), -10 + w(37), -18 + w(38));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hood Opening / Lining
    ctx.fillStyle = liningColor;
    ctx.beginPath();
    ctx.moveTo(11 + w(49), -height + 14 + w(50));
    ctx.bezierCurveTo(15 + w(51), -height + 22 + w(52), 8 + w(53), -6 + w(54), 1 + w(55), -10 + w(56));
    ctx.bezierCurveTo(-4 + w(57), -14 + w(58), 2 + w(59), -height + 6 + w(60), 11 + w(61), -height + 14 + w(62));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Face Mask (cute round circle inside the lining)
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(6 + w(39), -height + 22 + w(40), 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Blinking Eyes
    let isBlinking = false;
    if (!isTrail) {
      if (entity.blinkTimer <= 0) {
        if (Math.random() < 0.012) {
          entity.blinkTimer = 110 + Math.random() * 190;
          entity.blinkDuration = 6 + Math.random() * 6;
        }
      } else {
        entity.blinkTimer--;
        if (entity.blinkTimer < entity.blinkDuration) {
          isBlinking = true;
        }
      }
    }

    if (isBlinking) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Right Eye closed
      ctx.moveTo(3.5 + w(71), -height + 22 + w(72));
      ctx.lineTo(6.5 + w(73), -height + 22 + w(74));
      // Left Eye closed
      ctx.moveTo(7.5 + w(75), -height + 22 + w(76));
      ctx.lineTo(10.5 + w(77), -height + 22 + w(78));
      ctx.stroke();
    } else {
      // Look direction
      let lookX = 0.6;
      let lookY = 0;
      if (entity.vy < -1.5) lookY = -0.6;
      else if (entity.vy > 1.5) lookY = 0.6;

      // Draw Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.2 + w(79), -height + 22 + w(80), 2.2, 0, Math.PI * 2);
      ctx.arc(8.2 + w(81), -height + 22 + w(82), 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Irises
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(4.2 + lookX + w(83), -height + 22 + lookY + w(84), 1.2, 0, Math.PI * 2);
      ctx.arc(8.2 + lookX + w(85), -height + 22 + lookY + w(86), 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Ghibli catchlight shines
      if (!isTrail) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4.2 + lookX - 0.4, -height + 22 + lookY - 0.4, 0.45, 0, Math.PI * 2);
        ctx.arc(8.2 + lookX - 0.4, -height + 22 + lookY - 0.4, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
