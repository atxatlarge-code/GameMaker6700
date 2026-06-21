export function drawClassicBox(ctx, entity, globalTime, isTrail = false) {
    const { x = 0, y = 0, width = 32, height = 32, facing = 'right', vx = 0, vy = 0, alpha = 1, skin = 'default', theme = 'default', isGrounded = false, scaleX = 1, scaleY = 1, tiltAngle = 0 } = entity;
    ctx.save();
    ctx.globalAlpha = isTrail ? alpha : (ctx.globalAlpha * alpha);

    // Position bottom-center
    ctx.translate(x + width / 2, y + height);
    
    // Calculate dynamic squish based on velocity if not in trail
    let dynamicScaleX = scaleX;
    let dynamicScaleY = scaleY;
    
    if (!isTrail && entity && this.mode === CONFIG.MODE_PLAY) {
      if (!entity.isGrounded) {
        const stretch = Math.min(0.2, Math.abs(entity.vy) * 0.02);
        dynamicScaleX -= stretch;
        dynamicScaleY += stretch;
      } else if (Math.abs(entity.vx) > 0.5) {
        const runSquish = Math.sin(globalTime * 0.02) * 0.05;
        dynamicScaleY -= Math.abs(runSquish);
        dynamicScaleX += Math.abs(runSquish) * 0.5;
      }
    }

    ctx.scale(facing === 'left' ? -1 : 1, 1);
    ctx.scale(dynamicScaleX, dynamicScaleY);
    ctx.rotate(tiltAngle);

    // Dynamic Theme Color
    let themeColor = '#3498db';
    if (entity.theme === 'spooky') themeColor = '#9b59b6';
    else if (entity.theme === 'butterflies') themeColor = '#e84393';
    else if (entity.theme === 'icecream') themeColor = '#00cec9';
    else if (entity.theme === '16bit') themeColor = '#e67e22';
    
    // Draw tiny stubby legs if moving and grounded
    if (!isTrail && entity) {
      let legOffset = 0;
      if (entity.isGrounded && Math.abs(entity.vx) > 0.1) {
        legOffset = Math.sin(globalTime * 0.03) * 3;
      } else if (!entity.isGrounded) {
        legOffset = entity.vy < 0 ? -2 : 1;
      }
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.roundRect(-width / 4 - 3, -4, 6, 8 + (legOffset > 0 ? legOffset : 0), 2);
      ctx.roundRect(width / 4 - 3, -4, 6, 8 - (legOffset < 0 ? legOffset : 0), 2);
      ctx.fill();
    }

    // Draw main box
    ctx.fillStyle = themeColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height, width, height, 6);
    ctx.fill();

    // Shading/Highlight & Face
    if (!isTrail) {
      // 3D Glassy Gel Shading
      const boxGrad = ctx.createLinearGradient(-width/2, -height, width/2, height);
      boxGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      boxGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      boxGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
      boxGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = boxGrad;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height, width, height, 6);
      ctx.fill();

      // Bright rim light
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-width / 2 + 2, -height + 2, width - 4, height - 4, 4);
      ctx.stroke();

      // Dark outer border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height, width, height, 6);
      ctx.stroke();

      ctx.fillStyle = '#1e1720'; 
      let lookX = 0;
      let lookY = 0;
      if (entity && this.mode === CONFIG.MODE_PLAY) {
        if (entity.vy < -1) lookY = -2;
        else if (entity.vy > 1) lookY = 2;
        if (Math.abs(entity.vx) > 1) lookX = 1;
      }
      
      let isBlinking = false;
      if (entity) {
        if (entity.blinkTimer <= 0 && Math.random() < 0.01) {
          entity.blinkTimer = 100 + Math.random() * 150;
          entity.blinkDuration = 5 + Math.random() * 5;
        } else if (entity.blinkTimer > 0) {
          entity.blinkTimer--;
          if (entity.blinkTimer < entity.blinkDuration) isBlinking = true;
        }
      }

      const eyeY = -height / 2 - 2 + lookY;
      
      if (isBlinking) {
        ctx.strokeStyle = '#1e1720';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6 + lookX, eyeY); ctx.lineTo(-2 + lookX, eyeY);
        ctx.moveTo(2 + lookX, eyeY); ctx.lineTo(6 + lookX, eyeY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(-4 + lookX, eyeY, 2.5, 0, Math.PI * 2);
        ctx.arc(4 + lookX, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5 + lookX, eyeY - 0.5, 0.8, 0, Math.PI * 2);
        ctx.arc(3.5 + lookX, eyeY - 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.strokeStyle = '#1e1720';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0 + lookX, eyeY + 4, 2, 0, Math.PI, false);
      ctx.stroke();
    }

    ctx.restore();
  }
