export function drawBlob(ctx, entity, globalTime, isTrail = false) {
    const { x = 0, y = 0, width = 32, height = 32, facing = 'right', vx = 0, vy = 0, alpha = 1, skin = 'default', theme = 'default', isGrounded = false, scaleX = 1, scaleY = 1, tiltAngle = 0 } = entity;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Determine squish based on velocity
    const speedX = Math.abs(vx);
    const speedY = Math.abs(vy);
    const totalSpeed = Math.sqrt(speedX*speedX + speedY*speedY);
    
    // Max stretch is around 1.5
    const stretch = 1 + Math.min(totalSpeed * 0.1, 0.5);
    const squish = 1 / stretch;
    
    let blobScaleX = 1;
    let blobScaleY = 1;
    let rotation = 0;
    
    if (totalSpeed > 0.1) {
       rotation = Math.atan2(vy, vx);
       blobScaleX = stretch;
       blobScaleY = squish;
    }

    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);
    ctx.scale(blobScaleX, blobScaleY);
    
    // Wobble effect
    const time = globalTime / 200;
    const wobble1 = Math.sin(time) * 1.5;
    const wobble2 = Math.cos(time * 1.3) * 1.5;
    
    ctx.fillStyle = isTrail ? 'rgba(50, 205, 50, 0.5)' : 'rgba(50, 205, 50, 0.85)';
    
    ctx.beginPath();
    ctx.ellipse(0, 0, width/2 - 2 + wobble1, height/2 - 2 + wobble2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-width/6, -height/6, width/6, height/8, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
    
    if (!isTrail) {
      // Eyes looking towards movement
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(width/5, -5, 4, 0, Math.PI * 2);
      ctx.arc(width/5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(width/5 + 1, -5, 2, 0, Math.PI * 2);
      ctx.arc(width/5 + 1, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
